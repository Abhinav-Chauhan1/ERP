import { NextRequest, NextResponse } from "next/server"
import { authenticationService } from "@/lib/services/authentication-service"
import { logAuditEvent } from "@/lib/services/audit-service"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { signIn } from "@/auth"

/**
 * Super Admin Login API Endpoint
 * 
 * Handles dedicated secure authentication for super administrators.
 * Requirements: 3A.1, 3A.2, 3A.3, 3A.4, 3A.5
 */

// Rate limiting for super admin login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email is required' 
        },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password is required' 
        },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        },
        { status: 400 }
      )
    }

    // Get client information for security logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Enhanced rate limiting for super admin
    const attemptKey = `${clientIP}:${email.trim()}`
    const now = Date.now()
    const attempts = loginAttempts.get(attemptKey)

    if (attempts && attempts.count >= MAX_ATTEMPTS) {
      const timeSinceLastAttempt = now - attempts.lastAttempt
      if (timeSinceLastAttempt < LOCKOUT_DURATION) {
        await logAuditEvent({
          userId: 'anonymous',
          action: 'LOGIN',
          resource: 'super_admin_auth',
          changes: {
            email: email.trim(),
            reason: 'RATE_LIMITED',
            attempts: attempts.count,
            clientIP,
            userAgent,
            timestamp: new Date()
          }
        })

        return NextResponse.json(
          { 
            success: false, 
            error: 'Too many login attempts. Please wait before trying again.',
            code: 'RATE_LIMITED'
          },
          { status: 429 }
        )
      } else {
        // Reset attempts after lockout period
        loginAttempts.delete(attemptKey)
      }
    }

    try {
      // Find super admin user
      const user = await db.user.findFirst({
        where: {
          email: email.trim(),
          role: UserRole.SUPER_ADMIN,
          isActive: true
        }
      })

      if (!user) {
        // Increment failed attempts
        const currentAttempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 }
        loginAttempts.set(attemptKey, {
          count: currentAttempts.count + 1,
          lastAttempt: now
        })

        await logAuditEvent({
          userId: 'anonymous',
          action: 'LOGIN',
          resource: 'super_admin_auth',
          changes: {
            email: email.trim(),
            reason: 'USER_NOT_FOUND',
            clientIP,
            userAgent,
            timestamp: new Date()
          }
        })

        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS'
          },
          { status: 401 }
        )
      }

      // Validate password
      const isValidPassword = await authenticationService.validatePassword(user.id, password)

      if (!isValidPassword) {
        // Increment failed attempts
        const currentAttempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 }
        loginAttempts.set(attemptKey, {
          count: currentAttempts.count + 1,
          lastAttempt: now
        })

        await logAuditEvent({
          userId: user.id,
          action: 'LOGIN',
          resource: 'super_admin_auth',
          changes: {
            email: email.trim(),
            reason: 'INVALID_PASSWORD',
            clientIP,
            userAgent,
            timestamp: new Date()
          }
        })

        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS'
          },
          { status: 401 }
        )
      }

      // Clear failed attempts on successful login
      loginAttempts.delete(attemptKey)

      // Create NextAuth session using signIn
      try {
        const result = await signIn('credentials', {
          email: email.trim(),
          password: password,
          redirect: false
        })

        if (result?.error) {
          throw new Error(`NextAuth signIn failed: ${result.error}`)
        }

        // Log successful super admin login
        await logAuditEvent({
          userId: user.id,
          action: 'LOGIN',
          resource: 'super_admin_auth',
          changes: {
            email: email.trim(),
            clientIP,
            userAgent,
            timestamp: new Date()
          }
        })

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          redirectUrl: '/super-admin'
        })

      } catch (signInError) {
        console.error('NextAuth signIn error:', signInError)
        
        // Fallback: create session manually if NextAuth fails
        await authenticationService.createSession(
          user,
          'SYSTEM', // No specific school for super admin
          UserRole.SUPER_ADMIN
        )

        // Log successful super admin login
        await logAuditEvent({
          userId: user.id,
          action: 'LOGIN',
          resource: 'super_admin_auth',
          changes: {
            email: email.trim(),
            clientIP,
            userAgent,
            fallbackAuth: true,
            timestamp: new Date()
          }
        })

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          redirectUrl: '/super-admin'
        })
      }

    } catch (error: any) {
      console.error('Super admin authentication error:', error)

      // Log error
      await logAuditEvent({
        userId: 'anonymous',
        action: 'LOGIN',
        resource: 'super_admin_auth',
        changes: {
          email: email.trim(),
          error: error.message,
          errorCode: error.code,
          clientIP,
          userAgent,
          timestamp: new Date()
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication system error' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Super admin login API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}