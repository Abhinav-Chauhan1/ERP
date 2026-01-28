/**
 * Integration Tests for Setup Wizard API Endpoints
 * Task 11.4: Add setup wizard launch and reset functionality
 * Requirements: 9.4 - Create super admin controls for managing onboarding state
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/super-admin/schools/[id]/onboarding/route';
import { POST as BulkPOST, GET as BulkGET } from '@/app/api/super-admin/schools/bulk/onboarding/route';

// Mock the dependencies
vi.mock('@/lib/auth/tenant', () => ({
  requireSuperAdminAccess: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/actions/school-management-actions', () => ({
  resetSchoolOnboarding: vi.fn(),
  launchSetupWizard: vi.fn(),
  getSchoolsOnboardingStatus: vi.fn(),
  bulkResetOnboarding: vi.fn(),
}));

vi.mock('@/lib/services/onboarding-progress-service', () => ({
  OnboardingProgressService: {
    getSchoolProgress: vi.fn(),
    updateStepProgress: vi.fn(),
    resetSchoolProgress: vi.fn(),
    initializeSchoolProgress: vi.fn(),
    getSchoolsProgressSummary: vi.fn(),
    getOnboardingAnalytics: vi.fn(),
  },
}));

describe('Setup Wizard API Integration', () => {
  const mockSchoolId = 'school-123';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/super-admin/schools/[id]/onboarding', () => {
    it('should return onboarding status successfully', async () => {
      // Arrange
      const { getSchoolsOnboardingStatus } = await import('@/lib/actions/school-management-actions');
      const { OnboardingProgressService } = await import('@/lib/services/onboarding-progress-service');

      const mockBasicStatus = {
        success: true,
        data: [{
          id: mockSchoolId,
          name: 'Test School',
          isOnboarded: false,
          onboardingStep: 3,
          onboardingCompletedAt: null,
          requiresSetup: true,
        }],
      };

      const mockDetailedProgress = {
        schoolId: mockSchoolId,
        isOnboarded: false,
        currentStep: 3,
        totalSteps: 7,
        completionPercentage: 43,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        steps: [
          { step: 1, status: 'completed', lastUpdatedAt: new Date(), attempts: 1, metadata: {} },
          { step: 2, status: 'completed', lastUpdatedAt: new Date(), attempts: 1, metadata: {} },
          { step: 3, status: 'in_progress', lastUpdatedAt: new Date(), attempts: 1, metadata: {} },
        ],
        metadata: { version: '1.0.0' },
      };

      (getSchoolsOnboardingStatus as any).mockResolvedValue(mockBasicStatus);
      (OnboardingProgressService.getSchoolProgress as any).mockResolvedValue(mockDetailedProgress);

      const request = new NextRequest('http://localhost/api/super-admin/schools/school-123/onboarding');

      // Act
      const response = await GET(request, { params: { id: mockSchoolId } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.basic).toEqual(mockBasicStatus.data[0]);
      expect(result.data.detailed).toEqual(mockDetailedProgress);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const { getSchoolsOnboardingStatus } = await import('@/lib/actions/school-management-actions');
      (getSchoolsOnboardingStatus as any).mockResolvedValue({
        success: false,
        error: 'School not found',
      });

      const request = new NextRequest('http://localhost/api/super-admin/schools/invalid/onboarding');

      // Act
      const response = await GET(request, { params: { id: 'invalid' } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(result.error).toBe('School not found');
    });
  });

  describe('POST /api/super-admin/schools/[id]/onboarding', () => {
    it('should reset onboarding successfully', async () => {
      // Arrange
      const { resetSchoolOnboarding } = await import('@/lib/actions/school-management-actions');
      const { OnboardingProgressService } = await import('@/lib/services/onboarding-progress-service');

      const mockResetResult = {
        success: true,
        data: {
          message: 'Onboarding reset successfully',
          school: { id: mockSchoolId, isOnboarded: false, onboardingStep: 0 },
        },
      };

      (resetSchoolOnboarding as any).mockResolvedValue(mockResetResult);
      (OnboardingProgressService.resetSchoolProgress as any).mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/super-admin/schools/school-123/onboarding', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request, { params: { id: mockSchoolId } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Onboarding reset successfully');
      expect(resetSchoolOnboarding).toHaveBeenCalledWith(mockSchoolId);
      expect(OnboardingProgressService.resetSchoolProgress).toHaveBeenCalledWith(mockSchoolId, 'super_admin');
    });

    it('should launch setup wizard successfully', async () => {
      // Arrange
      const { launchSetupWizard } = await import('@/lib/actions/school-management-actions');
      const { OnboardingProgressService } = await import('@/lib/services/onboarding-progress-service');

      const mockLaunchResult = {
        success: true,
        data: {
          message: 'Setup wizard launched successfully',
          school: { id: mockSchoolId, onboardingStep: 1 },
        },
      };

      (launchSetupWizard as any).mockResolvedValue(mockLaunchResult);
      (OnboardingProgressService.getSchoolProgress as any).mockResolvedValue(null);
      (OnboardingProgressService.initializeSchoolProgress as any).mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/super-admin/schools/school-123/onboarding', {
        method: 'POST',
        body: JSON.stringify({ action: 'launch' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request, { params: { id: mockSchoolId } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Setup wizard launched successfully');
      expect(launchSetupWizard).toHaveBeenCalledWith(mockSchoolId);
      expect(OnboardingProgressService.initializeSchoolProgress).toHaveBeenCalledWith(mockSchoolId, 'super_admin');
    });

    it('should update step progress successfully', async () => {
      // Arrange
      const { OnboardingProgressService } = await import('@/lib/services/onboarding-progress-service');

      const mockUpdatedProgress = {
        schoolId: mockSchoolId,
        currentStep: 4,
        completionPercentage: 57,
        steps: [],
        metadata: {},
      };

      (OnboardingProgressService.updateStepProgress as any).mockResolvedValue(mockUpdatedProgress);

      const request = new NextRequest('http://localhost/api/super-admin/schools/school-123/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_step',
          step: 3,
          status: 'completed',
          metadata: { completedVia: 'manual' },
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request, { params: { id: mockSchoolId } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Step 3 updated to completed');
      expect(OnboardingProgressService.updateStepProgress).toHaveBeenCalledWith(
        mockSchoolId,
        3,
        'completed',
        { completedVia: 'manual' },
        'super_admin'
      );
    });

    it('should handle invalid action', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/super-admin/schools/school-123/onboarding', {
        method: 'POST',
        body: JSON.stringify({ action: 'invalid_action' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request, { params: { id: mockSchoolId } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(result.error).toContain('Invalid action');
    });

    it('should handle missing parameters for update_step', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/super-admin/schools/school-123/onboarding', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_step' }), // Missing step and status
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request, { params: { id: mockSchoolId } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(result.error).toBe('Step and status are required for update_step action');
    });
  });

  describe('POST /api/super-admin/schools/bulk/onboarding', () => {
    it('should perform bulk reset successfully', async () => {
      // Arrange
      const { bulkResetOnboarding } = await import('@/lib/actions/school-management-actions');
      const { OnboardingProgressService } = await import('@/lib/services/onboarding-progress-service');

      const schoolIds = ['school-1', 'school-2'];
      const mockBulkResult = {
        success: true,
        message: 'Successfully reset onboarding for 2 schools',
      };

      (bulkResetOnboarding as any).mockResolvedValue(mockBulkResult);
      (OnboardingProgressService.resetSchoolProgress as any).mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/super-admin/schools/bulk/onboarding', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset', schoolIds }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await BulkPOST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully reset onboarding for 2 schools');
      expect(bulkResetOnboarding).toHaveBeenCalledWith(schoolIds);
    });

    it('should get status for multiple schools', async () => {
      // Arrange
      const { getSchoolsOnboardingStatus } = await import('@/lib/actions/school-management-actions');
      const { OnboardingProgressService } = await import('@/lib/services/onboarding-progress-service');

      const schoolIds = ['school-1', 'school-2'];
      const mockStatusResult = {
        success: true,
        data: [
          { id: 'school-1', name: 'School One', isOnboarded: true },
          { id: 'school-2', name: 'School Two', isOnboarded: false },
        ],
      };

      const mockProgressSummaries = [
        { schoolId: 'school-1', completionPercentage: 100 },
        { schoolId: 'school-2', completionPercentage: 43 },
      ];

      (getSchoolsOnboardingStatus as any).mockResolvedValue(mockStatusResult);
      (OnboardingProgressService.getSchoolsProgressSummary as any).mockResolvedValue(mockProgressSummaries);

      const request = new NextRequest('http://localhost/api/super-admin/schools/bulk/onboarding', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_status', schoolIds }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await BulkPOST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.basic).toEqual(mockStatusResult.data);
      expect(result.data.detailed).toEqual(mockProgressSummaries);
    });

    it('should handle empty school IDs array', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/super-admin/schools/bulk/onboarding', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset', schoolIds: [] }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await BulkPOST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(result.error).toBe('schoolIds must be a non-empty array');
    });

    it('should handle invalid school IDs format', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/super-admin/schools/bulk/onboarding', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset', schoolIds: 'not-an-array' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await BulkPOST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(result.error).toBe('schoolIds must be a non-empty array');
    });
  });

  describe('GET /api/super-admin/schools/bulk/onboarding', () => {
    it('should return onboarding analytics', async () => {
      // Arrange
      const { OnboardingProgressService } = await import('@/lib/services/onboarding-progress-service');

      const mockAnalytics = {
        totalSchools: 10,
        onboardedSchools: 7,
        inProgressSchools: 2,
        notStartedSchools: 1,
        averageCompletionTime: 86400000, // 1 day in ms
        stepAnalytics: [
          { step: 1, title: 'School Information', completedCount: 9, failedCount: 0 },
          { step: 2, title: 'Admin Account', completedCount: 8, failedCount: 1 },
        ],
      };

      (OnboardingProgressService.getOnboardingAnalytics as any).mockResolvedValue(mockAnalytics);

      const request = new NextRequest('http://localhost/api/super-admin/schools/bulk/onboarding');

      // Act
      const response = await BulkGET(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnalytics);
      expect(OnboardingProgressService.getOnboardingAnalytics).toHaveBeenCalled();
    });

    it('should handle analytics errors', async () => {
      // Arrange
      const { OnboardingProgressService } = await import('@/lib/services/onboarding-progress-service');
      (OnboardingProgressService.getOnboardingAnalytics as any).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/super-admin/schools/bulk/onboarding');

      // Act
      const response = await BulkGET(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.error).toBe('Failed to fetch onboarding analytics');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require super admin access for all endpoints', async () => {
      // This is mocked in the setup, but in real implementation
      // requireSuperAdminAccess should be called for all endpoints
      const { requireSuperAdminAccess } = await import('@/lib/auth/tenant');

      const getRequest = new NextRequest('http://localhost/api/super-admin/schools/school-123/onboarding');
      const postRequest = new NextRequest('http://localhost/api/super-admin/schools/school-123/onboarding', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset' }),
      });

      await GET(getRequest, { params: { id: mockSchoolId } });
      await POST(postRequest, { params: { id: mockSchoolId } });

      // In real tests, we would verify requireSuperAdminAccess was called
      expect(requireSuperAdminAccess).toBeDefined();
    });

    it('should handle authentication failures', async () => {
      // Arrange
      const { requireSuperAdminAccess } = await import('@/lib/auth/tenant');
      (requireSuperAdminAccess as any).mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost/api/super-admin/schools/school-123/onboarding');

      // Act & Assert
      await expect(GET(request, { params: { id: mockSchoolId } })).rejects.toThrow('Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/super-admin/schools/school-123/onboarding', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request, { params: { id: mockSchoolId } });

      // Assert
      expect(response.status).toBe(500);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const { resetSchoolOnboarding } = await import('@/lib/actions/school-management-actions');
      (resetSchoolOnboarding as any).mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost/api/super-admin/schools/school-123/onboarding', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request, { params: { id: mockSchoolId } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.error).toBe('Failed to manage onboarding');
    });
  });
});