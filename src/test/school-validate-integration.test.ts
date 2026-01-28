import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST } from '@/app/api/auth/school-validate/route'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { SchoolStatus } from '@prisma/client'

describe('School Validation Integration Test', () => {
  let testSchoolId: string
  let inactiveSchoolId: string

  beforeAll(async () => {
    // Create test schools
    const activeSchool = await db.school.create({
      data: {
        name: 'Test Active School',
        schoolCode: 'TESTACTIVE001',
        status: SchoolStatus.ACTIVE,
        isOnboarded: true
      }
    })
    testSchoolId = activeSchool.id

    const inactiveSchool = await db.school.create({
      data: {
        name: 'Test Inactive School',
        schoolCode: 'TESTINACTIVE001',
        status: SchoolStatus.SUSPENDED, // Changed from INACTIVE to SUSPENDED
        isOnboarded: false
      }
    })
    inactiveSchoolId = inactiveSchool.id
  })

  afterAll(async () => {
    // Clean up test data
    await db.school.deleteMany({
      where: {
        id: {
          in: [testSchoolId, inactiveSchoolId]
        }
      }
    })
  })

  it('should validate an active school code', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/school-validate', {
      method: 'POST',
      body: JSON.stringify({ schoolCode: 'TESTACTIVE001' }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.school).toMatchObject({
      id: testSchoolId,
      name: 'Test Active School',
      schoolCode: 'TESTACTIVE001',
      isOnboarded: true
    })
  })

  it('should reject inactive school codes', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/school-validate', {
      method: 'POST',
      body: JSON.stringify({ schoolCode: 'TESTINACTIVE001' }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.code).toBe('SCHOOL_INACTIVE')
    expect(data.error).toBe('This school is currently inactive. Please contact support.')
  })

  it('should reject non-existent school codes', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/school-validate', {
      method: 'POST',
      body: JSON.stringify({ schoolCode: 'NONEXISTENT999' }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid school code')
  })

  it('should handle case insensitive school codes', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/school-validate', {
      method: 'POST',
      body: JSON.stringify({ schoolCode: 'testactive001' }), // lowercase
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.school.schoolCode).toBe('TESTACTIVE001')
  })

  it('should trim whitespace from school codes', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/school-validate', {
      method: 'POST',
      body: JSON.stringify({ schoolCode: '  TESTACTIVE001  ' }), // with whitespace
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.school.schoolCode).toBe('TESTACTIVE001')
  })
})