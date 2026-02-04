/**
 * Upload Handler Service with School-Aware Validation
 * 
 * This service provides comprehensive file upload handling with:
 * - School-based context and isolation
 * - File type validation (MIME type and extension checking)
 * - Size limit enforcement (5MB images, 50MB documents)
 * - Unique filename generation using nanoid with school prefix
 * - Metadata extraction with school isolation
 * - Automatic school folder routing based on user context
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 12.3, 12.5
 */

import { nanoid } from 'nanoid';
import { r2StorageService } from './r2-storage-service';
import { validateFile, sanitizeFilename } from '../utils/r2-validation';
import { requireSchoolAccess } from '../auth/tenant';
import {
  defaultUploadConfig,
  type FileMetadata,
  type UploadResult,
  type ValidationResult,
} from '../config/r2-config';

/**
 * File upload context interface
 */
export interface UploadContext {
  schoolId: string;
  userId: string;
  folder: string;
  category?: 'image' | 'document';
}

/**
 * Upload options interface
 */
export interface UploadOptions {
  folder?: string;
  category?: 'image' | 'document';
  generateThumbnails?: boolean;
  customMetadata?: Record<string, string>;
}

/**
 * File input interface for validation
 */
export interface FileInput {
  name: string;
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

/**
 * Upload Handler Service Class
 * 
 * Provides school-aware file upload operations with comprehensive validation
 */
export class UploadHandler {
  private config = defaultUploadConfig;

  /**
   * Upload image file with school context and validation
   * 
   * @param file - Image file to upload
   * @param options - Upload options
   * @param context - Optional upload context (required when called from client)
   * @returns Upload result with URL and metadata
   */
  async uploadImage(file: FileInput, options: UploadOptions = {}, context?: UploadContext): Promise<UploadResult> {
    try {
      // Get school context from parameter or current user
      const uploadContext = context || await this.getUploadContext(options.folder || 'images');
      
      // Validate file as image
      const validation = this.validateFile(file, 'image');
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate unique filename
      const uniqueKey = this.generateUniqueKey(uploadContext.schoolId, file.name, uploadContext.folder);
      
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Prepare metadata
      const metadata: Partial<FileMetadata> = {
        originalName: file.name,
        mimeType: file.type,
        folder: uploadContext.folder,
        uploadedBy: uploadContext.userId,
        ...options.customMetadata,
      };

      // Upload to R2
      return await r2StorageService.uploadFile(
        uploadContext.schoolId,
        buffer,
        uniqueKey.split('/').pop()!, // Extract filename from full key
        metadata
      );
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image upload failed',
      };
    }
  }

  /**
   * Upload document file with school context and validation
   * 
   * @param file - Document file to upload
   * @param options - Upload options
   * @param context - Optional upload context (required when called from client)
   * @returns Upload result with URL and metadata
   */
  async uploadDocument(file: FileInput, options: UploadOptions = {}, context?: UploadContext): Promise<UploadResult> {
    try {
      // Get school context from parameter or current user
      const uploadContext = context || await this.getUploadContext(options.folder || 'documents');
      
      // Validate file as document
      const validation = this.validateFile(file, 'document');
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate unique filename
      const uniqueKey = this.generateUniqueKey(uploadContext.schoolId, file.name, uploadContext.folder);
      
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Prepare metadata
      const metadata: Partial<FileMetadata> = {
        originalName: file.name,
        mimeType: file.type,
        folder: uploadContext.folder,
        uploadedBy: uploadContext.userId,
        ...options.customMetadata,
      };

      // Upload to R2
      return await r2StorageService.uploadFile(
        uploadContext.schoolId,
        buffer,
        uniqueKey.split('/').pop()!, // Extract filename from full key
        metadata
      );
    } catch (error) {
      console.error('Document upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document upload failed',
      };
    }
  }

  /**
   * Upload any file with automatic type detection
   * 
   * @param file - File to upload
   * @param options - Upload options
   * @param context - Optional upload context (required when called from client)
   * @returns Upload result with URL and metadata
   */
  async uploadFile(file: FileInput, options: UploadOptions = {}, context?: UploadContext): Promise<UploadResult> {
    try {
      // Validate file and determine type
      const validation = this.validateFile(file, options.category);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Route to appropriate upload method based on detected type
      if (validation.fileType === 'image') {
        return await this.uploadImage(file, { ...options, category: 'image' }, context);
      } else if (validation.fileType === 'document') {
        return await this.uploadDocument(file, { ...options, category: 'document' }, context);
      } else {
        return {
          success: false,
          error: 'Unsupported file type',
        };
      }
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File upload failed',
      };
    }
  }

  /**
   * Validate file type, size, and format
   * 
   * @param file - File to validate
   * @param expectedType - Expected file type category
   * @returns Validation result
   */
  validateFile(file: FileInput, expectedType?: 'image' | 'document'): ValidationResult {
    // Use existing validation utility
    return validateFile(
      {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      expectedType
    );
  }

  /**
   * Generate unique filename with school prefix and nanoid
   * 
   * @param schoolId - School identifier
   * @param originalName - Original filename
   * @param folder - Folder within school structure
   * @returns Unique filename with school prefix
   */
  generateUniqueKey(schoolId: string, originalName: string, folder: string): string {
    // Sanitize the original filename
    const sanitizedName = sanitizeFilename(originalName);
    
    // Extract file extension
    const lastDotIndex = sanitizedName.lastIndexOf('.');
    const extension = lastDotIndex > 0 ? sanitizedName.substring(lastDotIndex + 1) : '';
    const baseName = lastDotIndex > 0 ? sanitizedName.substring(0, lastDotIndex) : sanitizedName;
    
    // Generate unique identifier
    const uniqueId = nanoid(10);
    
    // Create unique filename
    const filename = extension 
      ? `${baseName}-${uniqueId}.${extension}`
      : `${baseName}-${uniqueId}`;
    
    // Return full school-based key
    return `school-${schoolId}/${folder}/${filename}`;
  }

  /**
   * Extract metadata from file
   * 
   * @param file - File to extract metadata from
   * @param context - Upload context
   * @returns File metadata
   */
  extractMetadata(file: FileInput, context: UploadContext): Partial<FileMetadata> {
    return {
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      folder: context.folder,
      uploadedBy: context.userId,
      uploadedAt: new Date(),
    };
  }

  /**
   * Get upload context from current user session
   * 
   * @param folder - Target folder for upload
   * @returns Upload context with school and user information
   */
  private async getUploadContext(folder: string): Promise<UploadContext> {
    try {
      // Check if we're in a server context
      if (typeof window !== 'undefined') {
        throw new Error('Upload handler cannot be called directly from client components. Use server actions instead.');
      }

      // Get school access from current user session
      const { schoolId, userId } = await requireSchoolAccess();
      
      if (!schoolId) {
        throw new Error('School context required for file uploads');
      }

      if (!userId) {
        throw new Error('User authentication required for file uploads');
      }

      return {
        schoolId,
        userId,
        folder: this.sanitizeFolder(folder),
      };
    } catch (error) {
      console.error('Error getting upload context:', error);
      throw new Error('Failed to get upload context: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Sanitize folder name for safe storage
   * 
   * @param folder - Original folder name
   * @returns Sanitized folder name
   */
  private sanitizeFolder(folder: string): string {
    return folder
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-') // Replace invalid chars with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Check if file type is supported
   * 
   * @param mimeType - MIME type to check
   * @returns True if supported, false otherwise
   */
  isSupportedFileType(mimeType: string): boolean {
    return [
      ...this.config.allowedImageTypes,
      ...this.config.allowedDocumentTypes,
    ].includes(mimeType);
  }

  /**
   * Get maximum file size for type
   * 
   * @param fileType - File type category
   * @returns Maximum size in bytes
   */
  getMaxFileSize(fileType: 'image' | 'document'): number {
    return fileType === 'image' 
      ? this.config.maxImageSize 
      : this.config.maxDocumentSize;
  }

  /**
   * Get allowed file types for category
   * 
   * @param category - File category
   * @returns Array of allowed MIME types
   */
  getAllowedFileTypes(category: 'image' | 'document'): string[] {
    return category === 'image' 
      ? this.config.allowedImageTypes 
      : this.config.allowedDocumentTypes;
  }
}

// Export singleton instance
export const uploadHandler = new UploadHandler();