/**
 * Reordering utility functions for modules and sub-modules
 * Provides transaction-safe reordering logic with order recalculation
 * Requirements: 8.1, 8.2, 8.3
 */

export interface ReorderItem {
  id: string;
  order: number;
}

export interface ModuleReorderItem extends ReorderItem {
  chapterNumber: number;
}

/**
 * Calculate new order values when moving an item from one position to another
 * This ensures all affected items have their order values updated correctly
 * 
 * @param items - Array of items with current order values
 * @param fromIndex - Current index of the item being moved
 * @param toIndex - Target index for the item
 * @returns Array of items with updated order values
 */
export function calculateReorderedItems<T extends ReorderItem>(
  items: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  if (fromIndex === toIndex) {
    return items;
  }

  // Create a copy to avoid mutating the original array
  const reordered = [...items];
  
  // Remove the item from its current position
  const [movedItem] = reordered.splice(fromIndex, 1);
  
  // Insert it at the new position
  reordered.splice(toIndex, 0, movedItem);
  
  // Recalculate order values to be sequential starting from 1
  return reordered.map((item, index) => ({
    ...item,
    order: index + 1,
  }));
}

/**
 * Calculate order updates for items affected by a reordering operation
 * Returns only the items that need to be updated in the database
 * 
 * @param originalItems - Original array of items before reordering
 * @param reorderedItems - Array of items after reordering
 * @returns Array of items that have changed order values
 */
export function getAffectedItems<T extends ReorderItem>(
  originalItems: T[],
  reorderedItems: T[]
): T[] {
  const affected: T[] = [];
  
  for (let i = 0; i < reorderedItems.length; i++) {
    const reorderedItem = reorderedItems[i];
    const originalItem = originalItems.find(item => item.id === reorderedItem.id);
    
    if (originalItem && originalItem.order !== reorderedItem.order) {
      affected.push(reorderedItem);
    }
  }
  
  return affected;
}

/**
 * Validate that order values are sequential and start from 1
 * 
 * @param items - Array of items to validate
 * @returns true if order values are valid, false otherwise
 */
export function validateOrderSequence<T extends ReorderItem>(
  items: T[]
): boolean {
  if (items.length === 0) {
    return true;
  }
  
  // Sort by order to check sequence
  const sorted = [...items].sort((a, b) => a.order - b.order);
  
  // Check if orders start from 1 and are sequential
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].order !== i + 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Normalize order values to be sequential starting from 1
 * Useful for fixing gaps in order sequences
 * 
 * @param items - Array of items to normalize
 * @returns Array of items with normalized order values
 */
export function normalizeOrderSequence<T extends ReorderItem>(
  items: T[]
): T[] {
  // Sort by current order
  const sorted = [...items].sort((a, b) => a.order - b.order);
  
  // Reassign sequential order values
  return sorted.map((item, index) => ({
    ...item,
    order: index + 1,
  }));
}

/**
 * Calculate new order values for modules when reordering
 * Handles both order and chapter number updates
 * 
 * @param modules - Array of modules with current values
 * @param fromIndex - Current index of the module being moved
 * @param toIndex - Target index for the module
 * @returns Array of modules with updated order and chapter number values
 */
export function calculateReorderedModules(
  modules: ModuleReorderItem[],
  fromIndex: number,
  toIndex: number
): ModuleReorderItem[] {
  if (fromIndex === toIndex) {
    return modules;
  }

  // Create a copy to avoid mutating the original array
  const reordered = [...modules];
  
  // Remove the module from its current position
  const [movedModule] = reordered.splice(fromIndex, 1);
  
  // Insert it at the new position
  reordered.splice(toIndex, 0, movedModule);
  
  // Recalculate both order and chapter number to be sequential starting from 1
  return reordered.map((module, index) => ({
    ...module,
    order: index + 1,
    chapterNumber: index + 1,
  }));
}

/**
 * Validate that chapter numbers are unique within a syllabus
 * 
 * @param modules - Array of modules to validate
 * @returns true if all chapter numbers are unique, false otherwise
 */
export function validateUniqueChapterNumbers(
  modules: ModuleReorderItem[]
): boolean {
  const chapterNumbers = modules.map(m => m.chapterNumber);
  const uniqueChapterNumbers = new Set(chapterNumbers);
  return uniqueChapterNumbers.size === chapterNumbers.length;
}

/**
 * Calculate the range of items affected by a reordering operation
 * Returns the minimum and maximum order values that were changed
 * 
 * @param fromOrder - Original order value
 * @param toOrder - New order value
 * @returns Object with min and max order values in the affected range
 */
export function getAffectedOrderRange(
  fromOrder: number,
  toOrder: number
): { min: number; max: number } {
  return {
    min: Math.min(fromOrder, toOrder),
    max: Math.max(fromOrder, toOrder),
  };
}

/**
 * Generate update operations for a transaction
 * Converts reordered items into a format suitable for Prisma transactions
 * 
 * @param items - Array of items with updated order values
 * @returns Array of update operations with id and order
 */
export function generateUpdateOperations<T extends ReorderItem>(
  items: T[]
): Array<{ id: string; order: number }> {
  return items.map(item => ({
    id: item.id,
    order: item.order,
  }));
}

/**
 * Generate update operations for modules including chapter numbers
 * 
 * @param modules - Array of modules with updated values
 * @returns Array of update operations with id, order, and chapterNumber
 */
export function generateModuleUpdateOperations(
  modules: ModuleReorderItem[]
): Array<{ id: string; order: number; chapterNumber: number }> {
  return modules.map(module => ({
    id: module.id,
    order: module.order,
    chapterNumber: module.chapterNumber,
  }));
}
