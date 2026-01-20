/**
 * ID Card Generation Actions
 * 
 * Server actions for generating student ID cards with photo, QR code, and barcode.
 * 
 * Requirements: 12.3, 12.4 - ID Card Generation and Print-Ready PDFs
 */

'use server';

import { currentUser } from "@/lib/auth-helpers";
import {
  generateSingleIDCard,
  generateBulkIDCards,
  getStudentDataForIDCard,
  getStudentsDataForIDCards,
  generateIDCardPreview as generateIDCardPreviewService,
  type IDCardGenerationData,
  type BulkIDCardGenerationOptions,
  type IDCardGenerationResult,
} from '@/lib/services/idCardGenerationService';
import { db } from '@/lib/db';

/**
 * Generate ID card for a single student
 */
export async function generateStudentIDCard(studentId: string, academicYear: string, templateId: string = 'STANDARD') {
  try {
    const user = await currentUser();

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Check if user has permission (admin or teacher)
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'TEACHER')) {
      return {
        success: false,
        error: 'Insufficient permissions',
      };
    }

    // Get student data
    const studentData = await getStudentDataForIDCard(studentId);

    if (!studentData) {
      return {
        success: false,
        error: 'Student not found',
      };
    }

    // Generate ID card
    const result = await generateSingleIDCard(studentData, academicYear, templateId);

    return result;
  } catch (error: any) {
    console.error('Error in generateStudentIDCard:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate ID card',
    };
  }
}

/**
 * Get ID card preview (Base64)
 */
export async function getStudentIDCardPreview(studentId: string, academicYear: string, templateId: string = 'STANDARD') {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const studentData = await getStudentDataForIDCard(studentId);
    if (!studentData) return { success: false, error: 'Student not found' };

    const previewUrl = await generateIDCardPreviewService(studentData, academicYear, templateId);

    return { success: true, previewUrl };
  } catch (error: any) {
    console.error('Error generating preview:', error);
    return { success: false, error: 'Failed to generate preview' };
  }
}


/**
 * Generate ID cards for multiple students
 */
export async function generateBulkStudentIDCards(
  studentIds: string[],
  academicYear: string,
  templateId: string = 'STANDARD'
) {
  try {
    const user = await currentUser();

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
        totalRequested: studentIds.length,
        totalGenerated: 0,
        idCards: [],
        errors: ['Unauthorized'],
      };
    }

    // Check if user has permission (admin only for bulk operations)
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Insufficient permissions. Only administrators can generate bulk ID cards.',
        totalRequested: studentIds.length,
        totalGenerated: 0,
        idCards: [],
        errors: ['Insufficient permissions'],
      };
    }

    // Get students data
    const studentsData = await getStudentsDataForIDCards(studentIds);

    if (studentsData.length === 0) {
      return {
        success: false,
        error: 'No valid students found',
        totalRequested: studentIds.length,
        totalGenerated: 0,
        idCards: [],
        errors: ['No valid students found'],
      };
    }

    // Generate ID cards
    const options: BulkIDCardGenerationOptions = {
      students: studentsData,
      academicYear,
    };

    const result = await generateBulkIDCards(options, templateId);

    return result;
  } catch (error: any) {
    console.error('Error in generateBulkStudentIDCards:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate ID cards',
      totalRequested: studentIds.length,
      totalGenerated: 0,
      idCards: [],
      errors: [error.message || 'Failed to generate ID cards'],
    };
  }
}

/**
 * Generate ID cards for all students in a class
 */
export async function generateClassIDCards(
  classId: string,
  sectionId: string | null,
  academicYear: string,
  templateId: string = 'STANDARD'
) {
  try {
    const user = await currentUser();

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
        totalRequested: 0,
        totalGenerated: 0,
        idCards: [],
        errors: ['Unauthorized'],
      };
    }

    // Check if user has permission (admin only)
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Insufficient permissions',
        totalRequested: 0,
        totalGenerated: 0,
        idCards: [],
        errors: ['Insufficient permissions'],
      };
    }

    // Get all students in the class/section
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId,
        ...(sectionId ? { sectionId } : {}),
        status: "ACTIVE",
      },
      select: {
        studentId: true,
      },
    });

    const studentIds = enrollments.map(e => e.studentId);

    if (studentIds.length === 0) {
      return {
        success: false,
        error: 'No students found in the specified class/section',
        totalRequested: 0,
        totalGenerated: 0,
        idCards: [],
        errors: ['No students found'],
      };
    }

    // Generate ID cards for all students
    return await generateBulkStudentIDCards(studentIds, academicYear, templateId);
  } catch (error: any) {
    console.error('Error in generateClassIDCards:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate class ID cards',
      totalRequested: 0,
      totalGenerated: 0,
      idCards: [],
      errors: [error.message || 'Failed to generate class ID cards'],
    };
  }
}

/**
 * Get ID card preview for a random student in a class
 */
export async function getClassIDCardPreview(
  classId: string,
  academicYear: string,
  templateId: string = 'STANDARD'
) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Get one student from the class
    const enrollment = await db.classEnrollment.findFirst({
      where: {
        classId,
        status: "ACTIVE",
      },
      select: {
        studentId: true,
      },
      orderBy: { // Random-ish or just first
        studentId: 'asc'
      }
    });

    if (!enrollment) {
      return { success: false, error: 'No students found in this class' };
    }

    return await getStudentIDCardPreview(enrollment.studentId, academicYear, templateId);
  } catch (error: any) {
    console.error('Error in getClassIDCardPreview:', error);
    return { success: false, error: error.message || 'Failed to generate preview' };
  }
}

/**
 * Get list of classes for ID card generation
 */
export async function getClassesForIDCardGeneration() {
  try {
    const user = await currentUser();

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
        data: [],
      };
    }

    const classes = await db.class.findMany({
      include: {
        sections: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: classes.map(c => ({
        id: c.id,
        name: c.name,
        sections: c.sections,
        studentCount: c._count.enrollments,
      })),
    };
  } catch (error: any) {
    console.error('Error in getClassesForIDCardGeneration:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch classes',
      data: [],
    };
  }
}

/**
 * Get current academic year
 */
export async function getCurrentAcademicYear() {
  try {
    const academicYear = await db.academicYear.findFirst({
      where: {
        isCurrent: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!academicYear) {
      // Fallback to current year
      const currentYear = new Date().getFullYear();
      return {
        success: true,
        data: {
          id: 'current',
          name: `${currentYear}-${currentYear + 1}`,
        },
      };
    }

    return {
      success: true,
      data: {
        id: academicYear.id,
        year: academicYear.name, // Return as 'year' for backward compatibility
      },
    };
  } catch (error: any) {
    console.error('Error in getCurrentAcademicYear:', error);
    const currentYear = new Date().getFullYear();
    return {
      success: true,
      data: {
        id: 'current',
        year: `${currentYear}-${currentYear + 1}`,
      },
    };
  }
}
