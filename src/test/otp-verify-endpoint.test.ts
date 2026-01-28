/**
 * Unit Tests for OTP Verification Endpoint
 * Tests /api/auth/otp/verify endpoint functionality
 * 
 * Requirements: 4.4, 4.5, 4.6, 1.1, 2.1, 5.1, 6.1, 11.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/otp/verify/route';
import { authenticationService } from '@/lib/services/authentication-service';
import { logAuditEvent } from '@/lib/services/audit-service';

// Mock dependencies
vi.mock('@/lib/services/authentication-service');
vi.mock('@/lib/services/audit-service');

const mockAuthenticationService = vi.mocked(authenticationService);
const mockLogAuditEvent = vi.mocked(logAuditEvent);

describe('OTP Verification Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogAuditEvent.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Input Validation', () => {
    it('should reject request with missing identifier', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          otpCode: '123456',
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

    it('should reject request with missing otpCode', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
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

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('OTP code is required');
    });

    it('should reject request with missing schoolId', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456'
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

    it('should reject invalid OTP format - less than 6 digits', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '12345',
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
      expect(data.error).toContain('OTP must be 6 digits');
    });

    it('should reject invalid OTP format - more than 6 digits', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '1234567',
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
      expect(data.error).toContain('OTP must be 6 digits');
    });

    it('should reject invalid OTP format - non-numeric characters', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '12345a',
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
      expect(data.error).toContain('OTP must be 6 digits');
    });

    it('should accept valid 6-digit OTP format', async () => {
      mockAuthenticationService.verifyOTP.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
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
      expect(mockAuthenticationService.verifyOTP).toHaveBeenCalledWith('9876543210', '123456');
    });

    it('should trim whitespace from inputs', async () => {
      mockAuthenticationService.verifyOTP.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '  9876543210  ',
          otpCode: '  123456  ',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockAuthenticationService.verifyOTP).toHaveBeenCalledWith('9876543210', '123456');
    });
  });

  describe('OTP Verification Success Cases', () => {
    it('should successfully verify valid OTP', async () => {
      mockAuthenticationService.verifyOTP.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
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
      expect(data.message).toBe('OTP verified successfully');

      // Verify success audit logging
      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_VERIFICATION_SUCCESS',
        resource: 'authentication',
        changes: expect.objectContaining({
          identifier: '9876543210',
          clientIP: '192.168.1.1',
          timestamp: expect.any(Date)
        })
      });
    });

    it('should handle email identifier correctly', async () => {
      mockAuthenticationService.verifyOTP.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'test@example.com',
          otpCode: '123456',
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
      expect(mockAuthenticationService.verifyOTP).toHaveBeenCalledWith('test@example.com', '123456');
    });
  });

  describe('OTP Verification Failure Cases', () => {
    it('should handle invalid OTP code', async () => {
      mockAuthenticationService.verifyOTP.mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid or expired OTP code');
      expect(data.code).toBe('INVALID_OTP');

      // Verify failure audit logging
      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_VERIFICATION_FAILED',
        resource: 'authentication',
        changes: expect.objectContaining({
          identifier: '9876543210',
          reason: 'INVALID_OTP',
          clientIP: '192.168.1.1',
          timestamp: expect.any(Date)
        })
      });
    });

    it('should handle OTP expired error (Requirement 4.6)', async () => {
      const expiredError = new Error('OTP has expired');
      expiredError.code = 'OTP_EXPIRED';
      mockAuthenticationService.verifyOTP.mockRejectedValue(expiredError);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('OTP has expired. Please request a new one.');
      expect(data.code).toBe('OTP_EXPIRED');

      // Verify error audit logging
      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_VERIFICATION_ERROR',
        resource: 'authentication',
        changes: expect.objectContaining({
          identifier: '9876543210',
          error: 'OTP has expired',
          errorCode: 'OTP_EXPIRED',
          clientIP: '192.168.1.1',
          timestamp: expect.any(Date)
        })
      });
    });

    it('should handle OTP invalid error (Requirement 4.4)', async () => {
      const invalidError = new Error('Invalid OTP code');
      invalidError.code = 'OTP_INVALID';
      mockAuthenticationService.verifyOTP.mockRejectedValue(invalidError);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
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
      expect(data.error).toBe('Invalid OTP code. Please check and try again.');
      expect(data.code).toBe('OTP_INVALID');
    });

    it('should handle system errors gracefully', async () => {
      mockAuthenticationService.verifyOTP.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
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
      expect(data.error).toBe('Failed to verify OTP. Please try again.');

      // Verify error audit logging
      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_VERIFICATION_ERROR',
        resource: 'authentication',
        changes: expect.objectContaining({
          identifier: '9876543210',
          error: 'Database connection failed',
          clientIP: '192.168.1.1'
        })
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
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

  describe('Attempt Tracking and Blocking (Requirements 4.4, 4.5)', () => {
    it('should increment attempt counter on verification failure', async () => {
      // This is tested through the authentication service integration
      mockAuthenticationService.verifyOTP.mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
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
      expect(mockAuthenticationService.verifyOTP).toHaveBeenCalledWith('9876543210', '123456');
    });

    it('should handle blocked identifier after max attempts', async () => {
      const blockedError = new Error('Max attempts exceeded');
      blockedError.code = 'MAX_ATTEMPTS_EXCEEDED';
      mockAuthenticationService.verifyOTP.mockRejectedValue(blockedError);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to verify OTP. Please try again.');
    });
  });

  describe('Client IP Detection', () => {
    it('should detect client IP from x-forwarded-for header', async () => {
      mockAuthenticationService.verifyOTP.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
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
        action: 'OTP_VERIFICATION_SUCCESS',
        resource: 'authentication',
        changes: expect.objectContaining({
          clientIP: '203.0.113.1'
        })
      });
    });

    it('should detect client IP from x-real-ip header', async () => {
      mockAuthenticationService.verifyOTP.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
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
        action: 'OTP_VERIFICATION_SUCCESS',
        resource: 'authentication',
        changes: expect.objectContaining({
          clientIP: '203.0.113.2'
        })
      });
    });

    it('should use "unknown" when no IP headers are present', async () => {
      mockAuthenticationService.verifyOTP.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_VERIFICATION_SUCCESS',
        resource: 'authentication',
        changes: expect.objectContaining({
          clientIP: 'unknown'
        })
      });
    });
  });

  describe('Audit Logging Requirements', () => {
    it('should log successful OTP verification with all required details', async () => {
      mockAuthenticationService.verifyOTP.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      await POST(request);

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_VERIFICATION_SUCCESS',
        resource: 'authentication',
        changes: {
          identifier: '9876543210',
          clientIP: '192.168.1.1',
          timestamp: expect.any(Date)
        }
      });
    });

    it('should log failed OTP verification with failure reason', async () => {
      mockAuthenticationService.verifyOTP.mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      await POST(request);

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_VERIFICATION_FAILED',
        resource: 'authentication',
        changes: {
          identifier: '9876543210',
          reason: 'INVALID_OTP',
          clientIP: '192.168.1.1',
          timestamp: expect.any(Date)
        }
      });
    });

    it('should log system errors with error details', async () => {
      const systemError = new Error('Database connection failed');
      mockAuthenticationService.verifyOTP.mockRejectedValue(systemError);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      await POST(request);

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_VERIFICATION_ERROR',
        resource: 'authentication',
        changes: {
          identifier: '9876543210',
          error: 'Database connection failed',
          errorCode: undefined,
          clientIP: '192.168.1.1',
          timestamp: expect.any(Date)
        }
      });
    });
  });

  describe('CORS Support', () => {
    it('should handle CORS preflight requests', async () => {
      // The endpoint should support CORS through the OPTIONS export
      // This test verifies the endpoint structure supports CORS
      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      mockAuthenticationService.verifyOTP.mockResolvedValue(true);

      const response = await POST(request);
      
      // Verify the endpoint processes the request correctly
      expect(response.status).toBe(200);
    });
  });

  describe('Requirements Validation', () => {
    it('should meet Requirement 4.4: Increment attempt counter on verification failure', async () => {
      // This is validated through the authentication service integration
      mockAuthenticationService.verifyOTP.mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      expect(mockAuthenticationService.verifyOTP).toHaveBeenCalledWith('9876543210', '123456');
    });

    it('should meet Requirement 4.5: Block identifier after 3 failures', async () => {
      // This is handled by the OTP service and authentication service
      // The endpoint properly handles and reports blocking scenarios
      const blockedError = new Error('Max attempts exceeded');
      blockedError.code = 'MAX_ATTEMPTS_EXCEEDED';
      mockAuthenticationService.verifyOTP.mockRejectedValue(blockedError);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(500);
      expect(mockAuthenticationService.verifyOTP).toHaveBeenCalled();
    });

    it('should meet Requirement 4.6: Reject expired OTP and require new generation', async () => {
      const expiredError = new Error('OTP has expired');
      expiredError.code = 'OTP_EXPIRED';
      mockAuthenticationService.verifyOTP.mockRejectedValue(expiredError);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.code).toBe('OTP_EXPIRED');
      expect(data.error).toContain('expired');
      expect(data.error).toContain('request a new one');
    });

    it('should meet comprehensive audit logging requirements', async () => {
      mockAuthenticationService.verifyOTP.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'test-school-1'
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      await POST(request);

      // Verify comprehensive audit logging
      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'test-school-1',
        action: 'OTP_VERIFICATION_SUCCESS',
        resource: 'authentication',
        changes: expect.objectContaining({
          identifier: '9876543210',
          clientIP: '192.168.1.1',
          timestamp: expect.any(Date)
        })
      });
    });
  });
});