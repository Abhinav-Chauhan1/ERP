"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import {
  TimetableFormValues,
  TimetableUpdateFormValues,
  TimetableSlotFormValues,
  TimetableSlotUpdateFormValues
} from "../schemaValidation/timetableSchemaValidation";
import { formatISO, parseISO } from 'date-fns';
import { formatTimeForDisplay, formatDayForDisplay } from "@/lib/utils/formatters";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// Get all timetables
export async function getTimetables() {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const timetables = await db.timetable.findMany({
      where: { schoolId },
      orderBy: {
        effectiveFrom: 'desc',
      },
      include: {
        _count: {
          select: {
            slots: true
          }
        }
      }
    });

    return { success: true, data: timetables };
  } catch (error) {
    console.error("Error fetching timetables:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch timetables"
    };
  }
}

// Get a specific timetable by ID
export async function getTimetableById(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const timetable = await db.timetable.findUnique({
      where: { id, schoolId },
      include: {
        slots: {
          include: {
            class: true,
            section: true,
            room: true,
            subjectTeacher: {
              include: {
                subject: true,
                teacher: {
                  include: {
                    user: true
                  }
                }
              }
            }
          },
          orderBy: [
            { day: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });

    if (!timetable) {
      return { success: false, error: "Timetable not found" };
    }

    // Transform slot data for easier consumption in the frontend
    const transformedSlots = timetable.slots.map(slot => ({
      id: slot.id,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      class: {
        id: slot.classId,
        name: slot.class.name
      },
      section: slot.section ? {
        id: slot.sectionId!,
        name: slot.section.name
      } : null,
      subject: {
        id: slot.subjectTeacher.subject.id,
        name: slot.subjectTeacher.subject.name,
        code: slot.subjectTeacher.subject.code
      },
      teacher: {
        id: slot.subjectTeacher.teacher.id,
        name: `${slot.subjectTeacher.teacher.user.firstName} ${slot.subjectTeacher.teacher.user.lastName}`
      },
      room: slot.room ? {
        id: slot.roomId!,
        name: slot.room.name
      } : null
    }));

    return {
      success: true,
      data: {
        ...timetable,
        slots: transformedSlots
      }
    };
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch timetable"
    };
  }
}

// Get timetable slots by class ID
export async function getTimetableSlotsByClass(classId: string, activeTimetableOnly: boolean = true) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const whereClause: any = {
      classId,
      class: { schoolId } // Ensure class belongs to school
    };

    if (activeTimetableOnly) {
      whereClause.timetable = {
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ]
      };
    }

    const slots = await db.timetableSlot.findMany({
      where: whereClause,
      include: {
        timetable: true,
        class: true,
        section: true,
        room: true,
        subjectTeacher: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Transform data for easier consumption in the frontend
    const transformedSlots = slots.map(slot => ({
      id: slot.id,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timetable: {
        id: slot.timetableId,
        name: slot.timetable.name
      },
      class: {
        id: slot.classId,
        name: slot.class.name
      },
      section: slot.section ? {
        id: slot.sectionId!,
        name: slot.section.name
      } : null,
      subject: {
        id: slot.subjectTeacher.subject.id,
        name: slot.subjectTeacher.subject.name,
        code: slot.subjectTeacher.subject.code
      },
      teacher: {
        id: slot.subjectTeacher.teacher.id,
        name: `${slot.subjectTeacher.teacher.user.firstName} ${slot.subjectTeacher.teacher.user.lastName}`
      },
      room: slot.room ? {
        id: slot.roomId!,
        name: slot.room.name
      } : null
    }));

    return { success: true, data: transformedSlots };
  } catch (error) {
    console.error("Error fetching timetable slots:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch timetable slots"
    };
  }
}

// Get timetable slots by teacher ID
export async function getTimetableSlotsByTeacher(teacherId: string, activeTimetableOnly: boolean = true) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const whereClause: any = {
      subjectTeacher: {
        teacherId,
        teacher: { schoolId } // Ensure teacher belongs to school
      }
    };

    if (activeTimetableOnly) {
      whereClause.timetable = {
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ]
      };
    }

    const slots = await db.timetableSlot.findMany({
      where: whereClause,
      include: {
        timetable: true,
        class: true,
        section: true,
        room: true,
        subjectTeacher: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Transform data
    const transformedSlots = slots.map(slot => ({
      id: slot.id,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timetable: {
        id: slot.timetableId,
        name: slot.timetable.name
      },
      class: {
        id: slot.classId,
        name: slot.class.name
      },
      section: slot.section ? {
        id: slot.sectionId!,
        name: slot.section.name
      } : null,
      subject: {
        id: slot.subjectTeacher.subject.id,
        name: slot.subjectTeacher.subject.name,
        code: slot.subjectTeacher.subject.code
      },
      room: slot.room ? {
        id: slot.roomId!,
        name: slot.room.name
      } : null
    }));

    return { success: true, data: transformedSlots };
  } catch (error) {
    console.error("Error fetching teacher's timetable slots:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch timetable slots"
    };
  }
}

// Get timetable slots by room ID
export async function getTimetableSlotsByRoom(roomId: string, activeTimetableOnly: boolean = true) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const whereClause: any = {
      roomId,
      room: { schoolId } // Ensure room belongs to school
    };

    if (activeTimetableOnly) {
      whereClause.timetable = {
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ]
      };
    }

    const slots = await db.timetableSlot.findMany({
      where: whereClause,
      include: {
        timetable: true,
        class: true,
        section: true,
        subjectTeacher: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Transform data
    const transformedSlots = slots.map(slot => ({
      id: slot.id,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timetable: {
        id: slot.timetableId,
        name: slot.timetable.name
      },
      class: {
        id: slot.classId,
        name: slot.class.name
      },
      section: slot.section ? {
        id: slot.sectionId!,
        name: slot.section.name
      } : null,
      subject: {
        id: slot.subjectTeacher.subject.id,
        name: slot.subjectTeacher.subject.name,
        code: slot.subjectTeacher.subject.code
      },
      teacher: {
        id: slot.subjectTeacher.teacher.id,
        name: `${slot.subjectTeacher.teacher.user.firstName} ${slot.subjectTeacher.teacher.user.lastName}`
      }
    }));

    return { success: true, data: transformedSlots };
  } catch (error) {
    console.error("Error fetching room's timetable slots:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch timetable slots"
    };
  }
}

// Create a new timetable
export async function createTimetable(data: TimetableFormValues) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    // If this is set as active, deactivate other active timetables
    if (data.isActive) {
      await db.timetable.updateMany({
        where: { isActive: true, schoolId },
        data: { isActive: false }
      });
    }

    const timetable = await db.timetable.create({
      data: {
        schoolId,
        name: data.name,
        description: data.description || "",
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo || null,
        isActive: data.isActive,
      }
    });

    revalidatePath("/admin/teaching/timetable");
    return { success: true, data: timetable };
  } catch (error) {
    console.error("Error creating timetable:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create timetable"
    };
  }
}

// Update an existing timetable
export async function updateTimetable(data: TimetableUpdateFormValues) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    // Check if timetable exists
    const existingTimetable = await db.timetable.findUnique({
      where: { id: data.id, schoolId }
    });

    if (!existingTimetable) {
      return { success: false, error: "Timetable not found" };
    }

    // If this is set as active, deactivate other active timetables
    if (data.isActive && !existingTimetable.isActive) {
      await db.timetable.updateMany({
        where: {
          isActive: true,
          schoolId,
          id: { not: data.id }
        },
        data: { isActive: false }
      });
    }

    const timetable = await db.timetable.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description || "",
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo || null,
        isActive: data.isActive,
      }
    });

    revalidatePath("/admin/teaching/timetable");
    revalidatePath(`/admin/teaching/timetable/${data.id}`);
    return { success: true, data: timetable };
  } catch (error) {
    console.error("Error updating timetable:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update timetable"
    };
  }
}

// Delete a timetable
export async function deleteTimetable(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    // Check if timetable has any slots
    const slotsCount = await db.timetableSlot.count({
      where: { timetableId: id, timetable: { schoolId } }
    });

    if (slotsCount > 0) {
      return {
        success: false,
        error: "Cannot delete timetable with existing slots. Please delete all slots first."
      };
    }

    await db.timetable.delete({
      where: { id, schoolId }
    });

    revalidatePath("/admin/teaching/timetable");
    return { success: true };
  } catch (error) {
    console.error("Error deleting timetable:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete timetable"
    };
  }
}

// Create a new timetable slot
export async function createTimetableSlot(data: TimetableSlotFormValues) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    // Process optional fields 
    const sectionId = data.sectionId === "none" ? null : data.sectionId;
    const roomId = data.roomId === "none" ? null : data.roomId;

    // Check if a slot already exists for this class/section at this time
    const conflictingSlot = await checkSlotConflict({
      timetableId: data.timetableId,
      classId: data.classId,
      sectionId: sectionId,
      day: data.day,
      startTime: data.startTime,
      endTime: data.endTime
    });

    if (conflictingSlot) {
      return { success: false, error: conflictingSlot };
    }

    // Check if teacher is available at this time
    const teacherConflict = await checkTeacherAvailability({
      timetableId: data.timetableId,
      subjectTeacherId: data.subjectTeacherId,
      day: data.day,
      startTime: data.startTime,
      endTime: data.endTime
    });

    if (teacherConflict) {
      return { success: false, error: teacherConflict };
    }

    // Check if room is available at this time
    if (roomId) {
      const roomConflict = await checkRoomAvailability({
        timetableId: data.timetableId,
        roomId: roomId,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime
      });

      if (roomConflict) {
        return { success: false, error: roomConflict };
      }
    }

    // Use the schoolId already obtained from requireSchoolAccess above

    const slot = await db.timetableSlot.create({
      data: {
        timetableId: data.timetableId,
        classId: data.classId,
        sectionId: sectionId,
        subjectTeacherId: data.subjectTeacherId,
        roomId: roomId,
        topicId: data.topicId === "none" ? null : data.topicId || null, // Optional assigned topic
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        schoolId, // Add required schoolId
      }
    });

    revalidatePath("/admin/teaching/timetable");
    revalidatePath(`/admin/teaching/timetable/${data.timetableId}`);
    return { success: true, data: slot };
  } catch (error) {
    console.error("Error creating timetable slot:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create timetable slot"
    };
  }
}

// Update an existing timetable slot
export async function updateTimetableSlot(data: TimetableSlotUpdateFormValues) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    // Process optional fields 
    const sectionId = data.sectionId === "none" ? null : data.sectionId;
    const roomId = data.roomId === "none" ? null : data.roomId;

    // Check if slot exists
    const existingSlot = await db.timetableSlot.findUnique({
      where: { id: data.id },
      include: { timetable: true }
    });

    if (!existingSlot || existingSlot.timetable.schoolId !== schoolId) {
      return { success: false, error: "Timetable slot not found or access denied" };
    }

    // Check if a slot already exists for this class/section at this time (excluding current slot)
    const conflictingSlot = await checkSlotConflict({
      timetableId: data.timetableId,
      classId: data.classId,
      sectionId: sectionId,
      day: data.day,
      startTime: data.startTime,
      endTime: data.endTime,
      excludeSlotId: data.id
    });

    if (conflictingSlot) {
      return { success: false, error: conflictingSlot };
    }

    // Check if teacher is available at this time (excluding current slot)
    const teacherConflict = await checkTeacherAvailability({
      timetableId: data.timetableId,
      subjectTeacherId: data.subjectTeacherId,
      day: data.day,
      startTime: data.startTime,
      endTime: data.endTime,
      excludeSlotId: data.id
    });

    if (teacherConflict) {
      return { success: false, error: teacherConflict };
    }

    // Check if room is available at this time (excluding current slot)
    if (roomId) {
      const roomConflict = await checkRoomAvailability({
        timetableId: data.timetableId,
        roomId: roomId,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        excludeSlotId: data.id
      });

      if (roomConflict) {
        return { success: false, error: roomConflict };
      }
    }

    const slot = await db.timetableSlot.update({
      where: { id: data.id },
      data: {
        timetableId: data.timetableId,
        classId: data.classId,
        sectionId: sectionId,
        subjectTeacherId: data.subjectTeacherId,
        roomId: roomId,
        topicId: data.topicId === "none" ? null : data.topicId || null, // Optional assigned topic
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
      }
    });

    revalidatePath("/admin/teaching/timetable");
    revalidatePath(`/admin/teaching/timetable/${data.timetableId}`);
    return { success: true, data: slot };
  } catch (error) {
    console.error("Error updating timetable slot:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update timetable slot"
    };
  }
}

// Delete a timetable slot
export async function deleteTimetableSlot(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    // Get timetable ID for revalidation
    const slot = await db.timetableSlot.findUnique({
      where: { id },
      include: { timetable: true }
    });

    if (!slot || slot.timetable.schoolId !== schoolId) {
      return { success: false, error: "Timetable slot not found or access denied" };
    }

    await db.timetableSlot.delete({
      where: { id }
    });

    revalidatePath("/admin/teaching/timetable");
    revalidatePath(`/admin/teaching/timetable/${slot.timetableId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting timetable slot:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete timetable slot"
    };
  }
}

// Helper functions

// Get all classes for dropdown
export async function getClassesForTimetable() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const classes = await db.class.findMany({
      where: {
        academicYear: {
          isCurrent: true
        }
      },
      include: {
        academicYear: true,
        sections: true
      },
      orderBy: {
        name: 'asc'
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

// Get all rooms for dropdown
export async function getRoomsForTimetable() {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const rooms = await db.classRoom.findMany({
      where: { schoolId },
      orderBy: {
        name: 'asc'
      }
    });

    return { success: true, data: rooms };
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch rooms"
    };
  }
}

// Get all subject-teacher combinations for dropdown
export async function getSubjectTeachersForTimetable() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const subjectTeachers = await db.subjectTeacher.findMany({
      include: {
        subject: true,
        teacher: {
          include: {
            user: true
          }
        }
      },
      orderBy: [
        {
          subject: {
            name: 'asc'
          }
        },
        {
          teacher: {
            user: {
              firstName: 'asc'
            }
          }
        }
      ]
    });

    // Transform data for easier consumption in the frontend
    const formattedData = subjectTeachers.map(st => ({
      id: st.id,
      subjectId: st.subjectId,
      subjectName: st.subject.name,
      subjectCode: st.subject.code,
      teacherId: st.teacherId,
      teacherName: `${st.teacher.user.firstName} ${st.teacher.user.lastName}`,
      // This format makes it easier to display in a dropdown
      display: `${st.subject.name} (${st.subject.code}) - ${st.teacher.user.firstName} ${st.teacher.user.lastName}`
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("Error fetching subject-teachers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subject-teachers"
    };
  }
}

// Helper function to check for slot conflicts
async function checkSlotConflict({
  timetableId,
  classId,
  sectionId,
  day,
  startTime,
  endTime,
  excludeSlotId
}: {
  timetableId: string;
  classId: string;
  sectionId?: string | null;
  day: string;
  startTime: Date;
  endTime: Date;
  excludeSlotId?: string;
}) {
  // Build the where clause
  const whereClause: any = {
    timetableId,
    classId,
    day,
    OR: [
      // New slot starts during an existing slot
      {
        startTime: { lte: startTime },
        endTime: { gt: startTime }
      },
      // New slot ends during an existing slot
      {
        startTime: { lt: endTime },
        endTime: { gte: endTime }
      },
      // New slot completely contains an existing slot
      {
        startTime: { gte: startTime },
        endTime: { lte: endTime }
      }
    ]
  };

  // If section is specified, add it to the where clause
  if (sectionId) {
    whereClause.sectionId = sectionId;
  } else {
    whereClause.sectionId = null;
  }

  // Exclude the current slot if we're updating
  if (excludeSlotId) {
    whereClause.id = { not: excludeSlotId };
  }

  const conflictingSlot = await db.timetableSlot.findFirst({
    where: whereClause,
    include: {
      class: true,
      section: true
    }
  });

  if (conflictingSlot) {
    return `Time slot conflict: This class ${conflictingSlot.class.name}${conflictingSlot.section ? ` (${conflictingSlot.section.name})` : ''
      } already has a class scheduled during this time on ${day}.`;
  }

  return null;
}

// Helper function to check for teacher availability
async function checkTeacherAvailability({
  timetableId,
  subjectTeacherId,
  day,
  startTime,
  endTime,
  excludeSlotId
}: {
  timetableId: string;
  subjectTeacherId: string;
  day: string;
  startTime: Date;
  endTime: Date;
  excludeSlotId?: string;
}) {
  const whereClause: any = {
    timetableId,
    subjectTeacherId,
    day,
    OR: [
      // New slot starts during an existing slot
      {
        startTime: { lte: startTime },
        endTime: { gt: startTime }
      },
      // New slot ends during an existing slot
      {
        startTime: { lt: endTime },
        endTime: { gte: endTime }
      },
      // New slot completely contains an existing slot
      {
        startTime: { gte: startTime },
        endTime: { lte: endTime }
      }
    ]
  };

  // Exclude the current slot if we're updating
  if (excludeSlotId) {
    whereClause.id = { not: excludeSlotId };
  }

  const conflictingSlot = await db.timetableSlot.findFirst({
    where: whereClause,
    include: {
      subjectTeacher: {
        include: {
          teacher: {
            include: {
              user: true
            }
          }
        }
      },
      class: true,
      section: true
    }
  });

  if (conflictingSlot) {
    return `Teacher conflict: ${conflictingSlot.subjectTeacher.teacher.user.firstName} ${conflictingSlot.subjectTeacher.teacher.user.lastName
      } is already scheduled to teach ${conflictingSlot.class.name}${conflictingSlot.section ? ` (${conflictingSlot.section.name})` : ''
      } during this time on ${day}.`;
  }

  return null;
}

// Helper function to check for room availability
async function checkRoomAvailability({
  timetableId,
  roomId,
  day,
  startTime,
  endTime,
  excludeSlotId
}: {
  timetableId: string;
  roomId: string;
  day: string;
  startTime: Date;
  endTime: Date;
  excludeSlotId?: string;
}) {
  const whereClause: any = {
    timetableId,
    roomId,
    day,
    OR: [
      // New slot starts during an existing slot
      {
        startTime: { lte: startTime },
        endTime: { gt: startTime }
      },
      // New slot ends during an existing slot
      {
        startTime: { lt: endTime },
        endTime: { gte: endTime }
      },
      // New slot completely contains an existing slot
      {
        startTime: { gte: startTime },
        endTime: { lte: endTime }
      }
    ]
  };

  // Exclude the current slot if we're updating
  if (excludeSlotId) {
    whereClause.id = { not: excludeSlotId };
  }

  const conflictingSlot = await db.timetableSlot.findFirst({
    where: whereClause,
    include: {
      room: true,
      class: true,
      section: true
    }
  });

  if (conflictingSlot) {
    return `Room conflict: ${conflictingSlot.room!.name} is already booked for ${conflictingSlot.class.name
      }${conflictingSlot.section ? ` (${conflictingSlot.section.name})` : ''
      } during this time on ${day}.`;
  }

  return null;
}

// Re-export utility functions to maintain the same API
export { formatTimeForDisplay, formatDayForDisplay };
