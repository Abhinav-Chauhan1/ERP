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
import {
  generateReportCardPDF,
  generateBatchReportCardsPDF
} from '@/lib/services/report-card-pdf-generation';
import {
  aggregateReportCardData,
  batchAggregateReportCardData
} from '@/lib/services/report-card-data-aggregation';
import { uploadToCloudinary } from '@/lib/cloudinary';

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
  templateId: string
): Promise<ActionResult<{ pdfUrl: string; reportCardId: string }>> {
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

    // Aggregate report card data
    const reportCardData = await aggregateReportCardData(studentId, termId);

    // Fetch school information for branding
    const schoolInfo = await getSchoolInfo();

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

    // Upload PDF to Cloudinary
    const pdfUrl = await uploadPDFToStorage(
      pdfResult.pdfBuffer,
      `report-card-${studentId}-${termId}`
    );

    // Update or create report card record with PDF URL
    const reportCard = await db.reportCard.upsert({
      where: {
        studentId_termId: {
          studentId,
          termId,
        },
      },
      update: {
        templateId,
        pdfUrl,
        updatedAt: new Date(),
      },
      create: {
        studentId,
        termId,
        templateId,
        pdfUrl,
        totalMarks: reportCardData.overallPerformance.obtainedMarks,
        averageMarks: reportCardData.overallPerformance.obtainedMarks / reportCardData.subjects.length,
        percentage: reportCardData.overallPerformance.percentage,
        grade: reportCardData.overallPerformance.grade,
        rank: reportCardData.overallPerformance.rank,
        attendance: reportCardData.attendance.percentage,
        coScholasticData: reportCardData.coScholastic as any,
        teacherRemarks: reportCardData.remarks.teacherRemarks,
        principalRemarks: reportCardData.remarks.principalRemarks,
      },
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
  templateId: string
): Promise<ActionResult<{ pdfUrl: string; totalGenerated: number }>> {
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

    // Fetch all students in the class and section
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId,
        sectionId,
        status: 'ACTIVE',
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
    const schoolInfo = await getSchoolInfo();

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

    // Upload batch PDF to Cloudinary
    const pdfUrl = await uploadPDFToStorage(
      pdfResult.pdfBuffer,
      `report-cards-batch-${classId}-${sectionId}-${termId}`
    );

    // Update or create report card records for all students
    const updatePromises = reportCardsData.map(async (data) => {
      return db.reportCard.upsert({
        where: {
          studentId_termId: {
            studentId: data.student.id,
            termId,
          },
        },
        update: {
          templateId,
          pdfUrl, // Store the batch PDF URL
          updatedAt: new Date(),
        },
        create: {
          studentId: data.student.id,
          termId,
          templateId,
          pdfUrl,
          totalMarks: data.overallPerformance.obtainedMarks,
          averageMarks: data.overallPerformance.obtainedMarks / data.subjects.length,
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
 * Returns base64 data for direct browser download (avoids Cloudinary auth issues)
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
  templateId: string
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
    const schoolInfo = await getSchoolInfo();

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

    // Update report card records for all students
    const updatePromises = validPdfs.map(async (pdf) => {
      return db.reportCard.upsert({
        where: {
          studentId_termId: {
            studentId: pdf.studentId,
            termId,
          },
        },
        update: {
          templateId,
          updatedAt: new Date(),
        },
        create: {
          studentId: pdf.studentId,
          termId,
          templateId,
          totalMarks: pdf.reportCardData.overallPerformance.obtainedMarks,
          averageMarks: pdf.reportCardData.overallPerformance.obtainedMarks / pdf.reportCardData.subjects.length,
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
 * Get report card templates
 * 
 * @returns List of available templates
 */
export async function getReportCardTemplates(): Promise<ActionResult<any[]>> {
  try {
    const templates = await db.reportCardTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        isDefault: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return {
      success: true,
      data: templates,
    };
  } catch (error) {
    console.error('Error fetching report card templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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
 * Upload PDF to storage (Cloudinary)
 */
async function uploadPDFToStorage(pdfBuffer: Buffer, filename: string): Promise<string> {
  try {
    // Convert buffer to base64
    const base64PDF = pdfBuffer.toString('base64');
    const dataURI = `data:application/pdf;base64,${base64PDF}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(dataURI, {
      folder: 'report-cards',
      resource_type: 'raw',
      public_id: filename,
      format: 'pdf',
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading PDF to storage:', error);
    throw new Error('Failed to upload PDF to storage');
  }
}

/**
 * Upload ZIP file to storage (Cloudinary)
 */
async function uploadZIPToStorage(zipBuffer: Buffer, filename: string): Promise<string> {
  try {
    // Convert buffer to base64
    const base64ZIP = zipBuffer.toString('base64');
    const dataURI = `data:application/zip;base64,${base64ZIP}`;

    // Ensure filename has .zip extension for proper download
    const filenameWithExt = filename.endsWith('.zip') ? filename : `${filename}.zip`;

    // Upload to Cloudinary with explicit extension and public access
    const result = await uploadToCloudinary(dataURI, {
      folder: 'report-cards-batch',
      resource_type: 'raw',
      public_id: filenameWithExt,
      type: 'upload', // Ensure public access (no authentication required)
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading ZIP to storage:', error);
    throw new Error('Failed to upload ZIP to storage');
  }
}

/**
 * Get school information for branding
 */
async function getSchoolInfo(): Promise<{ name: string; address: string }> {
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
