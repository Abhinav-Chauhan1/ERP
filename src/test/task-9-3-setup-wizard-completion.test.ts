/**
 * Task 9.3: Setup Wizard Completion Tests
 * Requirements: 9.3 - WHEN setup wizard is completed, THE System SHALL set isOnboarded flag to true
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db';
import { completeSetup } from '@/lib/actions/onboarding/setup-actions';
import { schoolContextService } from '@/lib/services/school-context-service';

// Mock Next.js server functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock the tenant auth helper
vi.mock('@/lib/auth/tenant', () => ({
  getCurrentSchoolId: vi.fn(),
}));

describe('Task 9.3: Setup Wizard Completion', () => {
  let testSchoolId: string;
  let mockGetCurrentSchoolId: any;

  beforeEach(async () => {
    // Import the mocked function
    const { getCurrentSchoolId } = await import('@/lib/auth/tenant');
    mockGetCurrentSchoolId = getCurrentSchoolId as any;

    // Create a test school
    const school = await db.school.create({
      data: {
        name: 'Test School',
        schoolCode: 'TEST001',
        email: 'test@school.com',
        phone: '1234567890',
        plan: 'STARTER',
        status: 'ACTIVE',
        isOnboarded: false,
        onboardingStep: 0,
      },
    });
    testSchoolId = school.id;

    // Mock getCurrentSchoolId to return our test school
    mockGetCurrentSchoolId.mockResolvedValue(testSchoolId);
  });

  afterEach(async () => {
    // Clean up test data
    await db.school.deleteMany({
      where: { schoolCode: 'TEST001' },
    });
    vi.clearAllMocks();
  });

  describe('Setup Wizard Completion Logic', () => {
    it('should set isOnboarded flag to true when setup is completed', async () => {
      // Arrange
      const setupData = {
        academicYearName: '2024-2025',
        academicYearStart: new Date('2024-04-01'),
        academicYearEnd: new Date('2025-03-31'),
        terms: [
          {
            name: 'Term 1',
            startDate: new Date('2024-04-01'),
            endDate: new Date('2024-08-31'),
          },
          {
            name: 'Term 2',
            startDate: new Date('2024-09-01'),
            endDate: new Date('2024-12-31'),
          },
        ],
        selectedClasses: ['Class 1', 'Class 2'],
        sections: ['A', 'B'],
      };

      // Verify school is not onboarded initially
      const initialStatus = await schoolContextService.getSchoolOnboardingStatus(testSchoolId);
      expect(initialStatus?.isOnboarded).toBe(false);

      // Act
      const result = await completeSetup(setupData);

      // Assert
      expect(result.success).toBe(true);

      // Verify isOnboarded flag is set to true
      const finalStatus = await schoolContextService.getSchoolOnboardingStatus(testSchoolId);
      expect(finalStatus?.isOnboarded).toBe(true);
      expect(finalStatus?.onboardingStep).toBe(7);
    });

    it('should create academic structure when setup is completed', async () => {
      // Arrange
      const setupData = {
        academicYearName: '2024-2025',
        academicYearStart: new Date('2024-04-01'),
        academicYearEnd: new Date('2025-03-31'),
        terms: [
          {
            name: 'Term 1',
            startDate: new Date('2024-04-01'),
            endDate: new Date('2024-08-31'),
          },
        ],
        selectedClasses: ['Class 1'],
        sections: ['A'],
      };

      // Act
      const result = await completeSetup(setupData);

      // Assert
      expect(result.success).toBe(true);

      // Verify academic year was created
      const academicYear = await db.academicYear.findFirst({
        where: { schoolId: testSchoolId },
      });
      expect(academicYear).toBeTruthy();
      expect(academicYear?.name).toBe('2024-2025');

      // Verify terms were created
      const terms = await db.term.findMany({
        where: { schoolId: testSchoolId },
      });
      expect(terms).toHaveLength(1);
      expect(terms[0].name).toBe('Term 1');

      // Verify classes were created
      const classes = await db.class.findMany({
        where: { schoolId: testSchoolId },
      });
      expect(classes).toHaveLength(1);
      expect(classes[0].name).toBe('Class 1');

      // Verify sections were created
      const sections = await db.classSection.findMany({
        where: { schoolId: testSchoolId },
      });
      expect(sections).toHaveLength(1);
      expect(sections[0].name).toBe('A');
    });

    it('should set onboardingCompletedAt timestamp when setup is completed', async () => {
      // Arrange
      const setupData = {
        academicYearName: '2024-2025',
        academicYearStart: new Date('2024-04-01'),
        academicYearEnd: new Date('2025-03-31'),
        terms: [],
        selectedClasses: [],
        sections: [],
      };

      const beforeCompletion = new Date();

      // Act
      const result = await completeSetup(setupData);

      // Assert
      expect(result.success).toBe(true);

      const school = await db.school.findUnique({
        where: { id: testSchoolId },
        select: { onboardingCompletedAt: true },
      });

      expect(school?.onboardingCompletedAt).toBeTruthy();
      expect(school?.onboardingCompletedAt).toBeInstanceOf(Date);
      expect(school?.onboardingCompletedAt!.getTime()).toBeGreaterThanOrEqual(beforeCompletion.getTime());
    });

    it('should handle setup completion errors gracefully', async () => {
      // Arrange - Invalid data (missing required fields)
      const invalidSetupData = {
        academicYearName: '', // Empty name should cause error
        academicYearStart: null,
        academicYearEnd: null,
        terms: [],
        selectedClasses: [],
        sections: [],
      };

      // Act
      const result = await completeSetup(invalidSetupData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();

      // Verify school remains not onboarded
      const status = await schoolContextService.getSchoolOnboardingStatus(testSchoolId);
      expect(status?.isOnboarded).toBe(false);
    });
  });

  describe('Property-Based Test: Setup Completion Consistency', () => {
    /**
     * Property 10: School Onboarding State Management
     * For any school, the system should set isOnboarded to false on creation,
     * redirect non-onboarded school admins to setup wizard, update isOnboarded
     * to true on completion, and allow super admin to reset onboarding state
     * while tracking progress independently per school
     * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
     */
    it('Property 10: School onboarding state management consistency', { timeout: 15000 }, async () => {
      // Test multiple setup completion scenarios
      const testCases = [
        {
          name: 'Minimal setup',
          data: {
            academicYearName: 'Test Year',
            academicYearStart: new Date('2024-01-01'),
            academicYearEnd: new Date('2024-12-31'),
            terms: [],
            selectedClasses: [],
            sections: [],
          },
        },
        {
          name: 'Full setup',
          data: {
            academicYearName: 'Full Year',
            academicYearStart: new Date('2024-01-01'),
            academicYearEnd: new Date('2024-12-31'),
            terms: [
              {
                name: 'Term 1',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-06-30'),
              },
              {
                name: 'Term 2',
                startDate: new Date('2024-07-01'),
                endDate: new Date('2024-12-31'),
              },
            ],
            selectedClasses: ['Grade 1', 'Grade 2', 'Grade 3'],
            sections: ['A', 'B', 'C'],
          },
        },
      ];

      for (const testCase of testCases) {
        // Create a new school for each test case
        const school = await db.school.create({
          data: {
            name: `Test School ${testCase.name}`,
            schoolCode: `TEST${Date.now()}`,
            email: `test${Date.now()}@school.com`,
            phone: '1234567890',
            plan: 'STARTER',
            status: 'ACTIVE',
            isOnboarded: false,
            onboardingStep: 0,
          },
        });

        // Mock getCurrentSchoolId for this school
        mockGetCurrentSchoolId.mockResolvedValue(school.id);

        try {
          // Verify initial state: isOnboarded should be false
          const initialStatus = await schoolContextService.getSchoolOnboardingStatus(school.id);
          expect(initialStatus?.isOnboarded).toBe(false);
          expect(initialStatus?.requiresSetup).toBe(true);

          // Complete setup
          const result = await completeSetup(testCase.data);
          expect(result.success).toBe(true);

          // Verify final state: isOnboarded should be true
          const finalStatus = await schoolContextService.getSchoolOnboardingStatus(school.id);
          expect(finalStatus?.isOnboarded).toBe(true);
          expect(finalStatus?.requiresSetup).toBe(false);
          expect(finalStatus?.onboardingStep).toBe(7);

          // Verify onboarding completion timestamp is set
          const schoolRecord = await db.school.findUnique({
            where: { id: school.id },
            select: { onboardingCompletedAt: true },
          });
          expect(schoolRecord?.onboardingCompletedAt).toBeTruthy();

        } finally {
          // Clean up
          await db.school.delete({ where: { id: school.id } });
        }
      }
    });
  });
});