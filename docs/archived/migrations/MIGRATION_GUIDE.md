# Syllabus Migration Guide

This guide explains how to migrate from the old syllabus structure (Units → Lessons) to the new enhanced structure (Modules → SubModules).

## Overview

The migration script converts:
- **SyllabusUnit** → **Module** (with sequential chapter numbers)
- **Lesson** → **SubModule** (with preserved order)

All relationships and data are preserved during migration.

## Prerequisites

1. **Backup your database** before running the migration
2. Ensure you have the latest Prisma schema applied
3. Verify that the new Module/SubModule tables exist in your database

## Migration Commands

### 1. Dry Run (Recommended First Step)

Test the migration without making any changes:

```bash
npm run migrate:syllabus -- --dry-run
```

This will:
- Show what would be migrated
- Display statistics
- Identify any potential issues
- **Not modify the database**

### 2. Execute Migration

Run the actual migration:

```bash
npm run migrate:syllabus
```

This will:
- Convert all Units to Modules
- Convert all Lessons to SubModules
- Assign sequential chapter numbers (1, 2, 3, ...)
- Preserve all relationships
- Verify migration integrity
- Keep the old structure intact (for safety)

### 3. Verify Migration

Check migration integrity:

```bash
npm run migrate:syllabus -- --verify
```

This will:
- Verify all syllabi have correct module counts
- Check chapter numbers are sequential
- Identify any inconsistencies

### 4. Rollback (Same Session Only)

If you need to undo the migration immediately:

```bash
npm run migrate:syllabus -- --rollback
```

**Note:** Rollback only works in the same session as the migration. For manual rollback, delete all Module and SubModule records.

## Migration Process

### What Gets Migrated

For each Syllabus:
1. Each **SyllabusUnit** becomes a **Module**:
   - `title` → `title`
   - `description` → `description`
   - `order` → `order`
   - Sequential `chapterNumber` assigned (1, 2, 3, ...)

2. Each **Lesson** becomes a **SubModule**:
   - `title` → `title`
   - `description` → `description`
   - Sequential `order` assigned within module (1, 2, 3, ...)
   - Linked to parent Module

### What Doesn't Get Migrated

- The old Unit/Lesson structure remains intact
- No data is deleted during migration
- You can manually remove old data after verification

## Example Migration

**Before:**
```
Syllabus: "Mathematics Grade 10"
  ├── Unit 1: "Algebra" (order: 1)
  │   ├── Lesson: "Linear Equations"
  │   └── Lesson: "Quadratic Equations"
  └── Unit 2: "Geometry" (order: 2)
      ├── Lesson: "Triangles"
      └── Lesson: "Circles"
```

**After:**
```
Syllabus: "Mathematics Grade 10"
  ├── Module: "Algebra" (chapter: 1, order: 1)
  │   ├── SubModule: "Linear Equations" (order: 1)
  │   └── SubModule: "Quadratic Equations" (order: 2)
  └── Module: "Geometry" (chapter: 2, order: 2)
      ├── SubModule: "Triangles" (order: 1)
      └── SubModule: "Circles" (order: 2)
```

## Post-Migration Steps

1. **Verify the migration:**
   ```bash
   npm run migrate:syllabus -- --verify
   ```

2. **Test the new structure:**
   - Check admin UI for module management
   - Verify teacher can view modules
   - Ensure students can access content

3. **Update application code:**
   - Switch UI components to use new structure
   - Update API endpoints
   - Enable feature flags

4. **Clean up old data (optional):**
   After confirming everything works, you can remove old Units/Lessons:
   ```sql
   -- WARNING: Only run after thorough verification
   DELETE FROM "Lesson";
   DELETE FROM "SyllabusUnit";
   ```

## Troubleshooting

### Migration Fails with Unique Constraint Error

**Problem:** Chapter numbers conflict with existing modules.

**Solution:** 
- Check if modules already exist for the syllabus
- Run verification to identify conflicts
- Manually resolve conflicts before re-running

### Some Lessons Not Migrated

**Problem:** Lessons without a parent Unit.

**Solution:**
- Check for orphaned lessons in the database
- Assign them to a Unit before migration
- Or manually create SubModules for them

### Chapter Numbers Not Sequential

**Problem:** Modules have gaps in chapter numbers.

**Solution:**
- Run verification to identify issues
- The migration assigns sequential numbers automatically
- If issues persist, check for manual modifications

## Safety Features

1. **Non-destructive:** Old structure remains intact
2. **Dry-run mode:** Test before executing
3. **Verification:** Automatic integrity checks
4. **Rollback:** Undo in same session
5. **Error handling:** Continues on individual failures
6. **Progress reporting:** Detailed logs

## Database Schema

### Old Structure
```prisma
model SyllabusUnit {
  id          String
  title       String
  description String?
  syllabusId  String
  order       Int
  lessons     Lesson[]
}

model Lesson {
  id             String
  title          String
  description    String?
  syllabusUnitId String?
  // ... other fields
}
```

### New Structure
```prisma
model Module {
  id            String
  title         String
  description   String?
  chapterNumber Int
  order         Int
  syllabusId    String
  subModules    SubModule[]
  documents     SyllabusDocument[]
}

model SubModule {
  id          String
  title       String
  description String?
  order       Int
  moduleId    String
  documents   SyllabusDocument[]
  progress    SubModuleProgress[]
}
```

## Support

If you encounter issues:
1. Check the error messages in the migration output
2. Run verification to identify problems
3. Review this guide for troubleshooting steps
4. Check the migration script logs
5. Contact the development team if issues persist

## Best Practices

1. **Always run dry-run first**
2. **Backup your database before migration**
3. **Run during low-traffic periods**
4. **Verify thoroughly before cleanup**
5. **Keep old structure until fully tested**
6. **Document any manual changes**

## Migration Checklist

- [ ] Database backup completed
- [ ] Dry-run executed successfully
- [ ] Migration plan reviewed
- [ ] Stakeholders notified
- [ ] Migration executed
- [ ] Verification passed
- [ ] UI tested with new structure
- [ ] Old structure cleanup scheduled
- [ ] Documentation updated
