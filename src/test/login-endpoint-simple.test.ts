import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'

/**
 * Login Endpoint Simple Tests
 * 
 * Basic tests for the /api/auth/login endpoint input validation.
 * Requirements: 1.1, 2.1, 4.1, 5.1, 6.1, 11.1
 */

describe('Login Endpoint Input Validation', () => {
  it('should reject request without identifier', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: 'school-1',
        credentials: { type: 'otp', value: '123456' }
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Mobile number or email is required')
  })

  it('should reject request with empty identifier', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: '',
        schoolId: 'school-1',
        credentials: { type: 'otp', value: '123456' }
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Mobile number or email is required')
  })

  it('should reject request without schoolId', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: '9876543210',
        credentials: { type: 'otp', value: '123456' }
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('School ID is required')
  })

  it('should reject request without credentials', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: '9876543210',
        schoolId: 'school-1'
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Authentication credentials are required')
  })

  it('should reject request with invalid credentials type', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: '9876543210',
        schoolId: 'school-1',
        credentials: { type: 'invalid', value: '123456' }
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid authentication method')
  })

  it('should reject request with missing credentials value', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: '9876543210',
        schoolId: 'school-1',
        credentials: { type: 'otp' }
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Authentication credentials are required')
  })

  it('should handle malformed JSON gracefully', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: 'invalid json',
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })

  it('should handle OPTIONS request for CORS', async () => {
    const { OPTIONS } = await import('@/app/api/auth/login/route')
    
    const response = await OPTIONS()
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type')
  })
})