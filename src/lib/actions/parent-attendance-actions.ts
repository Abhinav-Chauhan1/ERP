"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

/**
 * Get attendance records for a specific child within a date range
 */
export async function getChildAttendance(
  childId: string, 
  startDate: Date, 
  endDate: Date
) {
  // Verify the current user is a parent
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
  
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  if (!parent) {
    redirect("/login");
  }
  
  // Verify the child belongs to this parent
  const parentChild = await db.studentParent.findFirst({
    where: {
      parentId: parent.id,
      studentId: childId
    }
  });
  
  if (!parentChild) {
    redirect("/parent");
  }
  
  // Get attendance records for this child within the date range
  const attendanceRecords = await db.studentAttendance.findMany({
    where: {
      studentId: childId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      section: true
    },
    orderBy: {
      date: 'asc'
    }
  });
  
  return attendanceRecords;
}

/**
 * Get attendance summary for a specific child
 */
export async function getChildAttendanceSummary(childId: string) {
  // Get attendance for the current academic year
  const currentDate = new Date();
  const academicYearStart = new Date(currentDate.getFullYear(), 6, 1); // July 1st of current year
  const academicYearEnd = new Date(currentDate.getFullYear() + 1, 5, 30); // June 30th of next year
  
  if (currentDate < academicYearStart) {
    // If we're before July 1st, use the previous academic year
    academicYearStart.setFullYear(academicYearStart.getFullYear() - 1);
    academicYearEnd.setFullYear(academicYearEnd.getFullYear() - 1);
  }
  
  const attendanceRecords = await getChildAttendance(childId, academicYearStart, academicYearEnd);
  
  // Calculate statistics
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(record => record.status === "PRESENT").length;
  const absentDays = attendanceRecords.filter(record => record.status === "ABSENT").length;
  const lateDays = attendanceRecords.filter(record => record.status === "LATE").length;
  const leaveDays = attendanceRecords.filter(record => record.status === "LEAVE").length;
  
  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
  
  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    leaveDays,
    attendancePercentage
  };
}

/**
 * Get attendance summary statistics for all children of a parent
 */
export async function getChildrenAttendanceSummary() {
  // Verify the current user is a parent
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
  
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });

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
              lastName: true
            }
          }
        }
      }
    }
  });
  
  // Calculate attendance stats for each child
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const attendanceStats = await Promise.all(
    parentChildren.map(async (pc) => {
      const attendanceRecords = await db.studentAttendance.findMany({
        where: {
          studentId: pc.student.id,
          date: {
            gte: thirtyDaysAgo
          }
        }
      });
      
      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(record => record.status === "PRESENT").length;
      const absentDays = attendanceRecords.filter(record => record.status === "ABSENT").length;
      const lateDays = attendanceRecords.filter(record => record.status === "LATE").length;
      
      return {
        studentId: pc.student.id,
        studentName: `${pc.student.user.firstName} ${pc.student.user.lastName}`,
        isPrimary: pc.isPrimary,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage: totalDays > 0 ? (presentDays / totalDays) * 100 : 0
      };
    })
  );
  
  return attendanceStats;
}
