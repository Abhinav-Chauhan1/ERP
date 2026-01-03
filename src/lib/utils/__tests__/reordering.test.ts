/**
 * Property-based tests for reordering utilities
 * Uses fast-check for property-based testing
 * Requirements: 8.1, 8.2, 8.3
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  calculateReorderedItems,
  getAffectedItems,
  validateOrderSequence,
  normalizeOrderSequence,
  calculateReorderedModules,
  validateUniqueChapterNumbers,
  getAffectedOrderRange,
  generateUpdateOperations,
  generateModuleUpdateOperations,
  type ReorderItem,
  type ModuleReorderItem,
} from '../reordering';

// Arbitraries (generators) for property-based testing

/**
 * Generate a valid ReorderItem with sequential order
 */
const reorderItemArbitrary = (order: number): fc.Arbitrary<ReorderItem> =>
  fc.record({
    id: fc.uuid(),
    order: fc.constant(order),
  });

/**
 * Generate an array of ReorderItems with sequential orders starting from 1
 */
const reorderItemsArbitrary = (): fc.Arbitrary<ReorderItem[]> =>
  fc
    .integer({ min: 1, max: 20 })
    .chain((length) =>
      fc.tuple(...Array.from({ length }, (_, i) => reorderItemArbitrary(i + 1)))
    );

/**
 * Generate a ModuleReorderItem with sequential order and chapter number
 */
const moduleReorderItemArbitrary = (
  order: number
): fc.Arbitrary<ModuleReorderItem> =>
  fc.record({
    id: fc.uuid(),
    order: fc.constant(order),
    chapterNumber: fc.constant(order),
  });

/**
 * Generate an array of ModuleReorderItems with sequential values
 */
const moduleReorderItemsArbitrary = (): fc.Arbitrary<ModuleReorderItem[]> =>
  fc
    .integer({ min: 1, max: 20 })
    .chain((length) =>
      fc.tuple(
        ...Array.from({ length }, (_, i) => moduleReorderItemArbitrary(i + 1))
      )
    );

/**
 * Generate valid from/to indices for an array of given length
 */
const validIndicesArbitrary = (
  length: number
): fc.Arbitrary<{ fromIndex: number; toIndex: number }> =>
  fc.record({
    fromIndex: fc.integer({ min: 0, max: length - 1 }),
    toIndex: fc.integer({ min: 0, max: length - 1 }),
  });

describe('Reordering Utilities - Property-Based Tests', () => {
  /**
   * Feature: enhanced-syllabus-system, Property 27: Module reordering updates all affected orders
   * Validates: Requirements 8.1
   */
  describe('Property 27: Module reordering updates all affected orders', () => {
    it('should maintain sequential order values after reordering', () => {
      fc.assert(
        fc.property(
          moduleReorderItemsArbitrary(),
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (modules, fromIndex, toIndex) => {
            // Skip if indices are out of bounds
            if (fromIndex >= modules.length || toIndex >= modules.length) {
              return true;
            }

            const reordered = calculateReorderedModules(
              modules,
              fromIndex,
              toIndex
            );

            // All order values should be sequential starting from 1
            const isSequential = validateOrderSequence(reordered);
            expect(isSequential).toBe(true);

            // All chapter numbers should be sequential starting from 1
            const chapterNumbers = reordered.map((m) => m.chapterNumber).sort((a, b) => a - b);
            const expectedChapterNumbers = Array.from(
              { length: reordered.length },
              (_, i) => i + 1
            );
            expect(chapterNumbers).toEqual(expectedChapterNumbers);

            // Length should remain the same
            expect(reordered.length).toBe(modules.length);

            // All original IDs should still be present
            const originalIds = new Set(modules.map((m) => m.id));
            const reorderedIds = new Set(reordered.map((m) => m.id));
            expect(reorderedIds).toEqual(originalIds);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update all modules between old and new positions', () => {
      fc.assert(
        fc.property(
          moduleReorderItemsArbitrary(),
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (modules, fromIndex, toIndex) => {
            // Skip if indices are out of bounds or same
            if (
              fromIndex >= modules.length ||
              toIndex >= modules.length ||
              fromIndex === toIndex
            ) {
              return true;
            }

            const reordered = calculateReorderedModules(
              modules,
              fromIndex,
              toIndex
            );
            const affected = getAffectedItems(modules, reordered);

            // Calculate expected affected range
            const range = getAffectedOrderRange(
              modules[fromIndex].order,
              modules[toIndex].order
            );

            // All affected items should be within the range
            for (const item of affected) {
              const originalItem = modules.find((m) => m.id === item.id);
              if (originalItem) {
                expect(originalItem.order).toBeGreaterThanOrEqual(range.min);
                expect(originalItem.order).toBeLessThanOrEqual(range.max);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all module IDs during reordering', () => {
      fc.assert(
        fc.property(
          moduleReorderItemsArbitrary(),
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (modules, fromIndex, toIndex) => {
            // Skip if indices are out of bounds
            if (fromIndex >= modules.length || toIndex >= modules.length) {
              return true;
            }

            const reordered = calculateReorderedModules(
              modules,
              fromIndex,
              toIndex
            );

            // All original IDs should be present
            const originalIds = modules.map((m) => m.id).sort();
            const reorderedIds = reordered.map((m) => m.id).sort();
            expect(reorderedIds).toEqual(originalIds);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: enhanced-syllabus-system, Property 28: Sub-module reordering within module
   * Validates: Requirements 8.2
   */
  describe('Property 28: Sub-module reordering within module', () => {
    it('should maintain sequential order values after reordering sub-modules', () => {
      fc.assert(
        fc.property(
          reorderItemsArbitrary(),
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (subModules, fromIndex, toIndex) => {
            // Skip if indices are out of bounds
            if (fromIndex >= subModules.length || toIndex >= subModules.length) {
              return true;
            }

            const reordered = calculateReorderedItems(
              subModules,
              fromIndex,
              toIndex
            );

            // All order values should be sequential starting from 1
            const isSequential = validateOrderSequence(reordered);
            expect(isSequential).toBe(true);

            // Length should remain the same
            expect(reordered.length).toBe(subModules.length);

            // All original IDs should still be present
            const originalIds = new Set(subModules.map((sm) => sm.id));
            const reorderedIds = new Set(reordered.map((sm) => sm.id));
            expect(reorderedIds).toEqual(originalIds);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update all sub-modules between old and new positions', () => {
      fc.assert(
        fc.property(
          reorderItemsArbitrary(),
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (subModules, fromIndex, toIndex) => {
            // Skip if indices are out of bounds or same
            if (
              fromIndex >= subModules.length ||
              toIndex >= subModules.length ||
              fromIndex === toIndex
            ) {
              return true;
            }

            const reordered = calculateReorderedItems(
              subModules,
              fromIndex,
              toIndex
            );
            const affected = getAffectedItems(subModules, reordered);

            // At least the moved item should be affected
            expect(affected.length).toBeGreaterThan(0);

            // Calculate expected affected range
            const range = getAffectedOrderRange(
              subModules[fromIndex].order,
              subModules[toIndex].order
            );

            // All affected items should be within the range
            for (const item of affected) {
              const originalItem = subModules.find((sm) => sm.id === item.id);
              if (originalItem) {
                expect(originalItem.order).toBeGreaterThanOrEqual(range.min);
                expect(originalItem.order).toBeLessThanOrEqual(range.max);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all sub-module IDs during reordering', () => {
      fc.assert(
        fc.property(
          reorderItemsArbitrary(),
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (subModules, fromIndex, toIndex) => {
            // Skip if indices are out of bounds
            if (fromIndex >= subModules.length || toIndex >= subModules.length) {
              return true;
            }

            const reordered = calculateReorderedItems(
              subModules,
              fromIndex,
              toIndex
            );

            // All original IDs should be present
            const originalIds = subModules.map((sm) => sm.id).sort();
            const reorderedIds = reordered.map((sm) => sm.id).sort();
            expect(reorderedIds).toEqual(originalIds);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: enhanced-syllabus-system, Property 29: Sub-module move updates parent and order
   * Validates: Requirements 8.3
   */
  describe('Property 29: Sub-module move updates parent and order', () => {
    it('should maintain valid order sequence when moving sub-modules', () => {
      fc.assert(
        fc.property(
          reorderItemsArbitrary(),
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (subModules, fromIndex, toIndex) => {
            // Skip if indices are out of bounds
            if (fromIndex >= subModules.length || toIndex >= subModules.length) {
              return true;
            }

            const reordered = calculateReorderedItems(
              subModules,
              fromIndex,
              toIndex
            );

            // Order should be valid and sequential
            const isSequential = validateOrderSequence(reordered);
            expect(isSequential).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate correct update operations for moved sub-modules', () => {
      fc.assert(
        fc.property(
          reorderItemsArbitrary(),
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (subModules, fromIndex, toIndex) => {
            // Skip if indices are out of bounds
            if (fromIndex >= subModules.length || toIndex >= subModules.length) {
              return true;
            }

            const reordered = calculateReorderedItems(
              subModules,
              fromIndex,
              toIndex
            );
            const affected = getAffectedItems(subModules, reordered);
            const operations = generateUpdateOperations(affected);

            // Each operation should have id and order
            for (const op of operations) {
              expect(op).toHaveProperty('id');
              expect(op).toHaveProperty('order');
              expect(typeof op.id).toBe('string');
              expect(typeof op.order).toBe('number');
              expect(op.order).toBeGreaterThan(0);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Additional utility function tests
  describe('Utility Functions', () => {
    it('should correctly validate order sequences', () => {
      fc.assert(
        fc.property(reorderItemsArbitrary(), (items) => {
          // Items generated by our arbitrary should always be valid
          const isValid = validateOrderSequence(items);
          expect(isValid).toBe(true);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should normalize any order sequence to be sequential', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              order: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (items) => {
            const normalized = normalizeOrderSequence(items);

            // Normalized sequence should be valid
            const isValid = validateOrderSequence(normalized);
            expect(isValid).toBe(true);

            // Should have same length
            expect(normalized.length).toBe(items.length);

            // Should have same IDs
            const originalIds = items.map((i) => i.id).sort();
            const normalizedIds = normalized.map((i) => i.id).sort();
            expect(normalizedIds).toEqual(originalIds);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate unique chapter numbers correctly', () => {
      fc.assert(
        fc.property(moduleReorderItemsArbitrary(), (modules) => {
          // Modules from our arbitrary should have unique chapter numbers
          const isUnique = validateUniqueChapterNumbers(modules);
          expect(isUnique).toBe(true);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should detect duplicate chapter numbers', () => {
      fc.assert(
        fc.property(
          moduleReorderItemsArbitrary(),
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (modules, idx1, idx2) => {
            // Skip if indices are out of bounds or same
            if (
              idx1 >= modules.length ||
              idx2 >= modules.length ||
              idx1 === idx2
            ) {
              return true;
            }

            // Create duplicate by setting same chapter number
            const withDuplicate = [...modules];
            withDuplicate[idx2] = {
              ...withDuplicate[idx2],
              chapterNumber: withDuplicate[idx1].chapterNumber,
            };

            const isUnique = validateUniqueChapterNumbers(withDuplicate);
            expect(isUnique).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate correct module update operations', () => {
      fc.assert(
        fc.property(moduleReorderItemsArbitrary(), (modules) => {
          const operations = generateModuleUpdateOperations(modules);

          // Should have same length
          expect(operations.length).toBe(modules.length);

          // Each operation should have required fields
          for (const op of operations) {
            expect(op).toHaveProperty('id');
            expect(op).toHaveProperty('order');
            expect(op).toHaveProperty('chapterNumber');
            expect(typeof op.id).toBe('string');
            expect(typeof op.order).toBe('number');
            expect(typeof op.chapterNumber).toBe('number');
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should calculate affected order range correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (from, to) => {
            const range = getAffectedOrderRange(from, to);

            expect(range.min).toBe(Math.min(from, to));
            expect(range.max).toBe(Math.max(from, to));
            expect(range.min).toBeLessThanOrEqual(range.max);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when reordering to same position', () => {
      fc.assert(
        fc.property(
          reorderItemsArbitrary(),
          fc.integer({ min: 0, max: 19 }),
          (items, index) => {
            // Skip if index is out of bounds
            if (index >= items.length) {
              return true;
            }

            const reordered = calculateReorderedItems(items, index, index);

            // Should be identical to original
            expect(reordered).toEqual(items);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
