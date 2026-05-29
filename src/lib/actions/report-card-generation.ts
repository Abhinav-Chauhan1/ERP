/**
 * Report Card Generation Actions
 * 
 * Server actions for generating report cards:
 * - Single report card generation
 * - Batch report card generation
 * - PDF storage and URL management
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

'use server';

import { db } from '@/lib/db';
import { auth } from "@/auth";
import { requireSchoolAccess } from '@/lib/auth/tenant';
import { logAuditEvent } from '@/lib/services/audit-service';
import { revalidatePath } from 'next/cache';
import {
  generateTermReportCardPDF,
  generateBatchTermReportCardsPDF,
} from '@/lib/services/report-card-term-renderer';
import {
  aggregateReportCardData,
  batchAggregateReportCardData,
  aggregateExamTypeReportCardData,
  batchAggregateExamTypeReportCardData,
} from '@/lib/services/report-card-data-aggregation';
import { uploadHandler } from '@/lib/services/upload-handler';

/**
 * Action result interface
 */
interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generate report card for a single student
 * 
 * @param studentId - Student ID
 * @param termId - Term ID
 * @param templateId - Template ID to use
 * @returns Action result with PDF URL
 */
export async function generateSingleReportCard(
  studentId: string,
  termId: string,
  _templateId?: string,
): Promise<ActionResult<{ pdfUrl: string; reportCardId: string; pdfBase64: string }>> {
  try {
    // Verify authentication and get school context from session (not userSchools[0])
    const context = await requireSchoolAccess();
    const schoolId = context.schoolId;
    const userId = context.userId;

    if (!schoolId) {
      return { success: false, error: 'School context required' };
    }

    // Verify user has permission (admin or teacher)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Resolve academicYearId from term
    const term = await db.term.findUnique({
      where: { id: termId },
      select: { academicYearId: true },
    });
    const academicYearId = term?.academicYearId;

    // Aggregate report card data
    const reportCardData = await aggregateReportCardData(studentId, termId);

    // Fetch school information for branding
    const schoolInfo = await getSchoolInfo(schoolId);

    // Generate PDF using standalone renderer (no template required)
    const pdfBuffer = await generateTermReportCardPDF(reportCardData, {
      schoolName: schoolInfo.name,
      schoolAddress: schoolInfo.address,
      schoolPhone: schoolInfo.phone,
      schoolEmail: schoolInfo.email,
      schoolLogo: schoolInfo.logo,
    });

    // Upload PDF to R2 storage
    const pdfUrl = await uploadPDFToStorage(pdfBuffer, `report-card-${studentId}-${termId}`);

    // Update or create term-based report card (examTypeId IS NULL)
    const existingTermCard = await db.reportCard.findFirst({
      where: { studentId, termId, examTypeId: null },
      select: { id: true },
    });

    let reportCard: { id: string };
    if (existingTermCard) {
      reportCard = await db.reportCard.update({
        where: { id: existingTermCard.id },
        data: { pdfUrl, updatedAt: new Date() },
        select: { id: true },
      });
    } else {
      reportCard = await db.reportCard.create({
        data: {
          studentId,
          termId,
          academicYearId,
          pdfUrl,
          schoolId: schoolId,
          totalMarks: reportCardData.overallPerformance.obtainedMarks,
          averageMarks: reportCardData.overallPerformance.obtainedMarks / Math.max(reportCardData.subjects.filter(s => !s.isAbsent).length, 1),
          percentage: reportCardData.overallPerformance.percentage,
          grade: reportCardData.overallPerformance.grade,
          rank: reportCardData.overallPerformance.rank,
          attendance: reportCardData.attendance.percentage,
          coScholasticData: reportCardData.coScholastic as any,
          teacherRemarks: reportCardData.remarks.teacherRemarks,
          principalRemarks: reportCardData.remarks.principalRemarks,
        },
        select: { id: true },
      });
    }

    await logAuditEvent({
      userId,
      action: 'CREATE',
      resource: 'REPORT_CARD',
      resourceId: reportCard.id,
      changes: { studentId, termId, pdfUrl },
    });

    revalidatePath('/admin/report-cards');
    return {
      success: true,
      data: {
        pdfUrl,
        reportCardId: reportCard.id,
        pdfBase64: pdfBuffer.toString('base64'),
      },
    };
  } catch (error) {
    console.error('Error generating single report card:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate report cards for entire class
 * 
 * @param classId - Class ID
 * @param sectionId - Section ID
 * @param termId - Term ID
 * @param templateId - Template ID to use
 * @returns Action result with batch PDF URL
 */
export async function generateBatchReportCards(
  classId: string,
  sectionId: string,
  termId: string,
  _templateId?: string,
): Promise<ActionResult<{ pdfUrl: string; totalGenerated: number }>> {
  try {
    // Verify authentication and get school context from session (not userSchools[0])
    const batchContext = await requireSchoolAccess();
    const schoolId = batchContext.schoolId;
    const userId = batchContext.userId;

    if (!schoolId) {
      return { success: false, error: 'School context required' };
    }

    // Verify user has permission (admin or teacher)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Fetch all students in the class and section
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId,
        sectionId,
        status: 'ACTIVE',
        schoolId: schoolId, // Add school isolation
      },
      select: {
        studentId: true,
      },
    });

    if (enrollments.length === 0) {
      return { success: false, error: 'No students found in the specified class and section' };
    }

    const studentIds = enrollments.map(e => e.studentId);

    // Batch aggregate report card data for all students
    const reportCardsData = await batchAggregateReportCardData(studentIds, termId);

    // Fetch school information for branding
    const schoolInfo = await getSchoolInfo(schoolId);

    // Generate batch PDF using standalone renderer
    const batchPdfBuffer = await generateBatchTermReportCardsPDF(reportCardsData, {
      schoolName: schoolInfo.name,
      schoolAddress: schoolInfo.address,
      schoolPhone: schoolInfo.phone,
      schoolEmail: schoolInfo.email,
      schoolLogo: schoolInfo.logo,
    });

    // Upload batch PDF to R2 storage
    const pdfUrl = await uploadPDFToStorage(
      batchPdfBuffer,
      `report-cards-batch-${classId}-${sectionId}-${termId}`
    );

    // Resolve academicYearId from term
    const batchTerm = await db.term.findUnique({
      where: { id: termId },
      select: { academicYearId: true },
    });
    const batchAcademicYearId = batchTerm?.academicYearId;

    // Update or create term-based report card records for all students
    const updatePromises = reportCardsData.map(async (data) => {
      const existing = await db.reportCard.findFirst({
        where: { studentId: data.student.id, termId, examTypeId: null },
        select: { id: true },
      });
      if (existing) {
        return db.reportCard.update({
          where: { id: existing.id },
          data: { pdfUrl, updatedAt: new Date() },
        });
      }
      return db.reportCard.create({
        data: {
          studentId: data.student.id,
          termId,
          academicYearId: batchAcademicYearId,
          pdfUrl,
          schoolId: schoolId,
          totalMarks: data.overallPerformance.obtainedMarks,
          averageMarks: data.overallPerformance.obtainedMarks / Math.max(data.subjects.filter(s => !s.isAbsent).length, 1),
          percentage: data.overallPerformance.percentage,
          grade: data.overallPerformance.grade,
          rank: data.overallPerformance.rank,
          attendance: data.attendance.percentage,
          coScholasticData: data.coScholastic as any,
          teacherRemarks: data.remarks.teacherRemarks,
          principalRemarks: data.remarks.principalRemarks,
        },
      });
    });

    await Promise.all(updatePromises);

    revalidatePath('/admin/report-cards');
    return {
      success: true,
      data: {
        pdfUrl,
        totalGenerated: reportCardsData.length,
      },
    };
  } catch (error) {
    console.error('Error generating batch report cards:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate report cards as individual PDFs in a ZIP file
 * Returns base64 data for direct browser download (avoids R2 auth issues)
 * 
 * @param classId - Class ID
 * @param sectionId - Section ID
 * @param termId - Term ID
 * @param templateId - Template ID to use
 * @returns Action result with ZIP file as base64 data
 */
export async function generateBatchReportCardsZip(
  classId: string,
  sectionId: string,
  termId: string,
  _templateId?: string,
): Promise<ActionResult<{ zipData: string; zipFilename: string; totalGenerated: number; fileList: string[] }>> {
  try {
    // Verify authentication
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify user has permission (admin or teacher)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Get school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Fetch class and section info for naming
    const classInfo = await db.class.findUnique({
      where: { id: classId },
      select: { name: true },
    });

    const sectionInfo = await db.classSection.findUnique({
      where: { id: sectionId },
      select: { name: true },
    });

    // Fetch all students in the class and section
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId,
        sectionId,
        status: 'ACTIVE',
        schoolId,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return { success: false, error: 'No students found in the specified class and section' };
    }

    // Fetch school information for branding
    const schoolInfo = await getSchoolInfo(schoolId);

    // Generate individual PDFs
    const pdfPromises = enrollments.map(async (enrollment) => {
      const studentId = enrollment.studentId;
      const student = enrollment.student;

      // Aggregate report card data
      const reportCardData = await aggregateReportCardData(studentId, termId);

      // Generate PDF using standalone renderer
      const pdfBuf = await generateTermReportCardPDF(reportCardData, {
        schoolName: schoolInfo.name,
        schoolAddress: schoolInfo.address,
        schoolPhone: schoolInfo.phone,
        schoolEmail: schoolInfo.email,
        schoolLogo: schoolInfo.logo,
      });

      // Create filename from student info
      const rollNo = student.rollNumber || 'NoRoll';
      const studentName = `${student.user.firstName}_${student.user.lastName}`.replace(/\s+/g, '_');
      const filename = `${rollNo}_${studentName}.pdf`;

      return {
        filename,
        buffer: pdfBuf,
        studentId,
        reportCardData,
      };
    });

    const pdfResults = await Promise.all(pdfPromises);
    const validPdfs = pdfResults.filter((r): r is NonNullable<typeof r> => r !== null);

    if (validPdfs.length === 0) {
      return { success: false, error: 'Failed to generate any PDFs' };
    }

    // Create ZIP file using JSZip
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Add each PDF to the ZIP
    const fileList: string[] = [];
    for (const pdf of validPdfs) {
      zip.file(pdf.filename, pdf.buffer);
      fileList.push(pdf.filename);
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Generate filename for download
    const className = classInfo?.name?.replace(/\s+/g, '-') || classId;
    const sectionName = sectionInfo?.name?.replace(/\s+/g, '-') || sectionId;
    const zipFilename = `ReportCards_${className}_${sectionName}_${new Date().toISOString().split('T')[0]}.zip`;

    // Convert ZIP buffer to base64 for direct browser download
    const zipData = zipBuffer.toString('base64');

    // Resolve academicYearId from term
    const zipTerm = await db.term.findUnique({
      where: { id: termId },
      select: { academicYearId: true },
    });
    const zipAcademicYearId = zipTerm?.academicYearId;

    // Update or create term-based report card records for all students
    const updatePromises = validPdfs.map(async (pdf) => {
      const existing = await db.reportCard.findFirst({
        where: { studentId: pdf.studentId, termId, examTypeId: null },
        select: { id: true },
      });
      if (existing) {
        return db.reportCard.update({
          where: { id: existing.id },
          data: { updatedAt: new Date() },
        });
      }
      return db.reportCard.create({
        data: {
          studentId: pdf.studentId,
          termId,
          academicYearId: zipAcademicYearId,
          schoolId: schoolId,
          totalMarks: pdf.reportCardData.overallPerformance.obtainedMarks,
          averageMarks: pdf.reportCardData.overallPerformance.obtainedMarks / Math.max(pdf.reportCardData.subjects.filter(s => !s.isAbsent).length, 1),
          percentage: pdf.reportCardData.overallPerformance.percentage,
          grade: pdf.reportCardData.overallPerformance.grade,
          rank: pdf.reportCardData.overallPerformance.rank,
          attendance: pdf.reportCardData.attendance.percentage,
          coScholasticData: pdf.reportCardData.coScholastic as any,
          teacherRemarks: pdf.reportCardData.remarks.teacherRemarks,
          principalRemarks: pdf.reportCardData.remarks.principalRemarks,
        },
      });
    });

    await Promise.all(updatePromises);

    revalidatePath('/admin/report-cards');
    return {
      success: true,
      data: {
        zipData,
        zipFilename,
        totalGenerated: validPdfs.length,
        fileList,
      },
    };
  } catch (error) {
    console.error('Error generating batch report cards ZIP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}



/**
 * Generate report card for a single student scoped to one exam type
 */
export async function generateSingleExamTypeReportCard(
  studentId: string,
  termId: string,
  examTypeId: string,
  _templateId?: string,
): Promise<ActionResult<{ pdfUrl: string; reportCardId: string; pdfBase64: string }>> {
  try {
    const context = await requireSchoolAccess();
    const schoolId = context.schoolId;
    const userId = context.userId;
    if (!schoolId) return { success: false, error: 'School context required' };

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const reportCardData = await aggregateExamTypeReportCardData(studentId, termId, examTypeId);
    const schoolInfo = await getSchoolInfo(schoolId);

    // Fetch exam type name to show in report label
    const examTypeInfo = await db.examType.findUnique({ where: { id: examTypeId }, select: { name: true } });
    const reportLabel = examTypeInfo
      ? buildExamTypeLabel(examTypeInfo.name, reportCardData.term.name)
      : undefined;

    const pdfBuffer = await generateTermReportCardPDF(reportCardData, {
      schoolName: schoolInfo.name,
      schoolAddress: schoolInfo.address,
      schoolPhone: schoolInfo.phone,
      schoolEmail: schoolInfo.email,
      schoolLogo: schoolInfo.logo,
      reportLabel,
    });

    const pdfUrl = await uploadPDFToStorage(pdfBuffer, `report-card-${studentId}-${termId}-${examTypeId}`);

    const existing = await db.reportCard.findFirst({
      where: { studentId, termId, examTypeId },
      select: { id: true },
    });

    let reportCard: { id: string };
    if (existing) {
      reportCard = await db.reportCard.update({
        where: { id: existing.id },
        data: { pdfUrl, updatedAt: new Date() },
        select: { id: true },
      });
    } else {
      const term = await db.term.findUnique({ where: { id: termId }, select: { academicYearId: true } });
      reportCard = await db.reportCard.create({
        data: {
          studentId,
          termId,
          examTypeId,
          academicYearId: term?.academicYearId,
          pdfUrl,
          schoolId,
          totalMarks: reportCardData.overallPerformance.obtainedMarks,
          averageMarks: reportCardData.overallPerformance.obtainedMarks / Math.max(reportCardData.subjects.filter(s => !s.isAbsent).length, 1),
          percentage: reportCardData.overallPerformance.percentage,
          grade: reportCardData.overallPerformance.grade,
          rank: reportCardData.overallPerformance.rank,
          attendance: reportCardData.attendance.percentage,
          coScholasticData: reportCardData.coScholastic as any,
          teacherRemarks: reportCardData.remarks.teacherRemarks,
          principalRemarks: reportCardData.remarks.principalRemarks,
        },
        select: { id: true },
      });
    }

    await logAuditEvent({
      userId,
      action: 'CREATE',
      resource: 'REPORT_CARD',
      resourceId: reportCard.id,
      changes: { studentId, termId, examTypeId, pdfUrl },
    });

    revalidatePath('/admin/report-cards');
    return { success: true, data: { pdfUrl, reportCardId: reportCard.id, pdfBase64: pdfBuffer.toString('base64') } };
  } catch (error) {
    console.error('Error generating exam-type report card:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Generate exam-type report cards for an entire class as a ZIP download
 */
export async function generateBatchExamTypeReportCardsZip(
  classId: string,
  sectionId: string,
  termId: string,
  examTypeId: string,
  _templateId?: string,
): Promise<ActionResult<{ zipData: string; zipFilename: string; totalGenerated: number; fileList: string[] }>> {
  try {
    const context = await requireSchoolAccess();
    const schoolId = context.schoolId;
    const userId = context.userId;
    if (!schoolId) return { success: false, error: 'School context required' };

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const classInfo = await db.class.findUnique({ where: { id: classId }, select: { name: true } });
    const sectionInfo = await db.classSection.findUnique({ where: { id: sectionId }, select: { name: true } });
    const examTypeInfo = await db.examType.findUnique({ where: { id: examTypeId }, select: { name: true } });

    const enrollments = await db.classEnrollment.findMany({
      where: { classId, sectionId, status: 'ACTIVE', schoolId },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (enrollments.length === 0) {
      return { success: false, error: 'No students found in the specified class and section' };
    }

    const schoolInfo = await getSchoolInfo(schoolId);

    const pdfPromises = enrollments.map(async (enrollment) => {
      const studentId = enrollment.studentId;
      const student = enrollment.student;
      try {
        const reportCardData = await aggregateExamTypeReportCardData(studentId, termId, examTypeId);
        const label = examTypeInfo
          ? buildExamTypeLabel(examTypeInfo.name, reportCardData.term.name)
          : undefined;
        const pdfBuf = await generateTermReportCardPDF(reportCardData, {
          schoolName: schoolInfo.name,
          schoolAddress: schoolInfo.address,
          schoolPhone: schoolInfo.phone,
          schoolEmail: schoolInfo.email,
          schoolLogo: schoolInfo.logo,
          reportLabel: label,
        });

        const rollNo = student.rollNumber || 'NoRoll';
        const studentName = `${student.user.firstName}_${student.user.lastName}`.replace(/\s+/g, '_');
        return {
          filename: `${rollNo}_${studentName}.pdf`,
          buffer: pdfBuf,
          studentId,
          reportCardData,
        };
      } catch {
        return null;
      }
    });

    const pdfResults = await Promise.all(pdfPromises);
    const validPdfs = pdfResults.filter((r): r is NonNullable<typeof r> => r !== null);

    if (validPdfs.length === 0) {
      return { success: false, error: 'Failed to generate any PDFs' };
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const fileList: string[] = [];
    for (const pdf of validPdfs) {
      zip.file(pdf.filename, pdf.buffer);
      fileList.push(pdf.filename);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const className = classInfo?.name?.replace(/\s+/g, '-') || classId;
    const sectionName = sectionInfo?.name?.replace(/\s+/g, '-') || sectionId;
    const examTypeName = examTypeInfo?.name?.replace(/\s+/g, '-') || examTypeId;
    const zipFilename = `ReportCards_${className}_${sectionName}_${examTypeName}_${new Date().toISOString().split('T')[0]}.zip`;
    const zipData = zipBuffer.toString('base64');

    const term = await db.term.findUnique({ where: { id: termId }, select: { academicYearId: true } });
    const academicYearId = term?.academicYearId;

    await Promise.all(
      validPdfs.map(async (pdf) => {
        const existing = await db.reportCard.findFirst({
          where: { studentId: pdf.studentId, termId, examTypeId },
          select: { id: true },
        });
        if (existing) {
          return db.reportCard.update({
            where: { id: existing.id },
            data: { updatedAt: new Date() },
          });
        }
        return db.reportCard.create({
          data: {
            studentId: pdf.studentId,
            termId,
            examTypeId,
            academicYearId,
            schoolId,
            totalMarks: pdf.reportCardData.overallPerformance.obtainedMarks,
            averageMarks: pdf.reportCardData.overallPerformance.obtainedMarks / Math.max(pdf.reportCardData.subjects.filter(s => !s.isAbsent).length, 1),
            percentage: pdf.reportCardData.overallPerformance.percentage,
            grade: pdf.reportCardData.overallPerformance.grade,
            rank: pdf.reportCardData.overallPerformance.rank,
            attendance: pdf.reportCardData.attendance.percentage,
            coScholasticData: pdf.reportCardData.coScholastic as any,
            teacherRemarks: pdf.reportCardData.remarks.teacherRemarks,
            principalRemarks: pdf.reportCardData.remarks.principalRemarks,
          },
        });
      }),
    );

    revalidatePath('/admin/report-cards');
    return { success: true, data: { zipData, zipFilename, totalGenerated: validPdfs.length, fileList } };
  } catch (error) {
    console.error('Error generating batch exam-type report cards ZIP:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Preview report card data without generating PDF
 *
 * @param studentId - Student ID
 * @param termId - Term ID
 * @returns Report card data for preview
 */
export async function previewReportCard(
  studentId: string,
  termId: string
): Promise<ActionResult> {
  try {
    // Verify authentication
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Aggregate report card data
    const reportCardData = await aggregateReportCardData(studentId, termId);

    return {
      success: true,
      data: reportCardData,
    };
  } catch (error) {
    console.error('Error previewing report card:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload PDF to storage (R2)
 * Integrated with R2 storage service
 */
async function uploadPDFToStorage(pdfBuffer: Buffer, filename: string): Promise<string> {
  try {
    // Create a File-like object from the buffer
    const file = new File([new Uint8Array(pdfBuffer)], filename, {
      type: 'application/pdf'
    });

    const uploadResult = await uploadHandler.uploadDocument(file, {
      folder: 'report-cards',
      category: 'document',
      customMetadata: {
        documentType: 'report-card',
        uploadType: 'generated-report-card'
      }
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload report card PDF');
    }

    return uploadResult.url!;
  } catch (error) {
    console.error('Error uploading PDF to storage:', error);
    throw new Error('Failed to upload PDF to storage');
  }
}

/**
 * Upload ZIP file to storage (R2)
 * Integrated with R2 storage service
 */
async function uploadZIPToStorage(zipBuffer: Buffer, filename: string): Promise<string> {
  try {
    // Create a File-like object from the buffer
    const file = new File([new Uint8Array(zipBuffer)], filename, {
      type: 'application/zip'
    });

    const uploadResult = await uploadHandler.uploadDocument(file, {
      folder: 'report-cards',
      category: 'document',
      customMetadata: {
        documentType: 'report-card-batch',
        uploadType: 'batch-report-cards'
      }
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload report cards ZIP');
    }

    return uploadResult.url!;
  } catch (error) {
    console.error('Error uploading ZIP to storage:', error);
    throw new Error('Failed to upload ZIP to storage');
  }
}

/**
 * Extracts the R2 object key from a stored logo URL.
 * Handles both the proxy format (/api/r2/image?key=...) and legacy pub-*.r2.dev URLs.
 */
function extractR2Key(url: string): string | null {
  // Proxy URL: /api/r2/image?key=<encoded-key>
  if (url.includes('/api/r2/image')) {
    try {
      const u = new URL(url, 'http://localhost');
      return u.searchParams.get('key');
    } catch { return null; }
  }
  // Legacy public URL: https://pub-*.r2.dev/<key>
  try {
    const u = new URL(url);
    if (u.hostname.match(/^pub-[^.]+\.r2\.dev$/)) {
      return u.pathname.replace(/^\//, '');
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Fetches a school logo and returns it as a base64 data URI suitable for jsPDF.
 * For R2 objects (private bucket), reads via S3 SDK directly instead of HTTP.
 * Falls back to a plain HTTP fetch for non-R2 URLs (e.g. external CDN logos).
 */
/**
 * Builds the report card title-bar label for exam-type cards.
 * Produces "ExamType - TermName" without the redundant "Report Card" suffix
 * and without the exam type being repeated in the term name portion.
 *
 * e.g. examTypeName="Periodic Test", combinedTermName="Half Yearly — Periodic Test"
 * → "Periodic Test - Half Yearly"
 */
function buildExamTypeLabel(examTypeName: string, combinedTermName: string): string {
  // combinedTermName is built as `${term.name} — ${examType.name}` in the aggregation layer
  const plainTermName = combinedTermName
    .replace(new RegExp(`\\s*[—–-]+\\s*${examTypeName}\\s*$`, 'i'), '')
    .trim();
  return `${examTypeName} - ${plainTermName}`;
}

export async function fetchLogoAsBase64ForReport(url: string): Promise<string | null> {
  return fetchLogoAsBase64(url);
}

async function fetchLogoAsBase64(url: string): Promise<string | null> {
  if (!url || url.startsWith('data:')) return url;

  const key = extractR2Key(url);
  if (key) {
    // Fetch directly from R2 via S3 SDK — no auth header needed
    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const accountId      = process.env.R2_ACCOUNT_ID;
      const accessKeyId    = process.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      const bucketName     = process.env.R2_BUCKET_NAME;
      if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) return null;

      const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      const res = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
      const chunks: Uint8Array[] = [];
      for await (const chunk of res.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      const ct  = res.ContentType || 'image/png';
      return `data:${ct};base64,${buf.toString('base64')}`;
    } catch (err) {
      console.error('Failed to fetch R2 logo for report card:', err);
      return null;
    }
  }

  // Non-R2 URL — resolve to absolute and fetch via HTTP
  let absUrl = url;
  if (!url.startsWith('http')) {
    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '';
    absUrl = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  try {
    const res = await fetch(absUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const ct  = res.headers.get('content-type') || 'image/png';
    return `data:${ct};base64,${Buffer.from(buf).toString('base64')}`;
  } catch { return null; }
}

/**
 * Get school information for PDF branding — fetches name, address, logo, phone, email.
 */
async function getSchoolInfo(schoolId: string): Promise<{
  name: string;
  address: string;
  phone?: string;
  email?: string;
  logo?: string;
}> {
  try {
    const [school, schoolSettings] = await Promise.all([
      db.school.findUnique({
        where: { id: schoolId },
        select: { name: true, address: true, phone: true, email: true, logo: true },
      }),
      db.schoolSettings.findFirst({
        where: { schoolId },
        select: { schoolName: true, schoolAddress: true, schoolPhone: true, schoolEmail: true, schoolLogo: true },
      }),
    ]);

    const name    = school?.name    || schoolSettings?.schoolName    || 'School Name';
    const address = school?.address || schoolSettings?.schoolAddress || '';
    const phone   = school?.phone   || schoolSettings?.schoolPhone   || undefined;
    const email   = school?.email   || schoolSettings?.schoolEmail   || undefined;

    let logo = school?.logo || schoolSettings?.schoolLogo || undefined;
    if (logo) {
      logo = await fetchLogoAsBase64(logo) ?? undefined;
    }

    return { name, address, phone, email, logo };
  } catch (error) {
    console.error('Error fetching school info for report card:', error);
    return { name: 'School Name', address: '' };
  }
}
