/**
 * File Manager Service with School Isolation
 * 
 * This service provides comprehensive file management operations with:
 * - School-specific CDN URL generation and file retrieval
 * - Batch operations for multiple files within school scope
 * - File existence checking and metadata tracking per school
 * - Folder organization maintenance within school boundaries
 * - Cross-school access prevention and security enforcement
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 12.5, 12.6
 */

import { r2StorageService } from './r2-storage-service';
import { requireSchoolAccess } from '../auth/tenant';
import {
  generateCdnUrl,
  generateSchoolKey,
  extractSchoolIdFromKey,
  type FileMetadata,
} from '../config/r2-config';

/**
 * Batch operation result interface
 */
export interface BatchOperationResult {
  success: boolean;
  results: {
    key: string;
    success: boolean;
    error?: string;
  }[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

/**
 * File retrieval options interface
 */
export interface FileRetrievalOptions {
  includeMetadata?: boolean;
  generatePresignedUrl?: boolean;
  presignedUrlExpiry?: number; // seconds
}

/**
 * Folder organization result interface
 */
export interface FolderOrganizationResult {
  folder: string;
  fileCount: number;
  totalSize: number;
  lastModified: Date;
  files: {
    key: string;
    name: string;
    size: number;
    lastModified: Date;
  }[];
}

/**
 * File existence check result interface
 */
export interface FileExistenceResult {
  exists: boolean;
  metadata?: FileMetadata;
  lastChecked: Date;
}

/**
 * File Manager Service Class
 * 
 * Provides school-aware file management operations with complete data isolation
 */
export class FileManager {
  /**
   * Retrieve file with school-specific CDN URL generation
   * 
   * @param key - File key to retrieve
   * @param options - Retrieval options
   * @returns File information with CDN URL
   */
  async retrieveFile(
    key: string,
    options: FileRetrievalOptions = {}
  ): Promise<{
    success: boolean;
    url?: string;
    presignedUrl?: string;
    metadata?: FileMetadata;
    error?: string;
  }> {
    try {
      // Get school context and validate access
      const context = await requireSchoolAccess();
      const { schoolId } = context;
      
      // Ensure schoolId is available
      if (!schoolId) {
        return {
          success: false,
          error: 'School context required for file operations',
        };
      }
      
      // Validate school isolation - ensure key belongs to the school
      if (!this.validateSchoolAccess(key, schoolId)) {
        return {
          success: false,
          error: 'Access denied: File does not belong to this school',
        };
      }

      // Generate CDN URL
      const url = generateCdnUrl(key);
      
      let metadata: FileMetadata | undefined;
      let presignedUrl: string | undefined;

      // Get metadata if requested
      if (options.includeMetadata) {
        const metadataResult = await r2StorageService.getFileMetadata(schoolId, key);
        if (!metadataResult) {
          return {
            success: false,
            error: 'File not found',
          };
        }
        metadata = metadataResult;
      }

      // Generate presigned URL if requested
      if (options.generatePresignedUrl) {
        const expiry = options.presignedUrlExpiry || 3600; // 1 hour default
        presignedUrl = await r2StorageService.generatePresignedUrl(
          schoolId,
          key,
          'GET',
          expiry
        );
      }

      return {
        success: true,
        url,
        presignedUrl,
        metadata,
      };
    } catch (error) {
      console.error('File retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File retrieval failed',
      };
    }
  }

  /**
   * Batch delete multiple files within school scope
   * 
   * @param keys - Array of file keys to delete
   * @returns Batch operation result
   */
  async batchDeleteFiles(keys: string[]): Promise<BatchOperationResult> {
    try {
      // Get school context and validate access
      const context = await requireSchoolAccess();
      const { schoolId } = context;
      
      // Ensure schoolId is available
      if (!schoolId) {
        return {
          success: false,
          results: keys.map(key => ({
            key,
            success: false,
            error: 'School context required for file operations',
          })),
          totalProcessed: keys.length,
          successCount: 0,
          errorCount: keys.length,
        };
      }
      
      const results: BatchOperationResult['results'] = [];
      let successCount = 0;
      let errorCount = 0;

      // Process each file deletion
      for (const key of keys) {
        try {
          // Validate school access for each key
          if (!this.validateSchoolAccess(key, schoolId)) {
            results.push({
              key,
              success: false,
              error: 'Access denied: File does not belong to this school',
            });
            errorCount++;
            continue;
          }

          // Delete the file
          await r2StorageService.deleteFile(schoolId, key);
          
          results.push({
            key,
            success: true,
          });
          successCount++;
        } catch (error) {
          results.push({
            key,
            success: false,
            error: error instanceof Error ? error.message : 'Deletion failed',
          });
          errorCount++;
        }
      }

      return {
        success: errorCount === 0,
        results,
        totalProcessed: keys.length,
        successCount,
        errorCount,
      };
    } catch (error) {
      console.error('Batch delete error:', error);
      return {
        success: false,
        results: keys.map(key => ({
          key,
          success: false,
          error: error instanceof Error ? error.message : 'Batch operation failed',
        })),
        totalProcessed: keys.length,
        successCount: 0,
        errorCount: keys.length,
      };
    }
  }

  /**
   * Batch retrieve multiple files within school scope
   * 
   * @param keys - Array of file keys to retrieve
   * @param options - Retrieval options
   * @returns Batch retrieval result
   */
  async batchRetrieveFiles(
    keys: string[],
    options: FileRetrievalOptions = {}
  ): Promise<{
    success: boolean;
    files: {
      key: string;
      success: boolean;
      url?: string;
      presignedUrl?: string;
      metadata?: FileMetadata;
      error?: string;
    }[];
    totalProcessed: number;
    successCount: number;
    errorCount: number;
  }> {
    try {
      // Get school context and validate access
      const context = await requireSchoolAccess();
      const { schoolId } = context;
      
      // Ensure schoolId is available
      if (!schoolId) {
        return {
          success: false,
          files: keys.map(key => ({
            key,
            success: false,
            error: 'School context required for file operations',
          })),
          totalProcessed: keys.length,
          successCount: 0,
          errorCount: keys.length,
        };
      }
      
      const files: any[] = [];
      let successCount = 0;
      let errorCount = 0;

      // Process each file retrieval
      for (const key of keys) {
        const result = await this.retrieveFile(key, options);
        
        files.push({
          key,
          ...result,
        });

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      return {
        success: errorCount === 0,
        files,
        totalProcessed: keys.length,
        successCount,
        errorCount,
      };
    } catch (error) {
      console.error('Batch retrieve error:', error);
      return {
        success: false,
        files: keys.map(key => ({
          key,
          success: false,
          error: error instanceof Error ? error.message : 'Batch retrieval failed',
        })),
        totalProcessed: keys.length,
        successCount: 0,
        errorCount: keys.length,
      };
    }
  }

  /**
   * Check if file exists and get metadata per school
   * 
   * @param key - File key to check
   * @returns File existence result
   */
  async checkFileExists(key: string): Promise<FileExistenceResult> {
    try {
      // Get school context and validate access
      const context = await requireSchoolAccess();
      const { schoolId } = context;
      
      // Ensure schoolId is available
      if (!schoolId) {
        return {
          exists: false,
          lastChecked: new Date(),
        };
      }
      
      // Validate school access
      if (!this.validateSchoolAccess(key, schoolId)) {
        return {
          exists: false,
          lastChecked: new Date(),
        };
      }

      // Check file existence and get metadata
      const metadata = await r2StorageService.getFileMetadata(schoolId, key);
      
      return {
        exists: metadata !== null,
        metadata: metadata || undefined,
        lastChecked: new Date(),
      };
    } catch (error) {
      console.error('File existence check error:', error);
      return {
        exists: false,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Get folder organization and maintenance within school boundaries
   * 
   * @param folder - Folder path within school structure
   * @param maxFiles - Maximum number of files to return (default: 1000)
   * @returns Folder organization result
   */
  async getFolderOrganization(
    folder: string = '',
    maxFiles: number = 1000
  ): Promise<FolderOrganizationResult> {
    try {
      // Get school context and validate access
      const context = await requireSchoolAccess();
      const { schoolId } = context;
      
      // Ensure schoolId is available
      if (!schoolId) {
        return {
          folder: folder || 'root',
          fileCount: 0,
          totalSize: 0,
          lastModified: new Date(),
          files: [],
        };
      }
      
      // List files in the school folder
      const fileList = await r2StorageService.listFiles(schoolId, folder, maxFiles);
      
      let totalSize = 0;
      let lastModified = new Date(0); // Start with epoch
      
      const files = fileList.files.map(file => {
        totalSize += file.size;
        if (file.lastModified > lastModified) {
          lastModified = file.lastModified;
        }
        
        return {
          key: file.key,
          name: file.key.split('/').pop() || file.key,
          size: file.size,
          lastModified: file.lastModified,
        };
      });

      return {
        folder: folder || 'root',
        fileCount: files.length,
        totalSize,
        lastModified,
        files,
      };
    } catch (error) {
      console.error('Folder organization error:', error);
      return {
        folder: folder || 'root',
        fileCount: 0,
        totalSize: 0,
        lastModified: new Date(),
        files: [],
      };
    }
  }

  /**
   * Move file to different folder within school boundaries
   * 
   * @param sourceKey - Source file key
   * @param targetFolder - Target folder within school structure
   * @returns Move operation result
   */
  async moveFile(
    sourceKey: string,
    targetFolder: string
  ): Promise<{
    success: boolean;
    newKey?: string;
    newUrl?: string;
    error?: string;
  }> {
    try {
      // Get school context and validate access
      const context = await requireSchoolAccess();
      const { schoolId } = context;
      
      // Ensure schoolId is available
      if (!schoolId) {
        return {
          success: false,
          error: 'School context required for file operations',
        };
      }
      
      // Validate school access for source file
      if (!this.validateSchoolAccess(sourceKey, schoolId)) {
        return {
          success: false,
          error: 'Access denied: Source file does not belong to this school',
        };
      }

      // Get source file metadata
      const sourceMetadata = await r2StorageService.getFileMetadata(schoolId, sourceKey);
      if (!sourceMetadata) {
        return {
          success: false,
          error: 'Source file not found',
        };
      }

      // Generate new key in target folder
      const filename = sourceKey.split('/').pop() || 'unknown';
      const newKey = generateSchoolKey(schoolId, targetFolder, filename);
      
      // This would require a copy operation in R2StorageService
      // For now, we'll return an error indicating the limitation
      return {
        success: false,
        error: 'File move operation requires copy functionality in R2StorageService',
      };
    } catch (error) {
      console.error('File move error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File move failed',
      };
    }
  }

  /**
   * Get file metadata with school isolation tracking
   * 
   * @param key - File key
   * @returns File metadata or null if not found
   */
  async getFileMetadata(key: string): Promise<FileMetadata | null> {
    try {
      // Get school context and validate access
      const context = await requireSchoolAccess();
      const { schoolId } = context;
      
      // Ensure schoolId is available
      if (!schoolId) {
        return null;
      }
      
      // Validate school access
      if (!this.validateSchoolAccess(key, schoolId)) {
        return null;
      }

      // Get metadata from R2 storage service
      return await r2StorageService.getFileMetadata(schoolId, key);
    } catch (error) {
      console.error('Get file metadata error:', error);
      return null;
    }
  }

  /**
   * List all files in school with optional folder filtering
   * 
   * @param folder - Optional folder filter
   * @param maxFiles - Maximum number of files to return
   * @param continuationToken - Token for pagination
   * @returns List of files with metadata
   */
  async listSchoolFiles(
    folder?: string,
    maxFiles: number = 1000,
    continuationToken?: string
  ): Promise<{
    success: boolean;
    files: FileMetadata[];
    isTruncated: boolean;
    nextContinuationToken?: string;
    error?: string;
  }> {
    try {
      // Get school context and validate access
      const context = await requireSchoolAccess();
      const { schoolId } = context;
      
      // Ensure schoolId is available
      if (!schoolId) {
        return {
          success: false,
          files: [],
          isTruncated: false,
          error: 'School context required for file operations',
        };
      }
      
      // List files from R2 storage service
      const fileList = await r2StorageService.listFiles(
        schoolId,
        folder || '',
        maxFiles,
        continuationToken
      );

      // Get metadata for each file
      const filesWithMetadata: FileMetadata[] = [];
      
      for (const file of fileList.files) {
        const metadata = await r2StorageService.getFileMetadata(schoolId, file.key);
        if (metadata) {
          filesWithMetadata.push(metadata);
        }
      }

      return {
        success: true,
        files: filesWithMetadata,
        isTruncated: fileList.isTruncated,
        nextContinuationToken: fileList.nextContinuationToken,
      };
    } catch (error) {
      console.error('List school files error:', error);
      return {
        success: false,
        files: [],
        isTruncated: false,
        error: error instanceof Error ? error.message : 'Failed to list files',
      };
    }
  }

  /**
   * Validate school access for a given file key
   * 
   * @param key - File key to validate
   * @param schoolId - School ID to validate against
   * @returns True if access is allowed, false otherwise
   */
  private validateSchoolAccess(key: string, schoolId: string): boolean {
    // Extract school ID from key
    const keySchoolId = extractSchoolIdFromKey(key);
    
    // Ensure the key belongs to the requesting school
    return keySchoolId === schoolId;
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
      .replace(/[^a-z0-9-_/]/g, '-') // Replace invalid chars with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .replace(/\/+/g, '/') // Replace multiple slashes with single
      .replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
  }

  /**
   * Generate school-scoped file key
   * 
   * @param folder - Folder within school structure
   * @param filename - Original filename
   * @returns School-scoped file key
   */
  async generateSchoolScopedKey(folder: string, filename: string): Promise<string> {
    const context = await requireSchoolAccess();
    const { schoolId } = context;
    
    if (!schoolId) {
      throw new Error('School context required for file operations');
    }
    
    const sanitizedFolder = this.sanitizeFolder(folder);
    return generateSchoolKey(schoolId, sanitizedFolder, filename);
  }

  /**
   * Get storage statistics for the school
   * 
   * @returns Storage statistics
   */
  async getSchoolStorageStats(): Promise<{
    success: boolean;
    totalFiles: number;
    totalSize: number;
    folderBreakdown: Record<string, { files: number; size: number }>;
    error?: string;
  }> {
    try {
      // Get school context and validate access
      const context = await requireSchoolAccess();
      const { schoolId } = context;
      
      // Ensure schoolId is available
      if (!schoolId) {
        return {
          success: false,
          totalFiles: 0,
          totalSize: 0,
          folderBreakdown: {},
          error: 'School context required for file operations',
        };
      }
      
      // Get all files for the school
      const fileList = await r2StorageService.listFiles(schoolId, '', 10000); // Large limit for stats
      
      let totalSize = 0;
      const folderBreakdown: Record<string, { files: number; size: number }> = {};
      
      for (const file of fileList.files) {
        totalSize += file.size;
        
        // Extract folder from key (school-{id}/{folder}/filename)
        const keyParts = file.key.split('/');
        const folder = keyParts.length > 2 ? keyParts[1] : 'root';
        
        if (!folderBreakdown[folder]) {
          folderBreakdown[folder] = { files: 0, size: 0 };
        }
        
        folderBreakdown[folder].files++;
        folderBreakdown[folder].size += file.size;
      }

      return {
        success: true,
        totalFiles: fileList.files.length,
        totalSize,
        folderBreakdown,
      };
    } catch (error) {
      console.error('Storage stats error:', error);
      return {
        success: false,
        totalFiles: 0,
        totalSize: 0,
        folderBreakdown: {},
        error: error instanceof Error ? error.message : 'Failed to get storage stats',
      };
    }
  }
}

// Export singleton instance
export const fileManager = new FileManager();