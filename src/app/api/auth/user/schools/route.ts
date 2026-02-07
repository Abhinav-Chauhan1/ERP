import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { sessionContextService } from "@/lib/services/session-context-service"

/**
 * User Schools API Endpoint
 * 
 * Returns the schools a user has access to for school selection.
 * Requirements: 5.1, 5.4
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

    // Get schools for this user
    const schools = await sessionContextService.getUserSchools(session.user.id)

    return NextResponse.json({
      success: true,
      schools
    })

  } catch (error) {
    console.error('User schools API error:', error)
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