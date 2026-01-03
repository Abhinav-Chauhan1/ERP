/**
 * Unit tests for syllabus document management actions
 * 
 * These tests verify the validation and error handling of document CRUD operations.
 * Note: These are validation-focused tests. Full integration tests with database
 * should be run separately in a test environment.
 */

import { describe, it, expect } from 'vitest';
import {
  validateFileType,
  uploadDocument,
  bulkUploadDocuments,
  updateDocumentMetadata,
  deleteDocument,
  reorderDocuments,
  getDocumentsByParent,
} from '../syllabusDocumentActions';
import { MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from '@/lib/schemaValidation/syllabusDocumentSchemaValidations';

describe('Syllabus Document Management Actions - Validation', () => {

  describe('validateFileType', () => {
    it('should accept valid PDF file type', () => {
      const result = validateFileType({
        fileType: SUPPORTED_FILE_TYPES.PDF,
        fileSize: 1024 * 1024, // 1MB
      });

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(true);
    });

    it('should accept valid image file type', () => {
      const result = validateFileType({
        fileType: SUPPORTED_FILE_TYPES.PNG,
        fileSize: 1024 * 1024, // 1MB
      });

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(true);
    });

    it('should accept valid video file type', () => {
      const result = validateFileType({
        fileType: SUPPORTED_FILE_TYPES.MP4,
        fileSize: 10 * 1024 * 1024, // 10MB
      });

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(true);
    });

    it('should reject unsupported file type', () => {
      const result = validateFileType({
        fileType: 'application/zip',
        fileSize: 1024 * 1024,
      });

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.message).toContain('not supported');
    });

    it('should reject file exceeding size limit', () => {
      const result = validateFileType({
        fileType: SUPPORTED_FILE_TYPES.PDF,
        fileSize: MAX_FILE_SIZE + 1, // Exceeds 50MB
      });

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.message).toContain('exceeds maximum limit');
    });

    it('should fail with invalid input - negative file size', () => {
      const result = validateFileType({
        fileType: SUPPORTED_FILE_TYPES.PDF,
        fileSize: -1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('positive');
    });
  });

  describe('uploadDocument', () => {
    it('should fail with invalid input - missing filename', async () => {
      const result = await uploadDocument({
        filename: '',
        fileUrl: 'https://example.com/file.pdf',
        fileType: SUPPORTED_FILE_TYPES.PDF,
        fileSize: 1024,
        moduleId: 'test-module-id',
        uploadedBy: 'user-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Filename is required');
    });

    it('should fail with invalid input - invalid file URL', async () => {
      const result = await uploadDocument({
        filename: 'test.pdf',
        fileUrl: 'not-a-url',
        fileType: SUPPORTED_FILE_TYPES.PDF,
        fileSize: 1024,
        moduleId: 'test-module-id',
        uploadedBy: 'user-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid file URL');
    });

    it('should fail with invalid input - unsupported file type', async () => {
      const result = await uploadDocument({
        filename: 'test.zip',
        fileUrl: 'https://example.com/file.zip',
        fileType: 'application/zip',
        fileSize: 1024,
        moduleId: 'test-module-id',
        uploadedBy: 'user-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('should fail with invalid input - file size exceeds limit', async () => {
      const result = await uploadDocument({
        filename: 'test.pdf',
        fileUrl: 'https://example.com/file.pdf',
        fileType: SUPPORTED_FILE_TYPES.PDF,
        fileSize: MAX_FILE_SIZE + 1,
        moduleId: 'test-module-id',
        uploadedBy: 'user-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds maximum limit');
    });

    it('should fail with invalid input - neither moduleId nor subModuleId provided', async () => {
      const result = await uploadDocument({
        filename: 'test.pdf',
        fileUrl: 'https://example.com/file.pdf',
        fileType: SUPPORTED_FILE_TYPES.PDF,
        fileSize: 1024,
        uploadedBy: 'user-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Either moduleId or subModuleId must be provided');
    });

    it('should fail when module does not exist', async () => {
      const result = await uploadDocument({
        filename: 'test.pdf',
        fileUrl: 'https://example.com/file.pdf',
        fileType: SUPPORTED_FILE_TYPES.PDF,
        fileSize: 1024,
        moduleId: 'non-existent-module-id',
        uploadedBy: 'user-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Module not found');
    });

    it('should fail when sub-module does not exist', async () => {
      const result = await uploadDocument({
        filename: 'test.pdf',
        fileUrl: 'https://example.com/file.pdf',
        fileType: SUPPORTED_FILE_TYPES.PDF,
        fileSize: 1024,
        subModuleId: 'non-existent-submodule-id',
        uploadedBy: 'user-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sub-module not found');
    });
  });

  describe('bulkUploadDocuments', () => {
    it('should fail with invalid input - empty documents array', async () => {
      const result = await bulkUploadDocuments({
        documents: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one document is required');
    });

    it('should fail with invalid input - invalid document in array', async () => {
      const result = await bulkUploadDocuments({
        documents: [
          {
            filename: '', // Invalid
            fileUrl: 'https://example.com/file.pdf',
            fileType: SUPPORTED_FILE_TYPES.PDF,
            fileSize: 1024,
            moduleId: 'test-module-id',
            uploadedBy: 'user-id',
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Filename is required');
    });
  });

  describe('updateDocumentMetadata', () => {
    it('should fail with invalid input - missing id', async () => {
      const result = await updateDocumentMetadata({
        id: '',
        title: 'Updated Title',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Document ID is required');
    });

    it('should fail with invalid input - missing title', async () => {
      const result = await updateDocumentMetadata({
        id: 'doc-id',
        title: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Title is required');
    });

    it('should fail when document does not exist', async () => {
      const result = await updateDocumentMetadata({
        id: 'non-existent-id',
        title: 'Updated Title',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Document not found');
    });
  });

  describe('deleteDocument', () => {
    it('should fail with missing id', async () => {
      const result = await deleteDocument('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Document ID is required');
    });

    it('should fail when document does not exist', async () => {
      const result = await deleteDocument('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Document not found');
    });
  });

  describe('reorderDocuments', () => {
    it('should fail with invalid input - missing parentId', async () => {
      const result = await reorderDocuments({
        parentId: '',
        parentType: 'module',
        documentOrders: [
          { id: 'doc-1', order: 0 },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Parent ID is required');
    });

    it('should fail with invalid input - invalid parentType', async () => {
      const result = await reorderDocuments({
        parentId: 'parent-id',
        parentType: 'invalid' as any,
        documentOrders: [
          { id: 'doc-1', order: 0 },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Parent type must be either');
    });

    it('should fail with invalid input - empty documentOrders', async () => {
      const result = await reorderDocuments({
        parentId: 'parent-id',
        parentType: 'module',
        documentOrders: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one document order is required');
    });

    it('should fail with invalid input - negative order', async () => {
      const result = await reorderDocuments({
        parentId: 'parent-id',
        parentType: 'module',
        documentOrders: [
          { id: 'doc-1', order: -1 },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-negative');
    });
  });

  describe('getDocumentsByParent', () => {
    it('should fail with missing parent ID for module', async () => {
      const result = await getDocumentsByParent('', 'module');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Module ID is required');
    });

    it('should fail with missing parent ID for sub-module', async () => {
      const result = await getDocumentsByParent('', 'subModule');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sub-module ID is required');
    });
  });
});
