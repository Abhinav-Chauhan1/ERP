# Enhanced Syllabus System - API Reference

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Module Management](#module-management)
4. [Sub-Module Management](#sub-module-management)
5. [Document Management](#document-management)
6. [Progress Tracking](#progress-tracking)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

## Overview

The Enhanced Syllabus System provides a RESTful API for managing curriculum content. All endpoints are implemented as Next.js Server Actions for type safety and automatic validation.

### Base URL

```
/api/admin/syllabus
```

### Content Type

All requests and responses use JSON:
```
Content-Type: application/json
```

### Response Format

All responses follow this structure:

**Success Response**:
```typescript
{
  success: true,
  data: T // Type varies by endpoint
}
```

**Error Response**:
```typescript
{
  success: false,
  error: string,
  code?: string,
  details?: Record<string, any>
}
```

## Authentication

All API endpoints require authentication. Include the session token in your requests.

### Authorization Levels

| Role | Permissions |
|------|-------------|
| Admin | Full CRUD on all entities |
| Teacher | Read all, Write progress tracking only |
| Student | Read-only access |

### Example Authentication

```typescript
import { auth } from '@clerk/nextjs';

const { userId } = auth();
if (!userId) {
  return { success: false, error: 'Unauthorized' };
}
```

## Module Management

### Create Module

Create a new module (chapter) within a syllabus.

**Endpoint**: `createModule`

**Method**: Server Action

**Request Body**:
```typescript
{
  title: string;           // Required, max 255 chars
  description?: string;    // Optional
  chapterNumber: number;   // Required, unique within syllabus
  order: number;           // Required, display order
  syllabusId: string;      // Required, valid syllabus ID
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    id: string;
    title: string;
    description: string | null;
    chapterNumber: number;
    order: number;
    syllabusId: string;
    createdAt: Date;
    updatedAt: Date;
  }
}
```

**Example**:
```typescript
const result = await createModule({
  title: "Introduction to Algebra",
  description: "Basic algebraic concepts and operations",
  chapterNumber: 1,
  order: 1,
  syllabusId: "clx123abc"
});
```

**Errors**:
- `400`: Invalid input data
- `409`: Chapter number already exists
- `404`: Syllabus not found
- `403`: Insufficient permissions

---

### Update Module

Update an existing module.

**Endpoint**: `updateModule`

**Method**: Server Action

**Request Body**:
```typescript
{
  id: string;              // Required, module ID
  title: string;           // Required
  description?: string;    // Optional
  chapterNumber: number;   // Required
  order: number;           // Required
  syllabusId: string;      // Required
}
```

**Response**:
```typescript
{
  success: true,
  data: Module // Updated module object
}
```

**Example**:
```typescript
const result = await updateModule({
  id: "clx456def",
  title: "Advanced Algebra",
  description: "Complex algebraic concepts",
  chapterNumber: 1,
  order: 1,
  syllabusId: "clx123abc"
});
```

**Errors**:
- `400`: Invalid input data
- `404`: Module not found
- `409`: Chapter number conflict
- `403`: Insufficient permissions

---

### Delete Module

Delete a module and all associated sub-modules and documents.

**Endpoint**: `deleteModule`

**Method**: Server Action

**Request Body**:
```typescript
{
  id: string; // Required, module ID
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    message: "Module deleted successfully"
  }
}
```

**Example**:
```typescript
const result = await deleteModule({ id: "clx456def" });
```

**Errors**:
- `404`: Module not found
- `403`: Insufficient permissions
- `500`: Cascade deletion failed

---

### Get Modules by Syllabus

Retrieve all modules for a syllabus, ordered by chapter number.

**Endpoint**: `getModulesBySyllabus`

**Method**: Server Action

**Request Body**:
```typescript
{
  syllabusId: string; // Required
}
```

**Response**:
```typescript
{
  success: true,
  data: Module[] // Array of modules
}
```

**Example**:
```typescript
const result = await getModulesBySyllabus({ 
  syllabusId: "clx123abc" 
});
```

**Errors**:
- `404`: Syllabus not found
- `403`: Insufficient permissions

---

### Reorder Modules

Update the order of multiple modules.

**Endpoint**: `reorderModules`

**Method**: Server Action

**Request Body**:
```typescript
{
  syllabusId: string;
  moduleOrders: Array<{
    id: string;
    order: number;
    chapterNumber: number;
  }>;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    message: "Modules reordered successfully",
    updated: number // Count of updated modules
  }
}
```

**Example**:
```typescript
const result = await reorderModules({
  syllabusId: "clx123abc",
  moduleOrders: [
    { id: "mod1", order: 2, chapterNumber: 2 },
    { id: "mod2", order: 1, chapterNumber: 1 }
  ]
});
```

**Errors**:
- `400`: Invalid order data
- `404`: Module not found
- `403`: Insufficient permissions

## Sub-Module Management

### Create Sub-Module

Create a new sub-module (topic) within a module.

**Endpoint**: `createSubModule`

**Method**: Server Action

**Request Body**:
```typescript
{
  title: string;        // Required, max 255 chars
  description?: string; // Optional
  order: number;        // Required, display order
  moduleId: string;     // Required, parent module ID
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    id: string;
    title: string;
    description: string | null;
    order: number;
    moduleId: string;
    createdAt: Date;
    updatedAt: Date;
  }
}
```

**Example**:
```typescript
const result = await createSubModule({
  title: "Linear Equations",
  description: "Solving equations with one variable",
  order: 1,
  moduleId: "clx456def"
});
```

**Errors**:
- `400`: Invalid input data
- `404`: Module not found
- `403`: Insufficient permissions

---

### Update Sub-Module

Update an existing sub-module.

**Endpoint**: `updateSubModule`

**Method**: Server Action

**Request Body**:
```typescript
{
  id: string;           // Required, sub-module ID
  title: string;        // Required
  description?: string; // Optional
  order: number;        // Required
  moduleId: string;     // Required
}
```

**Response**:
```typescript
{
  success: true,
  data: SubModule // Updated sub-module object
}
```

**Example**:
```typescript
const result = await updateSubModule({
  id: "clx789ghi",
  title: "Quadratic Equations",
  description: "Solving second-degree equations",
  order: 2,
  moduleId: "clx456def"
});
```

**Errors**:
- `400`: Invalid input data
- `404`: Sub-module not found
- `403`: Insufficient permissions

---

### Delete Sub-Module

Delete a sub-module and all associated documents.

**Endpoint**: `deleteSubModule`

**Method**: Server Action

**Request Body**:
```typescript
{
  id: string; // Required, sub-module ID
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    message: "Sub-module deleted successfully"
  }
}
```

**Example**:
```typescript
const result = await deleteSubModule({ id: "clx789ghi" });
```

**Errors**:
- `404`: Sub-module not found
- `403`: Insufficient permissions
- `500`: Cascade deletion failed

---

### Move Sub-Module

Move a sub-module to a different parent module.

**Endpoint**: `moveSubModule`

**Method**: Server Action

**Request Body**:
```typescript
{
  subModuleId: string;    // Required
  targetModuleId: string; // Required, new parent
  order: number;          // Required, position in new parent
}
```

**Response**:
```typescript
{
  success: true,
  data: SubModule // Updated sub-module
}
```

**Example**:
```typescript
const result = await moveSubModule({
  subModuleId: "clx789ghi",
  targetModuleId: "clx999jkl",
  order: 3
});
```

**Errors**:
- `400`: Invalid input data
- `404`: Sub-module or target module not found
- `403`: Insufficient permissions

---

### Reorder Sub-Modules

Update the order of sub-modules within a module.

**Endpoint**: `reorderSubModules`

**Method**: Server Action

**Request Body**:
```typescript
{
  moduleId: string;
  subModuleOrders: Array<{
    id: string;
    order: number;
  }>;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    message: "Sub-modules reordered successfully",
    updated: number
  }
}
```

**Example**:
```typescript
const result = await reorderSubModules({
  moduleId: "clx456def",
  subModuleOrders: [
    { id: "sub1", order: 2 },
    { id: "sub2", order: 1 }
  ]
});
```

**Errors**:
- `400`: Invalid order data
- `404`: Sub-module not found
- `403`: Insufficient permissions

## Document Management

### Upload Document

Upload a single document to a module or sub-module.

**Endpoint**: `uploadDocument`

**Method**: Server Action

**Request Body** (FormData):
```typescript
{
  file: File;              // Required, max 50MB
  title?: string;          // Optional, defaults to filename
  description?: string;    // Optional
  moduleId?: string;       // Required if subModuleId not provided
  subModuleId?: string;    // Required if moduleId not provided
  uploadedBy: string;      // Required, user ID
}
```

**Supported File Types**:
- Documents: `.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx`
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Videos: `.mp4`, `.webm`, `.mov`

**Response**:
```typescript
{
  success: true,
  data: {
    id: string;
    title: string;
    description: string | null;
    filename: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    order: number;
    moduleId: string | null;
    subModuleId: string | null;
    uploadedBy: string;
    createdAt: Date;
    updatedAt: Date;
  }
}
```

**Example**:
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('title', 'Chapter 1 Notes');
formData.append('description', 'Introduction notes');
formData.append('moduleId', 'clx456def');
formData.append('uploadedBy', userId);

const result = await uploadDocument(formData);
```

**Errors**:
- `400`: Invalid file type or size
- `404`: Module or sub-module not found
- `403`: Insufficient permissions
- `500`: Upload failed

---

### Bulk Upload Documents

Upload multiple documents at once.

**Endpoint**: `bulkUploadDocuments`

**Method**: Server Action

**Request Body** (FormData):
```typescript
{
  files: File[];           // Required, array of files
  moduleId?: string;       // Required if subModuleId not provided
  subModuleId?: string;    // Required if moduleId not provided
  uploadedBy: string;      // Required, user ID
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    successful: Document[];  // Successfully uploaded documents
    failed: Array<{
      filename: string;
      error: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    }
  }
}
```

**Example**:
```typescript
const formData = new FormData();
files.forEach(file => formData.append('files', file));
formData.append('moduleId', 'clx456def');
formData.append('uploadedBy', userId);

const result = await bulkUploadDocuments(formData);
```

**Errors**:
- `400`: Invalid input data
- `404`: Module or sub-module not found
- `403`: Insufficient permissions

---

### Update Document Metadata

Update a document's title and description without changing the file.

**Endpoint**: `updateDocumentMetadata`

**Method**: Server Action

**Request Body**:
```typescript
{
  id: string;           // Required, document ID
  title: string;        // Required
  description?: string; // Optional
}
```

**Response**:
```typescript
{
  success: true,
  data: Document // Updated document object
}
```

**Example**:
```typescript
const result = await updateDocumentMetadata({
  id: "clxabc123",
  title: "Updated Chapter Notes",
  description: "Revised introduction notes"
});
```

**Errors**:
- `400`: Invalid input data
- `404`: Document not found
- `403`: Insufficient permissions

---

### Delete Document

Delete a document from both database and cloud storage.

**Endpoint**: `deleteDocument`

**Method**: Server Action

**Request Body**:
```typescript
{
  id: string; // Required, document ID
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    message: "Document deleted successfully"
  }
}
```

**Example**:
```typescript
const result = await deleteDocument({ id: "clxabc123" });
```

**Errors**:
- `404`: Document not found
- `403`: Insufficient permissions
- `500`: Storage deletion failed

---

### Reorder Documents

Update the display order of documents.

**Endpoint**: `reorderDocuments`

**Method**: Server Action

**Request Body**:
```typescript
{
  parentId: string;              // Module or sub-module ID
  parentType: 'module' | 'subModule';
  documentOrders: Array<{
    id: string;
    order: number;
  }>;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    message: "Documents reordered successfully",
    updated: number
  }
}
```

**Example**:
```typescript
const result = await reorderDocuments({
  parentId: "clx456def",
  parentType: "module",
  documentOrders: [
    { id: "doc1", order: 2 },
    { id: "doc2", order: 1 }
  ]
});
```

**Errors**:
- `400`: Invalid order data
- `404`: Document not found
- `403`: Insufficient permissions

## Progress Tracking

### Mark Sub-Module Complete

Mark a sub-module as completed or incomplete.

**Endpoint**: `markSubModuleComplete`

**Method**: Server Action

**Request Body**:
```typescript
{
  subModuleId: string; // Required
  teacherId: string;   // Required
  completed: boolean;  // Required, true or false
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    id: string;
    subModuleId: string;
    teacherId: string;
    completed: boolean;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }
}
```

**Example**:
```typescript
const result = await markSubModuleComplete({
  subModuleId: "clx789ghi",
  teacherId: userId,
  completed: true
});
```

**Errors**:
- `400`: Invalid input data
- `404`: Sub-module not found
- `403`: Insufficient permissions

---

### Get Module Progress

Get completion progress for a specific module.

**Endpoint**: `getModuleProgress`

**Method**: Server Action

**Request Body**:
```typescript
{
  moduleId: string;  // Required
  teacherId: string; // Required
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    moduleId: string;
    totalSubModules: number;
    completedSubModules: number;
    completionPercentage: number; // 0-100
  }
}
```

**Example**:
```typescript
const result = await getModuleProgress({
  moduleId: "clx456def",
  teacherId: userId
});
```

**Errors**:
- `404`: Module not found
- `403`: Insufficient permissions

---

### Get Syllabus Progress

Get overall completion progress for a syllabus.

**Endpoint**: `getSyllabusProgress`

**Method**: Server Action

**Request Body**:
```typescript
{
  syllabusId: string; // Required
  teacherId: string;  // Required
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    syllabusId: string;
    totalModules: number;
    completedModules: number;
    completionPercentage: number; // 0-100
    modules: Array<{
      moduleId: string;
      totalSubModules: number;
      completedSubModules: number;
      completionPercentage: number;
    }>;
  }
}
```

**Example**:
```typescript
const result = await getSyllabusProgress({
  syllabusId: "clx123abc",
  teacherId: userId
});
```

**Errors**:
- `404`: Syllabus not found
- `403`: Insufficient permissions

## Error Handling

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `NOT_FOUND` | Resource not found | 404 |
| `UNAUTHORIZED` | Not authenticated | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `CONFLICT` | Duplicate or constraint violation | 409 |
| `FILE_TOO_LARGE` | File exceeds size limit | 413 |
| `UNSUPPORTED_FILE_TYPE` | Invalid file type | 415 |
| `STORAGE_ERROR` | Cloud storage operation failed | 500 |
| `DATABASE_ERROR` | Database operation failed | 500 |
| `INTERNAL_ERROR` | Unexpected server error | 500 |

### Error Response Examples

**Validation Error**:
```json
{
  "success": false,
  "error": "Invalid input data",
  "code": "VALIDATION_ERROR",
  "details": {
    "title": "Title is required",
    "chapterNumber": "Must be a positive integer"
  }
}
```

**Not Found Error**:
```json
{
  "success": false,
  "error": "Module with ID clx456def not found",
  "code": "NOT_FOUND"
}
```

**Conflict Error**:
```json
{
  "success": false,
  "error": "Chapter number 3 already exists in this syllabus",
  "code": "CONFLICT"
}
```

**File Error**:
```json
{
  "success": false,
  "error": "File type .exe is not supported",
  "code": "UNSUPPORTED_FILE_TYPE",
  "details": {
    "supportedTypes": [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".jpg", ".png", ".mp4"]
  }
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Read operations | 100 requests | 1 minute |
| Write operations | 30 requests | 1 minute |
| File uploads | 10 requests | 1 minute |
| Bulk operations | 5 requests | 1 minute |

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

**Rate Limit Exceeded Response**:
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retryAfter": 60
  }
}
```

## Best Practices

1. **Use transactions**: For operations affecting multiple entities
2. **Validate input**: Always validate on both client and server
3. **Handle errors gracefully**: Provide meaningful error messages
4. **Implement retry logic**: For transient failures
5. **Cache responses**: Use React Query or similar for client-side caching
6. **Optimize queries**: Use eager loading for related data
7. **Monitor performance**: Track API response times
8. **Respect rate limits**: Implement exponential backoff

## Examples

### Complete Workflow Example

```typescript
// 1. Create a module
const module = await createModule({
  title: "Introduction to Calculus",
  description: "Basic calculus concepts",
  chapterNumber: 1,
  order: 1,
  syllabusId: "syllabus-id"
});

// 2. Create sub-modules
const subModule1 = await createSubModule({
  title: "Limits",
  description: "Understanding limits",
  order: 1,
  moduleId: module.data.id
});

const subModule2 = await createSubModule({
  title: "Derivatives",
  description: "Introduction to derivatives",
  order: 2,
  moduleId: module.data.id
});

// 3. Upload documents
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('title', 'Limits Notes');
formData.append('subModuleId', subModule1.data.id);
formData.append('uploadedBy', userId);

const document = await uploadDocument(formData);

// 4. Track progress
await markSubModuleComplete({
  subModuleId: subModule1.data.id,
  teacherId: userId,
  completed: true
});

// 5. Get progress
const progress = await getSyllabusProgress({
  syllabusId: "syllabus-id",
  teacherId: userId
});

console.log(`Syllabus completion: ${progress.data.completionPercentage}%`);
```

---

**Last Updated**: December 2024  
**Version**: 1.0
