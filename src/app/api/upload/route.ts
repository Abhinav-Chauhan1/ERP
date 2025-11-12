/**
 * File Upload API Route
 * Handles file uploads with rate limiting and validation
 * Requirements: 10.2, 10.4, 10.5
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { rateLimitMiddleware, RateLimitPresets } from "@/lib/utils/rate-limit";
import { verifyCsrfToken } from "@/lib/utils/csrf";
import { sanitizeFileName, validateFileUpload } from "@/lib/utils/file-security";

/**
 * POST /api/upload
 * Upload a file with security checks
 */
export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting check
    const rateLimitResult = rateLimitMiddleware(user.id, RateLimitPresets.FILE_UPLOAD);
    
    if (rateLimitResult.exceeded) {
      const resetInSeconds = Math.ceil(rateLimitResult.resetTime / 1000);
      return NextResponse.json(
        { 
          success: false, 
          message: `Too many upload requests. Please try again in ${resetInSeconds} seconds.`,
          retryAfter: resetInSeconds
        },
        { 
          status: 429,
          headers: {
            'Retry-After': resetInSeconds.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          }
        }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const csrfToken = formData.get("csrf_token") as string | null;

    // Verify CSRF token
    const isCsrfValid = await verifyCsrfToken(csrfToken);
    
    if (!isCsrfValid) {
      return NextResponse.json(
        { success: false, message: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFileUpload(file);
    
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedFileName = sanitizeFileName(file.name);

    // Here you would typically upload to cloud storage (Cloudinary, S3, etc.)
    // For now, we'll just return success with the sanitized filename
    
    return NextResponse.json({
      success: true,
      data: {
        fileName: sanitizedFileName,
        fileSize: file.size,
        fileType: file.type,
      },
      message: "File uploaded successfully"
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload file" },
      { status: 500 }
    );
  }
}
