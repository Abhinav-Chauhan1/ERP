# Implementation Plan: Cloudinary to Cloudflare R2 Migration

## Overview

This implementation plan converts the R2 migration design into a series of incremental coding tasks. Each task builds on previous work, starting with core R2 integration, then adding image processing, storage quota management, and finally removing Cloudinary dependencies. 

**Key Changes for Development Environment:**
- **No Migration Required**: Since the system is in development, migration tasks have been removed
- **Existing Storage System**: Integrates with existing UsageCounter and SubscriptionPlan models
- **Plan-Based Quotas**: Uses existing subscription plans (Starter: 5GB, Growth: 25GB, Enterprise: 100GB)

The plan ensures all existing functionality is maintained while transitioning to R2 storage with proper quota management.

## Tasks

- [x] 1. Set up R2 storage infrastructure and configuration
  - Create R2 bucket configuration and access credentials
  - Set up environment variables for R2 connection
  - Create basic R2 client service with S3-compatible SDK
  - Configure CORS settings for web uploads
  - _Requirements: 2.1, 2.4, 2.6_

- [x] 2. Implement core R2 storage service with school-based folder structure
  - [x] 2.1 Create R2StorageService with school-isolated operations
    - Implement uploadFile, deleteFile, generatePresignedUrl methods with schoolId parameter
    - Add school-based folder structure: `school-{schoolId}/{category}/{filename}`
    - Include file metadata handling with school isolation
    - Add error handling and retry logic
    - Ensure complete data isolation between schools
    - _Requirements: 2.1, 2.3, 2.4, 12.1, 12.2, 12.4_
  
  - [ ]* 2.2 Write property test for R2 storage operations
    - **Property 1: File Type Support Consistency**
    - **Property 41: School Data Isolation**
    - **Validates: Requirements 2.1, 12.4**
  
  - [ ]* 2.3 Write property test for school-scoped filename uniqueness
    - **Property 3: School-Scoped Filename Uniqueness**
    - **Validates: Requirements 2.3, 12.2**

- [x] 3. Create file upload handler with school-aware validation
  - [x] 3.1 Implement UploadHandler service with school context
    - Add file type validation (MIME type and extension checking)
    - Implement size limit enforcement (5MB images, 50MB documents)
    - Create unique filename generation using nanoid with school prefix
    - Add metadata extraction with school isolation
    - Implement automatic school folder routing based on user context
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 12.3, 12.5_
  
  - [ ]* 3.2 Write property test for file format validation
    - **Property 6: Image Format Validation**
    - **Property 7: Document Format Validation**
    - **Validates: Requirements 3.1, 3.2**
  
  - [ ]* 3.3 Write property test for size limit enforcement
    - **Property 8: Size Limit Enforcement**
    - **Validates: Requirements 3.3, 3.4**

- [x] 4. Implement image processing with Sharp.js
  - [x] 4.1 Create ImageProcessor service
    - Install and configure Sharp.js for server-side processing
    - Implement thumbnail generation (150x150, 300x300, 600x600)
    - Add image optimization and compression
    - Create PDF preview generation functionality
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 4.2 Write property test for thumbnail generation
    - **Property 11: Thumbnail Generation Completeness**
    - **Validates: Requirements 4.1, 4.2**
  
  - [ ]* 4.3 Write property test for PDF preview generation
    - **Property 12: PDF Preview Generation**
    - **Validates: Requirements 4.3**

- [x] 5. Create school-aware file management service
  - [x] 5.1 Implement FileManager service with school isolation
    - Create file retrieval with school-specific CDN URL generation
    - Implement batch operations for multiple files within school scope
    - Add file existence checking and metadata tracking per school
    - Create folder organization maintenance within school boundaries
    - Ensure cross-school access prevention
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 12.5, 12.6_
  
  - [ ]* 5.2 Write property test for file deletion completeness
    - **Property 15: File Deletion Completeness**
    - **Validates: Requirements 5.1**
  
  - [ ]* 5.3 Write property test for metadata tracking
    - **Property 18: Metadata Tracking Accuracy**
    - **Validates: Requirements 5.5**

- [x] 6. Implement school-based storage quota management system
  - [x] 6.1 Create StorageQuotaService using existing models with school isolation
    - Implement quota checking using UsageCounter.storageLimitMB per school
    - Add real-time usage tracking via storageUsedMB updates per school folder
    - Create warning system at 80% usage threshold per school
    - Integrate with existing subscription plan features.storageGB
    - Calculate usage from school-specific folder contents
    - _Requirements: 11.1, 11.2, 11.6, 11.8, 12.8_
  
  - [x] 6.2 Enhance super admin quota management
    - Extend existing super admin dashboard with storage analytics
    - Add ability to view all school storage usage from UsageCounter
    - Implement quota adjustment via storageLimitMB updates
    - Create storage analytics using existing usage data
    - _Requirements: 11.4, 11.5, 11.7_
  
  - [ ]* 6.3 Write property test for storage quota enforcement
    - **Property 37: Storage Quota Enforcement**
    - **Property 38: Storage Usage Tracking Accuracy**
    - **Validates: Requirements 11.1, 11.3, 11.6**
  
  - [ ]* 6.4 Write property test for quota warning system
    - **Property 39: Quota Warning System**
    - **Property 40: Plan-Based Storage Limits**
    - **Validates: Requirements 11.2, 11.8, 11.9**

- [ ] 7. Checkpoint - Core R2 functionality complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create CDN and school-based URL management
  - [x] 8.1 Implement CDN service and school-aware URL handling
    - Configure custom domain for professional URLs with school paths
    - Implement URL signing for secure access with school isolation
    - Add cache control headers optimization
    - Create consistent school-based URL patterns: `cdn.domain.com/school-{id}/category/file`
    - _Requirements: 7.1, 7.2, 7.5, 7.6, 12.7_
  
  - [ ]* 8.2 Write property test for school-based URL pattern consistency
    - **Property 25: School-Based URL Pattern Consistency**
    - **Validates: Requirements 7.1, 12.7**
  
  - [ ]* 8.3 Write property test for URL signing security
    - **Property 28: URL Signing Security**
    - **Validates: Requirements 7.5**

- [x] 9. Implement security and access control
  - [x] 9.1 Create security service
    - Implement role-based access control for file operations
    - Add authentication requirements for sensitive files
    - Create CORS policy enforcement
    - Add audit logging for file access attempts
    - _Requirements: 8.1, 8.2, 8.4, 8.6_
  
  - [ ]* 9.2 Write property test for access control
    - **Property 29: Role-Based Access Control**
    - **Validates: Requirements 8.1**

- [x] 10. Create API routes for R2 operations
  - [x] 11.1 Build Next.js API routes for file operations
    - Create upload endpoint with presigned URL generation
    - Implement file retrieval and deletion endpoints
    - Add batch operation endpoints
    - Include error handling and validation
    - _Requirements: 2.4, 3.5, 5.2_
  
  - [x] 11.2 Create migration API endpoints
    - Build migration trigger and status endpoints
    - Add migration report and progress endpoints
    - Implement migration control (pause/resume/cancel)
    - _Requirements: 6.5_

- [x] 11. Replace Cloudinary upload components
  - [x] 11.1 Create custom R2 upload components
    - Build React upload component to replace CldUploadWidget
    - Implement drag-and-drop functionality
    - Add progress tracking and error handling
    - Create preview and thumbnail display
    - Add quota checking and warning messages
    - _Requirements: 1.5, 11.3_
  
  - [ ]* 11.2 Write unit tests for upload components
    - Test component rendering and user interactions
    - Test file validation and upload flow
    - Test error states and recovery
    - Test quota exceeded scenarios

- [ ] 12. Checkpoint - All new functionality implemented
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Remove Cloudinary dependencies
  - [x] 13.1 Clean up Cloudinary code and configuration
    - Remove all Cloudinary imports and references
    - Delete Cloudinary configuration files and utilities
    - Remove Cloudinary npm packages from dependencies
    - Clean up environment variables
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 13.2 Write verification tests for cleanup
    - Test that system works without Cloudinary dependencies
    - Verify no Cloudinary references remain in codebase
    - Test that all file operations work with R2

- [x] 14. Performance optimization and monitoring
  - [ ] 16.1 Implement performance optimizations
    - Add chunked upload support for large files
    - Implement modern image format support (WebP, AVIF)
    - Add performance monitoring and metrics collection
    - Create error notification system for administrators
    - _Requirements: 9.2, 9.6, 10.4, 10.5_
  
  - [ ]* 16.2 Write property test for chunked uploads
    - **Property 32: Chunked Upload Support**
    - **Validates: Requirements 9.2**

- [ ] 17. Final integration and testing
  - [ ] 17.1 Comprehensive integration testing
    - Test all file operations end-to-end
    - Verify security and access control
    - Test error handling and recovery scenarios
    - Validate performance under load
    - _Requirements: All requirements_
  
  - [ ]* 17.2 Write property tests for error handling
    - **Property 34: Error Message Quality**
    - **Property 35: Retry Logic Implementation**
    - **Validates: Requirements 10.1, 10.2**

- [ ] 15. Final checkpoint - R2 implementation complete
  - Ensure all tests pass, verify system functionality, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the process
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- **Migration tasks removed**: Since system is in development, no migration from Cloudinary needed
- **Storage quotas**: Uses existing UsageCounter model with storageUsedMB/storageLimitMB fields
- **Subscription integration**: Leverages existing SubscriptionPlan.features.storageGB for plan-based limits
- Monitor system performance and error rates post-implementation