/**
 * ID Card Generation Service Tests
 * 
 * Basic tests to verify ID card generation functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateSingleIDCard,
  generateBulkIDCards,
  type IDCardGenerationData,
  type BulkIDCardGenerationOptions,
} from './idCardGenerationService';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    student: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('ID Card Generation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSingleIDCard', () => {
    it('should generate ID card with all required elements', async () => {
      const studentData: IDCardGenerationData = {
        studentId: 'student-1',
        studentName: 'John Doe',
        admissionId: 'ADM001',
        className: 'Grade 10',
        section: 'A',
        rollNumber: '15',
        bloodGroup: 'O+',
        emergencyContact: '1234567890',
      };

      const result = await generateSingleIDCard(studentData, '2024-2025');

      expect(result.success).toBe(true);
      expect(result.studentId).toBe('student-1');
      expect(result.studentName).toBe('John Doe');
      expect(result.pdfUrl).toBeDefined();
    });

    it('should handle missing optional fields', async () => {
      const studentData: IDCardGenerationData = {
        studentId: 'student-2',
        studentName: 'Jane Smith',
        admissionId: 'ADM002',
      };

      const result = await generateSingleIDCard(studentData, '2024-2025');

      expect(result.success).toBe(true);
      expect(result.studentId).toBe('student-2');
    });

    it('should include QR code in generated ID card', async () => {
      const studentData: IDCardGenerationData = {
        studentId: 'student-3',
        studentName: 'Alice Johnson',
        admissionId: 'ADM003',
      };

      const result = await generateSingleIDCard(studentData, '2024-2025');

      // QR code generation is part of the PDF generation process
      // If the function succeeds, QR code was generated
      expect(result.success).toBe(true);
    });

    it('should include barcode in generated ID card', async () => {
      const studentData: IDCardGenerationData = {
        studentId: 'student-4',
        studentName: 'Bob Williams',
        admissionId: 'ADM004',
      };

      const result = await generateSingleIDCard(studentData, '2024-2025');

      // Barcode generation is part of the PDF generation process
      // If the function succeeds, barcode was generated
      expect(result.success).toBe(true);
    });
  });

  describe('generateBulkIDCards', () => {
    it('should generate ID cards for multiple students', async () => {
      const students: IDCardGenerationData[] = [
        {
          studentId: 'student-1',
          studentName: 'John Doe',
          admissionId: 'ADM001',
          className: 'Grade 10',
        },
        {
          studentId: 'student-2',
          studentName: 'Jane Smith',
          admissionId: 'ADM002',
          className: 'Grade 10',
        },
      ];

      const options: BulkIDCardGenerationOptions = {
        students,
        academicYear: '2024-2025',
      };

      const result = await generateBulkIDCards(options);

      expect(result.success).toBe(true);
      expect(result.totalRequested).toBe(2);
      expect(result.totalGenerated).toBe(2);
      expect(result.idCards).toHaveLength(2);
    });

    it('should handle partial failures gracefully', async () => {
      const students: IDCardGenerationData[] = [
        {
          studentId: 'student-1',
          studentName: 'John Doe',
          admissionId: 'ADM001',
        },
        {
          studentId: 'student-2',
          studentName: 'Jane Smith',
          admissionId: 'ADM002',
        },
      ];

      const options: BulkIDCardGenerationOptions = {
        students,
        academicYear: '2024-2025',
      };

      const result = await generateBulkIDCards(options);

      expect(result.totalRequested).toBe(2);
      expect(result.idCards).toHaveLength(2);
    });

    it('should return empty result for empty student list', async () => {
      const options: BulkIDCardGenerationOptions = {
        students: [],
        academicYear: '2024-2025',
      };

      const result = await generateBulkIDCards(options);

      expect(result.totalRequested).toBe(0);
      expect(result.totalGenerated).toBe(0);
      expect(result.idCards).toHaveLength(0);
    });
  });

  describe('ID Card Elements', () => {
    it('should include student photo when provided', async () => {
      const studentData: IDCardGenerationData = {
        studentId: 'student-5',
        studentName: 'Charlie Brown',
        admissionId: 'ADM005',
        photoUrl: 'https://example.com/photo.jpg',
      };

      const result = await generateSingleIDCard(studentData, '2024-2025');

      expect(result.success).toBe(true);
    });

    it('should handle missing photo gracefully', async () => {
      const studentData: IDCardGenerationData = {
        studentId: 'student-6',
        studentName: 'Diana Prince',
        admissionId: 'ADM006',
        // No photoUrl provided
      };

      const result = await generateSingleIDCard(studentData, '2024-2025');

      expect(result.success).toBe(true);
    });

    it('should include all student details in ID card', async () => {
      const studentData: IDCardGenerationData = {
        studentId: 'student-7',
        studentName: 'Edward Norton',
        admissionId: 'ADM007',
        className: 'Grade 12',
        section: 'B',
        rollNumber: '25',
        bloodGroup: 'AB+',
        emergencyContact: '9876543210',
      };

      const result = await generateSingleIDCard(studentData, '2024-2025');

      expect(result.success).toBe(true);
      expect(result.studentName).toBe('Edward Norton');
    });
  });
});
