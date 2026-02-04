/**
 * R2 Batch Operations API Route
 * 
 * Handles batch file operations for R2 storage with school isolation.
 * Provides efficient processing of multiple file operations in a single request.
 * 
 * Features:
 * - Batch file uploads with validation
 * - Batch file deletions with school verification
 * - Batch metadata retrieval
 * - Progress tracking and error handling
 * - Rate limiting for security
 * 
 * Requirements: 5.3, 5.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { fileManager } from '@/lib/services/file-manager';
import { uploadHandler } from '@/lib/services/upload-handler';
import { requireSchoolAccess } from '@/lib/auth/tenant';
import { rateLimitMiddleware } from '@/lib/utils/rate-limit';
import { verifyCsrfToken } from '@/lib/utils/csrf';
import { z } from 'zod';

// Request validation schemas
const batchDeleteSchema = z.object({
  keys: z.array(z.string().min(1)).min(1, 'At least one file key is required').max(100, 'Maximum 100 files per batch'),
});

const batchRetrieveSchema = z.object({
  keys: z.array(z.string().min(1)).min(1, 'At least one file key is required').max(50, 'Maximum 50 files per batch'),
  includeMetadata: z.boolean().optional().default(false),
  generatePresignedUrl: z.boolean().optional().default(false),
  presignedUrlExpiry: z.number().min(60).max(86400).optional().default(3600),
});

const batchUploadSchema = z.object({
  uploads: z.array(z.object({
    filename: z.string().min(1),
    folder: z.string().optional().default('general'),
    category: z.enum(['image', 'document']).optional(),
    customMetadata: z.record(z.string()).optional(),
  })).min(1, 'At least one upload is required').max(20, 'Maximum 20 uploads per batch'),
});

/**
 * POST /api/r2/batch
 * Perform batch operations on R2 files
 * 
 * Request body:
 * - action: 'delete' | 'retrieve' | 'upload' | 'metadata'
 * - Additional parameters based on action
 */
export async function POST(req: NextRequest) {
  try {
    // Verify school access and get context
    const { schoolId, userId } = await requireSchoolAccess();

    // Rate limiting check (10 batch operations per minute per user)
    const rateLimitResult = await rateLimitMiddleware(userId, {
      limit: 10,
      window: 60 * 1000, // 1 minute
    });
    
    if (rateLimitResult.exceeded) {
      const resetInSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return NextResponse.json({
        success: false,
        error: `Too many batch operation requests. Please try again in ${resetInSeconds} seconds.`,
        retryAfter: resetInSeconds,
      }, { 
        status: 429,
        headers: {
          'Retry-After': resetInSeconds.toString(),
        }
      });
    }

    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle batch upload with files
      return await handleBatchUpload(req);
    } else {
      // Handle JSON-based batch operations
      const body = await req.json();
      const { action } = body;

      switch (action) {
        case 'delete':
          return await handleBatchDelete(body);
        
        case 'retrieve':
          return await handleBatchRetrieve(body);
        
        case 'metadata':
          return await handleBatchMetadata(body);
        
        default:
          return NextResponse.json({
            success: false,
            error: 'Invalid action. Supported actions: delete, retrieve, metadata, upload',
          }, { status: 400 });
      }
    }

  } catch (error) {
    console.error('Batch operation API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch operation failed',
    }, { status: 500 });
  }
}

/**
 * Handle batch file deletion
 */
async function handleBatchDelete(body: any) {
  const validation = batchDeleteSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({
      success: false,
      error: 'Invalid parameters',
      details: validation.error.errors,
    }, { status: 400 });
  }

  const result = await fileManager.batchDeleteFiles(body.keys);
  
  return NextResponse.json({
    success: result.success,
    data: {
      results: result.results,
      summary: {
        totalProcessed: result.totalProcessed,
        successful: result.successCount,
        failed: result.errorCount,
      },
    },
    message: `Batch deletion completed: ${result.successCount} successful, ${result.errorCount} failed`,
  });
}

/**
 * Handle batch file retrieval
 */
async function handleBatchRetrieve(body: any) {
  const validation = batchRetrieveSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({
      success: false,
      error: 'Invalid parameters',
      details: validation.error.errors,
    }, { status: 400 });
  }

  const result = await fileManager.batchRetrieveFiles(body.keys, {
    includeMetadata: body.includeMetadata,
    generatePresignedUrl: body.generatePresignedUrl,
    presignedUrlExpiry: body.presignedUrlExpiry,
  });

  return NextResponse.json({
    success: result.success,
    data: {
      files: result.files,
      summary: {
        totalProcessed: result.totalProcessed,
        successful: result.successCount,
        failed: result.errorCount,
      },
    },
    message: `Batch retrieval completed: ${result.successCount} successful, ${result.errorCount} failed`,
  });
}

/**
 * Handle batch metadata retrieval
 */
async function handleBatchMetadata(body: any) {
  const validation = z.object({
    keys: z.array(z.string().min(1)).min(1).max(100),
  }).safeParse(body);

  if (!validation.success) {
    return NextResponse.json({
      success: false,
      error: 'Invalid parameters',
      details: validation.error.errors,
    }, { status: 400 });
  }

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (const key of body.keys) {
    try {
      const metadata = await fileManager.getFileMetadata(key);
      
      if (metadata) {
        results.push({
          key,
          success: true,
          metadata,
        });
        successCount++;
      } else {
        results.push({
          key,
          success: false,
          error: 'File not found or access denied',
        });
        errorCount++;
      }
    } catch (error) {
      results.push({
        key,
        success: false,
        error: error instanceof Error ? error.message : 'Metadata retrieval failed',
      });
      errorCount++;
    }
  }

  return NextResponse.json({
    success: errorCount === 0,
    data: {
      results,
      summary: {
        totalProcessed: body.keys.length,
        successful: successCount,
        failed: errorCount,
      },
    },
    message: `Batch metadata retrieval completed: ${successCount} successful, ${errorCount} failed`,
  });
}

/**
 * Handle batch file upload
 */
async function handleBatchUpload(req: NextRequest) {
  try {
    // Parse form data
    const formData = await req.formData();
    const csrfToken = formData.get('csrf_token') as string | null;

    // Verify CSRF token
    const isCsrfValid = await verifyCsrfToken(csrfToken);
    if (!isCsrfValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid CSRF token',
      }, { status: 403 });
    }

    // Extract files and metadata
    const files: File[] = [];
    const uploadConfigs: any[] = [];
    
    // Get all files from form data
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        const index = key.replace('file_', '');
        files.push(value);
        
        // Get corresponding metadata
        const folder = formData.get(`folder_${index}`) as string || 'general';
        const category = formData.get(`category_${index}`) as string || undefined;
        const customMetadataStr = formData.get(`metadata_${index}`) as string || '{}';
        
        let customMetadata: Record<string, string> = {};
        try {
          customMetadata = JSON.parse(customMetadataStr);
        } catch {
          // Ignore invalid JSON
        }

        uploadConfigs.push({
          folder,
          category: category as 'image' | 'document' | undefined,
          customMetadata,
        });
      }
    }

    if (files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files provided for upload',
      }, { status: 400 });
    }

    if (files.length > 20) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 20 files per batch upload',
      }, { status: 400 });
    }

    // Process each upload
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const config = uploadConfigs[i] || {};

      try {
        const result = await uploadHandler.uploadFile(file, config);
        
        if (result.success) {
          results.push({
            filename: file.name,
            success: true,
            data: {
              url: result.url,
              key: result.key,
              metadata: result.metadata,
            },
          });
          successCount++;
        } else {
          results.push({
            filename: file.name,
            success: false,
            error: result.error,
          });
          errorCount++;
        }
      } catch (error) {
        results.push({
          filename: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      data: {
        results,
        summary: {
          totalProcessed: files.length,
          successful: successCount,
          failed: errorCount,
        },
      },
      message: `Batch upload completed: ${successCount} successful, ${errorCount} failed`,
    });

  } catch (error) {
    console.error('Batch upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch upload failed',
    }, { status: 500 });
  }
}