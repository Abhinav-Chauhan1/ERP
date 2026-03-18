import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * School Validation API Endpoint
 * 
 * Validates school code for NextAuth login flow.
 */

export async function POST(request: NextRequest) {
  try {
    const { schoolCode } = await request.json()

    if (!schoolCode || typeof schoolCode !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'School code is required' 
        },
        { status: 400 }
      )
    }

    // Find school by code
    const school = await db.school.findFirst({
      where: {
        schoolCode: schoolCode.trim(),
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        schoolCode: true,
        logo: true,
        settings: {
          select: {
            schoolLogo: true
          }
        }
      }
    })

    if (!school) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid school code' 
        },
        { status: 404 }
      )
    }

    // Prefer settings.schoolLogo over School.logo
    const { settings, ...schoolData } = school
    return NextResponse.json({
      success: true,
      school: {
        ...schoolData,
        logo: settings?.schoolLogo || school.logo || null
      }
    })

  } catch (error) {
    console.error('School validation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}