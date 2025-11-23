"use server";

/**
 * Certificate Generation Actions
 * 
 * Server actions for generating certificates in bulk and managing generated certificates.
 * Supports print-ready PDF generation with proper dimensions.
 * 
 * Requirements: 12.2, 12.4 - Bulk Certificate Generation and Print-Ready PDFs
 */

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  generateBulkCertificates,
  generateSingleCertificate,
  getStudentCertificates,
  verifyCertificate,
  revokeCertificate,
  type BulkCertificateGenerationOptions,
  type CertificateGenerationData,
} from "@/lib/services/certificateGenerationService";

/**
 * Generate certificates for multiple students
 */
export async function bulkGenerateCertificates(
  templateId: string,
  studentIds: string[]
) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN" && dbUser.role !== "TEACHER") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Fetch student data
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

    if (students.length === 0) {
      return { success: false, error: "No students found" };
    }

    // Prepare student data for certificate generation
    const studentData: CertificateGenerationData[] = students.map((student) => {
      const currentEnrollment = student.enrollments[0];
      return {
        studentId: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        data: {
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          studentFirstName: student.user.firstName,
          studentLastName: student.user.lastName,
          admissionId: student.admissionId,
          rollNumber: student.rollNumber || currentEnrollment?.rollNumber || 'N/A',
          className: currentEnrollment?.class.name || 'N/A',
          sectionName: currentEnrollment?.section.name || 'N/A',
          dateOfBirth: student.dateOfBirth?.toLocaleDateString() || 'N/A',
          gender: student.gender || 'N/A',
          // Add more fields as needed
          schoolName: process.env.SCHOOL_NAME || 'School Name',
          principalName: process.env.PRINCIPAL_NAME || 'Principal Name',
        },
      };
    });

    // Generate certificates
    const options: BulkCertificateGenerationOptions = {
      templateId,
      students: studentData,
      issuedBy: dbUser.id,
    };

    const result = await generateBulkCertificates(options);

    // Revalidate certificates page
    revalidatePath("/admin/certificates");

    return {
      success: result.success,
      data: {
        totalRequested: result.totalRequested,
        totalGenerated: result.totalGenerated,
        certificates: result.certificates,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
    };
  } catch (error: any) {
    console.error("Error in bulkGenerateCertificates:", error);
    return {
      success: false,
      error: error.message || "Failed to generate certificates",
    };
  }
}

/**
 * Generate a single certificate for a student
 */
export async function generateCertificateForStudent(
  templateId: string,
  studentId: string,
  additionalData?: Record<string, any>
) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN" && dbUser.role !== "TEACHER") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Fetch student data
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
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
      return { success: false, error: "Student not found" };
    }

    const currentEnrollment = student.enrollments[0];

    // Prepare student data
    const studentData: CertificateGenerationData = {
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      data: {
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        studentFirstName: student.user.firstName,
        studentLastName: student.user.lastName,
        admissionId: student.admissionId,
        rollNumber: student.rollNumber || currentEnrollment?.rollNumber || 'N/A',
        className: currentEnrollment?.class.name || 'N/A',
        sectionName: currentEnrollment?.section.name || 'N/A',
        dateOfBirth: student.dateOfBirth?.toLocaleDateString() || 'N/A',
        gender: student.gender || 'N/A',
        schoolName: process.env.SCHOOL_NAME || 'School Name',
        principalName: process.env.PRINCIPAL_NAME || 'Principal Name',
        ...additionalData,
      },
    };

    // Generate certificate
    const result = await generateSingleCertificate(
      templateId,
      studentData,
      dbUser.id
    );

    // Revalidate certificates page
    revalidatePath("/admin/certificates");

    return result;
  } catch (error: any) {
    console.error("Error in generateCertificateForStudent:", error);
    return {
      success: false,
      error: error.message || "Failed to generate certificate",
    };
  }
}

/**
 * Get all generated certificates with filters
 */
export async function getGeneratedCertificates(filters?: {
  templateId?: string;
  studentId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Build where clause
    const where: any = {};
    
    if (filters?.templateId) {
      where.templateId = filters.templateId;
    }
    
    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.startDate || filters?.endDate) {
      where.issuedDate = {};
      if (filters.startDate) {
        where.issuedDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.issuedDate.lte = filters.endDate;
      }
    }

    const certificates = await db.generatedCertificate.findMany({
      where,
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
    console.error("Error in getGeneratedCertificates:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch certificates",
    };
  }
}

/**
 * Get certificates for a specific student
 */
export async function getCertificatesForStudent(studentId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await getStudentCertificates(studentId);
    return result;
  } catch (error: any) {
    console.error("Error in getCertificatesForStudent:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch student certificates",
    };
  }
}

/**
 * Verify a certificate by verification code
 */
export async function verifyCertificateByCode(verificationCode: string) {
  try {
    const result = await verifyCertificate(verificationCode);
    return result;
  } catch (error: any) {
    console.error("Error in verifyCertificateByCode:", error);
    return {
      success: false,
      error: error.message || "Failed to verify certificate",
    };
  }
}

/**
 * Revoke a certificate
 */
export async function revokeCertificateById(
  certificateId: string,
  reason: string
) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    const result = await revokeCertificate(certificateId, dbUser.id, reason);

    // Revalidate certificates page
    revalidatePath("/admin/certificates");

    return result;
  } catch (error: any) {
    console.error("Error in revokeCertificateById:", error);
    return {
      success: false,
      error: error.message || "Failed to revoke certificate",
    };
  }
}

/**
 * Get certificate generation statistics
 */
export async function getCertificateGenerationStats() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get total certificates
    const totalCertificates = await db.generatedCertificate.count();

    // Get certificates by status
    const statusBreakdown = await db.generatedCertificate.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get certificates by type
    const typeBreakdown = await db.generatedCertificate.groupBy({
      by: ['templateId'],
      _count: true,
      orderBy: {
        _count: {
          templateId: 'desc',
        },
      },
      take: 5,
    });

    // Get template names for type breakdown
    const templateIds = typeBreakdown.map((item) => item.templateId);
    const templates = await db.certificateTemplate.findMany({
      where: {
        id: {
          in: templateIds,
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    const typeBreakdownWithNames = typeBreakdown.map((item) => {
      const template = templates.find((t) => t.id === item.templateId);
      return {
        templateId: item.templateId,
        templateName: template?.name || 'Unknown',
        templateType: template?.type || 'CUSTOM',
        count: item._count,
      };
    });

    // Get recent certificates
    const recentCertificates = await db.generatedCertificate.findMany({
      take: 10,
      orderBy: {
        issuedDate: 'desc',
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

    return {
      success: true,
      data: {
        totalCertificates,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        topTemplates: typeBreakdownWithNames,
        recentCertificates,
      },
    };
  } catch (error: any) {
    console.error("Error in getCertificateGenerationStats:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch certificate statistics",
    };
  }
}
