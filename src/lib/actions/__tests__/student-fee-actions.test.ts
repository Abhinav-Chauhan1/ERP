
import { expect, test, vi, describe, beforeEach } from 'vitest';
import { getStudentFeeDetails } from '../student-fee-actions';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: vi.fn() },
    student: { findUnique: vi.fn() },
    feeStructure: { findFirst: vi.fn() },
    feePayment: { findMany: vi.fn() },
    feeType: { findUnique: vi.fn() },
    feeTypeClassAmount: { findMany: vi.fn(), findUnique: vi.fn() },
    notification: { create: vi.fn() },
    feeStructureItem: { findUnique: vi.fn() },
    scholarshipRecipient: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    scholarship: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock utils that are dynamically imported
vi.mock('@/lib/utils/csrf', () => ({
    verifyCsrfToken: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/utils/rate-limit', () => ({
    checkRateLimit: vi.fn().mockReturnValue(true),
    RateLimitPresets: { PAYMENT: {} }
}));

describe('student-fee-actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('getStudentFeeDetails calculates totalFees using batch query', async () => {
        // Mock Auth
        (auth as any).mockResolvedValue({ user: { id: 'user-1' } });

        // Mock DB User
        (db.user.findUnique as any).mockResolvedValue({ id: 'user-1', role: 'STUDENT' });

        // Mock DB Student
        (db.student.findUnique as any).mockResolvedValue({
            id: 'student-1',
            userId: 'user-1',
            enrollments: [{
                class: {
                    id: 'class-1',
                    name: 'Class 1',
                    academicYear: { id: 'year-1', name: '2024' }
                }
            }]
        });

        // Mock Fee Structure
        (db.feeStructure.findFirst as any).mockResolvedValue({
            id: 'fs-1',
            items: [
                { feeTypeId: 'ft-1', amount: 100, feeType: { id: 'ft-1', amount: 100 } },
                { feeTypeId: 'ft-2', amount: 200, feeType: { id: 'ft-2', amount: 200 } }
            ]
        });

        // Mock Fee Payments
        (db.feePayment.findMany as any).mockResolvedValue([]);

        // Mock FeeTypeClassAmount (Batch)
        // Only ft-1 has override
        (db.feeTypeClassAmount.findMany as any).mockResolvedValue([
            { feeTypeId: 'ft-1', classId: 'class-1', amount: 150 }
        ]);

        const result = await getStudentFeeDetails();

        // ft-1: 150 (override)
        // ft-2: 200 (default from feeType)
        // Total: 350
        expect(result.totalFees).toBe(350);

        // Verify batch call
        expect(db.feeTypeClassAmount.findMany).toHaveBeenCalledWith({
            where: {
                classId: 'class-1',
                feeTypeId: { in: ['ft-1', 'ft-2'] }
            }
        });

        // Verify N+1 calls are NOT made (findUnique should not be called for amounts)
        expect(db.feeTypeClassAmount.findUnique).not.toHaveBeenCalled();
    });
});
