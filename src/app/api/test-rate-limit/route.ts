/**
 * Test Rate Limit API Route
 * Used to test rate limiting functionality
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Rate limit test successful",
    timestamp: new Date().toISOString(),
  });
}
