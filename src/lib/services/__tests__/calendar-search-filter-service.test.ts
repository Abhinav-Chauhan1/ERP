/**
 * Calendar Search and Filter Service Tests
 * 
 * Tests for search and filtering functionality
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect } from 'vitest';
import {
  validateFilters,
  type CalendarEventFilters
} from '../calendar-search-filter-service';

describe('Calendar Search and Filter Service', () => {
  describe('validateFilters', () => {
    it('should validate correct filters', () => {
      const filters: CalendarEventFilters = {
        searchTerm: 'test',
        categoryIds: ['cat1', 'cat2'],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        skip: 0,
        take: 50
      };

      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject end date before start date', () => {
      const filters: CalendarEventFilters = {
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01')
      };

      const result = validateFilters(filters);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('End date must be after start date');
    });

    it('should reject negative skip value', () => {
      const filters: CalendarEventFilters = {
        skip: -10
      };

      const result = validateFilters(filters);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Skip value must be non-negative');
    });

    it('should reject zero or negative take value', () => {
      const filters: CalendarEventFilters = {
        take: 0
      };

      const result = validateFilters(filters);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Take value must be positive');
    });

    it('should reject non-array category IDs', () => {
      const filters: any = {
        categoryIds: 'not-an-array'
      };

      const result = validateFilters(filters);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Category IDs must be an array');
    });

    it('should accumulate multiple errors', () => {
      const filters: CalendarEventFilters = {
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01'),
        skip: -5,
        take: -10
      };

      const result = validateFilters(filters);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Filter Logic', () => {
    it('should handle empty filters', () => {
      const filters: CalendarEventFilters = {};
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle only search term', () => {
      const filters: CalendarEventFilters = {
        searchTerm: 'exam'
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle only category filter', () => {
      const filters: CalendarEventFilters = {
        categoryIds: ['cat1', 'cat2']
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle only date range filter', () => {
      const filters: CalendarEventFilters = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle partial date range (start only)', () => {
      const filters: CalendarEventFilters = {
        startDate: new Date('2025-01-01')
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle partial date range (end only)', () => {
      const filters: CalendarEventFilters = {
        endDate: new Date('2025-12-31')
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });
  });

  describe('Search Term Handling', () => {
    it('should trim search terms', () => {
      const filters: CalendarEventFilters = {
        searchTerm: '  exam  '
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle empty search term', () => {
      const filters: CalendarEventFilters = {
        searchTerm: ''
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle whitespace-only search term', () => {
      const filters: CalendarEventFilters = {
        searchTerm: '   '
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });
  });

  describe('Pagination Validation', () => {
    it('should accept valid pagination values', () => {
      const filters: CalendarEventFilters = {
        skip: 0,
        take: 100
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should accept large skip values', () => {
      const filters: CalendarEventFilters = {
        skip: 1000,
        take: 50
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should accept large take values', () => {
      const filters: CalendarEventFilters = {
        skip: 0,
        take: 1000
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });
  });

  describe('Visibility Filters', () => {
    it('should handle role visibility filters', () => {
      const filters: CalendarEventFilters = {
        visibleToRoles: ['ADMIN', 'TEACHER']
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle class visibility filters', () => {
      const filters: CalendarEventFilters = {
        visibleToClasses: ['class1', 'class2']
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle section visibility filters', () => {
      const filters: CalendarEventFilters = {
        visibleToSections: ['section1', 'section2']
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle combined visibility filters', () => {
      const filters: CalendarEventFilters = {
        visibleToRoles: ['STUDENT'],
        visibleToClasses: ['class1'],
        visibleToSections: ['section1']
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });
  });

  describe('Combined Filters', () => {
    it('should validate all filters together', () => {
      const filters: CalendarEventFilters = {
        searchTerm: 'math exam',
        categoryIds: ['cat_exam'],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        visibleToRoles: ['STUDENT'],
        visibleToClasses: ['class_10a'],
        skip: 0,
        take: 50
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid combined filters', () => {
      const filters: CalendarEventFilters = {
        searchTerm: 'test',
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01'),
        skip: -10
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle same start and end date', () => {
      const sameDate = new Date('2025-06-15');
      const filters: CalendarEventFilters = {
        startDate: sameDate,
        endDate: sameDate
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle empty category array', () => {
      const filters: CalendarEventFilters = {
        categoryIds: []
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle empty visibility arrays', () => {
      const filters: CalendarEventFilters = {
        visibleToRoles: [],
        visibleToClasses: [],
        visibleToSections: []
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle undefined optional fields', () => {
      const filters: CalendarEventFilters = {
        searchTerm: undefined,
        categoryIds: undefined,
        startDate: undefined,
        endDate: undefined
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });
  });

  describe('Date Boundary Cases', () => {
    it('should handle dates at year boundaries', () => {
      const filters: CalendarEventFilters = {
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-01')
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle dates far in the future', () => {
      const filters: CalendarEventFilters = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2030-12-31')
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle dates in the past', () => {
      const filters: CalendarEventFilters = {
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-12-31')
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });
  });

  describe('Special Characters in Search', () => {
    it('should handle special characters in search term', () => {
      const filters: CalendarEventFilters = {
        searchTerm: 'Math & Science (Advanced)'
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle unicode characters in search term', () => {
      const filters: CalendarEventFilters = {
        searchTerm: 'Examen de Matemáticas'
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });

    it('should handle numbers in search term', () => {
      const filters: CalendarEventFilters = {
        searchTerm: 'Class 10 Exam 2025'
      };
      const result = validateFilters(filters);
      expect(result.valid).toBe(true);
    });
  });
});

