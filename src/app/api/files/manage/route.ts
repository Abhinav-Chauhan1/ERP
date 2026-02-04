/**
 * File Management API Route
 * 
 * Demonstrates usage of the FileManager service with school isolation
 * This route provides comprehensive file management operations including:
 * - File retrieval with CDN URL generation
 * - Batch operations for multiple files
 * - File existence checking and metadata tracking
 * - Folder organization within school boundaries
 * - Storage statistics and analytics
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 12.5, 12.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { fileManager } from '@/lib/services/file-manager';
import { requireSchoolAccess } from '@/lib/auth/tenant';
import { z } from 'zod';

// Request validation schemas
const retrieveFileSchema = z.object({
  key: z.string().min(1, 'File key is required'),
  includeMetadata: z.boolean().optional().default(false),
  generatePresignedUrl: z.boolean().optional().default(false),
  presignedUrlExpiry: z.number().min(60).max(86400).optional().default(3600), // 1 minute to 24 hours
});

const batchDeleteSchema = z.object({
  keys: z.array(z.string().min(1)).min(1, 'At least one file key is required').max(100, 'Maximum 100 files per batch'),
});

const batchRetrieveSchema = z.object({
  keys: z.array(z.string().min(1)).min(1, 'At least one file key is required').max(50, 'Maximum 50 files per batch'),
  includeMetadata: z.boolean().optional().default(false),
  generatePresignedUrl: z.boolean().optional().default(false),
  presignedUrlExpiry: z.number().min(60).max(86400).optional().default(3600),
});

const folderOrganizationSchema = z.object({
  folder: z.string().optional().default(''),
  maxFiles: z.number().min(1).max(10000).optional().default(1000),
});

const listFilesSchema = z.object({
  folder: z.string().optional(),
  maxFiles: z.number().min(1).max(1000).optional().default(100),
  continuationToken: z.string().optional(),
});

/**
 * GET /api/files/manage
 * Retrieve file information or list files
 * 
 * Query parameters:
 * - action: 'retrieve' | 'list' | 'folder-stats' | 'storage-stats' | 'exists'
 * - key: File key (for retrieve/exists actions)
 * - folder: Folder path (for list/folder-stats actions)
 * - includeMetadata: Include file metadata (boolean)
 * - generatePresignedUrl: Generate presigned URL (boolean)
 * - presignedUrlExpiry: Presigned URL expiry in seconds
 * - maxFiles: Maximum files to return
 * - continuationToken: Pagination token
 */
export async function GET(req: NextRequest) {
  try {
    // Verify school access
    await requireSchoolAccess();

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

      case 'folder-stats': {
        const params = {
          folder: searchParams.get('folder') || '',
          maxFiles: parseInt(searchParams.get('maxFiles') || '1000'),
        };

        const validation = folderOrganizationSchema.safeParse(params);
        if (!validation.success) {
          return NextResponse.json({
            success: false,
            error: 'Invalid parameters',
            details: validation.error.errors,
          }, { status: 400 });
        }

        const result = await fileManager.getFolderOrganization(params.folder, params.maxFiles);

        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      case 'storage-stats': {
        const result = await fileManager.getSchoolStorageStats();
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

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: retrieve, list, folder-stats, storage-stats, exists',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('File management API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * POST /api/files/manage
 * Perform file management operations
 * 
 * Request body:
 * - action: 'batch-delete' | 'batch-retrieve'
 * - Additional parameters based on action
 */
export async function POST(req: NextRequest) {
  try {
    // Verify school access
    await requireSchoolAccess();

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'batch-delete': {
        const validation = batchDeleteSchema.safeParse(body);
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

      case 'batch-retrieve': {
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

        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: batch-delete, batch-retrieve',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('File management API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/files/manage
 * Delete a single file
 * 
 * Query parameters:
 * - key: File key to delete
 */
export async function DELETE(req: NextRequest) {
  try {
    // Verify school access
    await requireSchoolAccess();

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'File key is required',
      }, { status: 400 });
    }

    const result = await fileManager.batchDeleteFiles([key]);
    
    // Return single file result
    const fileResult = result.results[0];
    return NextResponse.json({
      success: fileResult.success,
      error: fileResult.error,
    });
  } catch (error) {
    console.error('File deletion API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}