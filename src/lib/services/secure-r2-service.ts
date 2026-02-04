/**
 * Secure R2 Service
 * 
 * Wrapper around R2StorageService that integrates security controls
 * and access validation for all file operations.
 * 
 * Requirements: 8.1, 8.2, 8.4, 8.6
 */

import { UserRole } from '@prisma/client';
import { r2StorageService } from './r2-storage-service';
import { 
  r2SecurityService,
  type FileAccessContext,
  type FileSecurityMetadata
} from './r2-security-service';
import type { FileMetadata, UploadResult } from '../config/r2-config';

/**
 * Secure file operation result
 */
export interface SecureOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requiresAdditionalAuth?: boolean;
  additionalAuthType?: 'MFA' | 'ADMIN_APPROVAL';
}

/**
 * Secure R2 Service Class
 * 
 * Provides security-enhanced file operations with access control,
 * authentication validation, and comprehensive audit logging.
 */
export class SecureR2Service {

  /**
   * Secure file upload with access validation
   */
  async secureUploadFile(
    context: FileAccessContext,
    file: Buffer,
    key: string,
    metadata: Partial<FileMetadata>,
    securityMetadata?: Partial<FileSecurityMetadata>
  ): Promise<SecureOperationResult<UploadResult>> {
    try {
      // Generate full file key with school prefix
      const fullKey = `school-${context.schoolId}/${metadata.folder || 'general'}/${key}`;

      // Validate upload access
      const accessResult = await r2SecurityService.validateFileAccess(
        context,
        fullKey,
        'UPLOAD',
        securityMetadata ? {
          sensitivityLevel: 'SCHOOL',
          schoolId: context.schoolId,
          ownerId: context.userId,
          ...securityMetadata
        } : undefined
      );

      if (!accessResult.allowed) {
        return {
          success: false,
          error: accessResult.reason,
          requiresAdditionalAuth: accessResult.requiresAdditionalAuth,
          additionalAuthType: accessResult.additionalAuthType
        };
      }

      // Perform the upload
      const uploadResult = await r2StorageService.uploadFile(
        context.schoolId,
        file,
        key,
        {
          ...metadata,
          uploadedBy: context.userId
        }
      );

      if (uploadResult.success && uploadResult.metadata) {
        // Create security metadata for the uploaded file
        await r2SecurityService.createFileSecurityMetadata(
          fullKey,
          context.userId,
          context.schoolId,
          securityMetadata
        );
      }

      return {
        success: uploadResult.success,
        data: uploadResult,
        error: uploadResult.error
      };

    } catch (error) {
      console.error('Secure upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Secure file deletion with access validation
   */
  async secureDeleteFile(
    context: FileAccessContext,
    fileKey: string
  ): Promise<SecureOperationResult<void>> {
    try {
      // Get file security metadata
      const securityMetadata = await r2SecurityService.getFileSecurityMetadata(fileKey);

      // Validate delete access
      const accessResult = await r2SecurityService.validateFileAccess(
        context,
        fileKey,
        'DELETE',
        securityMetadata
      );

      if (!accessResult.allowed) {
        return {
          success: false,
          error: accessResult.reason,
          requiresAdditionalAuth: accessResult.requiresAdditionalAuth,
          additionalAuthType: accessResult.additionalAuthType
        };
      }

      // Perform the deletion
      await r2StorageService.deleteFile(context.schoolId, fileKey);

      return { success: true };

    } catch (error) {
      console.error('Secure delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * Validate user has permission for specific file operation
   */
  async validateFileOperation(
    context: FileAccessContext,
    fileKey: string,
    operation: 'READ' | 'WRITE' | 'DELETE' | 'LIST' | 'UPLOAD' | 'DOWNLOAD'
  ): Promise<SecureOperationResult<boolean>> {
    try {
      // Get file security metadata
      const securityMetadata = await r2SecurityService.getFileSecurityMetadata(fileKey);

      // Validate access
      const accessResult = await r2SecurityService.validateFileAccess(
        context,
        fileKey,
        operation,
        securityMetadata
      );

      return {
        success: true,
        data: accessResult.allowed,
        error: accessResult.allowed ? undefined : accessResult.reason,
        requiresAdditionalAuth: accessResult.requiresAdditionalAuth,
        additionalAuthType: accessResult.additionalAuthType
      };

    } catch (error) {
      console.error('Validate file operation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }
}

/**
 * Create file access context from user information
 */
export function createFileAccessContext(
  userId: string,
  userRole: UserRole,
  schoolId: string,
  authorizedSchools: string[],
  permissions: string[],
  ipAddress?: string,
  userAgent?: string
): FileAccessContext {
  return {
    userId,
    userRole,
    schoolId,
    authorizedSchools,
    permissions,
    ipAddress,
    userAgent
  };
}

// Export singleton instance
export const secureR2Service = new SecureR2Service();