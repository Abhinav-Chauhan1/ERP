# Teacher Document API Documentation

## Overview

The Teacher Document API provides endpoints for teachers to manage their professional documents including certificates, lesson plans, teaching materials, and other educational resources. All endpoints require authentication via Clerk and verify that the user has a valid teacher role.

## Base URL

```
/api/teacher/documents
```

## Authentication

All endpoints require:
- Valid Clerk authentication token
- User must have an associated Teacher record in the database

Authentication is handled via Clerk's `auth()` function which extracts the `userId` from the session.

## Endpoints

### 1. List Documents

Retrieves a list of documents belonging to the authenticated teacher with optional filtering.

**Endpoint:** `GET /api/teacher/documents`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search term to filter documents by title, description, or filename (case-insensitive) |
| `category` | string | No | Filter by document category. Valid values: `CERTIFICATE`, `ID_PROOF`, `TEACHING_MATERIAL`, `LESSON_PLAN`, `CURRICULUM`, `POLICY`, `OTHER`, `ALL` |

**Response:**

```typescript
{
  documents: Array<{
    id: string;
    title: string;
    description: string | null;
    fileName: string;
    fileUrl: string;
    fileType: string | null;
    fileSize: number | null;
    category: DocumentCategory;
    tags: string | null;
    isPublic: boolean;
    userId: string;
    documentTypeId: string | null;
    createdAt: string;
    updatedAt: string;
    documentType: {
      id: string;
      name: string;
    } | null;
  }>
}
```

**Status Codes:**

- `200 OK` - Documents retrieved successfully
- `401 Unauthorized` - User is not authenticated
- `404 Not Found` - Teacher record not found for authenticated user
- `500 Internal Server Error` - Server error occurred

**Example Request:**

```bash
GET /api/teacher/documents?search=lesson&category=LESSON_PLAN
```

**Example Response:**

```json
{
  "documents": [
    {
      "id": "doc_123abc",
      "title": "Math Lesson Plan - Week 1",
      "description": "Comprehensive lesson plan for algebra basics",
      "fileName": "math-lesson-week1.pdf",
      "fileUrl": "https://res.cloudinary.com/...",
      "fileType": "application/pdf",
      "fileSize": 245678,
      "category": "LESSON_PLAN",
      "tags": "math,algebra,week1",
      "isPublic": false,
      "userId": "user_456def",
      "documentTypeId": null,
      "createdAt": "2025-11-20T10:30:00Z",
      "updatedAt": "2025-11-20T10:30:00Z",
      "documentType": null
    }
  ]
}
```

---

### 2. Create Document

Creates a new document record for the authenticated teacher. Note: File upload to Cloudinary should be handled client-side before calling this endpoint.

**Endpoint:** `POST /api/teacher/documents`

**Authentication:** Required

**Request Body:**

```typescript
{
  title: string;              // Required, 1-200 characters
  description?: string | null; // Optional
  fileName: string;           // Required, minimum 1 character
  fileUrl: string;            // Required, must be valid URL
  fileType?: string | null;   // Optional, MIME type
  fileSize?: number | null;   // Optional, size in bytes (must be positive integer)
  category: DocumentCategory; // Required, one of the enum values
  tags?: string | null;       // Optional, comma-separated tags
  userId: string;             // Required, must match authenticated user's ID
}
```

**Document Categories:**

- `CERTIFICATE` - Professional certificates and credentials
- `ID_PROOF` - Identity verification documents
- `TEACHING_MATERIAL` - General teaching resources
- `LESSON_PLAN` - Structured lesson plans
- `CURRICULUM` - Curriculum documents and syllabi
- `POLICY` - School policies and guidelines
- `OTHER` - Miscellaneous documents

**Response:**

```typescript
{
  document: {
    id: string;
    title: string;
    description: string | null;
    fileName: string;
    fileUrl: string;
    fileType: string | null;
    fileSize: number | null;
    category: DocumentCategory;
    tags: string | null;
    isPublic: boolean;
    userId: string;
    documentTypeId: string | null;
    createdAt: string;
    updatedAt: string;
    documentType: object | null;
  }
}
```

**Status Codes:**

- `201 Created` - Document created successfully
- `400 Bad Request` - Invalid request data (validation errors)
- `401 Unauthorized` - User is not authenticated
- `403 Forbidden` - userId in request doesn't match authenticated user
- `404 Not Found` - Teacher record not found for authenticated user
- `500 Internal Server Error` - Server error occurred

**Validation Rules:**

- `title`: Must be 1-200 characters
- `fileName`: Must be at least 1 character
- `fileUrl`: Must be a valid URL format
- `fileSize`: If provided, must be a positive integer
- `category`: Must be one of the valid enum values
- `userId`: Must match the authenticated user's database ID

**Example Request:**

```bash
POST /api/teacher/documents
Content-Type: application/json

{
  "title": "Teaching Certificate 2025",
  "description": "State teaching certification",
  "fileName": "teaching-cert-2025.pdf",
  "fileUrl": "https://res.cloudinary.com/school-erp/raw/upload/v1234567890/documents/teaching-cert-2025.pdf",
  "fileType": "application/pdf",
  "fileSize": 156789,
  "category": "CERTIFICATE",
  "tags": "certification,teaching,2025",
  "userId": "user_456def"
}
```

**Example Success Response:**

```json
{
  "document": {
    "id": "doc_789xyz",
    "title": "Teaching Certificate 2025",
    "description": "State teaching certification",
    "fileName": "teaching-cert-2025.pdf",
    "fileUrl": "https://res.cloudinary.com/school-erp/raw/upload/v1234567890/documents/teaching-cert-2025.pdf",
    "fileType": "application/pdf",
    "fileSize": 156789,
    "category": "CERTIFICATE",
    "tags": "certification,teaching,2025",
    "isPublic": false,
    "userId": "user_456def",
    "documentTypeId": null,
    "createdAt": "2025-11-25T14:30:00Z",
    "updatedAt": "2025-11-25T14:30:00Z",
    "documentType": null
  }
}
```

**Example Error Response (Validation):**

```json
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "String must contain at least 1 character(s)",
      "path": ["title"]
    }
  ]
}
```

---

### 3. Get Single Document

Retrieves details of a specific document belonging to the authenticated teacher.

**Endpoint:** `GET /api/teacher/documents/:id`

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The unique identifier of the document |

**Response:**

```typescript
{
  document: {
    id: string;
    title: string;
    description: string | null;
    fileName: string;
    fileUrl: string;
    fileType: string | null;
    fileSize: number | null;
    category: DocumentCategory;
    tags: string | null;
    isPublic: boolean;
    userId: string;
    documentTypeId: string | null;
    createdAt: string;
    updatedAt: string;
    documentType: {
      id: string;
      name: string;
    } | null;
    user: {
      firstName: string;
      lastName: string;
    };
  }
}
```

**Response Headers:**

The response includes headers suitable for file download:

- `Content-Type`: The MIME type of the document (from `fileType` field)
- `Content-Disposition`: Attachment header with the original filename

**Status Codes:**

- `200 OK` - Document retrieved successfully
- `401 Unauthorized` - User is not authenticated
- `403 Forbidden` - Document doesn't belong to authenticated user
- `404 Not Found` - Document or teacher record not found
- `500 Internal Server Error` - Server error occurred

**Example Request:**

```bash
GET /api/teacher/documents/doc_123abc
```

**Example Response:**

```json
{
  "document": {
    "id": "doc_123abc",
    "title": "Math Lesson Plan - Week 1",
    "description": "Comprehensive lesson plan for algebra basics",
    "fileName": "math-lesson-week1.pdf",
    "fileUrl": "https://res.cloudinary.com/...",
    "fileType": "application/pdf",
    "fileSize": 245678,
    "category": "LESSON_PLAN",
    "tags": "math,algebra,week1",
    "isPublic": false,
    "userId": "user_456def",
    "documentTypeId": null,
    "createdAt": "2025-11-20T10:30:00Z",
    "updatedAt": "2025-11-20T10:30:00Z",
    "documentType": null,
    "user": {
      "firstName": "John",
      "lastName": "Smith"
    }
  }
}
```

---

### 4. Delete Document

Deletes a document belonging to the authenticated teacher.

**Endpoint:** `DELETE /api/teacher/documents/:id`

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The unique identifier of the document to delete |

**Response:**

```typescript
{
  message: string;
}
```

**Status Codes:**

- `200 OK` - Document deleted successfully
- `401 Unauthorized` - User is not authenticated
- `403 Forbidden` - Document doesn't belong to authenticated user
- `404 Not Found` - Document or teacher record not found
- `500 Internal Server Error` - Server error occurred

**Important Notes:**

- This endpoint deletes both the database record and the file from Cloudinary
- If Cloudinary deletion fails, the operation continues and only logs the error
- The resource type (image, video, raw) is automatically determined from the file's MIME type

**Example Request:**

```bash
DELETE /api/teacher/documents/doc_123abc
```

**Example Response:**

```json
{
  "message": "Document deleted successfully"
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```typescript
{
  error: string;           // Human-readable error message
  details?: any;           // Optional additional error details (e.g., validation errors)
}
```

### Common Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "error": "Unauthorized to delete this document"
}
```

**404 Not Found:**
```json
{
  "error": "Document not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch documents"
}
```

---

## Security Considerations

### Authentication & Authorization

1. **Clerk Authentication**: All endpoints verify the user is authenticated via Clerk
2. **Teacher Verification**: Endpoints verify the user has an associated Teacher record
3. **Ownership Verification**: Users can only access/modify their own documents
4. **User ID Validation**: POST requests validate that the `userId` matches the authenticated user

### Data Privacy

- Documents are marked as `isPublic: false` by default
- Teachers can only view and manage their own documents
- Document access is restricted by user ID at the database query level

### Input Validation

- All POST requests use Zod schemas for type-safe validation
- File URLs must be valid URL format
- File sizes must be positive integers
- Categories must match predefined enum values
- String lengths are enforced (e.g., title max 200 characters)

### File Upload Security

**Client-Side Upload Flow:**

1. Client validates file type and size before upload
2. Client uploads file directly to Cloudinary
3. Client receives secure URL from Cloudinary
4. Client sends document metadata with Cloudinary URL to API

**Recommended Validations:**

- **File Types**: Whitelist allowed MIME types (PDF, DOC, DOCX, images)
- **File Size**: Enforce maximum file size (e.g., 10MB)
- **File Name**: Sanitize filenames to prevent path traversal
- **Cloudinary**: Use signed upload presets for additional security

---

## Database Schema

### Document Model

```prisma
model Document {
  id             String            @id @default(cuid())
  title          String
  description    String?
  fileName       String
  fileUrl        String
  fileType       String?           // MIME type
  fileSize       Int?              // Size in bytes
  user           User              @relation(fields: [userId], references: [id])
  userId         String
  documentType   DocumentType?     @relation(fields: [documentTypeId], references: [id])
  documentTypeId String?
  category       DocumentCategory?
  isPublic       Boolean           @default(false)
  tags           String?           // Comma-separated tags
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @default(now())

  @@index([userId])
  @@index([documentTypeId])
  @@index([category])
  @@index([createdAt])
}

enum DocumentCategory {
  CERTIFICATE
  ID_PROOF
  TEACHING_MATERIAL
  LESSON_PLAN
  CURRICULUM
  POLICY
  OTHER
}
```

### Indexes

The following indexes are defined for optimal query performance:

- `userId` - For filtering documents by user
- `documentTypeId` - For filtering by document type
- `category` - For filtering by category
- `createdAt` - For sorting by creation date

---

## Integration with Cloudinary

### Upload Flow

1. **Client-Side Upload**:
   ```typescript
   import { uploadToCloudinary } from '@/lib/cloudinary';
   
   const result = await uploadToCloudinary(file, {
     folder: 'teacher-documents',
     resource_type: 'auto'
   });
   ```

2. **Create Document Record**:
   ```typescript
   const response = await fetch('/api/teacher/documents', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       title: 'My Document',
       fileName: file.name,
       fileUrl: result.secure_url,
       fileType: file.type,
       fileSize: file.size,
       category: 'TEACHING_MATERIAL',
       userId: currentUser.id
     })
   });
   ```

### Delete Flow

The DELETE endpoint automatically handles file deletion from Cloudinary:

```typescript
import { getCloudinaryPublicId, deleteFromCloudinary } from '@/lib/cloudinary';

// Extract public ID from Cloudinary URL
const publicId = getCloudinaryPublicId(document.fileUrl);

if (publicId) {
  // Determine resource type from MIME type
  const resourceType = document.fileType?.startsWith('image/') 
    ? 'image' 
    : document.fileType?.startsWith('video/')
    ? 'video'
    : 'raw';
  
  // Delete from Cloudinary (errors are logged but don't fail the operation)
  await deleteFromCloudinary(publicId, resourceType);
}

// Delete from database
await db.document.delete({ where: { id: params.id } });
```

**Error Handling:** If Cloudinary deletion fails, the error is logged but the database deletion proceeds. This ensures documents can be removed even if there are temporary Cloudinary issues.

---

## Usage Examples

### React Component Example

```typescript
'use client';

import { useState } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinary';

export function DocumentUploadForm({ userId }: { userId: string }) {
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const file = formData.get('file') as File;
      const title = formData.get('title') as string;
      const category = formData.get('category') as string;

      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(file, {
        folder: 'teacher-documents',
        resource_type: 'auto'
      });

      // Create document record
      const response = await fetch('/api/teacher/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          fileName: file.name,
          fileUrl: cloudinaryResult.secure_url,
          fileType: file.type,
          fileSize: file.size,
          category,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const data = await response.json();
      console.log('Document created:', data.document);
      
      // Reset form or redirect
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="title" required />
      <select name="category" required>
        <option value="CERTIFICATE">Certificate</option>
        <option value="LESSON_PLAN">Lesson Plan</option>
        <option value="TEACHING_MATERIAL">Teaching Material</option>
      </select>
      <input type="file" name="file" required />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Document'}
      </button>
    </form>
  );
}
```

### Fetching Documents Example

```typescript
async function getTeacherDocuments(search?: string, category?: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);

  const response = await fetch(`/api/teacher/documents?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }

  const data = await response.json();
  return data.documents;
}
```

---

## Future Enhancements

### Recommended Improvements

1. **Document Sharing**
   - Add endpoint to share documents with other teachers
   - Implement permission levels (view, download, edit)

2. **Version Control**
   - Track document versions
   - Allow reverting to previous versions

3. **Bulk Operations**
   - Add endpoint for bulk document upload
   - Add endpoint for bulk document deletion

4. **Advanced Search**
   - Full-text search across document content
   - Filter by date ranges
   - Sort by multiple fields

5. **Document Preview**
   - Generate thumbnails for documents
   - Implement in-browser preview for PDFs and images

6. **Rate Limiting**
   - Implement rate limiting on upload endpoints
   - Prevent abuse and excessive storage usage

7. **Audit Logging**
   - Log all document operations (create, read, delete)
   - Track who accessed which documents and when

---

## Testing

### Manual Testing Checklist

- [ ] Authenticate as a teacher user
- [ ] Upload a document with valid data
- [ ] Upload a document with invalid data (verify validation)
- [ ] List all documents
- [ ] Search documents by title
- [ ] Filter documents by category
- [ ] Get a single document
- [ ] Try to access another teacher's document (verify 403)
- [ ] Delete a document
- [ ] Try to delete another teacher's document (verify 403)
- [ ] Test with unauthenticated request (verify 401)

### Automated Testing

Property-based tests should verify:

- Document upload validation (Property 2)
- Document search filtering (Property 3)
- Document deletion completeness (Property 4)
- Document download headers (Property 5)

---

## Support

For issues or questions about the Teacher Document API:

1. Check the error response for specific details
2. Verify authentication and authorization
3. Validate request data against schemas
4. Check server logs for detailed error messages
5. Ensure Cloudinary configuration is correct

---

**Last Updated:** November 25, 2025  
**API Version:** 1.0  
**Spec Feature:** teacher-dashboard-completion
