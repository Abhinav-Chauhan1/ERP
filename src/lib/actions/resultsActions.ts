"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { calculateGrade } from "@/lib/utils/grade-calculator";
import { ResultFilterValues, PublishResultsValues, GenerateReportCardValues } from "../schemaValidation/resultsSchemaValidation";
import { auth } from "@/auth";

// Get all exam results with optional filtering
export async function getExamResults(filters?: ResultFilterValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    
    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();
    
    // Build the query
    const where: any = {
      schoolId // CRITICAL: Filter by current school
    };

    // Add filters if provided
    if (filters) {
      if (filters.subjectId) {
        where.subjectId = filters.subjectId;
      }

      if (filters.examTypeId) {
        where.examTypeId = filters.examTypeId;
      }

      if (filters.termId) {
        where.termId = filters.termId;
      }

      if (filters.dateFrom) {
        where.examDate = {
          ...(where.examDate || {}),
          gte: filters.dateFrom
        };
      }

      if (filters.dateTo) {
        where.examDate = {
          ...(where.examDate || {}),
          lte: filters.dateTo
        };
      }

      // Search term can match title or description
      if (filters.searchTerm) {
        where.OR = [
          { title: { contains: filters.searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    // Fetch all exams with their results
    const exams = await db.exam.findMany({
      where,
      include: {
        subject: true,
        examType: true,
        term: {
          include: {
            academicYear: true,
          }
        },
        results: {
          include: {
            student: true,
          }
        },
        creator: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      },
      orderBy: {
        examDate: 'desc',
      }
    });

    // Process and calculate statistics for each exam
    const examResults = exams.map(exam => {
      const totalStudents = exam.results.length;
      const absentStudents = exam.results.filter(r => r.isAbsent).length;
      const presentStudents = totalStudents - absentStudents;

      // Calculate statistics only if there are present students
      let highestScore = 0;
      let lowestScore = exam.totalMarks;
      let totalScore = 0;
      let passedStudents = 0;

      if (presentStudents > 0) {
        const presentResults = exam.results.filter(r => !r.isAbsent);
        highestScore = Math.max(...presentResults.map(r => r.marks));
        lowestScore = Math.min(...presentResults.map(r => r.marks));
        totalScore = presentResults.reduce((sum, r) => sum + r.marks, 0);
        passedStudents = presentResults.filter(r => r.marks >= exam.passingMarks).length;
      }

      const averageScore = presentStudents > 0 ? totalScore / presentStudents : 0;
      const passPercentage = presentStudents > 0 ? (passedStudents / presentStudents) * 100 : 0;

      // Count grades (A, B, C, etc.) - this uses a simplified grading scale
      const gradeDistribution: Record<string, number> = {};
      exam.results.forEach(result => {
        if (!result.isAbsent && result.grade) {
          gradeDistribution[result.grade] = (gradeDistribution[result.grade] || 0) + 1;
        }
      });

      return {
        id: exam.id,
        examName: exam.title,
        subject: exam.subject.name,
        examType: exam.examType.name,
        term: exam.term.name,
        academicYear: exam.term.academicYear.name,
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        totalStudents,
        absentStudents,
        highestScore,
        lowestScore,
        averageScore,
        passPercentage,
        gradeDistribution,
        isPublished: true, // This would normally come from the database
        publishedOn: new Date(), // This would normally come from the database
        createdBy: exam.creator ? `${exam.creator.user.firstName} ${exam.creator.user.lastName}` : "System"
      };
    });

    return { success: true, data: examResults };
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exam results"
    };
  }
}

// Get results for a specific exam
export async function getExamResultById(examId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    
    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();
    
    const exam = await db.exam.findUnique({
      where: { 
        id: examId,
        schoolId // CRITICAL: Ensure exam belongs to current school
      },
      include: {
        subject: true,
        examType: true,
        term: {
          include: {
            academicYear: true,
          }
        },
        results: {
          include: {
            student: {
              include: {
                user: true,
              }
            },
          }
        },
        creator: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    // Calculate exam statistics
    const totalStudents = exam.results.length;
    const absentStudents = exam.results.filter(r => r.isAbsent).length;
    const presentStudents = totalStudents - absentStudents;

    let highestScore = 0;
    let lowestScore = exam.totalMarks;
    let totalScore = 0;
    let passedStudents = 0;

    if (presentStudents > 0) {
      const presentResults = exam.results.filter(r => !r.isAbsent);
      highestScore = Math.max(...presentResults.map(r => r.marks));
      lowestScore = Math.min(...presentResults.map(r => r.marks));
      totalScore = presentResults.reduce((sum, r) => sum + r.marks, 0);
      passedStudents = presentResults.filter(r => r.marks >= exam.passingMarks).length;
    }

    const averageScore = presentStudents > 0 ? totalScore / presentStudents : 0;
    const passPercentage = presentStudents > 0 ? (passedStudents / presentStudents) * 100 : 0;

    // Count grades (A, B, C, etc.)
    const gradeDistribution: Record<string, number> = {};
    exam.results.forEach(result => {
      if (!result.isAbsent && result.grade) {
        gradeDistribution[result.grade] = (gradeDistribution[result.grade] || 0) + 1;
      }
    });

    const resultDetails = {
      id: exam.id,
      title: exam.title,
      subject: exam.subject.name,
      subjectId: exam.subjectId,
      examType: exam.examType.name,
      examTypeId: exam.examTypeId,
      term: exam.term.name,
      termId: exam.termId,
      academicYear: exam.term.academicYear.name,
      academicYearId: exam.term.academicYearId,
      examDate: exam.examDate,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      instructions: exam.instructions,
      totalStudents,
      absentStudents,
      presentStudents,
      highestScore,
      lowestScore,
      averageScore,
      passPercentage,
      gradeDistribution,
      isPublished: true, // This would normally come from the database
      publishedOn: new Date(), // This would normally come from the database
      createdBy: exam.creator ? `${exam.creator.user.firstName} ${exam.creator.user.lastName}` : "System",
      studentResults: exam.results.map(result => ({
        id: result.id,
        student: {
          id: result.student.id,
          name: `${result.student.user.firstName} ${result.student.user.lastName}`,
          admissionId: result.student.admissionId,
          rollNumber: result.student.rollNumber || "",
        },
        marks: result.marks,
        grade: result.grade || "",
        remarks: result.remarks || "",
        isAbsent: result.isAbsent,
        isPass: !result.isAbsent && result.marks >= exam.passingMarks,
      }))
    };

    return { success: true, data: resultDetails };
  } catch (error) {
    console.error("Error fetching exam result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exam result"
    };
  }
}

// Get student results (across exams)
export async function getStudentResults(studentId: string, termId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    
    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();
    
    // Build the query
    const where: any = {
      studentId,
      student: {
        schoolId // CRITICAL: Ensure student belongs to current school
      }
    };

    if (termId) {
      where.exam = {
        termId,
        schoolId // CRITICAL: Ensure exam belongs to current school
      };
    } else {
      where.exam = {
        schoolId // CRITICAL: Ensure exam belongs to current school
      };
    }

    // Get all results for this student
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
        },
        student: {
          include: {
            user: true,
            enrollments: {
              include: {
                class: true,
                section: true,
              },
              where: {
                status: "ACTIVE"
              }
            }
          }
        }
      },
      orderBy: [
        { exam: { examDate: 'desc' } }
      ]
    });

    if (results.length === 0) {
      // Get basic student info even if no results
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              class: true,
              section: true,
            }
          }
        }
      });

      if (!student) {
        return { success: false, error: "Student not found" };
      }

      const currentEnrollment = student.enrollments[0];

      return {
        success: true,
        data: {
          student: {
            id: student.id,
            name: `${student.user.firstName} ${student.user.lastName}`,
            admissionId: student.admissionId,
            rollNumber: student.rollNumber || "",
            photo: student.user.avatar,
            grade: currentEnrollment?.class.name || "",
            section: currentEnrollment?.section.name || "",
          },
          results: [],
          summary: {
            totalExams: 0,
            totalMarks: 0,
            obtainedMarks: 0,
            percentage: 0,
            rank: 0,
            grade: "",
            attendance: 0,
          }
        }
      };
    }

    // Get basic student details from the first result
    const student = results[0].student;
    const currentEnrollment = student.enrollments[0];

    // Organize results by subject
    const examsBySubject: Record<string, any[]> = {};

    results.forEach(result => {
      const subject = result.exam.subject.name;
      if (!examsBySubject[subject]) {
        examsBySubject[subject] = [];
      }

      examsBySubject[subject].push({
        id: result.exam.id,
        examName: result.exam.title,
        examType: result.exam.examType.name,
        term: result.exam.term.name,
        subject: subject,
        marks: result.marks,
        totalMarks: result.exam.totalMarks,
        percentage: (result.marks / result.exam.totalMarks) * 100,
        grade: result.grade || "",
        isAbsent: result.isAbsent,
        date: result.exam.examDate,
      });
    });

    // Calculate summary statistics
    const presentResults = results.filter(r => !r.isAbsent);
    const totalExams = results.length;
    const totalMarks = presentResults.reduce((sum, r) => sum + r.exam.totalMarks, 0);
    const obtainedMarks = presentResults.reduce((sum, r) => sum + r.marks, 0);
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

    // Generate a grade based on percentage using standardized utility
    const grade = calculateGrade(percentage);

    // Convert subject-based results to a flat list for the response
    const exams = Object.values(examsBySubject).flat();

    // Get attendance data (mock for now)
    const attendance = 92.5; // Would be calculated from attendance records

    return {
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          studentId: student.admissionId,
          admissionId: student.admissionId,
          rollNumber: student.rollNumber || "",
          photo: student.user.avatar,
          grade: currentEnrollment?.class.name || "",
          section: currentEnrollment?.section.name || "",
        },
        exams,
        examsBySubject,
        summary: {
          totalExams,
          totalMarks,
          obtainedMarks,
          percentage,
          rank: 0, // Would need to calculate based on all students
          grade,
          attendance,
        }
      }
    };
  } catch (error) {
    console.error("Error fetching student results:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch student results"
    };
  }
}

// Publish exam results
export async function publishExamResults(data: PublishResultsValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    // In a real implementation, this might update a 'isPublished' field on the exam
    // or create notifications for students

    // For now, we'll just revalidate the paths
    revalidatePath("/admin/assessment/results");
    revalidatePath(`/admin/assessment/exams/${data.examId}`);

    return {
      success: true,
      message: "Exam results published successfully"
    };
  } catch (error) {
    console.error("Error publishing exam results:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish exam results"
    };
  }
}

// Generate report card
export async function generateReportCard(data: GenerateReportCardValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    
    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();
    
    // Check if report card already exists
    const existingReportCard = await db.reportCard.findFirst({
      where: {
        studentId: data.studentId,
        termId: data.termId
      }
    });

    // Get all exam results for the student in the selected term
    const results = await db.examResult.findMany({
      where: {
        studentId: data.studentId,
        exam: {
          termId: data.termId
        }
      },
      include: {
        exam: true
      }
    });

    // Calculate overall statistics
    const totalResults = results.length;
    const presentResults = results.filter(r => !r.isAbsent);
    const totalMarks = presentResults.reduce((sum, r) => sum + r.exam.totalMarks, 0);
    const obtainedMarks = presentResults.reduce((sum, r) => sum + r.marks, 0);
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

    // Calculate grade based on percentage using standardized utility
    const grade = calculateGrade(percentage);

    // Calculate attendance (mock for now)
    const attendance = 92.5;

    // Create or update the report card
    let reportCard;

    if (existingReportCard) {
      reportCard = await db.reportCard.update({
        where: { id: existingReportCard.id },
        data: {
          totalMarks,
          averageMarks: totalMarks > 0 ? obtainedMarks / totalResults : 0,
          percentage,
          grade,
          attendance,
          teacherRemarks: data.teacherRemarks,
          principalRemarks: data.principalRemarks,
          isPublished: true,
          publishDate: new Date()
        }
      });
    } else {
      reportCard = await db.reportCard.create({
        data: {
          studentId: data.studentId,
          termId: data.termId,
          totalMarks,
          averageMarks: totalMarks > 0 ? obtainedMarks / totalResults : 0,
          percentage,
          grade,
          attendance,
          teacherRemarks: data.teacherRemarks,
          principalRemarks: data.principalRemarks,
          isPublished: true,
          publishDate: new Date(),
          schoolId, // Add required schoolId
        }
      });
    }

    revalidatePath("/admin/assessment/results");
    revalidatePath(`/admin/assessment/report-cards/${reportCard.id}`);

    return {
      success: true,
      data: reportCard,
      message: "Report card generated successfully"
    };
  } catch (error) {
    console.error("Error generating report card:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate report card"
    };
  }
}

// Get available exam filters (subjects, grades, exam types)
export async function getResultFilters() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    
    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();
    
    const [subjects, examTypes, terms] = await Promise.all([
      db.subject.findMany({
        where: { schoolId }, // CRITICAL: Filter by current school
        orderBy: { name: 'asc' }
      }),
      db.examType.findMany({
        where: { schoolId }, // CRITICAL: Filter by current school
        orderBy: { name: 'asc' }
      }),
      db.term.findMany({
        where: { 
          academicYear: {
            schoolId // CRITICAL: Filter by current school
          }
        },
        orderBy: { startDate: 'desc' },
        include: {
          academicYear: true
        }
      })
    ]);

    // For grades/classes, get distinct class names
    const classes = await db.class.findMany({
      where: { schoolId }, // CRITICAL: Filter by current school
      orderBy: { name: 'asc' },
      distinct: ['name'],
    });

    return {
      success: true,
      data: {
        subjects,
        examTypes,
        terms,
        classes
      }
    };
  } catch (error) {
    console.error("Error fetching result filters:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch filters"
    };
  }
}
