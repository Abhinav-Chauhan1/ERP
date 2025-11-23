import { describe, it, expect } from "vitest";
import { calculateOverdueFine, isBookOverdue, getDaysOverdue } from "./library";

describe("Library Utility Functions", () => {
  describe("calculateOverdueFine", () => {
    it("should return 0 for on-time returns", () => {
      const issueDate = new Date("2024-01-01");
      const dueDate = new Date("2024-01-10");
      const returnDate = new Date("2024-01-08");
      const dailyRate = 5;

      const fine = calculateOverdueFine(issueDate, dueDate, returnDate, dailyRate);

      expect(fine).toBe(0);
    });

    it("should return 0 when returned on due date", () => {
      const issueDate = new Date("2024-01-01");
      const dueDate = new Date("2024-01-10");
      const returnDate = new Date("2024-01-10");
      const dailyRate = 5;

      const fine = calculateOverdueFine(issueDate, dueDate, returnDate, dailyRate);

      expect(fine).toBe(0);
    });

    it("should calculate fine for overdue books", () => {
      const issueDate = new Date("2024-01-01");
      const dueDate = new Date("2024-01-10");
      const returnDate = new Date("2024-01-15");
      const dailyRate = 5;

      const fine = calculateOverdueFine(issueDate, dueDate, returnDate, dailyRate);

      expect(fine).toBe(25); // 5 days * 5 rupees
    });

    it("should calculate fine with custom daily rate", () => {
      const issueDate = new Date("2024-01-01");
      const dueDate = new Date("2024-01-10");
      const returnDate = new Date("2024-01-13");
      const dailyRate = 10;

      const fine = calculateOverdueFine(issueDate, dueDate, returnDate, dailyRate);

      expect(fine).toBe(30); // 3 days * 10 rupees
    });

    it("should use default daily rate of 5 when not specified", () => {
      const issueDate = new Date("2024-01-01");
      const dueDate = new Date("2024-01-10");
      const returnDate = new Date("2024-01-12");

      const fine = calculateOverdueFine(issueDate, dueDate, returnDate);

      expect(fine).toBe(10); // 2 days * 5 rupees (default)
    });

    it("should handle single day overdue", () => {
      const issueDate = new Date("2024-01-01");
      const dueDate = new Date("2024-01-10");
      const returnDate = new Date("2024-01-11");
      const dailyRate = 5;

      const fine = calculateOverdueFine(issueDate, dueDate, returnDate, dailyRate);

      expect(fine).toBe(5); // 1 day * 5 rupees
    });

    it("should handle long overdue periods", () => {
      const issueDate = new Date("2024-01-01");
      const dueDate = new Date("2024-01-10");
      const returnDate = new Date("2024-02-10");
      const dailyRate = 5;

      const fine = calculateOverdueFine(issueDate, dueDate, returnDate, dailyRate);

      expect(fine).toBe(155); // 31 days * 5 rupees
    });
  });

  describe("isBookOverdue", () => {
    it("should return false when book is not overdue", () => {
      const dueDate = new Date("2024-12-31");
      const currentDate = new Date("2024-12-25");

      expect(isBookOverdue(dueDate, currentDate)).toBe(false);
    });

    it("should return false when current date equals due date", () => {
      const dueDate = new Date("2024-12-25");
      const currentDate = new Date("2024-12-25");

      expect(isBookOverdue(dueDate, currentDate)).toBe(false);
    });

    it("should return true when book is overdue", () => {
      const dueDate = new Date("2024-12-20");
      const currentDate = new Date("2024-12-25");

      expect(isBookOverdue(dueDate, currentDate)).toBe(true);
    });

    it("should ignore time component when comparing dates", () => {
      const dueDate = new Date("2024-12-25T23:59:59");
      const currentDate = new Date("2024-12-25T00:00:01");

      expect(isBookOverdue(dueDate, currentDate)).toBe(false);
    });
  });

  describe("getDaysOverdue", () => {
    it("should return 0 when book is not overdue", () => {
      const dueDate = new Date("2024-12-31");
      const currentDate = new Date("2024-12-25");

      expect(getDaysOverdue(dueDate, currentDate)).toBe(0);
    });

    it("should return 0 when current date equals due date", () => {
      const dueDate = new Date("2024-12-25");
      const currentDate = new Date("2024-12-25");

      expect(getDaysOverdue(dueDate, currentDate)).toBe(0);
    });

    it("should return correct days overdue", () => {
      const dueDate = new Date("2024-12-20");
      const currentDate = new Date("2024-12-25");

      expect(getDaysOverdue(dueDate, currentDate)).toBe(5);
    });

    it("should return 1 for single day overdue", () => {
      const dueDate = new Date("2024-12-24");
      const currentDate = new Date("2024-12-25");

      expect(getDaysOverdue(dueDate, currentDate)).toBe(1);
    });

    it("should handle long overdue periods", () => {
      const dueDate = new Date("2024-01-01");
      const currentDate = new Date("2024-02-01");

      expect(getDaysOverdue(dueDate, currentDate)).toBe(31);
    });
  });
});
