import { describe, it, expect } from 'vitest';
import {
  calculatePercentage,
  calculateGradeFromScale,
  calculateGrade,
  type GradeScaleEntry,
} from '../grade-calculator';

describe('Grade Calculator Utilities', () => {
  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(80, 100)).toBe(80);
      expect(calculatePercentage(45, 50)).toBe(90);
      expect(calculatePercentage(33, 100)).toBe(33);
    });

    it('should round to 2 decimal places', () => {
      expect(calculatePercentage(33.333, 100)).toBe(33.33);
      expect(calculatePercentage(66.666, 100)).toBe(66.67);
    });

    it('should return 0 when total marks is 0', () => {
      expect(calculatePercentage(50, 0)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(calculatePercentage(0, 100)).toBe(0);
      expect(calculatePercentage(100, 100)).toBe(100);
    });
  });

  describe('calculateGradeFromScale', () => {
    const mockGradeScale: GradeScaleEntry[] = [
      { id: '1', grade: 'A+', minMarks: 90, maxMarks: 100, gpa: 4.0 },
      { id: '2', grade: 'A', minMarks: 80, maxMarks: 89.99, gpa: 3.7 },
      { id: '3', grade: 'B+', minMarks: 70, maxMarks: 79.99, gpa: 3.3 },
      { id: '4', grade: 'B', minMarks: 60, maxMarks: 69.99, gpa: 3.0 },
      { id: '5', grade: 'C', minMarks: 50, maxMarks: 59.99, gpa: 2.0 },
      { id: '6', grade: 'D', minMarks: 40, maxMarks: 49.99, gpa: 1.0 },
      { id: '7', grade: 'F', minMarks: 0, maxMarks: 39.99, gpa: 0.0 },
    ];

    it('should return correct grade for percentage within range', () => {
      expect(calculateGradeFromScale(95, mockGradeScale)).toBe('A+');
      expect(calculateGradeFromScale(85, mockGradeScale)).toBe('A');
      expect(calculateGradeFromScale(75, mockGradeScale)).toBe('B+');
      expect(calculateGradeFromScale(65, mockGradeScale)).toBe('B');
      expect(calculateGradeFromScale(55, mockGradeScale)).toBe('C');
      expect(calculateGradeFromScale(45, mockGradeScale)).toBe('D');
      expect(calculateGradeFromScale(35, mockGradeScale)).toBe('F');
    });

    it('should handle boundary values correctly', () => {
      expect(calculateGradeFromScale(90, mockGradeScale)).toBe('A+');
      expect(calculateGradeFromScale(80, mockGradeScale)).toBe('A');
      expect(calculateGradeFromScale(70, mockGradeScale)).toBe('B+');
    });

    it('should return null when no matching grade found', () => {
      expect(calculateGradeFromScale(150, mockGradeScale)).toBeNull();
      expect(calculateGradeFromScale(-10, mockGradeScale)).toBeNull();
    });

    it('should handle empty grade scale', () => {
      expect(calculateGradeFromScale(85, [])).toBeNull();
    });
  });

  describe('calculateGrade (default fallback)', () => {
    it('should return correct default grades', () => {
      expect(calculateGrade(95)).toBe('A+');
      expect(calculateGrade(85)).toBe('A');
      expect(calculateGrade(75)).toBe('B+');
      expect(calculateGrade(65)).toBe('B');
      expect(calculateGrade(55)).toBe('C+');
      expect(calculateGrade(45)).toBe('C');
      expect(calculateGrade(35)).toBe('D');
      expect(calculateGrade(25)).toBe('F');
    });

    it('should handle boundary values', () => {
      expect(calculateGrade(90)).toBe('A+');
      expect(calculateGrade(80)).toBe('A');
      expect(calculateGrade(33)).toBe('D');
      expect(calculateGrade(32)).toBe('F');
    });

    it('should handle edge cases', () => {
      expect(calculateGrade(0)).toBe('F');
      expect(calculateGrade(100)).toBe('A+');
    });
  });
});
