# Fee Structure Migration - Quick Reference

## Quick Commands

```bash
# 1. Preview migration (recommended first step)
npm run migrate:fee-structures -- --dry-run

# 2. Run migration
npm run migrate:fee-structures

# 3. Validate results
npm run migrate:fee-structures -- --validate

# 4. Test migration service
npm run test:fee-migration

# 5. Show help
npm run migrate:fee-structures -- --help
```

## Migration Checklist

- [ ] **Backup database** before migration
- [ ] **Run dry-run** to preview changes
- [ ] **Review warnings** for unmatched classes
- [ ] **Run migration** when ready
- [ ] **Validate results** after migration
- [ ] **Check migration report** in `logs/` directory
- [ ] **Test UI** to verify multi-select works
- [ ] **Fix unmatched classes** manually if needed

## Common Issues & Solutions

### Issue: Unmatched Classes

**Symptoms**: Migration report shows unmatched class names

**Solutions**:
1. Check class names in database: `SELECT name FROM "Class";`
2. Update `applicableClasses` text field to match exact names
3. Or manually add classes via UI after migration

### Issue: Migration Already Run

**Symptoms**: "Already migrated" messages in dry-run

**Solution**: This is normal. Migration is idempotent and skips already migrated structures.

### Issue: No Fee Structures Found

**Symptoms**: "Found 0 fee structures to migrate"

**Solutions**:
1. Check if fee structures exist: `SELECT COUNT(*) FROM "FeeStructure";`
2. Check if they have `applicableClasses` text: `SELECT COUNT(*) FROM "FeeStructure" WHERE "applicableClasses" IS NOT NULL;`
3. If already migrated, this is expected behavior

## File Locations

- **Migration Service**: `src/lib/services/fee-structure-migration-service.ts`
- **Migration Script**: `scripts/migrate-fee-structure-classes.ts`
- **Test Script**: `scripts/test-fee-structure-migration.ts`
- **Migration Reports**: `logs/fee-structure-migration-*.log`
- **Full Guide**: `docs/FEE_STRUCTURE_MIGRATION_GUIDE.md`

## Database Queries

```sql
-- Check fee structures with text-based classes
SELECT id, name, "applicableClasses" 
FROM "FeeStructure" 
WHERE "applicableClasses" IS NOT NULL;

-- Check fee structures with relationship-based classes
SELECT fs.id, fs.name, COUNT(fsc."classId") as class_count
FROM "FeeStructure" fs
LEFT JOIN "FeeStructureClass" fsc ON fs.id = fsc."feeStructureId"
GROUP BY fs.id, fs.name;

-- Check for fee structures missing class associations
SELECT id, name 
FROM "FeeStructure" 
WHERE "applicableClasses" IS NULL 
  AND id NOT IN (SELECT DISTINCT "feeStructureId" FROM "FeeStructureClass");

-- View all classes
SELECT id, name, "academicYearId" FROM "Class" ORDER BY name;
```

## Migration Report Example

```
Total Processed: 15
Successful: 14
Failed: 0
Warnings: 2

⚠️  Warnings indicate unmatched class names
✅  Successful migrations created FeeStructureClass records
❌  Failed migrations need manual investigation
```

## Post-Migration Verification

1. **UI Check**: Go to Finance → Fee Structures
2. **View Classes**: Classes should appear as badges
3. **Edit Structure**: Multi-select should show current classes
4. **Create New**: Multi-select should work for new structures
5. **Filter**: Class filter should work in list view

## Rollback

```sql
-- Delete all FeeStructureClass records (CAUTION)
DELETE FROM "FeeStructureClass";

-- Or restore from backup
psql -U username -d database_name < backup_file.sql
```

## Support

- Check migration report in `logs/`
- Run validation: `npm run migrate:fee-structures -- --validate`
- Review full guide: `docs/FEE_STRUCTURE_MIGRATION_GUIDE.md`
- Test service: `npm run test:fee-migration`
