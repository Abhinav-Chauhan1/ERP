"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { PermissionAction } from "@prisma/client";
import { hasPermission } from "@/lib/utils/permissions";
import { SectionFormValues, SectionUpdateFormValues } from "../schemaValidation/sectionsSchemaValidation";

// Helper to check permission and throw if denied
async function checkPermission(resource: string, action: PermissionAction, errorMessage?: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('Unauthorized: You must be logged in');
  }

  const allowed = await hasPermission(userId, resource, action);
  if (!allowed) {
    throw new Error(errorMessage || `Permission denied: Cannot ${action} ${resource}`);
  }

  return userId;
}

// Get all sections with related info
export async function getSections(classFilter?: string) {
  try {
    const where = classFilter ? { classId: classFilter } : {};

    const sections = await db.classSection.findMany({
      where,
      include: {
        class: {
          include: {
            academicYear: {
              select: {
                name: true,
                isCurrent: true,
              }
            }
          }
        },
        homeRoom: true, // Include the home room
        _count: {
          select: {
            enrollments: true,
          }
        }
      },
      orderBy: [
        { class: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    // Get related teachers for these sections
    const sectionsWithTeachers = await Promise.all(
      sections.map(async (section) => {
        // Find teacher specifically assigned to this section
        let classTeacher = await db.classTeacher.findFirst({
          where: {
            classId: section.classId,
            sectionId: section.id,
            isClassHead: true,
          },
          include: {
            teacher: {
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
        });

        // If no section-specific head, check for class-level head (sectionId: null)
        if (!classTeacher) {
          classTeacher = await db.classTeacher.findFirst({
            where: {
              classId: section.classId,
              sectionId: null,
              isClassHead: true,
            },
            include: {
              teacher: {
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
          });
        }

        // Get room information
        const timetableSlot = await db.timetableSlot.findFirst({
          where: {
            sectionId: section.id,
          },
          include: {
            room: true,
          }
        });

        return {
          ...section,
          teacherName: classTeacher
            ? `${classTeacher.teacher.user.firstName} ${classTeacher.teacher.user.lastName}`
            : "Not assigned",
          teacherId: classTeacher?.teacherId,
          room: section.homeRoom?.name || "Not assigned", // Prioritize Home Room
          roomId: section.homeRoom?.id || null,
          students: section._count.enrollments,
          academicYear: section.class.academicYear.name,
          isCurrent: section.class.academicYear.isCurrent,
          className: section.class.name,
        };
      })
    );

    return { success: true, data: sectionsWithTeachers };
  } catch (error) {
    console.error("Error fetching sections:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sections"
    };
  }
}

// Get a single section by ID
export async function getSectionById(id: string) {
  try {
    const section = await db.classSection.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            academicYear: true,
          }
        },
        enrollments: {
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
        homeRoom: true, // Include home room
      }
    });

    if (!section) {
      return { success: false, error: "Section not found" };
    }

    // Get class teacher for this section
    const classTeacher = await db.classTeacher.findFirst({
      where: {
        classId: section.classId,
        isClassHead: true,
      },
      include: {
        teacher: {
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
    });

    // Get room information
    const timetableSlot = await db.timetableSlot.findFirst({
      where: {
        sectionId: section.id,
      },
      include: {
        room: true,
      }
    });

    const formattedSection = {
      ...section,
      teacherName: classTeacher
        ? `${classTeacher.teacher.user.firstName} ${classTeacher.teacher.user.lastName}`
        : "Not assigned",
      teacherId: classTeacher?.teacherId,
      room: section.homeRoom?.name || "Not assigned", // Prioritize Home Room
      roomId: section.homeRoom?.id || null,
      students: section.enrollments.map(enrollment => ({
        id: enrollment.studentId,
        enrollmentId: enrollment.id,
        name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        rollNumber: enrollment.rollNumber,
        status: enrollment.status,
      }))
    };

    return { success: true, data: formattedSection };
  } catch (error) {
    console.error("Error fetching section:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch section"
    };
  }
}

// Get all classes for dropdown
export async function getClassesForDropdown() {
  try {
    const classes = await db.class.findMany({
      orderBy: [
        { academicYear: { startDate: 'desc' } },
        { name: 'asc' },
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

// Get all teachers for dropdown
export async function getTeachersForDropdown() {
  try {
    const teachers = await db.teacher.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc',
        }
      }
    });

    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      employeeId: teacher.employeeId,
    }));

    return { success: true, data: formattedTeachers };
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch teachers"
    };
  }
}

// Get all classrooms for dropdown
export async function getClassRoomsForDropdown() {
  try {
    const rooms = await db.classRoom.findMany({
      orderBy: {
        name: 'asc',
      }
    });

    return { success: true, data: rooms };
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classrooms"
    };
  }
}

// Create a new section
export async function createSection(data: SectionFormValues) {
  try {
    // Permission check: require SECTION:CREATE
    await checkPermission('SECTION', 'CREATE', 'You do not have permission to create sections');

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Check if section name already exists for this class
    const existingSection = await db.classSection.findFirst({
      where: {
        name: data.name,
        classId: data.classId,
      }
    });

    if (existingSection) {
      return { success: false, error: "A section with this name already exists for this class" };
    }

    // Create the section
    const section = await db.classSection.create({
      data: {
        name: data.name,
        classId: data.classId,
        capacity: data.capacity,
        schoolId, // Add required schoolId
      }
    });

    // If teacher is provided, assign as class teacher
    if (data.teacherId) {
      // Check if teacher is already assigned to this class
      const existingTeacher = await db.classTeacher.findFirst({
        where: {
          classId: data.classId,
          teacherId: data.teacherId,
        }
      });

      if (!existingTeacher) {
        // Create new class teacher relationship linked to this section
        await db.classTeacher.create({
          data: {
            classId: data.classId,
            sectionId: section.id, // Link to the new section
            teacherId: data.teacherId,
            isClassHead: data.isClassHead,
            schoolId, // Add required schoolId
          }
        });
      } else if (data.isClassHead && !existingTeacher.isClassHead) {
        // Update existing teacher to be class head
        // Only unset other heads for THIS section
        await db.classTeacher.updateMany({
          where: {
            classId: data.classId,
            isClassHead: true,
            sectionId: section.id // Scoped to this section
          },
          data: { isClassHead: false },
        });

        await db.classTeacher.update({
          where: { id: existingTeacher.id },
          data: { isClassHead: true },
        });
      }
    }

    revalidatePath("/admin/classes/sections");
    return { success: true, data: section };
  } catch (error) {
    console.error("Error creating section:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create section"
    };
  }
}

// Update an existing section
export async function updateSection(data: SectionUpdateFormValues) {
  try {
    // Permission check: require SECTION:UPDATE
    await checkPermission('SECTION', 'UPDATE', 'You do not have permission to update sections');

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Check if section name already exists for this class (excluding current section)
    const existingSection = await db.classSection.findFirst({
      where: {
        name: data.name,
        classId: data.classId,
        id: { not: data.id },
      }
    });

    if (existingSection) {
      return { success: false, error: "A section with this name already exists for this class" };
    }

    // Update the section
    const section = await db.classSection.update({
      where: { id: data.id },
      data: {
        name: data.name,
        classId: data.classId,
        capacity: data.capacity,
      }
    });

    // If teacher is provided, update class teacher assignment
    if (data.teacherId) {
      // Check if teacher is already assigned to this class
      const existingTeacher = await db.classTeacher.findFirst({
        where: {
          classId: data.classId,
          teacherId: data.teacherId,
        }
      });

      if (!existingTeacher) {
        // Create new class teacher relationship linked to this section
        await db.classTeacher.create({
          data: {
            classId: data.classId,
            sectionId: data.id, // Link to the section being updated
            teacherId: data.teacherId,
            isClassHead: data.isClassHead,
            schoolId, // Add required schoolId
          }
        });
      } else if (data.isClassHead && !existingTeacher.isClassHead) {
        // Update existing teacher to be class head
        // Only unset other heads for THIS section
        await db.classTeacher.updateMany({
          where: {
            classId: data.classId,
            isClassHead: true,
            sectionId: data.id // Scoped to this section
          },
          data: { isClassHead: false },
        });

        await db.classTeacher.update({
          where: { id: existingTeacher.id },
          data: { isClassHead: true },
        });
      }
    }

    revalidatePath("/admin/classes/sections");
    revalidatePath(`/admin/classes/sections/${data.id}`);
    return { success: true, data: section };
  } catch (error) {
    console.error("Error updating section:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update section"
    };
  }
}

// Delete a section
export async function deleteSection(id: string) {
  try {
    // Check if section has enrollments
    const enrollments = await db.classEnrollment.findFirst({
      where: { sectionId: id }
    });

    if (enrollments) {
      return {
        success: false,
        error: "Cannot delete section with enrolled students. Please move or remove students first."
      };
    }

    // Check if section has timetable slots
    const timetableSlots = await db.timetableSlot.findFirst({
      where: { sectionId: id }
    });

    if (timetableSlots) {
      return {
        success: false,
        error: "Cannot delete section with timetable entries. Please remove timetable entries first."
      };
    }

    // Get class ID for revalidation
    const section = await db.classSection.findUnique({
      where: { id },
      select: { classId: true }
    });

    // Delete the section
    await db.classSection.delete({
      where: { id }
    });

    revalidatePath("/admin/classes/sections");
    if (section?.classId) {
      revalidatePath(`/admin/classes/${section.classId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting section:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete section"
    };
  }
}
