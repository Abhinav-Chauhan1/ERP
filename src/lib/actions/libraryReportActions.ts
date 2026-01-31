import { db } from "@/lib/db";
import { IssueStatus } from "@prisma/client";
import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";

// ============================================================================
// LIBRARY REPORTS
// ============================================================================

/**
 * Get most borrowed books report
 * Returns books sorted by the number of times they have been issued
 */
export const getMostBorrowedBooksReport = withSchoolAuthAction(async (
  schoolId: string,
  userId: string,
  userRole: string,
  params?: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }
) => {
  try {
    const limit = params?.limit || 20;
    const where: any = { schoolId };

    // Date range filter
    if (params?.startDate || params?.endDate) {
      where.issueDate = {};
      if (params.startDate) {
        where.issueDate.gte = params.startDate;
      }
      if (params.endDate) {
        where.issueDate.lte = params.endDate;
      }
    }

    // Get all book issues grouped by book
    const bookIssues = await db.bookIssue.groupBy({
      by: ["bookId"],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: limit,
    });

    // Get book details for all books in a single query (fixes N+1)
    const bookIds = bookIssues.map(issue => issue.bookId);
    const books = await db.book.findMany({
      where: {
        id: { in: bookIds },
        schoolId // Critical
      },
    });

    // Create a map for O(1) lookup
    const bookMap = new Map(books.map(book => [book.id, book]));

    // Combine book details with counts
    const booksWithCounts = bookIssues
      .map(issue => ({
        book: bookMap.get(issue.bookId),
        borrowCount: issue._count.id,
      }))
      .filter(item => item.book !== null);

    return {
      success: true,
      data: booksWithCounts,
    };
  } catch (error) {
    console.error("Error generating most borrowed books report:", error);
    return {
      success: false,
      error: "Failed to generate most borrowed books report",
    };
  }
});

/**
 * Get overdue books report
 * Returns all books that are currently overdue
 */
export const getOverdueBooksReport = withSchoolAuthAction(async (
  schoolId: string,
  userId: string,
  userRole: string,
  params?: {
    page?: number;
    limit?: number;
  }
) => {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const where = {
      schoolId, // Mandatory
      OR: [
        { status: "ISSUED" as IssueStatus },
        { status: "OVERDUE" as IssueStatus },
      ],
      dueDate: {
        lt: today,
      },
    };

    const [overdueIssues, total] = await Promise.all([
      db.bookIssue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: "asc" },
        include: {
          book: true,
          student: {
            include: {
              user: true,
              enrollments: {
                where: {
                  status: "ACTIVE",
                  schoolId // critical nested scope
                },
                include: {
                  class: true,
                  section: true,
                },
                take: 1,
              },
            },
          },
        },
      }),
      db.bookIssue.count({ where }),
    ]);

    // Calculate days overdue and potential fine for each issue
    const overdueWithDetails = overdueIssues.map((issue) => {
      const daysOverdue = Math.floor(
        (today.getTime() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const potentialFine = daysOverdue * 5; // Default fine rate: 5 per day

      return {
        ...issue,
        daysOverdue,
        potentialFine,
      };
    });

    return {
      success: true,
      data: {
        overdueIssues: overdueWithDetails,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error generating overdue books report:", error);
    return {
      success: false,
      error: "Failed to generate overdue books report",
    };
  }
});

/**
 * Get fine collections report
 * Returns all fines collected from returned books
 */
export const getFineCollectionsReport = withSchoolAuthAction(async (
  schoolId: string,
  userId: string,
  userRole: string,
  params?: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }
) => {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      schoolId, // Mandatory
      status: "RETURNED",
      fine: {
        gt: 0,
      },
    };

    // Date range filter on return date
    if (params?.startDate || params?.endDate) {
      where.returnDate = {};
      if (params.startDate) {
        where.returnDate.gte = params.startDate;
      }
      if (params.endDate) {
        where.returnDate.lte = params.endDate;
      }
    }

    const [fineIssues, total, totalFines] = await Promise.all([
      db.bookIssue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { returnDate: "desc" },
        include: {
          book: {
            select: {
              title: true,
              author: true,
              isbn: true,
            },
          },
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              enrollments: {
                where: {
                  status: "ACTIVE",
                  schoolId
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
          },
        },
      }),
      db.bookIssue.count({ where }),
      db.bookIssue.aggregate({
        where,
        _sum: {
          fine: true,
        },
      }),
    ]);

    // Calculate days overdue for each fine
    const finesWithDetails = fineIssues.map((issue) => {
      const daysOverdue = issue.returnDate && issue.dueDate
        ? Math.floor(
          (issue.returnDate.getTime() - issue.dueDate.getTime()) /
          (1000 * 60 * 60 * 24)
        )
        : 0;

      return {
        ...issue,
        daysOverdue,
      };
    });

    return {
      success: true,
      data: {
        fineIssues: finesWithDetails,
        total,
        totalFinesCollected: totalFines._sum.fine || 0,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error generating fine collections report:", error);
    return {
      success: false,
      error: "Failed to generate fine collections report",
    };
  }
});

/**
 * Get library summary statistics for reports
 */
export const getLibraryReportSummary = withSchoolAuthAction(async (
  schoolId: string,
  userId: string,
  userRole: string,
  params?: {
    startDate?: Date;
    endDate?: Date;
  }
) => {
  try {
    const where: any = { schoolId };

    // Date range filter
    if (params?.startDate || params?.endDate) {
      where.issueDate = {};
      if (params.startDate) {
        where.issueDate.gte = params.startDate;
      }
      if (params.endDate) {
        where.issueDate.lte = params.endDate;
      }
    }

    const [
      totalIssues,
      totalReturned,
      totalOverdue,
      totalFines,
      uniqueStudents,
      uniqueBooks,
    ] = await Promise.all([
      db.bookIssue.count({ where }),
      db.bookIssue.count({
        where: {
          ...where,
          status: "RETURNED",
        },
      }),
      db.bookIssue.count({
        where: {
          schoolId,
          status: { in: ["ISSUED", "OVERDUE"] },
          dueDate: {
            lt: new Date(),
          },
        },
      }),
      db.bookIssue.aggregate({
        where: {
          schoolId,
          status: "RETURNED",
          fine: {
            gt: 0,
          },
          ...(params?.startDate || params?.endDate
            ? {
              returnDate: {
                ...(params.startDate ? { gte: params.startDate } : {}),
                ...(params.endDate ? { lte: params.endDate } : {}),
              },
            }
            : {}),
        },
        _sum: {
          fine: true,
        },
      }),
      db.bookIssue.findMany({
        where,
        select: {
          studentId: true,
        },
        distinct: ["studentId"],
      }),
      db.bookIssue.findMany({
        where,
        select: {
          bookId: true,
        },
        distinct: ["bookId"],
      }),
    ]);

    return {
      success: true,
      data: {
        totalIssues,
        totalReturned,
        totalOverdue,
        totalFinesCollected: totalFines._sum.fine || 0,
        uniqueStudents: uniqueStudents.length,
        uniqueBooks: uniqueBooks.length,
      },
    };
  } catch (error) {
    console.error("Error generating library report summary:", error);
    return {
      success: false,
      error: "Failed to generate library report summary",
    };
  }
});
