/**
 * R2 File Upload API Route
 * 
 * Handles file uploads to Cloudflare R2 with comprehensive validation and school isolation.
 * This route replaces Cloudinary upload functionality with R2-based storage.
 * 
 * Features:
 * - School-aware file uploads with automatic folder routing
 * - File type validation (MIME type and extension checking)
 * - Size limit enforcement (5MB images, 50MB documents)
 * - Presigned URL generation for secure uploads
 * - Metadata extraction and storage
 * - Error handling and retry logic
 * 
 * Requirements: 2.4, 3.5, 5.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadHandler } from '@/lib/services/upload-handler';
import { requireSchoolAccess } from '@/lib/auth/tenant';
import { rateLimitMiddleware, RateLimitPresets } from '@/lib/utils/rate-limit';
import { verifyCsrfToken } from '@/lib/utils/csrf';
import { z } from 'zod';

// Request validation schema
const uploadRequestSchema = z.object({
  folder: z.string().optional().default('general'),
  category: z.enum(['image', 'document']).optional(),
  generateThumbnails: z.boolean().optional().default(false),
  customMetadata: z.record(z.string()).optional(),
});

/**
 * POST /api/r2/upload
 * Upload file to R2 storage with school isolation
 * 
 * Request body (multipart/form-data):
 * - file: File to upload (required)
 * - csrf_token: CSRF token for request validation (required)
 * - folder: Target folder within school structure (optional, default: 'general')
 * - category: File category - 'image' or 'document' (optional, auto-detected)
 * - generateThumbnails: Generate image thumbnails (optional, default: false)
 * - customMetadata: Additional metadata as JSON string (optional)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify school access and get context
    const { schoolId, userId } = await requireSchoolAccess();
    
    // Ensure schoolId is not null
    if (!schoolId) {
      throw new Error("No active school found");
    }

    // 2. Rate limiting check (10 uploads per minute per user)
    const rateLimitResult = await rateLimitMiddleware(userId, RateLimitPresets.FILE_UPLOAD);
    
    if (rateLimitResult.exceeded) {
      const resetInSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return NextResponse.json({
        success: false,
        error: `Too many upload requests. Please try again in ${resetInSeconds} seconds.`,
        retryAfter: resetInSeconds,
      }, { 
        status: 429,
        headers: {
          'Retry-After': resetInSeconds.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        }
      });
    }

    // 3. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const csrfToken = formData.get('csrf_token') as string | null;
    const folder = formData.get('folder') as string || 'general';
    const category = formData.get('category') as string || undefined;
    const generateThumbnails = formData.get('generateThumbnails') === 'true';
    const customMetadataStr = formData.get('customMetadata') as string || '{}';

    // 4. Verify CSRF token
    const isCsrfValid = await verifyCsrfToken(csrfToken);
    if (!isCsrfValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid CSRF token',
      }, { status: 403 });
    }

    // 5. Validate file exists
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
      }, { status: 400 });
    }

    // 6. Parse and validate request parameters
    let customMetadata: Record<string, string> = {};
    try {
      customMetadata = JSON.parse(customMetadataStr);
    } catch {
      // Ignore invalid JSON, use empty object
    }

    const uploadOptions = {
      folder,
      category: category as 'image' | 'document' | undefined,
      generateThumbnails,
      customMetadata,
    };

    const validation = uploadRequestSchema.safeParse(uploadOptions);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid upload parameters',
        details: validation.error.errors,
      }, { status: 400 });
    }

    // 7. Upload file using upload handler
    const result = await uploadHandler.uploadFile(file, validation.data);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

    // 8. Return success response
    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        key: result.key,
        metadata: result.metadata,
      },
      message: 'File uploaded successfully to R2 storage',
    });

  } catch (error) {
    console.error('R2 upload API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }, { status: 500 });
  }
}

/**
 * GET /api/r2/upload
 * Generate presigned URL for direct client uploads
 * 
 * Query parameters:
 * - filename: Original filename (required)
 * - folder: Target folder within school structure (optional, default: 'general')
 * - contentType: File MIME type (required)
 * - expiresIn: URL expiration time in seconds (optional, default: 3600)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verify school access and get context
    const { schoolId } = await requireSchoolAccess();
    
    // Ensure schoolId is not null
    if (!schoolId) {
      throw new Error("No active school found");
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');
    const folder = searchParams.get('folder') || 'general';
    const contentType = searchParams.get('contentType');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600');

    // 3. Validate required parameters
    if (!filename) {
      return NextResponse.json({
        success: false,
        error: 'Filename is required',
      }, { status: 400 });
    }

    if (!contentType) {
      return NextResponse.json({
        success: false,
        error: 'Content type is required',
      }, { status: 400 });
    }

    // 4. Validate file type
    const mockFile = {
      name: filename,
      size: 0, // Size validation will happen on actual upload
      type: contentType,
      arrayBuffer: async () => new ArrayBuffer(0)
    };
    
    const validation = uploadHandler.validateFile(mockFile);

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 });
    }

    // 5. Generate unique key for the file
    const uniqueKey = uploadHandler.generateUniqueKey(schoolId, filename, folder);

    // 6. Generate presigned URL for PUT operation
    const { r2StorageService } = await import('@/lib/services/r2-storage-service');
    const presignedUrl = await r2StorageService.generatePresignedUrl(
      schoolId,
      uniqueKey,
      'PUT',
      expiresIn
    );

    // 7. Return presigned URL and metadata
    return NextResponse.json({
      success: true,
      data: {
        presignedUrl,
        key: uniqueKey,
        expiresIn,
        uploadUrl: presignedUrl,
      },
      message: 'Presigned URL generated successfully',
    });

  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate presigned URL',
    }, { status: 500 });
  }
}