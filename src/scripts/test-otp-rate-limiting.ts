#!/usr/bin/env tsx

/**
 * Dedicated Rate Limiting Test for OTP Generation
 * Tests the rate limiting functionality specifically
 */

import { db } from "@/lib/db";

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

class OTPRateLimitTester {
  private baseUrl = 'http://localhost:3000';
  private results: TestResult[] = [];

  async runRateLimitTests(): Promise<void> {
    console.log('🧪 Testing OTP Rate Limiting...\n');

    // Setup test data
    await this.setupTestData();

    // Run rate limiting tests
    await this.testSequentialRequests();
    await this.testRateLimitRecovery();

    // Cleanup
    await this.cleanup();

    // Report results
    this.reportResults();
  }

  private async setupTestData(): Promise<void> {
    try {
      // Create test school
      await db.school.upsert({
        where: { schoolCode: 'RATETEST001' },
        update: {},
        create: {
          id: 'rate-test-school-1',
          name: 'Rate Test School',
          schoolCode: 'RATETEST001',
          status: 'ACTIVE',
          isOnboarded: true
        }
      });

      // Create test user
      await db.user.upsert({
        where: { mobile: '9999999999' },
        update: {},
        create: {
          id: 'rate-test-user-1',
          name: 'Rate Test Student',
          mobile: '9999999999',
          isActive: true
        }
      });

      // Create user-school relationship
      await db.userSchool.upsert({
        where: {
          userId_schoolId: {
            userId: 'rate-test-user-1',
            schoolId: 'rate-test-school-1'
          }
        },
        update: {},
        create: {
          userId: 'rate-test-user-1',
          schoolId: 'rate-test-school-1',
          role: 'STUDENT',
          isActive: true
        }
      });

      console.log('✅ Rate limit test data setup complete');
    } catch (error) {
      console.error('❌ Failed to setup rate limit test data:', error);
      throw error;
    }
  }

  private async testSequentialRequests(): Promise<void> {
    console.log('🔄 Testing sequential OTP requests...');
    
    try {
      const responses = [];
      const delays = [0, 1000, 2000, 3000, 4000]; // Staggered requests

      for (let i = 0; i < 5; i++) {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, delays[i] - delays[i-1]));
        }
        
        console.log(`   Making request ${i + 1}/5...`);
        
        const response = await fetch(`${this.baseUrl}/api/auth/otp/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identifier: '9999999999',
            schoolId: 'rate-test-school-1'
          })
        });

        const data = await response.json();
        responses.push({
          status: response.status,
          success: data.success,
          error: data.error,
          code: data.code,
          requestNumber: i + 1
        });

        console.log(`   Request ${i + 1}: ${response.status} - ${data.success ? 'Success' : data.error}`);
      }

      // Analyze results
      const successfulRequests = responses.filter(r => r.success).length;
      const rateLimitedRequests = responses.filter(r => r.code === 'RATE_LIMITED').length;

      console.log(`   Results: ${successfulRequests} successful, ${rateLimitedRequests} rate limited`);

      // According to requirements, max 3 requests per 5 minutes should be allowed
      if (successfulRequests <= 3 && rateLimitedRequests >= 2) {
        this.results.push({
          test: 'Sequential Rate Limiting',
          passed: true,
          message: `Rate limiting working correctly: ${successfulRequests} allowed, ${rateLimitedRequests} blocked`,
          details: { responses }
        });
      } else {
        this.results.push({
          test: 'Sequential Rate Limiting',
          passed: false,
          message: `Rate limiting not working as expected: ${successfulRequests} allowed, ${rateLimitedRequests} blocked`,
          details: { responses }
        });
      }

    } catch (error) {
      this.results.push({
        test: 'Sequential Rate Limiting',
        passed: false,
        message: 'Test failed with error',
        details: { error: error.message }
      });
    }
  }

  private async testRateLimitRecovery(): Promise<void> {
    console.log('🔄 Testing rate limit recovery...');
    
    try {
      // First, trigger rate limiting
      console.log('   Triggering rate limit...');
      for (let i = 0; i < 4; i++) {
        await fetch(`${this.baseUrl}/api/auth/otp/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identifier: '9999999999',
            schoolId: 'rate-test-school-1'
          })
        });
      }

      // Wait a bit and try again (should still be rate limited)
      console.log('   Testing continued rate limiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const rateLimitedResponse = await fetch(`${this.baseUrl}/api/auth/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: '9999999999',
          schoolId: 'rate-test-school-1'
        })
      });

      const rateLimitedData = await rateLimitedResponse.json();
      
      if (rateLimitedResponse.status === 429 && rateLimitedData.code === 'RATE_LIMITED') {
        this.results.push({
          test: 'Rate Limit Persistence',
          passed: true,
          message: 'Rate limiting persists correctly after multiple requests',
          details: {
            status: rateLimitedResponse.status,
            code: rateLimitedData.code
          }
        });
      } else {
        this.results.push({
          test: 'Rate Limit Persistence',
          passed: false,
          message: 'Rate limiting should persist but request was allowed',
          details: {
            status: rateLimitedResponse.status,
            response: rateLimitedData
          }
        });
      }

    } catch (error) {
      this.results.push({
        test: 'Rate Limit Recovery',
        passed: false,
        message: 'Test failed with error',
        details: { error: error.message }
      });
    }
  }

  private async cleanup(): Promise<void> {
    try {
      // Clean up test OTPs
      await db.oTP.deleteMany({
        where: {
          identifier: '9999999999'
        }
      });

      // Clean up test user-school relationship
      await db.userSchool.deleteMany({
        where: {
          userId: 'rate-test-user-1'
        }
      });

      // Clean up test user
      await db.user.deleteMany({
        where: {
          id: 'rate-test-user-1'
        }
      });

      // Clean up test school
      await db.school.deleteMany({
        where: {
          id: 'rate-test-school-1'
        }
      });

      console.log('✅ Rate limit test cleanup complete');
    } catch (error) {
      console.error('❌ Rate limit test cleanup failed:', error);
    }
  }

  private reportResults(): void {
    console.log('\n📊 Rate Limiting Test Results:');
    console.log('===============================\n');

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
      console.log('🎉 All rate limiting tests passed!');
    } else {
      console.log('⚠️  Some rate limiting tests failed. This may be expected behavior depending on timing.');
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new OTPRateLimitTester();
  tester.runRateLimitTests().catch(console.error);
}

export { OTPRateLimitTester };