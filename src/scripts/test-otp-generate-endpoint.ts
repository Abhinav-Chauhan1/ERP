#!/usr/bin/env tsx

/**
 * Test script for OTP Generation Endpoint
 * Tests the /api/auth/otp/generate endpoint functionality
 * 
 * Requirements: 4.1, 4.2, 4.7, 14.1
 */

import { db } from "@/lib/db";

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

class OTPGenerateEndpointTester {
  private baseUrl = 'http://localhost:3000';
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Testing OTP Generation Endpoint...\n');

    // Setup test data
    await this.setupTestData();

    // Run tests
    await this.testValidOTPGeneration();
    await this.testInvalidSchoolId();
    await this.testInvalidIdentifier();
    await this.testUserNotFound();
    await this.testRateLimiting();
    await this.testMissingParameters();

    // Cleanup
    await this.cleanup();

    // Report results
    this.reportResults();
  }

  private async setupTestData(): Promise<void> {
    try {
      // Create test school
      await db.school.upsert({
        where: { schoolCode: 'TEST001' },
        update: {},
        create: {
          id: 'test-school-1',
          name: 'Test School',
          schoolCode: 'TEST001',
          status: 'ACTIVE',
          isOnboarded: true
        }
      });

      // Create test user
      await db.user.upsert({
        where: { mobile: '9876543210' },
        update: {},
        create: {
          id: 'test-user-1',
          name: 'Test Student',
          mobile: '9876543210',
          isActive: true
        }
      });

      // Create user-school relationship
      await db.userSchool.upsert({
        where: {
          userId_schoolId: {
            userId: 'test-user-1',
            schoolId: 'test-school-1'
          }
        },
        update: {},
        create: {
          userId: 'test-user-1',
          schoolId: 'test-school-1',
          role: 'STUDENT',
          isActive: true
        }
      });

      console.log('✅ Test data setup complete');
    } catch (error) {
      console.error('❌ Failed to setup test data:', error);
      throw error;
    }
  }

  private async testValidOTPGeneration(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'test-school-1'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.results.push({
          test: 'Valid OTP Generation',
          passed: true,
          message: 'OTP generated successfully',
          details: {
            status: response.status,
            message: data.message,
            expiresAt: data.expiresAt
          }
        });

        // Verify OTP was stored in database
        const otpRecord = await db.oTP.findFirst({
          where: {
            identifier: '9876543210',
            isUsed: false
          },
          orderBy: { createdAt: 'desc' }
        });

        if (otpRecord) {
          this.results.push({
            test: 'OTP Database Storage',
            passed: true,
            message: 'OTP correctly stored in database',
            details: {
              id: otpRecord.id,
              expiresAt: otpRecord.expiresAt,
              attempts: otpRecord.attempts
            }
          });
        } else {
          this.results.push({
            test: 'OTP Database Storage',
            passed: false,
            message: 'OTP not found in database'
          });
        }
      } else {
        this.results.push({
          test: 'Valid OTP Generation',
          passed: false,
          message: 'Failed to generate OTP',
          details: {
            status: response.status,
            error: data.error || data.message
          }
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Valid OTP Generation',
        passed: false,
        message: 'Request failed',
        details: { error: error.message }
      });
    }
  }

  private async testInvalidSchoolId(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'invalid-school-id'
        })
      });

      const data = await response.json();

      if (!response.ok && !data.success) {
        this.results.push({
          test: 'Invalid School ID Handling',
          passed: true,
          message: 'Correctly rejected invalid school ID',
          details: {
            status: response.status,
            error: data.error
          }
        });
      } else {
        this.results.push({
          test: 'Invalid School ID Handling',
          passed: false,
          message: 'Should have rejected invalid school ID',
          details: {
            status: response.status,
            response: data
          }
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Invalid School ID Handling',
        passed: false,
        message: 'Request failed',
        details: { error: error.message }
      });
    }
  }

  private async testInvalidIdentifier(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: 'invalid-identifier',
          schoolId: 'test-school-1'
        })
      });

      const data = await response.json();

      if (response.status === 400 && !data.success) {
        this.results.push({
          test: 'Invalid Identifier Validation',
          passed: true,
          message: 'Correctly rejected invalid identifier format',
          details: {
            status: response.status,
            error: data.error
          }
        });
      } else {
        this.results.push({
          test: 'Invalid Identifier Validation',
          passed: false,
          message: 'Should have rejected invalid identifier format',
          details: {
            status: response.status,
            response: data
          }
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Invalid Identifier Validation',
        passed: false,
        message: 'Request failed',
        details: { error: error.message }
      });
    }
  }

  private async testUserNotFound(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: '1234567890', // Non-existent user
          schoolId: 'test-school-1'
        })
      });

      const data = await response.json();

      if (response.status === 404 && !data.success && data.code === 'USER_NOT_FOUND') {
        this.results.push({
          test: 'User Not Found Handling',
          passed: true,
          message: 'Correctly handled non-existent user',
          details: {
            status: response.status,
            error: data.error,
            code: data.code
          }
        });
      } else {
        this.results.push({
          test: 'User Not Found Handling',
          passed: false,
          message: 'Should have returned USER_NOT_FOUND error',
          details: {
            status: response.status,
            response: data
          }
        });
      }
    } catch (error) {
      this.results.push({
        test: 'User Not Found Handling',
        passed: false,
        message: 'Request failed',
        details: { error: error.message }
      });
    }
  }

  private async testRateLimiting(): Promise<void> {
    try {
      // Make multiple rapid requests to trigger rate limiting
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          fetch(`${this.baseUrl}/api/auth/otp/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              identifier: '9876543210',
              schoolId: 'test-school-1'
            })
          })
        );
      }

      const responses = await Promise.all(requests);
      const results = await Promise.all(responses.map(r => r.json()));

      // Check if any request was rate limited
      const rateLimited = results.some(result => 
        result.code === 'RATE_LIMITED' || result.error?.includes('rate limit')
      );

      if (rateLimited) {
        this.results.push({
          test: 'Rate Limiting Protection',
          passed: true,
          message: 'Rate limiting is working correctly',
          details: {
            totalRequests: requests.length,
            rateLimitedResponses: results.filter(r => r.code === 'RATE_LIMITED').length
          }
        });
      } else {
        this.results.push({
          test: 'Rate Limiting Protection',
          passed: false,
          message: 'Rate limiting may not be working properly',
          details: {
            totalRequests: requests.length,
            responses: results.map(r => ({ success: r.success, error: r.error, code: r.code }))
          }
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Rate Limiting Protection',
        passed: false,
        message: 'Rate limiting test failed',
        details: { error: error.message }
      });
    }
  }

  private async testMissingParameters(): Promise<void> {
    try {
      // Test missing identifier
      const response1 = await fetch(`${this.baseUrl}/api/auth/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolId: 'test-school-1'
        })
      });

      const data1 = await response1.json();

      // Test missing schoolId
      const response2 = await fetch(`${this.baseUrl}/api/auth/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: '9876543210'
        })
      });

      const data2 = await response2.json();

      const test1Passed = response1.status === 400 && !data1.success;
      const test2Passed = response2.status === 400 && !data2.success;

      if (test1Passed && test2Passed) {
        this.results.push({
          test: 'Missing Parameters Validation',
          passed: true,
          message: 'Correctly validates required parameters',
          details: {
            missingIdentifier: { status: response1.status, error: data1.error },
            missingSchoolId: { status: response2.status, error: data2.error }
          }
        });
      } else {
        this.results.push({
          test: 'Missing Parameters Validation',
          passed: false,
          message: 'Parameter validation not working correctly',
          details: {
            missingIdentifier: { status: response1.status, passed: test1Passed, response: data1 },
            missingSchoolId: { status: response2.status, passed: test2Passed, response: data2 }
          }
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Missing Parameters Validation',
        passed: false,
        message: 'Parameter validation test failed',
        details: { error: error.message }
      });
    }
  }

  private async cleanup(): Promise<void> {
    try {
      // Clean up test OTPs
      await db.oTP.deleteMany({
        where: {
          identifier: '9876543210'
        }
      });

      // Clean up test user-school relationship
      await db.userSchool.deleteMany({
        where: {
          userId: 'test-user-1'
        }
      });

      // Clean up test user
      await db.user.deleteMany({
        where: {
          id: 'test-user-1'
        }
      });

      // Clean up test school
      await db.school.deleteMany({
        where: {
          id: 'test-school-1'
        }
      });

      console.log('✅ Test cleanup complete');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  private reportResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('========================\n');

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
      
      if (result.details && !result.passed) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    });

    console.log(`\n📈 Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);

    if (passed === total) {
      console.log('🎉 All tests passed! OTP Generation endpoint is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the implementation.');
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new OTPGenerateEndpointTester();
  tester.runAllTests().catch(console.error);
}

export { OTPGenerateEndpointTester };