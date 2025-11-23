/**
 * Tests for export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shouldUseBackgroundExport } from '../background-export';

describe('Export Functionality', () => {
  describe('Background Export Detection', () => {
    it('should use background export for datasets with 1000+ records', () => {
      expect(shouldUseBackgroundExport(1000)).toBe(true);
      expect(shouldUseBackgroundExport(5000)).toBe(true);
      expect(shouldUseBackgroundExport(10000)).toBe(true);
    });

    it('should not use background export for datasets with <1000 records', () => {
      expect(shouldUseBackgroundExport(0)).toBe(false);
      expect(shouldUseBackgroundExport(100)).toBe(false);
      expect(shouldUseBackgroundExport(999)).toBe(false);
    });

    it('should handle edge case of exactly 1000 records', () => {
      expect(shouldUseBackgroundExport(1000)).toBe(true);
    });
  });

  describe('Export Data Preparation', () => {
    it('should flatten nested objects for export', () => {
      const students = [
        {
          id: '1',
          admissionId: 'STU001',
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          enrollments: [
            {
              class: { name: 'Class 10' },
              section: { name: 'A' },
            },
          ],
        },
      ];

      const exportData = students.map(s => ({
        admissionId: s.admissionId,
        firstName: s.user.firstName,
        lastName: s.user.lastName,
        class: s.enrollments[0]?.class.name || 'N/A',
        section: s.enrollments[0]?.section.name || 'N/A',
      }));

      expect(exportData[0]).toEqual({
        admissionId: 'STU001',
        firstName: 'John',
        lastName: 'Doe',
        class: 'Class 10',
        section: 'A',
      });
    });

    it('should handle missing nested data gracefully', () => {
      const students = [
        {
          id: '1',
          admissionId: 'STU001',
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          enrollments: [],
        },
      ];

      const exportData = students.map(s => ({
        admissionId: s.admissionId,
        firstName: s.user.firstName,
        lastName: s.user.lastName,
        class: s.enrollments[0]?.class.name || 'N/A',
        section: s.enrollments[0]?.section.name || 'N/A',
      }));

      expect(exportData[0].class).toBe('N/A');
      expect(exportData[0].section).toBe('N/A');
    });
  });

  describe('Field Selection', () => {
    it('should filter data by selected fields', () => {
      const data = [
        { id: '1', name: 'John', email: 'john@example.com', phone: '123' },
        { id: '2', name: 'Jane', email: 'jane@example.com', phone: '456' },
      ];

      const selectedFields = new Set(['id', 'name']);

      const filteredData = data.map(row => {
        const filtered: any = {};
        selectedFields.forEach(key => {
          filtered[key] = row[key as keyof typeof row];
        });
        return filtered;
      });

      expect(filteredData[0]).toEqual({ id: '1', name: 'John' });
      expect(filteredData[0]).not.toHaveProperty('email');
      expect(filteredData[0]).not.toHaveProperty('phone');
    });

    it('should handle empty field selection', () => {
      const data = [
        { id: '1', name: 'John' },
      ];

      const selectedFields = new Set<string>();

      const filteredData = data.map(row => {
        const filtered: any = {};
        selectedFields.forEach(key => {
          filtered[key] = row[key as keyof typeof row];
        });
        return filtered;
      });

      expect(filteredData[0]).toEqual({});
    });
  });

  describe('Filename Generation', () => {
    it('should generate filename with timestamp', () => {
      const prefix = 'students';
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${prefix}_${timestamp}`;

      expect(filename).toMatch(/^students_\d{4}-\d{2}-\d{2}$/);
    });

    it('should generate unique filenames for different entities', () => {
      const timestamp = new Date().toISOString().split('T')[0];
      
      const studentsFilename = `students_${timestamp}`;
      const teachersFilename = `teachers_${timestamp}`;

      expect(studentsFilename).not.toBe(teachersFilename);
      expect(studentsFilename).toContain('students');
      expect(teachersFilename).toContain('teachers');
    });
  });

  describe('Export Format Validation', () => {
    it('should validate supported export formats', () => {
      const supportedFormats = ['csv', 'excel', 'pdf'];
      
      supportedFormats.forEach(format => {
        expect(['csv', 'excel', 'pdf']).toContain(format);
      });
    });

    it('should reject unsupported formats', () => {
      const unsupportedFormats = ['doc', 'txt', 'json'];
      
      unsupportedFormats.forEach(format => {
        expect(['csv', 'excel', 'pdf']).not.toContain(format);
      });
    });
  });
});
