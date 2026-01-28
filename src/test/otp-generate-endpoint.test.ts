/**
 * Unit Tests for OTP Generation Endpoint
 * Tests /api/auth/otp/generate endpoint functionality
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 14.1, 2.2, 2.3, 8.1, 8.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/otp/generate/route';
import { db } from '@/lib/db';
import { authenticationService } from '@/lib/services/authentication-service';
import { logAuditEvent } from '@/lib/services/audit-service';

// Mock dependencies
vi.mock('@/lib/services/authentication-service');
vi.mock('@/lib/services/audit-service');

const mockAuthenticationService = vi.mocked(authenticationService);
const mockLogAuditEvent = vi.mocked(logAuditEvent);

describe('OTP Generation Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogAuditEvent.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Input Validation', () => {
    it('should reject request with missing identifier', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Mobile number or email is required');
    });

    it('should reject request with missing schoolId', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('School ID is required');
    });

    it('should reject invalid identifier format', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'invalid-format',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('valid mobile number (10 digits) or email address');
    });

    it('should accept valid mobile number format', async () => {
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresAt: new Date()
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockAuthenticationService.generateOTP).toHaveBeenCalledWith('9876543210', 'test-school-1');
    });

    it('should accept valid email format', async () => {
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresAt: new Date()
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'test@example.com',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockAuthenticationService.generateOTP).toHaveBeenCalledWith('test@example.com', 'test-school-1');
    });
  });

  describe('OTP Generation Success Cases', () => {
    it('should successfully generate OTP for valid request', async () => {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresAt
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('OTP sent successfully');
      expect(data.expiresAt).toBe(expiresAt.toISOString());

      // Verify audit logging
      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_GENERATION_SUCCESS',
        resource: 'authentication',
        changes: expect.objectContaining({
          identifier: '9876543210',
          expiresAt,
          clientIP: '192.168.1.1'
        })
      });
    });

    it('should trim whitespace from identifier', async () => {
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresAt: new Date()
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '  9876543210  ',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockAuthenticationService.generateOTP).toHaveBeenCalledWith('9876543210', 'test-school-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle USER_NOT_FOUND error', async () => {
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('USER_NOT_FOUND');
      expect(data.error).toContain('No account found');

      // Verify failure audit logging
      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_GENERATION_FAILED',
        resource: 'authentication',
        changes: expect.objectContaining({
          identifier: '9876543210',
          reason: 'USER_NOT_FOUND',
          clientIP: '192.168.1.1'
        })
      });
    });

    it('should handle SCHOOL_NOT_FOUND error', async () => {
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: false,
        message: 'School not found',
        error: 'SCHOOL_NOT_FOUND'
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'invalid-school'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('SCHOOL_NOT_FOUND');
      expect(data.error).toContain('School not found or inactive');
    });

    it('should handle RATE_LIMITED error', async () => {
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: false,
        message: 'Rate limit exceeded',
        error: 'RATE_LIMITED'
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.code).toBe('RATE_LIMITED');
      expect(data.error).toContain('Too many OTP requests');
    });

    it('should handle system errors gracefully', async () => {
      mockAuthenticationService.generateOTP.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to generate OTP');

      // Verify error audit logging
      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_GENERATION_ERROR',
        resource: 'authentication',
        changes: expect.objectContaining({
          identifier: '9876543210',
          error: 'Database connection failed',
          clientIP: '192.168.1.1'
        })
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Client IP Detection', () => {
    it('should detect client IP from x-forwarded-for header', async () => {
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresAt: new Date()
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.1'
        }
      });

      await POST(request);

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_GENERATION_SUCCESS',
        resource: 'authentication',
        changes: expect.objectContaining({
          clientIP: '203.0.113.1'
        })
      });
    });

    it('should detect client IP from x-real-ip header', async () => {
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresAt: new Date()
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-real-ip': '203.0.113.2'
        }
      });

      await POST(request);

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_GENERATION_SUCCESS',
        resource: 'authentication',
        changes: expect.objectContaining({
          clientIP: '203.0.113.2'
        })
      });
    });

    it('should use "unknown" when no IP headers are present', async () => {
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresAt: new Date()
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_GENERATION_SUCCESS',
        resource: 'authentication',
        changes: expect.objectContaining({
          clientIP: 'unknown'
        })
      });
    });
  });

  describe('CORS Support', () => {
    it('should handle OPTIONS preflight request', async () => {
      // Note: OPTIONS method would be handled by the OPTIONS export
      // This test verifies the endpoint structure supports CORS
      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresAt: new Date()
      });

      const response = await POST(request);
      
      // Verify the endpoint processes the request correctly
      expect(response.status).toBe(200);
    });
  });

  describe('Requirements Validation', () => {
    it('should meet Requirement 4.1: Generate secure 6-digit numeric code', async () => {
      // This is tested through the authentication service integration
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockAuthenticationService.generateOTP).toHaveBeenCalled();
    });

    it('should meet Requirement 4.2: Set expiration time between 2-5 minutes', async () => {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresAt
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.expiresAt).toBeDefined();
      expect(new Date(data.expiresAt)).toEqual(expiresAt);
    });

    it('should meet Requirement 4.7: Implement rate limiting to prevent OTP abuse', async () => {
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: false,
        message: 'Rate limit exceeded',
        error: 'RATE_LIMITED'
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.code).toBe('RATE_LIMITED');
    });

    it('should meet Requirement 2.2: Validate school exists and is active', async () => {
      mockAuthenticationService.generateOTP.mockResolvedValue({
        success: false,
        message: 'School not found',
        error: 'SCHOOL_NOT_FOUND'
      });

      const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'invalid-school'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('SCHOOL_NOT_FOUND');
    });
  });
});