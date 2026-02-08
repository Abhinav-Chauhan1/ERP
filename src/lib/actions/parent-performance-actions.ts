"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import {
  getExamResultsSchema,
  getProgressReportsSchema,
  getPerformanceAnalyticsSchema,
  downloadReportCardSchema,
  getClassComparisonSchema,
  type GetExamResultsInput,
  type GetProgressReportsInput,
  type GetPerformanceAnalyticsInput,
  type DownloadReportCardInput,
  type GetClassComparisonInput,
} from "@/lib/schemaValidation/parent-performance-schemas";
import { calculateGrade } from "@/lib/utils/grade-calculator";
import type {
  ExamResultData,
  ProgressReportData,
  PerformanceAnalytics,
  ClassComparisonData,
  SubjectPerformance,
  TermPerformance,
} from "@/types/performance";

/**
 * Helper function to get current parent and verify authentication
 */
async function getCurrentParent() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });

  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    return null;
  }

  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  return parent;
}

/**
 * Helper function to verify parent-child relationship with school isolation
 */
async function verifyParentChildRelationship(
  parentId: string,
  childId: string,
  schoolId: string
): Promise<boolean> {
  const relationship = await db.studentParent.findFirst({
    where: { 
      parentId, 
      studentId: childId,
      student: {
        schoolId // Add school isolation
      }
    }
  });
  return !!relationship;
}


/**
 * Helper function to determine performance category
 */
function getPerformanceCategory(
  studentPercentage: number,
  classAverage: number
): "excellent" | "above_average" | "average" | "below_average" | "needs_improvement" {
  const difference = studentPercentage - classAverage;

  if (studentPercentage >= 90) return "excellent";
  if (difference >= 10) return "above_average";
  if (difference >= -5) return "average";
  if (difference >= -15) return "below_average";
  return "needs_improvement";
}

/**
 * Helper function to calculate trend
 */
function calculateTrend(dataPoints: number[]): "improving" | "declining" | "stable" {
  if (dataPoints.length < 2) return "stable";

  const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
  const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const difference = secondAvg - firstAvg;

  if (difference > 5) return "improving";
  if (difference < -5) return "declining";
  return "stable";
}

/**
 * Get exam results for a child with term and subject filtering
 * Requirements: 3.1
 */
export async function getExamResults(input: GetExamResultsInput) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Validate input
    const validated = getExamResultsSchema.parse(input);

    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized" };
    }

    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId, schoolId);
    if (!hasAccess) {
      return { success: false, message: "Access denied" };
    }

    // Build where clause
    const where: any = {
      studentId: validated.childId,
      student: {
        schoolId // Add school isolation
      }
    };

    if (!validated.includeAbsent) {
      where.isAbsent = false;
    }

    // Build exam filters
    const examWhere: any = {
      schoolId // Add school isolation
    };

    if (validated.termId) {
      examWhere.termId = validated.termId;
    }

    if (validated.subjectId) {
      examWhere.subjectId = validated.subjectId;
    }

    if (validated.examTypeId) {
      examWhere.examTypeId = validated.examTypeId;
    }

    if (validated.startDate || validated.endDate) {
      examWhere.examDate = {};
      if (validated.startDate) {
        examWhere.examDate.gte = validated.startDate;
      }
      if (validated.endDate) {
        examWhere.examDate.lte = validated.endDate;
      }
    }

    if (Object.keys(examWhere).length > 0) {
      where.exam = examWhere;
    }

    // Get total count
    const totalCount = await db.examResult.count({ where });

    // Get paginated results
    const skip = (validated.page - 1) * validated.limit;
    const results = await db.examResult.findMany({
      where,
      include: {
        exam: {
          include: {
            subject: true,
            examType: true,
            term: {
              include: {
                academicYear: true
              }
            }
          }
        }
      },
      orderBy: {
        exam: {
          examDate: 'desc'
        }
      },
      skip,
      take: validated.limit
    });

    // Calculate class averages for each exam
    const examIds = results.map(r => r.examId);
    const classAverages = await db.examResult.groupBy({
      by: ['examId'],
      where: {
        examId: { in: examIds },
        isAbsent: false
      },
      _avg: {
        marks: true
      }
    });

    const averageMap = new Map(
      classAverages.map(avg => [avg.examId, avg._avg.marks || 0])
    );

    // Calculate ranks for each exam
    const rankPromises = results.map(async (result) => {
      const higherScores = await db.examResult.count({
        where: {
          examId: result.examId,
          marks: { gt: result.marks },
          isAbsent: false
        }
      });
      return { examId: result.examId, rank: higherScores + 1 };
    });

    const ranks = await Promise.all(rankPromises);
    const rankMap = new Map(ranks.map(r => [r.examId, r.rank]));

    // Format results
    const formattedResults: ExamResultData[] = results.map(result => {
      const percentage = (result.marks / result.exam.totalMarks) * 100;
      const grade = result.grade || calculateGrade(percentage);

      return {
        id: result.id,
        examId: result.examId,
        examTitle: result.exam.title,
        examType: result.exam.examType.name,
        examDate: result.exam.examDate,
        subject: {
          id: result.exam.subject.id,
          name: result.exam.subject.name,
          code: result.exam.subject.code
        },
        marks: result.marks,
        totalMarks: result.exam.totalMarks,
        percentage,
        grade,
        isAbsent: result.isAbsent,
        remarks: result.remarks,
        classAverage: averageMap.get(result.examId),
        rank: rankMap.get(result.examId),
        passingMarks: result.exam.passingMarks,
        isPassed: result.marks >= result.exam.passingMarks
      };
    });

    return {
      success: true,
      data: {
        results: formattedResults,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          totalCount,
          totalPages: Math.ceil(totalCount / validated.limit)
        }
      }
    };
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return { success: false, message: "Failed to fetch exam results" };
  }
}

/**
 * Get progress reports for a child with complete report data
 * Requirements: 3.2
 */
export async function getProgressReports(input: GetProgressReportsInput) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Validate input
    const validated = getProgressReportsSchema.parse(input);

    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized" };
    }

    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId, schoolId);
    if (!hasAccess) {
      return { success: false, message: "Access denied" };
    }

    // Get student with enrollment info
    const student = await db.student.findFirst({
      where: { 
        id: validated.childId,
        schoolId // Add school isolation
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: { enrollDate: 'desc' },
          take: 1,
          include: {
            class: {
              include: {
                academicYear: true
              }
            },
            section: true
          }
        }
      }
    });

    if (!student || !student.enrollments[0]) {
      return { success: false, message: "Student enrollment not found" };
    }

    const currentEnrollment = student.enrollments[0];

    // Build where clause for report cards
    const where: any = {
      studentId: validated.childId
    };

    if (validated.termId) {
      where.termId = validated.termId;
    }

    if (validated.academicYearId) {
      where.term = {
        academicYearId: validated.academicYearId
      };
    }

    if (!validated.includeUnpublished) {
      where.isPublished = true;
    }

    // Get report cards
    const reportCards = await db.reportCard.findMany({
      where,
      include: {
        term: {
          include: {
            academicYear: true
          }
        }
      },
      orderBy: {
        term: {
          startDate: 'desc'
        }
      }
    });

    // For each report card, get detailed exam results
    const progressReports: ProgressReportData[] = await Promise.all(
      reportCards.map(async (reportCard) => {
        // Get exam results for this term
        const examResults = await db.examResult.findMany({
          where: {
            studentId: validated.childId,
            exam: {
              schoolId, // Add school isolation
              termId: reportCard.termId
            },
            isAbsent: false
          },
          include: {
            exam: {
              include: {
                subject: true
              }
            }
          }
        });

        // Group results by subject
        const subjectResultsMap = new Map<string, any[]>();
        examResults.forEach(result => {
          const subjectName = result.exam.subject.name;
          if (!subjectResultsMap.has(subjectName)) {
            subjectResultsMap.set(subjectName, []);
          }
          subjectResultsMap.get(subjectName)!.push(result);
        });

        // Calculate subject-wise performance
        const subjectResults = Array.from(subjectResultsMap.entries()).map(([subject, results]) => {
          const totalMarks = results.reduce((sum, r) => sum + r.exam.totalMarks, 0);
          const obtainedMarks = results.reduce((sum, r) => sum + r.marks, 0);
          const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

          return {
            subject,
            marks: obtainedMarks,
            totalMarks,
            percentage,
            grade: calculateGrade(percentage)
          };
        });

        // Get attendance for this term
        const attendanceRecords = await db.studentAttendance.findMany({
          where: {
            studentId: validated.childId,
            date: {
              gte: reportCard.term.startDate,
              lte: reportCard.term.endDate
            }
          }
        });

        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(a => a.status === "PRESENT").length;
        const absentDays = attendanceRecords.filter(a => a.status === "ABSENT").length;
        const lateDays = attendanceRecords.filter(a => a.status === "LATE").length;
        const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        // Identify strengths and areas for improvement
        const sortedSubjects = [...subjectResults].sort((a, b) => b.percentage - a.percentage);
        const strengths = sortedSubjects.slice(0, 3).map(s => s.subject);
        const areasForImprovement = sortedSubjects.slice(-3).filter(s => s.percentage < 60).map(s => s.subject);

        return {
          id: reportCard.id,
          student: {
            id: student.id,
            name: `${student.user.firstName} ${student.user.lastName}`,
            admissionId: student.admissionId,
            rollNumber: student.rollNumber,
            class: currentEnrollment.class.name,
            section: currentEnrollment.section.name,
            dateOfBirth: student.dateOfBirth,
            avatar: student.user.avatar
          },
          term: {
            id: reportCard.term.id,
            name: reportCard.term.name,
            startDate: reportCard.term.startDate,
            endDate: reportCard.term.endDate,
            academicYear: reportCard.term.academicYear.name
          },
          academicPerformance: {
            totalMarks: reportCard.totalMarks,
            averageMarks: reportCard.averageMarks,
            percentage: reportCard.percentage,
            grade: reportCard.grade,
            rank: reportCard.rank,
            subjectResults
          },
          attendance: {
            percentage: reportCard.attendance || attendancePercentage,
            totalDays,
            presentDays,
            absentDays,
            lateDays
          },
          behavioralAssessment: {
            discipline: null,
            participation: null,
            leadership: null,
            teamwork: null
          },
          teacherRemarks: reportCard.teacherRemarks,
          principalRemarks: reportCard.principalRemarks,
          strengths,
          areasForImprovement,
          isPublished: reportCard.isPublished,
          publishDate: reportCard.publishDate
        };
      })
    );

    return {
      success: true,
      data: {
        reports: progressReports
      }
    };
  } catch (error) {
    console.error("Error fetching progress reports:", error);
    return { success: false, message: "Failed to fetch progress reports" };
  }
}

/**
 * Get performance analytics for charts and trends
 * Requirements: 3.1, 3.3
 */
export async function getPerformanceAnalytics(input: GetPerformanceAnalyticsInput) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Validate input
    const validated = getPerformanceAnalyticsSchema.parse(input);

    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized" };
    }

    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId, schoolId);
    if (!hasAccess) {
      return { success: false, message: "Access denied" };
    }

    // Get student with enrollment info
    const student = await db.student.findFirst({
      where: { 
        id: validated.childId,
        schoolId // Add school isolation
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: { enrollDate: 'desc' },
          take: 1,
          include: {
            class: {
              include: {
                academicYear: true
              }
            },
            section: true
          }
        }
      }
    });

    if (!student || !student.enrollments[0]) {
      return { success: false, message: "Student enrollment not found" };
    }

    const currentEnrollment = student.enrollments[0];

    // Get all exam results for the student
    const allResults = await db.examResult.findMany({
      where: {
        studentId: validated.childId,
        isAbsent: false,
        exam: {
          schoolId // Add school isolation
        }
      },
      include: {
        exam: {
          include: {
            subject: true,
            term: {
              include: {
                academicYear: true
              }
            }
          }
        }
      },
      orderBy: {
        exam: {
          examDate: 'asc'
        }
      }
    });

    // Calculate overall performance
    const totalExams = allResults.length;
    const totalPercentage = allResults.reduce((sum, r) => {
      return sum + (r.marks / r.exam.totalMarks) * 100;
    }, 0);
    const averagePercentage = totalExams > 0 ? totalPercentage / totalExams : 0;

    // Group by subject to find strong and weak subjects
    const subjectPerformanceMap = new Map<string, number[]>();
    allResults.forEach(result => {
      const subjectName = result.exam.subject.name;
      const percentage = (result.marks / result.exam.totalMarks) * 100;

      if (!subjectPerformanceMap.has(subjectName)) {
        subjectPerformanceMap.set(subjectName, []);
      }
      subjectPerformanceMap.get(subjectName)!.push(percentage);
    });

    const subjectAverages = Array.from(subjectPerformanceMap.entries()).map(([subject, percentages]) => ({
      subject,
      average: percentages.reduce((a, b) => a + b, 0) / percentages.length
    }));

    subjectAverages.sort((a, b) => b.average - a.average);
    const strongSubjects = subjectAverages.slice(0, 3).map(s => s.subject);
    const weakSubjects = subjectAverages.slice(-3).filter(s => s.average < 60).map(s => s.subject);

    // Get attendance percentage
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        studentId: validated.childId
      }
    });

    const totalAttendanceDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(a => a.status === "PRESENT").length;
    const attendancePercentage = totalAttendanceDays > 0 ? (presentDays / totalAttendanceDays) * 100 : 0;

    // Get current term performance
    let currentTermPerformance: TermPerformance | null = null;

    const currentTerm = await db.term.findFirst({
      where: {
        schoolId, // Add school isolation
        academicYearId: currentEnrollment.class.academicYearId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });

    if (currentTerm) {
      const termResults = allResults.filter(r => r.exam.termId === currentTerm.id);

      if (termResults.length > 0) {
        const termSubjectMap = new Map<string, any[]>();
        termResults.forEach(result => {
          const subjectId = result.exam.subject.id;
          if (!termSubjectMap.has(subjectId)) {
            termSubjectMap.set(subjectId, []);
          }
          termSubjectMap.get(subjectId)!.push(result);
        });

        const subjects: SubjectPerformance[] = Array.from(termSubjectMap.entries()).map(([subjectId, results]) => {
          const subject = results[0].exam.subject;
          const totalMarks = results.reduce((sum, r) => sum + r.exam.totalMarks, 0);
          const obtainedMarks = results.reduce((sum, r) => sum + r.marks, 0);
          const averagePercentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

          const percentages = results.map(r => (r.marks / r.exam.totalMarks) * 100);
          const trend = calculateTrend(percentages);

          return {
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            totalExams: results.length,
            averageMarks: obtainedMarks / results.length,
            averagePercentage,
            highestMarks: Math.max(...results.map(r => r.marks)),
            lowestMarks: Math.min(...results.map(r => r.marks)),
            trend,
            exams: results.map(r => ({
              id: r.id,
              examId: r.examId,
              examTitle: r.exam.title,
              examType: r.exam.examType?.name || "Exam",
              examDate: r.exam.examDate,
              subject: {
                id: subject.id,
                name: subject.name,
                code: subject.code
              },
              marks: r.marks,
              totalMarks: r.exam.totalMarks,
              percentage: (r.marks / r.exam.totalMarks) * 100,
              grade: r.grade || calculateGrade((r.marks / r.exam.totalMarks) * 100),
              isAbsent: r.isAbsent,
              remarks: r.remarks,
              passingMarks: r.exam.passingMarks,
              isPassed: r.marks >= r.exam.passingMarks
            }))
          };
        });

        const termTotalMarks = termResults.reduce((sum, r) => sum + r.exam.totalMarks, 0);
        const termObtainedMarks = termResults.reduce((sum, r) => sum + r.marks, 0);
        const termPercentage = termTotalMarks > 0 ? (termObtainedMarks / termTotalMarks) * 100 : 0;

        currentTermPerformance = {
          termId: currentTerm.id,
          termName: currentTerm.name,
          totalExams: termResults.length,
          averagePercentage: termPercentage,
          totalMarks: termTotalMarks,
          obtainedMarks: termObtainedMarks,
          grade: calculateGrade(termPercentage),
          rank: null,
          subjects
        };
      }
    }

    // Get term history if requested
    let termHistory: TermPerformance[] = [];

    if (validated.includeTermHistory) {
      const allTerms = await db.term.findMany({
        where: {
          schoolId, // Add school isolation
          academicYearId: currentEnrollment.class.academicYearId
        },
        orderBy: {
          startDate: 'asc'
        }
      });

      const termHistoryWithNulls = await Promise.all(
        allTerms.map(async (term) => {
          const termResults = allResults.filter(r => r.exam.termId === term.id);

          if (termResults.length === 0) {
            return null;
          }

          const termSubjectMap = new Map<string, any[]>();
          termResults.forEach(result => {
            const subjectId = result.exam.subject.id;
            if (!termSubjectMap.has(subjectId)) {
              termSubjectMap.set(subjectId, []);
            }
            termSubjectMap.get(subjectId)!.push(result);
          });

          const subjects: SubjectPerformance[] = Array.from(termSubjectMap.entries()).map(([subjectId, results]) => {
            const subject = results[0].exam.subject;
            const totalMarks = results.reduce((sum, r) => sum + r.exam.totalMarks, 0);
            const obtainedMarks = results.reduce((sum, r) => sum + r.marks, 0);
            const averagePercentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

            const percentages = results.map(r => (r.marks / r.exam.totalMarks) * 100);
            const trend = calculateTrend(percentages);

            return {
              subjectId: subject.id,
              subjectName: subject.name,
              subjectCode: subject.code,
              totalExams: results.length,
              averageMarks: obtainedMarks / results.length,
              averagePercentage,
              highestMarks: Math.max(...results.map(r => r.marks)),
              lowestMarks: Math.min(...results.map(r => r.marks)),
              trend,
              exams: []
            };
          });

          const termTotalMarks = termResults.reduce((sum, r) => sum + r.exam.totalMarks, 0);
          const termObtainedMarks = termResults.reduce((sum, r) => sum + r.marks, 0);
          const termPercentage = termTotalMarks > 0 ? (termObtainedMarks / termTotalMarks) * 100 : 0;

          return {
            termId: term.id,
            termName: term.name,
            totalExams: termResults.length,
            averagePercentage: termPercentage,
            totalMarks: termTotalMarks,
            obtainedMarks: termObtainedMarks,
            grade: calculateGrade(termPercentage),
            rank: null,
            subjects
          };
        })
      );
      termHistory = termHistoryWithNulls.filter(r => r !== null) as TermPerformance[];
    }

    // Get subject trends if requested
    let subjectTrends: Array<{
      subjectName: string;
      data: Array<{
        term: string;
        percentage: number;
        date: Date;
      }>;
    }> = [];

    if (validated.includeSubjectTrends) {
      const subjectTrendMap = new Map<string, any[]>();

      allResults.forEach(result => {
        const subjectName = result.exam.subject.name;
        const percentage = (result.marks / result.exam.totalMarks) * 100;

        if (!subjectTrendMap.has(subjectName)) {
          subjectTrendMap.set(subjectName, []);
        }

        subjectTrendMap.get(subjectName)!.push({
          term: result.exam.term.name,
          percentage,
          date: result.exam.examDate
        });
      });

      subjectTrends = Array.from(subjectTrendMap.entries()).map(([subjectName, data]) => ({
        subjectName,
        data: data.sort((a, b) => a.date.getTime() - b.date.getTime())
      }));
    }

    const analytics: PerformanceAnalytics = {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        admissionId: student.admissionId,
        class: currentEnrollment.class.name,
        section: currentEnrollment.section.name
      },
      currentTerm: currentTermPerformance,
      overallPerformance: {
        totalExams,
        averagePercentage,
        strongSubjects,
        weakSubjects,
        attendancePercentage
      },
      termHistory,
      subjectTrends
    };

    return {
      success: true,
      data: analytics
    };
  } catch (error) {
    console.error("Error fetching performance analytics:", error);
    return { success: false, message: "Failed to fetch performance analytics" };
  }
}

/**
 * Download report card as PDF
 * Requirements: 3.4
 */
export async function downloadReportCard(input: DownloadReportCardInput) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Validate input
    const validated = downloadReportCardSchema.parse(input);

    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized" };
    }

    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId, schoolId);
    if (!hasAccess) {
      return { success: false, message: "Access denied" };
    }

    // Get report card with all details
    const reportCard = await db.reportCard.findFirst({
      where: {
        studentId: validated.childId,
        termId: validated.termId,
        student: {
          schoolId // Add school isolation
        }
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            enrollments: {
              where: { status: "ACTIVE" },
              orderBy: { enrollDate: 'desc' },
              take: 1,
              include: {
                class: true,
                section: true
              }
            }
          }
        },
        term: {
          include: {
            academicYear: true
          }
        }
      }
    });

    if (!reportCard) {
      return { success: false, message: "Report card not found" };
    }

    if (!reportCard.isPublished) {
      return { success: false, message: "Report card is not yet published" };
    }

    // Get exam results for this term
    const examResults = await db.examResult.findMany({
      where: {
        studentId: validated.childId,
        exam: {
          schoolId, // Add school isolation
          termId: validated.termId
        }
      },
      include: {
        exam: {
          include: {
            subject: true,
            examType: true
          }
        }
      },
      orderBy: {
        exam: {
          subject: {
            name: 'asc'
          }
        }
      }
    });

    // Group results by subject
    const subjectResultsMap = new Map<string, any[]>();
    examResults.forEach(result => {
      const subjectName = result.exam.subject.name;
      if (!subjectResultsMap.has(subjectName)) {
        subjectResultsMap.set(subjectName, []);
      }
      subjectResultsMap.get(subjectName)!.push(result);
    });

    // Calculate subject-wise performance
    const subjectResults = Array.from(subjectResultsMap.entries()).map(([subject, results]) => {
      const totalMarks = results.reduce((sum, r) => sum + r.exam.totalMarks, 0);
      const obtainedMarks = results.reduce((sum, r) => sum + r.marks, 0);
      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

      return {
        subject,
        marks: obtainedMarks,
        totalMarks,
        percentage,
        grade: calculateGrade(percentage),
        examDetails: results.map(r => ({
          examType: r.exam.examType?.name || "Exam",
          marks: r.marks,
          totalMarks: r.exam.totalMarks,
          grade: r.grade || calculateGrade((r.marks / r.exam.totalMarks) * 100)
        }))
      };
    });

    // Get attendance for this term
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        studentId: validated.childId,
        date: {
          gte: reportCard.term.startDate,
          lte: reportCard.term.endDate
        }
      }
    });

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(a => a.status === "PRESENT").length;
    const absentDays = attendanceRecords.filter(a => a.status === "ABSENT").length;
    const lateDays = attendanceRecords.filter(a => a.status === "LATE").length;

    // Prepare report card data for PDF generation
    const reportCardData = {
      student: {
        name: `${reportCard.student.user.firstName} ${reportCard.student.user.lastName}`,
        admissionId: reportCard.student.admissionId,
        rollNumber: reportCard.student.rollNumber,
        class: reportCard.student.enrollments[0]?.class.name || "N/A",
        section: reportCard.student.enrollments[0]?.section.name || "N/A",
        dateOfBirth: reportCard.student.dateOfBirth,
        avatar: reportCard.student.user.avatar
      },
      term: {
        name: reportCard.term.name,
        academicYear: reportCard.term.academicYear.name,
        startDate: reportCard.term.startDate,
        endDate: reportCard.term.endDate
      },
      academicPerformance: {
        totalMarks: reportCard.totalMarks,
        averageMarks: reportCard.averageMarks,
        percentage: reportCard.percentage,
        grade: reportCard.grade,
        rank: reportCard.rank,
        subjectResults
      },
      attendance: {
        percentage: reportCard.attendance,
        totalDays,
        presentDays,
        absentDays,
        lateDays
      },
      remarks: {
        teacher: reportCard.teacherRemarks,
        principal: reportCard.principalRemarks
      },
      publishDate: reportCard.publishDate
    };

    // Note: Actual PDF generation would be done by a PDF utility
    // For now, return the report card data
    return {
      success: true,
      data: reportCardData,
      message: "Report card data retrieved successfully"
    };
  } catch (error) {
    console.error("Error downloading report card:", error);
    return { success: false, message: "Failed to download report card" };
  }
}

/**
 * Get class comparison for a specific exam
 * Requirements: 3.1
 */
export async function getClassComparison(input: GetClassComparisonInput) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Validate input
    const validated = getClassComparisonSchema.parse(input);

    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized" };
    }

    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId, schoolId);
    if (!hasAccess) {
      return { success: false, message: "Access denied" };
    }

    // Get student's exam result
    const studentResult = await db.examResult.findFirst({
      where: {
        examId: validated.examId,
        studentId: validated.childId,
        exam: {
          schoolId // Add school isolation
        }
      },
      include: {
        exam: {
          include: {
            subject: true
          }
        }
      }
    });

    if (!studentResult) {
      return { success: false, message: "Exam result not found" };
    }

    // Get all results for this exam (excluding absent students)
    const allResults = await db.examResult.findMany({
      where: {
        examId: validated.examId,
        isAbsent: false,
        exam: {
          schoolId // Add school isolation
        }
      },
      select: {
        marks: true
      }
    });

    if (allResults.length === 0) {
      return { success: false, message: "No class data available" };
    }

    // Calculate class statistics
    const marks = allResults.map(r => r.marks);
    const totalStudents = marks.length;
    const sum = marks.reduce((a, b) => a + b, 0);
    const average = sum / totalStudents;
    const highest = Math.max(...marks);
    const lowest = Math.min(...marks);

    // Calculate median
    const sortedMarks = [...marks].sort((a, b) => a - b);
    const median = totalStudents % 2 === 0
      ? (sortedMarks[totalStudents / 2 - 1] + sortedMarks[totalStudents / 2]) / 2
      : sortedMarks[Math.floor(totalStudents / 2)];

    // Calculate pass/fail counts
    const passedStudents = marks.filter(m => m >= studentResult.exam.passingMarks).length;
    const failedStudents = totalStudents - passedStudents;

    // Calculate student's rank
    const higherScores = marks.filter(m => m > studentResult.marks).length;
    const studentRank = higherScores + 1;

    // Calculate percentile
    const lowerScores = marks.filter(m => m < studentResult.marks).length;
    const percentile = (lowerScores / totalStudents) * 100;

    // Calculate student's percentage
    const studentPercentage = (studentResult.marks / studentResult.exam.totalMarks) * 100;
    const classAveragePercentage = (average / studentResult.exam.totalMarks) * 100;

    // Determine performance category
    const performanceCategory = getPerformanceCategory(studentPercentage, classAveragePercentage);

    const comparisonData: ClassComparisonData = {
      examId: studentResult.examId,
      examTitle: studentResult.exam.title,
      subject: studentResult.exam.subject.name,
      studentMarks: studentResult.marks,
      studentPercentage,
      studentGrade: studentResult.grade || calculateGrade(studentPercentage),
      classStatistics: {
        average,
        highest,
        lowest,
        median,
        totalStudents,
        passedStudents,
        failedStudents
      },
      studentRank,
      percentile,
      performanceCategory
    };

    return {
      success: true,
      data: comparisonData
    };
  } catch (error) {
    console.error("Error fetching class comparison:", error);
    return { success: false, message: "Failed to fetch class comparison" };
  }
}
