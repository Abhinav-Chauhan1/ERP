# Syllabus Document Management API Reference

## Quick Reference Guide for Developers

This guide provides a quick reference for using the syllabus document management server actions.

## Table of Contents

1. [File Type Validation](#file-type-validation)
2. [Upload Single Document](#upload-single-document)
3. [Bulk Upload Documents](#bulk-upload-documents)
4. [Update Document Metadata](#update-document-metadata)
5. [Delete Document](#delete-document)
6. [Reorder Documents](#reorder-documents)
7. [Get Documents by Parent](#get-documents-by-parent)
8. [Error Codes](#error-codes)
9. [Supported File Types](#supported-file-types)

---

## File Type Validation

Validates a file's type and size before upload.

### Function Signature

```typescript
function validateFileType(input: {
  fileType: string;
  fileSize: number;
}): ActionResponse<{ valid: boolean; message?: string }>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fileType | string | Yes | MIME type of the file |
| fileSize | number | Yes | Size of the file in bytes |

### Example

```typescript
import { validateFileType } from '@/lib/actions/syllabusDocumentActions';

const validation = validateFileType({
  fileType: 'application/pdf',
  fileSize: 1024000, // 1MB
});

if (validation.success && validation.data?.valid) {
  // File is valid, proceed with upload
} else {
  // Show error message
  console.error(validation.data?.message);
}
```

### Response

```typescript
{
  success: true,
  data: {
    valid: true | false,
    message?: "Error message if invalid"
  }
}
```

---

## Upload Single Document

Uploads a single document to a module or sub-module.

### Function Signature

```typescript
function uploadDocument(input: {
  title?: string;
  description?: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  moduleId?: string;
  subModuleId?: string;
  uploadedBy: string;
  order?: number;
}): Promise<ActionResponse>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | No | Document title (defaults to filename) |
| description | string | No | Document description |
| filename | string | Yes | Original filename |
| fileUrl | string | Yes | Cloudinary URL of uploaded file |
| fileType | string | Yes | MIME type |
| fileSize | number | Yes | File size in bytes |
| moduleId | string | No* | Parent module ID |
| subModuleId | string | No* | Parent sub-module ID |
| uploadedBy | string | Yes | User ID of uploader |
| order | number | No | Display order (auto-assigned if not provided) |

*Either `moduleId` or `subModuleId` must be provided.

### Example

```typescript
import { uploadDocument } from '@/lib/actions/syllabusDocumentActions';

const result = await uploadDocument({
  title: 'Chapter 1 Introduction',
  description: 'Overview of the chapter',
  filename: 'chapter1.pdf',
  fileUrl: 'https://res.cloudinary.com/your-cloud/...',
  fileType: 'application/pdf',
  fileSize: 1024000,
  moduleId: 'module-123',
  uploadedBy: 'user-456',
});

if (result.success) {
  console.log('Document uploaded:', result.data);
} else {
  console.error('Upload failed:', result.error);
}
```

### Response

```typescript
{
  success: true,
  data: {
    id: "doc-123",
    title: "Chapter 1 Introduction",
    description: "Overview of the chapter",
    filename: "chapter1.pdf",
    fileUrl: "https://...",
    fileType: "application/pdf",
    fileSize: 1024000,
    order: 0,
    moduleId: "module-123",
    subModuleId: null,
    uploadedBy: "user-456",
    createdAt: "2024-12-24T...",
    updatedAt: "2024-12-24T..."
  }
}
```

---

## Bulk Upload Documents

Uploads multiple documents in a single operation.

### Function Signature

```typescript
function bulkUploadDocuments(input: {
  documents: Array<UploadDocumentInput>;
}): Promise<BulkUploadResponse>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| documents | Array | Yes | Array of document upload inputs |

### Example

```typescript
import { bulkUploadDocuments } from '@/lib/actions/syllabusDocumentActions';

const result = await bulkUploadDocuments({
  documents: [
    {
      filename: 'doc1.pdf',
      fileUrl: 'https://...',
      fileType: 'application/pdf',
      fileSize: 1024000,
      moduleId: 'module-123',
      uploadedBy: 'user-456',
    },
    {
      filename: 'doc2.pdf',
      fileUrl: 'https://...',
      fileType: 'application/pdf',
      fileSize: 2048000,
      moduleId: 'module-123',
      uploadedBy: 'user-456',
    },
  ],
});

console.log(`Success: ${result.data?.summary.successful}`);
console.log(`Failed: ${result.data?.summary.failed}`);

// Handle failures
result.data?.failed.forEach(failure => {
  console.error(`${failure.filename}: ${failure.error}`);
});
```

### Response

```typescript
{
  success: true,
  data: {
    successful: [/* array of uploaded documents */],
    failed: [
      { filename: "doc3.pdf", error: "File size exceeds limit" }
    ],
    summary: {
      total: 3,
      successful: 2,
      failed: 1
    }
  }
}
```

---

## Update Document Metadata

Updates a document's title and description without changing the file.

### Function Signature

```typescript
function updateDocumentMetadata(input: {
  id: string;
  title: string;
  description?: string;
}): Promise<ActionResponse>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Document ID |
| title | string | Yes | New title |
| description | string | No | New description |

### Example

```typescript
import { updateDocumentMetadata } from '@/lib/actions/syllabusDocumentActions';

const result = await updateDocumentMetadata({
  id: 'doc-123',
  title: 'Updated Chapter 1 Title',
  description: 'Updated description',
});

if (result.success) {
  console.log('Metadata updated:', result.data);
}
```

### Response

```typescript
{
  success: true,
  data: {
    id: "doc-123",
    title: "Updated Chapter 1 Title",
    description: "Updated description",
    // ... other fields unchanged
  }
}
```

---

## Delete Document

Deletes a document from both database and Cloudinary storage.

### Function Signature

```typescript
function deleteDocument(id: string): Promise<ActionResponse>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Document ID |

### Example

```typescript
import { deleteDocument } from '@/lib/actions/syllabusDocumentActions';

const result = await deleteDocument('doc-123');

if (result.success) {
  console.log('Document deleted');
  
  // Check for storage deletion warning
  if (result.data?.warning) {
    console.warn(result.data.warning);
  }
}
```

### Response

```typescript
{
  success: true,
  data: {
    deletedCount: 1,
    warning?: "Document deleted from database but file removal from storage failed"
  }
}
```

---

## Reorder Documents

Reorders documents within a module or sub-module.

### Function Signature

```typescript
function reorderDocuments(input: {
  parentId: string;
  parentType: 'module' | 'subModule';
  documentOrders: Array<{ id: string; order: number }>;
}): Promise<ActionResponse>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| parentId | string | Yes | Module or sub-module ID |
| parentType | 'module' \| 'subModule' | Yes | Type of parent |
| documentOrders | Array | Yes | Array of document IDs with new orders |

### Example

```typescript
import { reorderDocuments } from '@/lib/actions/syllabusDocumentActions';

const result = await reorderDocuments({
  parentId: 'module-123',
  parentType: 'module',
  documentOrders: [
    { id: 'doc-1', order: 0 },
    { id: 'doc-2', order: 1 },
    { id: 'doc-3', order: 2 },
  ],
});

if (result.success) {
  console.log(`Reordered ${result.data?.updatedCount} documents`);
}
```

### Response

```typescript
{
  success: true,
  data: {
    updatedCount: 3
  }
}
```

---

## Get Documents by Parent

Retrieves all documents for a module or sub-module.

### Function Signature

```typescript
function getDocumentsByParent(
  parentId: string,
  parentType: 'module' | 'subModule'
): Promise<ActionResponse>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| parentId | string | Yes | Module or sub-module ID |
| parentType | 'module' \| 'subModule' | Yes | Type of parent |

### Example

```typescript
import { getDocumentsByParent } from '@/lib/actions/syllabusDocumentActions';

const result = await getDocumentsByParent('module-123', 'module');

if (result.success) {
  result.data?.forEach(doc => {
    console.log(`${doc.order}: ${doc.title}`);
  });
}
```

### Response

```typescript
{
  success: true,
  data: [
    {
      id: "doc-1",
      title: "Document 1",
      order: 0,
      // ... other fields
    },
    {
      id: "doc-2",
      title: "Document 2",
      order: 1,
      // ... other fields
    }
  ]
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Input validation failed |
| INVALID_FILE_TYPE | File type not supported or size exceeds limit |
| PARENT_NOT_FOUND | Module or sub-module not found |
| DOCUMENT_NOT_FOUND | Document not found |
| UPLOAD_ERROR | Failed to upload document |
| UPDATE_ERROR | Failed to update document |
| DELETE_ERROR | Failed to delete document |
| REORDER_ERROR | Failed to reorder documents |
| FETCH_ERROR | Failed to fetch documents |
| INVALID_PARENT | Documents don't belong to specified parent |

---

## Supported File Types

### Documents
- PDF: `application/pdf`
- Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- PowerPoint: `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`

### Images
- JPEG: `image/jpeg`, `image/jpg`
- PNG: `image/png`
- GIF: `image/gif`
- WebP: `image/webp`

### Videos
- MP4: `video/mp4`
- WebM: `video/webm`
- MOV: `video/quicktime`

### File Size Limit
- Maximum: 50MB (52,428,800 bytes)

---

## Common Patterns

### Upload with Client-Side File

```typescript
// 1. Upload to Cloudinary first
import { uploadToCloudinary } from '@/lib/cloudinary';

const file = event.target.files[0];
const cloudinaryResult = await uploadToCloudinary(file, {
  folder: 'syllabus-documents',
  resource_type: 'auto',
});

// 2. Then save to database
const result = await uploadDocument({
  filename: file.name,
  fileUrl: cloudinaryResult.secure_url,
  fileType: file.type,
  fileSize: file.size,
  moduleId: 'module-123',
  uploadedBy: currentUserId,
});
```

### Drag-and-Drop Reordering

```typescript
// After drag-and-drop, update orders
const newOrders = documents.map((doc, index) => ({
  id: doc.id,
  order: index,
}));

await reorderDocuments({
  parentId: moduleId,
  parentType: 'module',
  documentOrders: newOrders,
});
```

### Bulk Upload with Progress

```typescript
const files = Array.from(fileInput.files);
const uploadPromises = files.map(async (file) => {
  // Upload to Cloudinary
  const cloudinaryResult = await uploadToCloudinary(file);
  
  return {
    filename: file.name,
    fileUrl: cloudinaryResult.secure_url,
    fileType: file.type,
    fileSize: file.size,
    moduleId: 'module-123',
    uploadedBy: currentUserId,
  };
});

const documents = await Promise.all(uploadPromises);
const result = await bulkUploadDocuments({ documents });

// Show results
console.log(`Uploaded ${result.data?.summary.successful} of ${result.data?.summary.total}`);
```

---

## TypeScript Types

```typescript
import type {
  UploadDocumentInput,
  BulkUploadDocumentsInput,
  UpdateDocumentMetadataInput,
  ReorderDocumentsInput,
  FileTypeValidationInput,
} from '@/lib/actions/syllabusDocumentActions';

// Use these types for type-safe function calls
const uploadInput: UploadDocumentInput = {
  filename: 'test.pdf',
  fileUrl: 'https://...',
  fileType: 'application/pdf',
  fileSize: 1024,
  moduleId: 'module-123',
  uploadedBy: 'user-456',
};
```

---

## Best Practices

1. **Always validate files client-side first** to provide immediate feedback
2. **Use bulk upload for multiple files** to improve performance
3. **Handle storage deletion failures gracefully** - the database record is already deleted
4. **Provide meaningful titles** instead of relying on filename defaults
5. **Use transactions for reordering** to prevent inconsistent states
6. **Check error codes** to provide specific error messages to users
7. **Invalidate caches** after mutations to ensure UI consistency

---

## Support

For issues or questions, refer to:
- [Implementation Summary](./TASK_4_SYLLABUS_DOCUMENT_ACTIONS_IMPLEMENTATION.md)
- [Enhanced Syllabus Design Document](../.kiro/specs/enhanced-syllabus-system/design.md)
- [Requirements Document](../.kiro/specs/enhanced-syllabus-system/requirements.md)
