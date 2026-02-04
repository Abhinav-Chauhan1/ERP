/**
 * Upload Handler Service Tests
 * 
 * Tests for the UploadHandler service with school-aware validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UploadHandler } from '../lib/services/upload-handler';
import type { FileInput } from '../lib/services/upload-handler';

// Mock dependencies
vi.mock('../lib/services/r2-storage-service', () => ({
  r2StorageService: {
    uploadFile: vi.fn(),
  },
}));

vi.mock('../lib/auth/tenant', () => ({
  requireSchoolAccess: vi.fn(),
}));

// Import mocked modules
import { r2StorageService } from '../lib/services/r2-storage-service';
import { requireSchoolAccess } from '../lib/auth/tenant';

describe('UploadHandler', () => {
  let uploadHandler: UploadHandler;

  beforeEach(() => {
    uploadHandler = new UploadHandler();
    
    // Setup mocks with default implementations
    vi.mocked(requireSchoolAccess).mockResolvedValue({
      schoolId: 'test-school-123',
      userId: 'test-user-456',
      role: 'ADMIN',
      isSuperAdmin: false,
      user: { id: 'test-user-456', name: 'Test User' },
    });
    
    vi.mocked(r2StorageService.uploadFile).mockResolvedValue({
      success: true,
      url: 'https://cdn.example.com/school-test-school-123/images/test-file-abc123.jpg',
      key: 'school-test-school-123/images/test-file-abc123.jpg',
      metadata: {
        id: 'meta-123',
        schoolId: 'test-school-123',
        originalName: 'test-image.jpg',
        key: 'school-test-school-123/images/test-file-abc123.jpg',
        url: 'https://cdn.example.com/school-test-school-123/images/test-file-abc123.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        folder: 'images',
        uploadedBy: 'test-user-456',
        uploadedAt: new Date(),
        checksum: 'abc123',
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('File Validation', () => {
    it('should validate image files correctly', () => {
      const imageFile: FileInput = {
        name: 'test-image.jpg',
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg',
        arrayBuffer: vi.fn(),
      };

      const result = uploadHandler.validateFile(imageFile, 'image');
      
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('image');
    });

    it('should validate document files correctly', () => {
      const documentFile: FileInput = {
        name: 'test-document.pdf',
        size: 5 * 1024 * 1024, // 5MB
        type: 'application/pdf',
        arrayBuffer: vi.fn(),
      };

      const result = uploadHandler.validateFile(documentFile, 'document');
      
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('document');
    });

    it('should reject oversized image files', () => {
      const oversizedImage: FileInput = {
        name: 'large-image.jpg',
        size: 10 * 1024 * 1024, // 10MB (exceeds 5MB limit)
        type: 'image/jpeg',
        arrayBuffer: vi.fn(),
      };

      const result = uploadHandler.validateFile(oversizedImage, 'image');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should reject oversized document files', () => {
      const oversizedDocument: FileInput = {
        name: 'large-document.pdf',
        size: 60 * 1024 * 1024, // 60MB (exceeds 50MB limit)
        type: 'application/pdf',
        arrayBuffer: vi.fn(),
      };

      const result = uploadHandler.validateFile(oversizedDocument, 'document');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should reject unsupported file types', () => {
      const unsupportedFile: FileInput = {
        name: 'malicious.exe',
        size: 1024,
        type: 'application/x-msdownload',
        arrayBuffer: vi.fn(),
      };

      const result = uploadHandler.validateFile(unsupportedFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });
  });

  describe('Filename Generation', () => {
    it('should generate unique filenames with school prefix', () => {
      const schoolId = 'test-school-123';
      const originalName = 'test-image.jpg';
      const folder = 'images';

      const uniqueKey = uploadHandler.generateUniqueKey(schoolId, originalName, folder);
      
      expect(uniqueKey).toMatch(/^school-test-school-123\/images\/test-image-[a-zA-Z0-9_-]{10}\.jpg$/);
    });

    it('should sanitize unsafe filenames', () => {
      const schoolId = 'test-school-123';
      const unsafeName = 'test file with spaces & symbols!.jpg';
      const folder = 'images';

      const uniqueKey = uploadHandler.generateUniqueKey(schoolId, unsafeName, folder);
      
      // The sanitizeFilename function replaces spaces with underscores but keeps & and !
      expect(uniqueKey).toMatch(/^school-test-school-123\/images\/test_file_with_spaces_&_symbols!-[a-zA-Z0-9_-]{10}\.jpg$/);
    });

    it('should handle files without extensions', () => {
      const schoolId = 'test-school-123';
      const noExtName = 'README';
      const folder = 'documents';

      const uniqueKey = uploadHandler.generateUniqueKey(schoolId, noExtName, folder);
      
      expect(uniqueKey).toMatch(/^school-test-school-123\/documents\/README-[a-zA-Z0-9_-]{10}$/);
    });
  });

  describe('File Upload Operations', () => {
    it('should upload image files successfully', async () => {
      const imageFile: FileInput = {
        name: 'test-image.jpg',
        size: 1024,
        type: 'image/jpeg',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
      };

      const result = await uploadHandler.uploadImage(imageFile);
      
      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
      expect(result.metadata?.schoolId).toBe('test-school-123');
      expect(vi.mocked(r2StorageService.uploadFile)).toHaveBeenCalledWith(
        'test-school-123',
        expect.any(Buffer),
        expect.stringMatching(/test-image-[a-zA-Z0-9_-]{10}\.jpg/),
        expect.objectContaining({
          originalName: 'test-image.jpg',
          mimeType: 'image/jpeg',
          folder: 'images',
          uploadedBy: 'test-user-456',
        })
      );
    });

    it('should upload document files successfully', async () => {
      const documentFile: FileInput = {
        name: 'test-document.pdf',
        size: 2048,
        type: 'application/pdf',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(2048)),
      };

      const result = await uploadHandler.uploadDocument(documentFile);
      
      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
      expect(result.metadata?.schoolId).toBe('test-school-123');
      expect(vi.mocked(r2StorageService.uploadFile)).toHaveBeenCalledWith(
        'test-school-123',
        expect.any(Buffer),
        expect.stringMatching(/test-document-[a-zA-Z0-9_-]{10}\.pdf/),
        expect.objectContaining({
          originalName: 'test-document.pdf',
          mimeType: 'application/pdf',
          folder: 'documents',
          uploadedBy: 'test-user-456',
        })
      );
    });

    it('should handle upload failures gracefully', async () => {
      vi.mocked(r2StorageService.uploadFile).mockResolvedValue({
        success: false,
        error: 'Storage service unavailable',
      });

      const imageFile: FileInput = {
        name: 'test-image.jpg',
        size: 1024,
        type: 'image/jpeg',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
      };

      const result = await uploadHandler.uploadImage(imageFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle authentication failures', async () => {
      vi.mocked(requireSchoolAccess).mockRejectedValue(new Error('Authentication required'));

      const imageFile: FileInput = {
        name: 'test-image.jpg',
        size: 1024,
        type: 'image/jpeg',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
      };

      const result = await uploadHandler.uploadImage(imageFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Utility Methods', () => {
    it('should check supported file types correctly', () => {
      expect(uploadHandler.isSupportedFileType('image/jpeg')).toBe(true);
      expect(uploadHandler.isSupportedFileType('application/pdf')).toBe(true);
      expect(uploadHandler.isSupportedFileType('application/x-msdownload')).toBe(false);
    });

    it('should return correct max file sizes', () => {
      expect(uploadHandler.getMaxFileSize('image')).toBe(5 * 1024 * 1024); // 5MB
      expect(uploadHandler.getMaxFileSize('document')).toBe(50 * 1024 * 1024); // 50MB
    });

    it('should return allowed file types for categories', () => {
      const imageTypes = uploadHandler.getAllowedFileTypes('image');
      const documentTypes = uploadHandler.getAllowedFileTypes('document');
      
      expect(imageTypes).toContain('image/jpeg');
      expect(imageTypes).toContain('image/png');
      expect(documentTypes).toContain('application/pdf');
      expect(documentTypes).toContain('application/msword');
    });
  });
});