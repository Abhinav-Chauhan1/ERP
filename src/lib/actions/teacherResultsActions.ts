"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Get all results for a teacher (exams and assignments)
 */
export async function getTeacherResults(classId?: string, subjectId?: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId,
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

    // Get subjects and classes for these subjects
    const subjects = await db.subject.findMany({
      where: {
        id: {
          in: subjectIds,
        },
      },
      include: {
        classes: {
          include: {
            class: true,
          },
        },
      },
    });

    // Extract class IDs
    const classIds = subjects.flatMap(subject => 
      subject.classes.map(sc => sc.classId)
    );

    // Filter by classId if provided
    const finalClassIds = classId ? classIds.filter(id => id === classId) : classIds;

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
        results: {
          include: {
            student: {
              include: {
                user: true,
                enrollments: {
                  where: {
                    classId: {
                      in: finalClassIds,
                    },
                  },
                  include: {
                    class: true,
                    section: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        examDate: 'desc',
      },
    });

    // Get all assignments for these subjects
    const assignments = await db.assignment.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        classes: {
          some: {
            classId: {
              in: finalClassIds,
            },
          },
        },
      },
      include: {
        subject: true,
        submissions: {
          include: {
            student: {
              include: {
                user: true,
                enrollments: {
                  where: {
                    classId: {
                      in: finalClassIds,
                    },
                  },
                  include: {
                    class: true,
                    section: true,
                  },
                },
              },
            },
          },
        },
        classes: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        dueDate: 'desc',
      },
    });

    // Get classes taught by this teacher
    const teacherClasses = await db.classTeacher.findMany({
      where: {
        teacherId: teacher.id,
      },
      include: {
        class: true,
      },
    });

    // Format the exam results data
    const formattedExams = exams.map(exam => {
      const totalStudents = exam.results.length;
      const submittedCount = exam.results.filter(r => !r.isAbsent).length;
      const passedCount = exam.results.filter(r => r.marks >= exam.passingMarks).length;
      const failedCount = submittedCount - passedCount;
      const absentCount = totalStudents - submittedCount;
      
      const totalMarks = exam.results.reduce((sum, result) => sum + (result.isAbsent ? 0 : result.marks), 0);
      const avgMarks = submittedCount > 0 ? totalMarks / submittedCount : 0;
      const highestMarks = Math.max(...exam.results.map(r => r.isAbsent ? 0 : r.marks));
      
      // Class names where this exam was conducted
      const classNames = Array.from(new Set(exam.results.flatMap(r => 
        r.student.enrollments.map(e => `${e.class.name}-${e.section.name}`)
      ))).join(", ");

      return {
        id: exam.id,
        title: exam.title,
        subject: exam.subject.name,
        subjectId: exam.subjectId,
        examType: exam.examType.name,
        examDate: exam.examDate,
        classNames,
        totalStudents,
        submittedCount,
        passedCount,
        failedCount,
        absentCount,
        passPercentage: submittedCount > 0 ? Math.round((passedCount / submittedCount) * 100) : 0,
        avgMarks: avgMarks.toFixed(1),
        highestMarks,
        isGraded: submittedCount > 0,
      };
    });

    // Format the assignment results data
    const formattedAssignments = assignments.map(assignment => {
      const totalStudents = assignment.submissions.length;
      const submittedCount = assignment.submissions.filter(s => s.status !== "PENDING").length;
      const gradedCount = assignment.submissions.filter(s => s.status === "GRADED").length;
      const pendingCount = totalStudents - submittedCount;
      
      const totalMarks = assignment.submissions.reduce((sum, submission) => 
        sum + (submission.marks || 0), 0);
      const avgMarks = gradedCount > 0 ? totalMarks / gradedCount : 0;

      // Class names where this assignment was given
      const classNames = assignment.classes.map(c => c.class.name).join(", ");

      return {
        id: assignment.id,
        title: assignment.title,
        subject: assignment.subject.name,
        subjectId: assignment.subjectId,
        dueDate: assignment.dueDate,
        classNames,
        totalStudents,
        submittedCount,
        gradedCount,
        pendingCount,
        avgMarks: avgMarks.toFixed(1),
        totalMarks: assignment.totalMarks,
        isFullyGraded: gradedCount === submittedCount && submittedCount > 0,
      };
    });

    return { 
      exams: formattedExams,
      assignments: formattedAssignments,
      subjects: subjectTeachers.map(st => ({
        id: st.subject.id,
        name: st.subject.name,
      })),
      classes: teacherClasses.map(tc => ({
        id: tc.class.id,
        name: tc.class.name,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch teacher results:", error);
    throw new Error("Failed to fetch results");
  }
}

/**
 * Get exam result details for a specific exam
 */
export async function getExamResultDetails(examId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId,
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
                enrollments: {
                  include: {
                    class: true,
                    section: true,
                  },
                },
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

    // Format result data
    const students = exam.results.map(result => {
      // Get the most relevant enrollment (current class of student)
      const enrollment = result.student.enrollments[0];
      
      return {
        id: result.student.id,
        name: `${result.student.user.firstName} ${result.student.user.lastName}`,
        className: enrollment ? `${enrollment.class.name}-${enrollment.section.name}` : "N/A",
        rollNumber: result.student.rollNumber || "N/A",
        marks: result.marks,
        grade: result.grade || 'N/A',
        isAbsent: result.isAbsent,
        remarks: result.remarks || '',
        resultId: result.id,
      };
    });

    // Calculate statistics
    const totalStudents = students.length;
    const absentCount = students.filter(s => s.isAbsent).length;
    const presentCount = totalStudents - absentCount;
    const totalMarks = students.reduce((sum, s) => sum + (s.isAbsent ? 0 : s.marks), 0);
    const avgMarks = presentCount > 0 ? totalMarks / presentCount : 0;
    const highestMark = Math.max(...students.map(s => s.isAbsent ? 0 : s.marks));
    const lowestMark = Math.min(...students.filter(s => !s.isAbsent).map(s => s.marks));
    const passCount = students.filter(s => !s.isAbsent && s.marks >= exam.passingMarks).length;
    const passPercentage = presentCount > 0 ? (passCount / presentCount) * 100 : 0;

    // Calculate grade distribution
    const gradeDistribution: Record<string, number> = {};
    students.forEach(student => {
      if (student.isAbsent) return;
      
      const percentage = (student.marks / exam.totalMarks) * 100;
      let grade = '';
      
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B';
      else if (percentage >= 60) grade = 'C';
      else if (percentage >= 50) grade = 'D';
      else grade = 'F';
      
      if (!gradeDistribution[grade]) gradeDistribution[grade] = 0;
      gradeDistribution[grade]++;
    });

    return {
      id: exam.id,
      title: exam.title,
      subject: exam.subject.name,
      examType: exam.examType.name,
      term: exam.term.name,
      examDate: exam.examDate,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      students,
      statistics: {
        totalStudents,
        present: presentCount,
        absent: absentCount,
        averageMark: avgMarks,
        highestMark,
        lowestMark,
        passCount,
        failCount: presentCount - passCount,
        passPercentage,
        gradeDistribution,
      }
    };
  } catch (error) {
    console.error("Failed to fetch exam result details:", error);
    throw new Error("Failed to fetch exam results");
  }
}

/**
 * Get assignment result details for a specific assignment
 */
export async function getAssignmentResultDetails(assignmentId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Find the assignment
    const assignment = await db.assignment.findUnique({
      where: {
        id: assignmentId,
      },
      include: {
        subject: true,
        submissions: {
          include: {
            student: {
              include: {
                user: true,
                enrollments: {
                  include: {
                    class: true,
                    section: true,
                  },
                },
              },
            },
          },
        },
        classes: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Verify that this teacher has access to this assignment's subject
    const subjectTeacher = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: assignment.subjectId,
      },
    });

    if (!subjectTeacher) {
      throw new Error("Unauthorized access to this assignment");
    }

    // Format submission data
    const submissions = assignment.submissions.map(submission => {
      // Get the most relevant enrollment (current class of student)
      const enrollment = submission.student.enrollments[0];
      
      return {
        id: submission.id,
        studentId: submission.student.id,
        studentName: `${submission.student.user.firstName} ${submission.student.user.lastName}`,
        className: enrollment ? `${enrollment.class.name}-${enrollment.section.name}` : "N/A",
        rollNumber: submission.student.rollNumber || "N/A",
        submissionDate: submission.submissionDate,
        status: submission.status,
        marks: submission.marks,
        feedback: submission.feedback,
        content: submission.content,
        attachments: submission.attachments ? JSON.parse(submission.attachments) : [],
      };
    });

    // Calculate statistics
    const totalSubmissions = submissions.length;
    const submittedCount = submissions.filter(s => s.status !== "PENDING").length;
    const gradedCount = submissions.filter(s => s.status === "GRADED").length;
    const pendingCount = totalSubmissions - submittedCount;
    const lateCount = submissions.filter(s => s.status === "LATE").length;
    
    const totalMarks = submissions.reduce((sum, s) => sum + (s.marks || 0), 0);
    const avgMarks = gradedCount > 0 ? totalMarks / gradedCount : 0;
    const highestMark = gradedCount > 0 ? Math.max(...submissions.filter(s => s.marks !== null && s.marks !== undefined).map(s => s.marks || 0)) : 0;
    const lowestMark = gradedCount > 0 ? Math.min(...submissions.filter(s => s.marks !== null && s.marks !== undefined).map(s => s.marks || 0)) : 0;

    // Calculate marks distribution
    const marksDistribution: Record<string, number> = {};
    submissions.forEach(submission => {
      if (submission.status !== "GRADED" || submission.marks === null || submission.marks === undefined) return;
      
      const percentage = Math.floor((submission.marks / assignment.totalMarks) * 100);
      
      let range;
      if (percentage >= 90) range = '90-100%';
      else if (percentage >= 80) range = '80-89%';
      else if (percentage >= 70) range = '70-79%';
      else if (percentage >= 60) range = '60-69%';
      else if (percentage >= 50) range = '50-59%';
      else range = 'Below 50%';
      
      if (!marksDistribution[range]) marksDistribution[range] = 0;
      marksDistribution[range]++;
    });

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject.name,
      classes: assignment.classes.map(c => c.class.name).join(", "),
      assignedDate: assignment.assignedDate,
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks,
      instructions: assignment.instructions,
      attachments: assignment.attachments ? JSON.parse(assignment.attachments) : [],
      submissions,
      statistics: {
        totalSubmissions,
        submittedCount,
        gradedCount,
        pendingCount,
        lateCount,
        averageMarks: avgMarks,
        highestMark,
        lowestMark,
        marksDistribution,
      }
    };
  } catch (error) {
    console.error("Failed to fetch assignment result details:", error);
    throw new Error("Failed to fetch assignment results");
  }
}

/**
 * Update exam results
 */
export async function updateExamResults(examId: string, results: any[]) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId,
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

    // Update each result
    for (const result of results) {
      await db.examResult.update({
        where: {
          id: result.resultId,
        },
        data: {
          marks: result.marks,
          grade: result.grade,
          remarks: result.remarks,
          isAbsent: result.isAbsent,
        },
      });
    }

    revalidatePath(`/teacher/assessments/results/exams/${examId}`);
    revalidatePath('/teacher/assessments/results');
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update exam results:", error);
    return { success: false, error: "Failed to update exam results" };
  }
}

/**
 * Get student performance data
 */
export async function getStudentPerformanceData(studentId: string, subjectId?: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get the student
    const student = await db.student.findUnique({
      where: {
        id: studentId,
      },
      include: {
        user: true,
        enrollments: {
          include: {
            class: true,
            section: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Find subjects taught by this teacher
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

    // Get exam results for this student in these subjects
    const examResults = await db.examResult.findMany({
      where: {
        studentId,
        exam: {
          subjectId: {
            in: subjectIds,
          },
        },
      },
      include: {
        exam: {
          include: {
            subject: true,
            examType: true,
          },
        },
      },
      orderBy: {
        exam: {
          examDate: 'asc',
        },
      },
    });

    // Get assignment submissions for this student in these subjects
    const assignmentSubmissions = await db.assignmentSubmission.findMany({
      where: {
        studentId,
        assignment: {
          subjectId: {
            in: subjectIds,
          },
        },
      },
      include: {
        assignment: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        assignment: {
          dueDate: 'asc',
        },
      },
    });

    // Format exam results for chart
    const formattedExamResults = examResults.map(result => {
      const percentage = result.isAbsent ? 0 : (result.marks / result.exam.totalMarks) * 100;
      
      return {
        id: result.id,
        title: result.exam.title,
        subject: result.exam.subject.name,
        examType: result.exam.examType.name,
        date: result.exam.examDate,
        marks: result.marks,
        totalMarks: result.exam.totalMarks,
        percentage: percentage.toFixed(1),
        isAbsent: result.isAbsent,
      };
    });

    // Format assignment submissions for chart
    const formattedAssignments = assignmentSubmissions
      .filter(submission => submission.status === "GRADED" && submission.marks !== null)
      .map(submission => {
        const percentage = (submission.marks || 0) / submission.assignment.totalMarks * 100;
        
        return {
          id: submission.id,
          title: submission.assignment.title,
          subject: submission.assignment.subject.name,
          date: submission.submissionDate || submission.assignment.dueDate,
          marks: submission.marks || 0,
          totalMarks: submission.assignment.totalMarks,
          percentage: percentage.toFixed(1),
          status: submission.status,
        };
      });

    // Calculate overall performance by subject
    const subjectPerformance = subjectTeachers.map(st => {
      const subjectExams = examResults.filter(r => r.exam.subjectId === st.subjectId && !r.isAbsent);
      const subjectAssignments = assignmentSubmissions.filter(
        s => s.assignment.subjectId === st.subjectId && s.status === "GRADED" && s.marks !== null
      );
      
      const totalExamMarks = subjectExams.reduce((sum, r) => sum + r.marks, 0);
      const totalExamMaxMarks = subjectExams.reduce((sum, r) => sum + r.exam.totalMarks, 0);
      
      const totalAssignmentMarks = subjectAssignments.reduce((sum, s) => sum + (s.marks || 0), 0);
      const totalAssignmentMaxMarks = subjectAssignments.reduce((sum, s) => sum + s.assignment.totalMarks, 0);
      
      const totalMarks = totalExamMarks + totalAssignmentMarks;
      const totalMaxMarks = totalExamMaxMarks + totalAssignmentMaxMarks;
      
      const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
      
      return {
        subjectId: st.subjectId,
        subjectName: st.subject.name,
        totalMarks,
        totalMaxMarks,
        percentage: percentage.toFixed(1),
        examCount: subjectExams.length,
        assignmentCount: subjectAssignments.length,
      };
    });

    return {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        class: student.enrollments[0]?.class.name || 'N/A',
        section: student.enrollments[0]?.section.name || 'N/A',
        rollNumber: student.rollNumber || 'N/A',
      },
      examResults: formattedExamResults,
      assignments: formattedAssignments,
      subjectPerformance,
      subjects: subjectTeachers.map(st => ({
        id: st.subject.id,
        name: st.subject.name,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch student performance data:", error);
    throw new Error("Failed to fetch performance data");
  }
}

/**
 * Get class performance data
 */
export async function getClassPerformanceData(classId: string, subjectId?: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get the class
    const classData = await db.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        sections: true,
      },
    });

    if (!classData) {
      throw new Error("Class not found");
    }

    // Find subjects taught by this teacher in this class
    const subjectClasses = await db.subjectClass.findMany({
      where: {
        classId,
        subject: {
          teachers: {
            some: {
              teacherId: teacher.id,
            },
          },
        },
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        subject: true,
      },
    });

    const subjectIds = subjectClasses.map(sc => sc.subjectId);

    // Get students in this class
    const students = await db.classEnrollment.findMany({
      where: {
        classId,
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
    });

    const studentIds = students.map(s => s.student.id);

    // Get exam results for these students in these subjects
    const examResults = await db.examResult.findMany({
      where: {
        studentId: {
          in: studentIds,
        },
        exam: {
          subjectId: {
            in: subjectIds,
          },
        },
      },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
        student: {
          include: {
            user: true,
            enrollments: {
              where: {
                classId,
              },
              include: {
                section: true,
              },
            },
          },
        },
      },
    });

    // Get assignment submissions for these students in these subjects
    const assignmentSubmissions = await db.assignmentSubmission.findMany({
      where: {
        studentId: {
          in: studentIds,
        },
        assignment: {
          subjectId: {
            in: subjectIds,
          },
          classes: {
            some: {
              classId,
            },
          },
        },
      },
      include: {
        assignment: {
          include: {
            subject: true,
          },
        },
        student: {
          include: {
            user: true,
            enrollments: {
              where: {
                classId,
              },
              include: {
                section: true,
              },
            },
          },
        },
      },
    });

    // Calculate average performance by student
    const studentPerformance = students.map(enrollment => {
      const studentExamResults = examResults.filter(r => r.studentId === enrollment.studentId && !r.isAbsent);
      const studentAssignments = assignmentSubmissions.filter(
        s => s.studentId === enrollment.studentId && s.status === "GRADED" && s.marks !== null
      );
      
      const totalExamMarks = studentExamResults.reduce((sum, r) => sum + r.marks, 0);
      const totalExamMaxMarks = studentExamResults.reduce((sum, r) => sum + r.exam.totalMarks, 0);
      
      const totalAssignmentMarks = studentAssignments.reduce((sum, s) => sum + (s.marks || 0), 0);
      const totalAssignmentMaxMarks = studentAssignments.reduce((sum, s) => sum + s.assignment.totalMarks, 0);
      
      const totalMarks = totalExamMarks + totalAssignmentMarks;
      const totalMaxMarks = totalExamMaxMarks + totalAssignmentMaxMarks;
      
      const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
      
      return {
        studentId: enrollment.studentId,
        studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        rollNumber: enrollment.student.rollNumber || enrollment.rollNumber || 'N/A',
        section: enrollment.section.name,
        totalMarks,
        totalMaxMarks,
        percentage: percentage.toFixed(1),
        examCount: studentExamResults.length,
        assignmentCount: studentAssignments.length,
      };
    });

    // Calculate performance by subject
    const subjectPerformance = subjectClasses.map(sc => {
      const subjectExams = examResults.filter(r => r.exam.subjectId === sc.subjectId && !r.isAbsent);
      const subjectAssignments = assignmentSubmissions.filter(
        s => s.assignment.subjectId === sc.subjectId && s.status === "GRADED" && s.marks !== null
      );
      
      const totalExamMarks = subjectExams.reduce((sum, r) => sum + r.marks, 0);
      const totalExamMaxMarks = subjectExams.reduce((sum, r) => sum + r.exam.totalMarks, 0);
      const examAverage = subjectExams.length > 0 ? totalExamMarks / subjectExams.length : 0;
      
      const totalAssignmentMarks = subjectAssignments.reduce((sum, s) => sum + (s.marks || 0), 0);
      const totalAssignmentMaxMarks = subjectAssignments.reduce((sum, s) => sum + s.assignment.totalMarks, 0);
      const assignmentAverage = subjectAssignments.length > 0 ? totalAssignmentMarks / subjectAssignments.length : 0;
      
      const overallPercentage = (totalExamMaxMarks + totalAssignmentMaxMarks) > 0 
        ? ((totalExamMarks + totalAssignmentMarks) / (totalExamMaxMarks + totalAssignmentMaxMarks)) * 100 
        : 0;
      
      return {
        subjectId: sc.subjectId,
        subjectName: sc.subject.name,
        examAverage: examAverage.toFixed(1),
        assignmentAverage: assignmentAverage.toFixed(1),
        overallPercentage: overallPercentage.toFixed(1),
        examCount: subjectExams.length / students.length, // Average exams per student
        assignmentCount: subjectAssignments.length / students.length, // Average assignments per student
      };
    });

    // Calculate average performance by section
    const sectionPerformance = classData.sections.map(section => {
      const sectionStudents = studentPerformance.filter(s => s.section === section.name);
      const totalPercentage = sectionStudents.reduce((sum, s) => sum + parseFloat(s.percentage), 0);
      const averagePercentage = sectionStudents.length > 0 ? totalPercentage / sectionStudents.length : 0;
      
      return {
        sectionId: section.id,
        sectionName: section.name,
        studentCount: sectionStudents.length,
        averagePercentage: averagePercentage.toFixed(1),
      };
    });

    return {
      class: {
        id: classData.id,
        name: classData.name,
        sections: classData.sections.map(s => s.name),
        studentCount: students.length,
      },
      studentPerformance,
      subjectPerformance,
      sectionPerformance,
      subjects: subjectClasses.map(sc => ({
        id: sc.subjectId,
        name: sc.subject.name,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch class performance data:", error);
    throw new Error("Failed to fetch performance data");
  }
}
