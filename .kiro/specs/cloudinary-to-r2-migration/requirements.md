# Requirements Document

## Introduction

This specification defines the requirements for migrating the Next.js school ERP system from Cloudinary to Cloudflare R2 storage. The migration must maintain all existing file storage functionality while eliminating dependency on Cloudinary services and reducing storage costs through Cloudflare R2's zero-egress pricing model.

## Glossary

- **R2_Storage**: Cloudflare R2 object storage service with S3-compatible API
- **Migration_Service**: Service responsible for transferring files from Cloudinary to R2
- **Upload_Handler**: Component that manages file uploads to R2 storage
- **Thumbnail_Generator**: Service that creates image thumbnails and previews
- **File_Manager**: Core service managing all file operations (upload, delete, retrieve)
- **CDN_Service**: Cloudflare CDN for global file distribution
- **Presigned_URL**: Temporary signed URL for secure file access
- **Sharp_Processor**: Server-side image processing library using Sharp.js
- **Legacy_URL**: Existing Cloudinary URLs that need migration
- **Asset_Transformer**: Service that handles image transformations and optimizations

## Requirements

### Requirement 1: Complete Cloudinary Removal

**User Story:** As a system administrator, I want to completely remove Cloudinary dependencies from the codebase, so that we eliminate recurring costs and vendor lock-in.

#### Acceptance Criteria

1. WHEN the migration is complete, THE System SHALL contain no references to Cloudinary libraries or services
2. WHEN the migration is complete, THE System SHALL not require any Cloudinary environment variables
3. THE System SHALL remove all Cloudinary npm packages from dependencies
4. THE System SHALL remove all Cloudinary configuration files and utilities
5. THE System SHALL replace all CldUploadWidget components with custom R2 upload components

### Requirement 2: R2 Storage Integration

**User Story:** As a developer, I want to integrate Cloudflare R2 as the primary storage solution, so that files are stored securely with global CDN distribution.

#### Acceptance Criteria

1. THE R2_Storage SHALL store all file types currently supported by Cloudinary
2. THE R2_Storage SHALL organize files using the existing folder structure pattern
3. WHEN a file is uploaded, THE Upload_Handler SHALL generate a unique filename and store it in R2
4. THE R2_Storage SHALL support presigned URLs for secure file access
5. THE CDN_Service SHALL serve files through Cloudflare's global network
6. THE System SHALL configure R2 buckets with appropriate CORS settings for web uploads

### Requirement 3: File Upload Functionality

**User Story:** As a user, I want to upload files (images, documents, PDFs) through the application, so that I can store and share educational content.

#### Acceptance Criteria

1. WHEN a user uploads an image file, THE Upload_Handler SHALL accept formats (JPEG, PNG, GIF, WebP)
2. WHEN a user uploads a document, THE Upload_Handler SHALL accept formats (PDF, DOC, DOCX, TXT)
3. WHEN a file exceeds size limits, THE Upload_Handler SHALL reject the upload with a descriptive error
4. THE Upload_Handler SHALL enforce a 5MB limit for images and 50MB limit for documents
5. WHEN an upload completes, THE System SHALL return the file URL and metadata
6. THE Upload_Handler SHALL validate file types using both extension and MIME type checking

### Requirement 4: Image Processing and Thumbnails

**User Story:** As a user, I want automatic thumbnail generation for images, so that the application loads quickly with optimized previews.

#### Acceptance Criteria

1. WHEN an image is uploaded, THE Thumbnail_Generator SHALL create multiple size variants (thumbnail, medium, large)
2. THE Sharp_Processor SHALL generate thumbnails at 150x150, 300x300, and 600x600 pixels
3. WHEN a PDF is uploaded, THE Thumbnail_Generator SHALL create a preview image of the first page
4. THE Asset_Transformer SHALL optimize images for web delivery (compression, format conversion)
5. THE System SHALL store original files and all generated variants in R2
6. WHEN requesting an image, THE System SHALL serve the most appropriate size variant

### Requirement 5: File Management Operations

**User Story:** As a system user, I want to perform file operations (delete, retrieve, organize), so that I can manage educational content effectively.

#### Acceptance Criteria

1. WHEN a file deletion is requested, THE File_Manager SHALL remove the file and all variants from R2
2. WHEN retrieving a file, THE System SHALL return a valid CDN URL with appropriate caching headers
3. THE File_Manager SHALL support batch operations for multiple file management
4. WHEN organizing files, THE System SHALL maintain folder structure consistency
5. THE System SHALL track file metadata including upload date, size, and file type
6. THE File_Manager SHALL provide file existence checking before operations

### Requirement 6: Data Migration from Cloudinary

**User Story:** As a system administrator, I want to migrate all existing files from Cloudinary to R2, so that no data is lost during the transition.

#### Acceptance Criteria

1. THE Migration_Service SHALL identify all Cloudinary URLs in the database
2. WHEN migrating files, THE Migration_Service SHALL download each file from Cloudinary and upload to R2
3. THE Migration_Service SHALL preserve original folder structure and filenames where possible
4. WHEN migration completes, THE System SHALL update all database references to use R2 URLs
5. THE Migration_Service SHALL generate a migration report showing success/failure status
6. THE Migration_Service SHALL handle migration failures gracefully with retry mechanisms
7. THE Migration_Service SHALL verify file integrity after migration using checksums

### Requirement 7: URL Management and Routing

**User Story:** As a developer, I want consistent URL patterns for file access, so that the application can reliably reference stored files.

#### Acceptance Criteria

1. THE System SHALL generate predictable URL patterns for R2-stored files
2. WHEN serving files through CDN, THE System SHALL use custom domain for professional URLs
3. THE System SHALL support URL transformations for backward compatibility
4. WHEN a Legacy_URL is accessed, THE System SHALL redirect to the equivalent R2 URL
5. THE System SHALL implement URL signing for sensitive files requiring access control
6. THE CDN_Service SHALL cache files with appropriate TTL settings

### Requirement 8: Security and Access Control

**User Story:** As a security administrator, I want secure file access controls, so that sensitive educational data is protected.

#### Acceptance Criteria

1. THE System SHALL implement role-based access control for file operations
2. WHEN accessing sensitive files, THE System SHALL require valid authentication
3. THE R2_Storage SHALL use presigned URLs for temporary secure access
4. THE System SHALL implement CORS policies to prevent unauthorized cross-origin access
5. WHEN storing files, THE System SHALL encrypt sensitive documents at rest
6. THE System SHALL log all file access attempts for audit purposes

### Requirement 9: Performance and Optimization

**User Story:** As an end user, I want fast file loading and uploads, so that the application provides a smooth experience.

#### Acceptance Criteria

1. THE CDN_Service SHALL serve files from the nearest edge location to users
2. WHEN uploading large files, THE System SHALL support chunked uploads for reliability
3. THE System SHALL implement progressive image loading with placeholder images
4. THE Asset_Transformer SHALL compress images without significant quality loss
5. THE System SHALL cache frequently accessed files at multiple CDN layers
6. WHEN serving images, THE System SHALL support modern formats (WebP, AVIF) when supported

### Requirement 10: Error Handling and Monitoring

**User Story:** As a system administrator, I want comprehensive error handling and monitoring, so that file operations are reliable and issues are quickly identified.

#### Acceptance Criteria

1. WHEN file operations fail, THE System SHALL provide descriptive error messages
2. THE System SHALL implement retry logic for transient failures
3. WHEN storage quotas are exceeded, THE System SHALL alert administrators
4. THE System SHALL monitor file operation performance and success rates
5. WHEN critical errors occur, THE System SHALL send notifications to administrators
6. THE System SHALL maintain logs of all file operations for troubleshooting

### Requirement 11: Multi-Tenant Storage Quota Management

**User Story:** As a super admin, I want to control storage limits for each school, so that I can manage resource allocation and prevent abuse in the multi-tenant SaaS system.

#### Acceptance Criteria

1. THE System SHALL enforce per-school storage quotas based on subscription plans
2. WHEN a school approaches their storage limit, THE System SHALL send warnings to school administrators
3. WHEN a school exceeds their storage quota, THE System SHALL prevent new uploads and display quota exceeded messages
4. THE Super_Admin_Dashboard SHALL display storage usage statistics for all schools
5. THE System SHALL allow super admins to adjust storage limits for individual schools
6. THE System SHALL track storage usage per school in real-time
7. THE System SHALL provide storage analytics including usage trends and projections
8. THE System SHALL support different storage tiers based on subscription plans (Basic: 1GB, Pro: 5GB, Enterprise: 25GB)
9. WHEN schools upgrade/downgrade plans, THE System SHALL automatically adjust storage quotas
10. THE System SHALL implement soft limits (warnings) and hard limits (upload blocking)

### Requirement 11: Multi-Tenant Storage Quota Management

**User Story:** As a super admin, I want to control storage limits for each school, so that I can manage resource allocation and prevent abuse in the multi-tenant SaaS system.

#### Acceptance Criteria

1. THE System SHALL enforce per-school storage quotas based on subscription plans
2. WHEN a school approaches their storage limit, THE System SHALL send warnings to school administrators
3. WHEN a school exceeds their storage quota, THE System SHALL prevent new uploads and display quota exceeded messages
4. THE Super_Admin_Dashboard SHALL display storage usage statistics for all schools
5. THE System SHALL allow super admins to adjust storage limits for individual schools
6. THE System SHALL track storage usage per school in real-time
7. THE System SHALL provide storage analytics including usage trends and projections
8. THE System SHALL support different storage tiers based on subscription plans (Basic: 1GB, Pro: 5GB, Enterprise: 25GB)
9. WHEN schools upgrade/downgrade plans, THE System SHALL automatically adjust storage quotas
10. THE System SHALL implement soft limits (warnings) and hard limits (upload blocking)