/**
 * Image Upload Integration Utility
 * 
 * This utility demonstrates how to integrate the ImageProcessor service
 * with the R2 storage service for complete image upload workflows.
 */

import { imageProcessor } from '../services/image-processor';
import { r2StorageService } from '../services/r2-storage-service';
import { uploadHandler } from '../services/upload-handler';
import { nanoid } from 'nanoid';
import type { FileMetadata, UploadResult } from '../config/r2-config';

/**
 * Upload image with automatic thumbnail generation and optimization
 * 
 * @param schoolId - School identifier for data isolation
 * @param imageBuffer - Original image buffer
 * @param originalName - Original filename
 * @param folder - Target folder within school structure
 * @param userId - User performing the upload
 * @returns Upload result with original and thumbnail URLs
 */
export async function uploadImageWithThumbnails(
  schoolId: string,
  imageBuffer: Buffer,
  originalName: string,
  folder: string,
  userId: string
): Promise<{
  success: boolean;
  original?: UploadResult;
  thumbnails?: UploadResult[];
  error?: string;
}> {
  try {
    // Validate that it's a valid image
    const isValid = await imageProcessor.isValidImage(imageBuffer);
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid image format',
      };
    }

    // Process image variants (original + thumbnails)
    const variants = await imageProcessor.processImageVariants(imageBuffer, {
      quality: 85,
      stripMetadata: true,
    });

    // Upload original optimized image
    const originalKey = `${originalName.replace(/\.[^/.]+$/, '')}-${nanoid(8)}.${variants.original.format}`;
    const originalMetadata: Partial<FileMetadata> = {
      originalName,
      mimeType: `image/${variants.original.format}`,
      folder,
      uploadedBy: userId,
    };

    const originalUpload = await r2StorageService.uploadFile(
      schoolId,
      variants.original.buffer,
      originalKey,
      originalMetadata
    );

    if (!originalUpload.success) {
      return {
        success: false,
        error: originalUpload.error,
      };
    }

    // Upload thumbnails
    const thumbnailUploads: UploadResult[] = [];
    for (const thumbnail of variants.thumbnails) {
      const thumbnailKey = `${originalName.replace(/\.[^/.]+$/, '')}-${thumbnail.size.name}-${nanoid(8)}.${thumbnail.format}`;
      const thumbnailMetadata: Partial<FileMetadata> = {
        originalName: `${originalName} (${thumbnail.size.name})`,
        mimeType: `image/${thumbnail.format}`,
        folder: `${folder}/thumbnails`,
        uploadedBy: userId,
      };

      const thumbnailUpload = await r2StorageService.uploadFile(
        schoolId,
        thumbnail.buffer,
        thumbnailKey,
        thumbnailMetadata
      );

      if (thumbnailUpload.success) {
        thumbnailUploads.push(thumbnailUpload);
      }
    }

    return {
      success: true,
      original: originalUpload,
      thumbnails: thumbnailUploads,
    };
  } catch (error) {
    console.error('Image upload with thumbnails error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Generate PDF preview and upload to R2
 * 
 * @param schoolId - School identifier for data isolation
 * @param pdfBuffer - PDF file buffer
 * @param originalName - Original PDF filename
 * @param folder - Target folder within school structure
 * @param userId - User performing the upload
 * @returns Upload result for PDF preview image
 */
export async function generateAndUploadPdfPreview(
  schoolId: string,
  pdfBuffer: Buffer,
  originalName: string,
  folder: string,
  userId: string
): Promise<UploadResult> {
  try {
    // Generate PDF preview
    const preview = await imageProcessor.generatePdfPreview(pdfBuffer, {
      width: 600,
      height: 800,
      format: 'jpeg',
      quality: 85,
    });

    // Upload preview image
    const previewKey = `${originalName.replace(/\.[^/.]+$/, '')}-preview-${nanoid(8)}.${preview.format}`;
    const previewMetadata: Partial<FileMetadata> = {
      originalName: `${originalName} (preview)`,
      mimeType: `image/${preview.format}`,
      folder: `${folder}/previews`,
      uploadedBy: userId,
    };

    return await r2StorageService.uploadFile(
      schoolId,
      preview.buffer,
      previewKey,
      previewMetadata
    );
  } catch (error) {
    console.error('PDF preview generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Preview generation failed',
    };
  }
}

/**
 * Optimize existing image in R2 storage
 * 
 * @param schoolId - School identifier for validation
 * @param imageKey - R2 key of existing image
 * @param optimizationOptions - Optimization settings
 * @returns Upload result for optimized image
 */
export async function optimizeExistingImage(
  schoolId: string,
  imageKey: string,
  optimizationOptions: {
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp' | 'avif';
  } = {}
): Promise<UploadResult> {
  try {
    // Get existing image metadata
    const metadata = await r2StorageService.getFileMetadata(schoolId, imageKey);
    if (!metadata) {
      return {
        success: false,
        error: 'Image not found',
      };
    }

    // Download existing image (this would need a download method in R2StorageService)
    // For now, this is a placeholder showing the intended workflow
    
    return {
      success: false,
      error: 'Download method not implemented in R2StorageService',
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Optimization failed',
    };
  }
}

/**
 * Get image processing statistics
 * 
 * @param originalBuffer - Original image buffer
 * @param processedBuffer - Processed image buffer
 * @returns Processing statistics
 */
export function getProcessingStats(originalBuffer: Buffer, processedBuffer: Buffer): {
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  sizeSavings: number;
} {
  const originalSize = originalBuffer.length;
  const processedSize = processedBuffer.length;
  const compressionRatio = imageProcessor.calculateCompressionRatio(originalSize, processedSize);
  const sizeSavings = originalSize - processedSize;

  return {
    originalSize,
    processedSize,
    compressionRatio,
    sizeSavings,
  };
}