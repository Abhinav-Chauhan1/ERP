"use server";

import { db } from "@/lib/db";

// Get performance analytics
export async function getPerformanceAnalytics(filters?: {
  classId?: string;
  subjectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    const where: any = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    // Get exam results
    const results = await db.result.findMany({
      where: {
        ...where,
        ...(filters?.classId && {
          exam: {
            classId: filters.classId,
          },
        }),
        ...(filters?.subjectId && {
          exam: {
            subjectId: filters.subjectId,
          },
        }),
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
        exam: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    // Calculate statistics
    const totalResults = results.length;
    const averageScore = totalResults > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / totalResults
      : 0;
    
    const passCount = results.filter(r => r.score >= 50).length;
    const failCount = results.filter(r => r.score < 50).length;
    const passRate = totalResults > 0 ? (passCount / totalResults) * 100 : 0;

    return {
      success: true,
      data: {
        results,
        statistics: {
          totalResults,
          averageScore: Math.round(averageScore * 100) / 100,
          passCount,
          failCount,
          passRate: Math.round(passRate * 100) / 100,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching performance analytics:", error);
    return { success: false, error: "Failed to fetch performance analytics" };
  }
}

// Get subject-wise performance
export async function getSubjectWisePerformance(classId?: string) {
  try {
    const where: any = {};
    if (classId) {
      where.exam = {
        classId,
      };
    }

    const results = await db.result.findMany({
      where,
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
      },
    });

    // Group by subject
    const subjectPerformance = results.reduce((acc: any, result) => {
      const subjectName = result.exam.subject?.name || "Unknown";
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: subjectName,
          totalScores: 0,
          count: 0,
          passCount: 0,
          failCount: 0,
        };
      }
      acc[subjectName].totalScores += result.score;
      acc[subjectName].count += 1;
      if (result.score >= 50) {
        acc[subjectName].passCount += 1;
      } else {
        acc[subjectName].failCount += 1;
      }
      return acc;
    }, {});

    const subjectStats = Object.values(subjectPerformance).map((item: any) => ({
      subject: item.subject,
      averageScore: Math.round((item.totalScores / item.count) * 100) / 100,
      passRate: Math.round((item.passCount / item.count) * 100 * 100) / 100,
      totalStudents: item.count,
    }));

    return {
      success: true,
      data: subjectStats,
    };
  } catch (error) {
    console.error("Error fetching subject-wise performance:", error);
    return { success: false, error: "Failed to fetch subject-wise performance" };
  }
}

// Get pass/fail rates
export async function getPassFailRates(classId?: string) {
  try {
    const where: any = {};
    if (classId) {
      where.exam = {
        classId,
      };
    }

    const results = await db.result.findMany({
      where,
    });

    const totalResults = results.length;
    const passCount = results.filter(r => r.score >= 50).length;
    const failCount = results.filter(r => r.score < 50).length;
    const passRate = totalResults > 0 ? (passCount / totalResults) * 100 : 0;

    // Grade distribution
    const gradeDistribution = {
      A: results.filter(r => r.score >= 90).length,
      B: results.filter(r => r.score >= 80 && r.score < 90).length,
      C: results.filter(r => r.score >= 70 && r.score < 80).length,
      D: results.filter(r => r.score >= 60 && r.score < 70).length,
      E: results.filter(r => r.score >= 50 && r.score < 60).length,
      F: results.filter(r => r.score < 50).length,
    };

    return {
      success: true,
      data: {
        totalResults,
        passCount,
        failCount,
        passRate: Math.round(passRate * 100) / 100,
        gradeDistribution,
      },
    };
  } catch (error) {
    console.error("Error fetching pass/fail rates:", error);
    return { success: false, error: "Failed to fetch pass/fail rates" };
  }
}

// Get performance trends
export async function getPerformanceTrends(dateFrom: Date, dateTo: Date, classId?: string) {
  try {
    const where: any = {
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    if (classId) {
      where.exam = {
        classId,
      };
    }

    const results = await db.result.findMany({
      where,
      include: {
        exam: {
          select: {
            date: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by month
    const trendsByMonth = results.reduce((acc: any, result) => {
      const monthKey = new Date(result.exam.date).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          totalScores: 0,
          count: 0,
        };
      }
      acc[monthKey].totalScores += result.score;
      acc[monthKey].count += 1;
      return acc;
    }, {});

    const trends = Object.values(trendsByMonth).map((item: any) => ({
      month: item.month,
      averageScore: Math.round((item.totalScores / item.count) * 100) / 100,
      count: item.count,
    }));

    return {
      success: true,
      data: trends,
    };
  } catch (error) {
    console.error("Error fetching performance trends:", error);
    return { success: false, error: "Failed to fetch performance trends" };
  }
}

// Get top performers
export async function getTopPerformers(limit: number = 10, classId?: string) {
  try {
    const where: any = {};
    if (classId) {
      where.exam = {
        classId,
      };
    }

    const results = await db.result.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            enrollments: {
              where: {
                status: "ACTIVE",
              },
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
      },
    });

    // Calculate average score per student
    const studentScores = results.reduce((acc: any, result) => {
      const studentId = result.studentId;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: result.student,
          totalScores: 0,
          count: 0,
        };
      }
      acc[studentId].totalScores += result.score;
      acc[studentId].count += 1;
      return acc;
    }, {});

    const topPerformers = Object.values(studentScores)
      .map((item: any) => ({
        student: item.student,
        averageScore: Math.round((item.totalScores / item.count) * 100) / 100,
        totalExams: item.count,
      }))
      .sort((a: any, b: any) => b.averageScore - a.averageScore)
      .slice(0, limit);

    return {
      success: true,
      data: topPerformers,
    };
  } catch (error) {
    console.error("Error fetching top performers:", error);
    return { success: false, error: "Failed to fetch top performers" };
  }
}
