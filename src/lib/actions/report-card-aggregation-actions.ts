"use server";

import { 
  aggregateReportCardData, 
  batchAggregateReportCardData,
  type ReportCardData 
} from "@/lib/services/report-card-data-aggregation";

/**
 * Server action to get aggregated report card data for a single student
 * 
 * @param studentId - The ID of the student
 * @param termId - The ID of the term
 * @returns Action result with report card data
 */
export async function getReportCardData(studentId: string, termId: string) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Validate inputs
    if (!studentId || !termId) {
      return {
        success: false,
        error: "Student ID and Term ID are required",
      };
    }

    const reportCardData = await aggregateReportCardData(studentId, termId);
    
    // Verify student belongs to the school
    if (reportCardData.student.schoolId !== schoolId) {
      return {
        success: false,
        error: "Student not found in this school",
      };
    }

    return {
      success: true,
      data: reportCardData,
    };
  } catch (error) {
    console.error("Error getting report card data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get report card data",
    };
  }
}

/**
 * Server action to get aggregated report card data for multiple students
 * Useful for batch report card generation
 * 
 * @param studentIds - Array of student IDs
 * @param termId - The ID of the term
 * @returns Action result with array of report card data
 */
export async function getBatchReportCardData(studentIds: string[], termId: string) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Validate inputs
    if (!studentIds || studentIds.length === 0) {
      return {
        success: false,
        error: "At least one student ID is required",
      };
    }

    if (!termId) {
      return {
        success: false,
        error: "Term ID is required",
      };
    }

    const reportCardData = await batchAggregateReportCardData(studentIds, termId);
    
    // Filter to only students in this school
    const filteredData = reportCardData.filter(data => data.student.schoolId === schoolId);
    
    if (filteredData.length === 0) {
      return {
        success: false,
        error: "No students found in this school",
      };
    }

    return {
      success: true,
      data: filteredData,
    };
  } catch (error) {
    console.error("Error getting batch report card data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get batch report card data",
    };
  }
}

/**
 * Server action to get report card data for all students in a class
 * 
 * @param classId - The ID of the class
 * @param sectionId - The ID of the section (optional)
 * @param termId - The ID of the term
 * @returns Action result with array of report card data
 */
export async function getClassReportCardData(
  classId: string,
  termId: string,
  sectionId?: string
) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Validate inputs
    if (!classId || !termId) {
      return {
        success: false,
        error: "Class ID and Term ID are required",
      };
    }

    // Import db here to avoid circular dependencies
    const { db } = await import("@/lib/db");

    // Get all students in the class with school isolation
    const whereClause: any = {
      schoolId, // Add school isolation
      classId,
      status: "ACTIVE",
    };

    if (sectionId) {
      whereClause.sectionId = sectionId;
    }

    const enrollments = await db.classEnrollment.findMany({
      where: whereClause,
      select: {
        studentId: true,
      },
    });

    const studentIds = enrollments.map((e) => e.studentId);

    if (studentIds.length === 0) {
      return {
        success: false,
        error: "No students found in the specified class",
      };
    }

    const reportCardData = await batchAggregateReportCardData(studentIds, termId);
    
    // Filter to only students in this school (should already be filtered by enrollment query)
    const filteredData = reportCardData.filter(data => data.student.schoolId === schoolId);

    return {
      success: true,
      data: filteredData,
    };
  } catch (error) {
    console.error("Error getting class report card data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get class report card data",
    };
  }
}
