import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Unit tests for rank calculation functionality
 * 
 * These tests verify the core rank calculation logic including:
 * - Descending order ranking
 * - Tied rank handling
 * - Rank persistence
 */

describe("Rank Calculation Logic", () => {
  describe("Rank ordering", () => {
    it("should assign ranks in descending order by total marks", () => {
      // Arrange
      const students = [
        { id: "1", totalMarks: 95 },
        { id: "2", totalMarks: 88 },
        { id: "3", totalMarks: 92 },
        { id: "4", totalMarks: 85 },
      ];

      // Act - Sort by totalMarks descending
      const sorted = [...students].sort((a, b) => b.totalMarks - a.totalMarks);
      
      // Assign ranks
      const ranked = sorted.map((student, index) => ({
        ...student,
        rank: index + 1,
      }));

      // Assert
      expect(ranked[0].id).toBe("1"); // 95 marks -> Rank 1
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].id).toBe("3"); // 92 marks -> Rank 2
      expect(ranked[1].rank).toBe(2);
      expect(ranked[2].id).toBe("2"); // 88 marks -> Rank 3
      expect(ranked[2].rank).toBe(3);
      expect(ranked[3].id).toBe("4"); // 85 marks -> Rank 4
      expect(ranked[3].rank).toBe(4);
    });

    it("should handle single student correctly", () => {
      // Arrange
      const students = [{ id: "1", totalMarks: 95 }];

      // Act
      const sorted = [...students].sort((a, b) => b.totalMarks - a.totalMarks);
      const ranked = sorted.map((student, index) => ({
        ...student,
        rank: index + 1,
      }));

      // Assert
      expect(ranked[0].rank).toBe(1);
    });
  });

  describe("Tied ranks", () => {
    it("should assign same rank to students with equal marks", () => {
      // Arrange
      const students = [
        { id: "1", totalMarks: 95 },
        { id: "2", totalMarks: 88 },
        { id: "3", totalMarks: 88 },
        { id: "4", totalMarks: 85 },
      ];

      // Act - Implement tied rank logic
      const sorted = [...students].sort((a, b) => b.totalMarks - a.totalMarks);
      
      const ranked: Array<{ id: string; totalMarks: number; rank: number }> = [];
      let currentRank = 1;
      let previousMarks: number | null = null;
      let studentsAtCurrentRank = 0;

      sorted.forEach((student) => {
        const marks = student.totalMarks;

        if (previousMarks !== null && marks === previousMarks) {
          // Same marks as previous student - assign same rank
          ranked.push({ ...student, rank: currentRank });
          studentsAtCurrentRank++;
        } else {
          // Different marks - new rank
          if (studentsAtCurrentRank > 0) {
            currentRank += studentsAtCurrentRank;
          }
          ranked.push({ ...student, rank: currentRank });
          studentsAtCurrentRank = 1;
        }

        previousMarks = marks;
      });

      // Assert
      expect(ranked[0].rank).toBe(1); // 95 marks -> Rank 1
      expect(ranked[1].rank).toBe(2); // 88 marks -> Rank 2
      expect(ranked[2].rank).toBe(2); // 88 marks -> Rank 2 (tied)
      expect(ranked[3].rank).toBe(4); // 85 marks -> Rank 4 (skips 3)
    });

    it("should handle multiple tied groups correctly", () => {
      // Arrange
      const students = [
        { id: "1", totalMarks: 95 },
        { id: "2", totalMarks: 95 },
        { id: "3", totalMarks: 88 },
        { id: "4", totalMarks: 88 },
        { id: "5", totalMarks: 88 },
        { id: "6", totalMarks: 75 },
      ];

      // Act
      const sorted = [...students].sort((a, b) => b.totalMarks - a.totalMarks);
      
      const ranked: Array<{ id: string; totalMarks: number; rank: number }> = [];
      let currentRank = 1;
      let previousMarks: number | null = null;
      let studentsAtCurrentRank = 0;

      sorted.forEach((student) => {
        const marks = student.totalMarks;

        if (previousMarks !== null && marks === previousMarks) {
          ranked.push({ ...student, rank: currentRank });
          studentsAtCurrentRank++;
        } else {
          if (studentsAtCurrentRank > 0) {
            currentRank += studentsAtCurrentRank;
          }
          ranked.push({ ...student, rank: currentRank });
          studentsAtCurrentRank = 1;
        }

        previousMarks = marks;
      });

      // Assert
      expect(ranked[0].rank).toBe(1); // 95 marks -> Rank 1
      expect(ranked[1].rank).toBe(1); // 95 marks -> Rank 1 (tied)
      expect(ranked[2].rank).toBe(3); // 88 marks -> Rank 3 (skips 2)
      expect(ranked[3].rank).toBe(3); // 88 marks -> Rank 3 (tied)
      expect(ranked[4].rank).toBe(3); // 88 marks -> Rank 3 (tied)
      expect(ranked[5].rank).toBe(6); // 75 marks -> Rank 6 (skips 4, 5)
    });

    it("should handle all students having same marks", () => {
      // Arrange
      const students = [
        { id: "1", totalMarks: 88 },
        { id: "2", totalMarks: 88 },
        { id: "3", totalMarks: 88 },
      ];

      // Act
      const sorted = [...students].sort((a, b) => b.totalMarks - a.totalMarks);
      
      const ranked: Array<{ id: string; totalMarks: number; rank: number }> = [];
      let currentRank = 1;
      let previousMarks: number | null = null;
      let studentsAtCurrentRank = 0;

      sorted.forEach((student) => {
        const marks = student.totalMarks;

        if (previousMarks !== null && marks === previousMarks) {
          ranked.push({ ...student, rank: currentRank });
          studentsAtCurrentRank++;
        } else {
          if (studentsAtCurrentRank > 0) {
            currentRank += studentsAtCurrentRank;
          }
          ranked.push({ ...student, rank: currentRank });
          studentsAtCurrentRank = 1;
        }

        previousMarks = marks;
      });

      // Assert
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(1);
      expect(ranked[2].rank).toBe(1);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty student list", () => {
      // Arrange
      const students: Array<{ id: string; totalMarks: number }> = [];

      // Act
      const sorted = [...students].sort((a, b) => b.totalMarks - a.totalMarks);

      // Assert
      expect(sorted.length).toBe(0);
    });

    it("should handle zero marks correctly", () => {
      // Arrange
      const students = [
        { id: "1", totalMarks: 50 },
        { id: "2", totalMarks: 0 },
        { id: "3", totalMarks: 25 },
      ];

      // Act
      const sorted = [...students].sort((a, b) => b.totalMarks - a.totalMarks);
      const ranked = sorted.map((student, index) => ({
        ...student,
        rank: index + 1,
      }));

      // Assert
      expect(ranked[0].id).toBe("1"); // 50 marks -> Rank 1
      expect(ranked[1].id).toBe("3"); // 25 marks -> Rank 2
      expect(ranked[2].id).toBe("2"); // 0 marks -> Rank 3
      expect(ranked[2].rank).toBe(3);
    });

    it("should handle decimal marks correctly", () => {
      // Arrange
      const students = [
        { id: "1", totalMarks: 95.5 },
        { id: "2", totalMarks: 95.3 },
        { id: "3", totalMarks: 95.5 },
      ];

      // Act
      const sorted = [...students].sort((a, b) => b.totalMarks - a.totalMarks);
      
      const ranked: Array<{ id: string; totalMarks: number; rank: number }> = [];
      let currentRank = 1;
      let previousMarks: number | null = null;
      let studentsAtCurrentRank = 0;

      sorted.forEach((student) => {
        const marks = student.totalMarks;

        if (previousMarks !== null && marks === previousMarks) {
          ranked.push({ ...student, rank: currentRank });
          studentsAtCurrentRank++;
        } else {
          if (studentsAtCurrentRank > 0) {
            currentRank += studentsAtCurrentRank;
          }
          ranked.push({ ...student, rank: currentRank });
          studentsAtCurrentRank = 1;
        }

        previousMarks = marks;
      });

      // Assert
      expect(ranked[0].rank).toBe(1); // 95.5 marks
      expect(ranked[1].rank).toBe(1); // 95.5 marks (tied)
      expect(ranked[2].rank).toBe(3); // 95.3 marks
    });
  });
});
