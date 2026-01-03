# Enhanced Syllabus System - Migration Guide

## Table of Contents
1. [Overview](#overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Migration Process](#migration-process)
4. [Post-Migration Verification](#post-migration-verification)
5. [Rollback Procedure](#rollback-procedure)
6. [Troubleshooting](#troubleshooting)
7. [Technical Details](#technical-details)

## Overview

This guide provides step-by-step instructions for migrating from the legacy syllabus structure (Syllabus → Units → Lessons) to the enhanced structure (Syllabus → Modules → Sub-Modules).

### What Gets Migrated

The migration process converts:
- **Units** → **Modules** (with sequential chapter numbers)
- **Lessons** → **Sub-Modules** (preserving order)
- **Relationships** → Preserved (parent-child associations)
- **Metadata** → Preserved (titles, descriptions, timestamps)

### What Doesn't Change

- Syllabus records remain unchanged
- User permissions remain unchanged
- Existing references continue to work (backward compatibility)

### Migration Strategy

The migration follows a **non-destructive approach**:
1. New tables are created alongside existing tables
2. Data is copied and transformed
3. Old tables remain intact for rollback capability
4. Feature flag controls which UI is displayed

## Pre-Migration Checklist

### 1. Backup Your Database

**Critical**: Always backup your database before migration.

```bash
# PostgreSQL backup
pg_dump -U username -d database_name -F c -b -v -f backup_$(date +%Y%m%d_%H%M%S).dump

# Or use your backup script
npm run backup
```

### 2. Verify Database Schema

Ensure the new schema has been applied:

```bash
# Check for new tables
npx prisma db pull
npx prisma generate
```

Verify these tables exist:
- `Module`
- `SubModule`
- `Document`
- `SubModuleProgress`

### 3. Check Data Integrity

Run a data integrity check on existing data:

```sql
-- Check for orphaned lessons
SELECT l.* FROM "Lesson" l
LEFT JOIN "SyllabusUnit" u ON l."unitId" = u.id
WHERE u.id IS NULL;

-- Check for orphaned units
SELECT u.* FROM "SyllabusUnit" u
LEFT JOIN "Syllabus" s ON u."syllabusId" = s.id
WHERE s.id IS NULL;
```

### 4. Notify Users

Inform users about:
- Scheduled maintenance window
- Expected downtime (if any)
- What changes they'll see
- When the migration will occur

### 5. Test in Staging

**Always test the migration in a staging environment first**:

1. Clone production database to staging
2. Run migration on staging
3. Verify data integrity
4. Test UI functionality
5. Confirm rollback works

## Migration Process

### Step 1: Run Database Migration

Apply the schema changes:

```bash
# Apply Prisma migration
npx prisma migrate deploy
```

This creates the new tables without affecting existing data.

### Step 2: Run Data Migration Script

Execute the migration CLI command:

```bash
# Dry run (preview without making changes)
npm run migrate:syllabus -- --dry-run

# View detailed output
npm run migrate:syllabus -- --dry-run --verbose

# Actual migration
npm run migrate:syllabus

# With progress reporting
npm run migrate:syllabus -- --verbose
```

### Step 3: Monitor Migration Progress

The migration script provides real-time feedback:

```
Starting syllabus migration...
Found 15 syllabi to migrate

Migrating syllabus: Mathematics Grade 10 (1/15)
  ✓ Created 8 modules from units
  ✓ Created 24 sub-modules from lessons
  ✓ Assigned sequential chapter numbers
  ✓ Preserved all relationships

Migrating syllabus: English Grade 9 (2/15)
  ✓ Created 6 modules from units
  ✓ Created 18 sub-modules from lessons
  ...

Migration completed successfully!
Total: 15 syllabi, 120 modules, 360 sub-modules
Duration: 45 seconds
```

### Step 4: Verify Migration

Run verification queries:

```sql
-- Count migrated modules
SELECT COUNT(*) FROM "Module";

-- Count migrated sub-modules
SELECT COUNT(*) FROM "SubModule";

-- Verify relationships
SELECT 
  s.title as syllabus,
  COUNT(DISTINCT m.id) as modules,
  COUNT(DISTINCT sm.id) as submodules
FROM "Syllabus" s
LEFT JOIN "Module" m ON m."syllabusId" = s.id
LEFT JOIN "SubModule" sm ON sm."moduleId" = m.id
GROUP BY s.id, s.title;
```

### Step 5: Enable Feature Flag

Update the feature flag to show the new UI:

```typescript
// In your environment or feature flag system
ENHANCED_SYLLABUS_ENABLED=true
```

Or update in the database:

```sql
UPDATE "SchoolSettings" 
SET "enhancedSyllabusEnabled" = true 
WHERE "schoolId" = 'your-school-id';
```

### Step 6: Test the New UI

1. Log in as an admin user
2. Navigate to a syllabus
3. Verify modules and sub-modules display correctly
4. Test creating new content
5. Test editing existing content
6. Test document uploads

## Post-Migration Verification

### Data Integrity Checks

Run these queries to verify data integrity:

```sql
-- 1. Verify all units were converted to modules
SELECT 
  (SELECT COUNT(*) FROM "SyllabusUnit") as old_units,
  (SELECT COUNT(*) FROM "Module") as new_modules;

-- 2. Verify all lessons were converted to sub-modules
SELECT 
  (SELECT COUNT(*) FROM "Lesson") as old_lessons,
  (SELECT COUNT(*) FROM "SubModule") as new_submodules;

-- 3. Check for missing relationships
SELECT m.* FROM "Module" m
LEFT JOIN "Syllabus" s ON m."syllabusId" = s.id
WHERE s.id IS NULL;

-- 4. Verify chapter numbers are sequential
SELECT 
  "syllabusId",
  COUNT(*) as total_modules,
  MIN("chapterNumber") as min_chapter,
  MAX("chapterNumber") as max_chapter
FROM "Module"
GROUP BY "syllabusId"
HAVING MAX("chapterNumber") != COUNT(*);

-- 5. Check for duplicate chapter numbers
SELECT "syllabusId", "chapterNumber", COUNT(*)
FROM "Module"
GROUP BY "syllabusId", "chapterNumber"
HAVING COUNT(*) > 1;
```

### Functional Testing

Test these scenarios:

1. **View syllabus**: Verify all content displays correctly
2. **Create module**: Add a new module and verify it saves
3. **Create sub-module**: Add a new sub-module and verify it saves
4. **Upload document**: Upload a file and verify it's accessible
5. **Reorder content**: Drag and drop to reorder, verify persistence
6. **Delete content**: Delete a module and verify cascade deletion
7. **Progress tracking**: Mark sub-modules complete and verify percentages

### Performance Testing

Monitor performance metrics:

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT m.*, sm.*
FROM "Module" m
LEFT JOIN "SubModule" sm ON sm."moduleId" = m.id
WHERE m."syllabusId" = 'test-syllabus-id'
ORDER BY m."chapterNumber", sm."order";

-- Verify indexes are being used
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename IN ('Module', 'SubModule', 'Document')
ORDER BY idx_scan DESC;
```

## Rollback Procedure

If issues arise, you can rollback the migration:

### Option 1: Disable Feature Flag

Revert to the old UI without losing migrated data:

```typescript
ENHANCED_SYLLABUS_ENABLED=false
```

This keeps the new data but shows the old UI.

### Option 2: Database Rollback

If you need to completely rollback:

```bash
# Restore from backup
pg_restore -U username -d database_name -v backup_file.dump

# Or use your restore script
npm run restore -- backup_file.dump
```

### Option 3: Selective Rollback

Remove only the migrated data:

```sql
-- Delete migrated data (in order)
DELETE FROM "SubModuleProgress";
DELETE FROM "Document" WHERE "moduleId" IS NOT NULL OR "subModuleId" IS NOT NULL;
DELETE FROM "SubModule";
DELETE FROM "Module";

-- Verify old data is intact
SELECT COUNT(*) FROM "SyllabusUnit";
SELECT COUNT(*) FROM "Lesson";
```

## Troubleshooting

### Issue: Migration Script Fails

**Symptoms**: Script exits with error

**Solutions**:
1. Check database connection
2. Verify schema is up to date
3. Check for data integrity issues
4. Review error logs
5. Run with `--verbose` flag for details

```bash
npm run migrate:syllabus -- --verbose
```

### Issue: Duplicate Chapter Numbers

**Symptoms**: Error about unique constraint violation

**Solutions**:
1. Check for existing modules with duplicate chapter numbers
2. Run cleanup query:

```sql
-- Find duplicates
SELECT "syllabusId", "chapterNumber", COUNT(*)
FROM "Module"
GROUP BY "syllabusId", "chapterNumber"
HAVING COUNT(*) > 1;

-- Fix duplicates (reassign chapter numbers)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "syllabusId" ORDER BY "order") as new_chapter
  FROM "Module"
)
UPDATE "Module" m
SET "chapterNumber" = n.new_chapter
FROM numbered n
WHERE m.id = n.id;
```

### Issue: Missing Relationships

**Symptoms**: Sub-modules not appearing under modules

**Solutions**:
1. Verify foreign key relationships:

```sql
SELECT sm.id, sm.title, sm."moduleId", m.id as actual_module_id
FROM "SubModule" sm
LEFT JOIN "Module" m ON sm."moduleId" = m.id
WHERE m.id IS NULL;
```

2. Fix orphaned sub-modules:

```sql
-- Delete orphaned sub-modules
DELETE FROM "SubModule"
WHERE "moduleId" NOT IN (SELECT id FROM "Module");
```

### Issue: Performance Degradation

**Symptoms**: Slow page loads, slow queries

**Solutions**:
1. Verify indexes exist:

```sql
-- Check indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('Module', 'SubModule', 'Document');
```

2. Create missing indexes:

```sql
CREATE INDEX IF NOT EXISTS "Module_syllabusId_order_idx" ON "Module"("syllabusId", "order");
CREATE INDEX IF NOT EXISTS "SubModule_moduleId_order_idx" ON "SubModule"("moduleId", "order");
CREATE INDEX IF NOT EXISTS "Document_moduleId_idx" ON "Document"("moduleId");
CREATE INDEX IF NOT EXISTS "Document_subModuleId_idx" ON "Document"("subModuleId");
```

3. Analyze tables:

```sql
ANALYZE "Module";
ANALYZE "SubModule";
ANALYZE "Document";
```

### Issue: UI Not Updating

**Symptoms**: Old UI still showing after migration

**Solutions**:
1. Clear browser cache
2. Verify feature flag is enabled
3. Check server logs for errors
4. Restart the application server

```bash
# Clear Next.js cache
rm -rf .next
npm run build
npm run start
```

## Technical Details

### Migration Algorithm

The migration follows this algorithm:

```typescript
for each syllabus:
  chapterNumber = 1
  
  for each unit in syllabus (ordered by unit.order):
    // Create module from unit
    module = createModule({
      title: unit.title,
      description: unit.description,
      chapterNumber: chapterNumber++,
      order: unit.order,
      syllabusId: syllabus.id
    })
    
    for each lesson in unit (ordered by lesson.order):
      // Create sub-module from lesson
      subModule = createSubModule({
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        moduleId: module.id
      })
```

### Data Mapping

| Old Structure | New Structure | Transformation |
|---------------|---------------|----------------|
| `SyllabusUnit.title` | `Module.title` | Direct copy |
| `SyllabusUnit.description` | `Module.description` | Direct copy |
| `SyllabusUnit.order` | `Module.order` | Direct copy |
| N/A | `Module.chapterNumber` | Sequential (1, 2, 3...) |
| `Lesson.title` | `SubModule.title` | Direct copy |
| `Lesson.description` | `SubModule.description` | Direct copy |
| `Lesson.order` | `SubModule.order` | Direct copy or default to 1 |
| `Lesson.unitId` | `SubModule.moduleId` | Mapped to new module ID |

### Transaction Safety

The migration uses database transactions to ensure atomicity:

```typescript
await prisma.$transaction(async (tx) => {
  // All operations within this block are atomic
  const module = await tx.module.create({...});
  const subModules = await tx.subModule.createMany({...});
  // If any operation fails, all are rolled back
});
```

### Backward Compatibility

The old tables remain in the database:
- `Syllabus` (unchanged)
- `SyllabusUnit` (deprecated but functional)
- `Lesson` (deprecated but functional)

This allows:
- Rollback capability
- Gradual transition
- Data comparison and verification

## Best Practices

1. **Always backup before migration**: No exceptions
2. **Test in staging first**: Never migrate production directly
3. **Run during low-traffic periods**: Minimize user impact
4. **Monitor closely**: Watch for errors during migration
5. **Verify thoroughly**: Check data integrity after migration
6. **Keep old data**: Don't delete old tables immediately
7. **Document issues**: Record any problems for future reference
8. **Communicate with users**: Keep stakeholders informed

## Migration Checklist

Use this checklist to track your migration:

- [ ] Database backup completed
- [ ] Staging environment tested
- [ ] Users notified of maintenance
- [ ] Schema migration applied
- [ ] Data migration script executed
- [ ] Data integrity verified
- [ ] Feature flag enabled
- [ ] UI functionality tested
- [ ] Performance metrics checked
- [ ] Documentation updated
- [ ] Users notified of completion
- [ ] Old data archived (after grace period)

## Support

For migration assistance:
1. Review this guide thoroughly
2. Check the troubleshooting section
3. Review migration logs
4. Contact technical support with:
   - Error messages
   - Migration logs
   - Database version
   - Application version

---

**Last Updated**: December 2024  
**Version**: 1.0
