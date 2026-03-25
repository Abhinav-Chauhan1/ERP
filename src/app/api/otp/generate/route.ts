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

    // Rate limiting: max 3 OTPs per 10 minutes per identifier
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentOtpCount = await db.oTP.count({
      where: {
        identifier,
        createdAt: { gte: tenMinutesAgo },
      },
    })
    if (recentOtpCount >= 3) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // Cooldown: reject if an unexpired OTP was created less than 60 seconds ago
    const existingOtp = await db.oTP.findFirst({
      where: {
        identifier,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (existingOtp) {
      const secondsAgo = (Date.now() - existingOtp.createdAt.getTime()) / 1000
      if (secondsAgo < 60) {
        return NextResponse.json(
          { success: false, error: 'Please wait before requesting a new OTP.' },
          { status: 429 }
        )
      }
    }

    // Find user by identifier — normalize error to prevent account enumeration
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
        { success: true, message: 'If an account exists, an OTP will be sent.' },
        { status: 200 }
      )
    }

    // Invalidate any existing unused OTPs for this identifier
    await db.oTP.updateMany({
      where: { identifier, isUsed: false },
      data: { isUsed: true },
    })

    // Generate 6-digit OTP using crypto for better randomness
    const randomBuffer = new Uint32Array(1)
    crypto.getRandomValues(randomBuffer)
    const otpCode = (100000 + (randomBuffer[0] % 900000)).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Hash the OTP code before storing (security best practice)
    const codeHash = await bcrypt.hash(otpCode, 10)

    // Store OTP in database
    await db.oTP.create({
      data: {
        identifier: identifier,
        codeHash: codeHash,
        expiresAt: expiresAt,
        isUsed: false
      }
    })

    // Send OTP via SMS if it's a mobile number
    const isMobile = /^\d{10}$/.test(identifier.trim())
    console.log('📱 Mobile detection:', { identifier, trimmed: identifier.trim(), isMobile })

    if (isMobile) {
      try {
        // Format mobile number to E.164 format
        const formattedMobile = `+91${identifier.trim()}`
        const message = `Your OTP for ${school.name} login is: ${otpCode}. Valid for 5 minutes. Do not share this code.`

        console.log('📤 Attempting to send SMS:', { to: formattedMobile, message })

        // Send SMS using MSG91 service
        const smsResult = await sendSMS(formattedMobile, message)

        console.log('✅ SMS Result:', smsResult)

        if (!smsResult.success) {
          console.error('Failed to send OTP SMS:', smsResult.error)
          // Continue without failing - OTP is still stored in database
        } else {
          console.log('✅ SMS sent successfully! Message ID:', smsResult.messageId)
        }
      } catch (error) {
        console.error('Error sending OTP SMS:', error)
        // Continue without failing - OTP is still stored in database
      }
    } else {
      console.log('⚠️ Not sending SMS - identifier is not a 10-digit mobile number')
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