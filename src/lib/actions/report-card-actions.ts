/**
 * Report Card Actions
 * Server actions for fetching and managing report cards in student and parent portals
 * Requirements: 12.4
 */

"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { aggregateReportCardData, type ReportCardData } from "@/lib/services/report-card-data-aggregation";

export interface ReportCardListItem {
  id: string;
  termName: string;
  academicYear: string;
  percentage: number | null;
  grade: string | null;
  rank: number | null;
  isPublished: boolean;
  publishDate: Date | null;
  pdfUrl: string | null;
  createdAt: Date;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get published report cards for a student
 * Only returns published report cards (access control)
 * 
 * @param studentId - The ID of the student
 * @param filters - Optional filters for term and academic year
 * @returns List of published report cards
 */
export async function getStudentReportCards(
  studentId: string,
  filters?: {
    termId?: string;
    academicYearId?: string;
  }
): Promise<ActionResult<ReportCardListItem[]>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Verify the user has access to this student's data
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        userId: true,
        parents: {
          select: {
            parent: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return {
        success: false,
        error: "Student not found",
      };
    }

    // Check if the user is the student or a parent
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const isStudent = student.userId === user.id;
    const isParent = student.parents.some((p) => p.parent.userId === user.id);

    if (!isStudent && !isParent) {
      return {
        success: false,
        error: "Access denied",
      };
    }

    // Build query filters
    const whereClause: any = {
      studentId,
      isPublished: true, // Only show published report cards
    };

    if (filters?.termId) {
      whereClause.termId = filters.termId;
    }

    if (filters?.academicYearId) {
      whereClause.term = {
        academicYearId: filters.academicYearId,
      };
    }

    // Fetch published report cards
    const reportCards = await db.reportCard.findMany({
      where: whereClause,
      select: {
        id: true,
        percentage: true,
        grade: true,
        rank: true,
        isPublished: true,
        publishDate: true,
        pdfUrl: true,
        createdAt: true,
        term: {
          select: {
            id: true,
            name: true,
            academicYear: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          term: {
            startDate: "desc",
          },
        },
      ],
    });

    const reportCardList: ReportCardListItem[] = reportCards.map((rc) => ({
      id: rc.id,
      termName: rc.term.name,
      academicYear: rc.term.academicYear.name,
      percentage: rc.percentage,
      grade: rc.grade,
      rank: rc.rank,
      isPublished: rc.isPublished,
      publishDate: rc.publishDate,
      pdfUrl: rc.pdfUrl,
      createdAt: rc.createdAt,
    }));

    return {
      success: true,
      data: reportCardList,
    };
  } catch (error) {
    console.error("Error fetching student report cards:", error);
    return {
      success: false,
      error: "Failed to fetch report cards",
    };
  }
}

/**
 * Get published report cards for all children of a parent
 * Only returns published report cards (access control)
 * 
 * @param filters - Optional filters for term and academic year
 * @returns Map of student ID to list of published report cards
 */
export async function getParentChildrenReportCards(
  filters?: {
    termId?: string;
    academicYearId?: string;
  }
): Promise<ActionResult<Record<string, ReportCardListItem[]>>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get the parent record
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        parent: {
          select: {
            id: true,
            children: {
              select: {
                student: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user?.parent) {
      return {
        success: false,
        error: "Parent not found",
      };
    }

    const children = user.parent.children.map((c) => c.student);

    // Fetch report cards for all children
    const reportCardsMap: Record<string, ReportCardListItem[]> = {};

    for (const child of children) {
      const result = await getStudentReportCards(child.id, filters);
      if (result.success && result.data) {
        reportCardsMap[child.id] = result.data;
      }
    }

    return {
      success: true,
      data: reportCardsMap,
    };
  } catch (error) {
    console.error("Error fetching parent children report cards:", error);
    return {
      success: false,
      error: "Failed to fetch report cards",
    };
  }
}

/**
 * Get detailed report card data for viewing
 * Only returns data if the report card is published
 * 
 * @param reportCardId - The ID of the report card
 * @returns Complete report card data
 */
export async function getReportCardDetails(
  reportCardId: string
): Promise<ActionResult<ReportCardData>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Fetch the report card
    const reportCard = await db.reportCard.findUnique({
      where: { id: reportCardId },
      select: {
        id: true,
        studentId: true,
        termId: true,
        isPublished: true,
        student: {
          select: {
            userId: true,
            parents: {
              select: {
                parent: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!reportCard) {
      return {
        success: false,
        error: "Report card not found",
      };
    }

    // Check if the report card is published
    if (!reportCard.isPublished) {
      return {
        success: false,
        error: "Report card is not published",
      };
    }

    // Verify the user has access to this report card
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const isStudent = reportCard.student.userId === user.id;
    const isParent = reportCard.student.parents.some((p) => p.parent.userId === user.id);

    if (!isStudent && !isParent) {
      return {
        success: false,
        error: "Access denied",
      };
    }

    // Aggregate report card data
    const reportCardData = await aggregateReportCardData(
      reportCard.studentId,
      reportCard.termId
    );

    return {
      success: true,
      data: reportCardData,
    };
  } catch (error) {
    console.error("Error fetching report card details:", error);
    return {
      success: false,
      error: "Failed to fetch report card details",
    };
  }
}

/**
 * Get available terms for filtering
 * 
 * @returns List of terms with academic year information
 */
export async function getAvailableTerms(): Promise<ActionResult<Array<{
  id: string;
  name: string;
  academicYearId: string;
  academicYearName: string;
}>>> {
  try {
    const terms = await db.term.findMany({
      select: {
        id: true,
        name: true,
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    const termList = terms.map((term) => ({
      id: term.id,
      name: term.name,
      academicYearId: term.academicYear.id,
      academicYearName: term.academicYear.name,
    }));

    return {
      success: true,
      data: termList,
    };
  } catch (error) {
    console.error("Error fetching available terms:", error);
    return {
      success: false,
      error: "Failed to fetch terms",
    };
  }
}

/**
 * Get available academic years for filtering
 * 
 * @returns List of academic years
 */
export async function getAvailableAcademicYears(): Promise<ActionResult<Array<{
  id: string;
  name: string;
  isCurrent: boolean;
}>>> {
  try {
    const academicYears = await db.academicYear.findMany({
      select: {
        id: true,
        name: true,
        isCurrent: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return {
      success: true,
      data: academicYears,
    };
  } catch (error) {
    console.error("Error fetching available academic years:", error);
    return {
      success: false,
      error: "Failed to fetch academic years",
    };
  }
}
