#!/usr/bin/env tsx

/**
 * Test Script for Context Switching Endpoint
 * 
 * This script tests the /api/auth/context/switch endpoint functionality
 * including school context switching and parent-student context switching.
 */

import { db } from "@/lib/db"
import { jwtService } from "@/lib/services/jwt-service"
import { UserRole } from "@prisma/client"

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL'
  message: string
  details?: any
}

class ContextSwitchTester {
  private results: TestResult[] = []
  private baseUrl = 'http://localhost:3000'

  private log(test: string, status: 'PASS' | 'FAIL', message: string, details?: any) {
    this.results.push({ test, status, message, details })
    const emoji = status === 'PASS' ? '✅' : '❌'
    console.log(`${emoji} ${test}: ${message}`)
    if (details && status === 'FAIL') {
      console.log('   Details:', JSON.stringify(details, null, 2))
    }
  }

  private async makeRequest(endpoint: string, data: any, headers: Record<string, string> = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(data)
      })

      const responseData = await response.json()
      return {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      }
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`)
    }
  }

  async setupTestData() {
    console.log('🔧 Setting up test data...')

    try {
      // Clean up existing test data
      await db.auditLog.deleteMany({ where: { userId: { contains: 'test-ctx-' } } })
      await db.authSession.deleteMany({ where: { userId: { contains: 'test-ctx-' } } })
      await db.studentParent.deleteMany({})
      await db.parent.deleteMany({ where: { userId: { contains: 'test-ctx-' } } })
      await db.student.deleteMany({ where: { userId: { contains: 'test-ctx-' } } })
      await db.userSchool.deleteMany({ where: { userId: { contains: 'test-ctx-' } } })
      await db.user.deleteMany({ where: { id: { contains: 'test-ctx-' } } })
      await db.school.deleteMany({ where: { id: { contains: 'test-ctx-' } } })

      // Create test schools
      const school1 = await db.school.create({
        data: {
          id: 'test-ctx-school-1',
          name: 'Test School Alpha',
          schoolCode: 'ALPHA001',
          status: 'ACTIVE',
          isOnboarded: true
        }
      })

      const school2 = await db.school.create({
        data: {
          id: 'test-ctx-school-2',
          name: 'Test School Beta',
          schoolCode: 'BETA001',
          status: 'ACTIVE',
          isOnboarded: true
        }
      })

      // Create multi-school teacher
      const teacher = await db.user.create({
        data: {
          id: 'test-ctx-teacher-1',
          name: 'Multi School Teacher',
          email: 'teacher@example.com',
          isActive: true
        }
      })

      await db.userSchool.createMany({
        data: [
          {
            userId: teacher.id,
            schoolId: school1.id,
            role: UserRole.TEACHER,
            isActive: true
          },
          {
            userId: teacher.id,
            schoolId: school2.id,
            role: UserRole.TEACHER,
            isActive: true
          }
        ]
      })

      // Create parent with multiple children
      const parent = await db.user.create({
        data: {
          id: 'test-ctx-parent-1',
          name: 'Multi Child Parent',
          mobile: '+1234567890',
          isActive: true
        }
      })

      await db.userSchool.create({
        data: {
          userId: parent.id,
          schoolId: school1.id,
          role: UserRole.PARENT,
          isActive: true
        }
      })

      const parentRecord = await db.parent.create({
        data: {
          id: 'test-ctx-parent-record-1',
          userId: parent.id,
          schoolId: school1.id
        }
      })

      // Create students
      const student1 = await db.user.create({
        data: {
          id: 'test-ctx-student-1',
          name: 'First Child',
          isActive: true
        }
      })

      const student2 = await db.user.create({
        data: {
          id: 'test-ctx-student-2',
          name: 'Second Child',
          isActive: true
        }
      })

      const student1Record = await db.student.create({
        data: {
          id: 'test-ctx-student-record-1',
          userId: student1.id,
          admissionId: 'ADM001',
          admissionDate: new Date(),
          dateOfBirth: new Date('2010-01-01'),
          gender: 'Male',
          rollNumber: 'STU001'
        }
      })

      const student2Record = await db.student.create({
        data: {
          id: 'test-ctx-student-record-2',
          userId: student2.id,
          admissionId: 'ADM002',
          admissionDate: new Date(),
          dateOfBirth: new Date('2011-01-01'),
          gender: 'Female',
          rollNumber: 'STU002'
        }
      })

      // Create parent-student relationships
      await db.studentParent.createMany({
        data: [
          {
            studentId: student1Record.id,
            parentId: parentRecord.id,
            schoolId: school1.id
          },
          {
            studentId: student2Record.id,
            parentId: parentRecord.id,
            schoolId: school1.id
          }
        ]
      })

      console.log('✅ Test data setup complete')
      return {
        school1,
        school2,
        teacher,
        parent,
        student1Record,
        student2Record
      }
    } catch (error) {
      console.error('❌ Failed to setup test data:', error)
      throw error
    }
  }

  async testInputValidation() {
    console.log('\n📝 Testing Input Validation...')

    // Test missing token
    try {
      const response = await this.makeRequest('/api/auth/context/switch', {
        newSchoolId: 'some-school'
      })

      if (response.status === 401 && response.data.error === 'Authentication token is required') {
        this.log('Input Validation - Missing Token', 'PASS', 'Correctly rejected missing token')
      } else {
        this.log('Input Validation - Missing Token', 'FAIL', 'Did not reject missing token properly', response)
      }
    } catch (error) {
      this.log('Input Validation - Missing Token', 'FAIL', `Request failed: ${error.message}`)
    }

    // Test invalid token type
    try {
      const response = await this.makeRequest('/api/auth/context/switch', {
        token: 123,
        newSchoolId: 'some-school'
      })

      if (response.status === 401) {
        this.log('Input Validation - Invalid Token Type', 'PASS', 'Correctly rejected invalid token type')
      } else {
        this.log('Input Validation - Invalid Token Type', 'FAIL', 'Did not reject invalid token type', response)
      }
    } catch (error) {
      this.log('Input Validation - Invalid Token Type', 'FAIL', `Request failed: ${error.message}`)
    }

    // Test malformed JSON
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/context/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      if (response.status === 500) {
        this.log('Input Validation - Malformed JSON', 'PASS', 'Correctly handled malformed JSON')
      } else {
        this.log('Input Validation - Malformed JSON', 'FAIL', 'Did not handle malformed JSON properly')
      }
    } catch (error) {
      this.log('Input Validation - Malformed JSON', 'FAIL', `Request failed: ${error.message}`)
    }
  }

  async testSchoolContextSwitching(testData: any) {
    console.log('\n🏫 Testing School Context Switching...')

    // Create valid teacher token
    const teacherToken = jwtService.createToken({
      userId: testData.teacher.id,
      role: UserRole.TEACHER,
      authorizedSchools: [testData.school1.id, testData.school2.id],
      activeSchoolId: testData.school1.id,
      permissions: []
    })

    // Create auth session
    await db.authSession.create({
      data: {
        userId: testData.teacher.id,
        token: teacherToken,
        activeSchoolId: testData.school1.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    })

    // Test successful school context switch
    try {
      const response = await this.makeRequest('/api/auth/context/switch', {
        token: teacherToken,
        newSchoolId: testData.school2.id
      }, {
        'x-forwarded-for': '192.168.1.100',
        'user-agent': 'Test Script'
      })

      if (response.status === 200 && response.data.success) {
        this.log('School Context Switch - Success', 'PASS', 'Successfully switched school context')
        
        // Verify database was updated
        const session = await db.authSession.findUnique({
          where: { token: teacherToken }
        })
        
        if (session?.activeSchoolId === testData.school2.id) {
          this.log('School Context Switch - Database Update', 'PASS', 'Database correctly updated')
        } else {
          this.log('School Context Switch - Database Update', 'FAIL', 'Database not updated correctly')
        }
      } else {
        this.log('School Context Switch - Success', 'FAIL', 'Failed to switch school context', response)
      }
    } catch (error) {
      this.log('School Context Switch - Success', 'FAIL', `Request failed: ${error.message}`)
    }

    // Test unauthorized school access
    try {
      const unauthorizedSchool = await db.school.create({
        data: {
          id: 'test-ctx-unauthorized',
          name: 'Unauthorized School',
          schoolCode: 'UNAUTH001',
          status: 'ACTIVE',
          isOnboarded: true
        }
      })

      const response = await this.makeRequest('/api/auth/context/switch', {
        token: teacherToken,
        newSchoolId: unauthorizedSchool.id
      })

      if (response.status === 403 && !response.data.success) {
        this.log('School Context Switch - Unauthorized', 'PASS', 'Correctly rejected unauthorized school')
      } else {
        this.log('School Context Switch - Unauthorized', 'FAIL', 'Did not reject unauthorized school', response)
      }

      // Clean up
      await db.school.delete({ where: { id: unauthorizedSchool.id } })
    } catch (error) {
      this.log('School Context Switch - Unauthorized', 'FAIL', `Request failed: ${error.message}`)
    }

    // Test same school context switch
    try {
      const response = await this.makeRequest('/api/auth/context/switch', {
        token: teacherToken,
        newSchoolId: testData.school2.id // Same as current
      })

      if (response.status === 400 && response.data.error === 'No context switch requested') {
        this.log('School Context Switch - Same School', 'PASS', 'Correctly handled same school switch')
      } else {
        this.log('School Context Switch - Same School', 'FAIL', 'Did not handle same school switch properly', response)
      }
    } catch (error) {
      this.log('School Context Switch - Same School', 'FAIL', `Request failed: ${error.message}`)
    }
  }

  async testParentStudentContextSwitching(testData: any) {
    console.log('\n👨‍👩‍👧‍👦 Testing Parent-Student Context Switching...')

    // Create valid parent token
    const parentToken = jwtService.createToken({
      userId: testData.parent.id,
      role: UserRole.PARENT,
      authorizedSchools: [testData.school1.id],
      activeSchoolId: testData.school1.id,
      permissions: []
    })

    // Create auth session
    await db.authSession.create({
      data: {
        userId: testData.parent.id,
        token: parentToken,
        activeSchoolId: testData.school1.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    })

    // Test successful student context switch
    try {
      const response = await this.makeRequest('/api/auth/context/switch', {
        token: parentToken,
        newStudentId: testData.student2Record.id
      }, {
        'x-forwarded-for': '192.168.1.200',
        'user-agent': 'Parent App'
      })

      if (response.status === 200 && response.data.success) {
        this.log('Parent Context Switch - Success', 'PASS', 'Successfully switched student context')
      } else {
        this.log('Parent Context Switch - Success', 'FAIL', 'Failed to switch student context', response)
      }
    } catch (error) {
      this.log('Parent Context Switch - Success', 'FAIL', `Request failed: ${error.message}`)
    }

    // Test unauthorized student access
    try {
      const unauthorizedStudent = await db.user.create({
        data: {
          id: 'test-ctx-unauthorized-student',
          name: 'Unauthorized Student',
          isActive: true
        }
      })

      const unauthorizedStudentRecord = await db.student.create({
        data: {
          id: 'test-ctx-unauthorized-student-record',
          userId: unauthorizedStudent.id,
          admissionId: 'UNAUTH001',
          admissionDate: new Date(),
          dateOfBirth: new Date('2012-01-01'),
          gender: 'Male',
          rollNumber: 'UNAUTH001'
        }
      })

      const response = await this.makeRequest('/api/auth/context/switch', {
        token: parentToken,
        newStudentId: unauthorizedStudentRecord.id
      })

      if (response.status === 403 && !response.data.success) {
        this.log('Parent Context Switch - Unauthorized', 'PASS', 'Correctly rejected unauthorized student')
      } else {
        this.log('Parent Context Switch - Unauthorized', 'FAIL', 'Did not reject unauthorized student', response)
      }

      // Clean up
      await db.student.delete({ where: { id: unauthorizedStudentRecord.id } })
      await db.user.delete({ where: { id: unauthorizedStudent.id } })
    } catch (error) {
      this.log('Parent Context Switch - Unauthorized', 'FAIL', `Request failed: ${error.message}`)
    }

    // Test non-parent role trying to switch student context
    const teacherToken = jwtService.createToken({
      userId: testData.teacher.id,
      role: UserRole.TEACHER,
      authorizedSchools: [testData.school1.id],
      activeSchoolId: testData.school1.id,
      permissions: []
    })

    try {
      const response = await this.makeRequest('/api/auth/context/switch', {
        token: teacherToken,
        newStudentId: testData.student1Record.id
      })

      if (response.status === 400 && response.data.error === 'No context switch requested') {
        this.log('Parent Context Switch - Non-Parent Role', 'PASS', 'Correctly rejected non-parent student switch')
      } else {
        this.log('Parent Context Switch - Non-Parent Role', 'FAIL', 'Did not reject non-parent student switch', response)
      }
    } catch (error) {
      this.log('Parent Context Switch - Non-Parent Role', 'FAIL', `Request failed: ${error.message}`)
    }
  }

  async testAuditLogging(testData: any) {
    console.log('\n📋 Testing Audit Logging...')

    const teacherToken = jwtService.createToken({
      userId: testData.teacher.id,
      role: UserRole.TEACHER,
      authorizedSchools: [testData.school1.id, testData.school2.id],
      activeSchoolId: testData.school1.id,
      permissions: []
    })

    // Clear existing audit logs
    await db.auditLog.deleteMany({
      where: { userId: testData.teacher.id }
    })

    try {
      const response = await this.makeRequest('/api/auth/context/switch', {
        token: teacherToken,
        newSchoolId: testData.school2.id
      }, {
        'x-forwarded-for': '203.0.113.1',
        'user-agent': 'Audit Test Agent'
      })

      if (response.status === 200) {
        // Check if audit log was created
        const auditLog = await db.auditLog.findFirst({
          where: {
            userId: testData.teacher.id,
            action: 'UPDATE',
            resource: 'school_context'
          },
          orderBy: { createdAt: 'desc' }
        })

        if (auditLog) {
          const changes = auditLog.changes as any
          if (changes.clientIP === '203.0.113.1' && changes.userAgent === 'Audit Test Agent') {
            this.log('Audit Logging - Complete Info', 'PASS', 'Audit log contains complete information')
          } else {
            this.log('Audit Logging - Complete Info', 'FAIL', 'Audit log missing client information', changes)
          }
        } else {
          this.log('Audit Logging - Log Creation', 'FAIL', 'Audit log was not created')
        }
      } else {
        this.log('Audit Logging - Context Switch', 'FAIL', 'Context switch failed', response)
      }
    } catch (error) {
      this.log('Audit Logging - Request', 'FAIL', `Request failed: ${error.message}`)
    }
  }

  async testErrorHandling() {
    console.log('\n🚨 Testing Error Handling...')

    // Test invalid token
    try {
      const response = await this.makeRequest('/api/auth/context/switch', {
        token: 'invalid-jwt-token',
        newSchoolId: 'some-school'
      })

      if (response.status === 401) {
        this.log('Error Handling - Invalid Token', 'PASS', 'Correctly handled invalid token')
      } else {
        this.log('Error Handling - Invalid Token', 'FAIL', 'Did not handle invalid token properly', response)
      }
    } catch (error) {
      this.log('Error Handling - Invalid Token', 'FAIL', `Request failed: ${error.message}`)
    }

    // Test expired token
    const expiredToken = jwtService.createToken({
      userId: 'test-user',
      role: UserRole.TEACHER,
      authorizedSchools: ['school-1'],
      activeSchoolId: 'school-1',
      permissions: []
    })

    // Create expired session
    await db.authSession.create({
      data: {
        userId: 'test-user',
        token: expiredToken,
        activeSchoolId: 'school-1',
        expiresAt: new Date(Date.now() - 1000) // Expired
      }
    })

    try {
      const response = await this.makeRequest('/api/auth/context/switch', {
        token: expiredToken,
        newSchoolId: 'some-school'
      })

      if (response.status === 401) {
        this.log('Error Handling - Expired Token', 'PASS', 'Correctly handled expired token')
      } else {
        this.log('Error Handling - Expired Token', 'FAIL', 'Did not handle expired token properly', response)
      }
    } catch (error) {
      this.log('Error Handling - Expired Token', 'FAIL', `Request failed: ${error.message}`)
    }
  }

  async testCORSHandling() {
    console.log('\n🌐 Testing CORS Handling...')

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/context/switch`, {
        method: 'OPTIONS'
      })

      if (response.status === 200) {
        const corsHeaders = {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
          'access-control-allow-headers': response.headers.get('access-control-allow-headers')
        }

        if (corsHeaders['access-control-allow-origin'] === '*' &&
            corsHeaders['access-control-allow-methods']?.includes('POST') &&
            corsHeaders['access-control-allow-headers']?.includes('Content-Type')) {
          this.log('CORS Handling - OPTIONS', 'PASS', 'CORS headers correctly set')
        } else {
          this.log('CORS Handling - OPTIONS', 'FAIL', 'CORS headers not set correctly', corsHeaders)
        }
      } else {
        this.log('CORS Handling - OPTIONS', 'FAIL', 'OPTIONS request failed')
      }
    } catch (error) {
      this.log('CORS Handling - OPTIONS', 'FAIL', `Request failed: ${error.message}`)
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...')

    try {
      await db.auditLog.deleteMany({ where: { userId: { contains: 'test-ctx-' } } })
      await db.authSession.deleteMany({ where: { userId: { contains: 'test-ctx-' } } })
      await db.studentParent.deleteMany({})
      await db.parent.deleteMany({ where: { userId: { contains: 'test-ctx-' } } })
      await db.student.deleteMany({ where: { userId: { contains: 'test-ctx-' } } })
      await db.userSchool.deleteMany({ where: { userId: { contains: 'test-ctx-' } } })
      await db.user.deleteMany({ where: { id: { contains: 'test-ctx-' } } })
      await db.school.deleteMany({ where: { id: { contains: 'test-ctx-' } } })

      console.log('✅ Cleanup complete')
    } catch (error) {
      console.error('❌ Cleanup failed:', error)
    }
  }

  printSummary() {
    console.log('\n📊 Test Summary')
    console.log('================')
    
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const total = this.results.length

    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed} ✅`)
    console.log(`Failed: ${failed} ❌`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.test}: ${r.message}`))
    }

    return { passed, failed, total }
  }

  async runAllTests() {
    console.log('🚀 Starting Context Switch Endpoint Tests')
    console.log('==========================================')

    try {
      const testData = await this.setupTestData()
      
      await this.testInputValidation()
      await this.testSchoolContextSwitching(testData)
      await this.testParentStudentContextSwitching(testData)
      await this.testAuditLogging(testData)
      await this.testErrorHandling()
      await this.testCORSHandling()
      
      await this.cleanupTestData()
      
      const summary = this.printSummary()
      
      if (summary.failed === 0) {
        console.log('\n🎉 All tests passed! Context switching endpoint is working correctly.')
        process.exit(0)
      } else {
        console.log('\n⚠️  Some tests failed. Please review the implementation.')
        process.exit(1)
      }
    } catch (error) {
      console.error('💥 Test execution failed:', error)
      await this.cleanupTestData()
      process.exit(1)
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ContextSwitchTester()
  tester.runAllTests()
}

export default ContextSwitchTester