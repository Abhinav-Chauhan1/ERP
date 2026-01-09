# Enhanced Syllabus Scope Fields Migration

## Overview

This migration adds enhanced scope and metadata fields to the Syllabus model to support flexible syllabus creation at multiple organizational levels (subject-wide, class-wide, section-specific), curriculum type management, lifecycle tracking, and versioning.

## Changes to Syllabus Model

### New Enums

1. **SyllabusStatus**
   - `DRAFT`: Initial state for new syllabi
   - `PENDING_REVIEW`: Submitted for review
   - `APPROVED`: Approved by admin
   - `PUBLISHED`: Active and visible to users
   - `ARCHIVED`: Inactive but preserved
   - `DEPRECATED`: Old version replaced by newer version

2. **CurriculumType**
   - `GENERAL`: Standard curriculum
   - `ADVANCED`: Advanced/honors curriculum
   - `REMEDIAL`: Remedial/support curriculum
   - `INTEGRATED`: Integrated curriculum
   - `VOCATIONAL`: Vocational training curriculum
   - `SPECIAL_NEEDS`: Special needs curriculum

3. **DifficultyLevel**
   - `BEGINNER`: Beginner level
   - `INTERMEDIATE`: Intermediate level (default)
   - `ADVANCED`: Advanced level
   - `EXPERT`: Expert level

### New Fields

#### Scope Fields (Optional - for flexible scope selection)
- `academicYearId`: Link to specific academic year (null = all years)
- `classId`: Link to specific class (null = all classes)
- `sectionId`: Link to specific section (null = all sections)

#### Curriculum Classification
- `curriculumType`: Type of curriculum (default: GENERAL)
- `boardType`: Educational board (e.g., CBSE, ICSE, State Board)

#### Lifecycle Management
- `status`: Current lifecycle status (default: DRAFT)
- `isActive`: Whether syllabus is active (default: true)
- `effectiveFrom`: Start date for syllabus validity
- `effectiveTo`: End date for syllabus validity

#### Versioning
- `version`: Version number (default: "1.0")
- `parentSyllabusId`: Reference to parent syllabus for version tracking

#### Ownership and Audit
- `createdBy`: User ID who created the syllabus (required)
- `updatedBy`: User ID who last updated the syllabus
- `approvedBy`: User ID who approved the syllabus
- `approvedAt`: Timestamp when syllabus was approved

#### Metadata
- `tags`: Array of tags for categorization
- `difficultyLevel`: Difficulty level (default: INTERMEDIATE)
- `estimatedHours`: Estimated hours to complete
- `prerequisites`: Prerequisites description

### New Indexes

For optimal query performance:
- `(subjectId, classId)`: For class-specific queries
- `(academicYearId, isActive)`: For active syllabi by year
- `(status, isActive)`: For filtering by status
- `(curriculumType, boardType)`: For curriculum filtering

### Unique Constraint

Ensures no duplicate syllabi for the same scope:
```
UNIQUE (subjectId, academicYearId, classId, sectionId, curriculumType)
```

This allows:
- Multiple syllabi for same subject with different classes
- Multiple syllabi for same subject with different sections
- Multiple syllabi for same subject with different curriculum types
- But prevents exact duplicates

## Migration Strategy

### Phase 1: Add Columns as Nullable
All new columns are added as nullable initially to avoid breaking existing data.

### Phase 2: Set Default Values for Existing Records
For backward compatibility, existing syllabi are updated with:
- `status` = 'PUBLISHED' (they were already in use)
- `curriculumType` = 'GENERAL' (standard curriculum)
- `difficultyLevel` = 'INTERMEDIATE' (middle level)
- `isActive` = true (they are active)
- `version` = '1.0' (first version)
- `createdBy` = 'system' (system migration)
- `tags` = [] (empty array)

### Phase 3: Make Required Fields NOT NULL
After setting defaults, required fields are made NOT NULL:
- `createdBy`
- `curriculumType`
- `difficultyLevel`
- `isActive`
- `status`
- `version`

## Backward Compatibility

This migration maintains full backward compatibility:

1. **Existing syllabi are preserved**: All existing data remains intact
2. **Default values applied**: Existing syllabi get sensible defaults
3. **Published status**: Existing syllabi are marked as PUBLISHED (they were already in use)
4. **Subject-wide scope**: Existing syllabi with null scope fields are treated as subject-wide
5. **Existing relationships maintained**: All relationships to SyllabusUnit, Module, etc. are preserved

## How to Apply

### Automatic Application (Recommended)
```bash
npx prisma migrate deploy
```

### Manual Application
```bash
psql -h <host> -U <user> -d <database> -f prisma/migrations/20260109124509_add_enhanced_syllabus_scope_fields/migration.sql
```

### Verify Migration
```bash
npx prisma migrate status
```

## Rollback

If you need to rollback this migration:

```sql
-- Drop foreign key constraints
ALTER TABLE "Syllabus" DROP CONSTRAINT IF EXISTS "Syllabus_academicYearId_fkey";
ALTER TABLE "Syllabus" DROP CONSTRAINT IF EXISTS "Syllabus_classId_fkey";
ALTER TABLE "Syllabus" DROP CONSTRAINT IF EXISTS "Syllabus_sectionId_fkey";
ALTER TABLE "Syllabus" DROP CONSTRAINT IF EXISTS "Syllabus_parentSyllabusId_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "Syllabus_subjectId_classId_idx";
DROP INDEX IF EXISTS "Syllabus_academicYearId_isActive_idx";
DROP INDEX IF EXISTS "Syllabus_status_isActive_idx";
DROP INDEX IF EXISTS "Syllabus_curriculumType_boardType_idx";
DROP INDEX IF EXISTS "Syllabus_subjectId_academicYearId_classId_sectionId_curricu_key";

-- Drop columns
ALTER TABLE "Syllabus" 
DROP COLUMN IF EXISTS "academicYearId",
DROP COLUMN IF EXISTS "approvedAt",
DROP COLUMN IF EXISTS "approvedBy",
DROP COLUMN IF EXISTS "boardType",
DROP COLUMN IF EXISTS "classId",
DROP COLUMN IF EXISTS "createdBy",
DROP COLUMN IF EXISTS "curriculumType",
DROP COLUMN IF EXISTS "difficultyLevel",
DROP COLUMN IF EXISTS "effectiveFrom",
DROP COLUMN IF EXISTS "effectiveTo",
DROP COLUMN IF EXISTS "estimatedHours",
DROP COLUMN IF EXISTS "isActive",
DROP COLUMN IF EXISTS "parentSyllabusId",
DROP COLUMN IF EXISTS "prerequisites",
DROP COLUMN IF EXISTS "sectionId",
DROP COLUMN IF EXISTS "status",
DROP COLUMN IF EXISTS "tags",
DROP COLUMN IF EXISTS "updatedBy",
DROP COLUMN IF EXISTS "version";

-- Drop enums
DROP TYPE IF EXISTS "SyllabusStatus";
DROP TYPE IF EXISTS "CurriculumType";
DROP TYPE IF EXISTS "DifficultyLevel";
```

## Testing

After applying the migration:

1. **Verify columns were added**:
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'Syllabus' 
   AND column_name IN ('academicYearId', 'classId', 'sectionId', 'status', 'curriculumType', 'createdBy');
   ```

2. **Verify enums were created**:
   ```sql
   SELECT typname FROM pg_type 
   WHERE typname IN ('SyllabusStatus', 'CurriculumType', 'DifficultyLevel');
   ```

3. **Verify indexes were created**:
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename = 'Syllabus' 
   AND indexname LIKE 'Syllabus_%';
   ```

4. **Verify unique constraint**:
   ```sql
   SELECT constraint_name 
   FROM information_schema.table_constraints 
   WHERE table_name = 'Syllabus' 
   AND constraint_type = 'UNIQUE';
   ```

5. **Verify existing data was updated**:
   ```sql
   SELECT id, status, curriculumType, isActive, createdBy 
   FROM "Syllabus" 
   LIMIT 5;
   ```

## Requirements Validated

This migration addresses the following requirements from the spec:

- **Requirement 1.1-1.6**: Flexible scope selection (subject-wide, class-wide, section-specific)
- **Requirement 2.1-2.5**: Multiple syllabi per subject with unique constraint
- **Requirement 3.1-3.5**: Academic year tracking
- **Requirement 4.1-4.5**: Curriculum type and board support
- **Requirement 5.1-5.6**: Syllabus lifecycle management
- **Requirement 6.1-6.5**: Effective date management
- **Requirement 7.1-7.5**: Ownership and authorship tracking
- **Requirement 8.1-8.5**: Syllabus versioning
- **Requirement 9.1-9.5**: Enhanced metadata
- **Requirement 11.1-11.5**: Backward compatibility
- **Requirement 12.1-12.18**: Database schema updates
- **Requirement 16.1-16.6**: Migration script requirements

## Notes

- This migration is safe to apply to production databases
- All changes are additive - no data is deleted
- Existing syllabi continue to work without modification
- The migration includes proper default values for backward compatibility
- Foreign key constraints use SET NULL on delete to prevent cascading deletes
- Indexes are created for optimal query performance
