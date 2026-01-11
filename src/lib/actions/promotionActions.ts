"use server";

/**
 * Promotion Server Actions
 * 
 * This file contains server actions for student promotion operations.
 * All actions include authentication and authorization checks.
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 8.1-8.6, 14.1, 14.4, 14.5
 */

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { UserRole, EnrollmentStatus, AuditAction } from "@prisma/client";
import { PromotionService } from "@/lib/services/promotionService";
import { logAudit } from "@/lib/utils/audit-log";
import {
  getStudentsForPromotionSchema,
  promotionPreviewSchema,
  bulkPromotionSchema,
  promotionHistoryFiltersSchema,
  promotionDetailsSchema,
  promotionRollbackSchema,
  type GetStudentsForPromotionInput,
  type PromotionPreviewInput,
  type BulkPromotionInput,
  type PromotionHistoryFiltersInput,
  type PromotionDetailsInput,
  type PromotionRollbackInput,
} from "@/lib/schemas/promotionSchemas";

// ============================================================================
// Types
// ============================================================================

export type PromotionPreviewResult = {
  success: boolean;
  data?: {
    students: Array<{
      id: string;
      name: string;
      rollNumber: string | null;
      admissionId: string;
      warnings: string[];
    }>;
    summary: {
      total: number;
      eligible: number;
      withWarnings: number;
    };
  };
  error?: string;
};

export type PromotionExecutionResult = {
  success: boolean;
  data?: {
    historyId: string;
    summary: {
      total: number;
      promoted: number;
      excluded: number;
      failed: number;
    };
    failures: Array<{
      studentId: string;
      studentName: string;
      reason: string;
    }>;
  };
  error?: string;
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

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get students eligible for promotion from a class/section
 * 
 * Requirements: 1.1, 14.1, 14.5
 * 
 * @param input - Class and section filters
 * @returns List of students with active enrollments
 */
export async function getStudentsForPromotion(
  input: GetStudentsForPromotionInput
): Promise<PromotionPreviewResult> {
  try {
    // Authentication and authorization check
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = getStudentsForPromotionSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { classId, sectionId, academicYearId } = validation.data;

    // Build query filters
    const enrollmentFilters: any = {
      classId,
      status: EnrollmentStatus.ACTIVE,
    };

    if (sectionId) {
      enrollmentFilters.sectionId = sectionId;
    }

    if (academicYearId) {
      enrollmentFilters.class = {
        academicYearId,
      };
    }

    // Fetch students with active enrollments
    const enrollments = await db.classEnrollment.findMany({
      where: enrollmentFilters,
      include: {
        student: {
          include: {
            user: true,
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
      warnings: [], // Will be populated in preview
    }));

    return {
      success: true,
      data: {
        students,
        summary: {
          total: students.length,
          eligible: students.length,
          withWarnings: 0,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching students for promotion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch students",
    };
  }
}

/**
 * Preview promotion with validation and warnings
 * 
 * Requirements: 2.1, 2.2, 14.1, 14.5
 * 
 * @param input - Promotion configuration
 * @returns Preview with warnings and validation results
 */
export async function previewPromotion(
  input: PromotionPreviewInput
): Promise<PromotionPreviewResult> {
  try {
    // Authentication and authorization check
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = promotionPreviewSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    const {
      studentIds,
      targetAcademicYearId,
      targetClassId,
      targetSectionId,
    } = validation.data;

    // Initialize promotion service
    const promotionService = new PromotionService();

    // Validate promotion eligibility
    const validationResult = await promotionService.validatePromotion(
      studentIds,
      targetAcademicYearId,
      targetClassId,
      targetSectionId
    );

    // Check for warnings
    const warningsMap = await promotionService.checkPromotionWarnings(
      validationResult.eligible
    );

    // Fetch student details
    const students = await db.student.findMany({
      where: {
        id: { in: studentIds },
      },
      include: {
        user: true,
        enrollments: {
          where: {
            status: EnrollmentStatus.ACTIVE,
          },
        },
      },
    });

    // Format student data with warnings
    const studentData = students.map((student) => {
      const enrollment = student.enrollments[0];
      const warnings = warningsMap.get(student.id) || [];

      // Add ineligibility reason if student is not eligible
      const ineligible = validationResult.ineligible.find(
        (i) => i.studentId === student.id
      );
      if (ineligible) {
        warnings.push(`Ineligible: ${ineligible.reason}`);
      }

      return {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: enrollment?.rollNumber || null,
        admissionId: student.admissionId,
        warnings,
      };
    });

    const withWarnings = studentData.filter((s) => s.warnings.length > 0).length;

    return {
      success: true,
      data: {
        students: studentData,
        summary: {
          total: studentIds.length,
          eligible: validationResult.eligible.length,
          withWarnings,
        },
      },
    };
  } catch (error) {
    console.error("Error previewing promotion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to preview promotion",
    };
  }
}

/**
 * Execute bulk promotion
 * 
 * Creates new enrollments, updates old enrollments to GRADUATED status,
 * creates alumni profiles, and sends notifications.
 * 
 * Requirements: 1.3, 1.4, 1.5, 1.6, 8.1, 8.2, 8.3, 14.4
 * 
 * @param input - Promotion execution configuration
 * @returns Execution results with success/failure counts
 */
export async function executeBulkPromotion(
  input: BulkPromotionInput
): Promise<PromotionExecutionResult> {
  try {
    // Authentication and authorization check
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = bulkPromotionSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    const {
      sourceClassId,
      sourceSectionId,
      sourceAcademicYearId,
      targetAcademicYearId,
      targetClassId,
      targetSectionId,
      studentIds,
      excludedStudents,
      rollNumberStrategy,
      rollNumberMapping,
      sendNotifications,
      notes,
    } = validation.data;

    // Filter out excluded students
    const excludedIds = new Set(excludedStudents.map((e) => e.studentId));
    const studentsToPromote = studentIds.filter((id) => !excludedIds.has(id));

    if (studentsToPromote.length === 0) {
      return {
        success: false,
        error: "No students to promote after exclusions",
      };
    }

    // Initialize promotion service
    const promotionService = new PromotionService();

    // Validate promotion
    const validationResult = await promotionService.validatePromotion(
      studentsToPromote,
      targetAcademicYearId,
      targetClassId,
      targetSectionId
    );

    if (validationResult.eligible.length === 0) {
      return {
        success: false,
        error: "No eligible students for promotion",
      };
    }

    // Get source enrollments
    const sourceEnrollments = await db.classEnrollment.findMany({
      where: {
        studentId: { in: validationResult.eligible },
        classId: sourceClassId,
        ...(sourceSectionId && { sectionId: sourceSectionId }),
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
    });

    const sourceEnrollmentMap = new Map(
      sourceEnrollments.map((e) => [e.studentId, e.id])
    );

    // Get current roll numbers for preserve strategy
    const currentRollNumbers = new Map(
      sourceEnrollments.map((e) => [e.studentId, e.rollNumber || ""])
    );

    // Generate roll numbers
    let rollNumbers: Map<string, string>;
    try {
      if (rollNumberStrategy === "manual" && rollNumberMapping) {
        rollNumbers = new Map(Object.entries(rollNumberMapping));
      } else {
        rollNumbers = await promotionService.generateRollNumbers(
          rollNumberStrategy,
          validationResult.eligible,
          targetSectionId ?? "",
          rollNumberStrategy === "preserve" ? currentRollNumbers : undefined
        );
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate roll numbers",
      };
    }

    // Get class and academic year details for history
    const sourceClass = await db.class.findUnique({
      where: { id: sourceClassId },
      include: { academicYear: true },
    });

    const targetClass = await db.class.findUnique({
      where: { id: targetClassId },
    });

    const targetAcademicYear = await db.academicYear.findUnique({
      where: { id: targetAcademicYearId },
    });

    const targetSection = await db.classSection.findUnique({
      where: { id: targetSectionId },
    });

    if (!sourceClass || !targetClass || !targetAcademicYear || !targetSection) {
      return {
        success: false,
        error: "Invalid class or academic year configuration",
      };
    }

    // Execute promotion in transaction
    const result = await db.$transaction(async (tx) => {
      const executionData = {
        students: validationResult.eligible,
        sourceEnrollments: sourceEnrollmentMap,
        targetAcademicYearId,
        targetClassId,
        targetSectionId,
        rollNumberMapping: rollNumbers,
        executedBy: authCheck.userId!,
        sourceAcademicYear: sourceClass.academicYear.name,
        sourceClass: sourceClass.name,
        sourceSection: sourceEnrollments[0]?.section?.name,
        targetAcademicYear: targetAcademicYear.name,
        targetClass: targetClass.name,
        targetSection: targetSection.name,
        notes,
      };

      const promotionResult = await promotionService.executePromotion(
        tx,
        executionData
      );

      // Create alumni profiles for promoted students
      const graduationData = new Map(
        promotionResult.promoted.map((studentId) => [
          studentId,
          {
            finalClass: sourceClass.name,
            finalSection: sourceEnrollments.find((e) => e.studentId === studentId)?.section?.name || "",
            finalAcademicYear: sourceClass.academicYear.name,
            graduationDate: new Date(),
          },
        ])
      );

      await promotionService.createAlumniProfiles(
        tx,
        promotionResult.promoted,
        graduationData,
        authCheck.userId!
      );

      return promotionResult;
    });

    // Send notifications (non-blocking)
    if (sendNotifications && result.promoted.length > 0) {
      promotionService.sendPromotionNotifications(
        result.promoted,
        {
          targetClass: targetClass.name,
          targetSection: targetSection.name,
          targetAcademicYear: targetAcademicYear.name,
        }
      ).catch((error) => {
        console.error("Failed to send notifications:", error);
      });
    }

    // Log audit event for bulk promotion
    await logAudit({
      userId: authCheck.userId!,
      action: AuditAction.CREATE,
      resource: "PROMOTION",
      resourceId: result.historyId,
      changes: {
        operation: "BULK_PROMOTION",
        sourceClass: sourceClass.name,
        sourceSection: sourceEnrollments[0]?.section?.name,
        sourceAcademicYear: sourceClass.academicYear.name,
        targetClass: targetClass.name,
        targetSection: targetSection.name,
        targetAcademicYear: targetAcademicYear.name,
        totalStudents: studentIds.length,
        promoted: result.promoted.length,
        excluded: excludedStudents.length,
        failed: result.failed.length,
        rollNumberStrategy,
        notificationsEnabled: sendNotifications,
      },
    });

    // Fetch student names for failures
    const failedStudents = await db.student.findMany({
      where: {
        id: { in: result.failed.map((f) => f.studentId) },
      },
      include: {
        user: true,
      },
    });

    const failures = result.failed.map((f) => {
      const student = failedStudents.find((s) => s.id === f.studentId);
      return {
        studentId: f.studentId,
        studentName: student
          ? `${student.user.firstName} ${student.user.lastName}`
          : "Unknown",
        reason: f.reason,
      };
    });

    // Revalidate paths
    revalidatePath("/admin/academic/promotion");
    revalidatePath("/admin/academic/promotion/history");
    revalidatePath("/admin/alumni");

    return {
      success: true,
      data: {
        historyId: result.historyId,
        summary: {
          total: studentIds.length,
          promoted: result.promoted.length,
          excluded: excludedStudents.length,
          failed: result.failed.length,
        },
        failures,
      },
    };
  } catch (error) {
    console.error("Error executing bulk promotion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute promotion",
    };
  }
}

/**
 * Get promotion history with filters
 * 
 * Requirements: 8.4, 8.5
 * 
 * @param filters - Optional filters for history
 * @returns Paginated promotion history
 */
export async function getPromotionHistory(
  filters?: PromotionHistoryFiltersInput
) {
  try {
    // Authentication and authorization check
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = filters
      ? promotionHistoryFiltersSchema.safeParse(filters)
      : { success: true as const, data: { page: 1, pageSize: 20 } };

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e: any) => e.message).join(", "),
      };
    }

    const {
      academicYear,
      classId,
      startDate,
      endDate,
      page,
      pageSize,
    } = validation.data as any;

    // Build query filters
    const whereFilters: any = {};

    if (academicYear) {
      whereFilters.OR = [
        { sourceAcademicYear: { contains: academicYear, mode: "insensitive" } },
        { targetAcademicYear: { contains: academicYear, mode: "insensitive" } },
      ];
    }

    if (classId) {
      // Get class name
      const classData = await db.class.findUnique({
        where: { id: classId },
        select: { name: true },
      });

      if (classData) {
        whereFilters.OR = [
          ...(whereFilters.OR || []),
          { sourceClass: classData.name },
          { targetClass: classData.name },
        ];
      }
    }

    if (startDate || endDate) {
      whereFilters.executedAt = {};
      if (startDate) {
        whereFilters.executedAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereFilters.executedAt.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await db.promotionHistory.count({
      where: whereFilters,
    });

    // Fetch promotion history
    const history = await db.promotionHistory.findMany({
      where: whereFilters,
      include: {
        records: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        executedAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get executor names
    const executorIds = [...new Set(history.map((h) => h.executedBy))];
    const executors = await db.user.findMany({
      where: {
        id: { in: executorIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const executorMap = new Map(
      executors.map((e) => [e.id, `${e.firstName} ${e.lastName}`])
    );

    // Format history data
    const formattedHistory = history.map((h) => ({
      id: h.id,
      sourceAcademicYear: h.sourceAcademicYear,
      sourceClass: h.sourceClass,
      sourceSection: h.sourceSection,
      targetAcademicYear: h.targetAcademicYear,
      targetClass: h.targetClass,
      targetSection: h.targetSection,
      totalStudents: h.totalStudents,
      promotedStudents: h.promotedStudents,
      excludedStudents: h.excludedStudents,
      failedStudents: h.failedStudents,
      executedAt: h.executedAt,
      executedBy: executorMap.get(h.executedBy) || "Unknown",
      notes: h.notes,
    }));

    // Log audit event for viewing promotion history
    await logAudit({
      userId: authCheck.userId!,
      action: AuditAction.VIEW,
      resource: "PROMOTION_HISTORY",
      changes: {
        operation: "VIEW_PROMOTION_HISTORY",
        filters: {
          academicYear,
          classId,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
        resultCount: formattedHistory.length,
      },
    });

    return {
      success: true,
      data: {
        history: formattedHistory,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching promotion history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch promotion history",
    };
  }
}

/**
 * Get detailed promotion record
 * 
 * Requirements: 8.5
 * 
 * @param input - History ID
 * @returns Detailed promotion information including student list
 */
export async function getPromotionDetails(
  input: PromotionDetailsInput
) {
  try {
    // Authentication and authorization check
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = promotionDetailsSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { historyId } = validation.data;

    // Fetch promotion history
    const history = await db.promotionHistory.findUnique({
      where: { id: historyId },
      include: {
        records: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!history) {
      return {
        success: false,
        error: "Promotion history not found",
      };
    }

    // Get executor name
    const executor = await db.user.findUnique({
      where: { id: history.executedBy },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    // Format student records
    const students = history.records.map((record) => ({
      id: record.student.id,
      name: `${record.student.user.firstName} ${record.student.user.lastName}`,
      admissionId: record.student.admissionId,
      status: record.status,
      reason: record.reason,
      previousEnrollmentId: record.previousEnrollmentId,
      newEnrollmentId: record.newEnrollmentId,
    }));

    // Parse failure details if available
    let failureDetails = [];
    if (history.failureDetails) {
      try {
        failureDetails = JSON.parse(history.failureDetails);
      } catch (error) {
        console.error("Failed to parse failure details:", error);
      }
    }

    // Parse excluded list if available
    let excludedList = [];
    if (history.excludedList) {
      try {
        excludedList = JSON.parse(history.excludedList);
      } catch (error) {
        console.error("Failed to parse excluded list:", error);
      }
    }

    // Log audit event for viewing promotion details
    await logAudit({
      userId: authCheck.userId!,
      action: AuditAction.VIEW,
      resource: "PROMOTION_HISTORY",
      resourceId: historyId,
      changes: {
        operation: "VIEW_PROMOTION_DETAILS",
        studentCount: students.length,
      },
    });

    return {
      success: true,
      data: {
        id: history.id,
        sourceAcademicYear: history.sourceAcademicYear,
        sourceClass: history.sourceClass,
        sourceSection: history.sourceSection,
        targetAcademicYear: history.targetAcademicYear,
        targetClass: history.targetClass,
        targetSection: history.targetSection,
        totalStudents: history.totalStudents,
        promotedStudents: history.promotedStudents,
        excludedStudents: history.excludedStudents,
        failedStudents: history.failedStudents,
        executedAt: history.executedAt,
        executedBy: executor
          ? `${executor.firstName} ${executor.lastName}`
          : "Unknown",
        notes: history.notes,
        students,
        failureDetails,
        excludedList,
      },
    };
  } catch (error) {
    console.error("Error fetching promotion details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch promotion details",
    };
  }
}

/**
 * Export promotion history to PDF or Excel
 * 
 * Requirements: 8.6
 * 
 * @param filters - Optional filters for history
 * @param format - Export format (pdf or excel)
 * @returns Export data for client-side generation
 */
export async function exportPromotionHistory(
  filters?: PromotionHistoryFiltersInput,
  format: "pdf" | "excel" = "excel"
) {
  try {
    // Authentication and authorization check
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = filters
      ? promotionHistoryFiltersSchema.safeParse(filters)
      : { success: true as const, data: { page: 1, pageSize: 1000 } }; // Large page size for export

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e: any) => e.message).join(", "),
      };
    }

    const {
      academicYear,
      classId,
      startDate,
      endDate,
    } = validation.data as any;

    // Build query filters
    const whereFilters: any = {};

    if (academicYear) {
      whereFilters.OR = [
        { sourceAcademicYear: { contains: academicYear, mode: "insensitive" } },
        { targetAcademicYear: { contains: academicYear, mode: "insensitive" } },
      ];
    }

    if (classId) {
      // Get class name
      const classData = await db.class.findUnique({
        where: { id: classId },
        select: { name: true },
      });

      if (classData) {
        whereFilters.OR = [
          ...(whereFilters.OR || []),
          { sourceClass: classData.name },
          { targetClass: classData.name },
        ];
      }
    }

    if (startDate || endDate) {
      whereFilters.executedAt = {};
      if (startDate) {
        whereFilters.executedAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereFilters.executedAt.lte = new Date(endDate);
      }
    }

    // Fetch all promotion history (no pagination for export)
    const history = await db.promotionHistory.findMany({
      where: whereFilters,
      orderBy: {
        executedAt: "desc",
      },
    });

    // Get executor names
    const executorIds = [...new Set(history.map((h) => h.executedBy))];
    const executors = await db.user.findMany({
      where: {
        id: { in: executorIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const executorMap = new Map(
      executors.map((e) => [e.id, `${e.firstName} ${e.lastName}`])
    );

    // Format data for export
    const exportData = history.map((h) => ({
      "Promotion ID": h.id,
      "Source Academic Year": h.sourceAcademicYear,
      "Source Class": h.sourceClass,
      "Source Section": h.sourceSection || "N/A",
      "Target Academic Year": h.targetAcademicYear,
      "Target Class": h.targetClass,
      "Target Section": h.targetSection || "N/A",
      "Total Students": h.totalStudents,
      "Promoted": h.promotedStudents,
      "Excluded": h.excludedStudents,
      "Failed": h.failedStudents,
      "Executed At": h.executedAt.toLocaleString(),
      "Executed By": executorMap.get(h.executedBy) || "Unknown",
      "Notes": h.notes || "N/A",
    }));

    // Log audit event for export
    await logAudit({
      userId: authCheck.userId!,
      action: AuditAction.EXPORT,
      resource: "PROMOTION_HISTORY",
      changes: {
        operation: "EXPORT_PROMOTION_HISTORY",
        format,
        filters: {
          academicYear,
          classId,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
        recordCount: exportData.length,
      },
    });

    return {
      success: true,
      data: {
        exportData,
        format,
        filename: `promotion-history-${new Date().toISOString().split("T")[0]}`,
        title: "Promotion History Report",
        subtitle: `Generated on ${new Date().toLocaleString()}`,
      },
    };
  } catch (error) {
    console.error("Error exporting promotion history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export promotion history",
    };
  }
}

/**
 * Rollback a promotion (admin only, within 24 hours)
 * 
 * Reverses a promotion by:
 * - Deleting new enrollments
 * - Restoring old enrollments to ACTIVE status
 * - Deleting alumni profiles created during promotion
 * 
 * Requirements: 8.6
 * 
 * @param input - History ID and reason
 * @returns Rollback result
 */
export async function rollbackPromotion(
  input: PromotionRollbackInput
) {
  try {
    // Authentication and authorization check
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Unauthorized" };
    }

    // Validate input
    const validation = promotionRollbackSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { historyId, reason } = validation.data;

    // Fetch promotion history
    const history = await db.promotionHistory.findUnique({
      where: { id: historyId },
      include: {
        records: {
          where: {
            status: "PROMOTED",
          },
        },
      },
    });

    if (!history) {
      return {
        success: false,
        error: "Promotion history not found",
      };
    }

    // Check if promotion is within 24 hours
    const hoursSincePromotion =
      (Date.now() - history.executedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSincePromotion > 24) {
      return {
        success: false,
        error: "Promotion can only be rolled back within 24 hours of execution",
      };
    }

    // Execute rollback in transaction
    await db.$transaction(async (tx) => {
      // Process each promoted student
      for (const record of history.records) {
        // Delete new enrollment
        if (record.newEnrollmentId) {
          await tx.classEnrollment.delete({
            where: { id: record.newEnrollmentId },
          });
        }

        // Restore old enrollment to ACTIVE status
        await tx.classEnrollment.update({
          where: { id: record.previousEnrollmentId },
          data: {
            status: EnrollmentStatus.ACTIVE,
          },
        });

        // Delete alumni profile if created
        try {
          await tx.alumni.delete({
            where: { studentId: record.studentId },
          });
        } catch (error) {
          // Alumni profile might not exist, continue
          console.log(`No alumni profile found for student ${record.studentId}`);
        }

        // Update promotion record status
        await tx.promotionRecord.update({
          where: { id: record.id },
          data: {
            status: "FAILED",
            reason: `Rolled back: ${reason}`,
          },
        });
      }

      // Update promotion history
      await tx.promotionHistory.update({
        where: { id: historyId },
        data: {
          notes: `${history.notes || ""}\n\nROLLBACK: ${reason} (by ${authCheck.userId} at ${new Date().toISOString()})`,
          promotedStudents: 0,
          failedStudents: history.promotedStudents,
        },
      });
    });

    // Log audit event for promotion rollback
    await logAudit({
      userId: authCheck.userId!,
      action: AuditAction.DELETE,
      resource: "PROMOTION",
      resourceId: historyId,
      changes: {
        operation: "PROMOTION_ROLLBACK",
        reason,
        studentsAffected: history.records.length,
        sourceClass: history.sourceClass,
        targetClass: history.targetClass,
        executedAt: history.executedAt.toISOString(),
      },
    });

    // Revalidate paths
    revalidatePath("/admin/academic/promotion");
    revalidatePath("/admin/academic/promotion/history");
    revalidatePath("/admin/alumni");

    return {
      success: true,
      data: {
        message: "Promotion rolled back successfully",
        studentsAffected: history.records.length,
      },
    };
  } catch (error) {
    console.error("Error rolling back promotion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to rollback promotion",
    };
  }
}
