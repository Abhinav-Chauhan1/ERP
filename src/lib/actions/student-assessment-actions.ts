"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { calculateGrade } from "@/lib/utils/grade-calculator";

// Instead of exporting the schema directly, create it as a constant
const assignmentSubmissionSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  content: z.string().optional(),
  attachments: z.string().optional(),
});

// Export a getter function for the schema instead of the schema directly
export async function getAssignmentSubmissionSchema() {
  return assignmentSubmissionSchema;
}

/**
 * Get the current student's details with active enrollment
 */
async function getStudentWithEnrollment() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser || dbUser.role !== "STUDENT") {
    throw new Error("Student account required");
  }

  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id,
    },
    include: {
      enrollments: {
        orderBy: {
          enrollDate: "desc",
        },
        take: 1,
        include: {
          class: true,
          section: true,
        },
      },
    },
  });

  if (!student || student.enrollments.length === 0) {
    throw new Error("No active enrollment found");
  }

  return {
    student,
    currentEnrollment: student.enrollments[0],
  };
}

/**
 * Get all upcoming exams for the student
 */
export async function getUpcomingExams() {
  const { student, currentEnrollment } = await getStudentWithEnrollment();
  const currentDate = new Date();

  // Get all subject IDs for the student's class
  const subjectClasses = await db.subjectClass.findMany({
    where: {
      classId: currentEnrollment.classId,
    },
    select: {
      subjectId: true,
    },
  });

  const subjectIds = subjectClasses.map((sc) => sc.subjectId);

  // Get upcoming exams for these subjects
  const exams = await db.exam.findMany({
    where: {
      subjectId: {
        in: subjectIds,
      },
      examDate: {
        gte: currentDate,
      },
    },
    include: {
      subject: true,
      examType: true,
      results: {
        where: {
          studentId: student.id,
        },
      },
    },
    orderBy: {
      examDate: "asc",
    },
  });

  return exams.map((exam) => ({
    id: exam.id,
    title: exam.title,
    examDate: exam.examDate,
    startTime: exam.startTime,
    endTime: exam.endTime,
    subject: exam.subject.name,
    subjectId: exam.subject.id,
    examType: exam.examType.name,
    totalMarks: exam.totalMarks,
    passingMarks: exam.passingMarks,
    instructions: exam.instructions,
    hasResult: exam.results.length > 0,
  }));
}

/**
 * Get a specific exam's details
 */
export async function getExamDetails(examId: string) {
  const { student } = await getStudentWithEnrollment();

  const exam = await db.exam.findUnique({
    where: {
      id: examId,
    },
    include: {
      subject: true,
      examType: true,
      results: {
        where: {
          studentId: student.id,
        },
      },
      creator: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  return {
    id: exam.id,
    title: exam.title,
    examDate: exam.examDate,
    startTime: exam.startTime,
    endTime: exam.endTime,
    subject: exam.subject,
    examType: exam.examType,
    totalMarks: exam.totalMarks,
    passingMarks: exam.passingMarks,
    instructions: exam.instructions,
    result: exam.results[0] || null,
    creator: exam.creator
      ? {
        id: exam.creator.id,
        name: `${exam.creator.user.firstName} ${exam.creator.user.lastName}`,
      }
      : null,
  };
}

/**
 * Get the student's exam results
 */
export async function getExamResults() {
  const { student, currentEnrollment } = await getStudentWithEnrollment();

  // Get all subject IDs for the student's class
  const subjectClasses = await db.subjectClass.findMany({
    where: {
      classId: currentEnrollment.classId,
    },
    select: {
      subjectId: true,
    },
  });

  const subjectIds = subjectClasses.map((sc) => sc.subjectId);

  // Get all results for these subjects
  const results = await db.examResult.findMany({
    where: {
      studentId: student.id,
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
          term: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return results.map((result) => ({
    id: result.id,
    examId: result.examId,
    examTitle: result.exam.title,
    subject: result.exam.subject.name,
    examType: result.exam.examType.name,
    term: result.exam.term.name,
    examDate: result.exam.examDate,
    marks: result.marks,
    totalMarks: result.exam.totalMarks,
    percentage: Math.round((result.marks / result.exam.totalMarks) * 100),
    grade: result.grade,
    remarks: result.remarks,
    isPassing: result.marks >= result.exam.passingMarks,
    isAbsent: result.isAbsent,
  }));
}

/**
 * Get all assignments for the student
 */
export async function getAssignments() {
  const { student, currentEnrollment } = await getStudentWithEnrollment();

  // Get all subject IDs for the student's class
  const subjectClasses = await db.subjectClass.findMany({
    where: {
      classId: currentEnrollment.classId,
    },
    select: {
      subjectId: true,
    },
  });

  const subjectIds = subjectClasses.map((sc) => sc.subjectId);

  // Get all assignments for these subjects
  const assignments = await db.assignment.findMany({
    where: {
      subjectId: {
        in: subjectIds,
      },
      classes: {
        some: {
          classId: currentEnrollment.classId,
        },
      },
    },
    include: {
      subject: true,
      submissions: {
        where: {
          studentId: student.id,
        },
      },
      creator: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  const currentDate = new Date();

  return {
    all: assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject.name,
      subjectId: assignment.subject.id,
      assignedDate: assignment.assignedDate,
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks,
      instructions: assignment.instructions,
      attachments: assignment.attachments,
      submission: assignment.submissions[0] || null,
      isSubmitted: assignment.submissions.length > 0,
      isGraded:
        assignment.submissions.length > 0 &&
        assignment.submissions[0].status === "GRADED",
      isOverdue:
        assignment.submissions.length === 0 && assignment.dueDate < currentDate,
      teacher: assignment.creator
        ? `${assignment.creator.user.firstName} ${assignment.creator.user.lastName}`
        : "Unknown",
    })),

    pending: assignments.filter(
      (a) => a.submissions.length === 0 && a.dueDate >= currentDate
    ),

    submitted: assignments.filter(
      (a) =>
        a.submissions.length > 0 && a.submissions[0].status !== "GRADED"
    ),

    graded: assignments.filter(
      (a) =>
        a.submissions.length > 0 && a.submissions[0].status === "GRADED"
    ),

    overdue: assignments.filter(
      (a) => a.submissions.length === 0 && a.dueDate < currentDate
    ),
  };
}

/**
 * Get a specific assignment's details
 */
export async function getAssignmentDetails(assignmentId: string) {
  const { student } = await getStudentWithEnrollment();

  const assignment = await db.assignment.findUnique({
    where: {
      id: assignmentId,
    },
    include: {
      subject: true,
      submissions: {
        where: {
          studentId: student.id,
        },
      },
      creator: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  const currentDate = new Date();

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    subject: assignment.subject,
    assignedDate: assignment.assignedDate,
    dueDate: assignment.dueDate,
    totalMarks: assignment.totalMarks,
    instructions: assignment.instructions,
    attachments: assignment.attachments ? JSON.parse(assignment.attachments) : [],
    submission: assignment.submissions[0] || null,
    isSubmitted: assignment.submissions.length > 0,
    isGraded:
      assignment.submissions.length > 0 &&
      assignment.submissions[0].status === "GRADED",
    isOverdue:
      assignment.submissions.length === 0 && assignment.dueDate < currentDate,
    teacher: assignment.creator
      ? {
        id: assignment.creator.id,
        name: `${assignment.creator.user.firstName} ${assignment.creator.user.lastName}`,
      }
      : null,
  };
}

/**
 * Submit an assignment
 */
export async function submitAssignment(values: z.infer<typeof assignmentSubmissionSchema>) {
  const { student } = await getStudentWithEnrollment();
  const { assignmentId, content, attachments } = values;

  // Check if assignment exists and is valid for submission
  const assignment = await db.assignment.findUnique({
    where: {
      id: assignmentId,
    },
    include: {
      submissions: {
        where: {
          studentId: student.id,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  // Check if already submitted
  if (assignment.submissions.length > 0) {
    throw new Error("Assignment already submitted");
  }

  const currentDate = new Date();
  const isLate = currentDate > assignment.dueDate;

  // Create submission
  await db.assignmentSubmission.create({
    data: {
      assignment: {
        connect: {
          id: assignmentId,
        },
      },
      student: {
        connect: {
          id: student.id,
        },
      },
      submissionDate: currentDate,
      content: content || "",
      attachments: attachments || null,
      status: isLate ? "LATE" : "SUBMITTED",
      school: {
        connect: {
          id: student.schoolId,
        },
      },
    },
  });

  revalidatePath(`/student/assessments/assignments/${assignmentId}`);
  return { success: true };
}

/**
 * Get report cards for the student
 */
export async function getReportCards() {
  const { student } = await getStudentWithEnrollment();

  const reportCards = await db.reportCard.findMany({
    where: {
      studentId: student.id,
      isPublished: true,
    },
    include: {
      term: {
        include: {
          academicYear: true,
        },
      },
    },
    orderBy: {
      term: {
        startDate: "desc",
      },
    },
  });

  return reportCards.map((report) => ({
    id: report.id,
    term: report.term.name,
    academicYear: report.term.academicYear.name,
    totalMarks: report.totalMarks,
    averageMarks: report.averageMarks,
    percentage: report.percentage,
    grade: report.grade,
    rank: report.rank,
    attendance: report.attendance,
    teacherRemarks: report.teacherRemarks,
    principalRemarks: report.principalRemarks,
    publishDate: report.publishDate,
  }));
}

/**
 * Get a specific report card's details
 */
export async function getReportCardDetails(reportCardId: string) {
  const { student } = await getStudentWithEnrollment();

  const reportCard = await db.reportCard.findUnique({
    where: {
      id: reportCardId,
      studentId: student.id,
      isPublished: true,
    },
    include: {
      term: {
        include: {
          academicYear: true,
        },
      },
    },
  });

  if (!reportCard) {
    throw new Error("Report card not found or not published");
  }

  // Also get the exam results for this term
  const examResults = await db.examResult.findMany({
    where: {
      studentId: student.id,
      exam: {
        termId: reportCard.termId,
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
  });

  // Group results by subject
  const subjectResults = examResults.reduce((acc: Record<string, any[]>, result) => {
    const subjectId = result.exam.subject.id;
    if (!acc[subjectId]) {
      acc[subjectId] = [];
    }
    acc[subjectId].push(result);
    return acc;
  }, {});

  // Calculate subject scores
  const subjects = Object.keys(subjectResults).map((subjectId) => {
    const results = subjectResults[subjectId];
    const subject = results[0].exam.subject;

    const totalMarks = results.reduce((sum, result) => sum + result.marks, 0);
    const totalPossibleMarks = results.reduce((sum, result) => sum + result.exam.totalMarks, 0);
    const percentage = Math.round((totalMarks / totalPossibleMarks) * 100);

    return {
      id: subject.id,
      name: subject.name,
      totalMarks,
      totalPossibleMarks,
      percentage,
      grade: calculateGrade(percentage),
      exams: results.map(result => ({
        id: result.id,
        examId: result.examId,
        examTitle: result.exam.title,
        examType: result.exam.examType.name,
        marks: result.marks,
        totalMarks: result.exam.totalMarks,
        percentage: Math.round((result.marks / result.exam.totalMarks) * 100),
      })),
    };
  });

  return {
    id: reportCard.id,
    term: reportCard.term.name,
    academicYear: reportCard.term.academicYear.name,
    startDate: reportCard.term.startDate,
    endDate: reportCard.term.endDate,
    totalMarks: reportCard.totalMarks,
    averageMarks: reportCard.averageMarks,
    percentage: reportCard.percentage,
    grade: reportCard.grade,
    rank: reportCard.rank,
    attendance: reportCard.attendance,
    teacherRemarks: reportCard.teacherRemarks,
    principalRemarks: reportCard.principalRemarks,
    publishDate: reportCard.publishDate,
    subjects,
  };
}

