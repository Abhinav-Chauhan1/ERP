"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import {
  createCalendarEventFromMeeting
} from "../services/meeting-calendar-integration";

/**
 * Get the current parent, scoped to their active school.
 * Exported so parent-children-actions.ts can import it instead of duplicating.
 */
export async function getCurrentParent() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });

  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    return null;
  }

  const { schoolId } = await requireSchoolAccess();
  if (!schoolId) return null;

  const parent = await db.parent.findFirst({
    where: {
      userId: dbUser.id,
      schoolId // Enforce tenant isolation
    }
  });

  if (!parent) {
    return null;
  }

  return { parent, dbUser, schoolId };
}

/**
 * Get parent's children information
 */
export async function getParentChildren() {
  const result = await getCurrentParent();

  if (!result) {
    redirect("/login");
  }

  const { parent, dbUser, schoolId } = result;

  const parentChildren = await db.studentParent.findMany({
    where: {
      parentId: parent.id,
      schoolId
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            }
          },
          enrollments: {
            orderBy: { enrollDate: 'desc' },
            take: 1,
            include: {
              class: true,
              section: true
            }
          }
        }
      }
    }
  });

  return {
    parent,
    user: dbUser,
    children: parentChildren.map(pc => ({
      ...pc.student,
      isPrimary: pc.isPrimary
    }))
  };
}

/**
 * Get parent dashboard data
 */
export async function getParentDashboardData() {
  const result = await getCurrentParent();

  if (!result || !result.parent || !result.dbUser) {
    redirect("/login");
  }

  const { parent, dbUser, schoolId } = result;

  // Get all children of this parent — scoped to school
  const parentChildren = await db.studentParent.findMany({
    where: {
      parentId: parent.id,
      schoolId
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            }
          },
          enrollments: {
            orderBy: { enrollDate: 'desc' },
            take: 1,
            include: {
              class: true,
              section: true
            }
          }
        }
      }
    }
  });

  const children = parentChildren.map(pc => ({
    ...pc.student,
    isPrimary: pc.isPrimary
  }));

  if (children.length === 0) {
    redirect("/login");
  }

  const studentIds = children.map(child => child.id);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Reduced from 90 to 30 days

  // Fetch all independent queries in parallel
  const [upcomingMeetings, recentAnnouncements, feePayments, attendanceRecords] =
    await Promise.all([
      db.parentMeeting.findMany({
        where: {
          parentId: parent.id,
          schoolId,
          scheduledDate: { gte: new Date() }
        },
        orderBy: { scheduledDate: 'asc' },
        take: 5, // Increased from 3 for better UX
        select: {
          id: true,
          title: true,
          description: true,
          scheduledDate: true,
          status: true,
          duration: true,
          teacher: {
            select: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        }
      }),

      db.announcement.findMany({
        where: {
          schoolId,
          targetAudience: { has: "PARENT" },
          isActive: true,
          startDate: { lte: new Date() },
          OR: [
            { endDate: { gte: new Date() } },
            { endDate: null }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          content: true,
          startDate: true,
          createdAt: true,
          publisher: {
            select: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        }
      }),

      db.feePayment.findMany({
        where: {
          studentId: { in: studentIds },
          schoolId
        },
        orderBy: { paymentDate: 'desc' },
        take: 50, // Add limit for performance
        select: {
          id: true,
          amount: true,
          balance: true,
          status: true,
          paymentDate: true,
          paymentMethod: true,
          student: {
            select: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        }
      }),

      db.studentAttendance.findMany({
        where: {
          studentId: { in: studentIds },
          schoolId,
          date: { gte: thirtyDaysAgo }
        },
        orderBy: { date: 'desc' },
        take: 100, // Limit total records (30 days * 3 children max)
        select: {
          id: true,
          studentId: true,
          date: true,
          status: true,
          student: {
            select: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        }
      })
    ]);

  // Calculate attendance stats per child
  const attendanceStats = studentIds.map(studentId => {
    const studentAttendance = attendanceRecords.filter(r => r.studentId === studentId);
    const totalDays = studentAttendance.length;
    const presentDays = studentAttendance.filter(r => r.status === "PRESENT").length;
    const absentDays = studentAttendance.filter(r => r.status === "ABSENT").length;
    const lateDays = studentAttendance.filter(r => r.status === "LATE").length;

    return {
      studentId,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendancePercentage: totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    };
  });

  return {
    parent,
    user: dbUser,
    children,
    upcomingMeetings,
    recentAnnouncements,
    feePayments,
    attendanceStats
  };
}

/**
 * Schedule a parent-teacher meeting.
 * schoolId is derived from the session — never accepted from the client.
 */
export async function scheduleParentTeacherMeeting(
  teacherId: string,
  scheduledDate: Date,
  title: string,
  description?: string
) {
  const result = await getCurrentParent();

  if (!result || !result.parent) {
    return { success: false, message: "Authentication required" };
  }

  try {
    const { parent, schoolId } = result;
    const user = await currentUser();
    const userId = user?.id || 'system';

    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true }
    });

    if (!teacher) {
      return { success: false, message: "Teacher not found" };
    }

    // Verify teacher belongs to the same school
    if (teacher.schoolId !== schoolId) {
      return { success: false, message: "Teacher not found" };
    }

    const meeting = await db.parentMeeting.create({
      data: {
        parentId: parent.id,
        teacherId,
        title,
        description,
        scheduledDate,
        status: "REQUESTED",
        duration: 30,
        schoolId,
      },
      include: {
        parent: { include: { user: true } },
        teacher: { include: { user: true } }
      }
    });

    await createCalendarEventFromMeeting(meeting as any, userId);

    revalidatePath("/parent/meetings");
    return { success: true, message: "Meeting scheduled successfully" };

  } catch (error) {
    console.error("Error scheduling meeting:", error);
    return { success: false, message: "Failed to schedule meeting" };
  }
}

/**
 * Get child's academic performance
 */
export async function getChildAcademicPerformance(studentId: string) {
  const result = await getCurrentParent();

  if (!result || !result.parent) {
    redirect("/login");
  }

  const { parent, schoolId } = result;

  // Verify this child belongs to this parent AND this school
  const isParentChild = await db.studentParent.findFirst({
    where: {
      parentId: parent.id,
      studentId,
      schoolId
    }
  });

  if (!isParentChild) {
    redirect("/parent");
  }

  // Fetch all academic data in parallel, all scoped to schoolId
  const [examResults, assignments, reportCards] = await Promise.all([
    db.examResult.findMany({
      where: {
        studentId,
        schoolId
      },
      include: {
        exam: {
          include: {
            subject: true,
            examType: true
          }
        }
      },
      orderBy: { exam: { examDate: 'desc' } }
    }),

    db.assignmentSubmission.findMany({
      where: {
        studentId,
        schoolId
      },
      include: { assignment: true },
      orderBy: { assignment: { dueDate: 'desc' } }
    }),

    db.reportCard.findMany({
      where: {
        studentId,
        schoolId
      },
      include: {
        term: {
          include: { academicYear: true }
        }
      },
      orderBy: { term: { startDate: 'desc' } }
    })
  ]);

  // Calculate performance stats
  let totalMarks = 0;
  let obtainedMarks = 0;

  examResults.forEach(result => {
    totalMarks += result.exam.totalMarks;
    obtainedMarks += result.marks;
  });

  const overallPercentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

  let grade = "N/A";
  if (overallPercentage >= 90) grade = "A+";
  else if (overallPercentage >= 80) grade = "A";
  else if (overallPercentage >= 70) grade = "B";
  else if (overallPercentage >= 60) grade = "C";
  else if (overallPercentage >= 50) grade = "D";
  else grade = "F";

  return {
    examResults,
    assignments,
    reportCards,
    statistics: {
      totalExams: examResults.length,
      totalMarks,
      obtainedMarks,
      overallPercentage,
      grade
    }
  };
}
