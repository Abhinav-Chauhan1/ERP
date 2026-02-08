/**
 * ID Card Generation Service
 * 
 * Handles ID card generation with student photo, QR code, and barcode.
 * Generates print-ready PDF files with proper dimensions for ID card printing.
 * 
 * Requirements: 12.3, 12.4 - ID Card Generation with Photo, QR Code, Barcode, and Print-Ready PDFs
 */

import jsPDF from 'jspdf';
import { db } from '@/lib/db';
import { uploadHandler } from '@/lib/services/upload-handler';

export interface IDCardGenerationResult {
  success: boolean;
  studentId: string;
  studentName: string;
  pdfUrl?: string;
  error?: string;
}

export interface BulkIDCardGenerationOptions {
  students: TemplateIDCardData[];
  academicYear: string;
}

export interface BulkIDCardGenerationResult {
  success: boolean;
  totalRequested: number;
  totalGenerated: number;
  idCards: IDCardGenerationResult[];
  errors: string[];
}


// QR Code and Barcode functions moved to id-card-templates.ts

// Re-export shared types
export type { IDCardGenerationData } from './id-card-templates';
import {
  ID_CARD_TEMPLATES,
  SchoolSettingsData,
  IDCardGenerationData as TemplateIDCardData
} from './id-card-templates';

/**
 * Generate a single ID card PDF using the selected template
 */
async function generateIDCardPDF(
  studentData: TemplateIDCardData,
  academicYear: string,
  templateId: string = 'STANDARD'
): Promise<Buffer> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const settings = await db.systemSettings.findFirst();
    const schoolSettings: SchoolSettingsData = {
      schoolName: settings?.schoolName || 'School Name',
      schoolAddress: settings?.schoolAddress || undefined,
      schoolPhone: settings?.schoolPhone || undefined,
      schoolEmail: settings?.schoolEmail || undefined,
      schoolLogo: settings?.schoolLogo || undefined,
      affiliationNumber: settings?.affiliationNumber || undefined,
      schoolCode: settings?.schoolCode || undefined,
      board: settings?.board || undefined,
    };

    const template = ID_CARD_TEMPLATES[templateId] || ID_CARD_TEMPLATES['STANDARD'];
    await template.generate(doc, studentData, schoolSettings, academicYear);

    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error generating ID card PDF:', error);
    throw new Error('Failed to generate ID card PDF');
  }
}

/**
 * Generate ID card preview (Base64)
 */
export async function generateIDCardPreview(
  studentData: TemplateIDCardData,
  academicYear: string,
  templateId: string = 'STANDARD'
): Promise<string> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const settings = await db.systemSettings.findFirst();
    const schoolSettings: SchoolSettingsData = {
      schoolName: settings?.schoolName || 'School Name',
      schoolAddress: settings?.schoolAddress || undefined,
      schoolPhone: settings?.schoolPhone || undefined,
      schoolEmail: settings?.schoolEmail || undefined,
      schoolLogo: settings?.schoolLogo || undefined,
      affiliationNumber: settings?.affiliationNumber || undefined,
      schoolCode: settings?.schoolCode || undefined,
      board: settings?.board || undefined,
    };

    const template = ID_CARD_TEMPLATES[templateId] || ID_CARD_TEMPLATES['STANDARD'];
    await template.generate(doc, studentData, schoolSettings, academicYear);

    return doc.output('datauristring');
  } catch (error) {
    console.error('Error generating ID card preview:', error);
    throw new Error('Failed to generate ID card preview');
  }
}

/**
 * Upload PDF to storage (R2)
 * Integrated with R2 storage service
 */
async function uploadPDFToStorage(
  pdfBuffer: Buffer,
  studentId: string
): Promise<string> {
  try {
    // Create a File-like object from the buffer
    const file = new File([new Uint8Array(pdfBuffer)], `id-card-${studentId}.pdf`, {
      type: 'application/pdf'
    });

    const uploadResult = await uploadHandler.uploadDocument(file, {
      folder: 'id-cards',
      category: 'document',
      customMetadata: {
        studentId,
        documentType: 'id-card',
        uploadType: 'generated-id-card'
      }
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload ID card PDF');
    }

    return uploadResult.url!;
    
    // Return a fallback local path if upload fails
    return `/api/id-cards/${studentId}/download`;
  } catch (error) {
    console.error('Failed to upload ID card to R2 storage:', error);
    return `/api/id-cards/${studentId}/download`;
  }
}

/**
 * Generate a single ID card
 */
export async function generateSingleIDCard(
  studentData: TemplateIDCardData,
  academicYear: string,
  templateId: string = 'STANDARD'
): Promise<IDCardGenerationResult> {
  try {
    // Generate PDF
    const pdfBuffer = await generateIDCardPDF(studentData, academicYear, templateId);

    // Upload PDF to storage
    const pdfUrl = await uploadPDFToStorage(pdfBuffer, studentData.studentId);

    return {
      success: true,
      studentId: studentData.studentId,
      studentName: studentData.studentName,
      pdfUrl,
    };
  } catch (error: any) {
    console.error('Error generating ID card:', error);
    return {
      success: false,
      studentId: studentData.studentId,
      studentName: studentData.studentName,
      error: error.message || 'Failed to generate ID card',
    };
  }
}

// ... types reused from previous steps ...

// Remove unused local helper functions generateQRCode and generateBarcodePNG

/**
 * Generate ID cards in bulk for multiple students
 */
export async function generateBulkIDCards(
  options: BulkIDCardGenerationOptions,
  templateId: string = 'STANDARD'
): Promise<BulkIDCardGenerationResult> {
  const { students, academicYear } = options;

  const results: IDCardGenerationResult[] = [];
  const errors: string[] = [];
  let successCount = 0;

  // Generate ID cards for each student
  for (const student of students) {
    try {
      const result = await generateSingleIDCard(student, academicYear, templateId);

      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        errors.push(
          `Failed to generate ID card for ${student.studentName}: ${result.error}`
        );
      }
    } catch (error: any) {
      const errorMsg = `Error generating ID card for ${student.studentName}: ${error.message}`;
      errors.push(errorMsg);
      results.push({
        success: false,
        studentId: student.studentId,
        studentName: student.studentName,
        error: errorMsg,
      });
    }
  }

  return {
    success: successCount > 0,
    totalRequested: students.length,
    totalGenerated: successCount,
    idCards: results,
    errors,
  };
}

/**
 * Get student data for ID card generation
 */
export async function getStudentDataForIDCard(studentId: string): Promise<TemplateIDCardData | null> {
  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            phone: true,
          },
        },
        enrollments: {
          where: {
            status: "ACTIVE",
          },
          include: {
            class: {
              select: {
                name: true,
              },
            },
            section: {
              select: {
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!student) {
      return null;
    }

    const enrollment = student.enrollments[0];

    return {
      studentId: student.id,
      schoolId: student.schoolId,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      admissionId: student.admissionId,
      className: enrollment?.class.name,
      section: enrollment?.section?.name,
      rollNumber: student.rollNumber || undefined,
      bloodGroup: student.bloodGroup || undefined,
      emergencyContact: student.emergencyContact || student.user.phone || undefined,
      photoUrl: student.user.avatar || undefined,
      dob: student.dateOfBirth,
      fatherName: student.fatherName || undefined,
      motherName: student.motherName || undefined,
      address: student.address || undefined,
    };
  } catch (error) {
    console.error('Error fetching student data:', error);
    return null;
  }
}

/**
 * Get multiple students data for bulk ID card generation
 */
export async function getStudentsDataForIDCards(
  studentIds: string[]
): Promise<TemplateIDCardData[]> {
  try {
    const students = await db.student.findMany({
      where: {
        id: {
          in: studentIds,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            phone: true,
          },
        },
        enrollments: {
          where: {
            status: "ACTIVE",
          },
          include: {
            class: {
              select: {
                name: true,
              },
            },
            section: {
              select: {
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    return students.map(student => {
      const enrollment = student.enrollments[0];

      return {
        studentId: student.id,
        schoolId: student.schoolId,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        admissionId: student.admissionId,
        className: enrollment?.class.name,
        section: enrollment?.section?.name,
        rollNumber: student.rollNumber || undefined,
        bloodGroup: student.bloodGroup || undefined,
        emergencyContact: student.emergencyContact || student.user.phone || undefined,
        photoUrl: student.user.avatar || undefined,
        dob: student.dateOfBirth,
        fatherName: student.fatherName || undefined,
        motherName: student.motherName || undefined,
        address: student.address || undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching students data:', error);
    return [];
  }
}
