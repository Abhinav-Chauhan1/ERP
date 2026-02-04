/**
 * Image Processing Service with Sharp.js
 * 
 * This service provides comprehensive image processing capabilities including:
 * - Thumbnail generation (150x150, 300x300, 600x600)
 * - Image optimization and compression
 * - PDF preview generation functionality
 * - Format conversion (WebP, AVIF for modern browsers)
 * - Batch processing for multiple variants
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import sharp from 'sharp';
import { defaultUploadConfig, type ThumbnailSize, type FileVariant } from '../config/r2-config';

/**
 * Image processing options interface
 */
export interface ImageProcessingOptions {
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  progressive?: boolean;
  stripMetadata?: boolean;
}

/**
 * Processed image result interface
 */
export interface ProcessedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Thumbnail generation result interface
 */
export interface ThumbnailResult {
  size: ThumbnailSize;
  buffer: Buffer;
  format: string;
  dimensions: { width: number; height: number };
  fileSize: number;
}

/**
 * PDF preview options interface
 */
export interface PDFPreviewOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Image Processing Service Class
 * 
 * Provides server-side image processing using Sharp.js
 */
export class ImageProcessor {
  private config = defaultUploadConfig;

  /**
   * Generate multiple thumbnail sizes for an image
   * 
   * @param buffer - Original image buffer
   * @param sizes - Array of thumbnail sizes to generate
   * @param options - Processing options
   * @returns Array of processed thumbnails
   */
  async generateThumbnails(
    buffer: Buffer,
    sizes: ThumbnailSize[] = this.config.thumbnailSizes,
    options: ImageProcessingOptions = {}
  ): Promise<ThumbnailResult[]> {
    try {
      const results: ThumbnailResult[] = [];
      
      // Process each thumbnail size
      for (const size of sizes) {
        const thumbnail = await this.generateSingleThumbnail(buffer, size, options);
        results.push(thumbnail);
      }

      return results;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      throw new Error(`Failed to generate thumbnails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a single thumbnail with specified dimensions
   * 
   * @param buffer - Original image buffer
   * @param size - Thumbnail size configuration
   * @param options - Processing options
   * @returns Processed thumbnail
   */
  async generateSingleThumbnail(
    buffer: Buffer,
    size: ThumbnailSize,
    options: ImageProcessingOptions = {}
  ): Promise<ThumbnailResult> {
    try {
      const sharpInstance = sharp(buffer);
      
      // Get original image metadata
      const metadata = await sharpInstance.metadata();
      
      // Configure thumbnail processing
      let processor = sharpInstance
        .resize(size.width, size.height, {
          fit: 'cover', // Crop to fill dimensions
          position: 'center',
        });

      // Apply format and quality settings
      const format = options.format || this.getOptimalFormat(metadata.format);
      const quality = options.quality || this.config.compressionQuality;

      switch (format) {
        case 'jpeg':
          processor = processor.jpeg({ 
            quality,
            progressive: options.progressive ?? true,
          });
          break;
        case 'png':
          processor = processor.png({ 
            quality,
            progressive: options.progressive ?? true,
          });
          break;
        case 'webp':
          processor = processor.webp({ 
            quality,
          });
          break;
        case 'avif':
          processor = processor.avif({ 
            quality,
          });
          break;
        default:
          processor = processor.jpeg({ quality });
      }

      // Strip metadata if requested
      if (options.stripMetadata ?? true) {
        processor = processor.withMetadata({});
      }

      // Process the thumbnail
      const processedBuffer = await processor.toBuffer();
      const processedMetadata = await sharp(processedBuffer).metadata();

      return {
        size,
        buffer: processedBuffer,
        format,
        dimensions: {
          width: processedMetadata.width || size.width,
          height: processedMetadata.height || size.height,
        },
        fileSize: processedBuffer.length,
      };
    } catch (error) {
      console.error(`Thumbnail generation error for size ${size.name}:`, error);
      throw new Error(`Failed to generate ${size.name} thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimize image for web delivery
   * 
   * @param buffer - Original image buffer
   * @param options - Optimization options
   * @returns Optimized image buffer
   */
  async optimizeImage(
    buffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    try {
      const sharpInstance = sharp(buffer);
      const metadata = await sharpInstance.metadata();
      
      // Determine optimal format
      const format = options.format || this.getOptimalFormat(metadata.format);
      const quality = options.quality || this.config.compressionQuality;

      let processor = sharpInstance;

      // Apply format-specific optimizations
      switch (format) {
        case 'jpeg':
          processor = processor.jpeg({
            quality,
            progressive: options.progressive ?? true,
            mozjpeg: true, // Use mozjpeg encoder for better compression
          });
          break;
        case 'png':
          processor = processor.png({
            quality,
            progressive: options.progressive ?? true,
            compressionLevel: 9, // Maximum compression
          });
          break;
        case 'webp':
          processor = processor.webp({
            quality,
            effort: 6, // Higher effort for better compression
          });
          break;
        case 'avif':
          processor = processor.avif({
            quality,
            effort: 9, // Maximum effort for AVIF
          });
          break;
        default:
          processor = processor.jpeg({ quality });
      }

      // Strip metadata for smaller file size
      if (options.stripMetadata ?? true) {
        processor = processor.withMetadata({});
      }

      // Process the image
      const optimizedBuffer = await processor.toBuffer();
      const optimizedMetadata = await sharp(optimizedBuffer).metadata();

      return {
        buffer: optimizedBuffer,
        format,
        width: optimizedMetadata.width || 0,
        height: optimizedMetadata.height || 0,
        size: optimizedBuffer.length,
      };
    } catch (error) {
      console.error('Image optimization error:', error);
      throw new Error(`Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate PDF preview image from first page
   * 
   * @param pdfBuffer - PDF file buffer
   * @param options - Preview generation options
   * @returns Preview image buffer
   */
  async generatePdfPreview(
    pdfBuffer: Buffer,
    options: PDFPreviewOptions = {}
  ): Promise<ProcessedImage> {
    try {
      // Note: Sharp doesn't directly support PDF rendering
      // This is a placeholder implementation that would need a PDF library like pdf-poppler or pdf2pic
      // For now, we'll create a placeholder image indicating PDF preview generation needs additional setup
      
      const width = options.width || 600;
      const height = options.height || 800;
      const format = options.format || 'jpeg';
      const quality = options.quality || this.config.compressionQuality;

      // Create a placeholder image for PDF preview
      // In a real implementation, you would use a PDF rendering library
      const placeholderSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f8f9fa"/>
          <rect x="50" y="50" width="${width - 100}" height="${height - 100}" fill="white" stroke="#dee2e6" stroke-width="2"/>
          <text x="${width / 2}" y="${height / 2 - 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#6c757d">PDF Document</text>
          <text x="${width / 2}" y="${height / 2 + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#adb5bd">Preview Generation</text>
          <text x="${width / 2}" y="${height / 2 + 50}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#adb5bd">Requires PDF Library</text>
        </svg>
      `;

      let processor = sharp(Buffer.from(placeholderSvg));

      // Apply format and quality
      switch (format) {
        case 'jpeg':
          processor = processor.jpeg({ quality });
          break;
        case 'png':
          processor = processor.png({ quality });
          break;
        case 'webp':
          processor = processor.webp({ quality });
          break;
        default:
          processor = processor.jpeg({ quality });
      }

      const previewBuffer = await processor.toBuffer();
      const metadata = await sharp(previewBuffer).metadata();

      return {
        buffer: previewBuffer,
        format,
        width: metadata.width || width,
        height: metadata.height || height,
        size: previewBuffer.length,
      };
    } catch (error) {
      console.error('PDF preview generation error:', error);
      throw new Error(`Failed to generate PDF preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert image to different format
   * 
   * @param buffer - Original image buffer
   * @param targetFormat - Target image format
   * @param options - Conversion options
   * @returns Converted image buffer
   */
  async convertFormat(
    buffer: Buffer,
    targetFormat: 'jpeg' | 'png' | 'webp' | 'avif',
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    try {
      const quality = options.quality || this.config.compressionQuality;
      let processor = sharp(buffer);

      // Apply target format
      switch (targetFormat) {
        case 'jpeg':
          processor = processor.jpeg({
            quality,
            progressive: options.progressive ?? true,
          });
          break;
        case 'png':
          processor = processor.png({
            quality,
            progressive: options.progressive ?? true,
          });
          break;
        case 'webp':
          processor = processor.webp({
            quality,
          });
          break;
        case 'avif':
          processor = processor.avif({
            quality,
          });
          break;
      }

      // Strip metadata if requested
      if (options.stripMetadata ?? true) {
        processor = processor.withMetadata({});
      }

      const convertedBuffer = await processor.toBuffer();
      const metadata = await sharp(convertedBuffer).metadata();

      return {
        buffer: convertedBuffer,
        format: targetFormat,
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: convertedBuffer.length,
      };
    } catch (error) {
      console.error('Format conversion error:', error);
      throw new Error(`Failed to convert to ${targetFormat}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process image with multiple variants (original + thumbnails)
   * 
   * @param buffer - Original image buffer
   * @param options - Processing options
   * @returns Array of processed variants including original
   */
  async processImageVariants(
    buffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<{
    original: ProcessedImage;
    thumbnails: ThumbnailResult[];
  }> {
    try {
      // Process original image
      const original = await this.optimizeImage(buffer, options);
      
      // Generate thumbnails
      const thumbnails = await this.generateThumbnails(buffer, this.config.thumbnailSizes, options);

      return {
        original,
        thumbnails,
      };
    } catch (error) {
      console.error('Image variants processing error:', error);
      throw new Error(`Failed to process image variants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get image metadata without processing
   * 
   * @param buffer - Image buffer
   * @returns Image metadata
   */
  async getImageMetadata(buffer: Buffer): Promise<{
    format: string;
    width: number;
    height: number;
    channels: number;
    density: number;
    hasAlpha: boolean;
    size: number;
  }> {
    try {
      const metadata = await sharp(buffer).metadata();
      
      return {
        format: metadata.format || 'unknown',
        width: metadata.width || 0,
        height: metadata.height || 0,
        channels: metadata.channels || 0,
        density: metadata.density || 72,
        hasAlpha: metadata.hasAlpha || false,
        size: buffer.length,
      };
    } catch (error) {
      console.error('Metadata extraction error:', error);
      throw new Error(`Failed to extract image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if buffer contains a valid image
   * 
   * @param buffer - Buffer to validate
   * @returns True if valid image, false otherwise
   */
  async isValidImage(buffer: Buffer): Promise<boolean> {
    try {
      await sharp(buffer).metadata();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get optimal format based on original format and configuration
   * 
   * @param originalFormat - Original image format
   * @returns Optimal format for web delivery
   */
  private getOptimalFormat(originalFormat?: string): 'jpeg' | 'png' | 'webp' | 'avif' {
    // Prefer WebP if enabled and supported
    if (this.config.enableWebP) {
      return 'webp';
    }

    // Prefer AVIF if enabled and supported
    if (this.config.enableAVIF) {
      return 'avif';
    }

    // Fall back to original format or JPEG
    switch (originalFormat) {
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      case 'avif':
        return 'avif';
      default:
        return 'jpeg';
    }
  }

  /**
   * Calculate compression ratio
   * 
   * @param originalSize - Original file size in bytes
   * @param compressedSize - Compressed file size in bytes
   * @returns Compression ratio as percentage
   */
  calculateCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  }

  /**
   * Get supported formats by Sharp
   * 
   * @returns Array of supported format names
   */
  getSupportedFormats(): string[] {
    return ['jpeg', 'png', 'webp', 'avif', 'gif', 'svg', 'tiff'];
  }

  /**
   * Get recommended thumbnail sizes
   * 
   * @returns Array of recommended thumbnail sizes
   */
  getRecommendedThumbnailSizes(): ThumbnailSize[] {
    return this.config.thumbnailSizes;
  }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();