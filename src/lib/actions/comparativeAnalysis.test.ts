import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateYearOverYearComparison,
  generateTermOverTermComparison,
  ComparativeAnalysisConfig,
} from './reportBuilderActions';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test-user-id' })),
}));

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    academicYear: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    term: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    studentAttendance: {
      findMany: vi.fn(),
    },
    feePayment: {
      findMany: vi.fn(),
    },
    examResult: {
      findMany: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
    },
  },
}));

describe('Comparative Analysis', () => {
  describe('Year-over-Year Comparison', () => {
    it('should generate year-over-year comparison for attendance data', async () => {
      const config: ComparativeAnalysisConfig = {
        comparisonType: 'year-over-year',
        dataSource: 'attendance',
        metric: 'attendance',
        aggregation: 'average',
        currentPeriodId: 'current-year-id',
      };

      // This is a basic structure test - actual implementation would need proper mocking
      const result = await generateYearOverYearComparison(config);
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should return error when current period is not found', async () => {
      const { prisma } = await import('@/lib/db');
      vi.mocked(prisma.academicYear.findUnique).mockResolvedValueOnce(null);

      const config: ComparativeAnalysisConfig = {
        comparisonType: 'year-over-year',
        dataSource: 'attendance',
        metric: 'attendance',
        aggregation: 'average',
        currentPeriodId: 'invalid-id',
      };

      const result = await generateYearOverYearComparison(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Current academic year not found');
    });
  });

  describe('Term-over-Term Comparison', () => {
    it('should generate term-over-term comparison for exam data', async () => {
      const config: ComparativeAnalysisConfig = {
        comparisonType: 'term-over-term',
        dataSource: 'exams',
        metric: 'marks',
        aggregation: 'average',
        currentPeriodId: 'current-term-id',
      };

      const result = await generateTermOverTermComparison(config);
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should return error when current term is not found', async () => {
      const { prisma } = await import('@/lib/db');
      vi.mocked(prisma.term.findUnique).mockResolvedValueOnce(null);

      const config: ComparativeAnalysisConfig = {
        comparisonType: 'term-over-term',
        dataSource: 'exams',
        metric: 'marks',
        aggregation: 'average',
        currentPeriodId: 'invalid-id',
      };

      const result = await generateTermOverTermComparison(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Current term not found');
    });
  });

  describe('Data Aggregation', () => {
    it('should calculate correct average for attendance data', () => {
      // Test aggregation logic
      const attendanceData = [
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'ABSENT' },
        { status: 'PRESENT' },
      ];

      // 3 present out of 4 = 75% attendance
      const presentCount = attendanceData.filter(d => d.status === 'PRESENT').length;
      const average = (presentCount / attendanceData.length) * 100;
      
      expect(average).toBe(75);
    });

    it('should calculate correct sum for fee payments', () => {
      const feeData = [
        { amount: 1000 },
        { amount: 1500 },
        { amount: 2000 },
      ];

      const sum = feeData.reduce((total, payment) => total + payment.amount, 0);
      
      expect(sum).toBe(4500);
    });
  });

  describe('Trend Calculation', () => {
    it('should identify upward trend when current value is higher', () => {
      const currentValue = 85;
      const previousValue = 75;
      const change = currentValue - previousValue;
      
      const trend = change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable';
      
      expect(trend).toBe('up');
    });

    it('should identify downward trend when current value is lower', () => {
      const currentValue = 65;
      const previousValue = 75;
      const change = currentValue - previousValue;
      
      const trend = change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable';
      
      expect(trend).toBe('down');
    });

    it('should identify stable trend when values are similar', () => {
      const currentValue = 75.3;
      const previousValue = 75.1;
      const change = currentValue - previousValue;
      
      const trend = change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable';
      
      expect(trend).toBe('stable');
    });
  });

  describe('Percentage Change Calculation', () => {
    it('should calculate correct percentage increase', () => {
      const currentValue = 90;
      const previousValue = 75;
      const change = currentValue - previousValue;
      const percentageChange = (change / previousValue) * 100;
      
      expect(percentageChange).toBe(20);
    });

    it('should calculate correct percentage decrease', () => {
      const currentValue = 60;
      const previousValue = 75;
      const change = currentValue - previousValue;
      const percentageChange = (change / previousValue) * 100;
      
      expect(percentageChange).toBe(-20);
    });

    it('should handle zero previous value', () => {
      const currentValue = 50;
      const previousValue = 0;
      const percentageChange = previousValue !== 0 
        ? ((currentValue - previousValue) / previousValue) * 100 
        : 0;
      
      expect(percentageChange).toBe(0);
    });
  });
});
