/**
 * Image Processor Service Tests
 * 
 * Tests for image processing functionality including:
 * - Thumbnail generation
 * - Image optimization
 * - Format conversion
 * - Metadata extraction
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ImageProcessor } from '../image-processor';
import sharp from 'sharp';

describe('ImageProcessor', () => {
  let imageProcessor: ImageProcessor;
  let testImageBuffer: Buffer;

  beforeAll(async () => {
    imageProcessor = new ImageProcessor();
    
    // Create a test image buffer (100x100 red square)
    testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .jpeg()
    .toBuffer();
  });

  describe('generateThumbnails', () => {
    it('should generate thumbnails with correct dimensions', async () => {
      const thumbnailSizes = [
        { name: 'small', width: 50, height: 50 },
        { name: 'medium', width: 75, height: 75 }
      ];

      const thumbnails = await imageProcessor.generateThumbnails(testImageBuffer, thumbnailSizes);

      expect(thumbnails).toHaveLength(2);
      expect(thumbnails[0].size.name).toBe('small');
      expect(thumbnails[0].dimensions.width).toBe(50);
      expect(thumbnails[0].dimensions.height).toBe(50);
      expect(thumbnails[1].size.name).toBe('medium');
      expect(thumbnails[1].dimensions.width).toBe(75);
      expect(thumbnails[1].dimensions.height).toBe(75);
    });

    it('should generate thumbnails with valid buffers', async () => {
      const thumbnailSizes = [{ name: 'test', width: 30, height: 30 }];
      
      const thumbnails = await imageProcessor.generateThumbnails(testImageBuffer, thumbnailSizes);
      
      expect(thumbnails[0].buffer).toBeInstanceOf(Buffer);
      expect(thumbnails[0].buffer.length).toBeGreaterThan(0);
      expect(thumbnails[0].fileSize).toBeGreaterThan(0);
    });
  });

  describe('optimizeImage', () => {
    it('should optimize image and return valid result', async () => {
      const optimized = await imageProcessor.optimizeImage(testImageBuffer, {
        quality: 50
      });

      expect(optimized.buffer).toBeInstanceOf(Buffer);
      expect(optimized.size).toBeGreaterThan(0);
      expect(optimized.width).toBeGreaterThan(0);
      expect(optimized.height).toBeGreaterThan(0);
      expect(optimized.format).toBeDefined();
    });

    it('should convert to WebP format when specified', async () => {
      const optimized = await imageProcessor.optimizeImage(testImageBuffer, {
        format: 'webp',
        quality: 80
      });

      expect(optimized.format).toBe('webp');
      expect(optimized.buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('convertFormat', () => {
    it('should convert image to PNG format', async () => {
      const converted = await imageProcessor.convertFormat(testImageBuffer, 'png');

      expect(converted.format).toBe('png');
      expect(converted.buffer).toBeInstanceOf(Buffer);
      expect(converted.size).toBeGreaterThan(0);
    });

    it('should convert image to WebP format', async () => {
      const converted = await imageProcessor.convertFormat(testImageBuffer, 'webp');

      expect(converted.format).toBe('webp');
      expect(converted.buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('getImageMetadata', () => {
    it('should extract correct metadata from image', async () => {
      const metadata = await imageProcessor.getImageMetadata(testImageBuffer);

      expect(metadata.width).toBe(100);
      expect(metadata.height).toBe(100);
      expect(metadata.format).toBe('jpeg');
      expect(metadata.size).toBe(testImageBuffer.length);
      expect(typeof metadata.channels).toBe('number');
      expect(typeof metadata.density).toBe('number');
    });
  });

  describe('isValidImage', () => {
    it('should return true for valid image buffer', async () => {
      const isValid = await imageProcessor.isValidImage(testImageBuffer);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid buffer', async () => {
      const invalidBuffer = Buffer.from('not an image');
      const isValid = await imageProcessor.isValidImage(invalidBuffer);
      expect(isValid).toBe(false);
    });
  });

  describe('processImageVariants', () => {
    it('should process original and thumbnails', async () => {
      const variants = await imageProcessor.processImageVariants(testImageBuffer);

      expect(variants.original).toBeDefined();
      expect(variants.original.buffer).toBeInstanceOf(Buffer);
      expect(variants.thumbnails).toBeInstanceOf(Array);
      expect(variants.thumbnails.length).toBeGreaterThan(0);
    });
  });

  describe('generatePdfPreview', () => {
    it('should generate PDF preview placeholder', async () => {
      // Create a dummy PDF buffer for testing
      const dummyPdfBuffer = Buffer.from('dummy pdf content');
      
      const preview = await imageProcessor.generatePdfPreview(dummyPdfBuffer);

      expect(preview.buffer).toBeInstanceOf(Buffer);
      expect(preview.width).toBeGreaterThan(0);
      expect(preview.height).toBeGreaterThan(0);
      expect(preview.format).toBe('jpeg');
    });
  });

  describe('utility methods', () => {
    it('should calculate compression ratio correctly', () => {
      const ratio = imageProcessor.calculateCompressionRatio(1000, 500);
      expect(ratio).toBe(50);
    });

    it('should return supported formats', () => {
      const formats = imageProcessor.getSupportedFormats();
      expect(formats).toContain('jpeg');
      expect(formats).toContain('png');
      expect(formats).toContain('webp');
    });

    it('should return recommended thumbnail sizes', () => {
      const sizes = imageProcessor.getRecommendedThumbnailSizes();
      expect(sizes).toBeInstanceOf(Array);
      expect(sizes.length).toBeGreaterThan(0);
      expect(sizes[0]).toHaveProperty('name');
      expect(sizes[0]).toHaveProperty('width');
      expect(sizes[0]).toHaveProperty('height');
    });
  });
});