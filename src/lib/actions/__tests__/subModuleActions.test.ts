/**
 * Unit tests for sub-module management actions
 * 
 * These tests verify the validation and error handling of sub-module CRUD operations.
 * Note: These are validation-focused tests. Full integration tests with database
 * should be run separately in a test environment.
 */

import { describe, it, expect } from 'vitest';
import {
  createSubModule,
  updateSubModule,
  deleteSubModule,
  moveSubModule,
  reorderSubModules,
  getSubModulesByModule,
} from '../subModuleActions';

describe('Sub-Module Management Actions - Validation', () => {

  describe('createSubModule', () => {
    it('should fail with invalid input - title too short', async () => {
      const result = await createSubModule({
        title: 'AB', // Too short
        order: 1,
        moduleId: 'test-module-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Title must be at least 3 characters');
    });

    it('should fail with invalid input - missing moduleId', async () => {
      const result = await createSubModule({
        title: 'Test Sub-Module',
        order: 1,
        moduleId: '', // Empty
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail with invalid input - order less than 1', async () => {
      const result = await createSubModule({
        title: 'Test Sub-Module',
        order: 0, // Invalid
        moduleId: 'test-module-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Order must be at least 1');
    });

    it('should fail when module does not exist', async () => {
      const result = await createSubModule({
        title: 'Test Sub-Module',
        order: 1,
        moduleId: 'non-existent-module-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Module not found');
    });
  });

  describe('updateSubModule', () => {
    it('should fail with invalid input - missing id', async () => {
      const result = await updateSubModule({
        id: '', // Empty
        title: 'Updated Sub-Module',
        order: 1,
        moduleId: 'test-module-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sub-module ID is required');
    });

    it('should fail when sub-module does not exist', async () => {
      const result = await updateSubModule({
        id: 'non-existent-id',
        title: 'Updated Sub-Module',
        order: 1,
        moduleId: 'test-module-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sub-module not found');
    });
  });

  describe('deleteSubModule', () => {
    it('should fail with missing id', async () => {
      const result = await deleteSubModule('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sub-module ID is required');
    });

    it('should fail when sub-module does not exist', async () => {
      const result = await deleteSubModule('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sub-module not found');
    });
  });

  describe('moveSubModule', () => {
    it('should fail with invalid input - missing subModuleId', async () => {
      const result = await moveSubModule({
        subModuleId: '', // Empty
        targetModuleId: 'target-module-id',
        order: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sub-module ID is required');
    });

    it('should fail with invalid input - missing targetModuleId', async () => {
      const result = await moveSubModule({
        subModuleId: 'sub-module-id',
        targetModuleId: '', // Empty
        order: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Target module ID is required');
    });

    it('should fail when sub-module does not exist', async () => {
      const result = await moveSubModule({
        subModuleId: 'non-existent-id',
        targetModuleId: 'target-module-id',
        order: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sub-module not found');
    });
  });

  describe('reorderSubModules', () => {
    it('should fail with invalid input - missing moduleId', async () => {
      const result = await reorderSubModules({
        moduleId: '', // Empty
        subModuleOrders: [
          { id: 'sub-module-1', order: 1 },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Module ID is required');
    });

    it('should fail with invalid input - empty subModuleOrders', async () => {
      const result = await reorderSubModules({
        moduleId: 'module-id',
        subModuleOrders: [], // Empty array
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one sub-module order is required');
    });
  });

  describe('getSubModulesByModule', () => {
    it('should fail with missing module ID', async () => {
      const result = await getSubModulesByModule('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Module ID is required');
    });
  });
});
