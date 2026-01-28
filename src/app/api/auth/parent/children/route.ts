import { NextRequest, NextResponse } from "next/server"
import { jwtService } from "@/lib/services/jwt-service"
import { sessionContextService } from "@/lib/services/session-context-service"

/**
 * Parent Children API Endpoint
 * 
 * Returns the children a parent has access to for child selection.
 * Requirements: 6.1, 6.4
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

    const { userId, role, activeSchoolId } = tokenValidation.payload

    // Verify user is a parent
    if (role !== 'PARENT') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Only parents can access this endpoint' 
        },
        { status: 403 }
      )
    }

    // Get parent's children
    const children = await sessionContextService.getParentChildren(userId, activeSchoolId)

    return NextResponse.json({
      success: true,
      children: children.map(child => ({
        id: child.id,
        name: child.name,
        class: child.class,
        section: child.section,
        rollNumber: child.rollNumber
      }))
    })

  } catch (error) {
    console.error('Get parent children API error:', error)
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