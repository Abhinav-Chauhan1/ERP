"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import {
  createCalendarEventFromAssignment,
  updateCalendarEventFromAssignment,
  deleteCalendarEventFromAssignment
} from "../services/assignment-calendar-integration";
import { calculateGrade } from "../utils/grade-calculator";

/**
 * Get all assignments for a teacher
 */
export async function getTeacherAssignments(subjectId?: string, classId?: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
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
        schoolId,
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
        schoolId, // Injected
      },
      include: {
        subject: true,
      },
    });

    const subjectIds = subjectTeachers.map(st => st.subjectId);

    // Get all assignments for these subjects
    const assignments = await db.assignment.findMany({
      where: {
        creatorId: teacher.id,
        subjectId: {
          in: subjectIds,
        },
      },
      include: {
        subject: true,
        submissions: true,
        classes: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter by class if provided
    const filteredAssignments = classId
      ? assignments.filter(a => a.classes.some(c => c.classId === classId))
      : assignments;

    // Format the assignments data for the UI
    const formattedAssignments = filteredAssignments.map(assignment => {
      const submittedCount = assignment.submissions.length;
      const gradedCount = assignment.submissions.filter(s => s.status === 'GRADED').length;
      const pendingCount = submittedCount - gradedCount;
      const lateCount = assignment.submissions.filter(s => s.status === 'LATE').length;

      // Calculate average score for graded submissions
      const totalScore = assignment.submissions
        .filter(s => s.status === 'GRADED' && s.marks !== null)
        .reduce((sum, submission) => sum + (submission.marks || 0), 0);

      const avgScore = gradedCount > 0 ? (totalScore / gradedCount) : 0;

      // Calculate total students from associated classes
      const totalStudents = 0; // Placeholder - we'd need to query actual class enrollments

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject.name,
        subjectId: assignment.subjectId,
        classes: assignment.classes.map(c => ({
          id: c.class.id,
          name: c.class.name
        })),
        assignedDate: assignment.assignedDate,
        dueDate: assignment.dueDate,
        totalMarks: assignment.totalMarks,
        status: getAssignmentStatus(assignment.dueDate),
        submittedCount,
        pendingCount,
        gradedCount,
        lateCount,
        avgScore: avgScore.toFixed(1),
        totalStudents,
      };
    });

    return {
      assignments: formattedAssignments,
      subjects: subjectTeachers.map(st => ({
        id: st.subject.id,
        name: st.subject.name,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch teacher assignments:", error);
    throw new Error("Failed to fetch assignments");
  }
}

/**
 * Get assignment details by ID
 */
export async function getAssignmentDetails(assignmentId: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
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
        schoolId,
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get the assignment
    const assignment = await db.assignment.findUnique({
      where: {
        id: assignmentId,
      },
      include: {
        subject: true,
        classes: {
          include: {
            class: true,
          },
        },
        submissions: {
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

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Ensure the teacher has access to this assignment
    if (assignment.creatorId !== teacher.id) {
      const hasAccess = await db.subjectTeacher.findFirst({
        where: {
          teacherId: teacher.id,
          subjectId: assignment.subjectId,
        },
      });

      if (!hasAccess) {
        throw new Error("Unauthorized access to this assignment");
      }
    }

    // Get all students who should submit this assignment
    // This would normally involve queries to get class enrollments
    // For now, just use the submissions we have

    // Format submission data
    const submissions = assignment.submissions.map(submission => ({
      id: submission.id,
      studentId: submission.studentId,
      studentName: `${submission.student.user.firstName} ${submission.student.user.lastName}`,
      submissionDate: submission.submissionDate,
      status: submission.status,
      marks: submission.marks,
      feedback: submission.feedback,
      content: submission.content,
      attachments: submission.attachments ? JSON.parse(submission.attachments) : [],
    }));

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject.name,
      subjectId: assignment.subjectId,
      classes: assignment.classes.map(c => ({
        id: c.class.id,
        name: c.class.name,
      })),
      assignedDate: assignment.assignedDate,
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks,
      instructions: assignment.instructions,
      attachments: assignment.attachments ? JSON.parse(assignment.attachments) : [],
      submissions: submissions,
      statistics: calculateAssignmentStatistics(assignment, submissions),
    };
  } catch (error) {
    console.error("Failed to fetch assignment details:", error);
    throw new Error("Failed to fetch assignment details");
  }
}

/**
 * Create a new assignment
 */
export async function createAssignment(formData: FormData) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
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
        schoolId,
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Extract form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const subjectId = formData.get('subjectId') as string;
    const classIds = (formData.getAll('classIds') as string[]);
    const assignedDate = new Date(formData.get('assignedDate') as string);
    const dueDate = new Date(formData.get('dueDate') as string);
    const totalMarks = parseInt(formData.get('totalMarks') as string);
    const instructions = formData.get('instructions') as string;

    // Get attachments (if any)
    const attachmentsRaw = formData.get('attachments');
    const attachments = attachmentsRaw ? JSON.parse(attachmentsRaw as string) : [];

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

    // Create the assignment
    const assignment = await db.assignment.create({
      data: {
        title,
        description,
        subjectId,
        assignedDate,
        dueDate,
        totalMarks,
        creatorId: teacher.id,
        instructions,
        attachments: JSON.stringify(attachments),
        schoolId, // Add required schoolId
      },
    });

    // Create assignment-class relationships
    if (classIds && classIds.length > 0) {
      for (const classId of classIds) {
        await db.assignmentClass.create({
          data: {
            assignmentId: assignment.id,
            classId,
            schoolId, // Add required schoolId
          },
        });
      }
    }

    // Get the assignment with relations for calendar integration
    const assignmentWithRelations = await db.assignment.findUnique({
      where: { id: assignment.id },
      include: {
        subject: true,
        classes: {
          include: {
            class: true
          }
        }
      }
    });

    // Create calendar event from assignment
    if (assignmentWithRelations) {
      await createCalendarEventFromAssignment(
        assignmentWithRelations,
        teacher.id
      );
    }

    revalidatePath('/teacher/assessments/assignments');

    return { success: true, assignmentId: assignment.id };
  } catch (error) {
    console.error("Failed to create assignment:", error);
    return { success: false, error: "Failed to create assignment" };
  }
}

/**
 * Update an existing assignment
 */
export async function updateAssignment(formData: FormData) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
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
        schoolId,
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Extract form data
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const subjectId = formData.get('subjectId') as string;
    const classIds = (formData.getAll('classIds') as string[]);
    const assignedDate = new Date(formData.get('assignedDate') as string);
    const dueDate = new Date(formData.get('dueDate') as string);
    const totalMarks = parseInt(formData.get('totalMarks') as string);
    const instructions = formData.get('instructions') as string;

    // Get attachments (if any)
    const attachmentsRaw = formData.get('attachments');
    const attachments = attachmentsRaw ? JSON.parse(attachmentsRaw as string) : [];

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

    // Get the assignment
    const assignment = await db.assignment.findUnique({
      where: {
        id,
      },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Check if teacher has access to modify this assignment
    if (assignment.creatorId !== teacher.id) {
      const hasAccess = await db.subjectTeacher.findFirst({
        where: {
          teacherId: teacher.id,
          subjectId: assignment.subjectId,
        },
      });

      if (!hasAccess) {
        throw new Error("Unauthorized access to this assignment");
      }
    }

    // Update the assignment
    await db.assignment.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        subjectId,
        assignedDate,
        dueDate,
        totalMarks,
        instructions,
        attachments: JSON.stringify(attachments),
      },
    });

    // Delete existing relationships
    await db.assignmentClass.deleteMany({
      where: {
        assignmentId: id,
      },
    });

    // Then create new relationships
    if (classIds && classIds.length > 0) {
      for (const classId of classIds) {
        await db.assignmentClass.create({
          data: {
            assignmentId: id,
            classId,
            schoolId, // Add required schoolId
          },
        });
      }
    }

    // Get the assignment with relations for calendar integration
    const assignmentWithRelations = await db.assignment.findUnique({
      where: { id },
      include: {
        subject: true,
        classes: {
          include: {
            class: true
          }
        }
      }
    });

    // Update calendar event from assignment
    if (assignmentWithRelations) {
      await updateCalendarEventFromAssignment(assignmentWithRelations);
    }

    revalidatePath('/teacher/assessments/assignments');
    revalidatePath(`/teacher/assessments/assignments/${id}`);

    return { success: true, assignmentId: id };
  } catch (error) {
    console.error("Failed to update assignment:", error);
    return { success: false, error: "Failed to update assignment" };
  }
}

/**
 * Update assignment grades
 */
export async function updateAssignmentGrades(assignmentId: string, grades: any[]) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
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
        schoolId,
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
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Verify that this teacher has access to this assignment
    if (assignment.creatorId !== teacher.id) {
      const hasAccess = await db.subjectTeacher.findFirst({
        where: {
          teacherId: teacher.id,
          subjectId: assignment.subjectId,
        },
      });

      if (!hasAccess) {
        throw new Error("Unauthorized access to this assignment");
      }
    }

    // Update each grade
    for (const grade of grades) {
      await db.assignmentSubmission.update({
        where: {
          id: grade.submissionId,
        },
        data: {
          marks: grade.marks,
          feedback: grade.feedback,
          status: 'GRADED',
        },
      });
    }

    revalidatePath(`/teacher/assessments/assignments/${assignmentId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update assignment grades:", error);
    return { success: false, error: "Failed to update assignment grades" };
  }
}

/**
 * Get classes for a teacher
 */
export async function getTeacherClasses() {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
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
        schoolId,
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get classes this teacher teaches
    const classTeachers = await db.classTeacher.findMany({
      where: {
        teacherId: teacher.id,
        schoolId,
      },
      include: {
        class: true,
      },
    });

    const classes = classTeachers.map(ct => ({
      id: ct.class.id,
      name: ct.class.name,
    }));

    return { classes };
  } catch (error) {
    console.error("Failed to fetch teacher classes:", error);
    throw new Error("Failed to fetch classes");
  }
}

/**
 * Delete an assignment
 */
export async function deleteAssignment(assignmentId: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
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
        schoolId,
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get the assignment
    const assignment = await db.assignment.findUnique({
      where: {
        id: assignmentId,
      },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Check if teacher has access to delete this assignment
    if (assignment.creatorId !== teacher.id) {
      const hasAccess = await db.subjectTeacher.findFirst({
        where: {
          teacherId: teacher.id,
          subjectId: assignment.subjectId,
        },
      });

      if (!hasAccess) {
        throw new Error("Unauthorized access to this assignment");
      }
    }

    // Delete submissions first
    await db.assignmentSubmission.deleteMany({
      where: {
        assignmentId,
      },
    });

    // Delete class connections
    await db.assignmentClass.deleteMany({
      where: {
        assignmentId,
      },
    });

    // Delete calendar event from assignment
    await deleteCalendarEventFromAssignment(assignmentId);

    // Delete the assignment
    await db.assignment.delete({
      where: {
        id: assignmentId,
      },
    });

    revalidatePath('/teacher/assessments/assignments');

    return { success: true };
  } catch (error) {
    console.error("Failed to delete assignment:", error);
    return { success: false, error: "Failed to delete assignment" };
  }
}

// Helper function to determine assignment status
function getAssignmentStatus(dueDate: Date) {
  const now = new Date();

  if (dueDate < now) {
    return "completed";
  } else {
    return "active";
  }
}

// Helper function to calculate assignment statistics using standardized grading
function calculateAssignmentStatistics(assignment: any, submissions: any[]) {
  const submittedCount = submissions.length;
  const gradedCount = submissions.filter(s => s.status === 'GRADED').length;
  const lateCount = submissions.filter(s => s.status === 'LATE').length;

  // Calculate grade distribution using standardized utility
  const marksDistribution: Record<string, number> = {};
  submissions
    .filter(s => s.status === 'GRADED' && s.marks !== null)
    .forEach(submission => {
      const percentage = (submission.marks / assignment.totalMarks) * 100;
      const grade = calculateGrade(percentage);
      marksDistribution[grade] = (marksDistribution[grade] || 0) + 1;
    });

  // Calculate average, highest, lowest marks
  const gradedSubmissions = submissions.filter(s => s.status === 'GRADED' && s.marks !== null);
  const totalMarks = gradedSubmissions.reduce((sum, s) => sum + s.marks, 0);
  const avgMarks = gradedSubmissions.length > 0 ? totalMarks / gradedSubmissions.length : 0;
  const highestMark = gradedSubmissions.length > 0 ? Math.max(...gradedSubmissions.map(s => s.marks)) : 0;
  const lowestMark = gradedSubmissions.length > 0 ? Math.min(...gradedSubmissions.map(s => s.marks)) : 0;

  return {
    submittedCount,
    gradedCount,
    lateCount,
    pendingCount: submittedCount - gradedCount,
    averageMarks: avgMarks,
    highestMark,
    lowestMark,
    marksDistribution,
  };
}
