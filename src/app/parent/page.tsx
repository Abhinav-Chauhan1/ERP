import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { ParentHeader } from "@/components/parent/parent-header";
import { ChildrenCards } from "@/components/parent/children-cards";
import { AttendanceSummary } from "@/components/parent/attendance-summary";
import { UpcomingMeetings } from "@/components/parent/upcoming-meetings";
import { FeePaymentSummary } from "@/components/parent/fee-payment-summary";
import { RecentAnnouncements } from "@/components/parent/recent-announcements";

export default async function ParentDashboard() {
  // Get current user directly from Clerk
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }
  
  // Check if parent record exists
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });
  
  if (!parent) {
    // Handle case where user has PARENT role but no parent record
    // Could redirect to an error page or show a message
    return (
      <div className="h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Account Setup Incomplete</h1>
        <p className="text-gray-700">
          Your parent account has been created but needs to be properly set up.
          Please contact the school administration to complete your profile.
        </p>
      </div>
    );
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
  
  const children = parentChildren.map(pc => ({
    ...pc.student,
    isPrimary: pc.isPrimary
  }));
  
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
  
  // Get fee payments for all children
  const studentIds = children.map(child => child.id);
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
  
  return (
    <div className="h-full p-6 space-y-6">
      <ParentHeader parent={{ user: dbUser }} children={children} />
      
      <ChildrenCards children={children} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AttendanceSummary attendanceStats={attendanceStats} children={children} />
          <FeePaymentSummary payments={feePayments} children={children} />
        </div>
        <div className="space-y-6">
          <UpcomingMeetings meetings={upcomingMeetings} />
          <RecentAnnouncements announcements={recentAnnouncements} />
        </div>
      </div>
    </div>
  );
}
