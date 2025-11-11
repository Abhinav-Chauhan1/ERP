"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { format, startOfWeek, endOfWeek } from "date-fns";

/**
 * Get teacher profile data
 */
export async function getTeacherProfile() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get user first, then teacher record
    const user = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get teacher record with all related data
    const teacher = await db.teacher.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        user: true,
        subjects: {
          include: {
            subject: true,
          },
        },
        classes: {
          include: {
            class: {
              include: {
                sections: true,
              },
            },
          },
        },
        departments: true,
      },
    });

    if (!teacher) {
      return {
        success: false,
        error: "Teacher not found",
      };
    }

    // Get today's classes from timetable
    const today = new Date();
    const todayClasses = await db.timetableSlot.findMany({
      where: {
        subjectTeacher: {
          teacherId: teacher.id,
        },
        day: format(today, "EEEE").toUpperCase() as any,
        timetable: {
          isActive: true,
        },
      },
      include: {
        class: true,
        section: true,
        subjectTeacher: {
          include: {
            subject: true,
          },
        },
        room: true,
      },
      orderBy: {
        startTime: "asc",
      },
      take: 5,
    });

    // Calculate total teaching hours this week
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

    const weeklySlots = await db.timetableSlot.findMany({
      where: {
        subjectTeacher: {
          teacherId: teacher.id,
        },
        timetable: {
          isActive: true,
        },
      },
    });

    // Calculate total hours (assuming each slot is the difference between start and end time)
    const totalWeeklyHours = weeklySlots.reduce((total, slot) => {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    // Get pending assignments that need grading
    const pendingAssignments = await db.assignment.findMany({
      where: {
        creatorId: teacher.id,
        dueDate: {
          gte: today,
        },
        submissions: {
          some: {
            status: "SUBMITTED",
            marks: null,
          },
        },
      },
      include: {
        subject: true,
        classes: {
          include: {
            class: true,
          },
        },
        submissions: {
          where: {
            status: "SUBMITTED",
            marks: null,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 3,
    });

    // Get unique subjects taught
    const subjects = teacher.subjects.map((st) => st.subject.name);

    // Get unique classes taught
    const classes = teacher.classes.map((ct) => {
      const sections = ct.class.sections.map((s) => s.name).join(", ");
      return sections ? `${ct.class.name} (${sections})` : ct.class.name;
    });

    // Get department name
    const department = teacher.departments[0]?.name || "Not Assigned";

    // Format today's classes
    const formattedTodayClasses = todayClasses.map((slot) => {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      return {
        id: slot.id,
        className: slot.class.name,
        section: slot.section?.name || "",
        subject: slot.subjectTeacher.subject.name,
        time: `${format(startTime, "hh:mm a")} - ${format(endTime, "hh:mm a")}`,
        room: slot.room?.name || "TBA",
      };
    });

    // Format pending tasks
    const formattedPendingTasks = pendingAssignments.map((assignment) => ({
      id: assignment.id,
      title: `Grade ${assignment.title}`,
      description: assignment.classes.map((c) => c.class.name).join(", "),
      dueDate: format(assignment.dueDate, "MMM dd, yyyy"),
      priority:
        assignment.submissions.length > 10
          ? "High Priority"
          : assignment.submissions.length > 5
          ? "Medium Priority"
          : "Low Priority",
      count: assignment.submissions.length,
    }));

    return {
      success: true,
      data: {
        profile: {
          id: teacher.id,
          firstName: teacher.user.firstName,
          lastName: teacher.user.lastName,
          email: teacher.user.email,
          phone: teacher.user.phone || "Not provided",
          avatar: teacher.user.avatar,
          employeeId: teacher.employeeId,
          qualification: teacher.qualification || "Not provided",
          joinDate: format(teacher.joinDate, "MMMM dd, yyyy"),
          department: department,
          subjects: subjects,
          classes: classes,
          salary: teacher.salary,
        },
        schedule: {
          totalWeeklyHours: Math.round(totalWeeklyHours),
          todayClassesCount: todayClasses.length,
          todayClasses: formattedTodayClasses,
        },
        tasks: formattedPendingTasks,
      },
    };
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    return {
      success: false,
      error: "Failed to fetch teacher profile",
    };
  }
}
