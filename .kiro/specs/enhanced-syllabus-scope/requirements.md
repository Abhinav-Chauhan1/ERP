# Requirements Document

## Introduction

The Enhanced Syllabus Scope System addresses critical limitations in the current syllabus management system by enabling flexible syllabus creation at multiple scope levels (subject-wide, class-wide, section-specific), supporting multiple curriculum types and boards, implementing lifecycle management, and providing comprehensive versioning and metadata tracking.

## Glossary

- **Syllabus**: A structured curriculum document defining the content, modules, and learning objectives for a subject
- **Scope**: The level at which a syllabus applies (subject-wide, class-wide, or section-specific)
- **Subject**: An academic discipline (e.g., Mathematics, Physics, English)
- **Class**: A grade level (e.g., Grade 10, Grade 11)
- **ClassSection**: A subdivision of a class (e.g., Section A, Section B, Science Stream)
- **AcademicYear**: A school year period (e.g., 2024-25)
- **CurriculumType**: The type of curriculum (General, Advanced, Remedial, Integrated, Vocational, Special Needs)
- **BoardType**: The educational board (CBSE, ICSE, State Board, IB, Cambridge)
- **SyllabusStatus**: The lifecycle state (Draft, Pending Review, Approved, Published, Archived, Deprecated)
- **System**: The Enhanced Syllabus Management System
- **Admin**: A user with administrative privileges to manage syllabi
- **Teacher**: A user who can view and track syllabus progress
- **Student**: A user who can view published syllabi

## Requirements

### Requirement 1: Flexible Scope Selection

**User Story:** As an admin, I want to create syllabi at different scope levels (subject-wide, class-wide, section-specific), so that I can manage curriculum for different organizational levels.

#### Acceptance Criteria

1. WHEN creating a syllabus, THE System SHALL allow selection of scope type (subject-wide, class-wide, or section-specific)
2. WHEN scope type is "subject-wide", THE System SHALL create a syllabus applicable to all classes and sections for that subject
3. WHEN scope type is "class-wide", THE System SHALL require class selection and create a syllabus applicable to all sections of that class
4. WHEN scope type is "section-specific", THE System SHALL require both class and section selection and create a syllabus for that specific section only
5. WHEN a syllabus is created with optional scope fields (classId, sectionId), THE System SHALL store null values for unspecified scopes
6. WHEN querying syllabi, THE System SHALL support filtering by subject, class, section, and academic year

### Requirement 2: Multiple Syllabi Per Subject

**User Story:** As an admin, I want to create multiple syllabi for the same subject at different scope levels, so that I can have different curricula for different grades and sections.

#### Acceptance Criteria

1. WHEN creating a syllabus, THE System SHALL allow multiple syllabi for the same subject with different scope combinations
2. WHEN a syllabus exists for a subject-class-section combination, THE System SHALL prevent duplicate syllabi for the exact same combination
3. WHEN checking for existing syllabi, THE System SHALL validate uniqueness based on (subjectId, academicYearId, classId, sectionId, curriculumType) combination
4. WHEN multiple syllabi exist for a subject, THE System SHALL return all matching syllabi when queried without scope filters
5. THE System SHALL enforce unique constraint on (subjectId, academicYearId, classId, sectionId, curriculumType)

### Requirement 3: Academic Year Tracking

**User Story:** As an admin, I want to associate syllabi with academic years, so that I can version curricula by year and maintain historical records.

#### Acceptance Criteria

1. WHEN creating a syllabus, THE System SHALL allow optional academic year selection
2. WHEN academic year is not specified, THE System SHALL create a syllabus applicable to all academic years
3. WHEN querying syllabi, THE System SHALL support filtering by academic year
4. WHEN an academic year ends, THE System SHALL maintain archived syllabi for historical reference
5. WHEN displaying syllabi, THE System SHALL show the associated academic year if specified

### Requirement 4: Curriculum Type and Board Support

**User Story:** As an admin, I want to specify curriculum type and board for syllabi, so that I can manage different educational standards and difficulty levels.

#### Acceptance Criteria

1. WHEN creating a syllabus, THE System SHALL require curriculum type selection (General, Advanced, Remedial, Integrated, Vocational, Special Needs)
2. WHEN creating a syllabus, THE System SHALL allow optional board type specification (CBSE, ICSE, State Board, IB, Cambridge, etc.)
3. WHEN curriculum type is specified, THE System SHALL store it with the syllabus
4. WHEN querying syllabi, THE System SHALL support filtering by curriculum type and board type
5. THE System SHALL default curriculum type to "General" if not specified

### Requirement 5: Syllabus Lifecycle Management

**User Story:** As an admin, I want to manage syllabus lifecycle with statuses (Draft, Pending Review, Approved, Published, Archived), so that I can control visibility and implement approval workflows.

#### Acceptance Criteria

1. WHEN creating a syllabus, THE System SHALL set initial status to "Draft"
2. WHEN a syllabus status is "Draft", THE System SHALL allow only admins to view and edit it
3. WHEN a syllabus status is changed to "Published", THE System SHALL make it visible to teachers and students
4. WHEN a syllabus status is "Archived", THE System SHALL hide it from active listings but maintain it for historical reference
5. THE System SHALL track status transitions with timestamps
6. WHEN querying active syllabi, THE System SHALL filter by status "Published" and isActive true

### Requirement 6: Effective Date Management

**User Story:** As an admin, I want to set effective date ranges for syllabi, so that I can schedule curriculum activation and expiration.

#### Acceptance Criteria

1. WHEN creating a syllabus, THE System SHALL allow optional effectiveFrom date specification
2. WHEN creating a syllabus, THE System SHALL allow optional effectiveTo date specification
3. WHEN current date is before effectiveFrom, THE System SHALL not display the syllabus to non-admin users
4. WHEN current date is after effectiveTo, THE System SHALL mark the syllabus as expired
5. WHEN querying active syllabi, THE System SHALL filter by current date within effective date range

### Requirement 7: Ownership and Authorship Tracking

**User Story:** As an admin, I want to track who created, modified, and approved syllabi, so that I can maintain accountability and audit trails.

#### Acceptance Criteria

1. WHEN creating a syllabus, THE System SHALL record the creator's user ID in createdBy field
2. WHEN updating a syllabus, THE System SHALL record the modifier's user ID in updatedBy field
3. WHEN approving a syllabus, THE System SHALL record the approver's user ID in approvedBy field and timestamp in approvedAt
4. WHEN displaying syllabus details, THE System SHALL show creator, last modifier, and approver information
5. THE System SHALL maintain createdAt and updatedAt timestamps automatically

### Requirement 8: Syllabus Versioning

**User Story:** As an admin, I want to version syllabi and track parent-child relationships, so that I can maintain curriculum evolution history.

#### Acceptance Criteria

1. WHEN creating a syllabus, THE System SHALL allow optional version number specification (default "1.0")
2. WHEN creating a new version from existing syllabus, THE System SHALL allow linking to parent syllabus
3. WHEN a syllabus has parent, THE System SHALL store parentSyllabusId reference
4. WHEN querying a syllabus, THE System SHALL support retrieving version history
5. THE System SHALL allow marking old versions as "Deprecated" when new version is published

### Requirement 9: Enhanced Metadata

**User Story:** As an admin, I want to add rich metadata to syllabi (tags, difficulty level, estimated hours, prerequisites), so that I can better organize and describe curricula.

#### Acceptance Criteria

1. WHEN creating a syllabus, THE System SHALL allow adding multiple tags for categorization
2. WHEN creating a syllabus, THE System SHALL allow difficulty level selection (Beginner, Intermediate, Advanced, Expert)
3. WHEN creating a syllabus, THE System SHALL allow estimated hours specification
4. WHEN creating a syllabus, THE System SHALL allow prerequisites description
5. WHEN querying syllabi, THE System SHALL support filtering and searching by tags

### Requirement 10: Syllabus Retrieval with Fallback Logic

**User Story:** As a teacher or student, I want the system to automatically find the most specific applicable syllabus, so that I see the most relevant curriculum for my context.

#### Acceptance Criteria

1. WHEN querying syllabus for a specific section, THE System SHALL first search for section-specific syllabus
2. WHEN no section-specific syllabus exists, THE System SHALL search for class-wide syllabus
3. WHEN no class-wide syllabus exists, THE System SHALL search for subject-wide syllabus
4. WHEN multiple syllabi match, THE System SHALL prioritize by specificity (section > class > subject)
5. THE System SHALL only return published and active syllabi to non-admin users

### Requirement 11: Backward Compatibility

**User Story:** As a system administrator, I want existing syllabi to continue working after the upgrade, so that there is no disruption to current operations.

#### Acceptance Criteria

1. WHEN migrating existing syllabi, THE System SHALL preserve all existing data
2. WHEN existing syllabi have no scope specified, THE System SHALL treat them as subject-wide
3. WHEN existing syllabi have no status, THE System SHALL default to "Published"
4. WHEN existing syllabi have no curriculum type, THE System SHALL default to "General"
5. THE System SHALL maintain all existing relationships (units, modules, documents)

### Requirement 12: Database Schema Updates

**User Story:** As a developer, I want the database schema to support all new fields and relationships, so that the enhanced features can be implemented.

#### Acceptance Criteria

1. THE System SHALL add academicYearId field as optional foreign key to Syllabus model
2. THE System SHALL add classId field as optional foreign key to Syllabus model
3. THE System SHALL add sectionId field as optional foreign key to Syllabus model
4. THE System SHALL add curriculumType enum field with default "General" to Syllabus model
5. THE System SHALL add boardType string field as optional to Syllabus model
6. THE System SHALL add status enum field with default "Draft" to Syllabus model
7. THE System SHALL add isActive boolean field with default true to Syllabus model
8. THE System SHALL add effectiveFrom and effectiveTo datetime fields as optional to Syllabus model
9. THE System SHALL add version string field with default "1.0" to Syllabus model
10. THE System SHALL add parentSyllabusId field as optional self-reference to Syllabus model
11. THE System SHALL add createdBy, updatedBy, approvedBy string fields to Syllabus model
12. THE System SHALL add approvedAt datetime field as optional to Syllabus model
13. THE System SHALL add tags string array field to Syllabus model
14. THE System SHALL add difficultyLevel enum field with default "Intermediate" to Syllabus model
15. THE System SHALL add estimatedHours integer field as optional to Syllabus model
16. THE System SHALL add prerequisites string field as optional to Syllabus model
17. THE System SHALL create unique constraint on (subjectId, academicYearId, classId, sectionId, curriculumType)
18. THE System SHALL create indexes on (subjectId, classId), (academicYearId, isActive), (status, isActive), (curriculumType, boardType)

### Requirement 13: API Updates

**User Story:** As a developer, I want updated server actions to support new syllabus features, so that the frontend can utilize enhanced functionality.

#### Acceptance Criteria

1. WHEN calling createSyllabus action, THE System SHALL accept new optional parameters (classId, sectionId, academicYearId, curriculumType, boardType, etc.)
2. WHEN calling createSyllabus action, THE System SHALL remove the "one syllabus per subject" constraint
3. WHEN calling createSyllabus action, THE System SHALL validate unique constraint on scope combination
4. WHEN calling getSyllabusBySubject action, THE System SHALL accept optional scope filters (classId, sectionId, academicYearId)
5. WHEN calling getSyllabusBySubject action with scope filters, THE System SHALL implement fallback logic
6. THE System SHALL provide new action getSyllabusWithFallback for automatic scope resolution
7. THE System SHALL provide new action getSyllabusByScope for explicit scope filtering
8. THE System SHALL provide new action cloneSyllabus for creating syllabus copies
9. THE System SHALL provide new action updateSyllabusStatus for status transitions
10. THE System SHALL provide new action getSyllabusVersionHistory for version tracking

### Requirement 14: UI Enhancements

**User Story:** As an admin, I want an intuitive interface to create and manage syllabi with all new features, so that I can efficiently work with the enhanced system.

#### Acceptance Criteria

1. WHEN creating a syllabus, THE System SHALL display scope type selector (radio buttons for subject-wide, class-wide, section-specific)
2. WHEN scope type is "class-wide", THE System SHALL display class dropdown
3. WHEN scope type is "section-specific", THE System SHALL display class and section dropdowns
4. WHEN creating a syllabus, THE System SHALL display curriculum type dropdown
5. WHEN creating a syllabus, THE System SHALL display optional board type input
6. WHEN creating a syllabus, THE System SHALL display academic year dropdown
7. WHEN creating a syllabus, THE System SHALL display difficulty level selector
8. WHEN creating a syllabus, THE System SHALL display tags input with multi-select
9. WHEN creating a syllabus, THE System SHALL display estimated hours input
10. WHEN creating a syllabus, THE System SHALL display effective date range pickers
11. WHEN listing syllabi, THE System SHALL display scope information (class, section) for each syllabus
12. WHEN listing syllabi, THE System SHALL provide filters for scope, status, curriculum type, and academic year

### Requirement 15: Validation and Error Handling

**User Story:** As an admin, I want clear validation messages and error handling, so that I can correct issues when creating or updating syllabi.

#### Acceptance Criteria

1. WHEN creating a syllabus with duplicate scope combination, THE System SHALL return error message "A syllabus already exists for this combination"
2. WHEN section-specific scope is selected without class, THE System SHALL return error message "Class must be selected for section-specific syllabus"
3. WHEN effectiveTo is before effectiveFrom, THE System SHALL return error message "End date must be after start date"
4. WHEN required fields are missing, THE System SHALL return specific error messages for each field
5. THE System SHALL validate all foreign key references (subject, class, section, academic year) exist before creation

### Requirement 16: Migration Script

**User Story:** As a system administrator, I want a safe migration script to upgrade the database schema, so that existing data is preserved during the upgrade.

#### Acceptance Criteria

1. THE System SHALL provide a Prisma migration file with all schema changes
2. WHEN migration runs, THE System SHALL add all new fields as nullable initially
3. WHEN migration runs, THE System SHALL set default values for existing records (status="Published", curriculumType="General", isActive=true)
4. WHEN migration runs, THE System SHALL create all new indexes
5. WHEN migration runs, THE System SHALL not lose any existing data
6. THE System SHALL provide rollback capability if migration fails

### Requirement 17: Permission and Access Control

**User Story:** As a system administrator, I want proper access control for syllabus management, so that only authorized users can perform specific actions.

#### Acceptance Criteria

1. WHEN user role is Admin, THE System SHALL allow create, read, update, delete, and status change operations
2. WHEN user role is Teacher, THE System SHALL allow read operations for published syllabi only
3. WHEN user role is Student, THE System SHALL allow read operations for published syllabi only
4. WHEN syllabus status is Draft, THE System SHALL restrict access to creator and admins only
5. THE System SHALL log all syllabus modifications in audit trail

### Requirement 18: Search and Filtering

**User Story:** As an admin or teacher, I want to search and filter syllabi by multiple criteria, so that I can quickly find relevant curricula.

#### Acceptance Criteria

1. WHEN searching syllabi, THE System SHALL support text search on title and description
2. WHEN filtering syllabi, THE System SHALL support filtering by subject
3. WHEN filtering syllabi, THE System SHALL support filtering by class
4. WHEN filtering syllabi, THE System SHALL support filtering by section
5. WHEN filtering syllabi, THE System SHALL support filtering by academic year
6. WHEN filtering syllabi, THE System SHALL support filtering by curriculum type
7. WHEN filtering syllabi, THE System SHALL support filtering by board type
8. WHEN filtering syllabi, THE System SHALL support filtering by status
9. WHEN filtering syllabi, THE System SHALL support filtering by tags
10. WHEN filtering syllabi, THE System SHALL support combining multiple filters

### Requirement 19: Cloning and Templating

**User Story:** As an admin, I want to clone existing syllabi to create new ones, so that I can save time when creating similar curricula.

#### Acceptance Criteria

1. WHEN cloning a syllabus, THE System SHALL copy all fields except id, createdAt, updatedAt
2. WHEN cloning a syllabus, THE System SHALL allow modifying scope (class, section, academic year) before saving
3. WHEN cloning a syllabus, THE System SHALL copy all modules, units, and documents
4. WHEN cloning a syllabus, THE System SHALL set status to "Draft" for the new syllabus
5. WHEN cloning a syllabus, THE System SHALL set createdBy to current user

### Requirement 20: Reporting and Analytics

**User Story:** As an admin, I want to view reports on syllabus usage and coverage, so that I can ensure all classes and sections have appropriate curricula.

#### Acceptance Criteria

1. WHEN viewing syllabus coverage report, THE System SHALL show which classes have syllabi
2. WHEN viewing syllabus coverage report, THE System SHALL show which sections have specific syllabi
3. WHEN viewing syllabus coverage report, THE System SHALL highlight gaps (classes/sections without syllabi)
4. WHEN viewing syllabus statistics, THE System SHALL show count by curriculum type
5. WHEN viewing syllabus statistics, THE System SHALL show count by status
