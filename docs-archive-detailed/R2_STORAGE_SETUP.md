# Cloudflare R2 Storage Setup Guide

This guide covers the complete setup process for Cloudflare R2 storage integration in the School ERP system.

## Overview

Cloudflare R2 provides S3-compatible object storage with zero egress fees, making it cost-effective for serving files globally through Cloudflare's CDN network. The implementation includes:

- **School-isolated storage** with automatic folder structure
- **Multi-format file support** (images, documents, PDFs)
- **Automatic thumbnail generation** using Sharp.js
- **Presigned URLs** for secure uploads and downloads
- **Storage quota management** per school
- **CORS configuration** for web uploads

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **R2 Subscription**: Enable R2 storage in your Cloudflare dashboard
3. **API Token**: Create an R2 token with Object Read and Write permissions
4. **Node.js 18+**: Required for Sharp.js image processing

## Environment Configuration

### 1. Required Environment Variables

Add these variables to your `.env` file:

```bash
# Cloudflare R2 Storage Configuration
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=school-erp-storage
R2_REGION=auto
```

### 2. Optional Environment Variables

```bash
# Custom domain for CDN (recommended for production)
R2_CUSTOM_DOMAIN=https://cdn.yourdomain.com

# R2 endpoint URL (auto-generated if not specified)
R2_ENDPOINT=https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
```

### 3. Getting Your Credentials

1. **Account ID**: Found in Cloudflare dashboard sidebar
2. **Access Keys**: 
   - Go to R2 Object Storage → Manage R2 API tokens
   - Create token with "Object Read and Write" permissions
   - Copy the Access Key ID and Secret Access Key

## Installation

### 1. Install Dependencies

The required dependencies are already included in package.json:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp nanoid
```

### 2. Run Setup Script

Execute the R2 bucket setup script:

```bash
npx tsx scripts/setup-r2-bucket.ts
```

This script will:
- Validate your R2 configuration
- Configure CORS settings for web uploads
- Test basic upload/download operations
- Verify school-based folder structure

## Folder Structure

The system implements a school-based folder structure for complete data isolation:

```
bucket-root/
├── school-{schoolId}/
│   ├── students/
│   │   ├── {studentId}/
│   │   │   ├── avatar/
│   │   │   ├── documents/
│   │   │   └── certificates/
│   ├── teachers/
│   │   ├── {teacherId}/
│   │   │   ├── profile/
│   │   │   └── documents/
│   ├── events/
│   │   ├── {eventId}/
│   │   │   ├── banners/
│   │   │   └── gallery/
│   ├── announcements/
│   │   └── attachments/
│   ├── certificates/
│   │   └── templates/
│   ├── reports/
│   │   └── generated/
│   └── system/
│       ├── logos/
│       └── branding/
```

## File Upload Limits

### Image Files
- **Maximum Size**: 5MB
- **Supported Formats**: JPEG, PNG, GIF, WebP
- **Automatic Processing**: Thumbnail generation at 150x150, 300x300, 600x600 pixels

### Document Files
- **Maximum Size**: 50MB
- **Supported Formats**: PDF, DOC, DOCX, TXT
- **PDF Processing**: First-page preview generation

## Usage Examples

### Basic File Upload

```typescript
import { r2StorageService } from '@/lib/services/r2-storage-service';

// Upload a file
const result = await r2StorageService.uploadFile(
  'school-123', // School ID
  fileBuffer,   // File data
  'avatar.jpg', // Filename
  {
    originalName: 'user-avatar.jpg',
    mimeType: 'image/jpeg',
    folder: 'students',
    uploadedBy: 'user-456'
  }
);

if (result.success) {
  console.log('File uploaded:', result.url);
  console.log('File key:', result.key);
}
```

### Generate Presigned URL

```typescript
// Generate presigned URL for secure upload
const uploadUrl = await r2StorageService.generatePresignedUrl(
  'school-123',
  'school-123/students/avatar.jpg',
  'PUT',
  3600 // 1 hour expiration
);

// Generate presigned URL for download
const downloadUrl = await r2StorageService.generatePresignedUrl(
  'school-123',
  'school-123/students/avatar.jpg',
  'GET',
  300 // 5 minutes expiration
);
```

### List School Files

```typescript
// List files in school folder
const fileList = await r2StorageService.listFiles(
  'school-123',
  'students/', // Optional prefix
  100         // Max files
);

console.log('Files:', fileList.files);
```

## Validation and Security

### File Validation

```typescript
import { validateFile } from '@/lib/utils/r2-validation';

const validation = validateFile({
  name: 'document.pdf',
  size: 1024 * 1024, // 1MB
  type: 'application/pdf'
}, 'document');

if (!validation.isValid) {
  console.error('Validation failed:', validation.error);
}
```

### School Isolation

All file operations automatically enforce school isolation:

- Files are stored with `school-{schoolId}/` prefix
- Cross-school access is prevented at the service level
- URL generation includes school validation
- File listing is scoped to school folders

## CDN Configuration (Optional)

### 1. Custom Domain Setup

1. Add a CNAME record pointing to your R2 bucket
2. Configure SSL certificate in Cloudflare
3. Set `R2_CUSTOM_DOMAIN` environment variable

### 2. Cache Settings

Configure appropriate cache headers in Cloudflare:

- **Static Assets**: Cache for 1 year
- **User Uploads**: Cache for 1 month
- **Sensitive Files**: No cache or short TTL

## Monitoring and Maintenance

### Storage Usage Tracking

The system automatically tracks storage usage per school using the existing `UsageCounter` model:

```typescript
// Check storage quota
const quotaStatus = await storageQuotaService.checkQuota('school-123');
console.log('Usage:', quotaStatus.currentUsageMB, 'MB');
console.log('Limit:', quotaStatus.maxLimitMB, 'MB');
```

### Error Monitoring

Monitor these key metrics:

- Upload success/failure rates
- File access errors
- Storage quota violations
- CORS configuration issues

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Run the setup script to configure CORS
   - Verify bucket permissions in Cloudflare dashboard

2. **Authentication Errors**
   - Check R2 API token permissions
   - Verify account ID and access keys

3. **File Upload Failures**
   - Check file size limits
   - Verify MIME type validation
   - Ensure school ID is valid

4. **Missing Files**
   - Verify school-based folder structure
   - Check file key format: `school-{id}/folder/file`

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will log detailed information about R2 operations.

## Migration from Cloudinary

When ready to migrate from Cloudinary:

1. **Backup**: Export all Cloudinary URLs from database
2. **Migrate**: Use the migration service (Task 6 in implementation plan)
3. **Validate**: Verify all files transferred correctly
4. **Update**: Replace Cloudinary URLs with R2 URLs
5. **Cleanup**: Remove Cloudinary dependencies

## Security Best Practices

1. **Environment Variables**: Never commit R2 credentials to version control
2. **Access Control**: Use presigned URLs for sensitive files
3. **CORS Policy**: Restrict origins to your domain in production
4. **File Validation**: Always validate file types and sizes
5. **School Isolation**: Verify school ID in all operations

## Performance Optimization

1. **CDN**: Use custom domain for better caching
2. **Thumbnails**: Generate multiple sizes for responsive images
3. **Compression**: Enable image optimization in Sharp.js
4. **Chunked Uploads**: Implement for large files (>10MB)
5. **Lazy Loading**: Load images on demand in UI

## Support

For issues with R2 setup:

1. Check the validation test: `npm run test -- r2-setup-validation.test.ts`
2. Run the setup script: `npx tsx scripts/setup-r2-bucket.ts`
3. Review Cloudflare R2 documentation
4. Check application logs for detailed error messages

## Next Steps

After completing the R2 setup:

1. **Task 2**: Implement core R2 storage service with school isolation
2. **Task 3**: Create file upload handler with validation
3. **Task 4**: Add image processing with Sharp.js
4. **Task 5**: Build file management service
5. **Task 6**: Implement storage quota management

The R2 infrastructure is now ready for the next phase of implementation.