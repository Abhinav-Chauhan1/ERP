/**
 * Session Refresh API Endpoint
 * Helps refresh user sessions after critical authentication events like school onboarding
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { refreshUserSession, validateCurrentSession } from "@/lib/auth/session-refresh";
import { logAuditEvent } from "@/lib/services/audit-service";
import { AuditAction } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - no active session" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Refresh the user's session data
    const refreshSuccess = await refreshUserSession(userId);
    
    if (!refreshSuccess) {
      await logAuditEvent({
        userId,
        action: AuditAction.UPDATE,
        resource: 'session_refresh',
        changes: {
          success: false,
          reason: 'Session refresh failed',
          timestamp: new Date()
        }
      });

      return NextResponse.json(
        { error: "Failed to refresh session" },
        { status: 500 }
      );
    }

    // Validate the refreshed session
    const validation = await validateCurrentSession();
    
    await logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      resource: 'session_refresh',
      changes: {
        success: refreshSuccess,
        validationResult: validation.isValid,
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      sessionValid: validation.isValid,
      message: "Session refreshed successfully"
    });

  } catch (error) {
    console.error("Session refresh API error:", error);
    
    return NextResponse.json(
      { error: "Internal server error during session refresh" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          isValid: false, 
          error: "No active session",
          debugInfo: {
            hasSession: !!session,
            hasUser: !!session?.user,
            hasUserId: !!session?.user?.id
          }
        },
        { status: 401 }
      );
    }

    // Validate current session without refreshing
    const validation = await validateCurrentSession();
    
    return NextResponse.json({
      isValid: validation.isValid,
      error: validation.error,
      sessionInfo: {
        userId: session.user.id,
        role: session.user.role,
        schoolId: session.user.schoolId,
        schoolName: session.user.schoolName
      }
    });

  } catch (error) {
    console.error("Session validation API error:", error);
    
    return NextResponse.json(
      { 
        isValid: false, 
        error: "Internal server error during session validation",
        debugInfo: {
          errorMessage: error instanceof Error ? error.message : "Unknown error"
        }
      },
      { status: 500 }
    );
  }
}