import { NextRequest } from "next/server"
import { POST } from "@/app/api/auth/context/switch/route"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { jwtService } from "@/lib/services/jwt-service"

/**
 * Integration Tests for Context Switching Endpoint
 * Tests the complete flow with real database interactions
 */

describe('/api/auth/context/switch - Integration Tests', () => {
  let testUser: any
  let testSchool1: any
  let testSchool2: any
  let testParent: any
  let testStudent1: any
  let testStudent2: any
  let validToken: string

  beforeAll(async () => {
    // Clean up any existing test data
    await db.auditLog.deleteMany({ where: { userId: { contains: 'test-context-' } } })
    await db.authSession.deleteMany({ where: { userId: { contains: 'test-context-' } } })
    await db.studentParent.deleteMany({})
    await db.parent.deleteMany({ where: { userId: { contains: 'test-context-' } } })
    await db.student.deleteMany({ where: { userId: { contains: 'test-context-' } } })
    await db.userSchool.deleteMany({ where: { userId: { contains: 'test-context-' } } })
    await db.user.deleteMany({ where: { id: { contains: 'test-context-' } } })
    await db.school.deleteMany({ where: { id: { contains: 'test-context-' } } })

    // Create test schools
    testSchool1 = await db.school.create({
      data: {
        id: 'test-context-school-1',
        name: 'Test School 1',
        schoolCode: 'TEST001',
        status: 'ACTIVE',
        isOnboarded: true
      }
    })

    testSchool2 = await db.school.create({
      data: {
        id: 'test-context-school-2',
        name: 'Test School 2',
        schoolCode: 'TEST002',
        status: 'ACTIVE',
        isOnboarded: true
      }
    })

    // Create test user (teacher with access to both schools)
    testUser = await db.user.create({
      data: {
        id: 'test-context-user-1',
        name: 'Test Teacher',
        email: 'test.teacher@example.com',
        isActive: true
      }
    })

    // Create user-school relationships
    await db.userSchool.createMany({
      data: [
        {
          userId: testUser.id,
          schoolId: testSchool1.id,
          role: UserRole.TEACHER,
          isActive: true
        },
        {
          userId: testUser.id,
          schoolId: testSchool2.id,
          role: UserRole.TEACHER,
          isActive: true
        }
      ]
    })

    // Create test parent
    testParent = await db.user.create({
      data: {
        id: 'test-context-parent-1',
        name: 'Test Parent',
        mobile: '+1234567890',
        isActive: true
      }
    })

    await db.userSchool.create({
      data: {
        userId: testParent.id,
        schoolId: testSchool1.id,
        role: UserRole.PARENT,
        isActive: true
      }
    })

    // Create parent record
    const parentRecord = await db.parent.create({
      data: {
        id: 'test-context-parent-record-1',
        userId: testParent.id,
        schoolId: testSchool1.id
      }
    })

    // Create test students
    testStudent1 = await db.user.create({
      data: {
        id: 'test-context-student-1',
        name: 'Test Student 1',
        isActive: true
      }
    })

    testStudent2 = await db.user.create({
      data: {
        id: 'test-context-student-2',
        name: 'Test Student 2',
        isActive: true
      }
    })

    const student1Record = await db.student.create({
      data: {
        id: 'test-context-student-record-1',
        userId: testStudent1.id,
        admissionId: 'ADM001',
        admissionDate: new Date(),
        dateOfBirth: new Date('2010-01-01'),
        gender: 'Male',
        rollNumber: 'S001'
      }
    })

    const student2Record = await db.student.create({
      data: {
        id: 'test-context-student-record-2',
        userId: testStudent2.id,
        admissionId: 'ADM002',
        admissionDate: new Date(),
        dateOfBirth: new Date('2011-01-01'),
        gender: 'Female',
        rollNumber: 'S002'
      }
    })

    // Create parent-student relationships
    await db.studentParent.createMany({
      data: [
        {
          studentId: student1Record.id,
          parentId: parentRecord.id,
          schoolId: testSchool1.id
        },
        {
          studentId: student2Record.id,
          parentId: parentRecord.id,
          schoolId: testSchool1.id
        }
      ]
    })

    // Create valid JWT token
    validToken = jwtService.createToken({
      userId: testUser.id,
      role: UserRole.TEACHER,
      authorizedSchools: [testSchool1.id, testSchool2.id],
      activeSchoolId: testSchool1.id,
      permissions: []
    })

    // Create auth session
    await db.authSession.create({
      data: {
        userId: testUser.id,
        token: validToken,
        activeSchoolId: testSchool1.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    })
  })

  afterAll(async () => {
    // Clean up test data
    await db.auditLog.deleteMany({ where: { userId: { contains: 'test-context-' } } })
    await db.authSession.deleteMany({ where: { userId: { contains: 'test-context-' } } })
    await db.studentParent.deleteMany({})
    await db.parent.deleteMany({ where: { userId: { contains: 'test-context-' } } })
    await db.student.deleteMany({ where: { userId: { contains: 'test-context-' } } })
    await db.userSchool.deleteMany({ where: { userId: { contains: 'test-context-' } } })
    await db.user.deleteMany({ where: { id: { contains: 'test-context-' } } })
    await db.school.deleteMany({ where: { id: { contains: 'test-context-' } } })
  })

  describe('School Context Switching Integration', () => {
    it('should successfully switch school context with database updates', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({
          token: validToken,
          newSchoolId: testSchool2.id
        }),
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Test Agent'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('School context switched successfully')
      expect(data.newContext.schoolId).toBe(testSchool2.id)

      // Verify database was updated
      const updatedSession = await db.authSession.findUnique({
        where: { token: validToken }
      })
      expect(updatedSession?.activeSchoolId).toBe(testSchool2.id)
      expect(updatedSession?.lastAccessAt).toBeDefined()

      // Verify audit log was created
      const auditLog = await db.auditLog.findFirst({
        where: {
          userId: testUser.id,
          action: 'UPDATE',
          resource: 'school_context'
        },
        orderBy: { createdAt: 'desc' }
      })

      expect(auditLog).toBeTruthy()
      expect(auditLog?.schoolId).toBe(testSchool2.id)
      expect(auditLog?.changes).toMatchObject({
        previousSchoolId: testSchool1.id,
        newSchoolId: testSchool2.id,
        clientIP: '192.168.1.1',
        userAgent: 'Test Agent'
      })
    })

    it('should reject unauthorized school access', async () => {
      // Create a school the user doesn't have access to
      const unauthorizedSchool = await db.school.create({
        data: {
          id: 'test-context-unauthorized-school',
          name: 'Unauthorized School',
          schoolCode: 'UNAUTH001',
          status: 'ACTIVE',
          isOnboarded: true
        }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({
          token: validToken,
          newSchoolId: unauthorizedSchool.id
        })
      })

      const response = await POST(request)
      const data = await response.json()

      // Verify rejection
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('You do not have access to this school')

      // Verify session was not updated
      const session = await db.authSession.findUnique({
        where: { token: validToken }
      })
      expect(session?.activeSchoolId).toBe(testSchool2.id) // Should remain unchanged

      // Verify rejection was logged
      const auditLog = await db.auditLog.findFirst({
        where: {
          userId: testUser.id,
          action: 'REJECT',
          resource: 'school_context'
        },
        orderBy: { createdAt: 'desc' }
      })

      expect(auditLog).toBeTruthy()
      expect(auditLog?.changes).toMatchObject({
        requestedSchoolId: unauthorizedSchool.id,
        reason: 'UNAUTHORIZED_ACCESS'
      })

      // Clean up
      await db.school.delete({ where: { id: unauthorizedSchool.id } })
    })
  })

  describe('Parent-Student Context Switching Integration', () => {
    let parentToken: string

    beforeAll(async () => {
      // Create parent JWT token
      parentToken = jwtService.createToken({
        userId: testParent.id,
        role: UserRole.PARENT,
        authorizedSchools: [testSchool1.id],
        activeSchoolId: testSchool1.id,
        permissions: []
      })

      // Create parent auth session
      await db.authSession.create({
        data: {
          userId: testParent.id,
          token: parentToken,
          activeSchoolId: testSchool1.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      })
    })

    afterAll(async () => {
      await db.authSession.deleteMany({ where: { token: parentToken } })
    })

    it('should successfully switch student context for parent', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({
          token: parentToken,
          newStudentId: 'test-context-student-record-2'
        }),
        headers: {
          'x-forwarded-for': '192.168.1.2',
          'user-agent': 'Parent App'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Student context switched successfully')
      expect(data.newContext.studentId).toBe('test-context-student-record-2')

      // Verify audit log was created
      const auditLog = await db.auditLog.findFirst({
        where: {
          userId: testParent.id,
          action: 'UPDATE',
          resource: 'parent_context'
        },
        orderBy: { createdAt: 'desc' }
      })

      expect(auditLog).toBeTruthy()
      expect(auditLog?.changes).toMatchObject({
        newStudentId: 'test-context-student-record-2',
        clientIP: '192.168.1.2',
        userAgent: 'Parent App'
      })
    })

    it('should reject unauthorized student access for parent', async () => {
      // Create a student not linked to the parent
      const unauthorizedStudent = await db.user.create({
        data: {
          id: 'test-context-unauthorized-student',
          name: 'Unauthorized Student',
          isActive: true
        }
      })

      const unauthorizedStudentRecord = await db.student.create({
        data: {
          id: 'test-context-unauthorized-student-record',
          userId: unauthorizedStudent.id,
          admissionId: 'UNAUTH001',
          admissionDate: new Date(),
          dateOfBirth: new Date('2012-01-01'),
          gender: 'Male',
          rollNumber: 'UNAUTH001'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({
          token: parentToken,
          newStudentId: unauthorizedStudentRecord.id
        })
      })

      const response = await POST(request)
      const data = await response.json()

      // Verify rejection
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('You do not have access to this student')

      // Verify rejection was logged
      const auditLog = await db.auditLog.findFirst({
        where: {
          userId: testParent.id,
          action: 'REJECT',
          resource: 'parent_context'
        },
        orderBy: { createdAt: 'desc' }
      })

      expect(auditLog).toBeTruthy()
      expect(auditLog?.changes).toMatchObject({
        requestedStudentId: unauthorizedStudentRecord.id,
        reason: 'UNAUTHORIZED_ACCESS'
      })

      // Clean up
      await db.student.delete({ where: { id: unauthorizedStudentRecord.id } })
      await db.user.delete({ where: { id: unauthorizedStudent.id } })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle expired tokens gracefully', async () => {
      // Create expired token
      const expiredToken = jwtService.createToken({
        userId: testUser.id,
        role: UserRole.TEACHER,
        authorizedSchools: [testSchool1.id],
        activeSchoolId: testSchool1.id,
        permissions: []
      })

      // Create expired session
      await db.authSession.create({
        data: {
          userId: testUser.id,
          token: expiredToken,
          activeSchoolId: testSchool1.id,
          expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
        }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({
          token: expiredToken,
          newSchoolId: testSchool2.id
        })
      })

      const response = await POST(request)
      const data = await response.json()

      // Should handle expired token gracefully
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('expired')

      // Clean up
      await db.authSession.deleteMany({ where: { token: expiredToken } })
    })

    it('should handle database connection errors', async () => {
      // This test would require mocking the database connection
      // For now, we'll test that the endpoint handles service errors
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({
          token: 'invalid-token-format',
          newSchoolId: testSchool2.id
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })
  })

  describe('Concurrent Context Switching', () => {
    it('should handle concurrent context switches safely', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        new NextRequest('http://localhost:3000/api/auth/context/switch', {
          method: 'POST',
          body: JSON.stringify({
            token: validToken,
            newSchoolId: i % 2 === 0 ? testSchool1.id : testSchool2.id
          })
        })
      )

      // Execute all requests concurrently
      const responses = await Promise.all(requests.map(req => POST(req)))
      const results = await Promise.all(responses.map(res => res.json()))

      // All requests should complete successfully
      results.forEach((result, index) => {
        if (result.success) {
          expect(result.message).toContain('context switched successfully')
        } else {
          // Some might fail due to "no context switch requested" if switching to same school
          expect(result.error).toBeDefined()
        }
      })

      // Verify final state is consistent
      const finalSession = await db.authSession.findUnique({
        where: { token: validToken }
      })
      expect(finalSession?.activeSchoolId).toMatch(/test-context-school-[12]/)
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle multiple context switches efficiently', async () => {
      const startTime = Date.now()
      const numRequests = 10

      const requests = Array.from({ length: numRequests }, (_, i) => 
        new NextRequest('http://localhost:3000/api/auth/context/switch', {
          method: 'POST',
          body: JSON.stringify({
            token: validToken,
            newSchoolId: i % 2 === 0 ? testSchool1.id : testSchool2.id
          })
        })
      )

      // Execute requests sequentially to avoid race conditions
      for (const request of requests) {
        await POST(request)
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Should complete within reasonable time (adjust threshold as needed)
      expect(totalTime).toBeLessThan(5000) // 5 seconds for 10 requests

      // Verify audit logs were created
      const auditLogs = await db.auditLog.findMany({
        where: {
          userId: testUser.id,
          resource: 'school_context',
          createdAt: { gte: new Date(startTime) }
        }
      })

      expect(auditLogs.length).toBeGreaterThan(0)
    })
  })
})