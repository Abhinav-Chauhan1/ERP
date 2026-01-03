# Marks Entry Validation and Error Handling

## Overview

This document describes the comprehensive validation and error handling system implemented for the offline exam marks entry system. The implementation satisfies Requirements 16.1, 16.2, 16.3, 16.4, and 16.5.

## Architecture

The validation system consists of three main components:

1. **Schema Validation** (`src/lib/schemaValidation/marksEntrySchemaValidation.ts`)
   - Zod-based schemas for type-safe validation
   - Input validation at the API boundary

2. **Business Logic Validation** (`src/lib/utils/marks-validation.ts`)
   - Comprehensive validation functions
   - Error detection and formatting
   - Duplicate detection
   - Error recovery mechanisms

3. **Action Layer Integration** (`src/lib/actions/marksEntryActions.ts`, `src/lib/actions/importMarksActions.ts`)
   - Integration of validation into server actions
   - Standardized error responses
   - Transaction management

## Validation Rules

### 1. Numeric Validation (Requirement 16.1)

**Rule**: Marks must be numeric and non-negative

```typescript
// Valid
theoryMarks: 50
theoryMarks: 0
theoryMarks: 100.5

// Invalid
theoryMarks: -5      // Error: Cannot be negative
theoryMarks: "abc"   // Error: Must be a number
theoryMarks: NaN     // Error: Must be a valid number
```

**Error Code**: `INVALID_TYPE` or `NEGATIVE_VALUE`

**Error Message Examples**:
- "Theory marks must be a valid number"
- "Theory marks cannot be negative"

### 2. Maximum Marks Validation (Requirement 16.2)

**Rule**: Marks cannot exceed configured maximum for each component

```typescript
// Configuration
config = {
  theoryMaxMarks: 70,
  practicalMaxMarks: 30,
  totalMarks: 100
}

// Valid
theoryMarks: 70      // Equals maximum
theoryMarks: 50      // Below maximum

// Invalid
theoryMarks: 75      // Error: Exceeds maximum (70)
```

**Error Code**: `EXCEEDS_MAXIMUM`

**Error Message Example**:
- "Theory marks (75) exceeds maximum allowed (70)"

### 3. Required Field Validation (Requirement 16.3)

**Rule**: Required fields must be present and non-empty

```typescript
// Required fields
- studentId: Must be present for all entries
- At least one mark component (theory/practical/internal) for non-absent students

// Valid
{
  studentId: "student123",
  theoryMarks: 60,
  isAbsent: false
}

// Invalid
{
  studentId: "",           // Error: Student ID is required
  theoryMarks: 60,
  isAbsent: false
}

{
  studentId: "student123",
  isAbsent: false          // Error: At least one mark required
}
```

**Error Code**: `REQUIRED_FIELD` or `NO_MARKS_PROVIDED`

**Error Message Examples**:
- "Student ID is required"
- "At least one mark component is required for non-absent students"

### 4. Duplicate Detection (Requirement 16.4)

**Rule**: Detect and warn about duplicate student entries

```typescript
// Duplicate entries
[
  { studentId: "student1", theoryMarks: 60 },
  { studentId: "student2", theoryMarks: 70 },
  { studentId: "student1", theoryMarks: 80 }  // Duplicate!
]

// Detection result
{
  duplicates: {
    "student1": [0, 2]  // Found at indices 0 and 2
  }
}
```

**Error Code**: `DUPLICATE_ENTRIES`

**Error Response**:
```json
{
  "success": false,
  "error": "Duplicate entries detected",
  "code": "DUPLICATE_ENTRIES",
  "duplicates": [
    {
      "studentId": "student1",
      "indices": [0, 2]
    }
  ],
  "timestamp": "2024-12-24T10:30:00Z"
}
```

### 5. Specific Error Messages (Requirement 16.5)

**Rule**: Each validation failure must have a specific, actionable error message

All validation errors include:
- **Field**: The specific field that failed validation
- **Message**: Human-readable description of the error
- **Code**: Machine-readable error code
- **Value**: The invalid value (when applicable)

## Error Response Format

### Standard Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: string;              // High-level error description
  code: string;               // Error code for programmatic handling
  details?: Record<string, string[]>;  // Field-specific errors
  duplicates?: Array<{        // Duplicate detection results
    studentId: string;
    indices: number[];
  }>;
  timestamp: string;          // ISO 8601 timestamp
}
```

### Example Error Responses

#### Validation Error

```json
{
  "success": false,
  "error": "Validation failed for one or more entries",
  "code": "VALIDATION_ERROR",
  "details": {
    "student_0": [
      "Theory marks (80) exceeds maximum allowed (70)"
    ],
    "student_1": [
      "Student ID is required",
      "At least one mark component is required for non-absent students"
    ]
  },
  "timestamp": "2024-12-24T10:30:00Z"
}
```

#### Duplicate Entry Error

```json
{
  "success": false,
  "error": "Duplicate entries detected",
  "code": "DUPLICATE_ENTRIES",
  "details": {
    "duplicate_student123": [
      "Duplicate entries found for student student123 at positions: 0, 3, 5"
    ]
  },
  "duplicates": [
    {
      "studentId": "student123",
      "indices": [0, 3, 5]
    }
  ],
  "timestamp": "2024-12-24T10:30:00Z"
}
```

#### Database Error

```json
{
  "success": false,
  "error": "Invalid reference: Student or exam not found",
  "code": "INVALID_REFERENCE",
  "timestamp": "2024-12-24T10:30:00Z"
}
```

## Error Codes Reference

| Code | Description | User Action |
|------|-------------|-------------|
| `REQUIRED_FIELD` | A required field is missing | Fill in the required field |
| `INVALID_TYPE` | Value is not the correct type | Provide a valid number |
| `NEGATIVE_VALUE` | Marks cannot be negative | Enter a non-negative value |
| `EXCEEDS_MAXIMUM` | Marks exceed configured maximum | Reduce marks to within maximum |
| `INVALID_FORMAT` | Data format is incorrect | Check data format |
| `DUPLICATE_ENTRY` | Duplicate student entry detected | Remove duplicate entries |
| `MISSING_CONFIGURATION` | Mark configuration not found | Configure subject marks first |
| `COMPONENT_SUM_MISMATCH` | Component sum doesn't equal total | Adjust component maximums |
| `REMARKS_TOO_LONG` | Remarks exceed 500 characters | Shorten remarks |
| `NO_MARKS_PROVIDED` | No marks for non-absent student | Enter at least one mark component |
| `UNAUTHORIZED` | User not authenticated | Log in again |
| `USER_NOT_FOUND` | User record not found | Contact administrator |
| `EXAM_NOT_FOUND` | Exam not found | Select a valid exam |
| `DATABASE_DUPLICATE` | Database constraint violation | Check for existing records |
| `INVALID_REFERENCE` | Foreign key constraint failed | Verify student/exam exists |
| `DATABASE_ERROR` | Database operation failed | Try again or contact support |
| `UNKNOWN_ERROR` | Unexpected error occurred | Contact support |

## Error Recovery Mechanisms

### 1. Partial Save Support

When bulk saving marks, the system can separate valid and invalid entries:

```typescript
const { valid, invalid } = separateValidInvalidEntries(entries, config);

// Save valid entries
// Report errors for invalid entries
```

### 2. Transaction Rollback

All database operations use transactions to ensure data consistency:

```typescript
await db.$transaction(async (tx) => {
  // All operations succeed or all fail
});
```

### 3. Audit Logging

All marks entry operations are logged for recovery and auditing:

```typescript
await logUpdate(userId, "ExamResult", resultId, {
  before: { /* previous values */ },
  after: { /* new values */ }
});
```

### 4. Draft Mode

Users can save incomplete entries as drafts:

```typescript
{
  isDraft: true  // Allows saving without full validation
}
```

## Usage Examples

### Frontend Validation

```typescript
import { studentMarkEntrySchema } from '@/lib/schemaValidation/marksEntrySchemaValidation';

// Validate before submission
const result = studentMarkEntrySchema.safeParse(formData);
if (!result.success) {
  // Display validation errors
  const errors = result.error.flatten();
}
```

### Server-Side Validation

```typescript
import { validateBulkMarks } from '@/lib/utils/marks-validation';

// Validate marks entries
const validation = validateBulkMarks(entries, config);

if (!validation.isValid) {
  // Return formatted errors
  return createErrorResponse(
    "Validation failed",
    "VALIDATION_ERROR",
    formatValidationErrors(validation.errors)
  );
}
```

### Error Handling in UI

```typescript
// Handle error response
if (!response.success) {
  if (response.code === 'VALIDATION_ERROR' && response.details) {
    // Display field-specific errors
    Object.entries(response.details).forEach(([field, errors]) => {
      showFieldErrors(field, errors);
    });
  } else if (response.code === 'DUPLICATE_ENTRIES' && response.duplicates) {
    // Highlight duplicate entries
    response.duplicates.forEach(({ studentId, indices }) => {
      highlightDuplicates(indices);
    });
  } else {
    // Show general error
    showError(response.error);
  }
}
```

## Testing

Comprehensive test coverage is provided in `src/lib/utils/__tests__/marks-validation.test.ts`:

- ✅ Numeric validation (positive, negative, non-numeric)
- ✅ Maximum validation (within, exceeding, no maximum)
- ✅ Required field validation
- ✅ Remarks length validation
- ✅ Component sum validation
- ✅ Complete mark entry validation
- ✅ Duplicate detection
- ✅ Bulk validation
- ✅ Error formatting
- ✅ Error response creation
- ✅ Valid/invalid entry separation

Run tests:
```bash
npm test -- src/lib/utils/__tests__/marks-validation.test.ts --run
```

## Best Practices

1. **Validate Early**: Validate on the client side before submission
2. **Validate Again**: Always validate on the server side
3. **Be Specific**: Provide specific error messages with field names and values
4. **Be Helpful**: Include suggestions for fixing errors
5. **Log Everything**: Log all validation failures for debugging
6. **Use Transactions**: Wrap database operations in transactions
7. **Handle Gracefully**: Provide recovery options for users
8. **Test Thoroughly**: Test all validation paths and edge cases

## Future Enhancements

1. **Batch Validation**: Validate large imports in batches
2. **Async Validation**: Validate against database constraints asynchronously
3. **Custom Rules**: Allow schools to define custom validation rules
4. **Validation Profiles**: Different validation rules for different exam types
5. **Smart Suggestions**: Suggest corrections for common errors
6. **Validation History**: Track validation failures over time
