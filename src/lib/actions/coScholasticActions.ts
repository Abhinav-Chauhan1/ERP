"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSchoolAccess } from "@/lib/auth/tenant";

export interface CoScholasticActivityInput {
  name: string;
  assessmentType: "GRADE" | "MARKS";
  maxMarks?: number;
  isActive?: boolean;
}

export interface CoScholasticGradeInput {
  activityId: string;
  studentId: string;
  termId: string;
  grade?: string;
  marks?: number;
  remarks?: string;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all co-scholastic activities
 */
export async function getCoScholasticActivities(includeInactive = false): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const activities = await db.coScholasticActivity.findMany({
      where: {
        schoolId,
        ...(includeInactive ? {} : { isActive: true })
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            grades: true,
          },
        },
      },
    });

    return { success: true, data: activities };
  } catch (error) {
    console.error("Error fetching co-scholastic activities:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch co-scholastic activities",
    };
  }
}

/**
 * Get a single co-scholastic activity
 */
export async function getCoScholasticActivity(id: string): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const activity = await db.coScholasticActivity.findUnique({
      where: { id, schoolId },
      include: {
        _count: {
          select: {
            grades: true,
          },
        },
      },
    });

    if (!activity) {
      return { success: false, error: "Activity not found" };
    }

    return { success: true, data: activity };
  } catch (error) {
    console.error("Error fetching co-scholastic activity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch co-scholastic activity",
    };
  }
}

/**
 * Create a new co-scholastic activity
 */
export async function createCoScholasticActivity(input: CoScholasticActivityInput): Promise<ActionResult> {
  try {
    // Validate input
    if (!input.name || input.name.trim() === "") {
      return { success: false, error: "Activity name is required" };
    }

    if (!input.assessmentType || !["GRADE", "MARKS"].includes(input.assessmentType)) {
      return { success: false, error: "Valid assessment type is required (GRADE or MARKS)" };
    }

    if (input.assessmentType === "MARKS" && (!input.maxMarks || input.maxMarks <= 0)) {
      return { success: false, error: "Maximum marks must be greater than 0 for marks-based assessment" };
    }

    // Check for duplicate name
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const existing = await db.coScholasticActivity.findFirst({
      where: {
        schoolId,
        name: {
          equals: input.name.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      return { success: false, error: "An activity with this name already exists" };
    }

    const activity = await db.coScholasticActivity.create({
      data: {
        schoolId,
        name: input.name.trim(),
        assessmentType: input.assessmentType,
        maxMarks: input.assessmentType === "MARKS" ? input.maxMarks : null,
        isActive: input.isActive !== undefined ? input.isActive : true,
      },
    });

    revalidatePath("/admin/assessment/co-scholastic");

    return { success: true, data: activity };
  } catch (error) {
    console.error("Error creating co-scholastic activity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create co-scholastic activity",
    };
  }
}

/**
 * Update a co-scholastic activity
 */
export async function updateCoScholasticActivity(id: string, input: CoScholasticActivityInput): Promise<ActionResult> {
  try {
    // Validate input
    if (!input.name || input.name.trim() === "") {
      return { success: false, error: "Activity name is required" };
    }

    if (!input.assessmentType || !["GRADE", "MARKS"].includes(input.assessmentType)) {
      return { success: false, error: "Valid assessment type is required (GRADE or MARKS)" };
    }

    if (input.assessmentType === "MARKS" && (!input.maxMarks || input.maxMarks <= 0)) {
      return { success: false, error: "Maximum marks must be greater than 0 for marks-based assessment" };
    }

    // Check if activity exists
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const existing = await db.coScholasticActivity.findUnique({
      where: { id, schoolId },
    });

    if (!existing) {
      return { success: false, error: "Activity not found" };
    }

    // Check for duplicate name (excluding current activity)
    const duplicate = await db.coScholasticActivity.findFirst({
      where: {
        schoolId,
        name: {
          equals: input.name.trim(),
          mode: 'insensitive',
        },
        id: {
          not: id,
        },
      },
    });

    if (duplicate) {
      return { success: false, error: "An activity with this name already exists" };
    }

    const activity = await db.coScholasticActivity.update({
      where: { id, schoolId },
      data: {
        name: input.name.trim(),
        assessmentType: input.assessmentType,
        maxMarks: input.assessmentType === "MARKS" ? input.maxMarks : null,
        isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
      },
    });

    revalidatePath("/admin/assessment/co-scholastic");

    return { success: true, data: activity };
  } catch (error) {
    console.error("Error updating co-scholastic activity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update co-scholastic activity",
    };
  }
}

/**
 * Delete a co-scholastic activity
 */
export async function deleteCoScholasticActivity(id: string): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    // Check if activity has any grades
    const gradeCount = await db.coScholasticGrade.count({
      where: { activityId: id }, // Grades inherit scope via activity/student usually
    });

    if (gradeCount > 0) {
      return {
        success: false,
        error: `Cannot delete activity with ${gradeCount} existing grade(s). Consider deactivating instead.`,
      };
    }

    await db.coScholasticActivity.delete({
      where: { id, schoolId },
    });

    revalidatePath("/admin/assessment/co-scholastic");

    return { success: true };
  } catch (error) {
    console.error("Error deleting co-scholastic activity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete co-scholastic activity",
    };
  }
}

/**
 * Toggle activity active status
 */
export async function toggleCoScholasticActivityStatus(id: string): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const activity = await db.coScholasticActivity.findUnique({
      where: { id, schoolId },
    });

    if (!activity) {
      return { success: false, error: "Activity not found" };
    }

    const updated = await db.coScholasticActivity.update({
      where: { id, schoolId },
      data: {
        isActive: !activity.isActive,
      },
    });

    revalidatePath("/admin/assessment/co-scholastic");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error toggling activity status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle activity status",
    };
  }
}

/**
 * Get co-scholastic grades for a student and term
 */
export async function getCoScholasticGrades(studentId: string, termId: string): Promise<ActionResult> {
  try {
    const grades = await db.coScholasticGrade.findMany({
      where: {
        studentId,
        termId,
      },
      include: {
        activity: true,
      },
      orderBy: {
        activity: {
          name: 'asc',
        },
      },
    });

    return { success: true, data: grades };
  } catch (error) {
    console.error("Error fetching co-scholastic grades:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch co-scholastic grades",
    };
  }
}

/**
 * Get co-scholastic grades for a class and term
 */
export async function getCoScholasticGradesByClass(
  classId: string,
  sectionId: string,
  termId: string,
  activityId?: string
): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    // Get all students in the class/section
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId,
        sectionId,
        status: 'ACTIVE',
        schoolId, // redundant if class/section scoped, but safer
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
      orderBy: {
        rollNumber: 'asc',
      },
    });

    // Get grades for these students
    const studentIds = enrollments.map(e => e.studentId);

    const grades = await db.coScholasticGrade.findMany({
      where: {
        studentId: { in: studentIds },
        termId,
        ...(activityId && { activityId }),
      },
      include: {
        activity: true,
      },
    });

    // Get all activities
    const activities = await db.coScholasticActivity.findMany({
      where: {
        schoolId,
        isActive: true,
        ...(activityId && { id: activityId }),
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: {
        enrollments,
        grades,
        activities,
      },
    };
  } catch (error) {
    console.error("Error fetching co-scholastic grades by class:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch co-scholastic grades",
    };
  }
}

/**
 * Save or update a co-scholastic grade
 */
export async function saveCoScholasticGrade(input: CoScholasticGradeInput): Promise<ActionResult> {
  try {
    // Validate input
    if (!input.activityId || !input.studentId || !input.termId) {
      return { success: false, error: "Activity, student, and term are required" };
    }

    // Get activity to check assessment type
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const activity = await db.coScholasticActivity.findUnique({
      where: { id: input.activityId, schoolId },
    });

    if (!activity) {
      return { success: false, error: "Activity not found" };
    }

    // Validate based on assessment type
    if (activity.assessmentType === "GRADE") {
      if (!input.grade || input.grade.trim() === "") {
        return { success: false, error: "Grade is required for grade-based assessment" };
      }
    } else if (activity.assessmentType === "MARKS") {
      if (input.marks === undefined || input.marks === null) {
        return { success: false, error: "Marks are required for marks-based assessment" };
      }
      if (input.marks < 0) {
        return { success: false, error: "Marks cannot be negative" };
      }
      if (activity.maxMarks && input.marks > activity.maxMarks) {
        return { success: false, error: `Marks cannot exceed maximum marks (${activity.maxMarks})` };
      }
    }

    // Check if grade already exists
    const existing = await db.coScholasticGrade.findUnique({
      where: {
        activityId_studentId_termId: {
          activityId: input.activityId,
          studentId: input.studentId,
          termId: input.termId,
        },
      },
    });

    let grade;
    if (existing) {
      // Update existing grade
      grade = await db.coScholasticGrade.update({
        where: { id: existing.id },
        data: {
          grade: activity.assessmentType === "GRADE" ? input.grade?.trim() : null,
          marks: activity.assessmentType === "MARKS" ? input.marks : null,
          remarks: input.remarks?.trim() || null,
        },
        include: {
          activity: true,
        },
      });
    } else {
      // Create new grade
      grade = await db.coScholasticGrade.create({
        data: {
          schoolId,
          activityId: input.activityId,
          studentId: input.studentId,
          termId: input.termId,
          grade: activity.assessmentType === "GRADE" ? input.grade?.trim() : null,
          marks: activity.assessmentType === "MARKS" ? input.marks : null,
          remarks: input.remarks?.trim() || null,
        },
        include: {
          activity: true,
        },
      });
    }

    revalidatePath("/admin/assessment/co-scholastic");

    return { success: true, data: grade };
  } catch (error) {
    console.error("Error saving co-scholastic grade:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save co-scholastic grade",
    };
  }
}

/**
 * Save multiple co-scholastic grades in bulk
 */
export async function saveCoScholasticGradesBulk(grades: CoScholasticGradeInput[]): Promise<ActionResult> {
  try {
    if (!grades || grades.length === 0) {
      return { success: false, error: "No grades provided" };
    }

    const results = [];
    const errors = [];

    for (const gradeInput of grades) {
      const result = await saveCoScholasticGrade(gradeInput);
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          studentId: gradeInput.studentId,
          activityId: gradeInput.activityId,
          error: result.error,
        });
      }
    }

    revalidatePath("/admin/assessment/co-scholastic");

    return {
      success: errors.length === 0,
      data: {
        saved: results.length,
        failed: errors.length,
        errors,
      },
    };
  } catch (error) {
    console.error("Error saving co-scholastic grades in bulk:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save co-scholastic grades",
    };
  }
}

/**
 * Delete a co-scholastic grade
 */
export async function deleteCoScholasticGrade(id: string): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    // Usually grades are unique by ID but checking context implies fetching first or relying on DB RLS concepts.
    // For now we assume if user has access to school, they can del grade if ID exists.
    // Ideally we check ownership or link. 
    // But since no direct `schoolId` on `CoScholasticGrade` (wait, I added it in create above!), 
    // IF `CoScholasticGrade` has `schoolId` (it should!), then we use it.
    if (!schoolId) return { success: false, error: "School context required" };

    await db.coScholasticGrade.delete({
      where: { id, schoolId },
    });

    revalidatePath("/admin/assessment/co-scholastic");

    return { success: true };
  } catch (error) {
    console.error("Error deleting co-scholastic grade:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete co-scholastic grade",
    };
  }
}

/**
 * Get terms for dropdown selection
 */
export async function getTermsForCoScholastic(): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const terms = await db.term.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        academicYear: {
          select: {
            name: true,
            isCurrent: true,
          },
        },
      },
      orderBy: [
        {
          academicYear: {
            isCurrent: 'desc',
          },
        },
        {
          startDate: 'desc',
        },
      ],
    });

    return { success: true, data: terms };
  } catch (error) {
    console.error("Error fetching terms:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch terms",
    };
  }
}

/**
 * Get classes for dropdown selection
 */
export async function getClassesForCoScholastic(): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const classes = await db.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        sections: {
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        academicYear: {
          select: {
            name: true,
            isCurrent: true,
          },
        },
      },
      orderBy: [
        {
          academicYear: {
            isCurrent: 'desc',
          },
        },
        {
          name: 'asc',
        },
      ],
    });

    return { success: true, data: classes };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classes",
    };
  }
}
