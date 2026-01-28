import { NextRequest, NextResponse } from "next/server"
import { jwtService } from "@/lib/services/jwt-service"
import { sessionContextService } from "@/lib/services/session-context-service"

/**
 * User Schools API Endpoint
 * 
 * Returns the schools a user has access to for school selection.
 * Requirements: 5.1, 5.4
 */

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication token is required' 
        },
        { status: 401 }
      )
    }

    // Verify token
    const tokenValidation = await jwtService.verifyToken(token)
    
    if (!tokenValidation.valid || !tokenValidation.payload) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or expired token' 
        },
        { status: 401 }
      )
    }

    const { userId } = tokenValidation.payload

    // Get user's available schools
    const schools = await sessionContextService.getUserSchools(userId)

    return NextResponse.json({
      success: true,
      schools: schools.map(school => ({
        id: school.id,
        name: school.name,
        schoolCode: school.schoolCode
      }))
    })

  } catch (error) {
    console.error('Get user schools API error:', error)
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}