/**
 * Event Category Service Tests
 * 
 * Basic tests to verify event category service functionality
 */

import { describe, it, expect } from 'vitest';
import {
  validateCategoryData,
  CategoryValidationError,
  type CreateEventCategoryInput,
  type UpdateEventCategoryInput
} from '../event-category-service';

describe('Event Category Service', () => {
  describe('validateCategoryData', () => {
    it('should validate required fields for category creation', () => {
      const validData: CreateEventCategoryInput = {
        name: 'Holiday',
        color: '#EF4444',
        description: 'School holidays'
      };

      expect(() => validateCategoryData(validData)).not.toThrow();
    });

    it('should throw error when name is missing', () => {
      const invalidData: CreateEventCategoryInput = {
        name: '',
        color: '#EF4444'
      };

      expect(() => validateCategoryData(invalidData)).toThrow(CategoryValidationError);
      expect(() => validateCategoryData(invalidData)).toThrow('Category name is required');
    });

    it('should throw error when color is missing', () => {
      const invalidData = {
        name: 'Holiday',
        color: ''
      } as CreateEventCategoryInput;

      expect(() => validateCategoryData(invalidData)).toThrow(CategoryValidationError);
      expect(() => validateCategoryData(invalidData)).toThrow('Category color is required');
    });

    it('should throw error for invalid color format', () => {
      const invalidData: CreateEventCategoryInput = {
        name: 'Holiday',
        color: 'red' // Invalid format
      };

      expect(() => validateCategoryData(invalidData)).toThrow(CategoryValidationError);
      expect(() => validateCategoryData(invalidData)).toThrow('Invalid color format');
    });

    it('should accept valid 6-digit hex color', () => {
      const validData: CreateEventCategoryInput = {
        name: 'Holiday',
        color: '#EF4444'
      };

      expect(() => validateCategoryData(validData)).not.toThrow();
    });

    it('should accept valid 3-digit hex color', () => {
      const validData: CreateEventCategoryInput = {
        name: 'Holiday',
        color: '#F00'
      };

      expect(() => validateCategoryData(validData)).not.toThrow();
    });

    it('should reject hex color without hash', () => {
      const invalidData: CreateEventCategoryInput = {
        name: 'Holiday',
        color: 'EF4444'
      };

      expect(() => validateCategoryData(invalidData)).toThrow(CategoryValidationError);
      expect(() => validateCategoryData(invalidData)).toThrow('Invalid color format');
    });

    it('should reject invalid hex characters', () => {
      const invalidData: CreateEventCategoryInput = {
        name: 'Holiday',
        color: '#GGGGGG'
      };

      expect(() => validateCategoryData(invalidData)).toThrow(CategoryValidationError);
      expect(() => validateCategoryData(invalidData)).toThrow('Invalid color format');
    });

    it('should validate color format in updates', () => {
      const invalidUpdate: UpdateEventCategoryInput = {
        color: 'invalid'
      };

      expect(() => validateCategoryData(invalidUpdate)).toThrow(CategoryValidationError);
      expect(() => validateCategoryData(invalidUpdate)).toThrow('Invalid color format');
    });

    it('should accept valid update data', () => {
      const validUpdate: UpdateEventCategoryInput = {
        name: 'Updated Holiday',
        color: '#3B82F6',
        description: 'Updated description'
      };

      expect(() => validateCategoryData(validUpdate)).not.toThrow();
    });

    it('should accept partial update data', () => {
      const validUpdate: UpdateEventCategoryInput = {
        name: 'Updated Holiday'
      };

      expect(() => validateCategoryData(validUpdate)).not.toThrow();
    });
  });
});
