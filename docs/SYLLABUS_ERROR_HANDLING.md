# Enhanced Syllabus System - Error Handling Guide

## Overview

This document describes the comprehensive error handling and validation system implemented for the Enhanced Syllabus System. The system provides consistent error responses, detailed validation messages, and robust error recovery mechanisms.

## Architecture

### Core Components

1. **Error Response Formatting** (`syllabus-error-handling.ts`)
   - Standardized error response structure
   - Error code definitions
   - Success/error response types
   - Generic error handling utilities

2. **Validation Utilities** (`syllabus-validation.ts`)
   - Module validation
   - Sub-module validation
   - Document validation
   - Reordering validation
   - Bulk upload validation

3. **Database Error Handling** (`database-error-handler.ts`)
   - Prisma error translation
   - Transaction error handling
   - Retry mechanisms
   - Cascade delete handling

4. **File Storage Error Handling** (`file-storage-error-handler.ts`)
   - Upload error handling
   - Delete error handling
   - Bulk upload processing
   - File validation

5. **Error Logging** (`error-logger.ts`)
   - Structured error logging
   - Context-aware logging
   - Error reporting
   - Monitoring integration

6. **Error Boundary Components** (`syllabus-error-boundary.tsx`)
   - React error boundaries
   - Context-specific error displays
   - Inline error components
   - Form error displays

## Error Response Format

### Standard Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: string;           // Human-readable error message
  code?: string;           // Error code for programmatic handling
  details?: Record<string, any>;  // Additional error details
  timestamp: string;       // ISO timestamp
}
```

### Standard Success Response

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;                 // Response data
  timestamp?: string;      // ISO timestamp
}
```

## Error Codes

### Validation Errors
- `VALIDATION_ERROR` - General validation failure
- `REQUIRED_FIELD` - Required field missing
- `INVALID_TYPE` - Invalid data type
- `INVALID_FORMAT` - Invalid format

### Module Errors
- `DUPLICATE_CHAPTER_NUMBER` - Chapter number already exists
- `MODULE_NOT_FOUND` - Module not found
- `INVALID_MODULE_ORDER` - Invalid module ordering

### Sub-Module Errors
- `SUBMODULE_NOT_FOUND` - Sub-module not found
- `INVALID_SUBMODULE_ORDER` - Invalid sub-module ordering
- `SUBMODULE_PARENT_MISMATCH` - Sub-module doesn't belong to parent

### Document Errors
- `DOCUMENT_NOT_FOUND` - Document not found
- `INVALID_FILE_TYPE` - Unsupported file type
- `FILE_TOO_LARGE` - File exceeds size limit (50MB)
- `UPLOAD_FAILED` - File upload failed
- `DELETE_FAILED` - File deletion failed
- `STORAGE_QUOTA_EXCEEDED` - Storage quota exceeded

### Database Errors
- `CONSTRAINT_VIOLATION` - Database constraint violated
- `CASCADE_DELETE_FAILED` - Cannot delete due to relationships
- `TRANSACTION_FAILED` - Transaction conflict

### Parent Reference Errors
- `SYLLABUS_NOT_FOUND` - Syllabus not found
- `PARENT_NOT_FOUND` - Parent entity not found

## Usage Examples

### 1. Module Creation with Error Handling

```typescript
import { 
  createErrorResponse, 
  createSuccessResponse,
  SyllabusErrorCodes,
  validateModule 
} from "@/lib/utils/syllabus-errors";

export async function createModule(input: CreateModuleInput) {
  try {
    // Validate input
    const validation = validateModule(input);
    if (!validation.isValid) {
      return createErrorResponse(
        validation.errors[0].message,
        validation.errors[0].code,
        { validationErrors: validation.errors }
      );
    }

    // Check for duplicate chapter number
    const existing = await db.module.findUnique({
      where: {
        syllabusId_chapterNumber: {
          syllabusId: input.syllabusId,
          chapterNumber: input.chapterNumber,
        },
      },
    });

    if (existing) {
      return createErrorResponse(
        `Chapter number ${input.chapterNumber} already exists`,
        SyllabusErrorCodes.DUPLICATE_CHAPTER_NUMBER
      );
    }

    // Create module
    const module = await db.module.create({ data: input });
    return createSuccessResponse(module);

  } catch (error) {
    return handleDatabaseError(error);
  }
}
```

### 2. File Upload with Error Handling

```typescript
import {
  withFileUploadErrorHandling,
  validateFileBeforeUpload,
  cleanupOrphanedFile,
} from "@/lib/utils/syllabus-errors";

export async function uploadDocument(file: File, moduleId: string) {
  // Validate file before upload
  const validation = validateFileBeforeUpload(file);
  if (!validation.valid) {
    return validation.error;
  }

  // Upload file
  const uploadResult = await withFileUploadErrorHandling(
    async () => {
      const result = await cloudinary.uploader.upload(file);
      return { url: result.secure_url, publicId: result.public_id };
    },
    file.name
  );

  if (!uploadResult.success) {
    return createErrorResponse(
      uploadResult.error!,
      uploadResult.code!
    );
  }

  // Save to database
  try {
    const document = await db.document.create({
      data: {
        filename: file.name,
        fileUrl: uploadResult.fileUrl!,
        fileType: file.type,
        fileSize: file.size,
        moduleId,
      },
    });
    return createSuccessResponse(document);
  } catch (error) {
    // Cleanup uploaded file if database save fails
    await cleanupOrphanedFile(
      uploadResult.publicId!,
      cloudinary.uploader.destroy
    );
    return handleDatabaseError(error);
  }
}
```

### 3. Transaction with Error Handling

```typescript
import {
  withTransactionErrorHandling,
  retryDatabaseOperation,
} from "@/lib/utils/syllabus-errors";

export async function reorderModules(moduleOrders: ModuleOrder[]) {
  // Use retry mechanism for transaction conflicts
  return await retryDatabaseOperation(async () => {
    return await db.$transaction(
      moduleOrders.map((order) =>
        db.module.update({
          where: { id: order.id },
          data: { order: order.order, chapterNumber: order.chapterNumber },
        })
      )
    );
  });
}
```

### 4. Bulk Upload with Error Tracking

```typescript
import {
  handleBulkUpload,
  validateBulkUpload,
} from "@/lib/utils/syllabus-errors";

export async function bulkUploadDocuments(
  files: File[],
  moduleId: string
) {
  // Validate all files first
  const validation = validateBulkUpload(
    files.map((file) => ({
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      moduleId,
    }))
  );

  if (!validation.isValid) {
    return createErrorResponse(
      `${validation.invalidFiles.length} files failed validation`,
      SyllabusErrorCodes.VALIDATION_ERROR,
      { invalidFiles: validation.invalidFiles }
    );
  }

  // Upload files
  const uploadResult = await handleBulkUpload(
    files.map((file) => ({
      filename: file.name,
      uploadFn: async () => {
        const result = await cloudinary.uploader.upload(file);
        return { url: result.secure_url, publicId: result.public_id };
      },
    }))
  );

  return createSuccessResponse({
    summary: uploadResult.summary,
    results: uploadResult.results,
  });
}
```

### 5. Using Error Boundaries

```typescript
import { 
  SyllabusErrorBoundary,
  withSyllabusErrorBoundary 
} from "@/components/academic/syllabus-error-boundary";

// Wrap component with error boundary
export default function ModuleManagementPage() {
  return (
    <SyllabusErrorBoundary context="module">
      <ModuleList />
    </SyllabusErrorBoundary>
  );
}

// Or use HOC
const SafeModuleList = withSyllabusErrorBoundary(
  ModuleList,
  "module"
);
```

### 6. Inline Error Display

```typescript
import { 
  InlineError,
  FormError,
  LoadingError 
} from "@/components/academic/syllabus-error-boundary";

// Display inline error
{error && <InlineError message={error} onRetry={handleRetry} />}

// Display form validation errors
{validationErrors && <FormError errors={validationErrors} />}

// Display loading error
{loadingError && <LoadingError message="Failed to load modules" onRetry={refetch} />}
```

## Error Logging

### Logging Errors

```typescript
import {
  logModuleError,
  logDocumentError,
  logValidationError,
} from "@/lib/utils/syllabus-errors";

// Log module operation error
try {
  await createModule(data);
} catch (error) {
  logModuleError("create", error, undefined, userId);
  throw error;
}

// Log validation error
const validation = validateModule(data);
if (!validation.isValid) {
  logValidationError("module-creation", validation.errors, userId);
}
```

### Viewing Logs

```typescript
import { errorLogger } from "@/lib/utils/syllabus-errors";

// Get recent logs
const recentLogs = errorLogger.getRecentLogs(10);

// Get logs by context
const moduleLogs = errorLogger.getLogsByContext("module-operations");

// Export logs
const logsJson = errorLogger.exportLogs();
```

## Validation Messages

All validation messages are centralized in `ValidationMessages`:

```typescript
import { ValidationMessages } from "@/lib/utils/syllabus-errors";

// Use predefined messages
const error = ValidationMessages.MODULE_TITLE_REQUIRED;
const error2 = ValidationMessages.INVALID_FILE_TYPE("image/bmp");
const error3 = ValidationMessages.FILE_TOO_LARGE(60000000, 50000000);
```

## Best Practices

1. **Always use standardized error responses**
   - Use `createErrorResponse()` and `createSuccessResponse()`
   - Include appropriate error codes
   - Provide helpful error messages

2. **Validate early**
   - Validate input before database operations
   - Use validation utilities for consistency
   - Return validation errors immediately

3. **Handle database errors properly**
   - Use `handleDatabaseError()` for Prisma errors
   - Implement retry logic for transaction conflicts
   - Check for foreign key violations

4. **Clean up on failure**
   - Delete uploaded files if database save fails
   - Use `cleanupOrphanedFile()` for file cleanup
   - Implement proper rollback mechanisms

5. **Log errors appropriately**
   - Log all errors with context
   - Include user ID when available
   - Use appropriate log levels

6. **Use error boundaries**
   - Wrap components with error boundaries
   - Provide context-specific error messages
   - Allow users to retry operations

7. **Provide user-friendly messages**
   - Avoid exposing technical details to users
   - Suggest corrective actions
   - Include retry options when appropriate

## Testing Error Handling

### Unit Tests

```typescript
import { validateModule, SyllabusErrorCodes } from "@/lib/utils/syllabus-errors";

describe("Module Validation", () => {
  it("should reject module without title", () => {
    const result = validateModule({ chapterNumber: 1, order: 1 });
    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe(SyllabusErrorCodes.REQUIRED_FIELD);
  });

  it("should reject negative chapter number", () => {
    const result = validateModule({
      title: "Test",
      chapterNumber: -1,
      order: 1,
    });
    expect(result.isValid).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe("Module Creation Error Handling", () => {
  it("should return error for duplicate chapter number", async () => {
    await createModule({ title: "Chapter 1", chapterNumber: 1 });
    const result = await createModule({ title: "Chapter 1 Dup", chapterNumber: 1 });
    
    expect(result.success).toBe(false);
    expect(result.code).toBe(SyllabusErrorCodes.DUPLICATE_CHAPTER_NUMBER);
  });
});
```

## Monitoring and Alerting

In production, integrate with monitoring services:

```typescript
import { sendErrorToMonitoring } from "@/lib/utils/syllabus-errors";

try {
  await criticalOperation();
} catch (error) {
  await sendErrorToMonitoring(error, "critical-operation", userId);
  throw error;
}
```

## Summary

The Enhanced Syllabus System error handling provides:

- ✅ Standardized error responses
- ✅ Comprehensive validation
- ✅ Database error translation
- ✅ File storage error handling
- ✅ Structured error logging
- ✅ React error boundaries
- ✅ User-friendly error messages
- ✅ Error recovery mechanisms
- ✅ Monitoring integration support

All error handling follows the design document specifications and provides a consistent, robust error handling experience across the entire syllabus system.
