/**
 * Property-Based Tests for OTP Verification Endpoint
 * Tests universal properties of /api/auth/otp/verify endpoint
 * 
 * **Feature: unified-auth-multitenant-refactor**
 * **Validates: Requirements 4.4, 4.5, 4.6, 1.1, 2.1, 5.1, 6.1, 11.1**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import fc from 'fast-check';
import { POST } from '@/app/api/auth/otp/verify/route';
import { authenticationService } from '@/lib/services/authentication-service';
import { logAuditEvent } from '@/lib/services/audit-service';

// Mock dependencies
vi.mock('@/lib/services/authentication-service');
vi.mock('@/lib/services/audit-service');

const mockAuthenticationService = vi.mocked(authenticationService);
const mockLogAuditEvent = vi.mocked(logAuditEvent);

describe('OTP Verification Endpoint - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogAuditEvent.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  /**
   * **Property 1: Input Validation Consistency**
   * For any request with invalid input parameters, the endpoint should consistently
   * return 400 status with appropriate error messages without calling the authentication service
   * **Validates: Requirements 1.1, 2.1**
   */
  it('Property 1: Input validation consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(''),
            fc.string().filter(s => s.trim() === ''),
            fc.integer() // Invalid type
          ),
          otpCode: fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(''),
            fc.string().filter(s => s.trim() === ''),
            fc.string().filter(s => !/^\d{6}$/.test(s.trim())), // Invalid format
            fc.integer() // Invalid type
          ),
          schoolId: fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(''),
            fc.string().filter(s => s.trim() === ''),
            fc.integer() // Invalid type
          )
        }),
        async (invalidInput) => {
          const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
            method: 'POST',
            body: JSON.stringify(invalidInput),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const response = await POST(request);
          const data = await response.json();

          // Should return 400 for invalid input
          expect(response.status).toBe(400);
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();
          expect(typeof data.error).toBe('string');
          expect(data.error.length).toBeGreaterThan(0);

          // Should not call authentication service for invalid input
          expect(mockAuthenticationService.verifyOTP).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Property 2: Valid Input Processing**
   * For any request with valid input parameters (valid identifier, 6-digit OTP, valid schoolId),
   * the endpoint should call the authentication service and return appropriate response
   * **Validates: Requirements 4.4, 4.6**
   */
  it('Property 2: Valid input processing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{10}$/.test(s)), // Valid mobile
            fc.emailAddress() // Valid email
          ),
          otpCode: fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s)), // Valid 6-digit OTP
          schoolId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Valid school ID
          verificationResult: fc.boolean() // Mock result from authentication service
        }),
        async ({ identifier, otpCode, schoolId, verificationResult }) => {
          mockAuthenticationService.verifyOTP.mockResolvedValue(verificationResult);

          const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
            method: 'POST',
            body: JSON.stringify({
              identifier,
              otpCode,
              schoolId
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const response = await POST(request);
          const data = await response.json();

          // Should call authentication service with trimmed inputs
          expect(mockAuthenticationService.verifyOTP).toHaveBeenCalledWith(
            identifier.trim(),
            otpCode.trim()
          );

          // Response should match verification result
          if (verificationResult) {
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.message).toBe('OTP verified successfully');
          } else {
            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.code).toBe('INVALID_OTP');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 3: Audit Logging Consistency**
   * For any valid request, the endpoint should always log audit events with consistent structure
   * regardless of verification success or failure
   * **Validates: Requirements 11.1**
   */
  it('Property 3: Audit logging consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{10}$/.test(s)),
            fc.emailAddress()
          ),
          otpCode: fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s)),
          schoolId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          verificationResult: fc.boolean(),
          clientIP: fc.oneof(
            fc.ipV4(),
            fc.ipV6(),
            fc.constant('unknown')
          )
        }),
        async ({ identifier, otpCode, schoolId, verificationResult, clientIP }) => {
          mockAuthenticationService.verifyOTP.mockResolvedValue(verificationResult);

          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          
          if (clientIP !== 'unknown') {
            headers['x-forwarded-for'] = clientIP;
          }

          const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
            method: 'POST',
            body: JSON.stringify({
              identifier,
              otpCode,
              schoolId
            }),
            headers
          });

          await POST(request);

          // Should always log audit event
          expect(mockLogAuditEvent).toHaveBeenCalled();
          
          const auditCall = mockLogAuditEvent.mock.calls[0][0];
          expect(auditCall.schoolId).toBe(schoolId);
          expect(auditCall.resource).toBe('authentication');
          expect(auditCall.changes.identifier).toBe(identifier.trim());
          expect(auditCall.changes.clientIP).toBe(clientIP);
          expect(auditCall.changes.timestamp).toBeInstanceOf(Date);

          // Action should match verification result
          if (verificationResult) {
            expect(auditCall.action).toBe('OTP_VERIFICATION_SUCCESS');
          } else {
            expect(auditCall.action).toBe('OTP_VERIFICATION_FAILED');
            expect(auditCall.changes.reason).toBe('INVALID_OTP');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 4: Error Handling Consistency**
   * For any authentication service error, the endpoint should handle it gracefully
   * and return appropriate error responses with consistent structure
   * **Validates: Requirements 4.5, 4.6**
   */
  it('Property 4: Error handling consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{10}$/.test(s)),
            fc.emailAddress()
          ),
          otpCode: fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s)),
          schoolId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          errorType: fc.oneof(
            fc.constant('OTP_EXPIRED'),
            fc.constant('OTP_INVALID'),
            fc.constant('MAX_ATTEMPTS_EXCEEDED'),
            fc.constant('SYSTEM_ERROR')
          ),
          errorMessage: fc.string({ minLength: 1, maxLength: 100 })
        }),
        async ({ identifier, otpCode, schoolId, errorType, errorMessage }) => {
          const error = new Error(errorMessage);
          if (errorType !== 'SYSTEM_ERROR') {
            error.code = errorType;
          }
          mockAuthenticationService.verifyOTP.mockRejectedValue(error);

          const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
            method: 'POST',
            body: JSON.stringify({
              identifier,
              otpCode,
              schoolId
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const response = await POST(request);
          const data = await response.json();

          // Should always return error response
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();
          expect(typeof data.error).toBe('string');

          // Status and error message should match error type
          if (errorType === 'OTP_EXPIRED') {
            expect(response.status).toBe(400);
            expect(data.code).toBe('OTP_EXPIRED');
            expect(data.error).toContain('expired');
          } else if (errorType === 'OTP_INVALID') {
            expect(response.status).toBe(400);
            expect(data.code).toBe('OTP_INVALID');
            expect(data.error).toContain('Invalid OTP');
          } else {
            expect(response.status).toBe(500);
            expect(data.error).toContain('Failed to verify OTP');
          }

          // Should log error audit event
          expect(mockLogAuditEvent).toHaveBeenCalledWith({
            schoolId,
            action: 'OTP_VERIFICATION_ERROR',
            resource: 'authentication',
            changes: expect.objectContaining({
              identifier: identifier.trim(),
              error: errorMessage,
              errorCode: errorType !== 'SYSTEM_ERROR' ? errorType : undefined
            })
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 5: Input Sanitization**
   * For any input with whitespace, the endpoint should consistently trim whitespace
   * before processing and maintain data integrity
   * **Validates: Requirements 1.1, 2.1**
   */
  it('Property 5: Input sanitization', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{10}$/.test(s)),
            fc.emailAddress()
          ),
          otpCode: fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s)),
          schoolId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          leadingSpaces: fc.integer({ min: 0, max: 5 }),
          trailingSpaces: fc.integer({ min: 0, max: 5 }),
          verificationResult: fc.boolean()
        }),
        async ({ identifier, otpCode, schoolId, leadingSpaces, trailingSpaces, verificationResult }) => {
          mockAuthenticationService.verifyOTP.mockResolvedValue(verificationResult);

          // Add whitespace to inputs
          const paddedIdentifier = ' '.repeat(leadingSpaces) + identifier + ' '.repeat(trailingSpaces);
          const paddedOtpCode = ' '.repeat(leadingSpaces) + otpCode + ' '.repeat(trailingSpaces);

          const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
            method: 'POST',
            body: JSON.stringify({
              identifier: paddedIdentifier,
              otpCode: paddedOtpCode,
              schoolId
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          await POST(request);

          // Should call authentication service with trimmed inputs
          expect(mockAuthenticationService.verifyOTP).toHaveBeenCalledWith(
            identifier, // Original without padding
            otpCode     // Original without padding
          );

          // Audit log should contain trimmed identifier
          expect(mockLogAuditEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              changes: expect.objectContaining({
                identifier: identifier // Trimmed
              })
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 6: Response Structure Consistency**
   * For any request, the endpoint should return a response with consistent structure
   * containing required fields based on success/failure status
   * **Validates: Requirements 1.1, 4.4, 4.5, 4.6**
   */
  it('Property 6: Response structure consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{10}$/.test(s)),
            fc.emailAddress()
          ),
          otpCode: fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s)),
          schoolId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          scenario: fc.oneof(
            fc.constant('success'),
            fc.constant('invalid_otp'),
            fc.constant('expired_otp'),
            fc.constant('system_error')
          )
        }),
        async ({ identifier, otpCode, schoolId, scenario }) => {
          // Setup mock based on scenario
          switch (scenario) {
            case 'success':
              mockAuthenticationService.verifyOTP.mockResolvedValue(true);
              break;
            case 'invalid_otp':
              mockAuthenticationService.verifyOTP.mockResolvedValue(false);
              break;
            case 'expired_otp':
              const expiredError = new Error('OTP expired');
              expiredError.code = 'OTP_EXPIRED';
              mockAuthenticationService.verifyOTP.mockRejectedValue(expiredError);
              break;
            case 'system_error':
              mockAuthenticationService.verifyOTP.mockRejectedValue(new Error('System error'));
              break;
          }

          const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
            method: 'POST',
            body: JSON.stringify({
              identifier,
              otpCode,
              schoolId
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const response = await POST(request);
          const data = await response.json();

          // All responses should have success field
          expect(data).toHaveProperty('success');
          expect(typeof data.success).toBe('boolean');

          if (data.success) {
            // Success responses should have message
            expect(data).toHaveProperty('message');
            expect(typeof data.message).toBe('string');
            expect(data.message.length).toBeGreaterThan(0);
            expect(response.status).toBe(200);
          } else {
            // Error responses should have error field
            expect(data).toHaveProperty('error');
            expect(typeof data.error).toBe('string');
            expect(data.error.length).toBeGreaterThan(0);
            expect(response.status).toBeGreaterThanOrEqual(400);

            // Some error responses should have code field
            if (scenario === 'invalid_otp' || scenario === 'expired_otp') {
              expect(data).toHaveProperty('code');
              expect(typeof data.code).toBe('string');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 7: Client IP Detection Consistency**
   * For any request with IP headers, the endpoint should consistently detect and log
   * the client IP address in audit events
   * **Validates: Requirements 11.1**
   */
  it('Property 7: Client IP detection consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{10}$/.test(s)),
            fc.emailAddress()
          ),
          otpCode: fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s)),
          schoolId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          ipHeader: fc.oneof(
            fc.constant('x-forwarded-for'),
            fc.constant('x-real-ip'),
            fc.constant(null) // No IP header
          ),
          ipAddress: fc.oneof(
            fc.ipV4(),
            fc.ipV6()
          ),
          verificationResult: fc.boolean()
        }),
        async ({ identifier, otpCode, schoolId, ipHeader, ipAddress, verificationResult }) => {
          mockAuthenticationService.verifyOTP.mockResolvedValue(verificationResult);

          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          
          if (ipHeader) {
            headers[ipHeader] = ipAddress;
          }

          const request = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
            method: 'POST',
            body: JSON.stringify({
              identifier,
              otpCode,
              schoolId
            }),
            headers
          });

          await POST(request);

          // Should log audit event with correct IP
          expect(mockLogAuditEvent).toHaveBeenCalled();
          const auditCall = mockLogAuditEvent.mock.calls[0][0];
          
          if (ipHeader) {
            expect(auditCall.changes.clientIP).toBe(ipAddress);
          } else {
            expect(auditCall.changes.clientIP).toBe('unknown');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});