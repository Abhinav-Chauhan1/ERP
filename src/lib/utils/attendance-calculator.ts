/**
 * Attendance Calculation Utilities for Report Cards
 * 
 * This module provides functions to calculate attendance percentages
 * and format attendance data for report cards.
 */

import { db } from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";

/**
 * Interface for attendance data returned by calculation functions
 */
export interface AttendanceData {
  percentage: number;
  daysPresent: number;
  totalDays: number;
  daysAbsent: number;
  daysLate: number;
  daysHalfDay: number;
  daysLeave: number;
  isLowAttendance: boolean;
}

/**
 * Default threshold for low attendance highlighting (in percentage)
 */
export const LOW_ATTENDANCE_THRESHOLD = 75;

/**
 * Calculate attendance percentage from StudentAttendance records
 * 
 * @param studentId - The ID of the student
 * @param termId - The ID of the term
 * @param lowAttendanceThreshold - Optional custom threshold for low attendance (default: 75%)
 * @returns AttendanceData object with calculated values
 */
export async function calculateAttendanceForTerm(
  studentId: string,
  termId: string,
  lowAttendanceThreshold: number = LOW_ATTENDANCE_THRESHOLD
): Promise<AttendanceData> {
  try {
    // Get the term dates
    const term = await db.term.findUnique({
      where: { id: termId },
      select: {
        startDate: true,
        endDate: true,
      },
    });

    if (!term) {
      throw new Error(`Term with ID ${termId} not found`);
    }

    // Fetch all attendance records for the student within the term dates
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        studentId,
        date: {
          gte: term.startDate,
          lte: term.endDate,
        },
      },
      select: {
        status: true,
      },
    });

    return calculateAttendanceFromRecords(attendanceRecords, lowAttendanceThreshold);
  } catch (error) {
    console.error("Error calculating attendance for term:", error);
    // Return default values on error
    return {
      percentage: 0,
      daysPresent: 0,
      totalDays: 0,
      daysAbsent: 0,
      daysLate: 0,
      daysHalfDay: 0,
      daysLeave: 0,
      isLowAttendance: false,
    };
  }
}

/**
 * Calculate attendance percentage from a list of attendance records
 * 
 * @param records - Array of attendance records with status
 * @param lowAttendanceThreshold - Optional custom threshold for low attendance (default: 75%)
 * @returns AttendanceData object with calculated values
 */
export function calculateAttendanceFromRecords(
  records: Array<{ status: AttendanceStatus }>,
  lowAttendanceThreshold: number = LOW_ATTENDANCE_THRESHOLD
): AttendanceData {
  const totalDays = records.length;

  if (totalDays === 0) {
    return {
      percentage: 0,
      daysPresent: 0,
      totalDays: 0,
      daysAbsent: 0,
      daysLate: 0,
      daysHalfDay: 0,
      daysLeave: 0,
      isLowAttendance: false,
    };
  }

  // Count different attendance statuses
  const daysPresent = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
  const daysAbsent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
  const daysLate = records.filter((r) => r.status === AttendanceStatus.LATE).length;
  const daysHalfDay = records.filter((r) => r.status === AttendanceStatus.HALF_DAY).length;
  const daysLeave = records.filter((r) => r.status === AttendanceStatus.LEAVE).length;

  // Calculate effective present days
  // PRESENT and LATE count as full days
  // HALF_DAY counts as 0.5 days
  // LEAVE counts as full days (excused absence)
  const effectivePresentDays = daysPresent + daysLate + (daysHalfDay * 0.5) + daysLeave;

  // Calculate percentage
  const percentage = (effectivePresentDays / totalDays) * 100;

  // Check if attendance is below threshold
  const isLowAttendance = percentage < lowAttendanceThreshold;

  return {
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    daysPresent,
    totalDays,
    daysAbsent,
    daysLate,
    daysHalfDay,
    daysLeave,
    isLowAttendance,
  };
}

/**
 * Format attendance data for display in report cards
 * 
 * @param attendanceData - The attendance data to format
 * @returns Formatted string for display (e.g., "85.50% (171/200 days)")
 */
export function formatAttendanceForDisplay(attendanceData: AttendanceData): string {
  if (attendanceData.totalDays === 0) {
    return "N/A";
  }

  return `${attendanceData.percentage.toFixed(2)}% (${attendanceData.daysPresent}/${attendanceData.totalDays} days)`;
}

/**
 * Get attendance summary text for report cards
 * 
 * @param attendanceData - The attendance data
 * @returns Human-readable summary text
 */
export function getAttendanceSummary(attendanceData: AttendanceData): string {
  if (attendanceData.totalDays === 0) {
    return "No attendance data available";
  }

  const { percentage, daysPresent, totalDays, daysAbsent, daysLate, daysHalfDay } = attendanceData;

  let summary = `Present: ${daysPresent} days, Absent: ${daysAbsent} days`;

  if (daysLate > 0) {
    summary += `, Late: ${daysLate} days`;
  }

  if (daysHalfDay > 0) {
    summary += `, Half Day: ${daysHalfDay} days`;
  }

  summary += ` (${percentage.toFixed(2)}% attendance)`;

  return summary;
}

/**
 * Batch calculate attendance for multiple students in a term
 * 
 * @param studentIds - Array of student IDs
 * @param termId - The ID of the term
 * @param lowAttendanceThreshold - Optional custom threshold for low attendance
 * @returns Map of studentId to AttendanceData
 */
export async function batchCalculateAttendance(
  studentIds: string[],
  termId: string,
  lowAttendanceThreshold: number = LOW_ATTENDANCE_THRESHOLD
): Promise<Map<string, AttendanceData>> {
  try {
    // Get the term dates
    const term = await db.term.findUnique({
      where: { id: termId },
      select: {
        startDate: true,
        endDate: true,
      },
    });

    if (!term) {
      throw new Error(`Term with ID ${termId} not found`);
    }

    // Fetch all attendance records for all students in one query
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        studentId: {
          in: studentIds,
        },
        date: {
          gte: term.startDate,
          lte: term.endDate,
        },
      },
      select: {
        studentId: true,
        status: true,
      },
    });

    // Group records by student
    const recordsByStudent = new Map<string, Array<{ status: AttendanceStatus }>>();

    for (const record of attendanceRecords) {
      if (!recordsByStudent.has(record.studentId)) {
        recordsByStudent.set(record.studentId, []);
      }
      recordsByStudent.get(record.studentId)!.push({ status: record.status });
    }

    // Calculate attendance for each student
    const attendanceMap = new Map<string, AttendanceData>();

    for (const studentId of studentIds) {
      const records = recordsByStudent.get(studentId) || [];
      const attendanceData = calculateAttendanceFromRecords(records, lowAttendanceThreshold);
      attendanceMap.set(studentId, attendanceData);
    }

    return attendanceMap;
  } catch (error) {
    console.error("Error batch calculating attendance:", error);
    // Return empty map on error
    return new Map();
  }
}
