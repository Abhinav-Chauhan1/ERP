"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { DayOfWeek } from "@prisma/client";
import { getRequiredSchoolId } from '@/lib/utils/school-context-helper';
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

    // Find all subject-teacher relationships for this teacher (global assignments)
    const subjectTeachers = await db.subjectTeacher.findMany({
      where: {
        teacherId: teacher.id,
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        subject: true,
      },
    });

    // Find all subject-class relationships for this teacher (class-specific assignments)
    const teacherSubjectClasses = await db.subjectClass.findMany({
      where: {
        teacherId: teacher.id,
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        subject: true,
        class: true,
        section: true,
      },
    });

    const globalSubjectIds = subjectTeachers.map(st => st.subjectId);
    
    // Construct OR conditions for exams: either globally assigned subject, OR class-assigned combination
    const OR_conditions: any[] = [];
    
    if (globalSubjectIds.length > 0) {
      OR_conditions.push({
        subjectId: { in: globalSubjectIds },
      });
    }
    
    teacherSubjectClasses.forEach(sc => {
      if (!globalSubjectIds.includes(sc.subjectId)) {
        OR_conditions.push({
          subjectId: sc.subjectId,
          classId: sc.classId,
        });
      }
    });

    // If no assignments at all, return empty
    if (OR_conditions.length === 0) {
      return {
        exams: [],
        subjects: [],
      };
    }

    // Get all exams for these combinations
    const exams = await db.exam.findMany({
      where: {
        OR: OR_conditions,
      },
      include: {
        subject: true,
        examType: true,
        term: true,
        class: true,
        results: true,
      },
      orderBy: {
        examDate: 'asc',
      },
    });

    // Format the exams data for the UI
    const formattedExams = exams.map(exam => {
      const status =
        exam.examDate > new Date() ? "upcoming" :
          exam.examDate < new Date() ? "completed" : "ongoing";

      // Calculate stats for completed exams
      const submittedCount = exam.results.length;
      const totalStudents = submittedCount; // Simplification

      // Calculate average score for completed exams
      const totalScore = exam.results.reduce((sum, result) => sum + result.marks, 0);
      const avgScore = submittedCount > 0 ? totalScore / submittedCount : 0;

      // Determine sections assigned to this teacher for this exam's class and subject
      const assignedSections = teacherSubjectClasses
        .filter(sc => sc.subjectId === exam.subjectId && sc.classId === exam.classId)
        .map(sc => sc.section?.name)
        .filter((name): name is string => name !== null && name !== undefined);

      const isGloballyAssigned = globalSubjectIds.includes(exam.subjectId);
      const sectionDisplay = isGloballyAssigned || assignedSections.length === 0
        ? "All"
        : assignedSections.join(", ");

      return {
        id: exam.id,
        title: exam.title,
        subject: exam.subject.name,
        subjectId: exam.subjectId,
        grade: exam.class?.name || "Unknown Class",
        section: sectionDisplay,
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

    // Populate unique subjects for the filter dropdown
    const subjectsMap = new Map<string, string>();
    subjectTeachers.forEach(st => {
      subjectsMap.set(st.subject.id, st.subject.name);
    });
    teacherSubjectClasses.forEach(sc => {
      subjectsMap.set(sc.subject.id, sc.subject.name);
    });

    const uniqueSubjects = Array.from(subjectsMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));

    return {
      exams: formattedExams,
      subjects: uniqueSubjects,
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
        class: true,
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

    // Check if globally assigned
    const globalAssignment = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: exam.subjectId,
      },
    });

    // Check if class-assigned
    const teacherAssignments = await db.subjectClass.findMany({
      where: {
        teacherId: teacher.id,
        subjectId: exam.subjectId,
        classId: exam.classId,
      },
      include: {
        class: true,
        section: true,
      },
    });

    if (!globalAssignment && teacherAssignments.length === 0) {
      throw new Error("Unauthorized access to this exam");
    }

    let assignedSectionIds: string[] = [];
    const isGloballyAssigned = !!globalAssignment;

    if (isGloballyAssigned) {
      // Fetch all sections for this class
      const classSections = await db.classSection.findMany({
        where: {
          classId: exam.classId,
        },
      });
      assignedSectionIds = classSections.map(cs => cs.id);
    } else {
      assignedSectionIds = teacherAssignments
        .map(ta => ta.sectionId)
        .filter((id): id is string => id !== null);
    }

    // Fetch active students enrolled in these assigned sections
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId: exam.classId,
        sectionId: {
          in: assignedSectionIds,
        },
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        section: true,
      },
      orderBy: {
        student: {
          user: {
            firstName: 'asc',
          },
        },
      },
    });

    // Map existing results by studentId for quick lookup
    const resultsMap = new Map(
      exam.results.map(result => [result.studentId, result])
    );

    // Combine enrollments with existing results, generating placeholders for those without results
    const results = enrollments.map(enrollment => {
      const existingResult = resultsMap.get(enrollment.studentId);
      return {
        id: existingResult?.id || `new-${enrollment.studentId}`,
        studentId: enrollment.studentId,
        studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        marks: existingResult ? existingResult.marks : 0,
        grade: existingResult ? (existingResult.grade || 'N/A') : 'N/A',
        remarks: existingResult ? (existingResult.remarks || '') : '',
        isAbsent: existingResult ? existingResult.isAbsent : false,
        sectionName: enrollment.section.name,
      };
    });

    // Calculate statistics based on actual graded results (i.e. those that have records in the DB)
    const gradedResults = results.filter(r => !r.id.startsWith('new-'));
    const totalSubmissions = gradedResults.length;
    const absentCount = gradedResults.filter(r => r.isAbsent).length;
    const presentCount = totalSubmissions - absentCount;
    const totalMarks = gradedResults.reduce((sum, r) => sum + (r.isAbsent ? 0 : r.marks), 0);
    const averageMark = presentCount > 0 ? totalMarks / presentCount : 0;

    // Create grade distribution using standardized logic
    const gradeDistribution = gradedResults.reduce((acc, r) => {
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
      className: exam.class?.name || teacherAssignments[0]?.class.name || 'Unknown Class',
      instructions: exam.instructions || '',
      results,
      statistics: {
        totalStudents: totalSubmissions,
        present: presentCount,
        absent: absentCount,
        averageMark,
        highestMark: presentCount > 0 ? Math.max(...gradedResults.filter(r => !r.isAbsent).map(r => r.marks)) : 0,
        lowestMark: presentCount > 0 ? Math.min(...gradedResults.filter(r => !r.isAbsent).map(r => r.marks)) : 0,
        passRate: presentCount > 0
          ? (gradedResults.filter(r => !r.isAbsent && r.marks >= exam.passingMarks).length / presentCount) * 100
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
    const classId = formData.get('classId') as string;
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

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Create the exam
    const exam = await db.exam.create({
      data: {
        title,
        subjectId,
        classId,
        examTypeId,
        termId,
        examDate,
        startTime,
        endTime,
        totalMarks,
        passingMarks,
        creatorId: teacher.id,
        instructions,
        schoolId, // Add required schoolId
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

    // Get school context
    const schoolId = await getRequiredSchoolId();

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

    // Verify that this teacher has access to this exam's subject and class
    const globalAssignment = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: exam.subjectId,
      },
    });

    const classAssignment = await db.subjectClass.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: exam.subjectId,
        classId: exam.classId,
      },
    });

    if (!globalAssignment && !classAssignment) {
      throw new Error("Unauthorized access to this exam");
    }

    // Get the assigned sections to enforce section-specific permissions
    let assignedSectionIds: string[] = [];
    if (globalAssignment) {
      const classSections = await db.classSection.findMany({
        where: {
          classId: exam.classId,
        },
      });
      assignedSectionIds = classSections.map(cs => cs.id);
    } else {
      const teacherAssignments = await db.subjectClass.findMany({
        where: {
          teacherId: teacher.id,
          subjectId: exam.subjectId,
          classId: exam.classId,
        },
      });
      assignedSectionIds = teacherAssignments
        .map(ta => ta.sectionId)
        .filter((id): id is string => id !== null);
    }

    // Get all valid student IDs for these sections to prevent unauthorized updates
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId: exam.classId,
        sectionId: {
          in: assignedSectionIds,
        },
        status: 'ACTIVE',
      },
      select: {
        studentId: true,
      },
    });

    const allowedStudentIds = new Set(enrollments.map(e => e.studentId));

    // Filter results to only update authorized students
    const authorizedResults = results.filter(result => allowedStudentIds.has(result.studentId));

    if (authorizedResults.length === 0 && results.length > 0) {
      throw new Error("Unauthorized: None of the submitted students are in your assigned section(s).");
    }

    // Batch all upserts in a single transaction instead of one-per-result
    await db.$transaction(
      authorizedResults.map((result) =>
        db.examResult.upsert({
          where: {
            examId_studentId: { examId, studentId: result.studentId },
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
            schoolId,
          },
        })
      )
    );

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

/**
 * Get initial data for teacher marks entry filters - scoped to teacher assignments
 */
export async function getTeacherMarksEntryPageData() {
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

    // Get teacher's assignments
    const subjectTeachers = await db.subjectTeacher.findMany({
      where: { teacherId: teacher.id },
      include: { subject: true },
    });

    const teacherSubjectClasses = await db.subjectClass.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        class: {
          include: {
            sections: { orderBy: { name: "asc" } },
            academicYear: true,
          }
        },
        section: true,
      },
    });

    const globalSubjectIds = subjectTeachers.map(st => st.subjectId);
    
    // Construct OR conditions for exams
    const OR_conditions: any[] = [];
    
    if (globalSubjectIds.length > 0) {
      OR_conditions.push({
        subjectId: { in: globalSubjectIds },
      });
    }
    
    teacherSubjectClasses.forEach(sc => {
      if (!globalSubjectIds.includes(sc.subjectId)) {
        OR_conditions.push({
          subjectId: sc.subjectId,
          classId: sc.classId,
        });
      }
    });

    // If no assignments at all, return empty datasets
    if (OR_conditions.length === 0) {
      return {
        success: true,
        data: { exams: [], classes: [], terms: [], examTypes: [], teacherSubjectClasses: [], globalSubjectIds: [] }
      };
    }

    // Get exams
    const exams = await db.exam.findMany({
      where: {
        OR: OR_conditions,
      },
      select: {
        id: true,
        title: true,
        totalMarks: true,
        examDate: true,
        classId: true,
        subject: { select: { id: true, name: true } },
        examType: { select: { id: true, name: true, cbseComponent: true } },
        term: {
          select: {
            id: true,
            name: true,
            academicYear: { select: { name: true } },
          },
        },
      },
      orderBy: { examDate: "desc" },
    });

    // Resolve unique classes the teacher has access to
    let classes: any[] = [];
    if (globalSubjectIds.length > 0) {
      // Fetch all classes that offer the global subjects
      const globalSubjectClasses = await db.subjectClass.findMany({
        where: {
          subjectId: { in: globalSubjectIds },
        },
        include: {
          class: {
            include: {
              sections: { orderBy: { name: "asc" } },
              academicYear: true,
            }
          }
        }
      });
      
      const classIds = new Set<string>();
      const classMap = new Map<string, any>();
      
      globalSubjectClasses.forEach(sc => {
        if (!classIds.has(sc.class.id)) {
          classIds.add(sc.class.id);
          classMap.set(sc.class.id, sc.class);
        }
      });
      
      teacherSubjectClasses.forEach(sc => {
        if (!classIds.has(sc.class.id)) {
          classIds.add(sc.class.id);
          classMap.set(sc.class.id, sc.class);
        }
      });
      
      classes = Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    } else {
      const classMap = new Map<string, any>();
      teacherSubjectClasses.forEach(sc => {
        classMap.set(sc.class.id, sc.class);
      });
      classes = Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    // Resolve unique terms and exam types from the exams list
    const termIds = new Set<string>();
    const terms: any[] = [];
    const examTypeIds = new Set<string>();
    const examTypes: any[] = [];

    exams.forEach(exam => {
      if (!termIds.has(exam.term.id)) {
        termIds.add(exam.term.id);
        terms.push({
          id: exam.term.id,
          name: exam.term.name,
          academicYear: {
            name: exam.term.academicYear.name,
            isCurrent: true,
          }
        });
      }
      if (!examTypeIds.has(exam.examType.id)) {
        examTypeIds.add(exam.examType.id);
        examTypes.push({
          id: exam.examType.id,
          name: exam.examType.name,
          cbseComponent: exam.examType.cbseComponent,
        });
      }
    });

    // Format teacherSubjectClasses to pass down to client for filtering
    const formattedAssignments = teacherSubjectClasses.map(sc => ({
      classId: sc.classId,
      subjectId: sc.subjectId,
      sectionId: sc.sectionId,
      sectionName: sc.section?.name,
    }));

    return {
      success: true,
      data: {
        exams,
        classes,
        terms,
        examTypes,
        teacherSubjectClasses: formattedAssignments,
        globalSubjectIds,
      }
    };
  } catch (error) {
    console.error("Error fetching teacher marks entry page data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch marks entry data",
    };
  }
}

/**
 * Get subjects for a specific class - filtered by teacher assignments
 */
export async function getTeacherSubjectsByClass(classId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const teacher = await db.teacher.findFirst({
      where: { user: { id: userId } },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get global subjects
    const subjectTeachers = await db.subjectTeacher.findMany({
      where: { teacherId: teacher.id },
      include: { subject: true },
    });
    const globalSubjectIds = subjectTeachers.map(st => st.subjectId);

    // Get class-specific subjects
    const teacherSubjectClasses = await db.subjectClass.findMany({
      where: { classId, teacherId: teacher.id },
      include: { subject: true },
    });

    // Deduplicate
    const subjectsMap = new Map<string, any>();
    subjectTeachers.forEach(st => {
      subjectsMap.set(st.subject.id, st.subject);
    });
    teacherSubjectClasses.forEach(sc => {
      subjectsMap.set(sc.subject.id, sc.subject);
    });

    const subjects = Array.from(subjectsMap.values()).map(sub => ({
      id: sub.id,
      name: sub.name,
      code: sub.code,
    }));

    return { success: true, data: subjects };
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return { success: false, error: "Failed to fetch subjects" };
  }
}
