"use server";

import { auth } from "@/auth";
import { uploadHandler } from "@/lib/services/upload-handler";
import { requireSchoolAccess } from "@/lib/auth/tenant";

/**
 * Server action for uploading images with proper authentication context
 */
export async function uploadImageAction(formData: FormData) {
  try {
    // Get the file from form data
    const file = formData.get('file') as File;
    if (!file) {
      return {
        success: false,
        error: 'No file provided'
      };
    }

    // Get folder from form data (optional)
    const folder = formData.get('folder') as string || 'images';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Invalid file type. Please upload an image file.'
      };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'File too large. Image size should be less than 5MB.'
      };
    }

    // Get authentication context
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Handle school context based on user role
    let schoolId: string;
    let userId: string = session.user.id;

    if (session.user.role === 'SUPER_ADMIN') {
      // For super admin, get school ID from form data
      const targetSchoolId = formData.get('schoolId') as string;
      if (!targetSchoolId) {
        return {
          success: false,
          error: 'School ID required for super admin uploads'
        };
      }
      schoolId = targetSchoolId;
    } else {
      // For regular users, get their school context
      try {
        const context = await requireSchoolAccess();
        if (!context.schoolId) {
          return {
            success: false,
            error: 'No school context found'
          };
        }
        schoolId = context.schoolId;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get school context'
        };
      }
    }

    // Create upload context
    const uploadContext = {
      schoolId,
      userId,
      folder: sanitizeFolder(folder),
    };

    // Create a custom upload handler that doesn't rely on session context
    const result = await uploadImageWithContext(file, {
      ...uploadContext,
      category: 'image' as const
    });

    return result;
  } catch (error) {
    console.error('Upload action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Sanitize folder name for safe storage
 */
function sanitizeFolder(folder: string): string {
  return folder
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-') // Replace invalid chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Server action for uploading documents with proper authentication context
 */
export async function uploadDocumentAction(formData: FormData) {
  try {
    // Get the file from form data
    const file = formData.get('file') as File;
    if (!file) {
      return {
        success: false,
        error: 'No file provided'
      };
    }

    // Get folder from form data (optional)
    const folder = formData.get('folder') as string || 'documents';

    // Validate file size (max 50MB for documents)
    if (file.size > 50 * 1024 * 1024) {
      return {
        success: false,
        error: 'File too large. Document size should be less than 50MB.'
      };
    }

    // Get authentication context
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Handle school context based on user role
    let schoolId: string;
    let userId: string = session.user.id;

    if (session.user.role === 'SUPER_ADMIN') {
      // For super admin, get school ID from form data
      const targetSchoolId = formData.get('schoolId') as string;
      if (!targetSchoolId) {
        return {
          success: false,
          error: 'School ID required for super admin uploads'
        };
      }
      schoolId = targetSchoolId;
    } else {
      // For regular users, get their school context
      try {
        const context = await requireSchoolAccess();
        if (!context.schoolId) {
          return {
            success: false,
            error: 'No school context found'
          };
        }
        schoolId = context.schoolId;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get school context'
        };
      }
    }

    // Create upload context
    const uploadContext = {
      schoolId,
      userId,
      folder: sanitizeFolder(folder),
    };

    // Create a custom upload handler that doesn't rely on session context
    const result = await uploadDocumentWithContext(file, {
      ...uploadContext,
      category: 'document' as const
    });

    return result;
  } catch (error) {
    console.error('Upload action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Upload image with explicit context (bypasses session-based context)
 */
async function uploadImageWithContext(file: File, context: {
  schoolId: string;
  userId: string;
  folder: string;
  category: 'image';
}) {
  try {
    // Import the R2 storage service directly
    const { r2StorageService } = await import('@/lib/services/r2-storage-service');
    const { validateFile, sanitizeFilename } = await import('@/lib/utils/r2-validation');
    const { nanoid } = await import('nanoid');

    // Validate file
    const validation = validateFile({
      name: file.name,
      size: file.size,
      type: file.type,
    }, 'image');

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate unique filename
    const sanitizedName = sanitizeFilename(file.name);
    const lastDotIndex = sanitizedName.lastIndexOf('.');
    const extension = lastDotIndex > 0 ? sanitizedName.substring(lastDotIndex + 1) : '';
    const baseName = lastDotIndex > 0 ? sanitizedName.substring(0, lastDotIndex) : sanitizedName;
    const uniqueId = nanoid(10);
    const filename = extension 
      ? `${baseName}-${uniqueId}.${extension}`
      : `${baseName}-${uniqueId}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Prepare metadata
    const metadata = {
      originalName: file.name,
      mimeType: file.type,
      folder: context.folder,
      uploadedBy: context.userId,
    };

    // Upload to R2
    const uploadResult = await r2StorageService.uploadFile(
      context.schoolId,
      buffer,
      filename,
      metadata
    );

    if (!uploadResult.success) {
      return uploadResult;
    }

    // Generate a presigned URL for immediate access (valid for 24 hours)
    try {
      const presignedUrl = await r2StorageService.generatePresignedUrl(
        context.schoolId,
        uploadResult.key!,
        'GET',
        86400 // 24 hours
      );

      return {
        success: true,
        url: presignedUrl, // Use presigned URL instead of direct URL
        key: uploadResult.key,
        metadata: uploadResult.metadata,
      };
    } catch (presignedError) {
      console.warn('Failed to generate presigned URL, using direct URL:', presignedError);
      // Fallback to the original URL if presigned URL generation fails
      return uploadResult;
    }
  } catch (error) {
    console.error('Image upload with context error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image upload failed',
    };
  }
}

/**
 * Upload document with explicit context (bypasses session-based context)
 */
async function uploadDocumentWithContext(file: File, context: {
  schoolId: string;
  userId: string;
  folder: string;
  category: 'document';
}) {
  try {
    // Import the R2 storage service directly
    const { r2StorageService } = await import('@/lib/services/r2-storage-service');
    const { validateFile, sanitizeFilename } = await import('@/lib/utils/r2-validation');
    const { nanoid } = await import('nanoid');

    // Validate file
    const validation = validateFile({
      name: file.name,
      size: file.size,
      type: file.type,
    }, 'document');

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate unique filename
    const sanitizedName = sanitizeFilename(file.name);
    const lastDotIndex = sanitizedName.lastIndexOf('.');
    const extension = lastDotIndex > 0 ? sanitizedName.substring(lastDotIndex + 1) : '';
    const baseName = lastDotIndex > 0 ? sanitizedName.substring(0, lastDotIndex) : sanitizedName;
    const uniqueId = nanoid(10);
    const filename = extension 
      ? `${baseName}-${uniqueId}.${extension}`
      : `${baseName}-${uniqueId}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Prepare metadata
    const metadata = {
      originalName: file.name,
      mimeType: file.type,
      folder: context.folder,
      uploadedBy: context.userId,
    };

    // Upload to R2
    const uploadResult = await r2StorageService.uploadFile(
      context.schoolId,
      buffer,
      filename,
      metadata
    );

    if (!uploadResult.success) {
      return uploadResult;
    }

    // Generate a presigned URL for immediate access (valid for 24 hours)
    try {
      const presignedUrl = await r2StorageService.generatePresignedUrl(
        context.schoolId,
        uploadResult.key!,
        'GET',
        86400 // 24 hours
      );

      return {
        success: true,
        url: presignedUrl, // Use presigned URL instead of direct URL
        key: uploadResult.key,
        metadata: uploadResult.metadata,
      };
    } catch (presignedError) {
      console.warn('Failed to generate presigned URL, using direct URL:', presignedError);
      // Fallback to the original URL if presigned URL generation fails
      return uploadResult;
    }
  } catch (error) {
    console.error('Document upload with context error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Document upload failed',
    };
  }
}