import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { sessionContextService } from "@/lib/services/session-context-service"

/**
 * Parent Children API Endpoint
 * 
 * Returns the children a parent has access to for child selection.
 * Requirements: 6.1, 6.4
 */

export async function GET(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required' 
        },
        { status: 401 }
      )
    }

    // Verify user is a parent
    if (session.user.role !== 'PARENT') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied. Parent role required.' 
        },
        { status: 403 }
      )
    }

    // Get children for this parent
    const children = await sessionContextService.getParentChildren(
      session.user.id,
      session.user.schoolId || undefined
    )

    return NextResponse.json({
      success: true,
      children
    })

  } catch (error) {
    console.error('Parent children API error:', error)
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