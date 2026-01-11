/**
 * Certificate Generation Service
 * 
 * Handles bulk certificate generation with PDF output, QR codes, and verification codes.
 * Supports print-ready PDF files with proper dimensions for printing.
 * 
 * Requirements: 12.2, 12.4 - Bulk Certificate Generation and Print-Ready PDFs
 */

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { CertificateType, CertificateStatus } from '@prisma/client';

export interface CertificateGenerationData {
  studentId?: string;
  studentName: string;
  data: Record<string, any>;
}

export interface BulkCertificateGenerationOptions {
  templateId: string;
  students: CertificateGenerationData[];
  issuedBy: string;
}

export interface CertificateGenerationResult {
  success: boolean;
  certificateId?: string;
  certificateNumber?: string;
  pdfUrl?: string;
  error?: string;
}

export interface BulkCertificateGenerationResult {
  success: boolean;
  totalRequested: number;
  totalGenerated: number;
  certificates: CertificateGenerationResult[];
  errors: string[];
}

/**
 * Generate a unique certificate number
 */
function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

/**
 * Generate a unique verification code
 */
function generateVerificationCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${timestamp}${random}`;
}

/**
 * Render certificate template with data
 */
function renderTemplate(template: string, data: Record<string, any>): string {
  let rendered = template;

  // Replace all variables in the format {{variableName}}
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, String(data[key] || ''));
  });

  return rendered;
}

/**
 * Generate QR code as data URL
 */
async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'H',
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate a single certificate PDF
 */
async function generateCertificatePDF(
  template: any,
  certificateNumber: string,
  verificationCode: string,
  studentData: Record<string, any>
): Promise<Buffer> {
  try {
    // Parse template configuration
    const layout = JSON.parse(template.layout);
    const styling = JSON.parse(template.styling);

    // Determine page size and orientation
    const pageSize = template.pageSize || 'A4';
    const orientation = template.orientation?.toLowerCase() || 'landscape';

    // Create PDF document with proper dimensions for printing
    const doc = new jsPDF({
      orientation: orientation as 'portrait' | 'landscape',
      unit: 'mm',
      format: pageSize.toLowerCase(),
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add background image if provided
    if (template.background) {
      try {
        doc.addImage(
          template.background,
          'PNG',
          0,
          0,
          pageWidth,
          pageHeight
        );
      } catch (error) {
        console.warn('Failed to add background image:', error);
      }
    }

    // Add header image if provided
    if (template.headerImage) {
      try {
        const headerHeight = layout.headerHeight || 30;
        doc.addImage(
          template.headerImage,
          'PNG',
          (pageWidth - layout.headerWidth || 60) / 2,
          10,
          layout.headerWidth || 60,
          headerHeight
        );
      } catch (error) {
        console.warn('Failed to add header image:', error);
      }
    }

    // Render certificate content
    const renderedContent = renderTemplate(template.content, {
      ...studentData,
      certificateNumber,
      verificationCode,
      issueDate: new Date().toLocaleDateString(),
      date: new Date().toLocaleDateString(),
      year: new Date().getFullYear().toString(),
    });

    // Add main content
    const contentY = layout.contentStartY || 60;
    const contentX = layout.contentStartX || 20;
    const maxWidth = pageWidth - (contentX * 2);

    // Set font styling
    doc.setFontSize(styling.fontSize || 12);
    doc.setTextColor(styling.textColor || '#000000');

    // Split content into lines and add to PDF
    const lines = doc.splitTextToSize(renderedContent, maxWidth);
    doc.text(lines, contentX, contentY, {
      align: styling.textAlign || 'center',
      maxWidth: maxWidth,
    });

    // Add signatures if provided
    const signatureY = pageHeight - 40;

    if (template.signature1) {
      try {
        doc.addImage(
          template.signature1,
          'PNG',
          pageWidth * 0.25 - 20,
          signatureY,
          40,
          15
        );
        doc.setFontSize(10);
        doc.text(
          studentData.signature1Label || 'Authorized Signatory',
          pageWidth * 0.25,
          signatureY + 20,
          { align: 'center' }
        );
      } catch (error) {
        console.warn('Failed to add signature 1:', error);
      }
    }

    if (template.signature2) {
      try {
        doc.addImage(
          template.signature2,
          'PNG',
          pageWidth * 0.75 - 20,
          signatureY,
          40,
          15
        );
        doc.setFontSize(10);
        doc.text(
          studentData.signature2Label || 'Principal',
          pageWidth * 0.75,
          signatureY + 20,
          { align: 'center' }
        );
      } catch (error) {
        console.warn('Failed to add signature 2:', error);
      }
    }

    // Generate and add QR code for verification
    const qrCodeData = await generateQRCode(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-certificate/${verificationCode}`
    );

    doc.addImage(
      qrCodeData,
      'PNG',
      pageWidth - 35,
      pageHeight - 35,
      25,
      25
    );

    // Add certificate number at bottom
    doc.setFontSize(8);
    doc.setTextColor('#666666');
    doc.text(
      `Certificate No: ${certificateNumber}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );

    // Add footer image if provided
    if (template.footerImage) {
      try {
        const footerHeight = layout.footerHeight || 15;
        doc.addImage(
          template.footerImage,
          'PNG',
          (pageWidth - layout.footerWidth || 80) / 2,
          pageHeight - footerHeight - 10,
          layout.footerWidth || 80,
          footerHeight
        );
      } catch (error) {
        console.warn('Failed to add footer image:', error);
      }
    }

    // Return PDF as buffer
    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    throw new Error('Failed to generate certificate PDF');
  }
}

/**
 * Upload PDF to storage (Cloudinary)
 */
/**
 * Upload PDF to storage (Cloudinary)
 */
async function uploadPDFToStorage(
  pdfBuffer: Buffer,
  certificateNumber: string
): Promise<string> {
  try {
    const { uploadBufferToCloudinary } = await import("@/lib/cloudinary-server");

    // Upload to Cloudinary using buffer upload
    const result = await uploadBufferToCloudinary(pdfBuffer, {
      folder: 'certificates',
      resource_type: 'raw',
      public_id: `certificate-${certificateNumber}-${Date.now()}`,
      format: 'pdf'
    });

    return result.secure_url;
  } catch (error) {
    console.error('Failed to upload certificate to Cloudinary:', error);
    // Return a fallback local path if upload fails
    // This allows the system to still generate records even if storage is not configured
    return `/api/certificates/${certificateNumber}/download`;
  }
}

/**
 * Generate a single certificate
 */
export async function generateSingleCertificate(
  templateId: string,
  studentData: CertificateGenerationData,
  issuedBy: string
): Promise<CertificateGenerationResult> {
  try {
    // Fetch template
    const template = await db.certificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return {
        success: false,
        error: 'Certificate template not found',
      };
    }

    if (!template.isActive) {
      return {
        success: false,
        error: 'Certificate template is not active',
      };
    }

    // Generate unique identifiers
    const certificateNumber = generateCertificateNumber();
    const verificationCode = generateVerificationCode();

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(
      template,
      certificateNumber,
      verificationCode,
      studentData.data
    );

    // Upload PDF to storage
    const pdfUrl = await uploadPDFToStorage(pdfBuffer, certificateNumber);

    // Save certificate record to database
    const certificate = await db.generatedCertificate.create({
      data: {
        certificateNumber,
        templateId,
        studentId: studentData.studentId,
        studentName: studentData.studentName,
        data: studentData.data,
        pdfUrl,
        verificationCode,
        isVerified: true,
        status: CertificateStatus.ACTIVE,
        issuedBy,
        issuedDate: new Date(),
      },
    });

    return {
      success: true,
      certificateId: certificate.id,
      certificateNumber: certificate.certificateNumber,
      pdfUrl: certificate.pdfUrl || undefined,
    };
  } catch (error: any) {
    console.error('Error generating certificate:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate certificate',
    };
  }
}

/**
 * Generate certificates in bulk for multiple students
 */
export async function generateBulkCertificates(
  options: BulkCertificateGenerationOptions
): Promise<BulkCertificateGenerationResult> {
  const { templateId, students, issuedBy } = options;

  const results: CertificateGenerationResult[] = [];
  const errors: string[] = [];
  let successCount = 0;

  // Validate template exists and is active
  const template = await db.certificateTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return {
      success: false,
      totalRequested: students.length,
      totalGenerated: 0,
      certificates: [],
      errors: ['Certificate template not found'],
    };
  }

  if (!template.isActive) {
    return {
      success: false,
      totalRequested: students.length,
      totalGenerated: 0,
      certificates: [],
      errors: ['Certificate template is not active'],
    };
  }

  // Generate certificates for each student
  for (const student of students) {
    try {
      const result = await generateSingleCertificate(
        templateId,
        student,
        issuedBy
      );

      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        errors.push(
          `Failed to generate certificate for ${student.studentName}: ${result.error}`
        );
      }
    } catch (error: any) {
      const errorMsg = `Error generating certificate for ${student.studentName}: ${error.message}`;
      errors.push(errorMsg);
      results.push({
        success: false,
        error: errorMsg,
      });
    }
  }

  return {
    success: successCount > 0,
    totalRequested: students.length,
    totalGenerated: successCount,
    certificates: results,
    errors,
  };
}

/**
 * Get generated certificates for a student
 */
export async function getStudentCertificates(studentId: string) {
  try {
    const certificates = await db.generatedCertificate.findMany({
      where: {
        studentId,
        status: CertificateStatus.ACTIVE,
      },
      include: {
        template: {
          select: {
            name: true,
            type: true,
            category: true,
          },
        },
      },
      orderBy: {
        issuedDate: 'desc',
      },
    });

    return {
      success: true,
      data: certificates,
    };
  } catch (error: any) {
    console.error('Error fetching student certificates:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch certificates',
    };
  }
}

/**
 * Verify a certificate using verification code
 */
export async function verifyCertificate(verificationCode: string) {
  try {
    const certificate = await db.generatedCertificate.findUnique({
      where: {
        verificationCode,
      },
      include: {
        template: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    if (!certificate) {
      return {
        success: false,
        error: 'Certificate not found',
      };
    }

    return {
      success: true,
      data: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.studentName,
        templateName: certificate.template.name,
        templateType: certificate.template.type,
        issuedDate: certificate.issuedDate,
        isVerified: certificate.isVerified,
        status: certificate.status,
      },
    };
  } catch (error: any) {
    console.error('Error verifying certificate:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify certificate',
    };
  }
}

/**
 * Revoke a certificate
 */
export async function revokeCertificate(
  certificateId: string,
  revokedBy: string,
  reason: string
) {
  try {
    const certificate = await db.generatedCertificate.update({
      where: { id: certificateId },
      data: {
        status: CertificateStatus.REVOKED,
        revokedAt: new Date(),
        revokedBy,
        revokedReason: reason,
      },
    });

    return {
      success: true,
      data: certificate,
    };
  } catch (error: any) {
    console.error('Error revoking certificate:', error);
    return {
      success: false,
      error: error.message || 'Failed to revoke certificate',
    };
  }
}
