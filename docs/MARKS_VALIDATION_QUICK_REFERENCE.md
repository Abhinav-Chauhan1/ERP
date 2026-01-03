# Marks Validation - Quick Reference Guide

## Quick Start

### Import Validation Functions

```typescript
import {
  validateMarkEntry,
  validateBulkMarks,
  createErrorResponse,
  ValidationErrorCodes,
} from '@/lib/utils/marks-validation';
```

### Import Schemas

```typescript
import {
  studentMarkEntrySchema,
  saveMarksInputSchema,
} from '@/lib/schemaValidation/marksEntrySchemaValidation';
```

## Common Validation Patterns

### 1. Validate Single Mark Entry

```typescript
const entry = {
  studentId: "student123",
  theoryMarks: 60,
  practicalMarks: 25,
  isAbsent: false,
};

const config = {
  theoryMaxMarks: 70,
  practicalMaxMarks: 30,
  totalMarks: 100,
};

const result = validateMarkEntry(entry, config);

if (!result.isValid) {
  console.error("Validation errors:", result.errors);
}
```

### 2. Validate Bulk Marks

```typescript
const entries = [
  { studentId: "s1", theoryMarks: 60, isAbsent: false },
  { studentId: "s2", theoryMarks: 70, isAbsent: false },
];

const validation = validateBulkMarks(entries, config);

if (!validation.isValid) {
  // Handle validation errors
  const formatted = formatValidationErrors(validation.errors);
  
  // Handle duplicates
  if (validation.duplicates.size > 0) {
    console.log("Duplicates found:", validation.duplicates);
  }
}
```

### 3. Create Error Response

```typescript
// Simple error
return createErrorResponse(
  "Validation failed",
  "VALIDATION_ERROR"
);

// With details
return createErrorResponse(
  "Validation failed",
  "VALIDATION_ERROR",
  { student_0: ["Theory marks exceed maximum"] }
);

// With duplicates
return createErrorResponse(
  "Duplicates found",
  "DUPLICATE_ENTRIES",
  undefined,
  duplicatesMap
);
```

## Error Codes

| Code | When to Use |
|------|-------------|
| `REQUIRED_FIELD` | Missing required field |
| `INVALID_TYPE` | Wrong data type |
| `NEGATIVE_VALUE` | Negative number |
| `EXCEEDS_MAXIMUM` | Value too large |
| `DUPLICATE_ENTRIES` | Duplicate students |
| `NO_MARKS_PROVIDED` | No marks for non-absent |
| `VALIDATION_ERROR` | General validation failure |

## Frontend Integration

### React Hook Form Example

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { studentMarkEntrySchema } from '@/lib/schemaValidation/marksEntrySchemaValidation';

const form = useForm({
  resolver: zodResolver(studentMarkEntrySchema),
  defaultValues: {
    studentId: "",
    theoryMarks: null,
    practicalMarks: null,
    isAbsent: false,
  },
});
```

### Display Validation Errors

```typescript
if (!response.success && response.details) {
  Object.entries(response.details).forEach(([field, errors]) => {
    errors.forEach(error => {
      toast({
        title: "Validation Error",
        description: error,
        variant: "destructive",
      });
    });
  });
}
```

### Highlight Duplicates

```typescript
if (response.duplicates) {
  response.duplicates.forEach(({ studentId, indices }) => {
    indices.forEach(index => {
      // Highlight row at index
      highlightRow(index, "warning");
    });
  });
}
```

## Server Action Pattern

```typescript
export async function saveMarks(input: SaveMarksInput) {
  try {
    // 1. Get configuration
    const config = await getMarkConfig(input.examId, input.subjectId);
    
    // 2. Validate
    const validation = validateBulkMarks(input.marks, config);
    
    // 3. Check duplicates
    if (validation.duplicates.size > 0) {
      return createErrorResponse(
        "Duplicate entries detected",
        "DUPLICATE_ENTRIES",
        undefined,
        validation.duplicates
      );
    }
    
    // 4. Check validation errors
    if (!validation.isValid) {
      return createErrorResponse(
        "Validation failed",
        "VALIDATION_ERROR",
        formatValidationErrors(validation.errors)
      );
    }
    
    // 5. Save to database
    await db.examResult.createMany({ data: input.marks });
    
    return { success: true };
  } catch (error) {
    return createErrorResponse(
      error.message,
      "DATABASE_ERROR"
    );
  }
}
```

## Testing Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { validateMarkEntry } from '@/lib/utils/marks-validation';

describe('Mark Entry Validation', () => {
  it('should accept valid marks', () => {
    const entry = {
      studentId: "s1",
      theoryMarks: 60,
      isAbsent: false,
    };
    
    const config = {
      theoryMaxMarks: 70,
      totalMarks: 100,
    };
    
    const result = validateMarkEntry(entry, config);
    expect(result.isValid).toBe(true);
  });
  
  it('should reject marks exceeding maximum', () => {
    const entry = {
      studentId: "s1",
      theoryMarks: 80, // Exceeds 70
      isAbsent: false,
    };
    
    const config = {
      theoryMaxMarks: 70,
      totalMarks: 100,
    };
    
    const result = validateMarkEntry(entry, config);
    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe('EXCEEDS_MAXIMUM');
  });
});
```

## Common Scenarios

### Scenario 1: Absent Student

```typescript
const entry = {
  studentId: "s1",
  isAbsent: true,
  // No marks required
};

const result = validateMarkEntry(entry, config);
// result.isValid === true
```

### Scenario 2: Partial Marks

```typescript
const entry = {
  studentId: "s1",
  theoryMarks: 60,
  // practicalMarks not provided
  isAbsent: false,
};

const result = validateMarkEntry(entry, config);
// result.isValid === true (at least one mark provided)
```

### Scenario 3: No Marks for Non-Absent

```typescript
const entry = {
  studentId: "s1",
  // No marks provided
  isAbsent: false,
};

const result = validateMarkEntry(entry, config);
// result.isValid === false
// error.code === 'NO_MARKS_PROVIDED'
```

### Scenario 4: Long Remarks

```typescript
const entry = {
  studentId: "s1",
  theoryMarks: 60,
  remarks: "A".repeat(501), // Too long
  isAbsent: false,
};

const result = validateMarkEntry(entry, config);
// result.isValid === false
// error.code === 'REMARKS_TOO_LONG'
```

## Troubleshooting

### Problem: Validation passes but database fails

**Solution**: Check database constraints match validation rules

### Problem: Duplicate detection not working

**Solution**: Ensure studentId is populated in all entries

### Problem: Error messages not specific enough

**Solution**: Use error.code to provide context-specific messages

### Problem: Performance issues with large datasets

**Solution**: Use `separateValidInvalidEntries()` for partial processing

## Best Practices

1. ✅ Always validate on both client and server
2. ✅ Use error codes for programmatic handling
3. ✅ Display field-specific errors to users
4. ✅ Log validation failures for debugging
5. ✅ Test all validation paths
6. ✅ Handle duplicates gracefully
7. ✅ Provide recovery options
8. ✅ Use transactions for database operations

## Performance Tips

1. Validate in batches for large imports
2. Use `separateValidInvalidEntries()` to save valid entries
3. Cache mark configurations
4. Debounce client-side validation
5. Use indexes for duplicate detection

## Related Documentation

- Full Documentation: `docs/MARKS_VALIDATION_ERROR_HANDLING.md`
- Implementation Summary: `docs/TASK_21_VALIDATION_IMPLEMENTATION_SUMMARY.md`
- Test Suite: `src/lib/utils/__tests__/marks-validation.test.ts`
