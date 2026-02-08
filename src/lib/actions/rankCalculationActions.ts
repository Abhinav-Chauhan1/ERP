"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Calculate class ranks for a term
 * 
 * This function:
 * 1. Fetches all report cards for the specified class and term
 * 2. Sorts students by total marks/percentage in descending order
 * 3. Assigns ranks, handling tied ranks (students with equal marks get the same rank)
 * 4. Updates the rank field in all report cards
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export async function calculateClassRanks(
  classId: string,
  termId: string
): Promise<ActionResult> {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Authenticate user
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user exists in database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Only admins and teachers can calculate ranks
    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Fetch all report cards for the class and term with school isolation
    // Only include students who have marks (exclude those without totalMarks)
    const reportCards = await db.reportCard.findMany({
      where: {
        termId,
        schoolId, // Add school isolation
        student: {
          schoolId, // Add school isolation
          enrollments: {
            some: {
              classId,
              status: "ACTIVE",
            },
          },
        },
        totalMarks: {
          not: null,
        },
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
      orderBy: [
        { totalMarks: "desc" },
        { percentage: "desc" },
      ],
    });

    if (reportCards.length === 0) {
      return {
        success: false,
        error: "No report cards found for the specified class and term",
      };
    }

    // Calculate ranks with tie handling
    const rankedCards: Array<{ id: string; rank: number; totalMarks: number }> = [];
    let currentRank = 1;
    let previousMarks: number | null = null;
    let studentsAtCurrentRank = 0;

    reportCards.forEach((card, index) => {
      const marks = card.totalMarks || 0;

      // If marks are the same as previous student, assign same rank
      if (previousMarks !== null && marks === previousMarks) {
        rankedCards.push({
          id: card.id,
          rank: currentRank,
          totalMarks: marks,
        });
        studentsAtCurrentRank++;
      } else {
        // New rank - move to next rank position
        if (studentsAtCurrentRank > 0) {
          // Skip ranks based on how many students had the previous rank
          currentRank += studentsAtCurrentRank;
        }

        rankedCards.push({
          id: card.id,
          rank: currentRank,
          totalMarks: marks,
        });

        studentsAtCurrentRank = 1; // This student is at the current rank
      }

      previousMarks = marks;
    });

    // Update all report cards with calculated ranks in a transaction
    await db.$transaction(
      rankedCards.map((rankedCard) =>
        db.reportCard.update({
          where: { id: rankedCard.id },
          data: { rank: rankedCard.rank },
        })
      )
    );

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE",
        resource: "ReportCard",
        resourceId: termId,
        changes: JSON.stringify({
          classId,
          termId,
          totalStudents: rankedCards.length,
          ranksCalculated: true,
        }),
      },
    });

    // Revalidate relevant paths
    revalidatePath("/admin/assessment/results");
    revalidatePath("/admin/assessment/report-cards");
    revalidatePath(`/admin/assessment/report-cards/class/${classId}`);

    return {
      success: true,
      message: `Successfully calculated ranks for ${rankedCards.length} students`,
      data: {
        totalStudents: rankedCards.length,
        rankedCards: rankedCards.map((rc) => ({
          id: rc.id,
          rank: rc.rank,
          totalMarks: rc.totalMarks,
        })),
      },
    };
  } catch (error) {
    console.error("Error calculating class ranks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to calculate ranks",
    };
  }
}

/**
 * Get classes and terms for rank calculation dropdown
 */
export async function getClassesAndTermsForRanks(): Promise<ActionResult> {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch classes with current academic year with school isolation
    const classes = await db.class.findMany({
      where: {
        schoolId, // Add school isolation
        academicYear: {
          isCurrent: true,
        },
      },
      include: {
        sections: {
          orderBy: {
            name: "asc",
          },
        },
        academicYear: {
          select: {
            name: true,
            terms: {
              orderBy: {
                startDate: "asc",
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: classes,
    };
  } catch (error) {
    console.error("Error fetching classes and terms:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch data",
    };
  }
}

/**
 * Get rank statistics for a class and term
 */
export async function getRankStatistics(
  classId: string,
  termId: string
): Promise<ActionResult> {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get report cards with ranks with school isolation
    const reportCards = await db.reportCard.findMany({
      where: {
        termId,
        schoolId, // Add school isolation
        student: {
          schoolId, // Add school isolation
          enrollments: {
            some: {
              classId,
              status: "ACTIVE",
            },
          },
        },
        rank: {
          not: null,
        },
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
        rank: "asc",
      },
    });

    // Calculate statistics
    const totalStudents = reportCards.length;
    const rankedStudents = reportCards.filter((rc) => rc.rank !== null).length;
    const topRank = reportCards[0]?.rank || null;
    const topStudent = reportCards[0]
      ? `${reportCards[0].student.user.firstName} ${reportCards[0].student.user.lastName}`
      : null;

    // Count tied ranks
    const rankCounts = new Map<number, number>();
    reportCards.forEach((rc) => {
      if (rc.rank !== null) {
        rankCounts.set(rc.rank, (rankCounts.get(rc.rank) || 0) + 1);
      }
    });

    const tiedRanks = Array.from(rankCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([rank, count]) => ({ rank, count }));

    return {
      success: true,
      data: {
        totalStudents,
        rankedStudents,
        topRank,
        topStudent,
        tiedRanks,
        reportCards: reportCards.map((rc) => ({
          id: rc.id,
          studentName: `${rc.student.user.firstName} ${rc.student.user.lastName}`,
          rank: rc.rank,
          totalMarks: rc.totalMarks,
          percentage: rc.percentage,
          grade: rc.grade,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching rank statistics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch statistics",
    };
  }
}
