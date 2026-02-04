"use server";

import { db } from "@/lib/db";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// Get overall school performance
export async function getOverallSchoolPerformance(filters?: {
  academicYearId?: string;
  termId?: string;
}) {
  try {
    const context = await requireSchoolAccess();
    const schoolId = context.schoolId;
    
    if (!schoolId) {
      return { success: false, error: "School context required" };
    }
    
    const where: any = {
      exam: { schoolId },
    };
    if (filters?.termId) where.termId = filters.termId;

    const [results, attendance, students] = await Promise.all([
      db.examResult.findMany({
        where,
        include: {
          exam: {
            include: {
              subject: true,
            },
          },
        },
      }),
      db.studentAttendance.findMany({
        where: { student: { schoolId } },
      }),
      db.student.count({ where: { schoolId } }),
    ]);

    const totalMarks = results.reduce((sum, r) => sum + r.marks, 0);
    const averageMarks = results.length > 0 ? totalMarks / results.length : 0;

    const presentCount = attendance.filter(a => a.status === "PRESENT").length;
    const attendanceRate = attendance.length > 0 ? (presentCount / attendance.length) * 100 : 0;

    return {
      success: true,
      data: {
        academicPerformance: {
          averageMarks: Math.round(averageMarks * 100) / 100,
          totalExams: results.length,
          passRate: results.length > 0
            ? (results.filter(r => r.marks >= 40).length / results.length) * 100
            : 0,
        },
        attendanceMetrics: {
          attendanceRate: Math.round(attendanceRate * 100) / 100,
          totalRecords: attendance.length,
        },
        enrollment: {
          totalStudents: students,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching overall school performance:", error);
    return { success: false, error: "Failed to fetch overall school performance" };
  }
}

// Get teacher performance metrics
export async function getTeacherPerformanceMetrics(filters?: {
  teacherId?: string;
  academicYearId?: string;
}) {
  try {
    const { schoolId } = await requireSchoolAccess();
    const where: any = { schoolId };
    if (filters?.teacherId) where.creatorId = filters.teacherId;

    const exams = await db.exam.findMany({
      where,
      include: {
        results: true,
        subject: true,
        creator: {
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
    });

    const teacherMetrics = exams.reduce((acc: any, exam) => {
      if (!exam.creator) return acc;
      const teacherId = exam.creatorId!;
      const teacherName = `${exam.creator.user.firstName} ${exam.creator.user.lastName}`;

      if (!acc[teacherId]) {
        acc[teacherId] = {
          teacherId,
          teacherName,
          subjectName: exam.subject.name,
          totalExams: 0,
          totalStudents: 0,
          averageMarks: 0,
          passRate: 0,
        };
      }

      acc[teacherId].totalExams++;
      const examResults = exam.results;
      acc[teacherId].totalStudents += examResults.length;

      const totalMarks = examResults.reduce((sum, r) => sum + r.marks, 0);
      const passCount = examResults.filter(r => r.marks >= 40).length;

      acc[teacherId].averageMarks += examResults.length > 0 ? totalMarks / examResults.length : 0;
      acc[teacherId].passRate += examResults.length > 0 ? (passCount / examResults.length) * 100 : 0;

      return acc;
    }, {});

    const metrics = Object.values(teacherMetrics).map((teacher: any) => ({
      ...teacher,
      averageMarks: teacher.totalExams > 0
        ? Math.round((teacher.averageMarks / teacher.totalExams) * 100) / 100
        : 0,
      passRate: teacher.totalExams > 0
        ? Math.round((teacher.passRate / teacher.totalExams) * 100) / 100
        : 0,
    }));

    return {
      success: true,
      data: metrics,
    };
  } catch (error) {
    console.error("Error fetching teacher performance metrics:", error);
    return { success: false, error: "Failed to fetch teacher performance metrics" };
  }
}

// Get student progress tracking
export async function getStudentProgressTracking(studentId: string) {
  try {
    const context = await requireSchoolAccess();
    const schoolId = context.schoolId;
    
    if (!schoolId) {
      return { success: false, error: "School context required" };
    }
    
    const results = await db.examResult.findMany({
      where: {
        studentId,
        student: { schoolId },
      },
      include: {
        exam: {
          include: {
            subject: true,
            term: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const attendance = await db.studentAttendance.findMany({
      where: { studentId, student: { schoolId } },
      orderBy: {
        date: "asc",
      },
    });

    // Calculate term-wise progress
    const termProgress = results.reduce((acc: any, result) => {
      const termName = result.exam.term?.name || "Unknown";
      if (!acc[termName]) {
        acc[termName] = {
          term: termName,
          totalMarks: 0,
          count: 0,
          subjects: {},
        };
      }
      acc[termName].totalMarks += result.marks;
      acc[termName].count++;

      const subjectName = result.exam.subject.name;
      if (!acc[termName].subjects[subjectName]) {
        acc[termName].subjects[subjectName] = { totalMarks: 0, count: 0 };
      }
      acc[termName].subjects[subjectName].totalMarks += result.marks;
      acc[termName].subjects[subjectName].count++;

      return acc;
    }, {});

    const progressData = Object.values(termProgress).map((term: any) => ({
      term: term.term,
      averageMarks: Math.round((term.totalMarks / term.count) * 100) / 100,
      subjectPerformance: Object.entries(term.subjects).map(([subject, data]: [string, any]) => ({
        subject,
        averageMarks: Math.round((data.totalMarks / data.count) * 100) / 100,
      })),
    }));

    const presentCount = attendance.filter(a => a.status === "PRESENT").length;
    const attendanceRate = attendance.length > 0 ? (presentCount / attendance.length) * 100 : 0;

    return {
      success: true,
      data: {
        academicProgress: progressData,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        totalExams: results.length,
        overallAverage: results.length > 0
          ? Math.round((results.reduce((sum, r) => sum + r.marks, 0) / results.length) * 100) / 100
          : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching student progress tracking:", error);
    return { success: false, error: "Failed to fetch student progress tracking" };
  }
}

// Get comparative analysis
export async function getComparativeAnalysis(filters?: {
  academicYearId?: string;
  compareBy?: "class" | "term" | "subject";
}) {
  try {
    const context = await requireSchoolAccess();
    const schoolId = context.schoolId;
    
    if (!schoolId) {
      return { success: false, error: "School context required" };
    }
    
    const results = await db.examResult.findMany({
      where: { exam: { schoolId } },
      include: {
        student: {
          include: {
            enrollments: {
              where: {
                status: "ACTIVE",
              },
              include: {
                class: true,
              },
            },
          },
        },
        exam: {
          include: {
            subject: true,
            term: true,
          },
        },
      },
    });

    const compareBy = filters?.compareBy || "class";
    let comparisonData: any = {};

    if (compareBy === "class") {
      comparisonData = results.reduce((acc: any, result) => {
        const className = result.student.enrollments[0]?.class?.name || "Unknown";
        if (!acc[className]) {
          acc[className] = { name: className, totalMarks: 0, count: 0 };
        }
        acc[className].totalMarks += result.marks;
        acc[className].count++;
        return acc;
      }, {});
    } else if (compareBy === "term") {
      comparisonData = results.reduce((acc: any, result) => {
        const termName = result.exam.term?.name || "Unknown";
        if (!acc[termName]) {
          acc[termName] = { name: termName, totalMarks: 0, count: 0 };
        }
        acc[termName].totalMarks += result.marks;
        acc[termName].count++;
        return acc;
      }, {});
    } else if (compareBy === "subject") {
      comparisonData = results.reduce((acc: any, result) => {
        const subjectName = result.exam.subject.name;
        if (!acc[subjectName]) {
          acc[subjectName] = { name: subjectName, totalMarks: 0, count: 0 };
        }
        acc[subjectName].totalMarks += result.marks;
        acc[subjectName].count++;
        return acc;
      }, {});
    }

    const comparison = Object.values(comparisonData).map((item: any) => ({
      name: item.name,
      averageMarks: Math.round((item.totalMarks / item.count) * 100) / 100,
      totalExams: item.count,
    }));

    return {
      success: true,
      data: {
        comparison,
        compareBy,
      },
    };
  } catch (error) {
    console.error("Error fetching comparative analysis:", error);
    return { success: false, error: "Failed to fetch comparative analysis" };
  }
}
