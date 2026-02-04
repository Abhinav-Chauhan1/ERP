# FileManager Service Documentation

## Overview

The FileManager service provides comprehensive file management operations with school isolation for the multi-tenant ERP system. It builds on top of the R2StorageService to provide higher-level file operations while ensuring complete data separation between schools.

## Features

- **School-Specific CDN URL Generation**: Generates CDN URLs with proper school-based paths
- **Batch Operations**: Efficiently handle multiple files within school scope
- **File Existence Checking**: Verify file existence with metadata tracking per school
- **Folder Organization**: Maintain folder structure within school boundaries
- **Cross-School Access Prevention**: Ensures complete data isolation between schools
- **Storage Analytics**: Provides storage statistics and usage tracking

## Requirements Fulfilled

- **5.1**: File retrieval with school-specific CDN URL generation
- **5.2**: Batch operations for multiple files within school scope
- **5.3**: File existence checking and metadata tracking per school
- **5.4**: Folder organization maintenance within school boundaries
- **5.5**: Cross-school access prevention
- **5.6**: Complete file management operations
- **12.5**: School-isolated storage architecture
- **12.6**: School data isolation enforcement

## Usage Examples

### Basic File Retrieval

```typescript
import { fileManager } from '@/lib/services/file-manager';

// Retrieve file with CDN URL
const result = await fileManager.retrieveFile(
  'school-123/images/student-photo.jpg',
  {
    includeMetadata: true,
    generatePresignedUrl: true,
    presignedUrlExpiry: 3600 // 1 hour
  }
);

if (result.success) {
  console.log('CDN URL:', result.url);
  console.log('Presigned URL:', result.presignedUrl);
  console.log('Metadata:', result.metadata);
}
```

### Batch File Operations

```typescript
// Batch delete multiple files
const deleteResult = await fileManager.batchDeleteFiles([
  'school-123/images/old-photo1.jpg',
  'school-123/images/old-photo2.jpg',
  'school-123/documents/old-report.pdf'
]);

console.log(`Deleted ${deleteResult.successCount} files`);
console.log(`Failed to delete ${deleteResult.errorCount} files`);

// Batch retrieve multiple files
const retrieveResult = await fileManager.batchRetrieveFiles([
  'school-123/images/photo1.jpg',
  'school-123/images/photo2.jpg'
], {
  includeMetadata: true
});

retrieveResult.files.forEach(file => {
  if (file.success) {
    console.log(`File: ${file.key}, URL: ${file.url}`);
  }
});
```

### File Existence Checking

```typescript
// Check if file exists and get metadata
const existsResult = await fileManager.checkFileExists(
  'school-123/certificates/graduation-cert.pdf'
);

if (existsResult.exists) {
  console.log('File exists:', existsResult.metadata);
} else {
  console.log('File not found');
}
```

### Folder Organization

```typescript
// Get folder statistics and organization
const folderStats = await fileManager.getFolderOrganization('images');

console.log(`Folder: ${folderStats.folder}`);
console.log(`Files: ${folderStats.fileCount}`);
console.log(`Total Size: ${folderStats.totalSize} bytes`);
console.log(`Last Modified: ${folderStats.lastModified}`);

folderStats.files.forEach(file => {
  console.log(`- ${file.name} (${file.size} bytes)`);
});
```

### Storage Statistics

```typescript
// Get school storage statistics
const storageStats = await fileManager.getSchoolStorageStats();

if (storageStats.success) {
  console.log(`Total Files: ${storageStats.totalFiles}`);
  console.log(`Total Size: ${storageStats.totalSize} bytes`);
  
  Object.entries(storageStats.folderBreakdown).forEach(([folder, stats]) => {
    console.log(`${folder}: ${stats.files} files, ${stats.size} bytes`);
  });
}
```

### List School Files

```typescript
// List all files in school with pagination
const fileList = await fileManager.listSchoolFiles('documents', 50);

if (fileList.success) {
  fileList.files.forEach(file => {
    console.log(`${file.originalName} - ${file.url}`);
  });
  
  if (fileList.isTruncated) {
    console.log('More files available, use continuation token:', fileList.nextContinuationToken);
  }
}
```

## API Integration

The FileManager service is integrated with the REST API through `/api/files/manage` endpoints:

### GET Operations

```bash
# Retrieve single file
GET /api/files/manage?action=retrieve&key=school-123/images/photo.jpg&includeMetadata=true

# List files in folder
GET /api/files/manage?action=list&folder=images&maxFiles=50

# Get folder statistics
GET /api/files/manage?action=folder-stats&folder=documents

# Get storage statistics
GET /api/files/manage?action=storage-stats

# Check file existence
GET /api/files/manage?action=exists&key=school-123/certificates/cert.pdf
```

### POST Operations

```bash
# Batch delete files
POST /api/files/manage
{
  "action": "batch-delete",
  "keys": ["school-123/images/old1.jpg", "school-123/images/old2.jpg"]
}

# Batch retrieve files
POST /api/files/manage
{
  "action": "batch-retrieve",
  "keys": ["school-123/images/photo1.jpg", "school-123/images/photo2.jpg"],
  "includeMetadata": true,
  "generatePresignedUrl": true
}
```

### DELETE Operations

```bash
# Delete single file
DELETE /api/files/manage?key=school-123/images/unwanted.jpg
```

## Security Features

### School Isolation

The FileManager service enforces strict school isolation:

- All file keys must include the school prefix (`school-{schoolId}/`)
- Cross-school access attempts are automatically denied
- File operations are scoped to the authenticated user's school context

### Access Control

- Requires valid school access through `requireSchoolAccess()`
- Validates file ownership before any operation
- Prevents unauthorized access to files from other schools

### Error Handling

- Comprehensive error handling with descriptive messages
- Graceful degradation when services are unavailable
- Proper HTTP status codes for different error scenarios

## Integration with Existing Services

### R2StorageService

The FileManager builds on top of the R2StorageService:

```typescript
// FileManager uses R2StorageService internally
await r2StorageService.uploadFile(schoolId, buffer, key, metadata);
await r2StorageService.deleteFile(schoolId, key);
await r2StorageService.getFileMetadata(schoolId, key);
```

### Upload Handler

Works seamlessly with the existing UploadHandler:

```typescript
// Upload files using UploadHandler
const uploadResult = await uploadHandler.uploadImage(file, { folder: 'students' });

// Then manage files using FileManager
const fileInfo = await fileManager.retrieveFile(uploadResult.key);
```

### Authentication System

Integrates with the existing authentication system:

```typescript
// Automatically gets school context from authenticated user
const { schoolId, userId } = await requireSchoolAccess();
```

## Performance Considerations

### Batch Operations

- Batch operations are optimized for multiple file handling
- Maximum limits prevent resource exhaustion (100 files for delete, 50 for retrieve)
- Parallel processing where possible

### Caching

- CDN URLs are cached for performance
- Metadata caching can be implemented at the application level
- Presigned URLs have configurable expiry times

### Pagination

- File listing supports pagination with continuation tokens
- Configurable page sizes to balance performance and memory usage
- Efficient handling of large file collections

## Error Scenarios and Handling

### Common Error Cases

1. **File Not Found**: Returns appropriate error message and status
2. **Access Denied**: Prevents cross-school access attempts
3. **Service Unavailable**: Graceful handling of R2 service issues
4. **Invalid Parameters**: Comprehensive validation with detailed error messages

### Retry Logic

The underlying R2StorageService provides retry logic for transient failures:

- Exponential backoff for failed operations
- Maximum retry attempts to prevent infinite loops
- Detailed error logging for troubleshooting

## Testing

The FileManager service includes comprehensive tests:

- Unit tests for all public methods
- Mock-based testing for external dependencies
- Error scenario testing
- School isolation validation tests

Run tests with:

```bash
npm test -- src/test/file-manager.test.ts --run
```

## Future Enhancements

### Planned Features

1. **File Move Operations**: Move files between folders within school boundaries
2. **File Copy Operations**: Duplicate files within school scope
3. **Advanced Search**: Search files by metadata, content type, or date ranges
4. **File Versioning**: Track file versions and changes over time
5. **Bulk Operations UI**: Web interface for batch file management

### Performance Optimizations

1. **Metadata Caching**: Cache frequently accessed file metadata
2. **Lazy Loading**: Load file lists on demand for large folders
3. **Background Processing**: Async processing for large batch operations
4. **CDN Optimization**: Advanced CDN configuration for better performance

## Conclusion

The FileManager service provides a robust, secure, and efficient way to manage files in the multi-tenant school ERP system. It ensures complete data isolation between schools while providing comprehensive file management capabilities that integrate seamlessly with the existing R2 storage infrastructure.