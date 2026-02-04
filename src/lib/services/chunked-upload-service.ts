/**
 * Chunked Upload Service for Large Files
 * 
 * This service provides chunked upload support for large files to improve
 * reliability and handle network interruptions. It implements multipart
 * upload functionality using Cloudflare R2's S3-compatible API.
 * 
 * Requirements: 9.2 - Chunked upload support for large files
 */

import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
  type CreateMultipartUploadCommandInput,
  type UploadPartCommandInput,
  type CompleteMultipartUploadCommandInput,
  type CompletedPart,
} from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import { getR2Config, generateSchoolKey, generateCdnUrl, type FileMetadata } from '../config/r2-config';
import { r2StorageService } from './r2-storage-service';

/**
 * Chunk upload configuration
 */
export interface ChunkUploadConfig {
  chunkSize: number; // Size of each chunk in bytes (default: 5MB)
  maxRetries: number; // Maximum retries per chunk (default: 3)
  retryDelay: number; // Delay between retries in ms (default: 1000)
  concurrentUploads: number; // Number of concurrent chunk uploads (default: 3)
}

/**
 * Upload session interface
 */
export interface UploadSession {
  sessionId: string;
  schoolId: string;
  key: string;
  uploadId: string;
  totalChunks: number;
  uploadedChunks: Set<number>;
  completedParts: CompletedPart[];
  metadata: Partial<FileMetadata>;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Chunk upload progress interface
 */
export interface ChunkUploadProgress {
  sessionId: string;
  chunkIndex: number;
  totalChunks: number;
  uploadedBytes: number;
  totalBytes: number;
  percentComplete: number;
  isComplete: boolean;
  error?: string;
}

/**
 * Chunked upload result interface
 */
export interface ChunkedUploadResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  key?: string;
  metadata?: FileMetadata;
  error?: string;
  progress?: ChunkUploadProgress;
}

/**
 * Chunked Upload Service Class
 * 
 * Provides reliable large file uploads using multipart upload
 */
export class ChunkedUploadService {
  private client: S3Client;
  private config = getR2Config();
  private sessions = new Map<string, UploadSession>();
  private defaultConfig: ChunkUploadConfig = {
    chunkSize: 5 * 1024 * 1024, // 5MB chunks
    maxRetries: 3,
    retryDelay: 1000,
    concurrentUploads: 3,
  };

  constructor() {
    this.client = new S3Client({
      region: this.config.region,
      endpoint: this.config.endpoint,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      forcePathStyle: true,
    });

    // Clean up expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  /**
   * Initialize chunked upload session
   * 
   * @param schoolId - School identifier for data isolation
   * @param file - File to upload
   * @param metadata - File metadata
   * @param config - Upload configuration
   * @returns Upload session information
   */
  async initializeUpload(
    schoolId: string,
    file: File,
    metadata: Partial<FileMetadata>,
    config: Partial<ChunkUploadConfig> = {}
  ): Promise<ChunkedUploadResult> {
    try {
      const uploadConfig = { ...this.defaultConfig, ...config };
      const sessionId = nanoid();
      const key = generateSchoolKey(schoolId, metadata.folder || 'uploads', file.name);
      
      // Create multipart upload
      const createParams: CreateMultipartUploadCommandInput = {
        Bucket: this.config.bucketName,
        Key: key,
        ContentType: file.type,
        Metadata: {
          schoolId,
          originalName: file.name,
          uploadedBy: metadata.uploadedBy || 'system',
          sessionId,
        },
      };

      const createCommand = new CreateMultipartUploadCommand(createParams);
      const createResult = await this.client.send(createCommand);

      if (!createResult.UploadId) {
        throw new Error('Failed to initialize multipart upload');
      }

      // Calculate total chunks
      const totalChunks = Math.ceil(file.size / uploadConfig.chunkSize);

      // Create upload session
      const session: UploadSession = {
        sessionId,
        schoolId,
        key,
        uploadId: createResult.UploadId,
        totalChunks,
        uploadedChunks: new Set(),
        completedParts: [],
        metadata: {
          ...metadata,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      this.sessions.set(sessionId, session);

      return {
        success: true,
        sessionId,
        progress: {
          sessionId,
          chunkIndex: 0,
          totalChunks,
          uploadedBytes: 0,
          totalBytes: file.size,
          percentComplete: 0,
          isComplete: false,
        },
      };
    } catch (error) {
      console.error('Error initializing chunked upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize upload',
      };
    }
  }

  /**
   * Upload a single chunk
   * 
   * @param sessionId - Upload session ID
   * @param chunkIndex - Index of the chunk (1-based)
   * @param chunkData - Chunk data buffer
   * @returns Upload result with progress
   */
  async uploadChunk(
    sessionId: string,
    chunkIndex: number,
    chunkData: ArrayBuffer
  ): Promise<ChunkedUploadResult> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Upload session not found or expired',
        };
      }

      // Check if chunk already uploaded
      if (session.uploadedChunks.has(chunkIndex)) {
        return this.getProgress(sessionId);
      }

      // Upload chunk with retry logic
      const uploadResult = await this.uploadChunkWithRetry(
        session,
        chunkIndex,
        Buffer.from(chunkData)
      );

      if (!uploadResult.success) {
        return uploadResult;
      }

      // Mark chunk as uploaded
      session.uploadedChunks.add(chunkIndex);
      session.completedParts.push({
        ETag: uploadResult.etag!,
        PartNumber: chunkIndex,
      });

      // Sort completed parts by part number
      session.completedParts.sort((a, b) => (a.PartNumber || 0) - (b.PartNumber || 0));

      // Check if all chunks are uploaded
      if (session.uploadedChunks.size === session.totalChunks) {
        return await this.completeUpload(sessionId);
      }

      return this.getProgress(sessionId);
    } catch (error) {
      console.error('Error uploading chunk:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Chunk upload failed',
      };
    }
  }

  /**
   * Complete multipart upload
   * 
   * @param sessionId - Upload session ID
   * @returns Final upload result
   */
  async completeUpload(sessionId: string): Promise<ChunkedUploadResult> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Upload session not found or expired',
        };
      }

      // Complete multipart upload
      const completeParams: CompleteMultipartUploadCommandInput = {
        Bucket: this.config.bucketName,
        Key: session.key,
        UploadId: session.uploadId,
        MultipartUpload: {
          Parts: session.completedParts,
        },
      };

      const completeCommand = new CompleteMultipartUploadCommand(completeParams);
      const completeResult = await this.client.send(completeCommand);

      // Generate CDN URL
      const url = generateCdnUrl(session.key, this.config.customDomain);

      // Create final metadata
      const finalMetadata: FileMetadata = {
        id: nanoid(),
        schoolId: session.schoolId,
        originalName: session.metadata.originalName || session.key.split('/').pop() || session.key,
        key: session.key,
        url,
        mimeType: session.metadata.mimeType || 'application/octet-stream',
        size: session.metadata.size || 0,
        folder: session.metadata.folder || 'uploads',
        uploadedBy: session.metadata.uploadedBy || 'system',
        uploadedAt: new Date(),
        checksum: completeResult.ETag?.replace(/"/g, '') || '',
      };

      // Clean up session
      this.sessions.delete(sessionId);

      return {
        success: true,
        sessionId,
        url,
        key: session.key,
        metadata: finalMetadata,
        progress: {
          sessionId,
          chunkIndex: session.totalChunks,
          totalChunks: session.totalChunks,
          uploadedBytes: session.metadata.size || 0,
          totalBytes: session.metadata.size || 0,
          percentComplete: 100,
          isComplete: true,
        },
      };
    } catch (error) {
      console.error('Error completing upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete upload',
      };
    }
  }

  /**
   * Abort multipart upload
   * 
   * @param sessionId - Upload session ID
   * @returns Abort result
   */
  async abortUpload(sessionId: string): Promise<ChunkedUploadResult> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Upload session not found or expired',
        };
      }

      // Abort multipart upload
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: this.config.bucketName,
        Key: session.key,
        UploadId: session.uploadId,
      });

      await this.client.send(abortCommand);

      // Clean up session
      this.sessions.delete(sessionId);

      return {
        success: true,
        sessionId,
      };
    } catch (error) {
      console.error('Error aborting upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to abort upload',
      };
    }
  }

  /**
   * Get upload progress
   * 
   * @param sessionId - Upload session ID
   * @returns Current progress information
   */
  getProgress(sessionId: string): ChunkedUploadResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'Upload session not found or expired',
      };
    }

    const uploadedBytes = session.uploadedChunks.size * this.defaultConfig.chunkSize;
    const totalBytes = session.metadata.size || 0;
    const percentComplete = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;

    return {
      success: true,
      sessionId,
      progress: {
        sessionId,
        chunkIndex: session.uploadedChunks.size,
        totalChunks: session.totalChunks,
        uploadedBytes: Math.min(uploadedBytes, totalBytes),
        totalBytes,
        percentComplete: Math.min(percentComplete, 100),
        isComplete: session.uploadedChunks.size === session.totalChunks,
      },
    };
  }

  /**
   * Resume upload from existing session
   * 
   * @param sessionId - Upload session ID
   * @returns List of uploaded parts
   */
  async resumeUpload(sessionId: string): Promise<ChunkedUploadResult> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Upload session not found or expired',
        };
      }

      // List already uploaded parts
      const listCommand = new ListPartsCommand({
        Bucket: this.config.bucketName,
        Key: session.key,
        UploadId: session.uploadId,
      });

      const listResult = await this.client.send(listCommand);
      
      // Update session with existing parts
      if (listResult.Parts) {
        session.completedParts = listResult.Parts.map(part => ({
          ETag: part.ETag!,
          PartNumber: part.PartNumber!,
        }));
        
        session.uploadedChunks.clear();
        listResult.Parts.forEach(part => {
          if (part.PartNumber) {
            session.uploadedChunks.add(part.PartNumber);
          }
        });
      }

      return this.getProgress(sessionId);
    } catch (error) {
      console.error('Error resuming upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resume upload',
      };
    }
  }

  /**
   * Upload chunk with retry logic
   * 
   * @param session - Upload session
   * @param chunkIndex - Chunk index
   * @param chunkData - Chunk data
   * @returns Upload result with ETag
   */
  private async uploadChunkWithRetry(
    session: UploadSession,
    chunkIndex: number,
    chunkData: Buffer
  ): Promise<{ success: boolean; etag?: string; error?: string }> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.defaultConfig.maxRetries; attempt++) {
      try {
        const uploadParams: UploadPartCommandInput = {
          Bucket: this.config.bucketName,
          Key: session.key,
          UploadId: session.uploadId,
          PartNumber: chunkIndex,
          Body: chunkData,
        };

        const uploadCommand = new UploadPartCommand(uploadParams);
        const uploadResult = await this.client.send(uploadCommand);

        if (uploadResult.ETag) {
          return {
            success: true,
            etag: uploadResult.ETag,
          };
        }

        throw new Error('No ETag returned from upload');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.defaultConfig.maxRetries) {
          // Exponential backoff
          const delay = this.defaultConfig.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: lastError!.message,
    };
  }

  /**
   * Clean up expired upload sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        expiredSessions.push(sessionId);
      }
    }

    // Abort expired sessions
    expiredSessions.forEach(async (sessionId) => {
      try {
        await this.abortUpload(sessionId);
      } catch (error) {
        console.error(`Error cleaning up expired session ${sessionId}:`, error);
      }
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired upload sessions`);
    }
  }

  /**
   * Get active upload sessions count
   * 
   * @returns Number of active sessions
   */
  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  /**
   * Get session information
   * 
   * @param sessionId - Upload session ID
   * @returns Session information or null if not found
   */
  getSessionInfo(sessionId: string): UploadSession | null {
    return this.sessions.get(sessionId) || null;
  }
}

// Export singleton instance
export const chunkedUploadService = new ChunkedUploadService();