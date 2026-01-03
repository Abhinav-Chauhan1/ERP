/**
 * Unit tests for Report Card Calculation Logic
 * 
 * These tests verify the calculation logic without requiring database access.
 */

import { describe, it, expect } from 'vitest';

// Mock data structures matching the service interfaces
interface SubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  theoryMarks: number | null;
  theoryMaxMarks: number | null;
  practicalMarks: number | null;
  practicalMaxMarks: number | null;
  internalMarks: number | null;
  internalMaxMarks: number | null;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string | null;
  isAbsent: boolean;
}

interface OverallPerformance {
  totalMarks: number;
  maxMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string | null;
  rank: number | null;
}

// Helper function to calculate grade (same logic as in the service)
function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  if (percentage >= 33) return "D";
  return "F";
}

// Helper function to calculate overall performance (same logic as in the service)
function calculateOverallPerformance(
  subjects: SubjectResult[],
  reportCard: { rank: number | null } | null
): OverallPerformance {
  const presentSubjects = subjects.filter((s) => !s.isAbsent);

  if (presentSubjects.length === 0) {
    return {
      totalMarks: 0,
      maxMarks: 0,
      obtainedMarks: 0,
      percentage: 0,
      grade: null,
      rank: reportCard?.rank || null,
    };
  }

  const totalMarks = presentSubjects.reduce((sum, s) => sum + s.totalMarks, 0);
  const maxMarks = presentSubjects.reduce((sum, s) => sum + s.maxMarks, 0);
  const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
  const grade = calculateGrade(percentage);

  return {
    totalMarks,
    maxMarks,
    obtainedMarks: totalMarks,
    percentage: Math.round(percentage * 100) / 100,
    grade,
    rank: reportCard?.rank || null,
  };
}

describe('Report Card Calculation Logic', () => {
  describe('Grade Calculation', () => {
    it('should assign A+ for percentage >= 90', () => {
      expect(calculateGrade(95)).toBe('A+');
      expect(calculateGrade(90)).toBe('A+');
    });

    it('should assign A for percentage >= 80 and < 90', () => {
      expect(calculateGrade(85)).toBe('A');
      expect(calculateGrade(80)).toBe('A');
    });

    it('should assign B+ for percentage >= 70 and < 80', () => {
      expect(calculateGrade(75)).toBe('B+');
      expect(calculateGrade(70)).toBe('B+');
    });

    it('should assign B for percentage >= 60 and < 70', () => {
      expect(calculateGrade(65)).toBe('B');
      expect(calculateGrade(60)).toBe('B');
    });

    it('should assign C+ for percentage >= 50 and < 60', () => {
      expect(calculateGrade(55)).toBe('C+');
      expect(calculateGrade(50)).toBe('C+');
    });

    it('should assign C for percentage >= 40 and < 50', () => {
      expect(calculateGrade(45)).toBe('C');
      expect(calculateGrade(40)).toBe('C');
    });

    it('should assign D for percentage >= 33 and < 40', () => {
      expect(calculateGrade(35)).toBe('D');
      expect(calculateGrade(33)).toBe('D');
    });

    it('should assign F for percentage < 33', () => {
      expect(calculateGrade(30)).toBe('F');
      expect(calculateGrade(0)).toBe('F');
    });
  });

  describe('Overall Performance Calculation', () => {
    it('should calculate correct totals for multiple subjects', () => {
      const subjects: SubjectResult[] = [
        {
          subjectId: '1',
          subjectName: 'Math',
          subjectCode: 'MATH101',
          theoryMarks: 80,
          theoryMaxMarks: 100,
          practicalMarks: null,
          practicalMaxMarks: null,
          internalMarks: null,
          internalMaxMarks: null,
          totalMarks: 80,
          maxMarks: 100,
          percentage: 80,
          grade: 'A',
          isAbsent: false,
        },
        {
          subjectId: '2',
          subjectName: 'Science',
          subjectCode: 'SCI101',
          theoryMarks: 70,
          theoryMaxMarks: 80,
          practicalMarks: 18,
          practicalMaxMarks: 20,
          internalMarks: null,
          internalMaxMarks: null,
          totalMarks: 88,
          maxMarks: 100,
          percentage: 88,
          grade: 'A',
          isAbsent: false,
        },
      ];

      const performance = calculateOverallPerformance(subjects, null);

      expect(performance.totalMarks).toBe(168); // 80 + 88
      expect(performance.maxMarks).toBe(200); // 100 + 100
      expect(performance.obtainedMarks).toBe(168);
      expect(performance.percentage).toBe(84); // (168/200) * 100
      expect(performance.grade).toBe('A');
    });

    it('should exclude absent subjects from calculations', () => {
      const subjects: SubjectResult[] = [
        {
          subjectId: '1',
          subjectName: 'Math',
          subjectCode: 'MATH101',
          theoryMarks: 80,
          theoryMaxMarks: 100,
          practicalMarks: null,
          practicalMaxMarks: null,
          internalMarks: null,
          internalMaxMarks: null,
          totalMarks: 80,
          maxMarks: 100,
          percentage: 80,
          grade: 'A',
          isAbsent: false,
        },
        {
          subjectId: '2',
          subjectName: 'Science',
          subjectCode: 'SCI101',
          theoryMarks: null,
          theoryMaxMarks: null,
          practicalMarks: null,
          practicalMaxMarks: null,
          internalMarks: null,
          internalMaxMarks: null,
          totalMarks: 0,
          maxMarks: 100,
          percentage: 0,
          grade: null,
          isAbsent: true, // Absent
        },
      ];

      const performance = calculateOverallPerformance(subjects, null);

      // Should only count Math, not Science
      expect(performance.totalMarks).toBe(80);
      expect(performance.maxMarks).toBe(100);
      expect(performance.percentage).toBe(80);
      expect(performance.grade).toBe('A');
    });

    it('should handle all subjects absent', () => {
      const subjects: SubjectResult[] = [
        {
          subjectId: '1',
          subjectName: 'Math',
          subjectCode: 'MATH101',
          theoryMarks: null,
          theoryMaxMarks: null,
          practicalMarks: null,
          practicalMaxMarks: null,
          internalMarks: null,
          internalMaxMarks: null,
          totalMarks: 0,
          maxMarks: 100,
          percentage: 0,
          grade: null,
          isAbsent: true,
        },
      ];

      const performance = calculateOverallPerformance(subjects, null);

      expect(performance.totalMarks).toBe(0);
      expect(performance.maxMarks).toBe(0);
      expect(performance.percentage).toBe(0);
      expect(performance.grade).toBe(null);
    });

    it('should include rank from report card if available', () => {
      const subjects: SubjectResult[] = [
        {
          subjectId: '1',
          subjectName: 'Math',
          subjectCode: 'MATH101',
          theoryMarks: 90,
          theoryMaxMarks: 100,
          practicalMarks: null,
          practicalMaxMarks: null,
          internalMarks: null,
          internalMaxMarks: null,
          totalMarks: 90,
          maxMarks: 100,
          percentage: 90,
          grade: 'A+',
          isAbsent: false,
        },
      ];

      const performance = calculateOverallPerformance(subjects, { rank: 5 });

      expect(performance.rank).toBe(5);
    });

    it('should round percentage to 2 decimal places', () => {
      const subjects: SubjectResult[] = [
        {
          subjectId: '1',
          subjectName: 'Math',
          subjectCode: 'MATH101',
          theoryMarks: 85,
          theoryMaxMarks: 100,
          practicalMarks: null,
          practicalMaxMarks: null,
          internalMarks: null,
          internalMaxMarks: null,
          totalMarks: 85,
          maxMarks: 100,
          percentage: 85,
          grade: 'A',
          isAbsent: false,
        },
        {
          subjectId: '2',
          subjectName: 'Science',
          subjectCode: 'SCI101',
          theoryMarks: 77,
          theoryMaxMarks: 90,
          practicalMarks: null,
          practicalMaxMarks: null,
          internalMarks: null,
          internalMaxMarks: null,
          totalMarks: 77,
          maxMarks: 90,
          percentage: 85.56,
          grade: 'A',
          isAbsent: false,
        },
      ];

      const performance = calculateOverallPerformance(subjects, null);

      // (85 + 77) / (100 + 90) = 162 / 190 = 85.263157...
      expect(performance.percentage).toBe(85.26);
    });

    it('should handle subjects with theory, practical, and internal marks', () => {
      const subjects: SubjectResult[] = [
        {
          subjectId: '1',
          subjectName: 'Physics',
          subjectCode: 'PHY101',
          theoryMarks: 60,
          theoryMaxMarks: 70,
          practicalMarks: 25,
          practicalMaxMarks: 30,
          internalMarks: null,
          internalMaxMarks: null,
          totalMarks: 85,
          maxMarks: 100,
          percentage: 85,
          grade: 'A',
          isAbsent: false,
        },
        {
          subjectId: '2',
          subjectName: 'Chemistry',
          subjectCode: 'CHEM101',
          theoryMarks: 55,
          theoryMaxMarks: 60,
          practicalMarks: 18,
          practicalMaxMarks: 20,
          internalMarks: 18,
          internalMaxMarks: 20,
          totalMarks: 91,
          maxMarks: 100,
          percentage: 91,
          grade: 'A+',
          isAbsent: false,
        },
      ];

      const performance = calculateOverallPerformance(subjects, null);

      expect(performance.totalMarks).toBe(176); // 85 + 91
      expect(performance.maxMarks).toBe(200); // 100 + 100
      expect(performance.percentage).toBe(88); // (176/200) * 100
      expect(performance.grade).toBe('A');
    });
  });
});
