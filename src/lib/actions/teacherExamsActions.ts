"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { DayOfWeek } from "@prisma/client";
import {
  createCalendarEventFromExam,
  updateCalendarEventFromExam,
  deleteCalendarEventFromExam
} from "../services/exam-calendar-integration";
import { calculateGrade } from "../utils/grade-calculator";

/**
 * Get all exams for a teacher
 */
export async function getTeacherExams(subjectId?: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Find all subject-teacher relationships for this teacher
    const subjectTeachers = await db.subjectTeacher.findMany({
      where: {
        teacherId: teacher.id,
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        subject: true,
      },
    });

    const subjectIds = subjectTeachers.map(st => st.subjectId);

    // Get all exams for these subjects
    const exams = await db.exam.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
      },
      include: {
        subject: true,
        examType: true,
        term: true,
        results: true,
      },
      orderBy: {
        examDate: 'asc',
      },
    });

    // Get all classes for these subjects
    const subjectClasses = await db.subjectClass.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
      },
      include: {
        class: true,
      },
    });

    // Map classes to subjects
    const classesMap = subjectClasses.reduce((acc, sc) => {
      if (!acc[sc.subjectId]) {
        acc[sc.subjectId] = [];
      }
      acc[sc.subjectId].push({
        id: sc.class.id,
        name: sc.class.name,
      });
      return acc;
    }, {} as Record<string, { id: string; name: string }[]>);

    // Format the exams data for the UI
    const formattedExams = exams.map(exam => {
      const status =
        exam.examDate > new Date() ? "upcoming" :
          exam.examDate < new Date() ? "completed" : "ongoing";

      // Calculate stats for completed exams
      const submittedCount = exam.results.length;
      const totalStudents = submittedCount; // This is a simplification. In a real scenario, you'd need to get the actual class enrollment.

      // Calculate average score for completed exams
      const totalScore = exam.results.reduce((sum, result) => sum + result.marks, 0);
      const avgScore = submittedCount > 0 ? totalScore / submittedCount : 0;

      return {
        id: exam.id,
        title: exam.title,
        subject: exam.subject.name,
        subjectId: exam.subjectId,
        grade: classesMap[exam.subjectId]?.[0]?.name || "Unknown Class",
        section: "All", // This is a simplification. You'd need to get the actual sections.
        examType: exam.examType.name,
        date: exam.examDate,
        startTime: new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date(exam.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: `${Math.round((new Date(exam.endTime).getTime() - new Date(exam.startTime).getTime()) / (1000 * 60))} minutes`,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        status,
        submittedBy: submittedCount,
        totalStudents,
        avgScore: avgScore.toFixed(1),
      };
    });

    return {
      exams: formattedExams,
      subjects: subjectTeachers.map(st => ({
        id: st.subject.id,
        name: st.subject.name,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch teacher exams:", error);
    throw new Error("Failed to fetch exams");
  }
}

/**
 * Get a single exam's details
 */
export async function getTeacherExam(examId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Find the exam
    const exam = await db.exam.findUnique({
      where: {
        id: examId,
      },
      include: {
        subject: true,
        examType: true,
        term: true,
        results: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      throw new Error("Exam not found");
    }

    // Verify that this teacher has access to this exam's subject
    const subjectTeacher = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: exam.subjectId,
      },
    });

    if (!subjectTeacher) {
      throw new Error("Unauthorized access to this exam");
    }

    // Get class information
    const subjectClass = await db.subjectClass.findFirst({
      where: {
        subjectId: exam.subjectId,
      },
      include: {
        class: true,
      },
    });

    // Format the results data
    const results = exam.results.map(result => {
      return {
        id: result.id,
        studentId: result.studentId,
        studentName: `${result.student.user.firstName} ${result.student.user.lastName}`,
        marks: result.marks,
        grade: result.grade || 'N/A',
        remarks: result.remarks || '',
        isAbsent: result.isAbsent,
      };
    });

    // Calculate statistics
    const totalSubmissions = results.length;
    const absentCount = results.filter(r => r.isAbsent).length;
    const presentCount = totalSubmissions - absentCount;
    const totalMarks = results.reduce((sum, r) => sum + (r.isAbsent ? 0 : r.marks), 0);
    const averageMark = presentCount > 0 ? totalMarks / presentCount : 0;

    // Create grade distribution using standardized logic
    const gradeDistribution = results.reduce((acc, r) => {
      if (r.isAbsent) return acc;

      const percentage = (r.marks / exam.totalMarks) * 100;
      const grade = calculateGrade(percentage);

      if (!acc[grade]) acc[grade] = 0;
      acc[grade]++;
      return acc;
    }, {} as Record<string, number>);

    return {
      id: exam.id,
      title: exam.title,
      subject: exam.subject.name,
      subjectId: exam.subjectId,
      examType: exam.examType.name,
      examTypeId: exam.examTypeId,
      date: exam.examDate,
      startTime: new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date(exam.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      className: subjectClass?.class.name || 'Unknown Class',
      instructions: exam.instructions || '',
      results,
      statistics: {
        totalStudents: totalSubmissions,
        present: presentCount,
        absent: absentCount,
        averageMark,
        highestMark: Math.max(...results.map(r => r.isAbsent ? 0 : r.marks)),
        lowestMark: Math.min(...results.filter(r => !r.isAbsent).map(r => r.marks)),
        passRate: presentCount > 0
          ? (results.filter(r => !r.isAbsent && r.marks >= exam.passingMarks).length / presentCount) * 100
          : 0,
        gradeDistribution,
      }
    };
  } catch (error) {
    console.error("Failed to fetch exam details:", error);
    throw new Error("Failed to fetch exam details");
  }
}

/**
 * Create a new exam
 */
export async function createExam(formData: FormData) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Extract form data
    const title = formData.get('title') as string;
    const subjectId = formData.get('subjectId') as string;
    const examTypeId = formData.get('examTypeId') as string;
    const termId = formData.get('termId') as string;
    const examDate = new Date(formData.get('examDate') as string);
    const startTime = new Date(formData.get('startTime') as string);
    const endTime = new Date(formData.get('endTime') as string);
    const totalMarks = parseFloat(formData.get('totalMarks') as string);
    const passingMarks = parseFloat(formData.get('passingMarks') as string);
    const instructions = formData.get('instructions') as string;

    // Validate that this teacher has access to this subject
    const subjectTeacher = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId,
      },
    });

    if (!subjectTeacher) {
      throw new Error("Unauthorized access to this subject");
    }

    // Create the exam
    const exam = await db.exam.create({
      data: {
        title,
        subjectId,
        examTypeId,
        termId,
        examDate,
        startTime,
        endTime,
        totalMarks,
        passingMarks,
        creatorId: teacher.id,
        instructions,
      },
      include: {
        subject: true,
        examType: true,
        term: {
          include: {
            academicYear: true
          }
        }
      }
    });

    // Create calendar event for the exam
    // Requirement 10.1: Automatically generate a calendar event with exam details
    await createCalendarEventFromExam(exam as any, userId);

    revalidatePath('/teacher/assessments/exams');

    return { success: true, examId: exam.id };
  } catch (error) {
    console.error("Failed to create exam:", error);
    return { success: false, error: "Failed to create exam" };
  }
}

/**
 * Update exam results
 */
export async function updateExamResults(examId: string, results: any[]) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Find the exam
    const exam = await db.exam.findUnique({
      where: {
        id: examId,
      },
    });

    if (!exam) {
      throw new Error("Exam not found");
    }

    // Verify that this teacher has access to this exam's subject
    const subjectTeacher = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: exam.subjectId,
      },
    });

    if (!subjectTeacher) {
      throw new Error("Unauthorized access to this exam");
    }

    // Update or create each result
    for (const result of results) {
      await db.examResult.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: result.studentId,
          },
        },
        update: {
          marks: result.marks,
          grade: result.grade,
          remarks: result.remarks,
          isAbsent: result.isAbsent,
        },
        create: {
          examId,
          studentId: result.studentId,
          marks: result.marks,
          grade: result.grade,
          remarks: result.remarks,
          isAbsent: result.isAbsent,
        },
      });
    }

    revalidatePath(`/teacher/assessments/exams/${examId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update exam results:", error);
    return { success: false, error: "Failed to update exam results" };
  }
}

/**
 * Get all exam types
 */
export async function getExamTypes() {
  try {
    const examTypes = await db.examType.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return { examTypes };
  } catch (error) {
    console.error("Failed to fetch exam types:", error);
    throw new Error("Failed to fetch exam types");
  }
}

/**
 * Get active terms
 */
export async function getActiveTerms() {
  try {
    // Get current academic year
    const currentAcademicYear = await db.academicYear.findFirst({
      where: {
        isCurrent: true,
      },
    });

    if (!currentAcademicYear) {
      return { terms: [] };
    }

    // Get terms for current academic year
    const terms = await db.term.findMany({
      where: {
        academicYearId: currentAcademicYear.id,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return { terms };
  } catch (error) {
    console.error("Failed to fetch active terms:", error);
    throw new Error("Failed to fetch active terms");
  }
}

/**
 * Get students for an exam
 */
export async function getStudentsForExam(subjectId: string) {
  try {
    // Find classes for this subject
    const subjectClasses = await db.subjectClass.findMany({
      where: {
        subjectId,
      },
      include: {
        class: true,
      },
    });

    const classIds = subjectClasses.map(sc => sc.classId);

    // Find students enrolled in these classes
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId: {
          in: classIds,
        },
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        class: true,
        section: true,
      },
    });

    // Format student data
    const students = enrollments.map(enrollment => ({
      id: enrollment.student.id,
      name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
      rollNumber: enrollment.student.rollNumber || enrollment.rollNumber || 'N/A',
      class: enrollment.class.name,
      section: enrollment.section.name,
    }));

    return { students };
  } catch (error) {
    console.error("Failed to fetch students for exam:", error);
    throw new Error("Failed to fetch students");
  }
}
