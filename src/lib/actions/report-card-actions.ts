/**
 * Report Card Actions
 * Server actions for fetching and managing report cards in student and parent portals
 * Requirements: 12.4
 */

"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
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
export const getStudentReportCards = withSchoolAuthAction(async (
  schoolId: string,
  userId: string,
  userRole: string,
  studentId: string,
  filters?: {
    termId?: string;
    academicYearId?: string;
  }
): Promise<ActionResult<ReportCardListItem[]>> => {
  try {
    // Verify the user has access to this student's data and matches the schoolId
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        schoolId // Mandatory school check
      },
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
        error: "Student not found in this school",
      };
    }

    // Check if the user is the student or a parent
    const isStudent = student.userId === userId;
    const isParent = student.parents.some((p) => p.parent.userId === userId);

    if (!isStudent && !isParent && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: "Access denied",
      };
    }

    // Build query filters
    const whereClause: any = {
      studentId,
      schoolId, // Ensure report card belongs to the school
      isPublished: true,
    };

    if (filters?.termId) {
      whereClause.termId = filters.termId;
    }

    if (filters?.academicYearId) {
      whereClause.term = {
        academicYearId: filters.academicYearId,
        schoolId // Multi-hop check
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
});

/**
 * Get published report cards for all children of a parent
 * Only returns published report cards (access control)
 * 
 * @param filters - Optional filters for term and academic year
 * @returns Map of student ID to list of published report cards
 */
export const getParentChildrenReportCards = withSchoolAuthAction(async (
  schoolId: string,
  userId: string,
  userRole: string,
  filters?: {
    termId?: string;
    academicYearId?: string;
  }
): Promise<ActionResult<Record<string, ReportCardListItem[]>>> => {
  try {
    // Get the parent record for this school
    const parent = await db.parent.findFirst({
      where: {
        userId,
        schoolId
      },
      select: {
        id: true,
        children: {
          select: {
            student: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return {
        success: false,
        error: "Parent record not found in this school",
      };
    }

    const children = parent.children.map((c) => c.student);

    // Fetch report cards for all children
    const reportCardsMap: Record<string, ReportCardListItem[]> = {};

    for (const child of children) {
      // Pass the existing context to maintain consistency
      const reportCards = await db.reportCard.findMany({
        where: {
          studentId: child.id,
          schoolId,
          isPublished: true,
          ...(filters?.termId ? { termId: filters.termId } : {}),
          ...(filters?.academicYearId ? { term: { academicYearId: filters.academicYearId, schoolId } } : {}),
        },
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
      });

      reportCardsMap[child.id] = reportCards.map((rc) => ({
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
});

/**
 * Get detailed report card data for viewing
 * Only returns data if the report card is published
 * 
 * @param reportCardId - The ID of the report card
 * @returns Complete report card data
 */
export const getReportCardDetails = withSchoolAuthAction(async (
  schoolId: string,
  userId: string,
  userRole: string,
  reportCardId: string
): Promise<ActionResult<ReportCardData>> => {
  try {
    // Fetch the report card with mandatory schoolId check
    const reportCard = await db.reportCard.findFirst({
      where: {
        id: reportCardId,
        schoolId // Critical tenant isolation
      },
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
        error: "Report card not found or access denied",
      };
    }

    // Check if the report card is published
    if (!reportCard.isPublished && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: "Report card is not published",
      };
    }

    // Verify the user has access to this report card
    const isStudent = reportCard.student.userId === userId;
    const isParent = reportCard.student.parents.some((p) => p.parent.userId === userId);

    if (!isStudent && !isParent && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: "Access denied",
      };
    }

    // Aggregate report card data (must ensure this service is also school-aware or we pass context)
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
});

/**
 * Get available terms for filtering
 * 
 * @returns List of terms with academic year information
 */
export const getAvailableTerms = withSchoolAuthAction(async (
  schoolId: string
): Promise<ActionResult<Array<{
  id: string;
  name: string;
  academicYearId: string;
  academicYearName: string;
}>>> => {
  try {
    const terms = await db.term.findMany({
      where: { schoolId }, // Filter by schoolId
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
});

/**
 * Get available academic years for filtering
 * 
 * @returns List of academic years
 */
export const getAvailableAcademicYears = withSchoolAuthAction(async (
  schoolId: string
): Promise<ActionResult<Array<{
  id: string;
  name: string;
  isCurrent: boolean;
}>>> => {
  try {
    const academicYears = await db.academicYear.findMany({
      where: { schoolId }, // Filter by schoolId
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
});
