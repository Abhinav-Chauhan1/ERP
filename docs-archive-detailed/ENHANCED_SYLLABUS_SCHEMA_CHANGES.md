# Enhanced Syllabus Schema Changes

## Overview

This document summarizes the database schema changes made to support the Enhanced Syllabus Scope System as per Task 1 of the implementation plan.

## Changes Made

### 1. New Enums Added

#### SyllabusStatus
Manages the lifecycle state of syllabi:
- `DRAFT` - Initial state for new syllabi
- `PENDING_REVIEW` - Submitted for review
- `APPROVED` - Approved but not yet published
- `PUBLISHED` - Active and visible to users
- `ARCHIVED` - Kept for historical reference
- `DEPRECATED` - Old version replaced by newer version

#### CurriculumType
Defines the type of curriculum:
- `GENERAL` - Standard curriculum (default)
- `ADVANCED` - Advanced/honors curriculum
- `REMEDIAL` - Remedial/support curriculum
- `INTEGRATED` - Integrated curriculum
- `VOCATIONAL` - Vocational/technical curriculum
- `SPECIAL_NEEDS` - Special needs curriculum

#### DifficultyLevel
Indicates the difficulty level of the syllabus:
- `BEGINNER` - Beginner level
- `INTERMEDIATE` - Intermediate level (default)
- `ADVANCED` - Advanced level
- `EXPERT` - Expert level

### 2. Enhanced Syllabus Model

#### New Scope Fields (All Optional)
- `academicYearId` (String?) - Links to AcademicYear
- `classId` (String?) - Links to Class
- `sectionId` (String?) - Links to ClassSection

These optional fields enable flexible scope selection:
- All null = subject-wide syllabus
- Only classId = class-wide syllabus
- Both classId and sectionId = section-specific syllabus

#### Curriculum Classification
- `curriculumType` (CurriculumType) - Type of curriculum (default: GENERAL)
- `boardType` (String?) - Educational board (e.g., CBSE, ICSE, IB)

#### Lifecycle Management
- `status` (SyllabusStatus) - Current lifecycle status (default: DRAFT)
- `isActive` (Boolean) - Whether syllabus is active (default: true)
- `effectiveFrom` (DateTime?) - Start date of validity
- `effectiveTo` (DateTime?) - End date of validity

#### Versioning
- `version` (String) - Version number (default: "1.0")
- `parentSyllabusId` (String?) - Reference to parent syllabus
- `childVersions` (Syllabus[]) - Child versions of this syllabus

#### Ownership and Audit
- `createdBy` (String) - User ID who created the syllabus
- `updatedBy` (String?) - User ID who last updated
- `approvedBy` (String?) - User ID who approved
- `approvedAt` (DateTime?) - Timestamp of approval

#### Metadata
- `tags` (String[]) - Array of tags for categorization
- `difficultyLevel` (DifficultyLevel) - Difficulty level (default: INTERMEDIATE)
- `estimatedHours` (Int?) - Estimated hours to complete
- `prerequisites` (String?) - Prerequisites description

### 3. Indexes Added

For optimal query performance:
- `@@index([subjectId, classId])` - For scope-based queries
- `@@index([academicYearId, isActive])` - For active syllabi by year
- `@@index([status, isActive])` - For filtering by status
- `@@index([curriculumType, boardType])` - For curriculum filtering

### 4. Unique Constraint

Prevents duplicate syllabi for the same scope:
```prisma
@@unique([subjectId, academicYearId, classId, sectionId, curriculumType])
```

This ensures only one syllabus exists for each unique combination of:
- Subject
- Academic Year (or null for all years)
- Class (or null for all classes)
- Section (or null for all sections)
- Curriculum Type

### 5. Relationship Updates

#### AcademicYear Model
Added: `syllabi Syllabus[]`

#### Class Model
Added: `syllabi Syllabus[]`

#### ClassSection Model
Added: `syllabi Syllabus[]`

## Backward Compatibility

All new fields are optional or have default values, ensuring:
- Existing syllabi continue to work without modification
- Null scope fields are treated as subject-wide syllabi
- Default values maintain expected behavior

## Next Steps

1. Create and run database migration (Task 2)
2. Update Zod validation schemas (Task 3)
3. Implement server actions (Task 4)
4. Build UI components (Tasks 7-11)

## Requirements Satisfied

This schema update satisfies Requirements 12.1-12.18 from the requirements document:
- ✅ 12.1-12.3: Scope fields (academicYearId, classId, sectionId)
- ✅ 12.4-12.5: Curriculum fields (curriculumType, boardType)
- ✅ 12.6-12.8: Lifecycle fields (status, isActive, effective dates)
- ✅ 12.9-12.10: Versioning fields (version, parentSyllabusId)
- ✅ 12.11-12.12: Ownership fields (createdBy, updatedBy, approvedBy, approvedAt)
- ✅ 12.13-12.16: Metadata fields (tags, difficultyLevel, estimatedHours, prerequisites)
- ✅ 12.17: Unique constraint
- ✅ 12.18: Indexes

## Schema Validation

The schema has been validated using:
```bash
npx prisma format  # ✅ Passed
npx prisma validate # ✅ Passed
```
