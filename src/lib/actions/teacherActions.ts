"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

// Get teacher with detailed information
export async function getTeacherWithDetails(teacherId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!teacherId) {
    console.error('Invalid teacher ID provided:', teacherId);
    return null;
  }

  try {
    console.log(`Fetching teacher details for ID: ${teacherId}`);

    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: true,
        // Include related data for teachers
        subjects: {
          include: {
            subject: true
          }
        },
        classes: {
          include: {
            class: true
          }
        },
        parentMeetings: {
          include: {
            parent: {
              include: {
                user: true
              }
            }
          },
          orderBy: {
            scheduledDate: 'desc'
          },
          take: 3
        },
        examCreated: {
          take: 5,
          orderBy: {
            examDate: 'desc'
          },
          include: {
            subject: true
          }
        },
        assignmentCreated: {
          take: 5,
          orderBy: {
            dueDate: 'desc'
          },
          include: {
            subject: true
          }
        }
      },
    });

    if (!teacher) {
      console.log(`No teacher found with ID: ${teacherId}`);
    } else {
      console.log(`Found teacher: ${teacher.user.firstName} ${teacher.user.lastName}`);
    }

    return teacher;
  } catch (error) {
    console.error(`Error in getTeacherWithDetails for ID ${teacherId}:`, error);
    throw error;
  }
}

// Get available subjects that can be assigned to a teacher
export async function getAvailableSubjectsForTeacher(teacherId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    // Get subjects already assigned to this teacher
    const assignedSubjects = await db.subjectTeacher.findMany({
      where: { teacherId },
      select: { subjectId: true }
    });

    const assignedSubjectIds = assignedSubjects.map(s => s.subjectId);

    // Get all active subjects not assigned to this teacher
    const availableSubjects = await db.subject.findMany({
      where: {
        id: {
          notIn: assignedSubjectIds
        }
      },
      include: {
        department: {
          select: { name: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return {
      success: true,
      data: availableSubjects.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
        department: s.department?.name
      }))
    };
  } catch (error) {
    console.error("Error fetching available subjects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch available subjects"
    };
  }
}

// Get available classes that can be assigned to a teacher
export async function getAvailableClassesForTeacher(teacherId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    // Get classes already assigned to this teacher
    const assignedClasses = await db.classTeacher.findMany({
      where: { teacherId },
      select: { classId: true }
    });

    const assignedClassIds = assignedClasses.map(c => c.classId);

    // Get all classes not assigned to this teacher, with their sections
    const availableClasses = await db.class.findMany({
      where: {
        id: {
          notIn: assignedClassIds
        }
      },
      include: {
        sections: {
          select: {
            id: true,
            name: true
          },
          orderBy: { name: 'asc' }
        },
        academicYear: {
          select: {
            name: true,
            isCurrent: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return {
      success: true,
      data: availableClasses.map(c => ({
        id: c.id,
        name: c.name,
        sections: c.sections,
        academicYear: c.academicYear?.name,
        isCurrent: c.academicYear?.isCurrent
      }))
    };
  } catch (error) {
    console.error("Error fetching available classes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch available classes"
    };
  }
}
