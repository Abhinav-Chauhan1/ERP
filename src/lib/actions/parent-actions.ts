"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  createCalendarEventFromMeeting
} from "../services/meeting-calendar-integration";

/**
 * Get the current parent
 */
async function getCurrentParent() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    return null;
  }
  
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  return { parent, dbUser };
}

/**
 * Get parent's children information
 */
export async function getParentChildren() {
  const result = await getCurrentParent();
  
  if (!result) {
    redirect("/login");
  }
  
  const { parent, dbUser } = result;
  
  if (!parent) {
    redirect("/login");
  }
  
  // Get all children of this parent
  const parentChildren = await db.studentParent.findMany({
    where: {
      parentId: parent.id
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
            orderBy: {
              enrollDate: 'desc'
            },
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
  
  const { parent, dbUser } = result;
  
  // Get all children of this parent
  const parentChildren = await db.studentParent.findMany({
    where: {
      parentId: parent.id
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
            orderBy: {
              enrollDate: 'desc'
            },
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
  
  // Get upcoming meetings
  const upcomingMeetings = await db.parentMeeting.findMany({
    where: {
      parentId: parent.id,
      scheduledDate: {
        gte: new Date()
      }
    },
    orderBy: {
      scheduledDate: 'asc'
    },
    take: 3,
    include: {
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });
  
  // Get recent announcements
  const recentAnnouncements = await db.announcement.findMany({
    where: {
      targetAudience: {
        has: "PARENT"
      },
      isActive: true,
      startDate: {
        lte: new Date()
      },
      OR: [
        {
          endDate: {
            gte: new Date()
          }
        },
        {
          endDate: null
        }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5,
    include: {
      publisher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });
  
  // Get upcoming fee payments
  const studentIds = children.map(child => child.id);
  
  // Get fee payments for all children
  const feePayments = await db.feePayment.findMany({
    where: {
      studentId: {
        in: studentIds
      }
    },
    orderBy: {
      paymentDate: 'desc'
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });
  
  // Get attendance for all children in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const attendanceRecords = await db.studentAttendance.findMany({
    where: {
      studentId: {
        in: studentIds
      },
      date: {
        gte: thirtyDaysAgo
      }
    },
    orderBy: {
      date: 'desc'
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });
  
  // Calculate attendance stats for each child
  const attendanceStats = studentIds.map(studentId => {
    const studentAttendance = attendanceRecords.filter(record => record.studentId === studentId);
    const totalDays = studentAttendance.length;
    const presentDays = studentAttendance.filter(record => record.status === "PRESENT").length;
    const absentDays = studentAttendance.filter(record => record.status === "ABSENT").length;
    const lateDays = studentAttendance.filter(record => record.status === "LATE").length;
    
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
 * Schedule a parent-teacher meeting
 */
export async function scheduleParentTeacherMeeting(teacherId: string, scheduledDate: Date, title: string, description?: string) {
  const result = await getCurrentParent();
  
  if (!result || !result.parent) {
    return { success: false, message: "Authentication required" };
  }
  
  try {
    const { parent } = result;
    const user = await currentUser();
    const userId = user?.id || 'system';
    
    // Validate if the teacher exists
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: true
      }
    });
    
    if (!teacher) {
      return { success: false, message: "Teacher not found" };
    }
    
    // Create the meeting
    const meeting = await db.parentMeeting.create({
      data: {
        parentId: parent.id,
        teacherId,
        title,
        description,
        scheduledDate,
        status: "REQUESTED",
        duration: 30 // Default 30 minutes
      },
      include: {
        parent: {
          include: {
            user: true
          }
        },
        teacher: {
          include: {
            user: true
          }
        }
      }
    });

    // Create calendar event for the meeting
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
  
  // Verify this is parent's child
  const isParentChild = await db.studentParent.findFirst({
    where: {
      parentId: result.parent.id,
      studentId
    }
  });
  
  if (!isParentChild) {
    redirect("/parent");
  }
  
  // Get student's exam results
  const examResults = await db.examResult.findMany({
    where: {
      studentId
    },
    include: {
      exam: {
        include: {
          subject: true,
          examType: true
        }
      }
    },
    orderBy: {
      exam: {
        examDate: 'desc'
      }
    }
  });
  
  // Get student's assignments
  const assignments = await db.assignmentSubmission.findMany({
    where: {
      studentId
    },
    include: {
      assignment: true
    },
    orderBy: {
      assignment: {
        dueDate: 'desc'
      }
    }
  });
  
  // Get student's report cards
  const reportCards = await db.reportCard.findMany({
    where: {
      studentId
    },
    include: {
      term: {
        include: {
          academicYear: true
        }
      }
    },
    orderBy: {
      term: {
        startDate: 'desc'
      }
    }
  });
  
  // Calculate performance stats
  const totalExams = examResults.length;
  let totalMarks = 0;
  let obtainedMarks = 0;
  
  examResults.forEach(result => {
    totalMarks += result.exam.totalMarks;
    obtainedMarks += result.marks;
  });
  
  const overallPercentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
  
  // Get grade based on percentage
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
      totalExams,
      totalMarks,
      obtainedMarks,
      overallPercentage,
      grade
    }
  };
}
