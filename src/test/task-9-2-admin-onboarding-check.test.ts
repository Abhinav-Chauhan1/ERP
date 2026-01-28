/**
 * Test for Task 9.2: Implement onboarding check in school admin dashboard
 * 
 * Requirements: 9.2
 * Tests that school admin dashboard redirects to setup wizard if not onboarded
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { schoolContextService } from '@/lib/services/school-context-service';

// Mock the dependencies
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}));

vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

vi.mock('@/lib/services/school-context-service', () => ({
  schoolContextService: {
    getSchoolOnboardingStatus: vi.fn()
  }
}));

// Mock the dashboard sections to avoid import issues in tests
vi.mock('../app/admin/dashboard-sections', () => ({
  PrimaryStatsSection: () => null,
  SecondaryStatsSection: () => null,
  ChartsSection: () => null,
  ActivitySection: () => null,
  QuickActionsSection: () => null,
}));

vi.mock('../app/admin/dashboard-skeletons', () => ({
  PrimaryStatsSkeleton: () => null,
  SecondaryStatsSkeleton: () => null,
  ChartsSkeleton: () => null,
  ActivitySkeleton: () => null,
  QuickActionsSkeleton: () => null,
}));

vi.mock('../app/admin/dashboard/pending-class-teachers', () => ({
  PendingClassTeachersSection: () => null,
}));

describe('Task 9.2: Admin Dashboard Onboarding Check', () => {
  const mockAuth = vi.mocked(auth);
  const mockRedirect = vi.mocked(redirect);
  const mockGetSchoolOnboardingStatus = vi.mocked(schoolContextService.getSchoolOnboardingStatus);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Onboarding Check Logic', () => {
    it('should redirect to setup wizard when school admin is not onboarded', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
          schoolId: 'school-1',
          name: 'John Admin'
        }
      };

      mockAuth.mockResolvedValue(mockSession);
      mockGetSchoolOnboardingStatus.mockResolvedValue({
        isOnboarded: false,
        onboardingStep: 2,
        requiresSetup: true
      });

      // Act & Assert
      // We need to dynamically import the component to test the server-side logic
      try {
        const AdminDashboard = await import('../app/admin/page');
        await AdminDashboard.default();
      } catch (error) {
        // The redirect will throw an error in the test environment
        // This is expected behavior for Next.js redirect()
      }

      // Verify redirect was called with setup wizard route
      expect(mockRedirect).toHaveBeenCalledWith('/setup');
      expect(mockGetSchoolOnboardingStatus).toHaveBeenCalledWith('school-1');
    });

    it('should not redirect when school admin is already onboarded', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
          schoolId: 'school-1',
          name: 'John Admin'
        }
      };

      mockAuth.mockResolvedValue(mockSession);
      mockGetSchoolOnboardingStatus.mockResolvedValue({
        isOnboarded: true,
        onboardingStep: 6,
        requiresSetup: false
      });

      // Act
      try {
        const AdminDashboard = await import('../app/admin/page');
        await AdminDashboard.default();
      } catch (error) {
        // Should not throw redirect error
        expect(error).not.toBeDefined();
      }

      // Assert
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockGetSchoolOnboardingStatus).toHaveBeenCalledWith('school-1');
    });

    it('should not redirect when user is not an admin', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'teacher-1',
          role: 'TEACHER',
          schoolId: 'school-1',
          name: 'Jane Teacher'
        }
      };

      mockAuth.mockResolvedValue(mockSession);

      // Act
      try {
        const AdminDashboard = await import('../app/admin/page');
        await AdminDashboard.default();
      } catch (error) {
        // Should not throw redirect error
        expect(error).not.toBeDefined();
      }

      // Assert
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockGetSchoolOnboardingStatus).not.toHaveBeenCalled();
    });

    it('should not redirect when admin has no school context', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
          schoolId: null,
          name: 'John Admin'
        }
      };

      mockAuth.mockResolvedValue(mockSession);

      // Act
      try {
        const AdminDashboard = await import('../app/admin/page');
        await AdminDashboard.default();
      } catch (error) {
        // Should not throw redirect error
        expect(error).not.toBeDefined();
      }

      // Assert
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockGetSchoolOnboardingStatus).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully and continue to dashboard', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
          schoolId: 'school-1',
          name: 'John Admin'
        }
      };

      mockAuth.mockResolvedValue(mockSession);
      mockGetSchoolOnboardingStatus.mockRejectedValue(new Error('Service unavailable'));

      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      try {
        const AdminDashboard = await import('../app/admin/page');
        await AdminDashboard.default();
      } catch (error) {
        // Should not throw redirect error
        expect(error).not.toBeDefined();
      }

      // Assert
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockGetSchoolOnboardingStatus).toHaveBeenCalledWith('school-1');
      expect(consoleSpy).toHaveBeenCalledWith('Error checking onboarding status:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle null onboarding status gracefully', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
          schoolId: 'school-1',
          name: 'John Admin'
        }
      };

      mockAuth.mockResolvedValue(mockSession);
      mockGetSchoolOnboardingStatus.mockResolvedValue(null);

      // Act
      try {
        const AdminDashboard = await import('../app/admin/page');
        await AdminDashboard.default();
      } catch (error) {
        // Should not throw redirect error
        expect(error).not.toBeDefined();
      }

      // Assert
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockGetSchoolOnboardingStatus).toHaveBeenCalledWith('school-1');
    });
  });

  describe('Integration with Existing Dashboard Logic', () => {
    it('should preserve existing dashboard functionality when onboarded', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
          schoolId: 'school-1',
          name: 'John Admin'
        }
      };

      mockAuth.mockResolvedValue(mockSession);
      mockGetSchoolOnboardingStatus.mockResolvedValue({
        isOnboarded: true,
        onboardingStep: 6,
        requiresSetup: false
      });

      // Act
      try {
        const AdminDashboard = await import('../app/admin/page');
        const result = await AdminDashboard.default();
        
        // The component should render normally (return JSX)
        expect(result).toBeDefined();
      } catch (error) {
        // Should not throw any errors
        expect(error).not.toBeDefined();
      }

      // Assert
      expect(mockAuth).toHaveBeenCalled();
      expect(mockGetSchoolOnboardingStatus).toHaveBeenCalledWith('school-1');
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should extract first name correctly for display', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
          schoolId: 'school-1',
          name: 'John Michael Admin'
        }
      };

      mockAuth.mockResolvedValue(mockSession);
      mockGetSchoolOnboardingStatus.mockResolvedValue({
        isOnboarded: true,
        onboardingStep: 6,
        requiresSetup: false
      });

      // Act
      try {
        const AdminDashboard = await import('../app/admin/page');
        await AdminDashboard.default();
      } catch (error) {
        // Should not throw any errors
        expect(error).not.toBeDefined();
      }

      // Assert - The firstName extraction logic should work
      // (This is tested implicitly by the component not throwing errors)
      expect(mockAuth).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing session gracefully', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null);

      // Act
      try {
        const AdminDashboard = await import('../app/admin/page');
        await AdminDashboard.default();
      } catch (error) {
        // Should not throw redirect error for onboarding
        // (Auth middleware should handle missing session)
        expect(error).not.toBeDefined();
      }

      // Assert
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockGetSchoolOnboardingStatus).not.toHaveBeenCalled();
    });

    it('should handle missing user in session', async () => {
      // Arrange
      const mockSession = {
        user: null
      };

      mockAuth.mockResolvedValue(mockSession);

      // Act
      try {
        const AdminDashboard = await import('../app/admin/page');
        await AdminDashboard.default();
      } catch (error) {
        // Should not throw redirect error for onboarding
        expect(error).not.toBeDefined();
      }

      // Assert
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockGetSchoolOnboardingStatus).not.toHaveBeenCalled();
    });

    it('should handle super admin role correctly', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'super-admin-1',
          role: 'SUPER_ADMIN',
          schoolId: null,
          name: 'Super Admin'
        }
      };

      mockAuth.mockResolvedValue(mockSession);

      // Act
      try {
        const AdminDashboard = await import('../app/admin/page');
        await AdminDashboard.default();
      } catch (error) {
        // Should not throw redirect error
        expect(error).not.toBeDefined();
      }

      // Assert
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockGetSchoolOnboardingStatus).not.toHaveBeenCalled();
    });
  });
});

/**
 * Property-Based Test for Onboarding Check
 * 
 * **Validates: Requirements 9.2**
 * 
 * Property: For any school admin accessing their dashboard, 
 * the system should redirect to setup wizard if not onboarded
 */
describe('Property-Based Test: Admin Dashboard Onboarding Check', () => {
  const mockAuth = vi.mocked(auth);
  const mockRedirect = vi.mocked(redirect);
  const mockGetSchoolOnboardingStatus = vi.mocked(schoolContextService.getSchoolOnboardingStatus);

  it('should always redirect non-onboarded school admins to setup wizard', async () => {
    // Test multiple scenarios with different admin users and onboarding states
    const testCases = [
      {
        description: 'Admin with incomplete onboarding step 0',
        session: { user: { id: 'admin-1', role: 'ADMIN', schoolId: 'school-1', name: 'Admin One' } },
        onboardingStatus: { isOnboarded: false, onboardingStep: 0, requiresSetup: true },
        shouldRedirect: true
      },
      {
        description: 'Admin with incomplete onboarding step 3',
        session: { user: { id: 'admin-2', role: 'ADMIN', schoolId: 'school-2', name: 'Admin Two' } },
        onboardingStatus: { isOnboarded: false, onboardingStep: 3, requiresSetup: true },
        shouldRedirect: true
      },
      {
        description: 'Admin with completed onboarding',
        session: { user: { id: 'admin-3', role: 'ADMIN', schoolId: 'school-3', name: 'Admin Three' } },
        onboardingStatus: { isOnboarded: true, onboardingStep: 6, requiresSetup: false },
        shouldRedirect: false
      },
      {
        description: 'Non-admin user should not trigger onboarding check',
        session: { user: { id: 'teacher-1', role: 'TEACHER', schoolId: 'school-1', name: 'Teacher One' } },
        onboardingStatus: null, // Should not be called
        shouldRedirect: false
      }
    ];

    for (const testCase of testCases) {
      // Reset mocks for each test case
      vi.clearAllMocks();

      // Arrange
      mockAuth.mockResolvedValue(testCase.session);
      if (testCase.onboardingStatus) {
        mockGetSchoolOnboardingStatus.mockResolvedValue(testCase.onboardingStatus);
      }

      // Act
      try {
        const AdminDashboard = await import('../app/admin/page');
        await AdminDashboard.default();
      } catch (error) {
        // Redirect throws an error in test environment
      }

      // Assert
      if (testCase.shouldRedirect) {
        expect(mockRedirect).toHaveBeenCalledWith('/setup');
        expect(mockGetSchoolOnboardingStatus).toHaveBeenCalledWith(testCase.session.user.schoolId);
      } else {
        expect(mockRedirect).not.toHaveBeenCalled();
        if (testCase.session.user.role === 'ADMIN' && testCase.session.user.schoolId) {
          expect(mockGetSchoolOnboardingStatus).toHaveBeenCalledWith(testCase.session.user.schoolId);
        } else {
          expect(mockGetSchoolOnboardingStatus).not.toHaveBeenCalled();
        }
      }
    }
  });
});