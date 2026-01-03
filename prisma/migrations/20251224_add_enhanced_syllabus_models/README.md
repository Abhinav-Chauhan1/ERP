# Enhanced Syllabus System Migration

## Overview

This migration adds new database models to support the enhanced syllabus system with a three-level hierarchy:
- **Syllabus** → **Module** (Chapters) → **SubModule** (Topics)

## New Models

### 1. Module
Represents a chapter or major topic area within a syllabus.

**Fields:**
- `id`: Unique identifier
- `title`: Module/chapter title
- `description`: Optional description
- `chapterNumber`: Unique chapter number within syllabus
- `order`: Display order
- `syllabusId`: Reference to parent syllabus
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `(syllabusId, order)`: For efficient ordering queries
- `(syllabusId, chapterNumber)`: For chapter number lookups
- Unique constraint on `(syllabusId, chapterNumber)`: Ensures chapter numbers are unique per syllabus

### 2. SubModule
Represents a topic or section within a module.

**Fields:**
- `id`: Unique identifier
- `title`: SubModule/topic title
- `description`: Optional description
- `order`: Display order within module
- `moduleId`: Reference to parent module
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `(moduleId, order)`: For efficient ordering queries
- `moduleId`: For module lookups

### 3. SyllabusDocument
Represents documents attached to modules or sub-modules.

**Fields:**
- `id`: Unique identifier
- `title`: Document title
- `description`: Optional description
- `filename`: Original filename
- `fileUrl`: URL to stored file (Cloudinary)
- `fileType`: MIME type
- `fileSize`: Size in bytes
- `order`: Display order
- `moduleId`: Optional reference to module
- `subModuleId`: Optional reference to sub-module
- `uploadedBy`: User ID who uploaded
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `moduleId`: For module document lookups
- `subModuleId`: For sub-module document lookups
- `(moduleId, order)`: For ordered module documents
- `(subModuleId, order)`: For ordered sub-module documents

### 4. SubModuleProgress
Tracks teacher progress through sub-modules.

**Fields:**
- `id`: Unique identifier
- `subModuleId`: Reference to sub-module
- `teacherId`: Teacher ID
- `completed`: Completion status
- `completedAt`: Timestamp when completed
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `teacherId`: For teacher progress lookups
- `(subModuleId, teacherId)`: For specific progress lookups
- Unique constraint on `(subModuleId, teacherId)`: One progress record per teacher per sub-module

## Relationships

```
Syllabus (existing)
  ├── Module (new)
  │     ├── SubModule (new)
  │     │     ├── SyllabusDocument (new)
  │     │     └── SubModuleProgress (new)
  │     └── SyllabusDocument (new)
  └── [Legacy: SyllabusUnit → Lesson] (maintained for backward compatibility)
```

## Migration Strategy

### Phase 1: Schema Extension (This Migration)
✅ Add new tables without breaking existing structure
✅ Keep existing `SyllabusUnit` and `Lesson` tables
✅ Add indexes for performance optimization

### Phase 2: Data Migration (Separate Script)
- Convert existing `SyllabusUnit` → `Module`
- Convert existing `Lesson` → `SubModule`
- Preserve all relationships and data

### Phase 3: Code Migration
- Update UI components to use new structure
- Add feature flag for gradual rollout
- Maintain backward compatibility

### Phase 4: Deprecation
- Mark old endpoints as deprecated
- Remove old code after transition period

## How to Apply

### When Database is Available:
```bash
npx prisma migrate deploy
```

### Manual Application:
```bash
psql -h <host> -U <user> -d <database> -f prisma/migrations/20251224_add_enhanced_syllabus_models/migration.sql
```

### Verify Migration:
```bash
npx prisma migrate status
```

## Rollback

If you need to rollback this migration:

```sql
-- Drop foreign key constraints first
ALTER TABLE "SubModuleProgress" DROP CONSTRAINT "SubModuleProgress_subModuleId_fkey";
ALTER TABLE "SyllabusDocument" DROP CONSTRAINT "SyllabusDocument_subModuleId_fkey";
ALTER TABLE "SyllabusDocument" DROP CONSTRAINT "SyllabusDocument_moduleId_fkey";
ALTER TABLE "SubModule" DROP CONSTRAINT "SubModule_moduleId_fkey";
ALTER TABLE "Module" DROP CONSTRAINT "Module_syllabusId_fkey";

-- Drop tables
DROP TABLE "SubModuleProgress";
DROP TABLE "SyllabusDocument";
DROP TABLE "SubModule";
DROP TABLE "Module";
```

## Performance Considerations

The migration includes several indexes to optimize query performance:

1. **Module queries**: Indexed by `(syllabusId, order)` and `(syllabusId, chapterNumber)`
2. **SubModule queries**: Indexed by `(moduleId, order)`
3. **Document queries**: Indexed by parent ID and order
4. **Progress queries**: Indexed by teacher and sub-module

## Testing

After applying the migration:

1. Verify all tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('Module', 'SubModule', 'SyllabusDocument', 'SubModuleProgress');
   ```

2. Verify indexes were created:
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename IN ('Module', 'SubModule', 'SyllabusDocument', 'SubModuleProgress');
   ```

3. Verify foreign key constraints:
   ```sql
   SELECT constraint_name, table_name 
   FROM information_schema.table_constraints 
   WHERE constraint_type = 'FOREIGN KEY' 
   AND table_name IN ('Module', 'SubModule', 'SyllabusDocument', 'SubModuleProgress');
   ```

## Requirements Validated

This migration addresses the following requirements:

- **Requirement 1.1**: Module creation with title, description, chapter number, and order
- **Requirement 1.2**: Chapter number uniqueness validation (unique constraint)
- **Requirement 2.1**: Sub-module creation with title, description, and order
- **Requirement 3.1, 3.2**: Document storage with complete metadata
- **Requirement 10.1**: Progress tracking storage

## Notes

- All new tables use cascade delete to maintain referential integrity
- The existing `Syllabus`, `SyllabusUnit`, and `Lesson` models are preserved for backward compatibility
- No data is modified or deleted in this migration
- The migration is non-breaking and can be safely applied to production
