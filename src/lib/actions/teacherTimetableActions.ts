"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { DayOfWeek } from "@prisma/client";

/**
 * Get teacher's timetable for the current active timetable
 */
export async function getTeacherTimetable() {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record for the current user
    const teacher = await db.teacher.findFirst({
      where: {
        schoolId, // Add school isolation
        user: {
          id: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get all subject-teacher relationships for this teacher
    const subjectTeachers = await db.subjectTeacher.findMany({
      where: {
        schoolId, // Add school isolation
        teacherId: teacher.id,
      },
      include: {
        subject: true,
      },
    });

    if (!subjectTeachers.length) {
      return { timetable: null, slots: [], weekdays: [], config: null };
    }

    // Get the active timetable
    const activeTimetable = await db.timetable.findFirst({
      where: {
        schoolId, // Add school isolation
        isActive: true,
      },
    });

    if (!activeTimetable) {
      return { timetable: null, slots: [], weekdays: [], config: null };
    }

    // Get timetable slots for this teacher's subject-teacher relationships
    const timetableSlots = await db.timetableSlot.findMany({
      where: {
        schoolId, // Add school isolation
        timetableId: activeTimetable.id,
        subjectTeacherId: {
          in: subjectTeachers.map(st => st.id),
        },
      },
      include: {
        class: true,
        section: true,
        room: true,
        subjectTeacher: {
          include: {
            subject: true,
          },
        },
        topic: {
          include: {
            module: true,
          },
        },
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Get timetable config for working days and periods
    const timetableConfig = await db.timetableConfig.findFirst({
      where: {
        schoolId, // Add school isolation
        isActive: true,
      },
      include: {
        periods: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Convert the slots to a more usable format for the frontend
    const formattedSlots = timetableSlots.map(slot => ({
      id: slot.id,
      day: slot.day,
      class: `${slot.class.name}${slot.section ? `-${slot.section.name}` : ''}`,
      classId: slot.classId,
      sectionId: slot.sectionId,
      subject: slot.subjectTeacher.subject.name,
      subjectId: slot.subjectTeacher.subject.id,
      timeStart: formatTime(slot.startTime),
      timeEnd: formatTime(slot.endTime),
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room?.name || "No Room Assigned",
      roomId: slot.roomId,
      type: "class", // Default type - can be expanded in the future
      // Include topic information if assigned
      topic: slot.topic ? {
        id: slot.topic.id,
        title: slot.topic.title,
        chapterNumber: slot.topic.module.chapterNumber,
        moduleTitle: slot.topic.module.title,
      } : null,
      topicId: slot.topicId,
    }));

    return {
      timetable: activeTimetable,
      slots: formattedSlots,
      weekdays: timetableConfig?.daysOfWeek || Object.values(DayOfWeek),
      config: timetableConfig,
    };
  } catch (error) {
    console.error("Failed to fetch teacher timetable:", error);
    throw new Error("Failed to fetch timetable");
  }
}

/**
 * Get teacher's timetable for a specific day
 */
export async function getTeacherDayTimetable(day: DayOfWeek) {
  try {
    const { timetable, slots, weekdays, config } = await getTeacherTimetable();

    const daySlots = slots.filter(slot => slot.day === day);

    return {
      timetable,
      slots: daySlots,
      weekdays,
      config,
      selectedDay: day,
    };
  } catch (error) {
    console.error(`Failed to fetch teacher timetable for ${day}:`, error);
    throw new Error("Failed to fetch day timetable");
  }
}

/**
 * Format a datetime to a time string
 */
function formatTime(dateTime: Date): string {
  return new Date(dateTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Extract time slots from timetable configuration
 */
export async function getTimeSlots() {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get active timetable config
    const timetableConfig = await db.timetableConfig.findFirst({
      where: {
        schoolId, // Add school isolation
        isActive: true,
      },
      include: {
        periods: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!timetableConfig) {
      return [];
    }

    // Convert periods to time slots
    return timetableConfig.periods.map(period => ({
      id: period.id,
      name: period.name,
      timeStart: formatTime(period.startTime),
      timeEnd: formatTime(period.endTime),
      startTime: period.startTime,
      endTime: period.endTime,
    }));
  } catch (error) {
    console.error("Failed to fetch time slots:", error);
    throw new Error("Failed to fetch time slots");
  }
}
