/**
 * R2 File Operations API Route
 * 
 * Handles file retrieval, deletion, and metadata operations for R2 storage.
 * Provides comprehensive file management with school isolation and security.
 * 
 * Features:
 * - File retrieval with CDN URL generation
 * - File deletion with school validation
 * - Metadata retrieval and tracking
 * - Batch operations for multiple files
 * - Presigned URL generation for secure access
 * 
 * Requirements: 2.4, 3.5, 5.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { fileManager } from '@/lib/services/file-manager';
import { r2StorageService } from '@/lib/services/r2-storage-service';
import { requireSchoolAccess } from '@/lib/auth/tenant';
import { z } from 'zod';

// Request validation schemas
const retrieveFileSchema = z.object({
  key: z.string().min(1, 'File key is required'),
  includeMetadata: z.boolean().optional().default(false),
  generatePresignedUrl: z.boolean().optional().default(false),
  presignedUrlExpiry: z.number().min(60).max(86400).optional().default(3600),
});

const batchOperationSchema = z.object({
  keys: z.array(z.string().min(1)).min(1, 'At least one file key is required').max(100, 'Maximum 100 files per batch'),
});

const listFilesSchema = z.object({
  folder: z.string().optional(),
  maxFiles: z.number().min(1).max(1000).optional().default(100),
  continuationToken: z.string().optional(),
});

/**
 * GET /api/r2/files
 * Retrieve file information or list files
 * 
 * Query parameters:
 * - action: 'retrieve' | 'list' | 'exists' | 'metadata'
 * - key: File key (for retrieve/exists/metadata actions)
 * - folder: Folder path (for list action)
 * - includeMetadata: Include file metadata (boolean)
 * - generatePresignedUrl: Generate presigned URL (boolean)
 * - presignedUrlExpiry: Presigned URL expiry in seconds
 * - maxFiles: Maximum files to return (for list action)
 * - continuationToken: Pagination token (for list action)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify school access
    const { schoolId } = await requireSchoolAccess();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'retrieve': {
        const params = {
          key: searchParams.get('key') || '',
          includeMetadata: searchParams.get('includeMetadata') === 'true',
          generatePresignedUrl: searchParams.get('generatePresignedUrl') === 'true',
          presignedUrlExpiry: parseInt(searchParams.get('presignedUrlExpiry') || '3600'),
        };

        const validation = retrieveFileSchema.safeParse(params);
        if (!validation.success) {
          return NextResponse.json({
            success: false,
            error: 'Invalid parameters',
            details: validation.error.errors,
          }, { status: 400 });
        }

        const result = await fileManager.retrieveFile(params.key, {
          includeMetadata: params.includeMetadata,
          generatePresignedUrl: params.generatePresignedUrl,
          presignedUrlExpiry: params.presignedUrlExpiry,
        });

        return NextResponse.json(result);
      }

      case 'list': {
        const params = {
          folder: searchParams.get('folder') || undefined,
          maxFiles: parseInt(searchParams.get('maxFiles') || '100'),
          continuationToken: searchParams.get('continuationToken') || undefined,
        };

        const validation = listFilesSchema.safeParse(params);
        if (!validation.success) {
          return NextResponse.json({
            success: false,
            error: 'Invalid parameters',
            details: validation.error.errors,
          }, { status: 400 });
        }

        const result = await fileManager.listSchoolFiles(
          params.folder,
          params.maxFiles,
          params.continuationToken
        );

        return NextResponse.json(result);
      }

      case 'exists': {
        const key = searchParams.get('key');
        if (!key) {
          return NextResponse.json({
            success: false,
            error: 'File key is required',
          }, { status: 400 });
        }

        const result = await fileManager.checkFileExists(key);
        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      case 'metadata': {
        const key = searchParams.get('key');
        if (!key) {
          return NextResponse.json({
            success: false,
            error: 'File key is required',
          }, { status: 400 });
        }

        const metadata = await fileManager.getFileMetadata(key);
        return NextResponse.json({
          success: true,
          data: metadata,
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: retrieve, list, exists, metadata',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('R2 file retrieval API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * POST /api/r2/files
 * Perform batch file operations
 * 
 * Request body:
 * - action: 'batch-retrieve' | 'batch-delete'
 * - keys: Array of file keys
 * - includeMetadata: Include metadata (for batch-retrieve)
 * - generatePresignedUrl: Generate presigned URLs (for batch-retrieve)
 * - presignedUrlExpiry: Presigned URL expiry in seconds (for batch-retrieve)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify school access
    await requireSchoolAccess();

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'batch-retrieve': {
        const validation = z.object({
          keys: z.array(z.string().min(1)).min(1).max(50),
          includeMetadata: z.boolean().optional().default(false),
          generatePresignedUrl: z.boolean().optional().default(false),
          presignedUrlExpiry: z.number().min(60).max(86400).optional().default(3600),
        }).safeParse(body);

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

        return NextResponse.json(result);
      }

      case 'batch-delete': {
        const validation = batchOperationSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json({
            success: false,
            error: 'Invalid parameters',
            details: validation.error.errors,
          }, { status: 400 });
        }

        const result = await fileManager.batchDeleteFiles(body.keys);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: batch-retrieve, batch-delete',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('R2 batch operation API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/r2/files
 * Delete a single file
 * 
 * Query parameters:
 * - key: File key to delete (required)
 */
export async function DELETE(req: NextRequest) {
  try {
    // Verify school access
    const { schoolId } = await requireSchoolAccess();

    if (!schoolId) {
      return NextResponse.json({
        success: false,
        error: 'School context required',
      }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'File key is required',
      }, { status: 400 });
    }

    // Delete the file using R2 storage service directly
    await r2StorageService.deleteFile(schoolId, key);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('R2 file deletion API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'File deletion failed',
    }, { status: 500 });
  }
}