/**
 * CSRF Token API Route
 * Generates and returns a CSRF token for client-side forms
 * Requirements: 10.1, 10.2
 */

import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/utils/csrf";
import { currentUser } from "@/lib/auth-helpers";

/**
 * GET /api/csrf-token
 * Generate and return a CSRF token
 */
export async function GET() {
  try {
    // Verify user is authenticated
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Generate CSRF token
    const token = await generateCsrfToken();
    
    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate CSRF token" },
      { status: 500 }
    );
  }
}
