"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  AssignmentFormValues,
  AssignmentUpdateValues,
  AssignmentFilterValues,
  SubmissionGradeValues
} from "../schemaValidation/assignmentsSchemaValidation";
import {
  createCalendarEventFromAssignment,
  updateCalendarEventFromAssignment,
  deleteCalendarEventFromAssignment
} from "../services/assignment-calendar-integration";
import { uploadBufferToCloudinary } from "@/lib/cloudinary-server";
import { auth } from "@/auth";

// Get all assignments with optional filtering
export async function getAssignments(filters?: AssignmentFilterValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const where: any = {};

    // Add filters
    if (filters) {
      if (filters.searchTerm) {
        where.OR = [
          { title: { contains: filters.searchTerm, mode: 'insensitive' } },
          { description: { contains: filters.searchTerm, mode: 'insensitive' } },
          { instructions: { contains: filters.searchTerm, mode: 'insensitive' } },
        ];
      }

      if (filters.subjectId) {
        where.subjectId = filters.subjectId;
      }

      if (filters.classId) {
        where.classes = {
          some: {
            classId: filters.classId
          }
        };
      }

      // Date filtering
      if (filters.dateFrom || filters.dateTo) {
        where.dueDate = {};

        if (filters.dateFrom) {
          where.dueDate.gte = filters.dateFrom;
        }

        if (filters.dateTo) {
          where.dueDate.lte = filters.dateTo;
        }
      }
    }

    const assignments = await db.assignment.findMany({
      where,
      include: {
        subject: true,
        creator: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        submissions: true,
        classes: {
          include: {
            class: true,
          }
        }
      },
      orderBy: {
        dueDate: 'desc',
      },
    });

    // Transform data for the UI
    const formattedAssignments = assignments.map(assignment => {
      // Calculate status based on due date and submissions
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);

      // Add type assertion to handle TypeScript errors
      type AssignmentWithRelations = typeof assignment & {
        subject: { name: string },
        classes: { class: { name: string }, classId: string }[],
        creator?: { user?: { firstName: string, lastName: string } } | null,
        submissions?: {
          id: string;
          status: string;
          studentId: string;
          marks?: number | null;
        }[]
      };

      const typedAssignment = assignment as AssignmentWithRelations;

      let status = "Open";
      if (dueDate < now) {
        status = "Closed";
        const allGraded = typedAssignment.submissions && typedAssignment.submissions.length > 0 &&
          typedAssignment.submissions.every(sub =>
            sub.status === "GRADED" || sub.status === "RETURNED");
        if (allGraded) {
          status = "Graded";
        }
      }

      const totalSubmissions = typedAssignment.submissions ? typedAssignment.submissions.length : 0;
      const totalStudents = 0; // This would require additional queries to get all students in these classes

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description || "",
        subject: typedAssignment.subject.name,
        subjectId: assignment.subjectId,
        grades: typedAssignment.classes.map(c => c.class.name).join(", "),
        classIds: typedAssignment.classes.map(c => c.classId),
        dueDate: assignment.dueDate,
        assignedDate: assignment.assignedDate,
        totalMarks: assignment.totalMarks,
        status: status,
        submissions: totalSubmissions,
        totalStudents: totalStudents || totalSubmissions,
        createdBy: typedAssignment.creator?.user
          ? `${typedAssignment.creator.user.firstName} ${typedAssignment.creator.user.lastName}`
          : "Admin", // Handle null creator
        attachments: assignment.attachments ? JSON.parse(assignment.attachments).length : 0,
        instructions: assignment.instructions || "",
      };
    });

    return { success: true, data: formattedAssignments };
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch assignments"
    };
  }
}

// Get a single assignment by ID
export async function getAssignmentById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const assignment = await db.assignment.findUnique({
      where: { id },
      include: {
        subject: true,
        creator: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        submissions: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  }
                }
              }
            }
          }
        },
        classes: {
          include: {
            class: true,
          }
        }
      }
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    const attachmentsArray = assignment.attachments
      ? JSON.parse(assignment.attachments)
      : [];

    // Calculate status
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);

    // Add type assertion to handle TypeScript errors
    type AssignmentWithRelations = typeof assignment & {
      subject: { name: string },
      classes: { class: { name: string }, classId: string }[],
      creator?: { user?: { firstName: string, lastName: string } } | null,
      submissions?: {
        id: string;
        status: string;
        studentId: string;
        student: {
          user: { firstName: string, lastName: string },
          admissionId: string
        };
        submissionDate?: Date | null;
        content?: string | null;
        attachments?: string | null;
        marks?: number | null;
        feedback?: string | null;
      }[]
    };

    const typedAssignment = assignment as AssignmentWithRelations;

    let status = "Open";
    if (dueDate < now) {
      status = "Closed";
      const allGraded = typedAssignment.submissions && typedAssignment.submissions.length > 0 &&
        typedAssignment.submissions.every(sub =>
          sub.status === "GRADED" || sub.status === "RETURNED");
      if (allGraded) {
        status = "Graded";
      }
    }

    const formattedAssignment = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description || "",
      subject: typedAssignment.subject.name,
      subjectId: assignment.subjectId,
      grades: typedAssignment.classes.map(c => c.class.name).join(", "),
      classIds: typedAssignment.classes.map(c => c.classId),
      dueDate: assignment.dueDate,
      assignedDate: assignment.assignedDate,
      totalMarks: assignment.totalMarks,
      status: status,
      createdBy: typedAssignment.creator?.user
        ? `${typedAssignment.creator.user.firstName} ${typedAssignment.creator.user.lastName}`
        : "Admin", // Handle null creator
      attachments: attachmentsArray,
      instructions: assignment.instructions || "",
      submissions: typedAssignment.submissions?.map(sub => ({
        id: sub.id,
        studentId: sub.studentId,
        studentName: `${sub.student.user.firstName} ${sub.student.user.lastName}`,
        studentAdmissionId: sub.student.admissionId,
        submissionDate: sub.submissionDate,
        content: sub.content || "",
        attachments: sub.attachments ? JSON.parse(sub.attachments) : [],
        marks: sub.marks,
        feedback: sub.feedback || "",
        status: sub.status,
        isLate: sub.submissionDate && dueDate < new Date(sub.submissionDate),
      })),
    };

    return { success: true, data: formattedAssignment };
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch assignment"
    };
  }
}

// Create a new assignment
export async function createAssignment(data: AssignmentFormValues, creatorId: string | null = null, files?: File[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    // Handle file uploads if provided
    const attachments: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          // Convert File to Buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Upload to Cloudinary
          const uploadResult = await uploadBufferToCloudinary(buffer, {
            folder: 'assignments',
            resource_type: 'auto'
          });

          attachments.push(uploadResult.secure_url);
        } catch (uploadError) {
          console.error(`Failed to upload file ${file.name}:`, uploadError);
          // Continue with other files or throw error? 
          // For now, we'll log and continue, effectively skipping this file
        }
      }
    }

    // First create the assignment without classes
    const assignment = await db.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        assignedDate: data.assignedDate,
        dueDate: data.dueDate,
        totalMarks: data.totalMarks,
        creatorId: creatorId, // This can now be null
        instructions: data.instructions,
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
      }
    });

    // Then create the class associations separately
    if (data.classIds && data.classIds.length > 0) {
      for (const classId of data.classIds) {
        await db.assignmentClass.create({
          data: {
            assignmentId: assignment.id,
            classId: classId
          }
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
        creatorId || 'system'
      );
    }

    revalidatePath("/admin/assessment/assignments");
    return { success: true, data: assignment };
  } catch (error) {
    console.error("Error creating assignment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create assignment"
    };
  }
}

// Update an existing assignment
export async function updateAssignment(data: AssignmentUpdateValues, files?: File[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    // Check if assignment exists
    const existingAssignment = await db.assignment.findUnique({
      where: { id: data.id },
      include: {
        submissions: true
      }
    });

    if (!existingAssignment) {
      return { success: false, error: "Assignment not found" };
    }

    // Handle file attachments
    let attachmentsString = existingAssignment.attachments;
    if (files && files.length > 0) {
      const currentAttachments = attachmentsString ? JSON.parse(attachmentsString) : [];

      // Add new files
      for (const file of files) {
        try {
          // Convert File to Buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Upload to Cloudinary
          const uploadResult = await uploadBufferToCloudinary(buffer, {
            folder: 'assignments',
            resource_type: 'auto'
          });

          currentAttachments.push(uploadResult.secure_url);
        } catch (uploadError) {
          console.error(`Failed to upload file ${file.name}:`, uploadError);
        }
      }

      attachmentsString = JSON.stringify(currentAttachments);
    }

    // Update the assignment without classes
    const assignment = await db.assignment.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        assignedDate: data.assignedDate,
        dueDate: data.dueDate,
        totalMarks: data.totalMarks,
        instructions: data.instructions,
        attachments: attachmentsString,
      }
    });

    // Delete existing class connections and recreate them
    await db.assignmentClass.deleteMany({
      where: { assignmentId: data.id }
    });

    // Create new class associations
    if (data.classIds && data.classIds.length > 0) {
      for (const classId of data.classIds) {
        await db.assignmentClass.create({
          data: {
            assignmentId: assignment.id,
            classId: classId
          }
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

    // Update calendar event from assignment
    if (assignmentWithRelations) {
      await updateCalendarEventFromAssignment(assignmentWithRelations);
    }

    revalidatePath("/admin/assessment/assignments");
    revalidatePath(`/admin/assessment/assignments/${data.id}`);
    return { success: true, data: assignment };
  } catch (error) {
    console.error("Error updating assignment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update assignment"
    };
  }
}

// Delete an assignment
export async function deleteAssignment(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    // Check if assignment has submissions
    const submissions = await db.assignmentSubmission.findMany({
      where: { assignmentId: id }
    });

    if (submissions.length > 0) {
      // Delete all submissions first
      await db.assignmentSubmission.deleteMany({
        where: { assignmentId: id }
      });
    }

    // Delete class connections
    await db.assignmentClass.deleteMany({
      where: { assignmentId: id }
    });

    // Delete calendar event from assignment
    await deleteCalendarEventFromAssignment(id);

    // Delete the assignment
    await db.assignment.delete({
      where: { id }
    });

    revalidatePath("/admin/assessment/assignments");
    return { success: true };
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete assignment"
    };
  }
}

// Get all submissions for an assignment
export async function getSubmissionsByAssignment(assignmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      select: { dueDate: true }
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    const submissions = await db.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: {
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
        student: {
          user: {
            firstName: 'asc'
          }
        }
      }
    });

    const dueDate = new Date(assignment.dueDate);

    const formattedSubmissions = submissions.map(sub => ({
      id: sub.id,
      studentId: sub.studentId,
      studentName: `${sub.student.user.firstName} ${sub.student.user.lastName}`,
      studentAdmissionId: sub.student.admissionId,
      submissionDate: sub.submissionDate,
      content: sub.content || "",
      attachments: sub.attachments ? JSON.parse(sub.attachments) : [],
      marks: sub.marks,
      feedback: sub.feedback || "",
      status: sub.status,
      isLate: sub.submissionDate && dueDate < new Date(sub.submissionDate),
    }));

    return { success: true, data: formattedSubmissions };
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch submissions"
    };
  }
}

// Grade a submission
export async function gradeSubmission(data: SubmissionGradeValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const submission = await db.assignmentSubmission.findUnique({
      where: { id: data.submissionId },
      include: {
        assignment: true
      }
    });

    if (!submission) {
      return { success: false, error: "Submission not found" };
    }

    // Validate marks against assignment total marks
    if (data.marks > submission.assignment.totalMarks) {
      return {
        success: false,
        error: `Marks cannot exceed the assignment's total marks (${submission.assignment.totalMarks})`
      };
    }

    const updatedSubmission = await db.assignmentSubmission.update({
      where: { id: data.submissionId },
      data: {
        marks: data.marks,
        feedback: data.feedback,
        status: data.status
      }
    });

    revalidatePath("/admin/assessment/assignments");
    revalidatePath(`/admin/assessment/assignments/${submission.assignmentId}`);
    return { success: true, data: updatedSubmission };
  } catch (error) {
    console.error("Error grading submission:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to grade submission"
    };
  }
}

// Get subjects for assignment dropdown
export async function getSubjectsForAssignments() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const subjects = await db.subject.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        code: true,
      }
    });

    return { success: true, data: subjects };
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subjects"
    };
  }
}

// Get classes for assignment dropdown
export async function getClassesForAssignments() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const classes = await db.class.findMany({
      orderBy: [
        {
          academicYear: {
            isCurrent: 'desc',
          }
        },
        {
          name: 'asc',
        }
      ],
      include: {
        academicYear: {
          select: {
            name: true,
            isCurrent: true,
          }
        }
      }
    });

    return { success: true, data: classes };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classes"
    };
  }
}
