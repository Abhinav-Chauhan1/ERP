"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

// Get a subject by ID with assigned teachers
export async function getSubjectById(id: string) {
  try {
    const subject = await db.subject.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            name: true,
          }
        },
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  }
                },
                departments: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!subject) {
      return { success: false, error: "Subject not found" };
    }
    
    // Transform the data to a more usable format
    const formattedSubject = {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      department: subject.department?.name,
      teachers: subject.teachers.map(st => ({
        id: st.teacher.id,
        name: `${st.teacher.user.firstName} ${st.teacher.user.lastName}`,
        avatar: st.teacher.user.avatar,
        employeeId: st.teacher.employeeId,
        department: st.teacher.departments[0]?.name || "No Department",
        assignmentId: st.id // This is the SubjectTeacher id, useful for removals
      }))
    };
    
    return { success: true, data: formattedSubject };
  } catch (error) {
    console.error("Error fetching subject details:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch subject details" 
    };
  }
}

// Get teachers that can be assigned to this subject
export async function getTeachersForAssignment(subjectId: string) {
  try {
    // First, get currently assigned teacher IDs
    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      include: {
        teachers: {
          select: {
            teacherId: true,
          }
        }
      }
    });
    
    if (!subject) {
      return { success: false, error: "Subject not found" };
    }
    
    // Get IDs of teachers already assigned to this subject
    const assignedTeacherIds = subject.teachers.map(st => st.teacherId);
    
    // Now get all active teachers not already assigned to this subject
    const availableTeachers = await db.teacher.findMany({
      where: {
        id: {
          notIn: assignedTeacherIds
        },
        user: {
          active: true
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          }
        },
        departments: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });
    
    // Transform to a more usable format
    const formattedTeachers = availableTeachers.map(teacher => ({
      id: teacher.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      avatar: teacher.user.avatar,
      employeeId: teacher.employeeId,
      department: teacher.departments[0]?.name
    }));
    
    return { success: true, data: formattedTeachers };
  } catch (error) {
    console.error("Error fetching available teachers:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch available teachers" 
    };
  }
}

// Assign a teacher to a subject
export async function assignTeacherToSubject(subjectId: string, teacherId: string) {
  try {
    // Check if the assignment already exists
    const existingAssignment = await db.subjectTeacher.findFirst({
      where: {
        subjectId,
        teacherId
      }
    });
    
    if (existingAssignment) {
      return { success: false, error: "Teacher is already assigned to this subject" };
    }
    
    // Create the new assignment
    const assignment = await db.subjectTeacher.create({
      data: {
        subject: { connect: { id: subjectId } },
        teacher: { connect: { id: teacherId } }
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        subject: true
      }
    });
    
    revalidatePath(`/admin/teaching/subjects/${subjectId}`);
    revalidatePath(`/admin/teaching/subjects/${subjectId}/assign-teacher`);
    
    return { success: true, data: assignment };
  } catch (error) {
    console.error("Error assigning teacher to subject:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to assign teacher to subject" 
    };
  }
}

// Remove a teacher from a subject
export async function removeTeacherFromSubject(subjectId: string, teacherId: string) {
  try {
    // Check if the assignment exists
    const existingAssignment = await db.subjectTeacher.findFirst({
      where: {
        subjectId,
        teacherId
      }
    });
    
    if (!existingAssignment) {
      return { success: false, error: "Teacher is not assigned to this subject" };
    }
    
    // Check if this assignment is used in timetables or other critical places
    const usedInTimetable = await db.timetableSlot.findFirst({
      where: {
        subjectTeacherId: existingAssignment.id
      }
    });
    
    if (usedInTimetable) {
      return { 
        success: false, 
        error: "Cannot remove this teacher as they're assigned to this subject in the timetable. Please update the timetable first." 
      };
    }
    
    // Remove the assignment
    await db.subjectTeacher.delete({
      where: {
        id: existingAssignment.id
      }
    });
    
    revalidatePath(`/admin/teaching/subjects/${subjectId}`);
    revalidatePath(`/admin/teaching/subjects/${subjectId}/assign-teacher`);
    
    return { success: true };
  } catch (error) {
    console.error("Error removing teacher from subject:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to remove teacher from subject" 
    };
  }
}
