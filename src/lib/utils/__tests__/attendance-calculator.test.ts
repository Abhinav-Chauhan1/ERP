/**
 * Tests for attendance calculation utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateAttendanceFromRecords, 
  formatAttendanceForDisplay,
  getAttendanceSummary,
  LOW_ATTENDANCE_THRESHOLD 
} from '../attendance-calculator';
import { AttendanceStatus } from '@prisma/client';

describe('Attendance Calculator', () => {
  describe('calculateAttendanceFromRecords', () => {
    it('should return zero values for empty records', () => {
      const result = calculateAttendanceFromRecords([]);
      
      expect(result.percentage).toBe(0);
      expect(result.daysPresent).toBe(0);
      expect(result.totalDays).toBe(0);
      expect(result.daysAbsent).toBe(0);
      expect(result.isLowAttendance).toBe(false);
    });

    it('should calculate 100% attendance for all present days', () => {
      const records = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
      ];

      const result = calculateAttendanceFromRecords(records);

      expect(result.percentage).toBe(100);
      expect(result.daysPresent).toBe(5);
      expect(result.totalDays).toBe(5);
      expect(result.daysAbsent).toBe(0);
      expect(result.isLowAttendance).toBe(false);
    });

    it('should calculate correct percentage with mixed attendance', () => {
      const records = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT },
      ];

      const result = calculateAttendanceFromRecords(records);

      expect(result.percentage).toBe(60); // 3 present out of 5 = 60%
      expect(result.daysPresent).toBe(3);
      expect(result.totalDays).toBe(5);
      expect(result.daysAbsent).toBe(2);
      expect(result.isLowAttendance).toBe(true); // Below 75% threshold
    });

    it('should count LATE as present', () => {
      const records = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.LATE },
        { status: AttendanceStatus.LATE },
        { status: AttendanceStatus.PRESENT },
      ];

      const result = calculateAttendanceFromRecords(records);

      expect(result.percentage).toBe(100); // LATE counts as present
      expect(result.daysPresent).toBe(2);
      expect(result.daysLate).toBe(2);
      expect(result.totalDays).toBe(4);
    });

    it('should count HALF_DAY as 0.5 days', () => {
      const records = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.HALF_DAY },
        { status: AttendanceStatus.HALF_DAY },
        { status: AttendanceStatus.PRESENT },
      ];

      const result = calculateAttendanceFromRecords(records);

      // 2 full days + 2 half days (1 full day equivalent) = 3 out of 4 = 75%
      expect(result.percentage).toBe(75);
      expect(result.daysPresent).toBe(2);
      expect(result.daysHalfDay).toBe(2);
      expect(result.totalDays).toBe(4);
    });

    it('should count LEAVE as present (excused absence)', () => {
      const records = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.LEAVE },
        { status: AttendanceStatus.LEAVE },
        { status: AttendanceStatus.PRESENT },
      ];

      const result = calculateAttendanceFromRecords(records);

      expect(result.percentage).toBe(100); // LEAVE counts as present
      expect(result.daysPresent).toBe(2);
      expect(result.daysLeave).toBe(2);
      expect(result.totalDays).toBe(4);
    });

    it('should correctly identify low attendance', () => {
      const records = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT },
        { status: AttendanceStatus.ABSENT },
        { status: AttendanceStatus.ABSENT },
      ];

      const result = calculateAttendanceFromRecords(records);

      expect(result.percentage).toBe(25); // 1 out of 4 = 25%
      expect(result.isLowAttendance).toBe(true);
    });

    it('should use custom low attendance threshold', () => {
      const records = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT },
        { status: AttendanceStatus.ABSENT },
      ];

      const result = calculateAttendanceFromRecords(records, 60);

      expect(result.percentage).toBe(50); // 2 out of 4 = 50%
      expect(result.isLowAttendance).toBe(true); // Below 60% threshold
    });

    it('should not flag as low attendance when at threshold', () => {
      const records = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT },
      ];

      const result = calculateAttendanceFromRecords(records, 75);

      expect(result.percentage).toBe(75); // Exactly at threshold
      expect(result.isLowAttendance).toBe(false); // Not below threshold
    });

    it('should round percentage to 2 decimal places', () => {
      const records = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT },
      ];

      const result = calculateAttendanceFromRecords(records);

      // 2 out of 3 = 66.666...%
      expect(result.percentage).toBe(66.67);
    });
  });

  describe('formatAttendanceForDisplay', () => {
    it('should return N/A for zero total days', () => {
      const attendanceData = {
        percentage: 0,
        daysPresent: 0,
        totalDays: 0,
        daysAbsent: 0,
        daysLate: 0,
        daysHalfDay: 0,
        daysLeave: 0,
        isLowAttendance: false,
      };

      const result = formatAttendanceForDisplay(attendanceData);
      expect(result).toBe('N/A');
    });

    it('should format attendance correctly', () => {
      const attendanceData = {
        percentage: 85.50,
        daysPresent: 171,
        totalDays: 200,
        daysAbsent: 29,
        daysLate: 0,
        daysHalfDay: 0,
        daysLeave: 0,
        isLowAttendance: false,
      };

      const result = formatAttendanceForDisplay(attendanceData);
      expect(result).toBe('85.50% (171/200 days)');
    });

    it('should format with 2 decimal places', () => {
      const attendanceData = {
        percentage: 66.67,
        daysPresent: 2,
        totalDays: 3,
        daysAbsent: 1,
        daysLate: 0,
        daysHalfDay: 0,
        daysLeave: 0,
        isLowAttendance: false,
      };

      const result = formatAttendanceForDisplay(attendanceData);
      expect(result).toBe('66.67% (2/3 days)');
    });
  });

  describe('getAttendanceSummary', () => {
    it('should return no data message for zero total days', () => {
      const attendanceData = {
        percentage: 0,
        daysPresent: 0,
        totalDays: 0,
        daysAbsent: 0,
        daysLate: 0,
        daysHalfDay: 0,
        daysLeave: 0,
        isLowAttendance: false,
      };

      const result = getAttendanceSummary(attendanceData);
      expect(result).toBe('No attendance data available');
    });

    it('should include basic present and absent days', () => {
      const attendanceData = {
        percentage: 80,
        daysPresent: 8,
        totalDays: 10,
        daysAbsent: 2,
        daysLate: 0,
        daysHalfDay: 0,
        daysLeave: 0,
        isLowAttendance: false,
      };

      const result = getAttendanceSummary(attendanceData);
      expect(result).toContain('Present: 8 days');
      expect(result).toContain('Absent: 2 days');
      expect(result).toContain('80.00% attendance');
    });

    it('should include late days when present', () => {
      const attendanceData = {
        percentage: 90,
        daysPresent: 7,
        totalDays: 10,
        daysAbsent: 1,
        daysLate: 2,
        daysHalfDay: 0,
        daysLeave: 0,
        isLowAttendance: false,
      };

      const result = getAttendanceSummary(attendanceData);
      expect(result).toContain('Late: 2 days');
    });

    it('should include half days when present', () => {
      const attendanceData = {
        percentage: 85,
        daysPresent: 7,
        totalDays: 10,
        daysAbsent: 1,
        daysLate: 0,
        daysHalfDay: 2,
        daysLeave: 0,
        isLowAttendance: false,
      };

      const result = getAttendanceSummary(attendanceData);
      expect(result).toContain('Half Day: 2 days');
    });

    it('should not include zero values', () => {
      const attendanceData = {
        percentage: 100,
        daysPresent: 10,
        totalDays: 10,
        daysAbsent: 0,
        daysLate: 0,
        daysHalfDay: 0,
        daysLeave: 0,
        isLowAttendance: false,
      };

      const result = getAttendanceSummary(attendanceData);
      expect(result).not.toContain('Late:');
      expect(result).not.toContain('Half Day:');
    });
  });

  describe('LOW_ATTENDANCE_THRESHOLD constant', () => {
    it('should be set to 75', () => {
      expect(LOW_ATTENDANCE_THRESHOLD).toBe(75);
    });
  });
});
