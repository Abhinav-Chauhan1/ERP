import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendSMS } from "@/lib/services/sms-service"
import bcrypt from "bcryptjs"

/**
 * OTP Generation API Endpoint
 * 
 * Generates OTP for NextAuth login flow and sends via SMS using MSG91.
 */

export async function POST(request: NextRequest) {
  try {
    const { identifier, schoolCode } = await request.json()

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Mobile number or email is required'
        },
        { status: 400 }
      )
    }

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

    // Find user by identifier
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { mobile: identifier }
        ],
        isActive: true,
        userSchools: {
          some: {
            schoolId: school.id,
            isActive: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No account found with this mobile number or email for the selected school'
        },
        { status: 404 }
      )
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Hash the OTP code before storing (security best practice)
    const codeHash = await bcrypt.hash(otpCode, 10)

    // Store OTP in database
    await db.oTP.create({
      data: {
        identifier: identifier,
        codeHash: codeHash, // Store hashed OTP, not plain text
        expiresAt: expiresAt,
        isUsed: false
      }
    })

    // Send OTP via SMS if it's a mobile number
    const isMobile = /^\d{10}$/.test(identifier.trim())
    if (isMobile) {
      try {
        // Format mobile number to E.164 format
        const formattedMobile = `+91${identifier.trim()}`
        const message = `Your OTP for ${school.name} login is: ${otpCode}. Valid for 5 minutes. Do not share this code.`

        // Send SMS using MSG91 service
        const smsResult = await sendSMS(formattedMobile, message)

        if (!smsResult.success) {
          console.error('Failed to send OTP SMS:', smsResult.error)
          // Continue without failing - OTP is still stored in database
        }
      } catch (error) {
        console.error('Error sending OTP SMS:', error)
        // Continue without failing - OTP is still stored in database
      }
    }

    // For development/testing, also log the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${identifier}: ${otpCode}`)
    }

    return NextResponse.json({
      success: true,
      message: isMobile ? 'OTP sent to your mobile number' : 'OTP generated successfully',
      expiresAt: expiresAt
    })

  } catch (error) {
    console.error('OTP generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}