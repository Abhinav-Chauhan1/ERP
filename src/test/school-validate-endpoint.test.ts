import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/auth/school-validate/route'
import { NextRequest } from 'next/server'

// Mock the school context service
vi.mock('@/lib/services/school-context-service', () => ({
  schoolContextService: {
    validateSchoolCode: vi.fn()
  }
}))

// Mock the audit service
vi.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: vi.fn()
}))

describe('School Validation Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate a valid school code', async () => {
    const { schoolContextService } = await import('@/lib/services/school-context-service')
    
    // Mock a valid school
    const mockSchool = {
      id: 'school-1',
      name: 'Test School',
      schoolCode: 'TEST001',
      isOnboarded: true
    }
    
    vi.mocked(schoolContextService.validateSchoolCode).mockResolvedValue(mockSchool)

    const request = new NextRequest('http://localhost:3000/api/auth/school-validate', {
      method: 'POST',
      body: JSON.stringify({ schoolCode: 'TEST001' }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.school).toEqual({
      id: 'school-1',
      name: 'Test School',
      schoolCode: 'TEST001',
      isOnboarded: true
    })
  })

  it('should reject invalid school codes', async () => {
    const { schoolContextService } = await import('@/lib/services/school-context-service')
    
    vi.mocked(schoolContextService.validateSchoolCode).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/school-validate', {
      method: 'POST',
      body: JSON.stringify({ schoolCode: 'INVALID' }),
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

  it('should handle missing school code', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/school-validate', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('School code is required')
  })

  it('should handle inactive schools', async () => {
    const { schoolContextService } = await import('@/lib/services/school-context-service')
    
    // Create a mock error that matches the SchoolInactiveError structure
    const mockError = new Error('School is inactive: INACTIVE001')
    mockError.name = 'SchoolContextError'
    ;(mockError as any).code = 'SCHOOL_INACTIVE'
    
    vi.mocked(schoolContextService.validateSchoolCode).mockRejectedValue(mockError)

    const request = new NextRequest('http://localhost:3000/api/auth/school-validate', {
      method: 'POST',
      body: JSON.stringify({ schoolCode: 'INACTIVE001' }),
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
})