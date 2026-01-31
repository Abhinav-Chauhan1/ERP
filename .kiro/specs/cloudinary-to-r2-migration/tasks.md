# Implementation Plan: Cloudinary to Cloudflare R2 Migration

## Overview

This implementation plan converts the migration design into a series of incremental coding tasks. Each task builds on previous work, starting with core R2 integration, then adding image processing, migration services, and finally removing Cloudinary dependencies. The plan ensures zero data loss and maintains all existing functionality while transitioning to R2 storage.

## Tasks

- [ ] 1. Set up R2 storage infrastructure and configuration
  - Create R2 bucket configuration and access credentials
  - Set up environment variables for R2 connection
  - Create basic R2 client service with S3-compatible SDK
  - Configure CORS settings for web uploads
  - _Requirements: 2.1, 2.4, 2.6_

- [ ] 2. Implement core R2 storage service
  - [ ] 2.1 Create R2StorageService with basic operations
    - Implement uploadFile, deleteFile, generatePresignedUrl methods
    - Add file metadata handling and storage
    - Include error handling and retry logic
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [ ]* 2.2 Write property test for R2 storage operations
    - **Property 1: File Type Support Consistency**
    - **Validates: Requirements 2.1**
  
  - [ ]* 2.3 Write property test for filename uniqueness
    - **Property 3: Filename Uniqueness**
    - **Validates: Requirements 2.3**

- [ ] 3. Create file upload handler with validation
  - [ ] 3.1 Implement UploadHandler service
    - Add file type validation (MIME type and extension checking)
    - Implement size limit enforcement (5MB images, 50MB documents)
    - Create unique filename generation using nanoid
    - Add metadata extraction and response formatting
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 3.2 Write property test for file format validation
    - **Property 6: Image Format Validation**
    - **Property 7: Document Format Validation**
    - **Validates: Requirements 3.1, 3.2**
  
  - [ ]* 3.3 Write property test for size limit enforcement
    - **Property 8: Size Limit Enforcement**
    - **Validates: Requirements 3.3, 3.4**

- [ ] 4. Implement image processing with Sharp.js
  - [ ] 4.1 Create ImageProcessor service
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

- [ ] 5. Create file management service
  - [ ] 5.1 Implement FileManager service
    - Create file retrieval with CDN URL generation
    - Implement batch operations for multiple files
    - Add file existence checking and metadata tracking
    - Create folder organization maintenance
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 5.2 Write property test for file deletion completeness
    - **Property 15: File Deletion Completeness**
    - **Validates: Requirements 5.1**
  
  - [ ]* 5.3 Write property test for metadata tracking
    - **Property 18: Metadata Tracking Accuracy**
    - **Validates: Requirements 5.5**

- [ ] 6. Checkpoint - Core R2 functionality complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Build migration service for Cloudinary to R2
  - [ ] 7.1 Create MigrationService for URL discovery
    - Implement database scanning for Cloudinary URLs
    - Create URL pattern matching and extraction
    - Add migration tracking and status management
    - _Requirements: 6.1_
  
  - [ ] 7.2 Implement file transfer functionality
    - Add Cloudinary file download with retry logic
    - Implement R2 upload with integrity verification
    - Create checksum validation for file integrity
    - Add progress tracking and reporting
    - _Requirements: 6.2, 6.7_
  
  - [ ]* 7.3 Write property test for migration URL discovery
    - **Property 20: Migration URL Discovery**
    - **Validates: Requirements 6.1**
  
  - [ ]* 7.4 Write property test for migration integrity
    - **Property 24: Migration Integrity Verification**
    - **Validates: Requirements 6.7**

- [ ] 8. Implement database reference updates
  - [ ] 8.1 Create database update service
    - Implement URL replacement in database records
    - Add transaction support for consistency
    - Create rollback mechanisms for failed updates
    - Add migration report generation
    - _Requirements: 6.4, 6.5_
  
  - [ ]* 8.2 Write property test for database updates
    - **Property 23: Database Reference Updates**
    - **Validates: Requirements 6.4**

- [ ] 9. Create CDN and URL management
  - [ ] 9.1 Implement CDN service and URL handling
    - Configure custom domain for professional URLs
    - Implement URL signing for secure access
    - Add cache control headers optimization
    - Create legacy URL redirection support
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6_
  
  - [ ]* 9.2 Write property test for URL pattern consistency
    - **Property 25: URL Pattern Consistency**
    - **Validates: Requirements 7.1**
  
  - [ ]* 9.3 Write property test for URL signing security
    - **Property 28: URL Signing Security**
    - **Validates: Requirements 7.5**

- [ ] 10. Implement security and access control
  - [ ] 10.1 Create security service
    - Implement role-based access control for file operations
    - Add authentication requirements for sensitive files
    - Create CORS policy enforcement
    - Add audit logging for file access attempts
    - _Requirements: 8.1, 8.2, 8.4, 8.6_
  
  - [ ]* 10.2 Write property test for access control
    - **Property 29: Role-Based Access Control**
    - **Validates: Requirements 8.1**

- [ ] 11. Create API routes for R2 operations
  - [ ] 11.1 Build Next.js API routes for file operations
    - Create upload endpoint with presigned URL generation
    - Implement file retrieval and deletion endpoints
    - Add batch operation endpoints
    - Include error handling and validation
    - _Requirements: 2.4, 3.5, 5.2_
  
  - [ ] 11.2 Create migration API endpoints
    - Build migration trigger and status endpoints
    - Add migration report and progress endpoints
    - Implement migration control (pause/resume/cancel)
    - _Requirements: 6.5_

- [ ] 12. Replace Cloudinary upload components
  - [ ] 12.1 Create custom R2 upload components
    - Build React upload component to replace CldUploadWidget
    - Implement drag-and-drop functionality
    - Add progress tracking and error handling
    - Create preview and thumbnail display
    - _Requirements: 1.5_
  
  - [ ]* 12.2 Write unit tests for upload components
    - Test component rendering and user interactions
    - Test file validation and upload flow
    - Test error states and recovery

- [ ] 13. Checkpoint - All new functionality implemented
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Run migration process
  - [ ] 14.1 Execute migration script
    - Run migration service on production data
    - Monitor progress and handle any failures
    - Verify file integrity and database consistency
    - Generate comprehensive migration report
    - _Requirements: 6.2, 6.3, 6.4, 6.7_
  
  - [ ]* 14.2 Write integration test for full migration
    - Test end-to-end migration process
    - Verify data integrity and URL updates
    - Test rollback scenarios

- [ ] 15. Remove Cloudinary dependencies
  - [ ] 15.1 Clean up Cloudinary code and configuration
    - Remove all Cloudinary imports and references
    - Delete Cloudinary configuration files and utilities
    - Remove Cloudinary npm packages from dependencies
    - Clean up environment variables
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 15.2 Write verification tests for cleanup
    - Test that system works without Cloudinary dependencies
    - Verify no Cloudinary references remain in codebase
    - Test that all file operations work with R2

- [ ] 16. Performance optimization and monitoring
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

- [ ] 18. Final checkpoint - Migration complete
  - Ensure all tests pass, verify system functionality, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the process
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Migration should be performed during low-traffic periods
- Backup existing data before starting migration process
- Monitor system performance and error rates post-migration