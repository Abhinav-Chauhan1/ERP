/**
 * File Upload API Route
 * Handles file uploads with comprehensive security checks
 * Requirements: 1.2, 9.5
 * 
 * Security Features:
 * - Authentication verification
 * - Rate limiting (10 uploads per minute per user)
 * - CSRF token validation
 * - File type validation (client-declared MIME type)
 * - File size validation
 * - Magic number verification (server-side content check)
 * - Filename sanitization
 * - Cloudinary integration with signed uploads
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth-helpers";
import { rateLimitMiddleware, RateLimitPresets } from "@/lib/utils/rate-limit";
import { verifyCsrfToken } from "@/lib/utils/csrf";
import { 
  sanitizeFileName, 
  validateFileUploadSecure,
  generateSecureFileName,
  getFileExtension
} from "@/lib/utils/file-security";
import { uploadHandler } from "@/lib/services/upload-handler";

/**
 * POST /api/upload
 * Upload a file with comprehensive security checks
 * 
 * Request body (multipart/form-data):
 * - file: File to upload
 * - csrf_token: CSRF token for request validation
 * - folder: Optional folder path in Cloudinary
 * - category: Optional file category (avatar, document, attachment, general)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Rate limiting check (10 uploads per minute per user)
    const rateLimitResult = await rateLimitMiddleware(user.id, RateLimitPresets.FILE_UPLOAD);
    
    if (rateLimitResult.exceeded) {
      const resetInSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
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
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          }
        }
      );
    }

    // 3. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const csrfToken = formData.get("csrf_token") as string | null;
    const folder = formData.get("folder") as string | null;
    const category = formData.get("category") as string | null;

    // 4. Verify CSRF token
    const isCsrfValid = await verifyCsrfToken(csrfToken);
    
    if (!isCsrfValid) {
      return NextResponse.json(
        { success: false, message: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    // 5. Validate file exists
    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // 6. Validate file with magic number check (server-side)
    const validation = await validateFileUploadSecure(
      file, 
      category as any || "general"
    );
    
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    // 7. Generate secure filename
    const secureFileName = generateSecureFileName(file.name);
    const sanitizedOriginalName = sanitizeFileName(file.name);

    // 8. Upload to R2 with folder structure
    const uploadFolder = folder || `uploads/${user.id}`;
    
    try {
      const uploadResult = await uploadHandler.uploadFile(file, {
        folder: uploadFolder,
        customMetadata: {
          originalName: sanitizedOriginalName,
          uploadedBy: user.id
        }
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // 9. Return success with upload details
      return NextResponse.json({
        success: true,
        data: {
          url: uploadResult.url,
          key: uploadResult.key,
          fileName: sanitizedOriginalName,
          secureFileName: secureFileName,
          fileSize: file.size,
          fileType: file.type,
        },
        message: "File uploaded successfully"
      });

    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to upload file to storage. Please try again." 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload file" },
      { status: 500 }
    );
  }
}
