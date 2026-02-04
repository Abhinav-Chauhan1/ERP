/**
 * R2 File Validation API Route
 * 
 * Provides file validation services for R2 uploads.
 * Validates file types, sizes, and formats before upload to prevent errors.
 * 
 * Features:
 * - File type validation (MIME type and extension checking)
 * - Size limit validation
 * - Filename sanitization
 * - School quota checking
 * - Batch validation support
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadHandler } from '@/lib/services/upload-handler';
import { storageQuotaService } from '@/lib/services/storage-quota-service';
import { requireSchoolAccess } from '@/lib/auth/tenant';
import { sanitizeFilename } from '@/lib/utils/r2-validation';
import { z } from 'zod';

// Request validation schemas
const validateFileSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  size: z.number().min(1, 'File size must be greater than 0'),
  mimeType: z.string().min(1, 'MIME type is required'),
  category: z.enum(['image', 'document']).optional(),
});

const batchValidateSchema = z.object({
  files: z.array(validateFileSchema).min(1, 'At least one file is required').max(100, 'Maximum 100 files per batch'),
});

const quotaCheckSchema = z.object({
  totalSize: z.number().min(0, 'Total size must be non-negative'),
});

/**
 * POST /api/r2/validate
 * Validate files before upload
 * 
 * Request body:
 * - action: 'file' | 'batch' | 'quota' | 'filename'
 * - Additional parameters based on action
 */
export async function POST(req: NextRequest) {
  try {
    // Verify school access
    await requireSchoolAccess();

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'file':
        return await handleFileValidation(body);
      
      case 'batch':
        return await handleBatchValidation(body);
      
      case 'quota':
        return await handleQuotaCheck(body);
      
      case 'filename':
        return await handleFilenameValidation(body);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: file, batch, quota, filename',
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Validation API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }, { status: 500 });
  }
}

/**
 * GET /api/r2/validate
 * Get validation rules and limits
 * 
 * Query parameters:
 * - type: 'limits' | 'types' | 'quota'
 */
export async function GET(req: NextRequest) {
  try {
    // Verify school access
    const { schoolId } = await requireSchoolAccess();
    
    // Ensure schoolId is not null
    if (!schoolId) {
      throw new Error("No active school found");
    }
    
    // Ensure schoolId is not null
    if (!schoolId) {
      throw new Error("No active school found");
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'limits':
        return NextResponse.json({
          success: true,
          data: {
            maxImageSize: uploadHandler.getMaxFileSize('image'),
            maxDocumentSize: uploadHandler.getMaxFileSize('document'),
            allowedImageTypes: uploadHandler.getAllowedFileTypes('image'),
            allowedDocumentTypes: uploadHandler.getAllowedFileTypes('document'),
            maxBatchSize: 20,
            maxFilenameLength: 255,
          },
          message: 'File validation limits retrieved successfully',
        });

      case 'types':
        return NextResponse.json({
          success: true,
          data: {
            supportedImageTypes: uploadHandler.getAllowedFileTypes('image'),
            supportedDocumentTypes: uploadHandler.getAllowedFileTypes('document'),
            allSupportedTypes: [
              ...uploadHandler.getAllowedFileTypes('image'),
              ...uploadHandler.getAllowedFileTypes('document'),
            ],
          },
          message: 'Supported file types retrieved successfully',
        });

      case 'quota':
        const quotaStatus = await storageQuotaService.checkQuota(schoolId);
        return NextResponse.json({
          success: true,
          data: quotaStatus,
          message: 'Storage quota information retrieved successfully',
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type. Supported types: limits, types, quota',
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Validation info API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve validation info',
    }, { status: 500 });
  }
}

/**
 * Handle single file validation
 */
async function handleFileValidation(body: any) {
  const validation = validateFileSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({
      success: false,
      error: 'Invalid parameters',
      details: validation.error.errors,
    }, { status: 400 });
  }

  const { filename, size, mimeType, category } = body;

  // Validate file using upload handler
  const mockFile = {
    name: filename,
    size,
    type: mimeType,
    arrayBuffer: async () => new ArrayBuffer(0)
  };
  
  const fileValidation = uploadHandler.validateFile(mockFile, category);

  // Additional validations
  const sanitizedFilename = sanitizeFilename(filename);
  const isFilenameValid = sanitizedFilename.length > 0 && sanitizedFilename.length <= 255;

  return NextResponse.json({
    success: fileValidation.isValid && isFilenameValid,
    data: {
      isValid: fileValidation.isValid && isFilenameValid,
      fileType: fileValidation.fileType,
      sanitizedFilename,
      validations: {
        typeValid: fileValidation.isValid,
        sizeValid: fileValidation.isValid, // Size is checked within type validation
        filenameValid: isFilenameValid,
      },
      error: fileValidation.error || (!isFilenameValid ? 'Invalid filename' : undefined),
    },
    message: fileValidation.isValid && isFilenameValid ? 'File validation passed' : 'File validation failed',
  });
}

/**
 * Handle batch file validation
 */
async function handleBatchValidation(body: any) {
  const validation = batchValidateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({
      success: false,
      error: 'Invalid parameters',
      details: validation.error.errors,
    }, { status: 400 });
  }

  const results = [];
  let validCount = 0;
  let invalidCount = 0;
  let totalSize = 0;

  for (const file of body.files) {
    const { filename, size, mimeType, category } = file;

    // Validate individual file
    const mockFile = {
      name: filename,
      size,
      type: mimeType,
      arrayBuffer: async () => new ArrayBuffer(0)
    };
    
    const fileValidation = uploadHandler.validateFile(mockFile, category);

    const sanitizedFilename = sanitizeFilename(filename);
    const isFilenameValid = sanitizedFilename.length > 0 && sanitizedFilename.length <= 255;
    const isValid = fileValidation.isValid && isFilenameValid;

    results.push({
      filename,
      isValid,
      fileType: fileValidation.fileType,
      sanitizedFilename,
      size,
      error: fileValidation.error || (!isFilenameValid ? 'Invalid filename' : undefined),
    });

    if (isValid) {
      validCount++;
      totalSize += size;
    } else {
      invalidCount++;
    }
  }

  return NextResponse.json({
    success: invalidCount === 0,
    data: {
      results,
      summary: {
        totalFiles: body.files.length,
        validFiles: validCount,
        invalidFiles: invalidCount,
        totalSize,
      },
    },
    message: `Batch validation completed: ${validCount} valid, ${invalidCount} invalid`,
  });
}

/**
 * Handle storage quota check
 */
async function handleQuotaCheck(body: any) {
  const { schoolId } = await requireSchoolAccess();
  
  // Ensure schoolId is not null
  if (!schoolId) {
    throw new Error("No active school found");
  }
  
  const validation = quotaCheckSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({
      success: false,
      error: 'Invalid parameters',
      details: validation.error.errors,
    }, { status: 400 });
  }

  const { totalSize } = body;

  // Check current quota status
  const quotaStatus = await storageQuotaService.checkQuota(schoolId);
  
  // Calculate if the new upload would exceed quota
  const currentUsageBytes = quotaStatus.currentUsageMB * 1024 * 1024;
  const maxLimitBytes = quotaStatus.maxLimitMB * 1024 * 1024;
  const newTotalUsage = currentUsageBytes + totalSize;
  const wouldExceedQuota = newTotalUsage > maxLimitBytes;

  return NextResponse.json({
    success: true,
    data: {
      currentQuota: quotaStatus,
      uploadSize: totalSize,
      newTotalUsage,
      wouldExceedQuota,
      remainingSpace: Math.max(0, maxLimitBytes - currentUsageBytes),
      canUpload: !wouldExceedQuota,
    },
    message: wouldExceedQuota ? 'Upload would exceed storage quota' : 'Upload within quota limits',
  });
}

/**
 * Handle filename validation and sanitization
 */
async function handleFilenameValidation(body: any) {
  const { filename } = body;

  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({
      success: false,
      error: 'Filename is required',
    }, { status: 400 });
  }

  const sanitizedFilename = sanitizeFilename(filename);
  const isValid = sanitizedFilename.length > 0 && sanitizedFilename.length <= 255;

  return NextResponse.json({
    success: true,
    data: {
      originalFilename: filename,
      sanitizedFilename,
      isValid,
      length: sanitizedFilename.length,
      maxLength: 255,
    },
    message: isValid ? 'Filename is valid' : 'Filename is invalid',
  });
}