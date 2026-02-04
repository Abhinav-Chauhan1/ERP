/**
 * R2 Setup Validation Tests
 * 
 * These tests validate the R2 storage infrastructure setup:
 * - Configuration validation
 * - Environment variable checks
 * - Basic service initialization
 * - File validation utilities
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { 
  validateFile, 
  validateSchoolId, 
  validateFolderName, 
  validateFilename, 
  sanitizeFilename,
  validateR2Environment,
  generateValidationReport
} from '../lib/utils/r2-validation';
import { getR2Config, generateSchoolKey, extractSchoolIdFromKey } from '../lib/config/r2-config';

describe('R2 Configuration Validation', () => {
  describe('Environment Variables', () => {
    it('should validate R2 environment variables', () => {
      const validation = validateR2Environment();
      
      // In test environment, we expect missing variables
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('missingVars');
      expect(validation).toHaveProperty('warnings');
      expect(Array.isArray(validation.missingVars)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });

    it('should generate validation report', () => {
      const report = generateValidationReport();
      
      expect(report).toHaveProperty('environment');
      expect(report).toHaveProperty('recommendations');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('File Validation', () => {
    it('should validate image files correctly', () => {
      const validImage = {
        name: 'test-image.jpg',
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg'
      };

      const result = validateFile(validImage, 'image');
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('image');
    });

    it('should validate document files correctly', () => {
      const validDocument = {
        name: 'test-document.pdf',
        size: 10 * 1024 * 1024, // 10MB
        type: 'application/pdf'
      };

      const result = validateFile(validDocument, 'document');
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('document');
    });

    it('should reject oversized image files', () => {
      const oversizedImage = {
        name: 'large-image.jpg',
        size: 10 * 1024 * 1024, // 10MB (exceeds 5MB limit)
        type: 'image/jpeg'
      };

      const result = validateFile(oversizedImage, 'image');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds');
      expect(result.error).toContain('5MB');
    });

    it('should reject oversized document files', () => {
      const oversizedDocument = {
        name: 'large-document.pdf',
        size: 60 * 1024 * 1024, // 60MB (exceeds 50MB limit)
        type: 'application/pdf'
      };

      const result = validateFile(oversizedDocument, 'document');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds');
      expect(result.error).toContain('50MB');
    });

    it('should reject unsupported file types', () => {
      const unsupportedFile = {
        name: 'test-file.exe',
        size: 1024,
        type: 'application/x-executable'
      };

      const result = validateFile(unsupportedFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('should auto-detect file types', () => {
      const imageFile = {
        name: 'auto-detect.png',
        size: 1024,
        type: 'image/png'
      };

      const result = validateFile(imageFile);
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('image');
    });
  });

  describe('School ID Validation', () => {
    it('should validate correct school IDs', () => {
      expect(validateSchoolId('school-123')).toBe(true);
      expect(validateSchoolId('test-school')).toBe(true);
      expect(validateSchoolId('123')).toBe(true);
      expect(validateSchoolId('abc-def-123')).toBe(true);
    });

    it('should reject invalid school IDs', () => {
      expect(validateSchoolId('')).toBe(false);
      expect(validateSchoolId('school/123')).toBe(false);
      expect(validateSchoolId('school 123')).toBe(false);
      expect(validateSchoolId('school@123')).toBe(false);
    });
  });

  describe('Folder Name Validation', () => {
    it('should validate correct folder names', () => {
      expect(validateFolderName('students')).toBe(true);
      expect(validateFolderName('teacher-documents')).toBe(true);
      expect(validateFolderName('event_photos')).toBe(true);
      expect(validateFolderName('123')).toBe(true);
    });

    it('should reject invalid folder names', () => {
      expect(validateFolderName('')).toBe(false);
      expect(validateFolderName('folder/name')).toBe(false);
      expect(validateFolderName('folder name')).toBe(false);
      expect(validateFolderName('folder@name')).toBe(false);
    });
  });

  describe('Filename Validation and Sanitization', () => {
    it('should validate safe filenames', () => {
      expect(validateFilename('document.pdf')).toBe(true);
      expect(validateFilename('image-123.jpg')).toBe(true);
      expect(validateFilename('file_name.txt')).toBe(true);
    });

    it('should reject unsafe filenames', () => {
      expect(validateFilename('')).toBe(false);
      expect(validateFilename('file/name.txt')).toBe(false);
      expect(validateFilename('file\\name.txt')).toBe(false);
      expect(validateFilename('file:name.txt')).toBe(false);
      expect(validateFilename('file<name>.txt')).toBe(false);
    });

    it('should sanitize filenames correctly', () => {
      expect(sanitizeFilename('file name.txt')).toBe('file_name.txt');
      expect(sanitizeFilename('file/name\\test.pdf')).toBe('file_name_test.pdf');
      expect(sanitizeFilename('file:with<bad>chars.jpg')).toBe('file_with_bad_chars.jpg');
      expect(sanitizeFilename('  multiple   spaces  .txt')).toBe('multiple_spaces.txt');
    });

    it('should handle long filenames', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
    });
  });

  describe('School Key Management', () => {
    it('should generate correct school keys', () => {
      const key = generateSchoolKey('123', 'students', 'avatar.jpg');
      expect(key).toBe('school-123/students/avatar.jpg');
    });

    it('should extract school ID from keys', () => {
      const schoolId = extractSchoolIdFromKey('school-123/students/avatar.jpg');
      expect(schoolId).toBe('123');
    });

    it('should return null for invalid keys', () => {
      const schoolId = extractSchoolIdFromKey('invalid-key-format');
      expect(schoolId).toBeNull();
    });
  });
});

describe('R2 Configuration Loading', () => {
  it('should handle missing environment variables gracefully', () => {
    // In test environment, R2 config will likely fail due to missing env vars
    // This test ensures the error handling works correctly
    expect(() => {
      try {
        getR2Config();
      } catch (error) {
        // Expected to fail in test environment
        expect(error).toBeDefined();
        throw error;
      }
    }).toThrow();
  });
});

describe('School-Based Folder Structure', () => {
  it('should create proper folder hierarchy', () => {
    const testCases = [
      { schoolId: '123', folder: 'students', file: 'avatar.jpg', expected: 'school-123/students/avatar.jpg' },
      { schoolId: '456', folder: 'teachers', file: 'profile.png', expected: 'school-456/teachers/profile.png' },
      { schoolId: '789', folder: 'events', file: 'banner.webp', expected: 'school-789/events/banner.webp' },
    ];

    testCases.forEach(({ schoolId, folder, file, expected }) => {
      const key = generateSchoolKey(schoolId, folder, file);
      expect(key).toBe(expected);
    });
  });

  it('should maintain school isolation in keys', () => {
    const school1Key = generateSchoolKey('school1', 'documents', 'file.pdf');
    const school2Key = generateSchoolKey('school2', 'documents', 'file.pdf');
    
    expect(school1Key).not.toBe(school2Key);
    expect(school1Key).toContain('school-school1');
    expect(school2Key).toContain('school-school2');
  });
});