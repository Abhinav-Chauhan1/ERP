/**
 * Test Script for OTP Verification Endpoint
 * Verifies the /api/auth/otp/verify endpoint functionality
 * 
 * Requirements: 4.4, 4.5, 4.6, 1.1, 2.1, 5.1, 6.1, 11.1
 */

import { db } from '@/lib/db';
import { UserRole, SchoolStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function testOTPVerifyEndpoint() {
  console.log('🧪 Testing OTP Verification Endpoint...\n');

  let testSchool: any;
  let testUser: any;
  let testOTP: any;

  try {
    // Clean up any existing test data
    await db.oTP.deleteMany({
      where: {
        identifier: { contains: 'test-otp-verify-script' }
      }
    });
    
    await db.userSchool.deleteMany({
      where: {
        user: {
          mobile: { contains: 'test-otp-verify-script' }
        }
      }
    });

    await db.user.deleteMany({
      where: {
        mobile: { contains: 'test-otp-verify-script' }
      }
    });

    await db.school.deleteMany({
      where: {
        schoolCode: { contains: 'test-otp-verify-script' }
      }
    });

    // Create test school
    testSchool = await db.school.create({
      data: {
        name: 'Test OTP Verify Script School',
        schoolCode: 'test-otp-verify-script-school',
        status: SchoolStatus.ACTIVE,
        isOnboarded: true
      }
    });
    console.log('✅ Created test school:', testSchool.schoolCode);

    // Create test user
    testUser = await db.user.create({
      data: {
        name: 'Test OTP Verify Script User',
        mobile: '9876543210-test-otp-verify-script',
        isActive: true
      }
    });
    console.log('✅ Created test user:', testUser.mobile);

    // Create user-school relationship
    await db.userSchool.create({
      data: {
        userId: testUser.id,
        schoolId: testSchool.id,
        role: UserRole.STUDENT,
        isActive: true
      }
    });
    console.log('✅ Created user-school relationship');

    // Test 1: Valid OTP Verification
    console.log('\n📋 Test 1: Valid OTP Verification');
    const otpCode = '123456';
    const codeHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    testOTP = await db.oTP.create({
      data: {
        identifier: testUser.mobile,
        codeHash,
        expiresAt,
        attempts: 0,
        isUsed: false
      }
    });
    console.log('✅ Created valid OTP');

    const validResponse = await fetch('http://localhost:3000/api/auth/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1'
      },
      body: JSON.stringify({
        identifier: testUser.mobile,
        otpCode: otpCode,
        schoolId: testSchool.id
      })
    });

    const validResult = await validResponse.json();
    console.log('Response Status:', validResponse.status);
    console.log('Response Body:', validResult);

    if (validResponse.status === 200 && validResult.success) {
      console.log('✅ Valid OTP verification successful');
    } else {
      console.log('❌ Valid OTP verification failed');
    }

    // Verify OTP is marked as used
    const updatedOTP = await db.oTP.findUnique({
      where: { id: testOTP.id }
    });
    if (updatedOTP?.isUsed) {
      console.log('✅ OTP marked as used correctly');
    } else {
      console.log('❌ OTP not marked as used');
    }

    // Test 2: Invalid OTP Code
    console.log('\n📋 Test 2: Invalid OTP Code');
    const invalidOtpCode = '654321';
    const invalidCodeHash = await bcrypt.hash(invalidOtpCode, 10);

    const invalidOTP = await db.oTP.create({
      data: {
        identifier: testUser.mobile,
        codeHash: invalidCodeHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
        isUsed: false
      }
    });

    const invalidResponse = await fetch('http://localhost:3000/api/auth/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: testUser.mobile,
        otpCode: '999999', // Wrong code
        schoolId: testSchool.id
      })
    });

    const invalidResult = await invalidResponse.json();
    console.log('Response Status:', invalidResponse.status);
    console.log('Response Body:', invalidResult);

    if (invalidResponse.status === 400 && !invalidResult.success && invalidResult.code === 'INVALID_OTP') {
      console.log('✅ Invalid OTP rejection successful');
    } else {
      console.log('❌ Invalid OTP rejection failed');
    }

    // Verify attempt counter incremented
    const updatedInvalidOTP = await db.oTP.findUnique({
      where: { id: invalidOTP.id }
    });
    if (updatedInvalidOTP?.attempts === 1) {
      console.log('✅ Attempt counter incremented correctly');
    } else {
      console.log('❌ Attempt counter not incremented');
    }

    // Test 3: Expired OTP
    console.log('\n📋 Test 3: Expired OTP');
    const expiredOtpCode = '111111';
    const expiredCodeHash = await bcrypt.hash(expiredOtpCode, 10);
    const expiredAt = new Date(Date.now() - 1000); // 1 second ago (expired)

    const expiredOTP = await db.oTP.create({
      data: {
        identifier: testUser.mobile,
        codeHash: expiredCodeHash,
        expiresAt: expiredAt,
        attempts: 0,
        isUsed: false
      }
    });

    const expiredResponse = await fetch('http://localhost:3000/api/auth/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: testUser.mobile,
        otpCode: expiredOtpCode,
        schoolId: testSchool.id
      })
    });

    const expiredResult = await expiredResponse.json();
    console.log('Response Status:', expiredResponse.status);
    console.log('Response Body:', expiredResult);

    if (expiredResponse.status === 400 && !expiredResult.success && expiredResult.code === 'OTP_EXPIRED') {
      console.log('✅ Expired OTP rejection successful');
    } else {
      console.log('❌ Expired OTP rejection failed');
    }

    // Test 4: Input Validation
    console.log('\n📋 Test 4: Input Validation');
    const validationResponse = await fetch('http://localhost:3000/api/auth/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: testUser.mobile,
        otpCode: '12345', // Invalid format (5 digits)
        schoolId: testSchool.id
      })
    });

    const validationResult = await validationResponse.json();
    console.log('Response Status:', validationResponse.status);
    console.log('Response Body:', validationResult);

    if (validationResponse.status === 400 && !validationResult.success && validationResult.error.includes('6 digits')) {
      console.log('✅ Input validation successful');
    } else {
      console.log('❌ Input validation failed');
    }

    // Test 5: Missing Parameters
    console.log('\n📋 Test 5: Missing Parameters');
    const missingResponse = await fetch('http://localhost:3000/api/auth/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: testUser.mobile,
        // Missing otpCode and schoolId
      })
    });

    const missingResult = await missingResponse.json();
    console.log('Response Status:', missingResponse.status);
    console.log('Response Body:', missingResult);

    if (missingResponse.status === 400 && !missingResult.success) {
      console.log('✅ Missing parameter validation successful');
    } else {
      console.log('❌ Missing parameter validation failed');
    }

    // Check audit logs
    console.log('\n📋 Checking Audit Logs');
    const auditLogs = await db.auditLog.findMany({
      where: {
        schoolId: testSchool.id,
        action: { in: ['OTP_VERIFICATION_SUCCESS', 'OTP_VERIFICATION_FAILED'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`✅ Found ${auditLogs.length} audit log entries`);
    auditLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.action} - ${log.createdAt.toISOString()}`);
    });

    console.log('\n🎉 OTP Verification Endpoint Test Complete!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Clean up test data
    try {
      if (testOTP) {
        await db.oTP.deleteMany({
          where: {
            identifier: testUser?.mobile
          }
        });
      }

      if (testUser) {
        await db.userSchool.deleteMany({
          where: {
            userId: testUser.id
          }
        });

        await db.user.delete({
          where: {
            id: testUser.id
          }
        });
      }

      if (testSchool) {
        await db.school.delete({
          where: {
            id: testSchool.id
          }
        });
      }

      console.log('✅ Test data cleaned up');
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
    }
  }
}

// Run the test
if (require.main === module) {
  testOTPVerifyEndpoint()
    .then(() => {
      console.log('Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { testOTPVerifyEndpoint };