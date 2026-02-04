/**
 * File Manager Service Tests
 * 
 * Tests for the FileManager service with school isolation and comprehensive file operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileManager } from '../lib/services/file-manager';
import type { FileMetadata } from '../lib/config/r2-config';

// Mock dependencies
vi.mock('../lib/services/r2-storage-service', () => ({
  r2StorageService: {
    getFileMetadata: vi.fn(),
    deleteFile: vi.fn(),
    generatePresignedUrl: vi.fn(),
    listFiles: vi.fn(),
  },
}));

vi.mock('../lib/auth/tenant', () => ({
  requireSchoolAccess: vi.fn(),
}));

vi.mock('../lib/config/r2-config', () => ({
  generateCdnUrl: vi.fn(),
  generateSchoolKey: vi.fn(),
  extractSchoolIdFromKey: vi.fn(),
}));

// Import mocked modules
import { r2StorageService } from '../lib/services/r2-storage-service';
import { requireSchoolAccess } from '../lib/auth/tenant';
import { generateCdnUrl, generateSchoolKey, extractSchoolIdFromKey } from '../lib/config/r2-config';

describe('FileManager', () => {
  let fileManager: FileManager;

  beforeEach(() => {
    fileManager = new FileManager();
    
    // Setup mocks with default implementations
    vi.mocked(requireSchoolAccess).mockResolvedValue({
      schoolId: 'test-school-123',
      userId: 'test-user-456',
      role: 'admin',
    });
    
    vi.mocked(generateCdnUrl).mockReturnValue('https://cdn.example.com/school-test-school-123/images/test-file.jpg');
    vi.mocked(generateSchoolKey).mockReturnValue('school-test-school-123/images/test-file.jpg');
    vi.mocked(extractSchoolIdFromKey).mockReturnValue('test-school-123');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('File Retrieval', () => {
    it('should retrieve file with CDN URL generation', async () => {
      const mockMetadata: FileMetadata = {
        id: 'test-id',
        schoolId: 'test-school-123',
        originalName: 'test-file.jpg',
        key: 'school-test-school-123/images/test-file.jpg',
        url: 'https://cdn.example.com/school-test-school-123/images/test-file.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        folder: 'images',
        uploadedBy: 'test-user-456',
        uploadedAt: new Date(),
        checksum: 'abc123',
      };

      vi.mocked(r2StorageService.getFileMetadata).mockResolvedValue(mockMetadata);

      const result = await fileManager.retrieveFile(
        'school-test-school-123/images/test-file.jpg',
        { includeMetadata: true }
      );

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://cdn.example.com/school-test-school-123/images/test-file.jpg');
      expect(result.metadata).toEqual(mockMetadata);
      expect(vi.mocked(generateCdnUrl)).toHaveBeenCalledWith('school-test-school-123/images/test-file.jpg');
    });

    it('should generate presigned URL when requested', async () => {
      vi.mocked(r2StorageService.generatePresignedUrl).mockResolvedValue('https://presigned.example.com/test-file.jpg');

      const result = await fileManager.retrieveFile(
        'school-test-school-123/images/test-file.jpg',
        { generatePresignedUrl: true, presignedUrlExpiry: 1800 }
      );

      expect(result.success).toBe(true);
      expect(result.presignedUrl).toBe('https://presigned.example.com/test-file.jpg');
      expect(vi.mocked(r2StorageService.generatePresignedUrl)).toHaveBeenCalledWith(
        'test-school-123',
        'school-test-school-123/images/test-file.jpg',
        'GET',
        1800
      );
    });

    it('should deny access to files from other schools', async () => {
      vi.mocked(extractSchoolIdFromKey).mockReturnValue('other-school-456');

      const result = await fileManager.retrieveFile('school-other-school-456/images/test-file.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied: File does not belong to this school');
    });

    it('should handle file not found gracefully', async () => {
      vi.mocked(r2StorageService.getFileMetadata).mockResolvedValue(null);

      const result = await fileManager.retrieveFile(
        'school-test-school-123/images/nonexistent-file.jpg',
        { includeMetadata: true }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });
  });

  describe('Batch Operations', () => {
    it('should batch delete multiple files successfully', async () => {
      const keys = [
        'school-test-school-123/images/file1.jpg',
        'school-test-school-123/images/file2.jpg',
        'school-test-school-123/documents/file3.pdf',
      ];

      vi.mocked(r2StorageService.deleteFile).mockResolvedValue(undefined);

      const result = await fileManager.batchDeleteFiles(keys);

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.errorCount).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.results.every(r => r.success)).toBe(true);
    });

    it('should handle partial failures in batch delete', async () => {
      const keys = [
        'school-test-school-123/images/file1.jpg',
        'school-other-school-456/images/file2.jpg', // Different school
        'school-test-school-123/documents/file3.pdf',
      ];

      vi.mocked(extractSchoolIdFromKey)
        .mockReturnValueOnce('test-school-123')
        .mockReturnValueOnce('other-school-456')
        .mockReturnValueOnce('test-school-123');

      vi.mocked(r2StorageService.deleteFile).mockResolvedValue(undefined);

      const result = await fileManager.batchDeleteFiles(keys);

      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(3);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(1);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error).toBe('Access denied: File does not belong to this school');
    });

    it('should batch retrieve multiple files successfully', async () => {
      const keys = [
        'school-test-school-123/images/file1.jpg',
        'school-test-school-123/images/file2.jpg',
      ];

      const mockMetadata: FileMetadata = {
        id: 'test-id',
        schoolId: 'test-school-123',
        originalName: 'test-file.jpg',
        key: 'school-test-school-123/images/test-file.jpg',
        url: 'https://cdn.example.com/school-test-school-123/images/test-file.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        folder: 'images',
        uploadedBy: 'test-user-456',
        uploadedAt: new Date(),
        checksum: 'abc123',
      };

      vi.mocked(r2StorageService.getFileMetadata).mockResolvedValue(mockMetadata);

      const result = await fileManager.batchRetrieveFiles(keys, { includeMetadata: true });

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.files).toHaveLength(2);
      expect(result.files.every(f => f.success)).toBe(true);
    });
  });

  describe('File Existence Checking', () => {
    it('should check file existence and return metadata', async () => {
      const mockMetadata: FileMetadata = {
        id: 'test-id',
        schoolId: 'test-school-123',
        originalName: 'test-file.jpg',
        key: 'school-test-school-123/images/test-file.jpg',
        url: 'https://cdn.example.com/school-test-school-123/images/test-file.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        folder: 'images',
        uploadedBy: 'test-user-456',
        uploadedAt: new Date(),
        checksum: 'abc123',
      };

      vi.mocked(r2StorageService.getFileMetadata).mockResolvedValue(mockMetadata);

      const result = await fileManager.checkFileExists('school-test-school-123/images/test-file.jpg');

      expect(result.exists).toBe(true);
      expect(result.metadata).toEqual(mockMetadata);
      expect(result.lastChecked).toBeInstanceOf(Date);
    });

    it('should return false for non-existent files', async () => {
      vi.mocked(r2StorageService.getFileMetadata).mockResolvedValue(null);

      const result = await fileManager.checkFileExists('school-test-school-123/images/nonexistent-file.jpg');

      expect(result.exists).toBe(false);
      expect(result.metadata).toBeUndefined();
      expect(result.lastChecked).toBeInstanceOf(Date);
    });

    it('should deny access to files from other schools', async () => {
      vi.mocked(extractSchoolIdFromKey).mockReturnValue('other-school-456');

      const result = await fileManager.checkFileExists('school-other-school-456/images/test-file.jpg');

      expect(result.exists).toBe(false);
      expect(result.metadata).toBeUndefined();
    });
  });

  describe('Folder Organization', () => {
    it('should get folder organization with file statistics', async () => {
      const mockFileList = {
        files: [
          {
            key: 'school-test-school-123/images/file1.jpg',
            size: 1024,
            lastModified: new Date('2024-01-01'),
            etag: 'abc123',
          },
          {
            key: 'school-test-school-123/images/file2.jpg',
            size: 2048,
            lastModified: new Date('2024-01-02'),
            etag: 'def456',
          },
        ],
        isTruncated: false,
      };

      vi.mocked(r2StorageService.listFiles).mockResolvedValue(mockFileList);

      const result = await fileManager.getFolderOrganization('images');

      expect(result.folder).toBe('images');
      expect(result.fileCount).toBe(2);
      expect(result.totalSize).toBe(3072); // 1024 + 2048
      expect(result.lastModified).toEqual(new Date('2024-01-02'));
      expect(result.files).toHaveLength(2);
      expect(result.files[0].name).toBe('file1.jpg');
      expect(result.files[1].name).toBe('file2.jpg');
    });

    it('should handle empty folders gracefully', async () => {
      const mockFileList = {
        files: [],
        isTruncated: false,
      };

      vi.mocked(r2StorageService.listFiles).mockResolvedValue(mockFileList);

      const result = await fileManager.getFolderOrganization('empty-folder');

      expect(result.folder).toBe('empty-folder');
      expect(result.fileCount).toBe(0);
      expect(result.totalSize).toBe(0);
      expect(result.files).toHaveLength(0);
    });
  });

  describe('File Metadata Operations', () => {
    it('should get file metadata with school validation', async () => {
      const mockMetadata: FileMetadata = {
        id: 'test-id',
        schoolId: 'test-school-123',
        originalName: 'test-file.jpg',
        key: 'school-test-school-123/images/test-file.jpg',
        url: 'https://cdn.example.com/school-test-school-123/images/test-file.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        folder: 'images',
        uploadedBy: 'test-user-456',
        uploadedAt: new Date(),
        checksum: 'abc123',
      };

      vi.mocked(r2StorageService.getFileMetadata).mockResolvedValue(mockMetadata);

      const result = await fileManager.getFileMetadata('school-test-school-123/images/test-file.jpg');

      expect(result).toEqual(mockMetadata);
      expect(vi.mocked(r2StorageService.getFileMetadata)).toHaveBeenCalledWith(
        'test-school-123',
        'school-test-school-123/images/test-file.jpg'
      );
    });

    it('should return null for files from other schools', async () => {
      vi.mocked(extractSchoolIdFromKey).mockReturnValue('other-school-456');

      const result = await fileManager.getFileMetadata('school-other-school-456/images/test-file.jpg');

      expect(result).toBeNull();
    });
  });

  describe('School File Listing', () => {
    it('should list all files in school with metadata', async () => {
      const mockFileList = {
        files: [
          {
            key: 'school-test-school-123/images/file1.jpg',
            size: 1024,
            lastModified: new Date('2024-01-01'),
            etag: 'abc123',
          },
        ],
        isTruncated: false,
      };

      const mockMetadata: FileMetadata = {
        id: 'test-id',
        schoolId: 'test-school-123',
        originalName: 'file1.jpg',
        key: 'school-test-school-123/images/file1.jpg',
        url: 'https://cdn.example.com/school-test-school-123/images/file1.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        folder: 'images',
        uploadedBy: 'test-user-456',
        uploadedAt: new Date(),
        checksum: 'abc123',
      };

      vi.mocked(r2StorageService.listFiles).mockResolvedValue(mockFileList);
      vi.mocked(r2StorageService.getFileMetadata).mockResolvedValue(mockMetadata);

      const result = await fileManager.listSchoolFiles('images');

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0]).toEqual(mockMetadata);
      expect(result.isTruncated).toBe(false);
    });

    it('should handle pagination correctly', async () => {
      const mockFileList = {
        files: [],
        isTruncated: true,
        nextContinuationToken: 'next-token-123',
      };

      vi.mocked(r2StorageService.listFiles).mockResolvedValue(mockFileList);

      const result = await fileManager.listSchoolFiles('images', 100, 'current-token');

      expect(result.success).toBe(true);
      expect(result.isTruncated).toBe(true);
      expect(result.nextContinuationToken).toBe('next-token-123');
      expect(vi.mocked(r2StorageService.listFiles)).toHaveBeenCalledWith(
        'test-school-123',
        'images',
        100,
        'current-token'
      );
    });
  });

  describe('Storage Statistics', () => {
    it('should calculate storage statistics for school', async () => {
      const mockFileList = {
        files: [
          {
            key: 'school-test-school-123/images/file1.jpg',
            size: 1024,
            lastModified: new Date('2024-01-01'),
            etag: 'abc123',
          },
          {
            key: 'school-test-school-123/documents/file2.pdf',
            size: 2048,
            lastModified: new Date('2024-01-02'),
            etag: 'def456',
          },
          {
            key: 'school-test-school-123/images/file3.jpg',
            size: 512,
            lastModified: new Date('2024-01-03'),
            etag: 'ghi789',
          },
        ],
        isTruncated: false,
      };

      vi.mocked(r2StorageService.listFiles).mockResolvedValue(mockFileList);

      const result = await fileManager.getSchoolStorageStats();

      expect(result.success).toBe(true);
      expect(result.totalFiles).toBe(3);
      expect(result.totalSize).toBe(3584); // 1024 + 2048 + 512
      expect(result.folderBreakdown).toEqual({
        images: { files: 2, size: 1536 }, // 1024 + 512
        documents: { files: 1, size: 2048 },
      });
    });

    it('should handle empty storage gracefully', async () => {
      const mockFileList = {
        files: [],
        isTruncated: false,
      };

      vi.mocked(r2StorageService.listFiles).mockResolvedValue(mockFileList);

      const result = await fileManager.getSchoolStorageStats();

      expect(result.success).toBe(true);
      expect(result.totalFiles).toBe(0);
      expect(result.totalSize).toBe(0);
      expect(result.folderBreakdown).toEqual({});
    });
  });

  describe('Key Generation', () => {
    it('should generate school-scoped key', async () => {
      vi.mocked(generateSchoolKey).mockReturnValue('school-test-school-123/images/test-file.jpg');

      const result = await fileManager.generateSchoolScopedKey('images', 'test-file.jpg');

      expect(result).toBe('school-test-school-123/images/test-file.jpg');
      expect(vi.mocked(generateSchoolKey)).toHaveBeenCalledWith(
        'test-school-123',
        'images',
        'test-file.jpg'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle R2 service errors gracefully', async () => {
      vi.mocked(r2StorageService.getFileMetadata).mockRejectedValue(new Error('R2 service unavailable'));

      const result = await fileManager.retrieveFile(
        'school-test-school-123/images/test-file.jpg',
        { includeMetadata: true }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('R2 service unavailable');
    });

    it('should handle authentication errors gracefully', async () => {
      vi.mocked(requireSchoolAccess).mockRejectedValue(new Error('Authentication required'));

      const result = await fileManager.retrieveFile('school-test-school-123/images/test-file.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
    });
  });
});