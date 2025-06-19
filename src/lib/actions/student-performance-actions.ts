"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

/**
 * Get the current student details based on authenticated user
 */
async function getCurrentStudent() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.STUDENT) {
    return null;
  }
  
  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id
    },
    include: {
      enrollments: {
        orderBy: {
          enrollDate: 'desc'
        },
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

  return student;
}

/**
 * Get overall performance summary
 */
export async function getPerformanceSummary() {
  const student = await getCurrentStudent();
  
  if (!student) {
    redirect("/login");
  }
  
  // Get current enrollment
  const currentEnrollment = student.enrollments[0];
  
  if (!currentEnrollment) {
    return {
      student,
      overallPercentage: 0,
      grade: "N/A",
      totalExams: 0,
      rank: null,
      className: "N/A"
    };
  }

  // Get subjects for the student's class
  const subjectClasses = await db.subjectClass.findMany({
    where: {
      classId: currentEnrollment.classId
    },
    include: {
      subject: true
    }
  });

  const subjectIds = subjectClasses.map(sc => sc.subjectId);

  // Get all exam results for the student
  const examResults = await db.examResult.findMany({
    where: {
      studentId: student.id,
      exam: {
        subjectId: {
          in: subjectIds
        }
      }
    },
    include: {
      exam: {
        include: {
          subject: true,
          examType: true,
          term: true
        }
      }
    }
  });

  // Calculate overall statistics
  const totalExams = examResults.length;
  const totalMarks = examResults.reduce((sum, result) => sum + result.marks, 0);
  const totalPossibleMarks = examResults.reduce((sum, result) => sum + result.exam.totalMarks, 0);
  const overallPercentage = totalPossibleMarks > 0 
    ? Math.round((totalMarks / totalPossibleMarks) * 100 * 10) / 10 
    : 0;
  
  // Find latest report card for rank
  const latestReportCard = await db.reportCard.findFirst({
    where: {
      studentId: student.id,
      isPublished: true
    },
    orderBy: {
      publishDate: 'desc'
    }
  });
  
  // Get grade based on percentage
  let grade;
  
  // Try to use grade scale from database if available
  const gradeScale = await db.gradeScale.findFirst({
    where: {
      minMarks: { lte: overallPercentage },
      maxMarks: { gte: overallPercentage }
    }
  });
  
  if (gradeScale) {
    grade = gradeScale.grade;
  } else {
    // Fallback to calculation
    grade = getGradeFromPercentage(overallPercentage);
  }
  
  return {
    student,
    overallPercentage,
    grade,
    totalExams,
    rank: latestReportCard?.rank || null,
    className: currentEnrollment.class.name
  };
}

/**
 * Get subject performance data
 */
export async function getSubjectPerformance() {
  const student = await getCurrentStudent();
  
  if (!student) {
    redirect("/login");
  }
  
  // Get current enrollment
  const currentEnrollment = student.enrollments[0];
  
  if (!currentEnrollment) {
    return [];
  }

  // Get subjects for the student's class
  const subjectClasses = await db.subjectClass.findMany({
    where: {
      classId: currentEnrollment.classId
    },
    include: {
      subject: true
    }
  });

  // Get all exam results for the student
  const examResults = await db.examResult.findMany({
    where: {
      studentId: student.id
    },
    include: {
      exam: {
        include: {
          subject: true
        }
      }
    }
  });

  // Calculate subject-wise performance
  const subjectsPerformance = subjectClasses.map(subjectClass => {
    const subjectResults = examResults.filter(
      result => result.exam.subjectId === subjectClass.subjectId
    );
    
    const totalSubjectMarks = subjectResults.reduce((sum, result) => sum + result.marks, 0);
    const totalPossibleSubjectMarks = subjectResults.reduce(
      (sum, result) => sum + result.exam.totalMarks, 0
    );
    
    const subjectPercentage = totalPossibleSubjectMarks > 0 
      ? Math.round((totalSubjectMarks / totalPossibleSubjectMarks) * 100 * 10) / 10
      : 0;
    
    // Sort subject results by date to get the most recent
    const sortedResults = [...subjectResults].sort((a, b) => 
      new Date(b.exam.examDate).getTime() - new Date(a.exam.examDate).getTime()
    );

    const lastExam = sortedResults[0];
    
    return {
      id: subjectClass.subjectId,
      name: subjectClass.subject.name,
      code: subjectClass.subject.code,
      percentage: subjectPercentage,
      examsTaken: subjectResults.length,
      lastScore: lastExam ? lastExam.marks : null,
      lastScoreTotal: lastExam ? lastExam.exam.totalMarks : null,
      lastExamDate: lastExam ? lastExam.exam.examDate : null,
      grade: getGradeFromPercentage(subjectPercentage)
    };
  });

  // Sort by percentage descending
  return subjectsPerformance.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Get performance trends over time
 */
export async function getPerformanceTrends() {
  const student = await getCurrentStudent();
  
  if (!student) {
    redirect("/login");
  }
  
  // Get current enrollment
  const currentEnrollment = student.enrollments[0];
  
  if (!currentEnrollment) {
    return {
      termPerformance: [],
      subjectTrends: [],
      examPerformance: []
    };
  }

  // Get terms for the academic year
  const terms = await db.term.findMany({
    where: {
      academicYearId: currentEnrollment.class.academicYearId
    },
    orderBy: {
      startDate: 'asc'
    }
  });

  // Get exam results grouped by term
  const examResults = await db.examResult.findMany({
    where: {
      studentId: student.id
    },
    include: {
      exam: {
        include: {
          subject: true,
          term: true
        }
      }
    }
  });

  // Get report cards
  const reportCards = await db.reportCard.findMany({
    where: {
      studentId: student.id
    },
    include: {
      term: true
    },
    orderBy: {
      term: {
        startDate: 'asc'
      }
    }
  });

  // Calculate term-wise performance
  const termPerformance = terms.map(term => {
    const termResults = examResults.filter(
      result => result.exam.termId === term.id
    );
    
    const totalTermMarks = termResults.reduce((sum, result) => sum + result.marks, 0);
    const totalPossibleTermMarks = termResults.reduce(
      (sum, result) => sum + result.exam.totalMarks, 0
    );
    
    const termPercentage = totalPossibleTermMarks > 0 
      ? Math.round((totalTermMarks / totalPossibleTermMarks) * 100 * 10) / 10 
      : 0;
    
    // Get report card if available
    const reportCard = reportCards.find(rc => rc.termId === term.id);
    
    return {
      id: term.id,
      name: term.name,
      startDate: term.startDate,
      endDate: term.endDate,
      percentage: termPercentage,
      averageMarks: reportCard?.averageMarks || null,
      rank: reportCard?.rank || null,
      grade: reportCard?.grade || getGradeFromPercentage(termPercentage),
      attendance: reportCard?.attendance || null
    };
  });

  // Get subject trends (performance in each subject over terms)
  const subjects = await db.subjectClass.findMany({
    where: {
      classId: currentEnrollment.classId
    },
    include: {
      subject: true
    }
  });

  const subjectTrends = subjects.map(subjectClass => {
    const subjectResults = examResults.filter(
      result => result.exam.subjectId === subjectClass.subjectId
    );

    // Group results by term
    const termData = terms.map(term => {
      const termSubjectResults = subjectResults.filter(
        result => result.exam.termId === term.id
      );
      
      const totalMarks = termSubjectResults.reduce((sum, result) => sum + result.marks, 0);
      const totalPossible = termSubjectResults.reduce((sum, result) => sum + result.exam.totalMarks, 0);
      
      const percentage = totalPossible > 0 
        ? Math.round((totalMarks / totalPossible) * 100 * 10) / 10 
        : null;
      
      return {
        termId: term.id,
        termName: term.name,
        percentage
      };
    });

    return {
      id: subjectClass.subjectId,
      name: subjectClass.subject.name,
      code: subjectClass.subject.code,
      termData
    };
  });

  // Get chronological exam performance
  const examPerformance = examResults
    .sort((a, b) => new Date(a.exam.examDate).getTime() - new Date(b.exam.examDate).getTime())
    .map(result => ({
      id: result.id,
      examId: result.examId,
      examName: result.exam.title,
      subject: result.exam.subject.name,
      subjectCode: result.exam.subject.code,
      date: result.exam.examDate,
      marks: result.marks,
      totalMarks: result.exam.totalMarks,
      percentage: Math.round((result.marks / result.exam.totalMarks) * 100 * 10) / 10,
      term: result.exam.term.name
    }));

  return {
    termPerformance,
    subjectTrends,
    examPerformance
  };
}

/**
 * Get attendance vs performance data
 */
export async function getAttendanceVsPerformance() {
  const student = await getCurrentStudent();
  
  if (!student) {
    redirect("/login");
  }
  
  // Get months of attendance and corresponding exams
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setMonth(startDate.getMonth() - 6); // Last 6 months
  
  // Get attendance records by month
  const attendanceRecords = await db.studentAttendance.findMany({
    where: {
      studentId: student.id,
      date: {
        gte: startDate
      }
    }
  });
  
  // Get exam results in the same period
  const examResults = await db.examResult.findMany({
    where: {
      studentId: student.id,
      exam: {
        examDate: {
          gte: startDate
        }
      }
    },
    include: {
      exam: true
    }
  });
  
  // Group attendance by month
  const attendanceByMonth = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(currentDate);
    month.setMonth(currentDate.getMonth() - i);
    month.setDate(1); // First day of month
    
    const monthName = month.toLocaleString('default', { month: 'short' });
    const year = month.getFullYear();
    const monthStart = new Date(year, month.getMonth(), 1);
    const monthEnd = new Date(year, month.getMonth() + 1, 0);
    
    const monthRecords = attendanceRecords.filter(
      record => {
        const recordDate = new Date(record.date);
        return recordDate >= monthStart && recordDate <= monthEnd;
      }
    );
    
    const totalDays = monthRecords.length;
    const presentDays = monthRecords.filter(r => r.status === "PRESENT").length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    // Get exam results for this month
    const monthExams = examResults.filter(result => {
      const examDate = new Date(result.exam.examDate);
      return examDate >= monthStart && examDate <= monthEnd;
    });
    
    const totalMarks = monthExams.reduce((sum, result) => sum + result.marks, 0);
    const totalPossible = monthExams.reduce((sum, result) => sum + result.exam.totalMarks, 0);
    const performancePercentage = totalPossible > 0 
      ? Math.round((totalMarks / totalPossible) * 100) 
      : null;
    
    return {
      month: monthName,
      year,
      attendance: attendancePercentage,
      performance: performancePercentage
    };
  });
  
  // Reverse to get chronological order (oldest first)
  return attendanceByMonth.reverse();
}

/**
 * Get class rank analysis
 */
export async function getClassRankAnalysis() {
  const student = await getCurrentStudent();
  
  if (!student) {
    redirect("/login");
  }
  
  // Get report cards with rank
  const reportCards = await db.reportCard.findMany({
    where: {
      studentId: student.id,
      isPublished: true
    },
    include: {
      term: true
    },
    orderBy: {
      term: {
        startDate: 'asc'
      }
    }
  });
  
  // Get current enrollment class size for context
  const currentEnrollment = student.enrollments[0];
  
  let classSize = 0;
  if (currentEnrollment) {
    classSize = await db.classEnrollment.count({
      where: {
        classId: currentEnrollment.classId,
        status: "ACTIVE"
      }
    });
  }
  
  // Format rank data
  const rankData = reportCards.map(rc => ({
    term: rc.term.name,
    rank: rc.rank,
    totalStudents: classSize,
    percentile: rc.rank && classSize 
      ? Math.round(((classSize - rc.rank) / classSize) * 100) 
      : null,
    percentage: rc.percentage
  }));
  
  return {
    rankData,
    currentRank: reportCards.length > 0 ? reportCards[reportCards.length - 1].rank : null,
    classSize
  };
}

/**
 * Helper function to get grade from percentage
 */
function getGradeFromPercentage(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  if (percentage >= 45) return 'D+';
  if (percentage >= 40) return 'D';
  return 'F';
}
