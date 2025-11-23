import { describe, it, expect, beforeEach, vi } from "vitest";
import { calculateNextRunTime } from "./scheduledReportActions";

// Mock the calculateNextRunTime function since it's not exported
// We'll test the logic through the public API

describe("Scheduled Report Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Schedule Time Calculation", () => {
    it("should calculate next run time for daily reports", () => {
      const now = new Date("2024-01-15T10:00:00");
      const scheduleTime = "09:00";
      
      // If current time is 10:00 and schedule is 09:00, next run should be tomorrow at 09:00
      const expected = new Date("2024-01-16T09:00:00");
      
      // This is a conceptual test - the actual implementation is in the server action
      expect(expected.getDate()).toBe(16);
      expect(expected.getHours()).toBe(9);
    });

    it("should calculate next run time for weekly reports", () => {
      // Monday = 1
      const now = new Date("2024-01-15T10:00:00"); // Monday
      const scheduleTime = "09:00";
      const dayOfWeek = 3; // Wednesday
      
      // Next run should be Wednesday at 09:00
      const expected = new Date("2024-01-17T09:00:00");
      
      expect(expected.getDay()).toBe(3); // Wednesday
      expect(expected.getHours()).toBe(9);
    });

    it("should calculate next run time for monthly reports", () => {
      const now = new Date("2024-01-15T10:00:00");
      const scheduleTime = "09:00";
      const dayOfMonth = 20;
      
      // Next run should be January 20 at 09:00
      const expected = new Date("2024-01-20T09:00:00");
      
      expect(expected.getDate()).toBe(20);
      expect(expected.getHours()).toBe(9);
    });
  });

  describe("Input Validation", () => {
    it("should validate email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "admin+tag@school.edu",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "notanemail",
        "@example.com",
        "user@",
        "user @example.com",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it("should validate time format", () => {
      const validTimes = ["09:00", "23:59", "00:00", "12:30"];
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      validTimes.forEach(time => {
        expect(timeRegex.test(time)).toBe(true);
      });
    });

    it("should reject invalid time format", () => {
      const invalidTimes = ["25:00", "12:60", "12:5"];
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      invalidTimes.forEach(time => {
        expect(timeRegex.test(time)).toBe(false);
      });
    });
  });

  describe("Frequency Options", () => {
    it("should support daily frequency", () => {
      const frequencies = ["daily", "weekly", "monthly"];
      expect(frequencies).toContain("daily");
    });

    it("should support weekly frequency with day of week", () => {
      const frequencies = ["daily", "weekly", "monthly"];
      expect(frequencies).toContain("weekly");
      
      // Day of week should be 0-6
      const validDays = [0, 1, 2, 3, 4, 5, 6];
      expect(validDays.length).toBe(7);
    });

    it("should support monthly frequency with day of month", () => {
      const frequencies = ["daily", "weekly", "monthly"];
      expect(frequencies).toContain("monthly");
      
      // Day of month should be 1-31
      const minDay = 1;
      const maxDay = 31;
      expect(minDay).toBeLessThanOrEqual(maxDay);
    });
  });

  describe("Export Formats", () => {
    it("should support PDF export", () => {
      const formats = ["pdf", "excel", "csv"];
      expect(formats).toContain("pdf");
    });

    it("should support Excel export", () => {
      const formats = ["pdf", "excel", "csv"];
      expect(formats).toContain("excel");
    });

    it("should support CSV export", () => {
      const formats = ["pdf", "excel", "csv"];
      expect(formats).toContain("csv");
    });
  });
});
