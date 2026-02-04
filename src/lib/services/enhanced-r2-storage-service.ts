/**
 * Enhanced R2 Storage Service
 * 
 * This service integrates all performance optimizations including:
 * - Chunked upload support for large files
 * - Modern image format support (WebP, AVIF)
 * - Performance monitoring and metrics collection
 * - Error notification system for administrators
 * 
 * Requirements: 9.2, 9.6, 10.4, 10.5
 */

import { r2StorageService } from './r2-storage-service';
import { chunkedUploadService } from './chunked-upload-service';
import { modernImageFormatService, type ClientCapabilities } from './modern-image-format-service';
import { r2PerformanceMonitoringService, type R2OperationType, type R2PerformanceStats } from './r2-performance-monitoring-service';
import { r2ErrorNotificationService } from './r2-error-notification-service';
import { storageQuotaService } from './storage-quota-service';
import { type UploadResult } from '../config/r2-config';

/**
 * Enhanced upload options
 */
export interface EnhancedUploadOptions {
  // Chunked upload options
  enableChunkedUpload?: boolean;
  chunkSize?: number;
  maxRetries?: number;
  
  // Format optimization options
  generateModernFormats?: boolean;
  clientCapabilities?: ClientCapabilities;
  imageQuality?: number;
  
  // Monitoring options
  enablePerformanceMonitoring?: boolean;
  enableErrorNotification?: boolean;
  
  // Standard options
  folder?: string;
  uploadedBy?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Enhanced upload result
 */
export interface EnhancedUploadResult extends UploadResult {
  // Chunked upload info
  sessionId?: string;
  chunkedUpload?: boolean;
  
  // Format variants
  formatVariants?: Array<{
    format: string;
    url: string;
    size: number;
  }>;
  
  // Performance metrics
  uploadDuration?: number;
  throughput?: number;
  
  // Monitoring info
  performanceMetricId?: string;
  errorNotificationId?: string;
}

/**
 * Enhanced R2 Storage Service Class
 * 
 * Provides all R2 storage operations with integrated performance optimizations
 */
export class EnhancedR2StorageService {
  private readonly CHUNKED_UPLOAD_THRESHOLD = 10 * 1024 * 1024; // 10MB

  /**
   * Enhanced file upload with all optimizations
   * 
   * @param schoolId - School identifier for data isolation
   * @param file - File to upload (File object or Buffer)
   * @param filename - Original filename
   * @param options - Enhanced upload options
   * @returns Enhanced upload result
   */
  async uploadFile(
    schoolId: string,
    file: File | Buffer,
    filename: string,
    options: EnhancedUploadOptions = {}
  ): Promise<EnhancedUploadResult> {
    const startTime = Date.now();

    try {
      // Check storage quota first
      const quotaCheck = await storageQuotaService.checkQuota(schoolId);
      if (!quotaCheck.isWithinLimit) {
        throw new Error(`Storage quota exceeded: ${quotaCheck.percentageUsed}% of ${quotaCheck.maxLimitMB}MB used`);
      }

      // Convert File to Buffer if needed
      const fileBuffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
      const fileSize = fileBuffer.length;
      const mimeType = file instanceof File ? file.type : 'application/octet-stream';

      // Determine if chunked upload should be used
      const shouldUseChunkedUpload = options.enableChunkedUpload !== false && 
        (fileSize > this.CHUNKED_UPLOAD_THRESHOLD || options.enableChunkedUpload === true);

      let uploadResult: EnhancedUploadResult;

      if (shouldUseChunkedUpload) {
        // Create a proper File object from buffer
        const fileFromBuffer = file instanceof File 
          ? file 
          : new File([new Uint8Array(fileBuffer)], filename, { type: mimeType });
        
        uploadResult = await this.performChunkedUpload(
          schoolId,
          fileFromBuffer,
          options
        );
      } else {
        uploadResult = await this.performStandardUpload(
          schoolId,
          fileBuffer,
          filename,
          mimeType,
          options
        );
      }

      // Generate modern format variants for images
      if (options.generateModernFormats !== false && this.isImageFile(mimeType)) {
        try {
          const formatResult = await modernImageFormatService.generateFormatVariants(
            schoolId,
            fileBuffer,
            uploadResult.key!,
            {
              quality: options.imageQuality || 85,
            }
          );

          if (formatResult.success) {
            uploadResult.formatVariants = formatResult.variants.map(variant => ({
              format: variant.format,
              url: variant.url,
              size: variant.size,
            }));
          }
        } catch (formatError) {
          console.warn('Failed to generate format variants:', formatError);
          // Don't fail the upload for format generation errors
        }
      }

      // Update storage usage
      await storageQuotaService.updateUsage(schoolId, fileSize);

      // Record performance metrics
      const uploadDuration = Date.now() - startTime;
      const throughput = fileSize / (uploadDuration / 1000); // bytes per second

      uploadResult.uploadDuration = uploadDuration;
      uploadResult.throughput = throughput;

      if (options.enablePerformanceMonitoring !== false) {
        await r2PerformanceMonitoringService.recordMetric({
          operation: shouldUseChunkedUpload ? 'chunked_upload' : 'upload',
          duration: uploadDuration,
          fileSize,
          schoolId,
          success: true,
          timestamp: new Date(),
          metadata: {
            filename,
            mimeType,
            chunkedUpload: shouldUseChunkedUpload,
            formatVariants: uploadResult.formatVariants?.length || 0,
            ...options.metadata,
          },
        });
      }

      return uploadResult;

    } catch (error) {
      const uploadDuration = Date.now() - startTime;
      
      // Record error metrics
      if (options.enablePerformanceMonitoring !== false) {
        await r2PerformanceMonitoringService.recordMetric({
          operation: 'upload',
          duration: uploadDuration,
          fileSize: file instanceof File ? file.size : file.length,
          schoolId,
          success: false,
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
          timestamp: new Date(),
          metadata: {
            filename,
            ...options.metadata,
          },
        });
      }

      // Send error notification
      if (options.enableErrorNotification !== false) {
        const errorNotificationId = await r2ErrorNotificationService.reportError(
          error instanceof Error ? error : new Error('Upload failed'),
          {
            schoolId,
            operation: 'upload',
            metadata: {
              filename,
              fileSize: file instanceof File ? file.size : file.length,
              ...options.metadata,
            },
          }
        ) || undefined;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        uploadDuration,
      };
    }
  }

  /**
   * Enhanced file download with performance monitoring
   * 
   * @param schoolId - School identifier
   * @param key - File key
   * @param clientCapabilities - Client format capabilities
   * @returns Download URL (optimized format if available)
   */
  async downloadFile(
    schoolId: string,
    key: string,
    clientCapabilities?: ClientCapabilities
  ): Promise<{ url: string; format?: string }> {
    const startTime = Date.now();

    try {
      // Try to get optimal format URL if client capabilities provided
      let url: string;
      let format: string | undefined;

      if (clientCapabilities && this.isImageFile(key)) {
        const baseKey = key.replace(/\.[^/.]+$/, ''); // Remove extension
        const optimalUrl = await modernImageFormatService.getBestFormatUrl(
          schoolId,
          baseKey,
          clientCapabilities
        );

        if (optimalUrl) {
          url = optimalUrl;
          format = this.extractFormatFromUrl(optimalUrl);
        } else {
          // Fall back to original file
          const metadata = await r2StorageService.getFileMetadata(schoolId, key);
          url = metadata?.url || '';
        }
      } else {
        // Standard download
        const metadata = await r2StorageService.getFileMetadata(schoolId, key);
        url = metadata?.url || '';
      }

      // Record performance metrics
      const duration = Date.now() - startTime;
      await r2PerformanceMonitoringService.recordMetric({
        operation: 'download',
        duration,
        schoolId,
        success: true,
        timestamp: new Date(),
        metadata: {
          key,
          format,
          optimizedFormat: !!format,
        },
      });

      return { url, format };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record error metrics
      await r2PerformanceMonitoringService.recordMetric({
        operation: 'download',
        duration,
        schoolId,
        success: false,
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        timestamp: new Date(),
        metadata: { key },
      });

      // Send error notification
      await r2ErrorNotificationService.reportError(
        error instanceof Error ? error : new Error('Download failed'),
        {
          schoolId,
          operation: 'download',
          metadata: { key },
        }
      );

      throw error;
    }
  }

  /**
   * Enhanced file deletion with monitoring
   * 
   * @param schoolId - School identifier
   * @param key - File key to delete
   */
  async deleteFile(schoolId: string, key: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Get file metadata for size tracking
      const metadata = await r2StorageService.getFileMetadata(schoolId, key);
      const fileSize = metadata?.size || 0;

      // Delete main file
      await r2StorageService.deleteFile(schoolId, key);

      // Delete format variants if they exist
      if (this.isImageFile(key)) {
        const baseKey = key.replace(/\.[^/.]+$/, '');
        const formats = ['webp', 'avif'];
        
        for (const format of formats) {
          try {
            const formatKey = `${baseKey}.${format}`;
            const formatExists = await r2StorageService.fileExists(schoolId, formatKey);
            if (formatExists) {
              await r2StorageService.deleteFile(schoolId, formatKey);
            }
          } catch (error) {
            // Ignore errors for format variant deletion
            console.warn(`Failed to delete ${format} variant:`, error);
          }
        }
      }

      // Update storage usage
      if (fileSize > 0) {
        await storageQuotaService.updateUsage(schoolId, -fileSize);
      }

      // Record performance metrics
      const duration = Date.now() - startTime;
      await r2PerformanceMonitoringService.recordMetric({
        operation: 'delete',
        duration,
        fileSize,
        schoolId,
        success: true,
        timestamp: new Date(),
        metadata: { key },
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record error metrics
      await r2PerformanceMonitoringService.recordMetric({
        operation: 'delete',
        duration,
        schoolId,
        success: false,
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        timestamp: new Date(),
        metadata: { key },
      });

      // Send error notification
      await r2ErrorNotificationService.reportError(
        error instanceof Error ? error : new Error('Delete failed'),
        {
          schoolId,
          operation: 'delete',
          metadata: { key },
        }
      );

      throw error;
    }
  }

  /**
   * Get performance statistics for school
   * 
   * @param schoolId - School identifier
   * @param timeRangeHours - Time range in hours
   * @returns Performance statistics
   */
  async getPerformanceStats(schoolId: string, timeRangeHours: number = 24): Promise<Record<R2OperationType, R2PerformanceStats>> {
    const operations: R2OperationType[] = ['upload', 'download', 'delete', 'chunked_upload'];
    const stats: Record<string, R2PerformanceStats> = {};

    for (const operation of operations) {
      stats[operation] = r2PerformanceMonitoringService.getPerformanceStats(
        operation,
        timeRangeHours,
        schoolId
      );
    }

    return stats as Record<R2OperationType, R2PerformanceStats>;
  }

  /**
   * Get error notifications for school
   * 
   * @param schoolId - School identifier
   * @param resolved - Filter by resolution status
   * @returns Error notifications
   */
  getErrorNotifications(schoolId: string, resolved?: boolean) {
    return r2ErrorNotificationService.getActiveNotifications({
      schoolId,
      resolved,
    });
  }

  /**
   * Perform chunked upload
   * 
   * @param schoolId - School identifier
   * @param file - File to upload
   * @param options - Upload options
   * @returns Upload result
   */
  private async performChunkedUpload(
    schoolId: string,
    file: File,
    options: EnhancedUploadOptions
  ): Promise<EnhancedUploadResult> {
    // Initialize chunked upload
    const initResult = await chunkedUploadService.initializeUpload(
      schoolId,
      file,
      {
        originalName: file.name,
        mimeType: file.type,
        folder: options.folder || 'uploads',
        uploadedBy: options.uploadedBy || 'system',
      },
      {
        chunkSize: options.chunkSize,
        maxRetries: options.maxRetries,
      }
    );

    if (!initResult.success || !initResult.sessionId) {
      throw new Error(initResult.error || 'Failed to initialize chunked upload');
    }

    // Upload chunks
    const chunkSize = options.chunkSize || 5 * 1024 * 1024; // 5MB default
    const totalChunks = Math.ceil(file.size / chunkSize);

    for (let chunkIndex = 1; chunkIndex <= totalChunks; chunkIndex++) {
      const start = (chunkIndex - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunkData = await file.slice(start, end).arrayBuffer();

      const chunkResult = await chunkedUploadService.uploadChunk(
        initResult.sessionId,
        chunkIndex,
        chunkData
      );

      if (!chunkResult.success) {
        // Abort upload on failure
        await chunkedUploadService.abortUpload(initResult.sessionId);
        throw new Error(chunkResult.error || 'Chunk upload failed');
      }

      // Check if upload is complete
      if (chunkResult.progress?.isComplete) {
        return {
          success: true,
          url: chunkResult.url,
          key: chunkResult.key,
          metadata: chunkResult.metadata,
          sessionId: initResult.sessionId,
          chunkedUpload: true,
        };
      }
    }

    throw new Error('Chunked upload completed but no final result received');
  }

  /**
   * Perform standard upload
   * 
   * @param schoolId - School identifier
   * @param fileBuffer - File buffer
   * @param filename - Original filename
   * @param mimeType - File MIME type
   * @param options - Upload options
   * @returns Upload result
   */
  private async performStandardUpload(
    schoolId: string,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    options: EnhancedUploadOptions
  ): Promise<EnhancedUploadResult> {
    const uploadResult = await r2StorageService.uploadFile(
      schoolId,
      fileBuffer,
      filename,
      {
        originalName: filename,
        mimeType,
        folder: options.folder || 'uploads',
        uploadedBy: options.uploadedBy || 'system',
      }
    );

    return {
      ...uploadResult,
      chunkedUpload: false,
    };
  }

  /**
   * Check if file is an image
   * 
   * @param mimeTypeOrKey - MIME type or file key
   * @returns True if file is an image
   */
  private isImageFile(mimeTypeOrKey: string): boolean {
    if (mimeTypeOrKey.startsWith('image/')) {
      return true;
    }
    
    // Check by extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    return imageExtensions.some(ext => mimeTypeOrKey.toLowerCase().endsWith(ext));
  }

  /**
   * Extract format from URL
   * 
   * @param url - File URL
   * @returns File format
   */
  private extractFormatFromUrl(url: string): string | undefined {
    const match = url.match(/\.([^./?]+)(?:\?|$)/);
    return match ? match[1] : undefined;
  }
}

// Export singleton instance
export const enhancedR2StorageService = new EnhancedR2StorageService();