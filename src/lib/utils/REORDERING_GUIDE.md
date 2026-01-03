# Reordering Utilities Guide

## Overview

The reordering utilities provide transaction-safe functions for managing the order of modules and sub-modules in the Enhanced Syllabus System. These utilities ensure data consistency through atomic updates and comprehensive validation.

## Features

- **Sequential Order Management**: Automatically maintains sequential order values starting from 1
- **Transaction Support**: All updates are atomic to prevent data inconsistencies
- **Validation**: Comprehensive validation for order sequences and chapter numbers
- **Type Safety**: Full TypeScript support with proper type definitions
- **Property-Based Testing**: Extensively tested with 100+ iterations per property

## Core Functions

### calculateReorderedItems

Calculates new order values when moving an item from one position to another.

```typescript
import { calculateReorderedItems } from '@/lib/utils/reordering';

const items = [
  { id: '1', order: 1 },
  { id: '2', order: 2 },
  { id: '3', order: 3 },
];

// Move item from index 0 to index 2
const reordered = calculateReorderedItems(items, 0, 2);
// Result: [{ id: '2', order: 1 }, { id: '3', order: 2 }, { id: '1', order: 3 }]
```

### calculateReorderedModules

Specialized function for modules that handles both order and chapter number updates.

```typescript
import { calculateReorderedModules } from '@/lib/utils/reordering';

const modules = [
  { id: '1', order: 1, chapterNumber: 1 },
  { id: '2', order: 2, chapterNumber: 2 },
  { id: '3', order: 3, chapterNumber: 3 },
];

// Move module from index 0 to index 2
const reordered = calculateReorderedModules(modules, 0, 2);
// Result: Both order and chapterNumber are updated sequentially
```

### getAffectedItems

Returns only the items that have changed order values, useful for optimizing database updates.

```typescript
import { getAffectedItems } from '@/lib/utils/reordering';

const original = [
  { id: '1', order: 1 },
  { id: '2', order: 2 },
  { id: '3', order: 3 },
];

const reordered = calculateReorderedItems(original, 0, 2);
const affected = getAffectedItems(original, reordered);
// Returns only items with changed order values
```

### validateOrderSequence

Validates that order values are sequential and start from 1.

```typescript
import { validateOrderSequence } from '@/lib/utils/reordering';

const valid = [
  { id: '1', order: 1 },
  { id: '2', order: 2 },
  { id: '3', order: 3 },
];

const invalid = [
  { id: '1', order: 1 },
  { id: '2', order: 3 }, // Gap in sequence
  { id: '3', order: 4 },
];

validateOrderSequence(valid); // true
validateOrderSequence(invalid); // false
```

### normalizeOrderSequence

Fixes gaps in order sequences by reassigning sequential values.

```typescript
import { normalizeOrderSequence } from '@/lib/utils/reordering';

const items = [
  { id: '1', order: 5 },
  { id: '2', order: 10 },
  { id: '3', order: 15 },
];

const normalized = normalizeOrderSequence(items);
// Result: [{ id: '1', order: 1 }, { id: '2', order: 2 }, { id: '3', order: 3 }]
```

### validateUniqueChapterNumbers

Validates that all chapter numbers are unique within a syllabus.

```typescript
import { validateUniqueChapterNumbers } from '@/lib/utils/reordering';

const modules = [
  { id: '1', order: 1, chapterNumber: 1 },
  { id: '2', order: 2, chapterNumber: 2 },
  { id: '3', order: 3, chapterNumber: 3 },
];

validateUniqueChapterNumbers(modules); // true

const duplicate = [
  { id: '1', order: 1, chapterNumber: 1 },
  { id: '2', order: 2, chapterNumber: 1 }, // Duplicate!
];

validateUniqueChapterNumbers(duplicate); // false
```

### getAffectedOrderRange

Calculates the range of order values affected by a reordering operation.

```typescript
import { getAffectedOrderRange } from '@/lib/utils/reordering';

const range = getAffectedOrderRange(2, 5);
// Result: { min: 2, max: 5 }

// Useful for optimizing queries
const affectedItems = await db.module.findMany({
  where: {
    order: {
      gte: range.min,
      lte: range.max,
    },
  },
});
```

### generateUpdateOperations

Converts reordered items into a format suitable for Prisma transactions.

```typescript
import { generateUpdateOperations } from '@/lib/utils/reordering';

const reordered = [
  { id: '1', order: 2 },
  { id: '2', order: 1 },
];

const operations = generateUpdateOperations(reordered);
// Result: [{ id: '1', order: 2 }, { id: '2', order: 1 }]

// Use in transaction
await db.$transaction(
  operations.map((op) =>
    db.subModule.update({
      where: { id: op.id },
      data: { order: op.order },
    })
  )
);
```

### generateModuleUpdateOperations

Specialized version for modules that includes chapter number updates.

```typescript
import { generateModuleUpdateOperations } from '@/lib/utils/reordering';

const modules = [
  { id: '1', order: 2, chapterNumber: 2 },
  { id: '2', order: 1, chapterNumber: 1 },
];

const operations = generateModuleUpdateOperations(modules);
// Result: [{ id: '1', order: 2, chapterNumber: 2 }, ...]

// Use in transaction
await db.$transaction(
  operations.map((op) =>
    db.module.update({
      where: { id: op.id },
      data: {
        order: op.order,
        chapterNumber: op.chapterNumber,
      },
    })
  )
);
```

## Usage in Server Actions

### Module Reordering

```typescript
import { reorderModules } from '@/lib/actions/moduleActions';

// Client-side drag-and-drop handler
const handleModuleDrop = async (draggedId: string, targetId: string) => {
  const modules = [...currentModules];
  const fromIndex = modules.findIndex((m) => m.id === draggedId);
  const toIndex = modules.findIndex((m) => m.id === targetId);

  // Calculate new order
  const reordered = calculateReorderedModules(modules, fromIndex, toIndex);

  // Update in database
  const result = await reorderModules({
    syllabusId: syllabusId,
    moduleOrders: reordered.map((m) => ({
      id: m.id,
      order: m.order,
      chapterNumber: m.chapterNumber,
    })),
  });

  if (result.success) {
    // Update UI
    setCurrentModules(reordered);
  }
};
```

### Sub-Module Reordering

```typescript
import { reorderSubModules } from '@/lib/actions/subModuleActions';

// Client-side drag-and-drop handler
const handleSubModuleDrop = async (draggedId: string, targetId: string) => {
  const subModules = [...currentSubModules];
  const fromIndex = subModules.findIndex((sm) => sm.id === draggedId);
  const toIndex = subModules.findIndex((sm) => sm.id === targetId);

  // Calculate new order
  const reordered = calculateReorderedItems(subModules, fromIndex, toIndex);

  // Update in database
  const result = await reorderSubModules({
    moduleId: moduleId,
    subModuleOrders: reordered.map((sm) => ({
      id: sm.id,
      order: sm.order,
    })),
  });

  if (result.success) {
    // Update UI
    setCurrentSubModules(reordered);
  }
};
```

## Transaction Safety

All reordering operations use Prisma transactions to ensure atomicity:

```typescript
// All updates happen atomically
await db.$transaction(
  moduleOrders.map((moduleOrder) =>
    db.module.update({
      where: { id: moduleOrder.id },
      data: {
        order: moduleOrder.order,
        chapterNumber: moduleOrder.chapterNumber,
      },
    })
  )
);
```

If any update fails, all changes are rolled back, preventing partial updates and data inconsistencies.

## Validation

The utilities include comprehensive validation:

1. **Order Sequence Validation**: Ensures orders are sequential starting from 1
2. **Chapter Number Uniqueness**: Prevents duplicate chapter numbers within a syllabus
3. **Parent Relationship Validation**: Ensures items belong to the correct parent
4. **Type Safety**: TypeScript ensures correct types at compile time

## Property-Based Testing

The reordering utilities are extensively tested using fast-check with 100+ iterations per property:

- **Property 27**: Module reordering updates all affected orders
- **Property 28**: Sub-module reordering within module
- **Property 29**: Sub-module move updates parent and order

Run tests with:

```bash
npm run test:run -- reordering
```

## Error Handling

The utilities handle various error scenarios:

```typescript
// Invalid order sequence
if (!validateOrderSequence(items)) {
  return {
    success: false,
    error: "Invalid order sequence. Orders must be sequential starting from 1",
  };
}

// Duplicate chapter numbers
if (!validateUniqueChapterNumbers(modules)) {
  return {
    success: false,
    error: "Duplicate chapter numbers detected",
  };
}

// Items don't belong to parent
if (items.length !== expectedLength) {
  return {
    success: false,
    error: "Some items do not belong to this parent",
  };
}
```

## Performance Considerations

1. **Optimized Updates**: Only affected items are updated in the database
2. **Batch Operations**: All updates are performed in a single transaction
3. **Index Support**: Database indexes on `order` and `chapterNumber` fields improve query performance
4. **Minimal Data Transfer**: Only IDs and order values are sent to the server

## Best Practices

1. **Always validate** order sequences before database updates
2. **Use transactions** for all reordering operations
3. **Calculate affected items** to minimize database updates
4. **Provide user feedback** during reordering operations
5. **Handle errors gracefully** and provide clear error messages
6. **Test thoroughly** with property-based tests

## Related Files

- `src/lib/utils/reordering.ts` - Core utility functions
- `src/lib/utils/__tests__/reordering.test.ts` - Property-based tests
- `src/lib/actions/moduleActions.ts` - Module management actions
- `src/lib/actions/subModuleActions.ts` - Sub-module management actions

## Requirements

This implementation satisfies the following requirements:

- **Requirement 8.1**: Module reordering with drag-and-drop
- **Requirement 8.2**: Sub-module reordering within module
- **Requirement 8.3**: Sub-module move between modules

## Support

For issues or questions, refer to:
- Design document: `.kiro/specs/enhanced-syllabus-system/design.md`
- Requirements document: `.kiro/specs/enhanced-syllabus-system/requirements.md`
- Task list: `.kiro/specs/enhanced-syllabus-system/tasks.md`
