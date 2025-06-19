"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserRole, AttendanceStatus, LeaveStatus } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, subMonths, addDays } from "date-fns";

// Schema for leave application
const leaveApplicationSchema = z.object({
  fromDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date"
  }),
  toDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date"
  }),
  reason: z.string().min(3, { message: "Reason must be at least 3 characters" }).max(500),
  attachments: z.string().optional(),
});

type LeaveApplicationValues = z.infer<typeof leaveApplicationSchema>;

/**
 * Get the current student
 */
async function getCurrentStudent() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.STUDENT) {
    return null;
  }
  
  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id
    },
    include: {
      enrollments: {
        orderBy: {
          enrollDate: 'desc'
        },
        take: 1,
        include: {
          class: {
            include: {
              academicYear: true
            }
          },
          section: true
        }
      }
    }
  });

  return student;
}

/**
 * Get student attendance report for a specific month
 */
export async function getStudentAttendanceReport(month: Date = new Date()) {
  const student = await getCurrentStudent();
  
  if (!student) {
    redirect("/login");
  }
  
  const currentEnrollment = student.enrollments[0];
  
  if (!currentEnrollment) {
    return {
      student,
      attendanceRecords: [],
      statistics: {
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        leaveDays: 0,
        halfDays: 0,
        totalDays: 0,
        attendancePercentage: 0
      },
      currentClass: "N/A",
      currentSection: "N/A"
    };
  }
  
  // Get start and end dates for the month
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);
  
  // Get attendance records for current month
  const attendanceRecords = await db.studentAttendance.findMany({
    where: {
      studentId: student.id,
      sectionId: currentEnrollment.sectionId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      date: 'asc'
    }
  });
  
  // Get all dates in the month
  const currentDate = new Date();
  const daysInMonth = eachDayOfInterval({ 
    start: startDate, 
    end: endDate > currentDate ? currentDate : endDate 
  });
  
  // Filter out weekends to get school days
  const totalSchoolDays = daysInMonth.filter(
    date => date.getDay() !== 0 && date.getDay() !== 6
  ).length;
  
  // Calculate attendance statistics
  const presentDays = attendanceRecords.filter(record => record.status === AttendanceStatus.PRESENT).length;
  const absentDays = attendanceRecords.filter(record => record.status === AttendanceStatus.ABSENT).length;
  const lateDays = attendanceRecords.filter(record => record.status === AttendanceStatus.LATE).length;
  const leaveDays = attendanceRecords.filter(record => record.status === AttendanceStatus.LEAVE).length;
  const halfDays = attendanceRecords.filter(record => record.status === AttendanceStatus.HALF_DAY).length;
  
  const attendancePercentage = totalSchoolDays > 0 
    ? Math.round((presentDays / totalSchoolDays) * 100) 
    : 0;
  
  // Format attendance data for the calendar component
  const formattedAttendanceData = attendanceRecords.map(record => ({
    date: format(new Date(record.date), 'yyyy-MM-dd'),
    status: record.status
  }));
  
  return {
    student,
    attendanceRecords: formattedAttendanceData,
    statistics: {
      presentDays,
      absentDays,
      lateDays,
      leaveDays,
      halfDays,
      totalDays: totalSchoolDays,
      attendancePercentage
    },
    currentClass: currentEnrollment.class.name,
    currentSection: currentEnrollment.section.name
  };
}

/**
 * Get attendance trends for the past 6 months
 */
export async function getAttendanceTrends() {
  const student = await getCurrentStudent();
  
  if (!student) {
    redirect("/login");
  }
  
  const currentDate = new Date();
  const monthlyData = [];
  
  // Calculate for last 6 months
  for (let i = 6; i >= 0; i--) {
    const monthDate = subMonths(currentDate, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthName = format(monthDate, 'MMM');
    
    // Only count days up to current date
    const endDateToUse = monthEnd > currentDate ? currentDate : monthEnd;
    
    // Count school days in month
    const schoolDaysInMonth = eachDayOfInterval({ 
      start: monthStart, 
      end: endDateToUse 
    }).filter(date => date.getDay() !== 0 && date.getDay() !== 6).length;
    
    if (schoolDaysInMonth === 0) {
      // Skip months with no school days
      continue;
    }
    
    // Get attendance records
    const records = await db.studentAttendance.findMany({
      where: {
        studentId: student.id,
        date: {
          gte: monthStart,
          lte: endDateToUse
        }
      }
    });
    
    const presentDays = records.filter(record => record.status === AttendanceStatus.PRESENT).length;
    const percentage = Math.round((presentDays / schoolDaysInMonth) * 100);
    
    monthlyData.push({
      month: monthName,
      percentage
    });
  }
  
  return monthlyData;
}

/**
 * Get student's leave applications
 */
export async function getStudentLeaveApplications() {
  const student = await getCurrentStudent();
  
  if (!student) {
    redirect("/login");
  }
  
  const leaveApplications = await db.leaveApplication.findMany({
    where: {
      applicantId: student.id,
      applicantType: "STUDENT"
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return leaveApplications;
}

/**
 * Submit a leave application
 */
export async function submitLeaveApplication(values: LeaveApplicationValues) {
  const student = await getCurrentStudent();
  
  if (!student) {
    return { success: false, message: "Authentication required" };
  }
  
  try {
    // Validate data
    const validated = leaveApplicationSchema.parse(values);
    
    // Ensure fromDate is not after toDate
    const fromDate = new Date(validated.fromDate);
    const toDate = new Date(validated.toDate);
    
    if (fromDate > toDate) {
      return {
        success: false,
        message: "Start date cannot be after end date"
      };
    }
    
    // Check if we have any overlapping leave applications
    const existingLeave = await db.leaveApplication.findFirst({
      where: {
        applicantId: student.id,
        applicantType: "STUDENT",
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        OR: [
          {
            // New leave starts during an existing leave
            fromDate: { lte: toDate },
            toDate: { gte: fromDate }
          },
          {
            // New leave ends during an existing leave
            fromDate: { lte: toDate },
            toDate: { gte: fromDate }
          }
        ]
      }
    });
    
    if (existingLeave) {
      return {
        success: false,
        message: "You already have an overlapping leave application"
      };
    }
    
    // Create leave application
    await db.leaveApplication.create({
      data: {
        applicantId: student.id,
        applicantType: "STUDENT",
        fromDate,
        toDate,
        reason: validated.reason,
        attachments: validated.attachments,
        status: LeaveStatus.PENDING
      }
    });
    
    revalidatePath("/student/attendance/leave");
    return { success: true, message: "Leave application submitted successfully" };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message || "Invalid data provided"
      };
    }
    
    return { 
      success: false, 
      message: "Failed to submit leave application" 
    };
  }
}

/**
 * Cancel a leave application
 */
export async function cancelLeaveApplication(id: string) {
  const student = await getCurrentStudent();
  
  if (!student) {
    return { success: false, message: "Authentication required" };
  }
  
  try {
    // Find the leave application
    const leaveApplication = await db.leaveApplication.findUnique({
      where: { id }
    });
    
    if (!leaveApplication) {
      return { success: false, message: "Leave application not found" };
    }
    
    // Ensure it belongs to the student
    if (leaveApplication.applicantId !== student.id || leaveApplication.applicantType !== "STUDENT") {
      return { success: false, message: "You can only cancel your own leave applications" };
    }
    
    // Ensure it's in a cancellable state
    if (leaveApplication.status !== LeaveStatus.PENDING) {
      return { success: false, message: "Only pending applications can be cancelled" };
    }
    
    // Cancel the application
    await db.leaveApplication.update({
      where: { id },
      data: { status: LeaveStatus.CANCELLED }
    });
    
    revalidatePath("/student/attendance/leave");
    return { success: true, message: "Leave application cancelled successfully" };
    
  } catch (error) {
    return { 
      success: false, 
      message: "Failed to cancel leave application" 
    };
  }
}
