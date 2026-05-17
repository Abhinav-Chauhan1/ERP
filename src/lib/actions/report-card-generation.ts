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
import {
  generateReportCardPDF,
  generateBatchReportCardsPDF
} from '@/lib/services/report-card-pdf-generation';
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
): Promise<ActionResult<{ pdfUrl: string; reportCardId: string }>> {
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

    const templateId = await resolveTemplateId(schoolId);

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

    // Generate PDF
    const pdfResult = await generateReportCardPDF({
      templateId,
      data: reportCardData,
      schoolName: schoolInfo.name,
      schoolAddress: schoolInfo.address,
    });

    if (!pdfResult.success || !pdfResult.pdfBuffer) {
      return { success: false, error: pdfResult.error || 'Failed to generate PDF' };
    }

    // Upload PDF to R2 storage
    const pdfUrl = await uploadPDFToStorage(
      pdfResult.pdfBuffer,
      `report-card-${studentId}-${termId}`
    );

    // Update or create term-based report card (examTypeId IS NULL)
    const existingTermCard = await db.reportCard.findFirst({
      where: { studentId, termId, examTypeId: null },
      select: { id: true },
    });

    let reportCard: { id: string };
    if (existingTermCard) {
      reportCard = await db.reportCard.update({
        where: { id: existingTermCard.id },
        data: { templateId, pdfUrl, updatedAt: new Date() },
        select: { id: true },
      });
    } else {
      reportCard = await db.reportCard.create({
        data: {
          studentId,
          termId,
          academicYearId,
          templateId,
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
      changes: { studentId, termId, templateId, pdfUrl },
    });

    return {
      success: true,
      data: {
        pdfUrl,
        reportCardId: reportCard.id,
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

    const templateId = await resolveTemplateId(schoolId);

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

    // Generate batch PDF
    const pdfResult = await generateBatchReportCardsPDF(
      templateId,
      reportCardsData,
      {
        schoolName: schoolInfo.name,
        schoolAddress: schoolInfo.address,
      }
    );

    if (!pdfResult.success || !pdfResult.pdfBuffer) {
      return { success: false, error: pdfResult.error || 'Failed to generate batch PDF' };
    }

    // Upload batch PDF to R2 storage
    const pdfUrl = await uploadPDFToStorage(
      pdfResult.pdfBuffer,
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
          data: { templateId, pdfUrl, updatedAt: new Date() },
        });
      }
      return db.reportCard.create({
        data: {
          studentId: data.student.id,
          termId,
          academicYearId: batchAcademicYearId,
          templateId,
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
    const templateId = await resolveTemplateId(schoolId);

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

      // Generate PDF
      const pdfResult = await generateReportCardPDF({
        templateId,
        data: reportCardData,
        schoolName: schoolInfo.name,
        schoolAddress: schoolInfo.address,
      });

      if (!pdfResult.success || !pdfResult.pdfBuffer) {
        console.error(`Failed to generate PDF for student ${studentId}`);
        return null;
      }

      // Create filename from student info
      const rollNo = student.rollNumber || 'NoRoll';
      const studentName = `${student.user.firstName}_${student.user.lastName}`.replace(/\s+/g, '_');
      const filename = `${rollNo}_${studentName}.pdf`;

      return {
        filename,
        buffer: pdfResult.pdfBuffer,
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
          data: { templateId, updatedAt: new Date() },
        });
      }
      return db.reportCard.create({
        data: {
          studentId: pdf.studentId,
          termId,
          academicYearId: zipAcademicYearId,
          templateId,
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
): Promise<ActionResult<{ pdfUrl: string; reportCardId: string }>> {
  try {
    const context = await requireSchoolAccess();
    const schoolId = context.schoolId;
    const userId = context.userId;
    if (!schoolId) return { success: false, error: 'School context required' };

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const templateId = await resolveTemplateId(schoolId);
    const reportCardData = await aggregateExamTypeReportCardData(studentId, termId, examTypeId);
    const schoolInfo = await getSchoolInfo(schoolId);

    const pdfResult = await generateReportCardPDF({
      templateId,
      data: reportCardData,
      schoolName: schoolInfo.name,
      schoolAddress: schoolInfo.address,
    });

    if (!pdfResult.success || !pdfResult.pdfBuffer) {
      return { success: false, error: pdfResult.error || 'Failed to generate PDF' };
    }

    const pdfUrl = await uploadPDFToStorage(
      pdfResult.pdfBuffer,
      `report-card-${studentId}-${termId}-${examTypeId}`,
    );

    // Use findFirst + create/update since partial unique index can't be used with upsert
    const existing = await db.reportCard.findFirst({
      where: { studentId, termId, examTypeId },
      select: { id: true },
    });

    let reportCard: { id: string };
    if (existing) {
      reportCard = await db.reportCard.update({
        where: { id: existing.id },
        data: { templateId, pdfUrl, updatedAt: new Date() },
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
          templateId,
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
      changes: { studentId, termId, examTypeId, templateId, pdfUrl },
    });

    return { success: true, data: { pdfUrl, reportCardId: reportCard.id } };
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

    const templateId = await resolveTemplateId(schoolId);
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
        const pdfResult = await generateReportCardPDF({
          templateId,
          data: reportCardData,
          schoolName: schoolInfo.name,
          schoolAddress: schoolInfo.address,
        });
        if (!pdfResult.success || !pdfResult.pdfBuffer) return null;

        const rollNo = student.rollNumber || 'NoRoll';
        const studentName = `${student.user.firstName}_${student.user.lastName}`.replace(/\s+/g, '_');
        return {
          filename: `${rollNo}_${studentName}.pdf`,
          buffer: pdfResult.pdfBuffer,
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
            data: { templateId, updatedAt: new Date() },
          });
        }
        return db.reportCard.create({
          data: {
            studentId: pdf.studentId,
            termId,
            examTypeId,
            academicYearId,
            templateId,
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
 * Resolve the default template for a school.
 * Prefers the template marked isDefault, falls back to any active template.
 */
async function resolveTemplateId(schoolId: string): Promise<string> {
  const template = await db.reportCardTemplate.findFirst({
    where: { schoolId, isDefault: true, isActive: true },
    select: { id: true },
  });
  if (template) return template.id;
  const fallback = await db.reportCardTemplate.findFirst({
    where: { schoolId, isActive: true },
    select: { id: true },
  });
  if (!fallback) throw new Error('No active report card template configured for this school');
  return fallback.id;
}

/**
 * Get school information for branding
 */
async function getSchoolInfo(schoolId: string): Promise<{ name: string; address: string }> {
  // Fetch from SystemSettings
  try {
    const { getSystemSettings } = await import('@/lib/actions/settingsActions');
    const result = await getSystemSettings();

    if (result.success && result.data) {
      return {
        name: result.data.schoolName,
        address: result.data.schoolAddress || 'School Address', // Fallback if address is missing
      };
    }
  } catch (error) {
    console.error('Error fetching school info for report card:', error);
  }

  // Fallback default values
  return {
    name: 'School Name',
    address: 'School Address',
  };
}
