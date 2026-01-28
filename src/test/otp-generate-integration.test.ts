/**
 * Integration Tests for OTP Generation Endpoint
 * Tests the complete OTP generation flow with real database interactions
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 14.1, 2.2, 2.3, 8.1, 8.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';

describe('OTP Generation Integration Tests', () => {
  let testSchoolId: string;
  let testUserId: string;
  let testMobile: string;

  beforeEach(async () => {
    // Setup test data
    testMobile = `98765${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    
    // Create test school
    const school = await db.school.create({
      data: {
        name: 'Test School Integration',
        schoolCode: `TEST${Math.floor(Math.random() * 10000)}`,
        status: 'ACTIVE',
        isOnboarded: true
      }
    });
    testSchoolId = school.id;

    // Create test user
    const user = await db.user.create({
      data: {
        name: 'Test Student Integration',
        mobile: testMobile,
        isActive: true
      }
    });
    testUserId = user.id;

    // Create user-school relationship
    await db.userSchool.create({
      data: {
        userId: testUserId,
        schoolId: testSchoolId,
        role: 'STUDENT',
        isActive: true
      }
    });
  });

  afterEach(async () => {
    // Cleanup test data
    await db.oTP.deleteMany({
      where: { identifier: testMobile }
    });
    
    await db.userSchool.deleteMany({
      where: { userId: testUserId }
    });
    
    await db.user.deleteMany({
      where: { id: testUserId }
    });
    
    await db.school.deleteMany({
      where: { id: testSchoolId }
    });
  });

  it('should generate OTP successfully for valid user and school', async () => {
    const response = await fetch('http://localhost:3000/api/auth/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: testMobile,
        schoolId: testSchoolId
      })
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('OTP sent successfully');
    expect(data.expiresAt).toBeDefined();

    // Verify OTP was stored in database
    const otpRecord = await db.oTP.findFirst({
      where: {
        identifier: testMobile,
        isUsed: false
      },
      orderBy: { createdAt: 'desc' }
    });

    expect(otpRecord).toBeTruthy();
    expect(otpRecord!.attempts).toBe(0);
    expect(otpRecord!.expiresAt).toBeInstanceOf(Date);
    
    // Verify expiration time is between 2-5 minutes
    const now = new Date();
    const timeDiffMinutes = (otpRecord!.expiresAt.getTime() - now.getTime()) / (1000 * 60);
    expect(timeDiffMinutes).toBeGreaterThanOrEqual(1.9);
    expect(timeDiffMinutes).toBeLessThanOrEqual(5.1);
  });

  it('should reject OTP generation for non-existent user', async () => {
    const response = await fetch('http://localhost:3000/api/auth/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: '1234567890', // Non-existent mobile
        schoolId: testSchoolId
      })
    });

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.code).toBe('USER_NOT_FOUND');
    expect(data.error).toContain('No account found');
  });

  it('should reject OTP generation for non-existent school', async () => {
    const response = await fetch('http://localhost:3000/api/auth/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: testMobile,
        schoolId: 'non-existent-school-id'
      })
    });

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.code).toBe('SCHOOL_NOT_FOUND');
    expect(data.error).toContain('School not found or inactive');
  });

  it('should reject OTP generation for user without school access', async () => {
    // Create another school
    const anotherSchool = await db.school.create({
      data: {
        name: 'Another Test School',
        schoolCode: `ANOTHER${Math.floor(Math.random() * 10000)}`,
        status: 'ACTIVE',
        isOnboarded: true
      }
    });

    const response = await fetch('http://localhost:3000/api/auth/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: testMobile,
        schoolId: anotherSchool.id
      })
    });

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.code).toBe('USER_NOT_FOUND');
    expect(data.error).toContain('No account found');

    // Cleanup
    await db.school.delete({
      where: { id: anotherSchool.id }
    });
  });

  it('should implement rate limiting for OTP generation', async () => {
    // Make multiple rapid requests
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        fetch('http://localhost:3000/api/auth/otp/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identifier: testMobile,
            schoolId: testSchoolId
          })
        })
      );
    }

    const responses = await Promise.all(requests);
    const results = await Promise.all(responses.map(r => r.json()));

    // At least one request should be rate limited
    const rateLimitedResponses = results.filter(result => 
      result.code === 'RATE_LIMITED' || result.error?.includes('rate limit')
    );

    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // Rate limited responses should have 429 status
    const rateLimitedResponse = responses.find((_, index) => 
      results[index].code === 'RATE_LIMITED'
    );

    if (rateLimitedResponse) {
      expect(rateLimitedResponse.status).toBe(429);
    }
  });

  it('should clean up expired OTPs', async () => {
    // Generate an OTP
    await fetch('http://localhost:3000/api/auth/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: testMobile,
        schoolId: testSchoolId
      })
    });

    // Verify OTP exists
    let otpRecord = await db.oTP.findFirst({
      where: {
        identifier: testMobile,
        isUsed: false
      }
    });
    expect(otpRecord).toBeTruthy();

    // Manually expire the OTP
    await db.oTP.update({
      where: { id: otpRecord!.id },
      data: { expiresAt: new Date(Date.now() - 1000) } // 1 second ago
    });

    // Generate a new OTP (should clean up expired ones)
    await fetch('http://localhost:3000/api/auth/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: testMobile,
        schoolId: testSchoolId
      })
    });

    // Verify expired OTP was cleaned up
    const expiredOtp = await db.oTP.findFirst({
      where: {
        id: otpRecord!.id
      }
    });
    expect(expiredOtp).toBeNull();

    // Verify new OTP exists
    const newOtp = await db.oTP.findFirst({
      where: {
        identifier: testMobile,
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    });
    expect(newOtp).toBeTruthy();
  });

  it('should handle email identifiers correctly', async () => {
    const testEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
    
    // Update user to have email instead of mobile
    await db.user.update({
      where: { id: testUserId },
      data: { 
        email: testEmail,
        mobile: null
      }
    });

    const response = await fetch('http://localhost:3000/api/auth/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: testEmail,
        schoolId: testSchoolId
      })
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('OTP sent successfully');

    // Verify OTP was stored with email identifier
    const otpRecord = await db.oTP.findFirst({
      where: {
        identifier: testEmail,
        isUsed: false
      }
    });
    expect(otpRecord).toBeTruthy();
  });

  it('should validate input parameters correctly', async () => {
    // Test missing identifier
    const response1 = await fetch('http://localhost:3000/api/auth/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolId: testSchoolId
      })
    });

    const data1 = await response1.json();
    expect(response1.status).toBe(400);
    expect(data1.success).toBe(false);
    expect(data1.error).toContain('Mobile number or email is required');

    // Test missing schoolId
    const response2 = await fetch('http://localhost:3000/api/auth/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: testMobile
      })
    });

    const data2 = await response2.json();
    expect(response2.status).toBe(400);
    expect(data2.success).toBe(false);
    expect(data2.error).toContain('School ID is required');

    // Test invalid identifier format
    const response3 = await fetch('http://localhost:3000/api/auth/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'invalid-format',
        schoolId: testSchoolId
      })
    });

    const data3 = await response3.json();
    expect(response3.status).toBe(400);
    expect(data3.success).toBe(false);
    expect(data3.error).toContain('valid mobile number (10 digits) or email address');
  });
});