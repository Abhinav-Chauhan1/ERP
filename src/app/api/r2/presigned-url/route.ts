/**
 * R2 Presigned URL Generation API Route
 * 
 * Generates secure presigned URLs for R2 file operations.
 * Supports both GET (download) and PUT (upload) operations with school isolation.
 * 
 * Features:
 * - Secure presigned URL generation for GET and PUT operations
 * - School-based access validation
 * - Configurable expiration times
 * - File type validation for uploads
 * - Rate limiting for security
 * 
 * Requirements: 2.4, 7.5, 8.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { r2StorageService } from '@/lib/services/r2-storage-service';
import { uploadHandler } from '@/lib/services/upload-handler';
import { requireSchoolAccess } from '@/lib/auth/tenant';
import { rateLimitMiddleware, RateLimitPresets } from '@/lib/utils/rate-limit';
import { z } from 'zod';

// Request validation schemas
const presignedUrlSchema = z.object({
  key: z.string().min(1, 'File key is required'),
  operation: z.enum(['GET', 'PUT'], { required_error: 'Operation must be GET or PUT' }),
  expiresIn: z.number().min(60).max(86400).optional().default(3600), // 1 minute to 24 hours
});

const uploadPresignedUrlSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  folder: z.string().optional().default('general'),
  contentType: z.string().min(1, 'Content type is required'),
  expiresIn: z.number().min(60).max(86400).optional().default(3600),
});

/**
 * GET /api/r2/presigned-url
 * Generate presigned URL for file access or upload
 * 
 * Query parameters:
 * - key: File key (required for existing files)
 * - filename: Original filename (required for new uploads)
 * - folder: Target folder (optional, default: 'general')
 * - contentType: File MIME type (required for uploads)
 * - operation: 'GET' or 'PUT' (required)
 * - expiresIn: URL expiration time in seconds (optional, default: 3600)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify school access and get context
    const { schoolId, userId } = await requireSchoolAccess();
    
    // Ensure schoolId is not null
    if (!schoolId) {
      throw new Error("No active school found");
    }

    // Rate limiting check (50 presigned URLs per minute per user)
    const rateLimitResult = await rateLimitMiddleware(userId, {
      window: 60 * 1000, // 1 minute
      limit: 50,
    });
    
    if (rateLimitResult.exceeded) {
      const resetInSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return NextResponse.json({
        success: false,
        error: `Too many presigned URL requests. Please try again in ${resetInSeconds} seconds.`,
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

    const { searchParams } = new URL(req.url);
    const operation = searchParams.get('operation') as 'GET' | 'PUT';
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600');

    if (operation === 'GET') {
      // Generate presigned URL for existing file download
      const key = searchParams.get('key');
      
      const validation = presignedUrlSchema.safeParse({
        key,
        operation,
        expiresIn,
      });

      if (!validation.success) {
        return NextResponse.json({
          success: false,
          error: 'Invalid parameters',
          details: validation.error.errors,
        }, { status: 400 });
      }

      // Verify file exists and belongs to school
      const fileExists = await r2StorageService.fileExists(schoolId, key!);
      if (!fileExists) {
        return NextResponse.json({
          success: false,
          error: 'File not found or access denied',
        }, { status: 404 });
      }

      // Generate presigned URL for download
      const presignedUrl = await r2StorageService.generatePresignedUrl(
        schoolId,
        key!,
        'GET',
        expiresIn
      );

      return NextResponse.json({
        success: true,
        data: {
          presignedUrl,
          key,
          operation: 'GET',
          expiresIn,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
        },
        message: 'Download presigned URL generated successfully',
      });

    } else if (operation === 'PUT') {
      // Generate presigned URL for new file upload
      const filename = searchParams.get('filename');
      const folder = searchParams.get('folder') || 'general';
      const contentType = searchParams.get('contentType');

      const validation = uploadPresignedUrlSchema.safeParse({
        filename,
        folder,
        contentType,
        expiresIn,
      });

      if (!validation.success) {
        return NextResponse.json({
          success: false,
          error: 'Invalid parameters',
          details: validation.error.errors,
        }, { status: 400 });
      }

      // Validate file type
      const mockFile = {
        name: filename!,
        size: 0, // Size validation will happen on actual upload
        type: contentType!,
        arrayBuffer: async () => new ArrayBuffer(0)
      };
      
      const fileValidation = uploadHandler.validateFile(mockFile);

      if (!fileValidation.isValid) {
        return NextResponse.json({
          success: false,
          error: fileValidation.error,
        }, { status: 400 });
      }

      // Generate unique key for the file
      const uniqueKey = uploadHandler.generateUniqueKey(schoolId, filename!, folder);

      // Generate presigned URL for upload
      const presignedUrl = await r2StorageService.generatePresignedUrl(
        schoolId,
        uniqueKey,
        'PUT',
        expiresIn
      );

      return NextResponse.json({
        success: true,
        data: {
          presignedUrl,
          key: uniqueKey,
          operation: 'PUT',
          expiresIn,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
          uploadHeaders: {
            'Content-Type': contentType,
          },
        },
        message: 'Upload presigned URL generated successfully',
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid operation. Must be GET or PUT',
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate presigned URL',
    }, { status: 500 });
  }
}

/**
 * POST /api/r2/presigned-url
 * Generate multiple presigned URLs in batch
 * 
 * Request body:
 * - operations: Array of presigned URL requests
 *   - key: File key (for GET operations)
 *   - filename: Original filename (for PUT operations)
 *   - folder: Target folder (for PUT operations)
 *   - contentType: File MIME type (for PUT operations)
 *   - operation: 'GET' or 'PUT'
 *   - expiresIn: URL expiration time in seconds
 */
export async function POST(req: NextRequest) {
  try {
    // Verify school access and get context
    const { schoolId, userId } = await requireSchoolAccess();
    
    // Ensure schoolId is not null
    if (!schoolId) {
      throw new Error("No active school found");
    }

    // Rate limiting check (20 batch requests per minute per user)
    const rateLimitResult = await rateLimitMiddleware(userId, {
      window: 60 * 1000, // 1 minute
      limit: 20,
    });
    
    if (rateLimitResult.exceeded) {
      const resetInSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return NextResponse.json({
        success: false,
        error: `Too many batch presigned URL requests. Please try again in ${resetInSeconds} seconds.`,
        retryAfter: resetInSeconds,
      }, { 
        status: 429,
        headers: {
          'Retry-After': resetInSeconds.toString(),
        }
      });
    }

    const body = await req.json();
    const { operations } = body;

    // Validate request structure
    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Operations array is required and must not be empty',
      }, { status: 400 });
    }

    if (operations.length > 50) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 50 operations per batch request',
      }, { status: 400 });
    }

    // Process each operation
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const operation of operations) {
      try {
        const { key, filename, folder, contentType, operation: op, expiresIn = 3600 } = operation;

        if (op === 'GET') {
          // Validate GET operation
          const validation = presignedUrlSchema.safeParse({ key, operation: op, expiresIn });
          if (!validation.success) {
            results.push({
              success: false,
              error: 'Invalid GET operation parameters',
              details: validation.error.errors,
            });
            errorCount++;
            continue;
          }

          // Check file exists
          const fileExists = await r2StorageService.fileExists(schoolId, key);
          if (!fileExists) {
            results.push({
              success: false,
              error: 'File not found or access denied',
              key,
            });
            errorCount++;
            continue;
          }

          // Generate presigned URL
          const presignedUrl = await r2StorageService.generatePresignedUrl(
            schoolId,
            key,
            'GET',
            expiresIn
          );

          results.push({
            success: true,
            data: {
              presignedUrl,
              key,
              operation: 'GET',
              expiresIn,
              expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
            },
          });
          successCount++;

        } else if (op === 'PUT') {
          // Validate PUT operation
          const validation = uploadPresignedUrlSchema.safeParse({
            filename,
            folder: folder || 'general',
            contentType,
            expiresIn,
          });

          if (!validation.success) {
            results.push({
              success: false,
              error: 'Invalid PUT operation parameters',
              details: validation.error.errors,
            });
            errorCount++;
            continue;
          }

          // Validate file type
          const mockFile = {
            name: filename,
            size: 0,
            type: contentType,
            arrayBuffer: async () => new ArrayBuffer(0)
          };
          
          const fileValidation = uploadHandler.validateFile(mockFile);

          if (!fileValidation.isValid) {
            results.push({
              success: false,
              error: fileValidation.error,
              filename,
            });
            errorCount++;
            continue;
          }

          // Generate unique key
          const uniqueKey = uploadHandler.generateUniqueKey(schoolId, filename, folder || 'general');

          // Generate presigned URL
          const presignedUrl = await r2StorageService.generatePresignedUrl(
            schoolId,
            uniqueKey,
            'PUT',
            expiresIn
          );

          results.push({
            success: true,
            data: {
              presignedUrl,
              key: uniqueKey,
              operation: 'PUT',
              expiresIn,
              expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
              uploadHeaders: {
                'Content-Type': contentType,
              },
            },
          });
          successCount++;

        } else {
          results.push({
            success: false,
            error: 'Invalid operation. Must be GET or PUT',
          });
          errorCount++;
        }

      } catch (operationError) {
        results.push({
          success: false,
          error: operationError instanceof Error ? operationError.message : 'Operation failed',
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      data: {
        results,
        summary: {
          total: operations.length,
          successful: successCount,
          failed: errorCount,
        },
      },
      message: `Batch presigned URL generation completed: ${successCount} successful, ${errorCount} failed`,
    });

  } catch (error) {
    console.error('Batch presigned URL generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch operation failed',
    }, { status: 500 });
  }
}