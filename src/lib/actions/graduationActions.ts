"use server";

/**
 * Graduation Ceremony Server Actions
 * 
 * This file contains server actions for graduation ceremony operations.
 * All actions include authentication and authorization checks.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 */

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { UserRole, EnrollmentStatus } from "@prisma/client";
import { PromotionService } from "@/lib/services/promotionService";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// ============================================================================
// Types
// ============================================================================

export type GraduationCeremonyDetails = {
  ceremonyDate: Date;
  venue?: string;
  chiefGuest?: string;
  theme?: string;
  notes?: string;
};

export type GraduationResult = {
  success: boolean;
  data?: {
    graduatedCount: number;
    alumniCreated: number;
    certificatesGenerated: number;
    notificationsSent: number;
    failures: Array<{
      studentId: string;
      studentName: string;
      reason: string;
    }>;
  };
  error?: string;
};

export type MarkStudentsAsGraduatedInput = {
  studentIds: string[];
  graduationDate: Date;
  ceremonyDetails?: GraduationCeremonyDetails;
  generateCertificates?: boolean;
  sendNotifications?: boolean;
};

export type BulkGraduateClassInput = {
  classId: string;
  sectionId?: string;
  academicYearId: string;
  graduationDate: Date;
  ceremonyDetails?: GraduationCeremonyDetails;
  generateCertificates?: boolean;
  sendNotifications?: boolean;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if user is authenticated and has ADMIN role
 */
async function checkAdminAuth() {
  const session = await auth();

  if (!session?.user) {
    return { authorized: false, error: "Not authenticated", userId: null };
  }

  if (session.user.role !== UserRole.ADMIN) {
    return { authorized: false, error: "Insufficient permissions. Admin role required.", userId: null };
  }

  return { authorized: true, error: null, userId: session.user.id };
}

/**
 * Log audit event for graduation operations
 */
async function logGraduationAudit(
  action: string,
  userId: string,
  details: Record<string, any>
) {
  try {
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        resource: "GRADUATION",
        userId,
        changes: {
          action,
          ...details,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Don't fail the operation if audit logging fails
  }
}

/**
 * Send graduation notifications to students and parents
 */
async function sendGraduationNotifications(
  studentIds: string[],
  ceremonyDetails?: GraduationCeremonyDetails
): Promise<number> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return 0;
    // Fetch students with parent information
    const students = await db.student.findMany({
      where: {
        id: { in: studentIds },
      },
      include: {
        user: true,
        parents: {
          include: {
            parent: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    let notificationCount = 0;

    // Send notifications to each student and their parents
    for (const student of students) {
      const message = ceremonyDetails
        ? `Congratulations on your graduation! Ceremony details:\nDate: ${ceremonyDetails.ceremonyDate.toLocaleDateString()}\nVenue: ${ceremonyDetails.venue || "TBA"}\nChief Guest: ${ceremonyDetails.chiefGuest || "TBA"}`
        : "Congratulations on your graduation!";

      // Send to student
      try {
        await db.message.create({
          data: {
            senderId: "system",
            recipientId: student.userId,
            subject: "Congratulations on Your Graduation!",
            content: message,
            schoolId,
          },
        });
        notificationCount++;
      } catch (error) {
        console.error(`Failed to send notification to student ${student.id}:`, error);
      }

      // Send to parents
      for (const parentRelation of student.parents) {
        try {
          await db.message.create({
            data: {
              senderId: "system",
              recipientId: parentRelation.parent.userId,
              subject: `Congratulations! ${student.user.firstName} ${student.user.lastName} has graduated`,
              content: message,
              schoolId,
            },
          });
          notificationCount++;
        } catch (error) {
          console.error(`Failed to send notification to parent:`, error);
        }
      }
    }

    return notificationCount;
  } catch (error) {
    console.error("Error sending graduation notifications:", error);
    return 0;
  }
}

/**
 * Generate graduation certificates for students
 *
 * NOTE: Certificate generation is not yet implemented.
 * This is a stub that logs the request for tracking purposes.
 *
 * To implement certificate generation:
 * 1. Install a PDF generation library (e.g., @react-pdf/renderer, puppeteer, or pdfkit)
 * 2. Create certificate templates in the database (CertificateTemplate model)
 * 3. Implement PDF generation logic with school branding
 * 4. Store generated certificates in R2 storage
 * 5. Update database with certificate URLs
 * 6. Send certificates via email to students
 *
 * See docs/CERTIFICATE_GENERATION.md for implementation guide.
 */
async function generateGraduationCertificates(
  studentIds: string[],
  graduationDate: Date
): Promise<number> {
  try {
    console.warn(`Certificate generation is not implemented. Request logged for ${studentIds.length} students on ${graduationDate.toISOString()}`);

    // Log to audit for tracking certificate generation requests
    // This helps identify demand for the feature

    // Return 0 to indicate no certificates were actually generated
    return 0;
  } catch (error) {
    console.error("Error in certificate generation stub:", error);
    return 0;
  }
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Mark specific students as graduated
 * 
 * This action:
 * - Updates enrollment status to GRADUATED
 * - Creates alumni profiles
 * - Optionally generates certificates
 * - Optionally sends congratulatory messages
 * - Updates student user accounts to indicate graduated status
 * 
 * Requirements: 11.1, 11.3, 11.4, 11.5, 11.6, 11.7
 * 
 * @param input - Student IDs and graduation details
 * @returns Graduation result with counts and failures
 */
export async function markStudentsAsGraduated(
  input: MarkStudentsAsGraduatedInput
): Promise<GraduationResult> {
  try {
    // Authentication and authorization check
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const {
      studentIds,
      graduationDate,
      ceremonyDetails,
      generateCertificates = false,
      sendNotifications = true,
    } = input;

    if (!studentIds || studentIds.length === 0) {
      return {
        success: false,
        error: "No students selected for graduation",
      };
    }

    // Validate graduation date
    if (!graduationDate || isNaN(graduationDate.getTime())) {
      return {
        success: false,
        error: "Invalid graduation date",
      };
    }

    const failures: Array<{
      studentId: string;
      studentName: string;
      reason: string;
    }> = [];

    let graduatedCount = 0;
    let alumniCreated = 0;

    // Process each student in a transaction
    await db.$transaction(async (tx) => {
      for (const studentId of studentIds) {
        try {
          // Fetch student with active enrollment
          const student = await tx.student.findUnique({
            where: { id: studentId, schoolId },
            include: {
              user: true,
              enrollments: {
                where: {
                  status: EnrollmentStatus.ACTIVE,
                },
                include: {
                  class: {
                    include: {
                      academicYear: true,
                    },
                  },
                  section: true,
                },
              },
            },
          });

          if (!student) {
            failures.push({
              studentId,
              studentName: "Unknown",
              reason: "Student not found",
            });
            continue;
          }

          const activeEnrollment = student.enrollments[0];
          if (!activeEnrollment) {
            failures.push({
              studentId,
              studentName: `${student.user.firstName} ${student.user.lastName}`,
              reason: "No active enrollment found",
            });
            continue;
          }

          // Update enrollment status to GRADUATED
          await tx.classEnrollment.update({
            where: { id: activeEnrollment.id },
            data: {
              status: EnrollmentStatus.GRADUATED,
            },
          });

          // Check if alumni profile already exists
          const existingAlumni = await tx.alumni.findUnique({
            where: { studentId },
          });

          if (!existingAlumni) {
            // Create alumni profile
            await tx.alumni.create({
              data: {
                schoolId,
                studentId,
                graduationDate,
                finalClass: activeEnrollment.class.name,
                finalSection: activeEnrollment.section?.name || "",
                finalAcademicYear: activeEnrollment.class.academicYear.name,
                createdBy: authCheck.userId!,
              },
            });
            alumniCreated++;
          }

          graduatedCount++;
        } catch (error) {
          console.error(`Error graduating student ${studentId}:`, error);
          failures.push({
            studentId,
            studentName: "Unknown",
            reason: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    });

    // Generate certificates if requested
    let certificatesGenerated = 0;
    if (generateCertificates && graduatedCount > 0) {
      const successfulStudentIds = studentIds.filter(
        (id) => !failures.find((f) => f.studentId === id)
      );
      certificatesGenerated = await generateGraduationCertificates(
        successfulStudentIds,
        graduationDate
      );
    }

    // Send notifications if requested
    let notificationsSent = 0;
    if (sendNotifications && graduatedCount > 0) {
      const successfulStudentIds = studentIds.filter(
        (id) => !failures.find((f) => f.studentId === id)
      );
      notificationsSent = await sendGraduationNotifications(
        successfulStudentIds,
        ceremonyDetails
      );
    }

    // Log audit event
    await logGraduationAudit("MARK_STUDENTS_GRADUATED", authCheck.userId!, {
      studentCount: studentIds.length,
      graduatedCount,
      alumniCreated,
      certificatesGenerated,
      notificationsSent,
      graduationDate: graduationDate.toISOString(),
      ceremonyDetails,
    });

    // Revalidate paths
    revalidatePath("/admin/academic/graduation");
    revalidatePath("/admin/alumni");

    return {
      success: true,
      data: {
        graduatedCount,
        alumniCreated,
        certificatesGenerated,
        notificationsSent,
        failures,
      },
    };
  } catch (error) {
    console.error("Error marking students as graduated:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark students as graduated",
    };
  }
}

/**
 * Bulk graduate all students in a class
 * 
 * This action:
 * - Fetches all students with active enrollment in the specified class
 * - Marks them as graduated
 * - Creates alumni profiles
 * - Optionally generates certificates
 * - Optionally sends congratulatory messages
 * 
 * Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 * 
 * @param input - Class details and graduation configuration
 * @returns Graduation result with counts and failures
 */
export async function bulkGraduateClass(
  input: BulkGraduateClassInput
): Promise<GraduationResult> {
  try {
    // Authentication and authorization check
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const {
      classId,
      sectionId,
      academicYearId,
      graduationDate,
      ceremonyDetails,
      generateCertificates = false,
      sendNotifications = true,
    } = input;

    // Validate inputs
    if (!classId || !academicYearId) {
      return {
        success: false,
        error: "Class and academic year are required",
      };
    }

    if (!graduationDate || isNaN(graduationDate.getTime())) {
      return {
        success: false,
        error: "Invalid graduation date",
      };
    }

    // Build enrollment filters
    const enrollmentFilters: any = {
      classId,
      status: EnrollmentStatus.ACTIVE,
      class: {
        academicYearId,
        schoolId
      },
    };

    if (sectionId) {
      enrollmentFilters.sectionId = sectionId;
    }

    // Fetch all students with active enrollment in the class
    const enrollments = await db.classEnrollment.findMany({
      where: enrollmentFilters,
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return {
        success: false,
        error: "No students found with active enrollment in the specified class",
      };
    }

    // Extract student IDs
    const studentIds = enrollments.map((e) => e.student.id);

    // Use markStudentsAsGraduated to process the students
    const result = await markStudentsAsGraduated({
      studentIds,
      graduationDate,
      ceremonyDetails,
      generateCertificates,
      sendNotifications,
    });

    // Log audit event for bulk graduation
    if (result.success) {
      await logGraduationAudit("BULK_GRADUATE_CLASS", authCheck.userId!, {
        classId,
        sectionId,
        academicYearId,
        studentCount: studentIds.length,
        graduatedCount: result.data?.graduatedCount || 0,
        alumniCreated: result.data?.alumniCreated || 0,
        graduationDate: graduationDate.toISOString(),
        ceremonyDetails,
      });
    }

    return result;
  } catch (error) {
    console.error("Error bulk graduating class:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk graduate class",
    };
  }
}

/**
 * Get students eligible for graduation from a class
 * 
 * Requirements: 11.1, 11.2
 * 
 * @param classId - Class ID
 * @param sectionId - Optional section ID
 * @param academicYearId - Academic year ID
 * @returns List of students eligible for graduation
 */
export async function getStudentsForGraduation(
  classId: string,
  sectionId: string | undefined,
  academicYearId: string
) {
  try {
    // Authentication and authorization check
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    // Build enrollment filters
    const enrollmentFilters: any = {
      classId,
      status: EnrollmentStatus.ACTIVE,
      class: {
        academicYearId,
        schoolId
      },
    };

    if (sectionId) {
      enrollmentFilters.sectionId = sectionId;
    }

    // Fetch students with active enrollment
    const enrollments = await db.classEnrollment.findMany({
      where: enrollmentFilters,
      include: {
        student: {
          include: {
            user: true,
            alumni: true, // Check if already graduated
          },
        },
        class: true,
        section: true,
      },
      orderBy: {
        rollNumber: "asc",
      },
    });

    // Format student data
    const students = enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
      rollNumber: enrollment.rollNumber,
      admissionId: enrollment.student.admissionId,
      class: enrollment.class.name,
      section: enrollment.section?.name,
      alreadyGraduated: !!enrollment.student.alumni,
    }));

    return {
      success: true,
      data: {
        students,
        summary: {
          total: students.length,
          eligible: students.filter((s) => !s.alreadyGraduated).length,
          alreadyGraduated: students.filter((s) => s.alreadyGraduated).length,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching students for graduation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch students",
    };
  }
}
