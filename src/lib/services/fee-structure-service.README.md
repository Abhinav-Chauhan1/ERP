# Fee Structure Service

## Overview

The Fee Structure Service provides comprehensive business logic for managing fee structures with multi-class support. It handles CRUD operations, class associations, templates, and duplication functionality.

## Features

### Core Operations

- **Create Fee Structure**: Create new fee structures with multiple class associations
- **Update Fee Structure**: Update existing fee structures and their class associations
- **Get Fee Structures**: Retrieve fee structures with flexible filtering options
- **Get Fee Structure by ID**: Retrieve a single fee structure with all relationships
- **Delete Fee Structure**: Delete fee structures (with payment validation)

### Advanced Features

- **Multi-Class Support**: Associate fee structures with multiple classes
- **Class-Based Filtering**: Query fee structures by specific class
- **Template System**: Mark fee structures as templates for reuse
- **Duplication**: Duplicate existing fee structures with customization
- **Create from Template**: Generate new fee structures from templates

## Usage

### Import

```typescript
import { feeStructureService } from '@/lib/services/fee-structure-service';
```

### Create Fee Structure

```typescript
const feeStructure = await feeStructureService.createFeeStructure({
  name: "Tuition Fee - Term 1",
  academicYearId: "academic-year-id",
  classIds: ["class-1-id", "class-2-id"],
  description: "First term tuition fees",
  validFrom: new Date("2024-01-01"),
  validTo: new Date("2024-04-30"),
  isActive: true,
  isTemplate: false,
  items: [
    {
      feeTypeId: "tuition-fee-type-id",
      amount: 5000,
      dueDate: new Date("2024-02-15"),
    },
  ],
});
```

### Update Fee Structure

```typescript
const updated = await feeStructureService.updateFeeStructure(
  "fee-structure-id",
  {
    name: "Updated Fee Structure Name",
    classIds: ["new-class-1-id", "new-class-2-id"],
    isActive: false,
  }
);
```

### Get Fee Structures with Filters

```typescript
// Get all active fee structures for a specific academic year
const feeStructures = await feeStructureService.getFeeStructures({
  academicYearId: "academic-year-id",
  isActive: true,
  isTemplate: false,
});

// Get fee structures for a specific class
const classFeeStructures = await feeStructureService.getFeeStructures({
  classId: "class-id",
});

// Search fee structures
const searchResults = await feeStructureService.getFeeStructures({
  searchTerm: "tuition",
});
```

### Get Fee Structures for Class

```typescript
const feeStructures = await feeStructureService.getFeeStructuresForClass(
  "class-id",
  "academic-year-id" // optional
);
```

### Duplicate Fee Structure

```typescript
const duplicate = await feeStructureService.duplicateFeeStructure(
  "original-fee-structure-id",
  {
    name: "Custom Duplicate Name",
    academicYearId: "new-academic-year-id",
    classIds: ["different-class-id"],
  }
);
```

### Work with Templates

```typescript
// Get all templates
const templates = await feeStructureService.getTemplates();

// Create from template
const newFeeStructure = await feeStructureService.createFromTemplate(
  "template-id",
  {
    name: "New Fee Structure from Template",
    academicYearId: "academic-year-id",
    classIds: ["class-1-id", "class-2-id"],
    validFrom: new Date("2024-01-01"),
    validTo: new Date("2024-12-31"),
    isActive: true,
  }
);
```

## Validation

The service includes built-in validation:

- **Class Selection**: At least one class must be selected
- **Class Existence**: All selected classes must exist in the database
- **Payment Protection**: Cannot delete fee structures with existing payments
- **Template Validation**: Ensures only templates can be used for template operations

## Error Handling

All methods throw descriptive errors that can be caught and handled:

```typescript
try {
  await feeStructureService.createFeeStructure(data);
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    // Handle specific error cases
  }
}
```

Common error messages:
- "At least one class must be selected"
- "One or more selected classes do not exist"
- "Fee structure not found"
- "Cannot delete fee structure with existing payments"
- "Template not found"
- "Specified fee structure is not a template"

## Server Actions

The service is integrated with server actions in `src/lib/actions/feeStructureActions.ts`:

- `getFeeStructures(filters?)` - Get fee structures with optional filters
- `getFeeStructureById(id)` - Get single fee structure
- `getFeeStructuresForClass(classId, academicYearId?)` - Get fee structures for class
- `createFeeStructure(data)` - Create new fee structure
- `updateFeeStructure(id, data)` - Update fee structure
- `deleteFeeStructure(id)` - Delete fee structure
- `duplicateFeeStructure(id, newData?)` - Duplicate fee structure
- `getFeeStructureTemplates()` - Get all templates
- `createFeeStructureFromTemplate(templateId, data)` - Create from template

## Database Schema

The service works with the following models:

- **FeeStructure**: Main fee structure entity
- **FeeStructureClass**: Junction table for fee structure-class relationships
- **FeeStructureItem**: Individual fee items within a structure
- **Class**: Academic classes
- **FeeType**: Types of fees
- **AcademicYear**: Academic year information

## Requirements Validation

This service validates the following requirements:

- **Requirement 1.1**: Multi-select dropdown for classes ✓
- **Requirement 1.2**: Store class associations in junction table ✓
- **Requirement 1.4**: Pre-populate multi-select with current classes ✓
- **Requirement 4.1**: Filter fee structures by class ✓
- **Requirement 4.2**: Display only structures for selected class ✓
- **Requirement 4.3**: Auto-determine applicable structures ✓
- **Requirement 7.1-7.4**: Duplication functionality ✓
- **Requirement 8.1-8.4**: Template functionality ✓

## Testing

Property-based tests are available for:
- Fee structure query consistency (Property 4)
- Duplication independence (Property 7)
- Template exclusion (Property 6)

See `.kiro/specs/enhanced-fee-structure-system/tasks.md` for test task details.
