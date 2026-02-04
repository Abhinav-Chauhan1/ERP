/**
 * Modern Image Format Service
 * 
 * This service provides support for modern image formats (WebP, AVIF)
 * based on client capabilities and browser support. It handles format
 * detection, conversion, and serving the most appropriate format.
 * 
 * Requirements: 9.6 - Modern image format support (WebP, AVIF)
 */

import sharp from 'sharp';
import { imageProcessor } from './image-processor';
import { r2StorageService } from './r2-storage-service';
import { generateSchoolKey, generateCdnUrl, getR2Config } from '../config/r2-config';

/**
 * Supported modern image formats
 */
export type ModernImageFormat = 'webp' | 'avif' | 'jpeg' | 'png';

/**
 * Client capabilities interface
 */
export interface ClientCapabilities {
  supportsWebP: boolean;
  supportsAVIF: boolean;
  userAgent?: string;
  acceptHeader?: string;
}

/**
 * Format conversion options
 */
export interface FormatConversionOptions {
  quality?: number;
  progressive?: boolean;
  effort?: number; // For AVIF (1-9, higher = better compression)
  lossless?: boolean; // For WebP
}

/**
 * Format variant interface
 */
export interface FormatVariant {
  format: ModernImageFormat;
  url: string;
  key: string;
  size: number;
  quality: number;
}

/**
 * Format optimization result
 */
export interface FormatOptimizationResult {
  success: boolean;
  originalFormat: string;
  variants: FormatVariant[];
  recommendedFormat: ModernImageFormat;
  error?: string;
}

/**
 * Modern Image Format Service Class
 * 
 * Provides modern image format support and optimization
 */
export class ModernImageFormatService {
  private config = getR2Config();

  /**
   * Detect client capabilities from request headers
   * 
   * @param acceptHeader - Accept header from request
   * @param userAgent - User agent string
   * @returns Client capabilities
   */
  detectClientCapabilities(acceptHeader?: string, userAgent?: string): ClientCapabilities {
    const accept = acceptHeader?.toLowerCase() || '';
    const ua = userAgent?.toLowerCase() || '';

    return {
      supportsWebP: accept.includes('image/webp') || this.detectWebPSupport(ua),
      supportsAVIF: accept.includes('image/avif') || this.detectAVIFSupport(ua),
      userAgent,
      acceptHeader,
    };
  }

  /**
   * Get optimal format based on client capabilities
   * 
   * @param capabilities - Client capabilities
   * @param originalFormat - Original image format
   * @returns Optimal format to serve
   */
  getOptimalFormat(capabilities: ClientCapabilities, originalFormat: string): ModernImageFormat {
    // Prefer AVIF for maximum compression (if supported)
    if (capabilities.supportsAVIF && this.shouldUseAVIF(originalFormat)) {
      return 'avif';
    }

    // Fall back to WebP for good compression and wide support
    if (capabilities.supportsWebP && this.shouldUseWebP(originalFormat)) {
      return 'webp';
    }

    // Fall back to original format or JPEG
    switch (originalFormat.toLowerCase()) {
      case 'png':
        return 'png';
      case 'jpeg':
      case 'jpg':
        return 'jpeg';
      default:
        return 'jpeg';
    }
  }

  /**
   * Generate multiple format variants for an image
   * 
   * @param schoolId - School identifier
   * @param imageBuffer - Original image buffer
   * @param originalKey - Original image key
   * @param options - Conversion options
   * @returns Format optimization result
   */
  async generateFormatVariants(
    schoolId: string,
    imageBuffer: Buffer,
    originalKey: string,
    options: FormatConversionOptions = {}
  ): Promise<FormatOptimizationResult> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const originalFormat = metadata.format || 'jpeg';
      const variants: FormatVariant[] = [];

      // Generate WebP variant
      if (this.shouldGenerateWebP(originalFormat)) {
        const webpVariant = await this.generateFormatVariant(
          schoolId,
          imageBuffer,
          originalKey,
          'webp',
          options
        );
        if (webpVariant) variants.push(webpVariant);
      }

      // Generate AVIF variant
      if (this.shouldGenerateAVIF(originalFormat)) {
        const avifVariant = await this.generateFormatVariant(
          schoolId,
          imageBuffer,
          originalKey,
          'avif',
          options
        );
        if (avifVariant) variants.push(avifVariant);
      }

      // Generate optimized original format
      const originalVariant = await this.generateFormatVariant(
        schoolId,
        imageBuffer,
        originalKey,
        originalFormat as ModernImageFormat,
        options
      );
      if (originalVariant) variants.push(originalVariant);

      // Determine recommended format (smallest file size)
      const recommendedFormat = this.getRecommendedFormat(variants, originalFormat);

      return {
        success: true,
        originalFormat,
        variants,
        recommendedFormat,
      };
    } catch (error) {
      console.error('Error generating format variants:', error);
      return {
        success: false,
        originalFormat: 'unknown',
        variants: [],
        recommendedFormat: 'jpeg',
        error: error instanceof Error ? error.message : 'Format generation failed',
      };
    }
  }

  /**
   * Get the best available format variant for client
   * 
   * @param schoolId - School identifier
   * @param baseKey - Base image key (without format extension)
   * @param capabilities - Client capabilities
   * @returns URL of best format variant
   */
  async getBestFormatUrl(
    schoolId: string,
    baseKey: string,
    capabilities: ClientCapabilities
  ): Promise<string | null> {
    try {
      // Try formats in order of preference
      const formatPriority: ModernImageFormat[] = [];
      
      if (capabilities.supportsAVIF) formatPriority.push('avif');
      if (capabilities.supportsWebP) formatPriority.push('webp');
      formatPriority.push('jpeg', 'png');

      // Check which formats exist
      for (const format of formatPriority) {
        const formatKey = this.getFormatKey(baseKey, format);
        const exists = await r2StorageService.fileExists(schoolId, formatKey);
        
        if (exists) {
          return generateCdnUrl(formatKey, this.config.customDomain);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting best format URL:', error);
      return null;
    }
  }

  /**
   * Convert image to specific format
   * 
   * @param imageBuffer - Original image buffer
   * @param targetFormat - Target format
   * @param options - Conversion options
   * @returns Converted image buffer
   */
  async convertToFormat(
    imageBuffer: Buffer,
    targetFormat: ModernImageFormat,
    options: FormatConversionOptions = {}
  ): Promise<Buffer> {
    const quality = options.quality || 85;
    let processor = sharp(imageBuffer);

    switch (targetFormat) {
      case 'webp':
        processor = processor.webp({
          quality,
          lossless: options.lossless || false,
          effort: Math.min(options.effort || 4, 6), // WebP effort is 0-6
        });
        break;

      case 'avif':
        processor = processor.avif({
          quality,
          effort: Math.min(options.effort || 4, 9), // AVIF effort is 0-9
        });
        break;

      case 'jpeg':
        processor = processor.jpeg({
          quality,
          progressive: options.progressive ?? true,
          mozjpeg: true,
        });
        break;

      case 'png':
        processor = processor.png({
          quality,
          progressive: options.progressive ?? true,
          compressionLevel: 9,
        });
        break;

      default:
        throw new Error(`Unsupported format: ${targetFormat}`);
    }

    return await processor.toBuffer();
  }

  /**
   * Analyze format efficiency for an image
   * 
   * @param imageBuffer - Original image buffer
   * @returns Format analysis with size comparisons
   */
  async analyzeFormatEfficiency(imageBuffer: Buffer): Promise<{
    originalSize: number;
    formats: Array<{
      format: ModernImageFormat;
      size: number;
      compressionRatio: number;
      quality: number;
    }>;
    bestFormat: ModernImageFormat;
  }> {
    const originalSize = imageBuffer.length;
    const formats: Array<{
      format: ModernImageFormat;
      size: number;
      compressionRatio: number;
      quality: number;
    }> = [];

    const testFormats: ModernImageFormat[] = ['webp', 'avif', 'jpeg'];
    const quality = 85;

    for (const format of testFormats) {
      try {
        const converted = await this.convertToFormat(imageBuffer, format, { quality });
        const compressionRatio = ((originalSize - converted.length) / originalSize) * 100;

        formats.push({
          format,
          size: converted.length,
          compressionRatio,
          quality,
        });
      } catch (error) {
        console.warn(`Failed to convert to ${format}:`, error);
      }
    }

    // Find best format (smallest size)
    const bestFormat = formats.reduce((best, current) => 
      current.size < best.size ? current : best
    ).format;

    return {
      originalSize,
      formats,
      bestFormat,
    };
  }

  /**
   * Generate a single format variant
   * 
   * @param schoolId - School identifier
   * @param imageBuffer - Original image buffer
   * @param originalKey - Original image key
   * @param format - Target format
   * @param options - Conversion options
   * @returns Format variant or null if failed
   */
  private async generateFormatVariant(
    schoolId: string,
    imageBuffer: Buffer,
    originalKey: string,
    format: ModernImageFormat,
    options: FormatConversionOptions
  ): Promise<FormatVariant | null> {
    try {
      const quality = options.quality || 85;
      const convertedBuffer = await this.convertToFormat(imageBuffer, format, options);
      
      // Generate format-specific key
      const formatKey = this.getFormatKey(originalKey, format);
      
      // Upload variant to R2
      const uploadResult = await r2StorageService.uploadFile(
        schoolId,
        convertedBuffer,
        formatKey.split('/').pop()!,
        {
          originalName: `${originalKey.split('/').pop()}.${format}`,
          mimeType: `image/${format}`,
          folder: originalKey.split('/').slice(1, -1).join('/'),
        }
      );

      if (!uploadResult.success) {
        console.warn(`Failed to upload ${format} variant:`, uploadResult.error);
        return null;
      }

      return {
        format,
        url: uploadResult.url!,
        key: formatKey,
        size: convertedBuffer.length,
        quality,
      };
    } catch (error) {
      console.warn(`Failed to generate ${format} variant:`, error);
      return null;
    }
  }

  /**
   * Get format-specific key
   * 
   * @param baseKey - Base key without extension
   * @param format - Target format
   * @returns Format-specific key
   */
  private getFormatKey(baseKey: string, format: ModernImageFormat): string {
    const keyParts = baseKey.split('.');
    if (keyParts.length > 1) {
      keyParts[keyParts.length - 1] = format;
    } else {
      keyParts.push(format);
    }
    return keyParts.join('.');
  }

  /**
   * Get recommended format from variants
   * 
   * @param variants - Available format variants
   * @param originalFormat - Original image format
   * @returns Recommended format
   */
  private getRecommendedFormat(variants: FormatVariant[], originalFormat: string): ModernImageFormat {
    if (variants.length === 0) {
      return 'jpeg';
    }

    // Find smallest variant
    const smallest = variants.reduce((best, current) => 
      current.size < best.size ? current : best
    );

    return smallest.format;
  }

  /**
   * Detect WebP support from user agent
   * 
   * @param userAgent - User agent string
   * @returns True if WebP is supported
   */
  private detectWebPSupport(userAgent: string): boolean {
    // Chrome 23+, Firefox 65+, Safari 14+, Edge 18+
    return /chrome\/(?:[2-9]\d|[1-9]\d{2,})|firefox\/(?:[6-9]\d|\d{3,})|safari\/(?:1[4-9]|[2-9]\d|\d{3,})|edge\/(?:1[8-9]|[2-9]\d|\d{3,})/i.test(userAgent);
  }

  /**
   * Detect AVIF support from user agent
   * 
   * @param userAgent - User agent string
   * @returns True if AVIF is supported
   */
  private detectAVIFSupport(userAgent: string): boolean {
    // Chrome 85+, Firefox 93+, Safari 16.1+
    return /chrome\/(?:8[5-9]|9\d|\d{3,})|firefox\/(?:9[3-9]|\d{3,})|safari\/(?:16\.[1-9]|1[7-9]|\d{2,})/i.test(userAgent);
  }

  /**
   * Check if WebP should be used for format
   * 
   * @param originalFormat - Original image format
   * @returns True if WebP should be used
   */
  private shouldUseWebP(originalFormat: string): boolean {
    // Use WebP for JPEG and PNG images
    return ['jpeg', 'jpg', 'png'].includes(originalFormat.toLowerCase());
  }

  /**
   * Check if AVIF should be used for format
   * 
   * @param originalFormat - Original image format
   * @returns True if AVIF should be used
   */
  private shouldUseAVIF(originalFormat: string): boolean {
    // Use AVIF for JPEG images (best compression)
    return ['jpeg', 'jpg'].includes(originalFormat.toLowerCase());
  }

  /**
   * Check if WebP variant should be generated
   * 
   * @param originalFormat - Original image format
   * @returns True if WebP variant should be generated
   */
  private shouldGenerateWebP(originalFormat: string): boolean {
    return this.shouldUseWebP(originalFormat);
  }

  /**
   * Check if AVIF variant should be generated
   * 
   * @param originalFormat - Original image format
   * @returns True if AVIF variant should be generated
   */
  private shouldGenerateAVIF(originalFormat: string): boolean {
    return this.shouldUseAVIF(originalFormat);
  }
}

// Export singleton instance
export const modernImageFormatService = new ModernImageFormatService();