# R2 Storage API Routes

This directory contains comprehensive API routes for Cloudflare R2 storage operations, implementing the requirements from the Cloudinary to R2 migration specification.

## Overview

The R2 API provides complete file management functionality with school-based isolation, security controls, and migration capabilities. All routes implement proper authentication, rate limiting, and error handling.

## API Endpoints

### File Operations

#### `/api/r2/upload`
- **POST**: Upload files to R2 with school isolation
- **GET**: Generate presigned URLs for direct client uploads
- Features: File validation, CSRF protection, rate limiting, metadata extraction

#### `/api/r2/files`
- **GET**: Retrieve file information, list files, check existence, get metadata
- **POST**: Batch file operations (retrieve, delete)
- **DELETE**: Delete single files
- Features: School isolation, CDN URL generation, batch processing

#### `/api/r2/presigned-url`
- **GET**: Generate presigned URLs for GET/PUT operations
- **POST**: Batch presigned URL generation
- Features: Secure URL generation, expiration control, file type validation

#### `/api/r2/batch`
- **POST**: Batch operations (upload, delete, retrieve, metadata)
- Features: Multi-file processing, progress tracking, error handling

#### `/api/r2/validate`
- **GET**: Get validation rules, limits, and quota information
- **POST**: Validate files, filenames, and storage quotas
- Features: Pre-upload validation, quota checking, filename sanitization

### Migration Operations

#### `/api/r2/migration`
- **POST**: Start, pause, resume, or cancel migrations
- **GET**: Get migration status, progress, reports, discover assets
- Features: Cloudinary to R2 migration, progress tracking, error recovery

#### `/api/r2/migration/progress`
- **GET**: Detailed migration progress with metrics
- **POST**: Progress management actions (refresh, reset, export)
- Features: Real-time progress, performance metrics, historical data

#### `/api/r2/migration/validate`
- **GET**: Migration validation status and reports
- **POST**: Validate migrated files using checksums
- Features: Integrity verification, batch validation, completeness checks

## Security Features

- **School Isolation**: All operations are scoped to the authenticated user's school
- **Authentication**: Requires valid school access via `requireSchoolAccess()`
- **Rate Limiting**: Configurable rate limits per endpoint and user
- **CSRF Protection**: Token validation for state-changing operations
- **File Validation**: MIME type, size, and format validation
- **Access Control**: Role-based permissions for file operations

## School-Based Folder Structure

Files are organized using a school-based hierarchy:
```
school-{schoolId}/
├── images/
├── documents/
├── students/
├── teachers/
├── events/
├── announcements/
├── certificates/
└── system/
```

## Error Handling

All endpoints implement comprehensive error handling:
- Input validation with detailed error messages
- Graceful degradation for service failures
- Retry logic for transient errors
- Structured error responses with HTTP status codes

## Rate Limiting

Different rate limits are applied based on operation type:
- File uploads: 10 per minute per user
- Presigned URLs: 50 per minute per user
- Batch operations: 10 per minute per user
- Migration operations: 5 per hour per user

## Response Format

All endpoints return consistent JSON responses:
```json
{
  "success": boolean,
  "data": object | null,
  "message": string,
  "error": string | null
}
```

## Dependencies

The API routes depend on the following services:
- `r2StorageService`: Core R2 storage operations
- `uploadHandler`: File upload processing
- `fileManager`: File management operations
- `cloudinaryMigrationService`: Migration functionality
- `storageQuotaService`: Quota management

## Usage Examples

### Upload a file
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('csrf_token', csrfToken);
formData.append('folder', 'images');

const response = await fetch('/api/r2/upload', {
  method: 'POST',
  body: formData
});
```

### Get presigned URL
```javascript
const response = await fetch('/api/r2/presigned-url?operation=PUT&filename=image.jpg&contentType=image/jpeg');
```

### Start migration
```javascript
const response = await fetch('/api/r2/migration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'start', dryRun: false })
});
```

## Requirements Fulfilled

This implementation fulfills the following requirements from the migration specification:
- **2.4**: Presigned URL support for secure file access
- **3.5**: File upload endpoints with validation
- **5.2**: File retrieval and deletion endpoints
- **6.5**: Migration trigger and status endpoints

The API provides a complete foundation for R2 storage operations with proper security, scalability, and maintainability.