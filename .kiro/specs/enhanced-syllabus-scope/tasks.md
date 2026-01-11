# Implementation Plan: Enhanced Syllabus Scope System

## Overview

This implementation plan breaks down the Enhanced Syllabus Scope System into discrete, incremental tasks. Each task builds on previous work and includes validation through code and tests. The plan follows a logical progression: database schema → server actions → validation → UI → testing.

## Tasks

- [x] 1. Update database schema with enhanced syllabus fields
  - Add new fields to Syllabus model in Prisma schema
  - Add new enums (SyllabusStatus, CurriculumType, DifficultyLevel)
  - Add relationships to AcademicYear, Class, ClassSection
  - Add unique constraint and indexes
  - _Requirements: 12.1-12.18_

- [x] 2. Create and run database migration
  - Generate Prisma migration file
  - Set default values for existing records
  - Verify migration runs successfully
  - Test rollback capability
  - _Requirements: 16.1-16.6, 11.1-11.5_

- [x] 3. Update Zod validation schemas
  - [x] 3.1 Create enhanced syllabus form schema
    - Add scope type field
    - Add optional academicYearId, classId, sectionId fields
    - Add curriculumType, boardType fields
    - Add metadata fields (tags, difficultyLevel, estimatedHours, prerequisites)
    - Add effectiveFrom, effectiveTo fields
    - Add version field
    - _Requirements: 1.1, 4.1, 4.2, 9.1-9.4, 6.1, 6.2, 8.1_

  - [x] 3.2 Add scope validation logic
    - Validate class-wide requires classId
    - Validate section-specific requires classId and sectionId
    - Validate effectiveTo is after effectiveFrom
    - _Requirements: 15.2, 15.3_

  - [x] 3.3 Create syllabus update schema
    - Extend create schema with id field
    - _Requirements: 13.1_

  - [x] 3.4 Create scope filter schema
    - Define schema for query filters
    - _Requirements: 13.4_

- [x] 4. Implement core server actions
  - [x] 4.1 Update createSyllabus action
    - Remove "one syllabus per subject" constraint check
    - Add scope fields to creation logic
    - Add unique constraint validation
    - Set default values (status=DRAFT, curriculumType=GENERAL, etc.)
    - Set createdBy from userId parameter
    - Handle file upload for document
    - _Requirements: 2.1, 13.1, 13.2, 13.3, 7.1_

  - [x] 4.2 Implement getSyllabusWithFallback action
    - Build fallback query logic (section → class → subject)
    - Filter by status=PUBLISHED and isActive=true
    - Filter by effective date range
    - Include all relations (subject, academicYear, class, section, units, modules)
    - _Requirements: 10.1-10.5, 13.5, 13.6_

  - [x] 4.3 Implement getSyllabusByScope action
    - Accept partial scope filters
    - Support filtering by status, isActive, tags
    - Return array of matching syllabi
    - _Requirements: 13.7, 18.1-18.10_

  - [x] 4.4 Update updateSyllabus action
    - Accept new optional fields
    - Set updatedBy from userId parameter
    - Handle file upload for document
    - _Requirements: 7.2, 13.1_

  - [x] 4.5 Implement updateSyllabusStatus action
    - Accept syllabusId, new status, userId
    - Set approvedBy and approvedAt when status changes to APPROVED
    - _Requirements: 7.3, 13.9_

  - [x] 4.6 Implement cloneSyllabus action
    - Copy all fields except id, createdAt, updatedAt
    - Accept new scope parameters
    - Set status to DRAFT
    - Set createdBy to cloning user
    - Clone related units, modules, documents
    - _Requirements: 19.1-19.5, 13.8_

  - [x] 4.7 Implement getSyllabusVersionHistory action
    - Query syllabus and all children recursively
    - Return version chain
    - _Requirements: 8.4, 13.10_

- [x] 5. Implement helper actions
  - [x] 5.1 Create getAcademicYearsForDropdown action
    - Query all academic years ordered by startDate desc
    - Return id and name
    - _Requirements: 14.6_

  - [x] 5.2 Create getClassesForDropdown action
    - Accept optional academicYearId filter
    - Query classes ordered by name
    - Return id and name
    - _Requirements: 14.2_

  - [x] 5.3 Create getSectionsForDropdown action
    - Accept classId parameter
    - Query sections for that class ordered by name
    - Return id and name
    - _Requirements: 14.3_

  - [x] 5.4 Create validateSyllabusScope helper
    - Validate foreign key references exist
    - Validate scope configuration
    - Return validation result
    - _Requirements: 15.5_

- [x] 6. Checkpoint - Ensure all server actions work
  - Test each action manually or with simple scripts
  - Verify database operations complete successfully
  - Ask the user if questions arise

- [x] 7. Create UI components
  - [x] 7.1 Create ScopeSelector component
    - Radio group for scope type (subject-wide, class-wide, section-specific)
    - Conditional class dropdown (shown for class-wide and section-specific)
    - Conditional section dropdown (shown for section-specific only)
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 7.2 Create CurriculumTypeSelector component
    - Dropdown for curriculum type enum
    - Optional text input for board type
    - _Requirements: 14.4, 14.5_

  - [x] 7.3 Create MetadataInputs component
    - Multi-select for tags
    - Dropdown for difficulty level
    - Number input for estimated hours
    - Textarea for prerequisites
    - _Requirements: 14.8, 14.9_

  - [x] 7.4 Create DateRangePicker component
    - Date picker for effectiveFrom
    - Date picker for effectiveTo
    - Validation that end is after start
    - _Requirements: 14.10_

- [x] 8. Update syllabus form page
  - [x] 8.1 Update create syllabus form
    - Integrate ScopeSelector component
    - Integrate CurriculumTypeSelector component
    - Add academic year dropdown
    - Integrate MetadataInputs component
    - Integrate DateRangePicker component
    - Add version input
    - Update form submission to include new fields
    - _Requirements: 14.1-14.10_

  - [x] 8.2 Update edit syllabus form
    - Show current scope information
    - Allow editing all new fields
    - Maintain backward compatibility for old syllabi
    - _Requirements: 14.1-14.10_

  - [x] 8.3 Add form validation
    - Client-side validation using Zod schema
    - Display validation errors
    - _Requirements: 15.1-15.5_

- [x] 9. Update syllabus list page
  - [x] 9.1 Add scope information to list display
    - Show academic year if specified
    - Show class if specified
    - Show section if specified
    - Show curriculum type and board type
    - _Requirements: 14.11_

  - [x] 9.2 Add filtering controls
    - Filter by subject
    - Filter by academic year
    - Filter by class
    - Filter by section
    - Filter by curriculum type
    - Filter by status
    - Filter by tags
    - _Requirements: 14.12, 18.1-18.10_

  - [x] 9.3 Update list query to use getSyllabusByScope
    - Apply selected filters
    - Display filtered results
    - _Requirements: 18.1-18.10_

- [x] 10. Add syllabus cloning feature
  - [x] 10.1 Add clone button to syllabus detail page
    - Show clone dialog
    - Allow modifying scope before cloning
    - Call cloneSyllabus action
    - Redirect to edit page for cloned syllabus
    - _Requirements: 19.1-19.5_

- [x] 11. Add status management UI
  - [x] 11.1 Add status badge to syllabus display
    - Show current status with color coding
    - _Requirements: 5.1-5.6_

  - [x] 11.2 Add status change dropdown
    - Show available status transitions
    - Call updateSyllabusStatus action
    - Show confirmation dialog for status changes
    - _Requirements: 5.1-5.6, 13.9_

- [x] 12. Checkpoint - Ensure all UI features work
  - Test creating syllabi with different scopes
  - Test filtering and searching
  - Test cloning
  - Test status changes
  - Ask the user if questions arise

- [ ]* 13. Write unit tests for server actions
  - Test createSyllabus with various scope combinations
  - Test unique constraint violation
  - Test getSyllabusWithFallback logic
  - Test getSyllabusByScope filtering
  - Test cloneSyllabus
  - Test updateSyllabusStatus
  - Test validation helpers
  - _Requirements: All_

- [ ]* 14. Write property-based tests
  - [ ]* 14.1 Property 1: Scope type determines field requirements
    - **Property 1: Scope Type Determines Field Requirements**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [ ]* 14.2 Property 2: Null scope fields indicate wider applicability
    - **Property 2: Null Scope Fields Indicate Wider Applicability**
    - **Validates: Requirements 1.2, 1.5, 3.2**

  - [ ]* 14.3 Property 3: Scope filtering returns matching syllabi
    - **Property 3: Scope Filtering Returns Matching Syllabi**
    - **Validates: Requirements 1.6, 3.3, 4.4, 18.1-18.10**

  - [ ]* 14.4 Property 4: Multiple syllabi per subject allowed
    - **Property 4: Multiple Syllabi Per Subject Allowed**
    - **Validates: Requirements 2.1, 13.2**

  - [ ]* 14.5 Property 5: Unique constraint prevents duplicates
    - **Property 5: Unique Constraint Prevents Duplicates**
    - **Validates: Requirements 2.2, 2.3, 2.5, 13.3**

  - [ ]* 14.6 Property 6: Fallback logic prioritizes specificity
    - **Property 6: Fallback Logic Prioritizes Specificity**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 13.5**

  - [ ]* 14.7 Property 7: Default values applied correctly
    - **Property 7: Default Values Applied Correctly**
    - **Validates: Requirements 4.5, 5.1, 8.1, 11.3, 11.4**

  - [ ]* 14.8 Property 8: Status filtering excludes non-active syllabi
    - **Property 8: Status Filtering Excludes Non-Active Syllabi**
    - **Validates: Requirements 5.4, 5.6**

  - [ ]* 14.9 Property 9: Effective date range filtering
    - **Property 9: Effective Date Range Filtering**
    - **Validates: Requirements 6.4, 6.5**

  - [ ]* 14.10 Property 10: Ownership fields track user actions
    - **Property 10: Ownership Fields Track User Actions**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**

  - [ ]* 14.11 Property 11: Version relationships maintained
    - **Property 11: Version Relationships Maintained**
    - **Validates: Requirements 8.2, 8.3, 8.4**

  - [ ]* 14.12 Property 12: Metadata fields stored correctly
    - **Property 12: Metadata Fields Stored Correctly**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

  - [ ]* 14.13 Property 13: Tag-based filtering works
    - **Property 13: Tag-Based Filtering Works**
    - **Validates: Requirements 9.5**

  - [ ]* 14.14 Property 14: Backward compatibility preserved
    - **Property 14: Backward Compatibility Preserved**
    - **Validates: Requirements 11.1, 11.2, 11.5**

  - [ ]* 14.15 Property 15: Clone copies all data except excluded fields
    - **Property 15: Clone Copies All Data Except Excluded Fields**
    - **Validates: Requirements 19.1, 19.2, 19.3**

  - [ ]* 14.16 Property 16: Cloned syllabus defaults
    - **Property 16: Cloned Syllabus Defaults**
    - **Validates: Requirements 19.4, 19.5**

  - [ ]* 14.17 Property 17: Foreign key validation
    - **Property 17: Foreign Key Validation**
    - **Validates: Requirements 15.5**

  - [ ]* 14.18 Property 18: Date validation
    - **Property 18: Date Validation**
    - **Validates: Requirements 15.3**

- [ ]* 15. Write integration tests
  - Test end-to-end syllabus creation flow
  - Test fallback logic integration
  - Test status workflow
  - Test cloning workflow
  - _Requirements: All_

- [x] 16. Update documentation
  - Update API documentation with new actions
  - Update user guide with new features
  - Create migration guide for existing users
  - Document scope selection best practices
  - _Requirements: All_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Verify test coverage meets goals (90% line, 85% branch)
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: database → logic → UI → tests
