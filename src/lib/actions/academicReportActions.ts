"use server";

import { db } from "@/lib/db";

// Get student performance report
export async function getStudentPerformanceReport(filters?: {
  academicYearId?: string;
  classId?: string;
  studentId?: string;
  termId?: string;
}) {
  try {
    const where: any = {};
    
    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.termId) where.termId = filters.termId;

    const results = await db.examResult.findMany({
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
            enrollments: { include: { class: true }, take: 1, orderBy: { enrollDate: 'desc' } },
          },
        },
        exam: {
          include: {
            subject: true,
            term: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate statistics
    const totalMarks = results.reduce((sum, r) => sum + r.marks, 0);
    const averageMarks = results.length > 0 ? totalMarks / results.length : 0;
    const passCount = results.filter(r => r.marks >= 40).length;
    const passPercentage = results.length > 0 ? (passCount / results.length) * 100 : 0;

    return {
      success: true,
      data: {
        results,
        statistics: {
          totalExams: results.length,
          averageMarks: Math.round(averageMarks * 100) / 100,
          passPercentage: Math.round(passPercentage * 100) / 100,
          highestMarks: results.length > 0 ? Math.max(...results.map(r => r.marks)) : 0,
          lowestMarks: results.length > 0 ? Math.min(...results.map(r => r.marks)) : 0,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching student performance report:", error);
    return { success: false, error: "Failed to fetch student performance report" };
  }
}

// Get grade distribution
export async function getGradeDistribution(filters?: {
  academicYearId?: string;
  classId?: string;
  subjectId?: string;
  termId?: string;
}) {
  try {
    const where: any = {};
    if (filters?.termId) where.termId = filters.termId;

    const results = await db.examResult.findMany({
      where,
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
      },
    });

    // Calculate grade distribution
    const gradeRanges = [
      { grade: "A+", min: 90, max: 100, count: 0 },
      { grade: "A", min: 80, max: 89, count: 0 },
      { grade: "B+", min: 70, max: 79, count: 0 },
      { grade: "B", min: 60, max: 69, count: 0 },
      { grade: "C", min: 50, max: 59, count: 0 },
      { grade: "D", min: 40, max: 49, count: 0 },
      { grade: "F", min: 0, max: 39, count: 0 },
    ];

    results.forEach(result => {
      const grade = gradeRanges.find(g => result.marks >= g.min && result.marks <= g.max);
      if (grade) grade.count++;
    });

    return {
      success: true,
      data: {
        distribution: gradeRanges,
        totalStudents: results.length,
      },
    };
  } catch (error) {
    console.error("Error fetching grade distribution:", error);
    return { success: false, error: "Failed to fetch grade distribution" };
  }
}

// Get subject-wise performance
export async function getSubjectWisePerformance(filters?: {
  academicYearId?: string;
  classId?: string;
  termId?: string;
}) {
  try {
    const where: any = {};
    if (filters?.termId) where.termId = filters.termId;

    const results = await db.examResult.findMany({
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
      const subjectName = result.exam.subject.name;
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: subjectName,
          totalMarks: 0,
          count: 0,
          highestMarks: result.marks,
          lowestMarks: result.marks,
        };
      }
      acc[subjectName].totalMarks += result.marks;
      acc[subjectName].count++;
      acc[subjectName].highestMarks = Math.max(acc[subjectName].highestMarks, result.marks);
      acc[subjectName].lowestMarks = Math.min(acc[subjectName].lowestMarks, result.marks);
      return acc;
    }, {});

    const subjectData = Object.values(subjectPerformance).map((subject: any) => ({
      ...subject,
      averageMarks: Math.round((subject.totalMarks / subject.count) * 100) / 100,
    }));

    return {
      success: true,
      data: subjectData,
    };
  } catch (error) {
    console.error("Error fetching subject-wise performance:", error);
    return { success: false, error: "Failed to fetch subject-wise performance" };
  }
}

// Get class rankings
export async function getClassRankings(filters?: {
  classId?: string;
  termId?: string;
}) {
  try {
    const where: any = {};
    if (filters?.termId) where.termId = filters.termId;

    const results = await db.examResult.findMany({
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
            enrollments: { include: { class: true }, take: 1, orderBy: { enrollDate: 'desc' } },
          },
        },
        exam: true,
      },
    });

    // Calculate total marks per student
    const studentTotals = results.reduce((acc: any, result) => {
      const studentId = result.studentId;
      if (!acc[studentId]) {
        acc[studentId] = {
          studentId,
          studentName: `${result.student.user.firstName} ${result.student.user.lastName}`,
          className: result.student.enrollments?.[0]?.class?.name || "N/A",
          totalMarks: 0,
          examCount: 0,
        };
      }
      acc[studentId].totalMarks += result.marks;
      acc[studentId].examCount++;
      return acc;
    }, {});

    // Calculate average and rank
    const rankings = Object.values(studentTotals)
      .map((student: any) => ({
        ...student,
        averageMarks: Math.round((student.totalMarks / student.examCount) * 100) / 100,
      }))
      .sort((a: any, b: any) => b.averageMarks - a.averageMarks)
      .map((student: any, index: number) => ({
        ...student,
        rank: index + 1,
      }));

    return {
      success: true,
      data: rankings,
    };
  } catch (error) {
    console.error("Error fetching class rankings:", error);
    return { success: false, error: "Failed to fetch class rankings" };
  }
}

// Get progress tracking
export async function getProgressTracking(studentId: string) {
  try {
    const results = await db.examResult.findMany({
      where: { studentId },
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

    // Group by term
    const termProgress = results.reduce((acc: any, result) => {
      const termName = result.exam.term?.name || "Unknown";
      if (!acc[termName]) {
        acc[termName] = {
          term: termName,
          totalMarks: 0,
          count: 0,
        };
      }
      acc[termName].totalMarks += result.marks;
      acc[termName].count++;
      return acc;
    }, {});

    const progressData = Object.values(termProgress).map((term: any) => ({
      ...term,
      averageMarks: Math.round((term.totalMarks / term.count) * 100) / 100,
    }));

    return {
      success: true,
      data: progressData,
    };
  } catch (error) {
    console.error("Error fetching progress tracking:", error);
    return { success: false, error: "Failed to fetch progress tracking" };
  }
}

