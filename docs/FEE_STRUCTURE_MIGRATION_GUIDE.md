# Fee Structure Migration Guide

## Overview

This guide explains how to migrate existing fee structures from the legacy text-based `applicableClasses` field to the new many-to-many relationship model using the `FeeStructureClass` junction table.

## Background

The enhanced fee structure system replaces the simple text field for class selection with a proper database relationship. This provides:

- **Better validation**: Only existing classes can be selected
- **Improved querying**: Filter fee structures by class efficiently
- **Data integrity**: Automatic cleanup when classes are deleted
- **Better UX**: Multi-select dropdown with search functionality

## Migration Process

### Step 1: Backup Your Database

**IMPORTANT**: Always backup your database before running migrations.

```bash
# Example PostgreSQL backup
pg_dump -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Preview Migration (Dry Run)

Run the migration in dry-run mode to preview what will be migrated:

```bash
npm run migrate:fee-structures -- --dry-run
```

This will:
- Show all fee structures with `applicableClasses` text
- Display which classes will be matched
- Highlight any unmatched class names
- **NOT make any changes to the database**

### Step 3: Review Dry Run Results

Check the output for:

1. **Matched Classes**: Classes that were successfully matched to database records
2. **Unmatched Classes**: Class names that couldn't be matched (⚠️ warnings)
3. **Already Migrated**: Fee structures that already have class associations

#### Common Unmatched Class Issues

Unmatched classes can occur due to:
- Typos in the original text field
- Classes that were deleted
- Different naming conventions (e.g., "Grade 10" vs "Class 10")

**Action Required**: For unmatched classes, you should:
1. Manually verify the class names in your database
2. Update the `applicableClasses` text field if needed
3. Or manually create `FeeStructureClass` records after migration

### Step 4: Run Migration

Once you're satisfied with the dry run results:

```bash
npm run migrate:fee-structures
```

The script will:
1. Wait 5 seconds (giving you time to cancel with Ctrl+C)
2. Process all fee structures with `applicableClasses` text
3. Create `FeeStructureClass` records for matched classes
4. Generate a detailed migration report
5. Save the report to `logs/fee-structure-migration-TIMESTAMP.log`

### Step 5: Validate Migration

After migration, validate the results:

```bash
npm run migrate:fee-structures -- --validate
```

This checks:
- All fee structures have proper class associations
- No fee structures are missing class data

### Step 6: Review Migration Report

Check the migration report in the `logs/` directory:

```
logs/fee-structure-migration-2025-12-26T10-30-45-123Z.log
```

The report includes:
- Total fee structures processed
- Successful migrations
- Failed migrations (with error details)
- Warnings for unmatched classes

## Migration Report Example

```
================================================================================
FEE STRUCTURE MIGRATION REPORT
================================================================================

Total Processed: 15
Successful: 14
Failed: 0
Warnings: 2

WARNINGS (Unmatched Classes):
--------------------------------------------------------------------------------
Fee Structure: Annual Fees 2024-25 (clxyz123abc)
Original Text: Grade 10, Grade 11, Grade 12, Grade 13
Matched Classes: 3
Unmatched Classes: Grade 13

Fee Structure: Sports Fees (clxyz456def)
Original Text: Class X, Class XI, Class XII
Matched Classes: 0
Unmatched Classes: Class X, Class XI, Class XII

================================================================================
```

## Handling Warnings

### Unmatched Classes

If you have unmatched classes, you have two options:

#### Option 1: Manual Association (Recommended)

Use the admin UI to manually add the correct classes to the fee structure:

1. Go to Finance → Fee Structures
2. Edit the fee structure
3. Use the multi-select dropdown to add the correct classes
4. Save

#### Option 2: Database Update

Manually create `FeeStructureClass` records:

```sql
-- Find the correct class ID
SELECT id, name FROM "Class" WHERE name LIKE '%Grade 10%';

-- Create the association
INSERT INTO "FeeStructureClass" ("id", "feeStructureId", "classId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'fee-structure-id-here',
  'class-id-here',
  NOW(),
  NOW()
);
```

## Post-Migration

### Verify UI

After migration, verify the UI:

1. Go to Finance → Fee Structures
2. Check that classes are displayed as badges
3. Edit a fee structure and verify the multi-select works
4. Create a new fee structure using the multi-select

### Clean Up (Optional)

Once you've verified the migration is successful, you can optionally remove the deprecated `applicableClasses` field:

**Note**: This is optional and should only be done after thorough testing.

```sql
-- Remove the deprecated field (OPTIONAL - only after verification)
ALTER TABLE "FeeStructure" DROP COLUMN "applicableClasses";
```

## Rollback

If you need to rollback the migration:

1. Restore from your database backup
2. Or manually delete `FeeStructureClass` records:

```sql
-- Delete all FeeStructureClass records (CAUTION)
DELETE FROM "FeeStructureClass";
```

## Troubleshooting

### Migration Fails with Foreign Key Error

**Cause**: Referenced class or fee structure doesn't exist

**Solution**: 
1. Run validation to identify the issue
2. Check that all classes exist in the database
3. Verify fee structure IDs are valid

### No Fee Structures Found

**Cause**: All fee structures already migrated or none have `applicableClasses` text

**Solution**: 
- Check if fee structures already have `FeeStructureClass` records
- Verify fee structures exist in the database

### Partial Migration

**Cause**: Migration was interrupted

**Solution**:
1. Run migration again (it will skip already migrated structures)
2. Or run validation to identify incomplete migrations

## Support

For issues or questions:
1. Check the migration report in `logs/`
2. Run validation to identify specific issues
3. Review the dry run output
4. Check the database directly

## Technical Details

### Database Schema

**Before Migration:**
```prisma
model FeeStructure {
  applicableClasses String? @db.Text  // Deprecated
}
```

**After Migration:**
```prisma
model FeeStructure {
  applicableClasses String? @db.Text  // Kept for backward compatibility
  classes FeeStructureClass[]         // New relationship
}

model FeeStructureClass {
  id             String       @id @default(cuid())
  feeStructure   FeeStructure @relation(...)
  feeStructureId String
  class          Class        @relation(...)
  classId        String
  
  @@unique([feeStructureId, classId])
}
```

### Migration Logic

1. **Parse**: Split `applicableClasses` text by common separators (comma, semicolon, newline)
2. **Match**: Case-insensitive matching against `Class.name` field
3. **Create**: Insert `FeeStructureClass` records for matched classes
4. **Warn**: Log unmatched class names for manual review
5. **Preserve**: Keep original `applicableClasses` text for reference

### Class Matching Algorithm

The migration service uses the following matching strategy:

1. **Exact Match** (case-insensitive): "Grade 10" matches "Grade 10"
2. **Partial Match** (contains): "Grade 10" matches "Grade 10 - Science"
3. **No Match**: Log as warning for manual review

## Best Practices

1. **Always run dry-run first** to preview changes
2. **Backup your database** before migration
3. **Review warnings** and fix unmatched classes
4. **Validate after migration** to ensure completeness
5. **Test the UI** after migration
6. **Keep migration reports** for audit trail

## FAQ

**Q: Can I run the migration multiple times?**  
A: Yes, the migration is idempotent. It will skip fee structures that already have class associations.

**Q: What happens to the original `applicableClasses` text?**  
A: It's preserved for backward compatibility and reference. You can optionally remove it later.

**Q: Will this affect existing fee payments?**  
A: No, the migration only affects class associations. Fee payments remain unchanged.

**Q: Can I manually create class associations instead of using the migration?**  
A: Yes, you can use the admin UI to manually add classes to fee structures.

**Q: What if I have custom class naming conventions?**  
A: Review the dry run output and manually fix unmatched classes using the UI or database.
