/**
 * Calendar Widget Actions
 * 
 * Server actions for fetching calendar events for dashboard widgets.
 * Implements role-based filtering and visibility rules.
 * 
 * Requirements: 1.2, 2.1, 3.1, 4.1, 3.4
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

/**
 * Get upcoming calendar events for admin dashboard widget
 * Admins can see all events
 */
export async function getAdminCalendarEvents(limit: number = 5) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const now = new Date();
    const events = await prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: now
        }
      },
      include: {
        category: true
      },
      orderBy: {
        startDate: 'asc'
      },
      take: limit
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Error fetching admin calendar events:", error);
    return { success: false, error: "Failed to fetch calendar events", data: [] };
  }
}

/**
 * Get upcoming calendar events for teacher dashboard widget
 * Teachers see events visible to their role
 */
export async function getTeacherCalendarEvents(limit: number = 5) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId }
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found", data: [] };
    }

    const now = new Date();
    const events = await prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: now
        },
        OR: [
          {
            visibleToRoles: {
              has: UserRole.TEACHER
            }
          },
          {
            visibleToRoles: {
              has: UserRole.ADMIN
            }
          }
        ]
      },
      include: {
        category: true
      },
      orderBy: {
        startDate: 'asc'
      },
      take: limit
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Error fetching teacher calendar events:", error);
    return { success: false, error: "Failed to fetch calendar events", data: [] };
  }
}

/**
 * Get upcoming calendar events for student dashboard widget
 * Students see events visible to their role and their class/section
 */
export async function getStudentCalendarEvents(limit: number = 5) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    // Get student record with enrollment
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        enrollments: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            class: true,
            section: true
          }
        }
      }
    });

    if (!student || student.enrollments.length === 0) {
      return { success: false, error: "Student not found or not enrolled", data: [] };
    }

    const enrollment = student.enrollments[0];
    const classId = enrollment.classId;
    const sectionId = enrollment.sectionId;

    const now = new Date();
    const events = await prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: now
        },
        OR: [
          {
            visibleToRoles: {
              has: UserRole.STUDENT
            }
          },
          {
            visibleToClasses: {
              has: classId
            }
          },
          {
            visibleToSections: {
              has: sectionId
            }
          }
        ]
      },
      include: {
        category: true
      },
      orderBy: {
        startDate: 'asc'
      },
      take: limit
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Error fetching student calendar events:", error);
    return { success: false, error: "Failed to fetch calendar events", data: [] };
  }
}

/**
 * Get upcoming calendar events for parent dashboard widget
 * Parents see events visible to their children
 */
export async function getParentCalendarEvents(limit: number = 5) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    // Get parent record with children
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: {
        children: {
          include: {
            student: {
              include: {
                enrollments: {
                  where: {
                    status: 'ACTIVE'
                  },
                  include: {
                    class: true,
                    section: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!parent || parent.children.length === 0) {
      return { success: false, error: "Parent not found or no children", data: [] };
    }

    // Collect all class and section IDs from children
    const classIds: string[] = [];
    const sectionIds: string[] = [];

    parent.children.forEach(childRelation => {
      const child = childRelation.student;
      child.enrollments.forEach(enrollment => {
        if (enrollment.classId) classIds.push(enrollment.classId);
        if (enrollment.sectionId) sectionIds.push(enrollment.sectionId);
      });
    });

    const now = new Date();
    const events = await prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: now
        },
        OR: [
          {
            visibleToRoles: {
              has: UserRole.PARENT
            }
          },
          {
            visibleToClasses: {
              hasSome: classIds
            }
          },
          {
            visibleToSections: {
              hasSome: sectionIds
            }
          }
        ]
      },
      include: {
        category: true
      },
      orderBy: {
        startDate: 'asc'
      },
      take: limit
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Error fetching parent calendar events:", error);
    return { success: false, error: "Failed to fetch calendar events", data: [] };
  }
}
