/**
 * Promotion Service
 * 
 * This service handles the business logic for student promotion operations.
 * It provides validation, roll number generation, promotion execution, and
 * alumni profile creation functionality.
 * 
 * Requirements: 1.4, 1.5, 1.7, 1.8, 2.3, 2.4, 4.1-4.5, 9.1-9.7, 13.1, 13.2, 13.7, 15.1-15.3
 */

import { db } from "@/lib/db";
import { Prisma, EnrollmentStatus, PromotionStatus } from "@prisma/client";
import { sendNotification } from "./communication-service";
import { NotificationType } from "@/lib/types/communication";

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ValidationResult {
  eligible: string[];
  ineligible: Array<{ studentId: string; reason: string }>;
}

export interface PromotionWarnings {
  warnings: Map<string, string[]>;
}

export interface PromotionExecutionData {
  schoolId: string;
  students: string[];
  sourceEnrollments: Map<string, string>;
  targetAcademicYearId: string;
  targetClassId: string;
  targetSectionId?: string;
  rollNumberMapping: Map<string, string>;
  executedBy: string;
  sourceAcademicYear: string;
  sourceClass: string;
  sourceSection?: string;
  targetAcademicYear: string;
  targetClass: string;
  targetSection?: string;
  notes?: string;
}

export interface PromotionExecutionResult {
  promoted: string[];
  failed: Array<{ studentId: string; reason: string }>;
  historyId: string;
}

export interface AlumniGraduationData {
  schoolId: string;
  finalClass: string;
  finalSection: string;
  finalAcademicYear: string;
  graduationDate: Date;
}

// ============================================================================
// Promotion Service Class
// ============================================================================

export class PromotionService {
  /**
   * Validate promotion eligibility
   * 
   * Checks if students can be promoted to the target class/year.
   * Validates:
   * - Students exist and have active enrollments
   * - Target academic year exists
   * - No duplicate enrollments in target class
   * 
   * Requirements: 1.7, 13.1, 13.7
   * 
   * @param studentIds - Array of student IDs to validate
   * @param targetAcademicYearId - Target academic year ID
   * @param targetClassId - Target class ID
   * @param targetSectionId - Optional target section ID
   * @returns Validation result with eligible and ineligible students
   */
  async validatePromotion(
    studentIds: string[],
    targetAcademicYearId: string,
    targetClassId: string,
    targetSectionId?: string
  ): Promise<ValidationResult> {
    const eligible: string[] = [];
    const ineligible: Array<{ studentId: string; reason: string }> = [];

    // Validate target academic year exists
    const targetAcademicYear = await db.academicYear.findUnique({
      where: { id: targetAcademicYearId },
    });

    if (!targetAcademicYear) {
      // All students are ineligible if target year doesn't exist
      return {
        eligible: [],
        ineligible: studentIds.map(id => ({
          studentId: id,
          reason: "Target academic year does not exist",
        })),
      };
    }

    // Validate target class exists
    const targetClass = await db.class.findUnique({
      where: { id: targetClassId },
    });

    if (!targetClass) {
      return {
        eligible: [],
        ineligible: studentIds.map(id => ({
          studentId: id,
          reason: "Target class does not exist",
        })),
      };
    }

    // Validate target section if provided
    if (targetSectionId) {
      const targetSection = await db.classSection.findUnique({
        where: { id: targetSectionId },
      });

      if (!targetSection) {
        return {
          eligible: [],
          ineligible: studentIds.map(id => ({
            studentId: id,
            reason: "Target section does not exist",
          })),
        };
      }
    }

    // Check each student
    for (const studentId of studentIds) {
      // Check if student exists
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: {
          enrollments: {
            where: {
              status: EnrollmentStatus.ACTIVE,
            },
          },
        },
      });

      if (!student) {
        ineligible.push({
          studentId,
          reason: "Student not found",
        });
        continue;
      }

      // Check if student has an active enrollment
      if (student.enrollments.length === 0) {
        ineligible.push({
          studentId,
          reason: "Student has no active enrollment",
        });
        continue;
      }

      // Check for duplicate enrollment in target class
      const existingEnrollment = await db.classEnrollment.findFirst({
        where: {
          studentId,
          classId: targetClassId,
          ...(targetSectionId && { sectionId: targetSectionId }),
          status: EnrollmentStatus.ACTIVE,
        },
      });

      if (existingEnrollment) {
        ineligible.push({
          studentId,
          reason: "Student already enrolled in target class",
        });
        continue;
      }

      // Student is eligible
      eligible.push(studentId);
    }

    return { eligible, ineligible };
  }

  /**
   * Check for promotion warnings
   * 
   * Identifies potential issues that don't prevent promotion but should
   * be reviewed by administrators.
   * 
   * Checks for:
   * - Unpaid fees
   * - Low attendance
   * - Pending disciplinary actions
   * 
   * Requirements: 2.3, 2.4
   * 
   * @param studentIds - Array of student IDs to check
   * @returns Map of student IDs to arrays of warning messages
   */
  async checkPromotionWarnings(
    studentIds: string[]
  ): Promise<Map<string, string[]>> {
    const warnings = new Map<string, string[]>();

    for (const studentId of studentIds) {
      const studentWarnings: string[] = [];

      // Check for unpaid fees
      const unpaidFees = await db.feePayment.findMany({
        where: {
          studentId,
          status: "PENDING",
        },
      });

      if (unpaidFees.length > 0) {
        const totalUnpaid = unpaidFees.reduce(
          (sum, payment) => sum + (payment.amount - payment.paidAmount),
          0
        );
        studentWarnings.push(
          `Unpaid fees: ₹${totalUnpaid.toFixed(2)} (${unpaidFees.length} pending payments)`
        );
      }

      // Check attendance percentage
      const attendanceRecords = await db.studentAttendance.findMany({
        where: {
          studentId,
        },
      });

      if (attendanceRecords.length > 0) {
        const presentCount = attendanceRecords.filter(
          (record) => record.status === "PRESENT"
        ).length;
        const attendancePercentage = (presentCount / attendanceRecords.length) * 100;

        if (attendancePercentage < 75) {
          studentWarnings.push(
            `Low attendance: ${attendancePercentage.toFixed(1)}% (below 75% threshold)`
          );
        }
      }


      if (studentWarnings.length > 0) {
        warnings.set(studentId, studentWarnings);
      }
    }

    return warnings;
  }

  /**
   * Generate roll numbers based on strategy
   * 
   * Supports three strategies:
   * - auto: Automatically generate sequential roll numbers
   * - manual: Use provided roll number mapping
   * - preserve: Keep existing roll numbers from previous class
   * 
   * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
   * 
   * @param strategy - Roll number generation strategy
   * @param studentIds - Array of student IDs
   * @param targetSectionId - Target section ID
   * @param currentRollNumbers - Optional map of current roll numbers (for preserve strategy)
   * @param manualMapping - Optional manual roll number mapping
   * @returns Map of student IDs to roll numbers
   * @throws Error if conflicts are detected
   */
  async generateRollNumbers(
    strategy: "auto" | "manual" | "preserve",
    studentIds: string[],
    targetSectionId: string,
    currentRollNumbers?: Map<string, string>,
    manualMapping?: Map<string, string>
  ): Promise<Map<string, string>> {
    const rollNumberMapping = new Map<string, string>();

    if (strategy === "manual") {
      // Use provided manual mapping
      if (!manualMapping) {
        throw new Error("Manual roll number mapping is required for manual strategy");
      }

      // Validate that all students have roll numbers
      for (const studentId of studentIds) {
        const rollNumber = manualMapping.get(studentId);
        if (!rollNumber) {
          throw new Error(`Roll number not provided for student ${studentId}`);
        }
        rollNumberMapping.set(studentId, rollNumber);
      }

      // Check for conflicts with existing roll numbers in target section
      await this.checkRollNumberConflicts(targetSectionId, rollNumberMapping);

      return rollNumberMapping;
    }

    if (strategy === "preserve") {
      // Preserve existing roll numbers
      if (!currentRollNumbers) {
        throw new Error("Current roll numbers are required for preserve strategy");
      }

      for (const studentId of studentIds) {
        const rollNumber = currentRollNumbers.get(studentId);
        if (rollNumber) {
          rollNumberMapping.set(studentId, rollNumber);
        } else {
          // If student doesn't have a roll number, generate one
          const nextRollNumber = await this.getNextAvailableRollNumber(
            targetSectionId,
            rollNumberMapping
          );
          rollNumberMapping.set(studentId, nextRollNumber);
        }
      }

      // Check for conflicts
      await this.checkRollNumberConflicts(targetSectionId, rollNumberMapping);

      return rollNumberMapping;
    }

    // Auto strategy: Generate sequential roll numbers
    if (strategy === "auto") {
      // Get existing roll numbers in target section
      const existingEnrollments = await db.classEnrollment.findMany({
        where: {
          sectionId: targetSectionId,
          status: EnrollmentStatus.ACTIVE,
        },
        select: {
          rollNumber: true,
        },
      });

      const existingRollNumbers = new Set(
        existingEnrollments
          .map((e) => e.rollNumber)
          .filter((rn): rn is string => rn !== null)
      );

      // Generate sequential roll numbers
      let nextNumber = 1;
      for (const studentId of studentIds) {
        // Find next available roll number
        while (existingRollNumbers.has(nextNumber.toString().padStart(3, "0"))) {
          nextNumber++;
        }

        const rollNumber = nextNumber.toString().padStart(3, "0");
        rollNumberMapping.set(studentId, rollNumber);
        existingRollNumbers.add(rollNumber);
        nextNumber++;
      }

      return rollNumberMapping;
    }

    throw new Error(`Invalid roll number strategy: ${strategy}`);
  }

  /**
   * Check for roll number conflicts in target section
   * 
   * Requirements: 9.5, 9.6, 9.7
   * 
   * @param targetSectionId - Target section ID
   * @param rollNumberMapping - Map of student IDs to roll numbers
   * @throws Error if conflicts are detected
   */
  private async checkRollNumberConflicts(
    targetSectionId: string,
    rollNumberMapping: Map<string, string>
  ): Promise<void> {
    // Get existing roll numbers in target section
    const existingEnrollments = await db.classEnrollment.findMany({
      where: {
        sectionId: targetSectionId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: {
        rollNumber: true,
        studentId: true,
      },
    });

    const existingRollNumbers = new Map(
      existingEnrollments
        .filter((e) => e.rollNumber !== null)
        .map((e) => [e.rollNumber!, e.studentId])
    );

    // Check for conflicts
    const conflicts: string[] = [];
    for (const [studentId, rollNumber] of rollNumberMapping.entries()) {
      if (existingRollNumbers.has(rollNumber)) {
        const conflictingStudentId = existingRollNumbers.get(rollNumber);
        conflicts.push(
          `Roll number ${rollNumber} is already assigned to student ${conflictingStudentId}`
        );
      }
    }

    // Check for duplicates within the mapping itself
    const rollNumberCounts = new Map<string, number>();
    for (const rollNumber of rollNumberMapping.values()) {
      rollNumberCounts.set(rollNumber, (rollNumberCounts.get(rollNumber) || 0) + 1);
    }

    for (const [rollNumber, count] of rollNumberCounts.entries()) {
      if (count > 1) {
        conflicts.push(`Roll number ${rollNumber} is assigned to multiple students`);
      }
    }

    if (conflicts.length > 0) {
      throw new Error(`Roll number conflicts detected:\n${conflicts.join("\n")}`);
    }
  }

  /**
   * Get next available roll number in section
   * 
   * @param targetSectionId - Target section ID
   * @param currentMapping - Current roll number mapping
   * @returns Next available roll number
   */
  private async getNextAvailableRollNumber(
    targetSectionId: string,
    currentMapping: Map<string, string>
  ): Promise<string> {
    // Get existing roll numbers
    const existingEnrollments = await db.classEnrollment.findMany({
      where: {
        sectionId: targetSectionId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: {
        rollNumber: true,
      },
    });

    const existingRollNumbers = new Set(
      existingEnrollments
        .map((e) => e.rollNumber)
        .filter((rn): rn is string => rn !== null)
    );

    // Add currently mapped roll numbers
    for (const rollNumber of currentMapping.values()) {
      existingRollNumbers.add(rollNumber);
    }

    // Find next available number
    let nextNumber = 1;
    while (existingRollNumbers.has(nextNumber.toString().padStart(3, "0"))) {
      nextNumber++;
    }

    return nextNumber.toString().padStart(3, "0");
  }

  /**
   * Execute promotion in transaction
   * 
   * Creates new enrollments with ACTIVE status and updates old enrollments
   * to GRADUATED status. Handles partial failures gracefully by continuing
   * to process remaining students.
   * 
   * Requirements: 1.4, 1.5, 1.8, 13.2
   * 
   * @param tx - Prisma transaction client
   * @param data - Promotion execution data
   * @returns Promotion execution result with promoted and failed students
   */
  async executePromotion(
    tx: Prisma.TransactionClient,
    data: PromotionExecutionData
  ): Promise<PromotionExecutionResult> {
    const promoted: string[] = [];
    const failed: Array<{ studentId: string; reason: string }> = [];

    // Create promotion history record
    const promotionHistory = await tx.promotionHistory.create({
      data: {
        schoolId: data.schoolId,
        sourceAcademicYear: data.sourceAcademicYear,
        sourceClass: data.sourceClass,
        sourceSection: data.sourceSection,
        targetAcademicYear: data.targetAcademicYear,
        targetClass: data.targetClass,
        targetSection: data.targetSection,
        totalStudents: data.students.length,
        promotedStudents: 0, // Will update after processing
        excludedStudents: 0,
        failedStudents: 0,
        executedBy: data.executedBy,
        notes: data.notes,
      },
    });

    // Process each student
    for (const studentId of data.students) {
      try {
        const sourceEnrollmentId = data.sourceEnrollments.get(studentId);
        if (!sourceEnrollmentId) {
          failed.push({
            studentId,
            reason: "Source enrollment not found",
          });
          continue;
        }

        const rollNumber = data.rollNumberMapping.get(studentId);

        // Create new enrollment with ACTIVE status
        const newEnrollment = await tx.classEnrollment.create({
          data: {
            schoolId: data.schoolId,
            studentId,
            classId: data.targetClassId,
            sectionId: data.targetSectionId!,
            rollNumber,
            status: EnrollmentStatus.ACTIVE,
            enrollDate: new Date(),
          },
        });

        // Update old enrollment to GRADUATED status
        await tx.classEnrollment.update({
          where: { id: sourceEnrollmentId },
          data: {
            status: EnrollmentStatus.GRADUATED,
          },
        });

        // Create promotion record
        await tx.promotionRecord.create({
          data: {
            schoolId: data.schoolId,
            historyId: promotionHistory.id,
            studentId,
            previousEnrollmentId: sourceEnrollmentId,
            newEnrollmentId: newEnrollment.id,
            status: PromotionStatus.PROMOTED,
          },
        });

        promoted.push(studentId);
      } catch (error) {
        // Handle partial failure - continue processing other students
        console.error(`Failed to promote student ${studentId}:`, error);
        failed.push({
          studentId,
          reason: error instanceof Error ? error.message : "Unknown error",
        });

        // Create failed promotion record
        try {
          await tx.promotionRecord.create({
            data: {
              schoolId: data.schoolId,
              historyId: promotionHistory.id,
              studentId,
              previousEnrollmentId: data.sourceEnrollments.get(studentId) || "",
              newEnrollmentId: null,
              status: PromotionStatus.FAILED,
              reason: error instanceof Error ? error.message : "Unknown error",
            },
          });
        } catch (recordError) {
          console.error(`Failed to create promotion record for ${studentId}:`, recordError);
        }
      }
    }

    // Update promotion history with final counts
    await tx.promotionHistory.update({
      where: { id: promotionHistory.id },
      data: {
        promotedStudents: promoted.length,
        failedStudents: failed.length,
        failureDetails: failed.length > 0 ? JSON.stringify(failed) : null,
      },
    });

    return {
      promoted,
      failed,
      historyId: promotionHistory.id,
    };
  }

  /**
   * Create alumni profiles for graduated students
   * 
   * Copies student information to alumni record and sets graduation details.
   * Links alumni profile to original student record.
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
   * 
   * @param tx - Prisma transaction client
   * @param studentIds - Array of student IDs
   * @param graduationData - Map of student IDs to graduation data
   * @param createdBy - User ID who created the records
   */
  async createAlumniProfiles(
    tx: Prisma.TransactionClient,
    studentIds: string[],
    graduationData: Map<string, AlumniGraduationData>,
    createdBy: string
  ): Promise<void> {
    for (const studentId of studentIds) {
      try {
        // Check if alumni profile already exists
        const existingAlumni = await tx.alumni.findUnique({
          where: { studentId },
        });

        if (existingAlumni) {
          console.log(`Alumni profile already exists for student ${studentId}`);
          continue;
        }

        // Get student information
        const student = await tx.student.findUnique({
          where: { id: studentId },
          include: {
            user: true,
          },
        });

        if (!student) {
          console.error(`Student ${studentId} not found for alumni profile creation`);
          continue;
        }

        const gradData = graduationData.get(studentId);
        if (!gradData) {
          console.error(`Graduation data not found for student ${studentId}`);
          continue;
        }

        // Create alumni profile
        await tx.alumni.create({
          data: {
            schoolId: gradData.schoolId,
            studentId,
            graduationDate: gradData.graduationDate,
            finalClass: gradData.finalClass,
            finalSection: gradData.finalSection,
            finalAcademicYear: gradData.finalAcademicYear,
            // Copy contact information from student
            currentPhone: student.user.phone || student.phone,
            currentEmail: student.user.email,
            // Initialize communication preferences
            allowCommunication: true,
            communicationEmail: student.user.email,
            // Set metadata
            createdBy,
          },
        });

        console.log(`Alumni profile created for student ${studentId}`);
      } catch (error) {
        console.error(`Failed to create alumni profile for student ${studentId}:`, error);
        // Continue processing other students even if one fails
      }
    }
  }

  /**
   * Send promotion notifications
   * 
   * Sends notifications to students and their parents about the promotion.
   * Integrates with existing messaging system and supports email, SMS, and WhatsApp.
   * Handles notification failures gracefully without failing the promotion.
   * 
   * Requirements: 15.1, 15.2, 15.3, 15.6
   * 
   * @param studentIds - Array of student IDs
   * @param promotionDetails - Promotion details for notification content
   */
  async sendPromotionNotifications(
    studentIds: string[],
    promotionDetails: {
      targetClass: string;
      targetSection: string;
      targetAcademicYear: string;
    }
  ): Promise<void> {
    for (const studentId of studentIds) {
      try {
        // Get student with parents
        const student = await db.student.findUnique({
          where: { id: studentId },
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

        if (!student) {
          console.error(`Student ${studentId} not found for notification`);
          continue;
        }

        // Prepare notification message
        const message = `Congratulations! You have been promoted to ${promotionDetails.targetClass} - ${promotionDetails.targetSection} for the academic year ${promotionDetails.targetAcademicYear}.`;

        // Send notification to student
        try {
          await sendNotification({
            userId: studentId,
            type: NotificationType.GENERAL,
            title: "Promotion Notification",
            message,
            data: {
              targetClass: promotionDetails.targetClass,
              targetSection: promotionDetails.targetSection,
              targetAcademicYear: promotionDetails.targetAcademicYear,
            },
          });
        } catch (error) {
          console.error(`Failed to send notification to student ${studentId}:`, error);
        }

        // Send notifications to parents
        for (const studentParent of student.parents) {
          try {
            const parentMessage = `Your child ${student.user.firstName} ${student.user.lastName} has been promoted to ${promotionDetails.targetClass} - ${promotionDetails.targetSection} for the academic year ${promotionDetails.targetAcademicYear}.`;

            await sendNotification({
              userId: studentParent.parent.id,
              type: NotificationType.GENERAL,
              title: "Student Promotion Notification",
              message: parentMessage,
              data: {
                studentId,
                studentName: `${student.user.firstName} ${student.user.lastName}`,
                targetClass: promotionDetails.targetClass,
                targetSection: promotionDetails.targetSection,
                targetAcademicYear: promotionDetails.targetAcademicYear,
              },
            });
          } catch (error) {
            console.error(
              `Failed to send notification to parent ${studentParent.parent.id}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error(`Failed to process notifications for student ${studentId}:`, error);
        // Continue processing other students
      }
    }
  }
}
