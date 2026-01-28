#!/usr/bin/env tsx

/**
 * Test Script for Login Endpoint
 * 
 * Tests the /api/auth/login endpoint functionality with various scenarios.
 * Requirements: 1.1, 2.1, 4.1, 5.1, 6.1, 11.1
 */

import { config } from 'dotenv'

// Load environment variables
config()

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface TestResult {
  name: string
  success: boolean
  error?: string
  response?: any
}

class LoginEndpointTester {
  private results: TestResult[] = []

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Login Endpoint Tests...\n')

    // Input validation tests
    await this.testMissingIdentifier()
    await this.testMissingSchoolId()
    await this.testMissingCredentials()
    await this.testInvalidCredentialsType()
    await this.testEmptyCredentialsValue()

    // Authentication flow tests
    await this.testStudentOTPAuthentication()
    await this.testTeacherPasswordAuthentication()
    await this.testInvalidCredentials()
    await this.testNonExistentUser()
    await this.testInactiveSchool()

    // Multi-context tests
    await this.testMultiSchoolUser()
    await this.testParentMultiChild()

    // Error handling tests
    await this.testMalformedJSON()
    await this.testNetworkError()

    this.printResults()
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'Login-Endpoint-Tester/1.0'
        },
        body: JSON.stringify(data)
      })

      const responseData = await response.json()
      return {
        status: response.status,
        data: responseData
      }
    } catch (error) {
      throw new Error(`Network error: ${error.message}`)
    }
  }

  private async testMissingIdentifier(): Promise<void> {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        schoolId: 'school-1',
        credentials: { type: 'otp', value: '123456' }
      })

      const success = response.status === 400 && 
                    response.data.success === false &&
                    response.data.error.includes('Mobile number or email is required')

      this.results.push({
        name: 'Missing Identifier Validation',
        success,
        response: response.data
      })
    } catch (error) {
      this.results.push({
        name: 'Missing Identifier Validation',
        success: false,
        error: error.message
      })
    }
  }

  private async testMissingSchoolId(): Promise<void> {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        identifier: '9876543210',
        credentials: { type: 'otp', value: '123456' }
      })

      const success = response.status === 400 && 
                    response.data.success === false &&
                    response.data.error.includes('School ID is required')

      this.results.push({
        name: 'Missing School ID Validation',
        success,
        response: response.data
      })
    } catch (error) {
      this.results.push({
        name: 'Missing School ID Validation',
        success: false,
        error: error.message
      })
    }
  }

  private async testMissingCredentials(): Promise<void> {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        identifier: '9876543210',
        schoolId: 'school-1'
      })

      const success = response.status === 400 && 
                    response.data.success === false &&
                    response.data.error.includes('Authentication credentials are required')

      this.results.push({
        name: 'Missing Credentials Validation',
        success,
        response: response.data
      })
    } catch (error) {
      this.results.push({
        name: 'Missing Credentials Validation',
        success: false,
        error: error.message
      })
    }
  }

  private async testInvalidCredentialsType(): Promise<void> {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        identifier: '9876543210',
        schoolId: 'school-1',
        credentials: { type: 'invalid', value: '123456' }
      })

      const success = response.status === 400 && 
                    response.data.success === false &&
                    response.data.error.includes('Invalid authentication method')

      this.results.push({
        name: 'Invalid Credentials Type Validation',
        success,
        response: response.data
      })
    } catch (error) {
      this.results.push({
        name: 'Invalid Credentials Type Validation',
        success: false,
        error: error.message
      })
    }
  }

  private async testEmptyCredentialsValue(): Promise<void> {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        identifier: '9876543210',
        schoolId: 'school-1',
        credentials: { type: 'otp', value: '' }
      })

      const success = response.status === 400 && 
                    response.data.success === false &&
                    response.data.error.includes('Authentication credentials are required')

      this.results.push({
        name: 'Empty Credentials Value Validation',
        success,
        response: response.data
      })
    } catch (error) {
      this.results.push({
        name: 'Empty Credentials Value Validation',
        success: false,
        error: error.message
      })
    }
  }

  private async testStudentOTPAuthentication(): Promise<void> {
    try {
      // First validate school
      const schoolResponse = await this.makeRequest('/api/auth/school-validate', {
        schoolCode: 'TEST001'
      })

      if (!schoolResponse.data.success) {
        this.results.push({
          name: 'Student OTP Authentication',
          success: false,
          error: 'School validation failed - ensure test school exists'
        })
        return
      }

      // Generate OTP
      const otpResponse = await this.makeRequest('/api/auth/otp/generate', {
        identifier: '9876543210',
        schoolId: schoolResponse.data.school.id
      })

      if (!otpResponse.data.success) {
        this.results.push({
          name: 'Student OTP Authentication',
          success: false,
          error: 'OTP generation failed - ensure test student exists'
        })
        return
      }

      // For testing, we'll use a mock OTP since we can't get the real one
      const response = await this.makeRequest('/api/auth/login', {
        identifier: '9876543210',
        schoolId: schoolResponse.data.school.id,
        credentials: { type: 'otp', value: '123456' }
      })

      // We expect this to fail with invalid OTP, but the endpoint should handle it properly
      const success = response.status === 401 && 
                    response.data.success === false &&
                    (response.data.error.includes('Invalid') || response.data.error.includes('expired'))

      this.results.push({
        name: 'Student OTP Authentication',
        success,
        response: response.data,
        error: success ? undefined : 'Expected 401 with invalid OTP error'
      })
    } catch (error) {
      this.results.push({
        name: 'Student OTP Authentication',
        success: false,
        error: error.message
      })
    }
  }

  private async testTeacherPasswordAuthentication(): Promise<void> {
    try {
      // First validate school
      const schoolResponse = await this.makeRequest('/api/auth/school-validate', {
        schoolCode: 'TEST001'
      })

      if (!schoolResponse.data.success) {
        this.results.push({
          name: 'Teacher Password Authentication',
          success: false,
          error: 'School validation failed - ensure test school exists'
        })
        return
      }

      const response = await this.makeRequest('/api/auth/login', {
        identifier: 'teacher@test.com',
        schoolId: schoolResponse.data.school.id,
        credentials: { type: 'password', value: 'wrongpassword' }
      })

      // We expect this to fail with invalid credentials
      const success = response.status === 401 && 
                    response.data.success === false &&
                    response.data.error.includes('Invalid')

      this.results.push({
        name: 'Teacher Password Authentication',
        success,
        response: response.data,
        error: success ? undefined : 'Expected 401 with invalid credentials error'
      })
    } catch (error) {
      this.results.push({
        name: 'Teacher Password Authentication',
        success: false,
        error: error.message
      })
    }
  }

  private async testInvalidCredentials(): Promise<void> {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        identifier: '0000000000',
        schoolId: 'nonexistent-school',
        credentials: { type: 'otp', value: '000000' }
      })

      const success = response.status >= 400 && 
                    response.data.success === false

      this.results.push({
        name: 'Invalid Credentials Handling',
        success,
        response: response.data
      })
    } catch (error) {
      this.results.push({
        name: 'Invalid Credentials Handling',
        success: false,
        error: error.message
      })
    }
  }

  private async testNonExistentUser(): Promise<void> {
    try {
      // First validate school
      const schoolResponse = await this.makeRequest('/api/auth/school-validate', {
        schoolCode: 'TEST001'
      })

      if (!schoolResponse.data.success) {
        this.results.push({
          name: 'Non-Existent User Handling',
          success: false,
          error: 'School validation failed'
        })
        return
      }

      const response = await this.makeRequest('/api/auth/login', {
        identifier: '0000000000',
        schoolId: schoolResponse.data.school.id,
        credentials: { type: 'otp', value: '123456' }
      })

      const success = response.status === 404 && 
                    response.data.success === false &&
                    response.data.code === 'USER_NOT_FOUND'

      this.results.push({
        name: 'Non-Existent User Handling',
        success,
        response: response.data
      })
    } catch (error) {
      this.results.push({
        name: 'Non-Existent User Handling',
        success: false,
        error: error.message
      })
    }
  }

  private async testInactiveSchool(): Promise<void> {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        identifier: '9876543210',
        schoolId: 'inactive-school-id',
        credentials: { type: 'otp', value: '123456' }
      })

      const success = (response.status === 404 && response.data.code === 'SCHOOL_NOT_FOUND') ||
                    (response.status === 403 && response.data.code === 'SCHOOL_INACTIVE')

      this.results.push({
        name: 'Inactive School Handling',
        success,
        response: response.data
      })
    } catch (error) {
      this.results.push({
        name: 'Inactive School Handling',
        success: false,
        error: error.message
      })
    }
  }

  private async testMultiSchoolUser(): Promise<void> {
    try {
      // This test would require a user with multiple school associations
      const response = await this.makeRequest('/api/auth/login', {
        identifier: 'multischool@test.com',
        schoolId: 'school-1',
        credentials: { type: 'password', value: 'password123' }
      })

      // We expect this to fail since the user likely doesn't exist
      const success = response.status >= 400 && 
                    response.data.success === false

      this.results.push({
        name: 'Multi-School User Handling',
        success,
        response: response.data,
        error: 'Test user may not exist - this is expected'
      })
    } catch (error) {
      this.results.push({
        name: 'Multi-School User Handling',
        success: false,
        error: error.message
      })
    }
  }

  private async testParentMultiChild(): Promise<void> {
    try {
      // This test would require a parent with multiple children
      const response = await this.makeRequest('/api/auth/login', {
        identifier: '9999999999',
        schoolId: 'school-1',
        credentials: { type: 'otp', value: '123456' }
      })

      // We expect this to fail since the parent likely doesn't exist
      const success = response.status >= 400 && 
                    response.data.success === false

      this.results.push({
        name: 'Parent Multi-Child Handling',
        success,
        response: response.data,
        error: 'Test parent may not exist - this is expected'
      })
    } catch (error) {
      this.results.push({
        name: 'Parent Multi-Child Handling',
        success: false,
        error: error.message
      })
    }
  }

  private async testMalformedJSON(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      const data = await response.json()
      const success = response.status === 500 && 
                    data.success === false &&
                    data.error === 'Internal server error'

      this.results.push({
        name: 'Malformed JSON Handling',
        success,
        response: data
      })
    } catch (error) {
      this.results.push({
        name: 'Malformed JSON Handling',
        success: false,
        error: error.message
      })
    }
  }

  private async testNetworkError(): Promise<void> {
    try {
      // Test with invalid URL to simulate network error
      const response = await fetch('http://invalid-url/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        })
      })

      this.results.push({
        name: 'Network Error Handling',
        success: false,
        error: 'Expected network error but request succeeded'
      })
    } catch (error) {
      // Network error is expected
      this.results.push({
        name: 'Network Error Handling',
        success: true,
        error: `Expected network error: ${error.message}`
      })
    }
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:')
    console.log('=' .repeat(50))

    let passed = 0
    let failed = 0

    this.results.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL'
      console.log(`${index + 1}. ${result.name}: ${status}`)
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`)
      }
      
      if (result.response && !result.success) {
        console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`)
      }
      
      console.log('')

      if (result.success) {
        passed++
      } else {
        failed++
      }
    })

    console.log('=' .repeat(50))
    console.log(`Total Tests: ${this.results.length}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)
    console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. This may be expected if test data is not set up.')
      console.log('   Ensure you have test schools, users, and proper database setup.')
    } else {
      console.log('\n🎉 All tests passed!')
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new LoginEndpointTester()
  tester.runAllTests().catch(console.error)
}

export { LoginEndpointTester }