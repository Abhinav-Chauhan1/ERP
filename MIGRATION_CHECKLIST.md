# School Settings Consolidation - Migration Checklist

## Pre-Migration

- [x] Schema changes reviewed and approved
- [x] Migration scripts created
- [x] Documentation written
- [x] Prisma schema validated
- [x] Prisma client generated
- [ ] Database backup created
- [ ] Staging environment ready
- [ ] Team notified of migration

## Migration Execution

### 1. Backup Database
```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup_before_settings_migration_$(date +%Y%m%d_%H%M%S).sql
```

- [ ] Database backup created
- [ ] Backup verified and stored safely

### 2. Apply Schema Migration
```bash
npx prisma migrate deploy
```

**Expected Output:**
- ✅ Creates `school_settings` table
- ✅ Adds indexes
- ✅ Adds foreign key constraints
- ✅ Old tables remain intact

**Verification:**
```sql
-- Check new table exists
SELECT COUNT(*) FROM school_settings;

-- Check old tables still exist
SELECT COUNT(*) FROM system_settings;
SELECT COUNT(*) FROM "SchoolSecuritySettings";
SELECT COUNT(*) FROM "SchoolDataManagementSettings";
SELECT COUNT(*) FROM "SchoolNotificationSettings";
```

- [ ] Schema migration applied successfully
- [ ] New table created
- [ ] Old tables still exist
- [ ] No errors in migration

### 3. Run Data Migration
```bash
npx tsx scripts/migrate-school-settings-consolidation.ts
```

**Expected Output:**
```
🚀 Starting School Settings Consolidation Migration...

📊 Found X schools to migrate

🏫 Processing: School Name (CODE)
  ✓ SystemSettings: Found
  ✓ SecuritySettings: Found
  ✓ DataSettings: Found
  ✓ NotificationSettings: Found
  ✅ Successfully migrated to SchoolSettings

...

📊 MIGRATION SUMMARY
Total Schools:        X
✅ Successful:        X
❌ Failed:            0

🔍 Verifying migration...
Schools in database:          X
SchoolSettings records:       X
✅ All schools have SchoolSettings records!

✨ Migration completed successfully!
```

**Checklist:**
- [ ] Migration script ran without errors
- [ ] All schools migrated successfully
- [ ] No failed migrations
- [ ] Verification passed

### 4. Verify Data Integrity

#### A. Count Verification
```sql
-- Should match
SELECT COUNT(*) FROM schools;
SELECT COUNT(*) FROM school_settings;
```
- [ ] Counts match

#### B. Sample Data Verification
```sql
-- Compare old vs new for a few schools
SELECT 
  s.name,
  ss.emailEnabled as old_email,
  ns.emailEnabled as new_email,
  ss.smsEnabled as old_sms,
  ns.smsEnabled as new_sms,
  sec.twoFactorEnabled as old_2fa,
  ns.twoFactorEnabled as new_2fa
FROM schools s
LEFT JOIN system_settings ss ON s.id = ss."schoolId"
LEFT JOIN school_settings ns ON s.id = ns."schoolId"
LEFT JOIN "SchoolSecuritySettings" sec ON s.id = sec."schoolId"
LIMIT 10;
```
- [ ] Sample data looks correct
- [ ] No data loss detected
- [ ] Values match expected patterns

#### C. Specific Field Checks
```sql
-- Check critical fields
SELECT 
  schoolId,
  emailEnabled,
  smsEnabled,
  twoFactorEnabled,
  backupFrequency,
  sessionTimeout,
  passwordMinLength
FROM school_settings
LIMIT 10;
```
- [ ] Email settings correct
- [ ] SMS settings correct
- [ ] Security settings correct
- [ ] Backup settings correct

### 5. Update Application Code

#### Files to Update (Search for these patterns):
```bash
# Find all references to old models
grep -r "systemSettings" src/
grep -r "schoolSecuritySettings" src/
grep -r "schoolDataManagementSettings" src/
grep -r "schoolNotificationSettings" src/
grep -r "SystemSettings" src/
grep -r "SchoolSecuritySettings" src/
grep -r "SchoolDataManagementSettings" src/
grep -r "SchoolNotificationSettings" src/
```

**Common patterns to replace:**

1. **Queries:**
```typescript
// OLD
const systemSettings = await prisma.systemSettings.findUnique({ where: { schoolId } });
const securitySettings = await prisma.schoolSecuritySettings.findUnique({ where: { schoolId } });

// NEW
const settings = await prisma.schoolSettings.findUnique({ where: { schoolId } });
```

2. **Updates:**
```typescript
// OLD
await prisma.systemSettings.update({ where: { schoolId }, data: { emailEnabled: true } });

// NEW
await prisma.schoolSettings.update({ where: { schoolId }, data: { emailEnabled: true } });
```

3. **Creates:**
```typescript
// OLD
await prisma.systemSettings.create({ data: { schoolId, schoolName: 'Test' } });

// NEW
await prisma.schoolSettings.create({ data: { schoolId, schoolName: 'Test' } });
```

4. **Includes:**
```typescript
// OLD
include: { systemSettings: true, securitySettings: true }

// NEW
include: { settings: true }
```

- [ ] All code references updated
- [ ] No compilation errors
- [ ] No TypeScript errors

### 6. Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- settings
npm test -- school
npm test -- security
```

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] No test failures

### 7. Test in Staging

**Manual Testing:**
- [ ] View school settings page
- [ ] Update email settings
- [ ] Update SMS settings
- [ ] Update security settings
- [ ] Update backup settings
- [ ] Update notification preferences
- [ ] Update branding settings
- [ ] Verify changes persist
- [ ] Check audit logs

**API Testing:**
```bash
# Test GET settings
curl -X GET http://staging.example.com/api/schools/{id}/settings

# Test UPDATE settings
curl -X PATCH http://staging.example.com/api/schools/{id}/settings \
  -H "Content-Type: application/json" \
  -d '{"emailEnabled": true, "smsEnabled": false}'
```

- [ ] All API endpoints work
- [ ] Settings CRUD operations work
- [ ] No errors in logs
- [ ] Performance is good

### 8. Deploy to Production

**Pre-Deployment:**
- [ ] All tests pass
- [ ] Staging verified
- [ ] Team ready
- [ ] Rollback plan ready
- [ ] Monitoring ready

**Deployment:**
```bash
# 1. Create production backup
pg_dump $PROD_DATABASE_URL > prod_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migrations
npx prisma migrate deploy

# 3. Run data migration
npx tsx scripts/migrate-school-settings-consolidation.ts

# 4. Deploy application code
git push production main
```

- [ ] Production backup created
- [ ] Migrations applied
- [ ] Data migrated
- [ ] Application deployed
- [ ] No errors in deployment

### 9. Post-Deployment Verification

**Immediate Checks (First 5 minutes):**
- [ ] Application starts successfully
- [ ] No errors in logs
- [ ] Settings pages load
- [ ] Can view settings
- [ ] Can update settings

**Extended Monitoring (First hour):**
- [ ] No increase in error rate
- [ ] Response times normal
- [ ] Database performance normal
- [ ] No user complaints

**Database Checks:**
```sql
-- Verify all schools have settings
SELECT COUNT(*) FROM schools;
SELECT COUNT(*) FROM school_settings;

-- Check for any NULL critical fields
SELECT COUNT(*) FROM school_settings WHERE emailEnabled IS NULL;
SELECT COUNT(*) FROM school_settings WHERE schoolName IS NULL;
```

- [ ] All schools have settings
- [ ] No critical NULL fields
- [ ] Data looks correct

### 10. Cleanup (After 7 Days)

**Only after confirming everything works for at least a week:**

```bash
# Apply cleanup migration to drop old tables
npx prisma migrate deploy
```

**Or manually:**
```sql
DROP TABLE IF EXISTS "SchoolSecuritySettings" CASCADE;
DROP TABLE IF EXISTS "SchoolDataManagementSettings" CASCADE;
DROP TABLE IF EXISTS "SchoolNotificationSettings" CASCADE;
DROP TABLE IF EXISTS "system_settings" CASCADE;
```

**Before dropping:**
- [ ] 7+ days in production with no issues
- [ ] All features working correctly
- [ ] No rollback needed
- [ ] Team approval obtained
- [ ] Final backup created

**After dropping:**
- [ ] Old tables removed
- [ ] Database size reduced
- [ ] No errors in application
- [ ] Monitoring shows no issues

## Rollback Procedure

### If Issues Found Before Dropping Old Tables

1. **Revert application code:**
```bash
git revert <commit-hash>
git push production main
```

2. **Data is safe** - Old tables still exist with original data

3. **Investigate and fix issues**

4. **Re-run migration when ready**

### If Issues Found After Dropping Old Tables

1. **Stop application**

2. **Restore from backup:**
```bash
psql $DATABASE_URL < backup_before_settings_migration_YYYYMMDD_HHMMSS.sql
```

3. **Revert application code**

4. **Investigate and fix issues**

5. **Re-run migration when ready**

## Success Criteria

- [x] Schema validated
- [ ] All schools migrated
- [ ] No data loss
- [ ] All tests pass
- [ ] Staging verified
- [ ] Production deployed
- [ ] No errors in monitoring
- [ ] Performance improved
- [ ] Old tables dropped (after 7 days)

## Documentation

- [x] Migration guide written
- [x] API reference created
- [x] Code examples provided
- [x] Checklist created
- [ ] Team trained
- [ ] Wiki updated

## Support Contacts

- **Database Admin**: [Contact]
- **DevOps**: [Contact]
- **Backend Lead**: [Contact]
- **On-Call Engineer**: [Contact]

## Notes

- Migration estimated time: 5-10 minutes for 100 schools
- Downtime required: None (zero-downtime migration)
- Best time to run: Low-traffic hours
- Monitoring: Watch error rates and response times

---

**Migration Status**: ⏳ Ready to Execute
**Last Updated**: 2026-02-09
**Prepared By**: AI Assistant
