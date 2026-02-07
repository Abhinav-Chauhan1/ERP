/**
 * Cloudflare R2 Storage Service
 * 
 * This service provides a complete interface for R2 storage operations including:
 * - School-isolated file operations with automatic folder structure
 * - Presigned URL generation for secure uploads and downloads
 * - File metadata management and tracking
 * - CORS configuration and bucket management
 * - Error handling and retry logic
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  type PutObjectCommandInput,
  type DeleteObjectCommandInput,
  type GetObjectCommandInput,
  type HeadObjectCommandInput,
  type ListObjectsV2CommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import {
  getR2Config,
  generateSchoolKey,
  generateCdnUrl,
  corsConfiguration,
  type R2Config,
  type FileMetadata,
  type UploadResult,
} from '../config/r2-config';

/**
 * File list interface for listing operations
 */
export interface FileList {
  files: {
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
  }[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}

/**
 * R2 Storage Service Class
 * 
 * Provides school-isolated storage operations with complete data separation
 */
export class R2StorageService {
  private client: S3Client | null;
  private config: R2Config;

  constructor() {
    this.config = getR2Config();
    
    if (!this.config.isConfigured) {
      console.warn('R2 storage is not configured. Storage operations will be disabled.');
      this.client = null;
      return;
    }
    
    // Initialize S3-compatible client for R2
    this.client = new S3Client({
      region: this.config.region,
      endpoint: this.config.endpoint,
      credentials: {
        accessKeyId: this.config.accessKeyId!,
        secretAccessKey: this.config.secretAccessKey!,
      },
      // R2-specific configuration
      forcePathStyle: true, // Required for R2 compatibility
    });
  }

  /**
   * Upload file to R2 with school isolation
   * 
   * @param schoolId - School identifier for data isolation
   * @param file - File buffer to upload
   * @param key - File key (will be prefixed with school folder)
   * @param metadata - File metadata
   * @returns Upload result with URL and metadata
   */
  async uploadFile(
    schoolId: string,
    file: Buffer,
    key: string,
    metadata: Partial<FileMetadata>
  ): Promise<UploadResult> {
    try {
      // Generate school-isolated key
      const schoolKey = generateSchoolKey(schoolId, metadata.folder || 'general', key);
      
      // Prepare upload parameters
      const uploadParams: PutObjectCommandInput = {
        Bucket: this.config.bucketName,
        Key: schoolKey,
        Body: file,
        ContentType: metadata.mimeType,
        Metadata: {
          schoolId,
          originalName: metadata.originalName || key,
          uploadedBy: metadata.uploadedBy || 'system',
          uploadedAt: new Date().toISOString(),
          folder: metadata.folder || 'general',
        },
      };

      // Execute upload with retry logic
      const command = new PutObjectCommand(uploadParams);
      if (!this.client) throw new Error("S3 client not initialized");
      const result = await this.executeWithRetry(() => this.client!.send(command));

      // Generate CDN URL
      const url = generateCdnUrl(schoolKey, this.config.customDomain);

      return {
        success: true,
        url,
        key: schoolKey,
        metadata: {
          id: nanoid(),
          schoolId,
          originalName: metadata.originalName || key,
          key: schoolKey,
          url,
          mimeType: metadata.mimeType || 'application/octet-stream',
          size: file.length,
          folder: metadata.folder || 'general',
          uploadedBy: metadata.uploadedBy || 'system',
          uploadedAt: new Date(),
          checksum: result.ETag?.replace(/"/g, '') || '',
        },
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Delete file from R2 with school isolation
   * 
   * @param schoolId - School identifier for validation
   * @param key - File key to delete
   */
  async deleteFile(schoolId: string, key: string): Promise<void> {
    try {
      // Validate school isolation - ensure key belongs to the school
      if (!key.startsWith(`school-${schoolId}/`)) {
        throw new Error('Access denied: File does not belong to this school');
      }

      const deleteParams: DeleteObjectCommandInput = {
        Bucket: this.config.bucketName,
        Key: key,
      };

      const command = new DeleteObjectCommand(deleteParams);
      if (!this.client) throw new Error("S3 client not initialized");
      await this.executeWithRetry(() => this.client!.send(command));
    } catch (error) {
      console.error('R2 delete error:', error);
      throw error;
    }
  }

  /**
   * Generate presigned URL for secure file access
   * 
   * @param schoolId - School identifier for validation
   * @param key - File key
   * @param operation - Operation type (GET or PUT)
   * @param expiresIn - URL expiration time in seconds
   * @returns Presigned URL
   */
  async generatePresignedUrl(
    schoolId: string,
    key: string,
    operation: 'GET' | 'PUT',
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      // Validate school isolation
      if (!key.startsWith(`school-${schoolId}/`)) {
        throw new Error('Access denied: File does not belong to this school');
      }

      let command;
      if (operation === 'GET') {
        command = new GetObjectCommand({
          Bucket: this.config.bucketName,
          Key: key,
        });
      } else {
        command = new PutObjectCommand({
          Bucket: this.config.bucketName,
          Key: key,
        });
      }

      if (!this.client) throw new Error("S3 client not initialized");
      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error('Presigned URL generation error:', error);
      throw error;
    }
  }

  /**
   * List files in school folder with pagination
   * 
   * @param schoolId - School identifier
   * @param prefix - Additional prefix within school folder
   * @param maxKeys - Maximum number of keys to return
   * @param continuationToken - Token for pagination
   * @returns File list with pagination info
   */
  async listFiles(
    schoolId: string,
    prefix: string = '',
    maxKeys: number = 1000,
    continuationToken?: string
  ): Promise<FileList> {
    try {
      // Construct school-scoped prefix
      const schoolPrefix = `school-${schoolId}/${prefix}`;

      const listParams: ListObjectsV2CommandInput = {
        Bucket: this.config.bucketName,
        Prefix: schoolPrefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken,
      };

      const command = new ListObjectsV2Command(listParams);
      if (!this.client) throw new Error("S3 client not initialized");
      const result = await this.executeWithRetry(() => this.client!.send(command));

      return {
        files: (result.Contents || []).map(obj => ({
          key: obj.Key!,
          size: obj.Size || 0,
          lastModified: obj.LastModified || new Date(),
          etag: obj.ETag?.replace(/"/g, '') || '',
        })),
        isTruncated: result.IsTruncated || false,
        nextContinuationToken: result.NextContinuationToken,
      };
    } catch (error) {
      console.error('R2 list files error:', error);
      throw error;
    }
  }

  /**
   * Get file metadata from R2
   * 
   * @param schoolId - School identifier for validation
   * @param key - File key
   * @returns File metadata
   */
  async getFileMetadata(schoolId: string, key: string): Promise<FileMetadata | null> {
    try {
      // Validate school isolation
      if (!key.startsWith(`school-${schoolId}/`)) {
        throw new Error('Access denied: File does not belong to this school');
      }

      const headParams: HeadObjectCommandInput = {
        Bucket: this.config.bucketName,
        Key: key,
      };

      const command = new HeadObjectCommand(headParams);
      if (!this.client) throw new Error("S3 client not initialized");
      const result = await this.executeWithRetry(() => this.client!.send(command));

      const metadata = result.Metadata || {};
      const url = generateCdnUrl(key, this.config.customDomain);

      return {
        id: nanoid(),
        schoolId: metadata.schoolId || schoolId,
        originalName: metadata.originalName || key.split('/').pop() || key,
        key,
        url,
        mimeType: result.ContentType || 'application/octet-stream',
        size: result.ContentLength || 0,
        folder: metadata.folder || 'general',
        uploadedBy: metadata.uploadedBy || 'unknown',
        uploadedAt: new Date(metadata.uploadedAt || result.LastModified || new Date()),
        checksum: result.ETag?.replace(/"/g, '') || '',
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') {
        return null;
      }
      console.error('R2 get metadata error:', error);
      throw error;
    }
  }

  /**
   * Configure CORS settings for the R2 bucket
   * This should be called during initial setup
   */
  async configureCORS(): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('S3 client not initialized');
      }
      
      const corsCommand = new PutBucketCorsCommand({
        Bucket: this.config.bucketName,
        CORSConfiguration: corsConfiguration,
      });

      await this.executeWithRetry(() => this.client!.send(corsCommand));
      console.log('CORS configuration applied successfully');
    } catch (error) {
      console.error('CORS configuration error:', error);
      throw error;
    }
  }

  /**
   * Check if file exists in R2
   * 
   * @param schoolId - School identifier for validation
   * @param key - File key to check
   * @returns True if file exists, false otherwise
   */
  async fileExists(schoolId: string, key: string): Promise<boolean> {
    try {
      const metadata = await this.getFileMetadata(schoolId, key);
      return metadata !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate unique filename with school prefix
   * 
   * @param schoolId - School identifier
   * @param originalName - Original filename
   * @param folder - Folder within school structure
   * @returns Unique filename with school prefix
   */
  generateUniqueKey(schoolId: string, originalName: string, folder: string): string {
    const extension = originalName.split('.').pop() || '';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const uniqueId = nanoid(10);
    const filename = `${baseName}-${uniqueId}.${extension}`;
    
    return generateSchoolKey(schoolId, folder, filename);
  }

  /**
   * Get total storage usage for a school in MB
   * 
   * @param schoolId - School identifier
   * @returns Total storage usage in MB
   */
  async getSchoolStorageUsage(schoolId: string): Promise<number> {
    if (!this.client || !this.config.isConfigured) {
      console.warn('R2 storage is not configured. Returning 0 usage.');
      return 0;
    }

    try {
      const schoolPrefix = `school-${schoolId}/`;
      let totalSizeBytes = 0;
      let continuationToken: string | undefined;

      do {
        const listParams: ListObjectsV2CommandInput = {
          Bucket: this.config.bucketName!,
          Prefix: schoolPrefix,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        };

        const command = new ListObjectsV2Command(listParams);
        const result = await this.executeWithRetry(() => this.client!.send(command));

        // Sum up all file sizes
        if (result.Contents) {
          for (const obj of result.Contents) {
            totalSizeBytes += obj.Size || 0;
          }
        }

        continuationToken = result.NextContinuationToken;
      } while (continuationToken);

      // Convert bytes to MB
      return Math.round((totalSizeBytes / (1024 * 1024)) * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error(`Error calculating storage usage for school ${schoolId}:`, error);
      // Return 0 on error to avoid breaking the dashboard
      return 0;
    }
  }

  /**
   * Execute operation with retry logic
   * 
   * @param operation - Operation to execute
   * @param maxRetries - Maximum number of retries
   * @returns Operation result
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Export singleton instance
export const r2StorageService = new R2StorageService();