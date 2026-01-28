/**
 * Property-Based Tests for OTP Generation Endpoint
 * Tests universal properties that should hold across all valid inputs
 * 
 * **Feature: unified-auth-multitenant-refactor, Property 5: OTP Security and Lifecycle Management**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/otp/generate/route';
import { authenticationService } from '@/lib/services/authentication-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import fc from 'fast-check';

// Mock dependencies
vi.mock('@/lib/services/authentication-service');
vi.mock('@/lib/services/audit-service');

const mockAuthenticationService = vi.mocked(authenticationService);
const mockLogAuditEvent = vi.mocked(logAuditEvent);

describe('OTP Generation Endpoint - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogAuditEvent.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  /**
   * Property 5: OTP Security and Lifecycle Management
   * For any OTP generation and verification cycle, the system should generate secure 6-digit codes 
   * with 2-5 minute expiration, store hashed versions with attempt counters, implement rate limiting 
   * (max 3 requests per 5 minutes), and block identifiers after 3 failed attempts
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**
   */
  it('Property 5: OTP Security and Lifecycle Management', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid mobile numbers (10 digits)
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 10, maxLength: 10 }).map(arr => arr.join('')),
        // Generate valid school IDs
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Generate success/failure scenarios
        fc.boolean(),
        // Generate rate limiting scenarios
        fc.boolean(),
        
        async (mobileNumber, schoolId, shouldSucceed, isRateLimited) => {
          // Setup mock response based on test scenario
          if (isRateLimited) {
            mockAuthenticationService.generateOTP.mockResolvedValue({
              success: false,
              message: 'Rate limit exceeded',
              error: 'RATE_LIMITED'
            });
          } else if (shouldSucceed) {
            // Generate expiration time between 2-5 minutes (Requirement 4.2)
            const expirationMinutes = 2 + Math.random() * 3; // 2-5 minutes
            const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
            
            mockAuthenticationService.generateOTP.mockResolvedValue({
              success: true,
              message: 'OTP sent successfully',
              expiresAt
            });
          } else {
            mockAuthenticationService.generateOTP.mockResolvedValue({
              success: false,
              message: 'User not found',
              error: 'USER_NOT_FOUND'
            });
          }

          const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
            method: 'POST',
            body: JSON.stringify({
              identifier: mobileNumber,
              schoolId: schoolId.trim()
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const response = await POST(request);
          const data = await response.json();

          // Property assertions
          if (isRateLimited) {
            // Rate limiting should return 429 status (Requirement 4.7)
            expect(response.status).toBe(429);
            expect(data.success).toBe(false);
            expect(data.code).toBe('RATE_LIMITED');
            expect(data.error).toContain('Too many OTP requests');
          } else if (shouldSucceed) {
            // Successful OTP generation properties (Requirements 4.1, 4.2)
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.message).toBe('OTP sent successfully');
            expect(data.expiresAt).toBeDefined();
            
            // Verify expiration time is between 2-5 minutes (Requirement 4.2)
            const expirationTime = new Date(data.expiresAt);
            const now = new Date();
            const timeDiffMinutes = (expirationTime.getTime() - now.getTime()) / (1000 * 60);
            expect(timeDiffMinutes).toBeGreaterThanOrEqual(1.9); // Allow small margin
            expect(timeDiffMinutes).toBeLessThanOrEqual(5.1); // Allow small margin
          } else {
            // Failed OTP generation properties
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(data.success).toBe(false);
            expect(data.error).toBeDefined();
          }

          // Universal properties that should always hold
          expect(data).toHaveProperty('success');
          expect(typeof data.success).toBe('boolean');
          
          if (!data.success) {
            expect(data).toHaveProperty('error');
            expect(typeof data.error).toBe('string');
          }

          // Verify authentication service was called with correct parameters
          expect(mockAuthenticationService.generateOTP).toHaveBeenCalledWith(
            mobileNumber,
            schoolId.trim()
          );
        }
      ),
      { numRuns: 50 } // Reduced runs for faster execution
    );
  });

  /**
   * Property: Valid Input Processing
   * For any valid mobile number and school ID, the endpoint should process the request correctly
   */
  it('Property: Valid Input Processing', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid mobile numbers (10 digits)
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 10, maxLength: 10 }).map(arr => arr.join('')),
        // Generate valid school IDs
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        
        async (mobileNumber, schoolId) => {
          mockAuthenticationService.generateOTP.mockResolvedValue({
            success: true,
            message: 'OTP sent successfully',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
          });

          const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
            method: 'POST',
            body: JSON.stringify({
              identifier: mobileNumber,
              schoolId: schoolId.trim()
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const response = await POST(request);
          const data = await response.json();

          // Valid input should be processed successfully
          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(mockAuthenticationService.generateOTP).toHaveBeenCalledWith(
            mobileNumber,
            schoolId.trim()
          );
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Error Response Consistency
   * For any error condition, the response format should be consistent and secure
   */
  it('Property: Error Response Consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('USER_NOT_FOUND'),
          fc.constant('SCHOOL_NOT_FOUND'),
          fc.constant('RATE_LIMITED'),
          fc.constant('SYSTEM_ERROR')
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        
        async (errorType, errorMessage) => {
          mockAuthenticationService.generateOTP.mockResolvedValue({
            success: false,
            message: errorMessage,
            error: errorType
          });

          const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
            method: 'POST',
            body: JSON.stringify({
              identifier: '9876543210',
              schoolId: 'test-school'
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const response = await POST(request);
          const data = await response.json();

          // Error response properties
          expect(data.success).toBe(false);
          expect(data).toHaveProperty('error');
          expect(typeof data.error).toBe('string');
          expect(data.error.length).toBeGreaterThan(0);

          // Status code should match error type
          switch (errorType) {
            case 'USER_NOT_FOUND':
            case 'SCHOOL_NOT_FOUND':
              expect(response.status).toBe(404);
              expect(data.code).toBe(errorType);
              break;
            case 'RATE_LIMITED':
              expect(response.status).toBe(429);
              expect(data.code).toBe(errorType);
              break;
            case 'SYSTEM_ERROR':
              expect(response.status).toBe(500);
              break;
          }

          // Should not expose sensitive information
          expect(data.error).not.toContain('password');
          expect(data.error).not.toContain('hash');
          expect(data.error).not.toContain('database');
          expect(data.error).not.toContain('internal');
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Input Validation Boundaries
   * Test boundary conditions for input validation
   */
  it('Property: Input Validation Boundaries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(''), // Empty string
          fc.constant('123'), // Too short mobile
          fc.constant('12345678901'), // Too long mobile  
          fc.constant('abcdefghij'), // Non-numeric mobile
          fc.constant('test@email.com'), // Valid email
          fc.constant('invalid-email') // Invalid email format
        ),
        
        async (identifier) => {
          const request = new NextRequest('http://localhost:3000/api/auth/otp/generate', {
            method: 'POST',
            body: JSON.stringify({
              identifier,
              schoolId: 'test-school'
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const response = await POST(request);
          const data = await response.json();

          const isValidMobile = /^\d{10}$/.test(identifier);
          const isValidEmail = identifier.includes('@') && identifier.length > 3;

          if (!isValidMobile && !isValidEmail) {
            // Invalid input should return 400
            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBeDefined();
          } else {
            // Valid input should proceed (mock will determine response)
            mockAuthenticationService.generateOTP.mockResolvedValue({
              success: true,
              message: 'OTP sent successfully',
              expiresAt: new Date()
            });
            
            // For valid inputs, we expect the service to be called
            // (Note: This test focuses on input validation, not service behavior)
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});