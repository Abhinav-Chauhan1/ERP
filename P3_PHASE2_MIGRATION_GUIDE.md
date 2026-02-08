# P3 Phase 2 - Migration Quick Guide

**Status**: ✅ Code Complete, Ready for Migration  
**Estimated Time**: 1.5-2.5 hours  
**Risk Level**: LOW (rollback available)

---

## 🎯 What This Migration Does

Converts the `SystemSettings` table from a single global record to per-school records, ensuring each school has isolated settings for:

- School information (name, logo, contact)
- Academic settings (grading scale, passing grade)
- Notification preferences (email, SMS, WhatsApp)
- Appearance settings (theme, colors, branding)
- Payment configuration (online/offline, receipt settings)

---

## ✅ Pre-Migration Checklist

Before starting, verify:

- [ ] All code changes are deployed
- [ ] Database backup is recent (< 24 hours)
- [ ] You have database access credentials
- [ ] You're in a maintenance window or off-peak hours
- [ ] You have 2-3 hours available
- [ ] Rollback script is ready: `scripts/rollback-system-settings-migration.ts`

---

## 🚀 Migration Steps

### Step 1: Generate Prisma Client (2 minutes)

```bash
# Regenerate Prisma client with new schema
npx prisma generate
```

**Expected Output**:
```
✔ Generated Prisma Client (X.X.X) to ./node_modules/@prisma/client
```

**Verification**:
```bash
# Check that SystemSettings now has schoolId field
grep -A 5 "model SystemSettings" prisma/schema.prisma | grep schoolId
```

---

### Step 2: Run SQL Migration (5 minutes)

```bash
# Apply SQL migration to add schoolId column
psql $DATABASE_URL < prisma/migrations/add_schoolid_to_system_settings.sql
```

**Expected Output**:
```
ALTER TABLE
CREATE INDEX
```

**Verification**:
```sql
-- Check column was added
\d "SystemSettings"

-- Should show schoolId column with type String
```

**Troubleshooting**:
- If error "column already exists": Column was already added, safe to continue
- If error "permission denied": Check database credentials
- If error "relation does not exist": Check database connection

---

### Step 3: Run Data Migration (10-15 minutes)

```bash
# Migrate existing settings to per-school records
npx tsx scripts/migrate-system-settings-to-per-school.ts
```

**Expected Output**:
```
🔍 Starting SystemSettings migration to per-school...

📊 Current State:
   - Schools: X
   - SystemSettings records: 1
   - Records with schoolId: 0

✅ Step 1: Creating per-school settings...
   Created settings for School A (ID: xxx)
   Created settings for School B (ID: xxx)
   ...

✅ Step 2: Adding foreign key constraint...
   Foreign key constraint added successfully

✅ Step 3: Adding unique constraint...
   Unique constraint added successfully

✅ Step 4: Verifying migration...
   All X schools have settings ✓
   All settings have valid schoolId ✓
   Foreign key constraint exists ✓
   Unique constraint exists ✓

🎉 Migration completed successfully!
```

**Verification**:
```sql
-- Check all schools have settings
SELECT s.id, s.name, ss.id as settings_id
FROM "School" s
LEFT JOIN "SystemSettings" ss ON s.id = ss."schoolId"
ORDER BY s.name;

-- Should show one settings record per school
```

**Troubleshooting**:
- If error "schoolId cannot be null": Some settings records don't have schoolId, check migration logic
- If error "duplicate key": Multiple settings for same school, check unique constraint
- If error "foreign key violation": Invalid schoolId reference, check data integrity

---

### Step 4: Test Multi-School Settings (60-90 minutes)

#### Test 1: Settings Isolation

```bash
# Test that School A cannot see School B's settings
# 1. Login as admin for School A
# 2. Go to /admin/settings
# 3. Update school name to "School A Updated"
# 4. Logout

# 5. Login as admin for School B
# 6. Go to /admin/settings
# 7. Verify school name is NOT "School A Updated"
# 8. Update school name to "School B Updated"
# 9. Logout

# 10. Login as admin for School A again
# 11. Verify school name is still "School A Updated"
```

**Expected Result**: Each school sees only their own settings

---

#### Test 2: Settings CRUD Operations

```bash
# Test Create (already done in migration)
# Test Read
curl -X GET http://localhost:3000/api/settings \
  -H "Cookie: session=..." \
  -H "X-School-Id: SCHOOL_A_ID"

# Test Update
curl -X PUT http://localhost:3000/api/settings \
  -H "Cookie: session=..." \
  -H "X-School-Id: SCHOOL_A_ID" \
  -H "Content-Type: application/json" \
  -d '{"schoolName": "Updated Name"}'

# Test Delete (not implemented, settings are permanent)
```

**Expected Result**: All operations work correctly with school isolation

---

#### Test 3: Cache Invalidation

```bash
# 1. Update settings for School A
# 2. Verify cache is invalidated (check Redis or in-memory cache)
# 3. Fetch settings again
# 4. Verify updated settings are returned
```

**Expected Result**: Cache is properly invalidated per school

---

#### Test 4: Public Access via Subdomains

```bash
# Test subdomain-based settings loading
curl -X GET http://schoola.yourdomain.com/api/public/settings
curl -X GET http://schoolb.yourdomain.com/api/public/settings

# Should return different settings for each subdomain
```

**Expected Result**: Each subdomain loads correct school's settings

---

#### Test 5: Payment Configuration

```bash
# Test payment config isolation
# 1. Login as admin for School A
# 2. Go to /admin/settings/payment
# 3. Enable online payment
# 4. Set max receipt size to 10 MB
# 5. Logout

# 6. Login as admin for School B
# 7. Go to /admin/settings/payment
# 8. Verify online payment is NOT enabled (default state)
# 9. Enable offline verification
# 10. Set max receipt size to 5 MB
# 11. Logout

# 12. Login as admin for School A again
# 13. Verify online payment is still enabled
# 14. Verify max receipt size is still 10 MB
```

**Expected Result**: Payment settings are isolated per school

---

### Step 5: Deploy to Production (30 minutes)

#### Staging Deployment

```bash
# 1. Deploy to staging
git push staging main

# 2. Run migration on staging
ssh staging
cd /app
npx prisma generate
psql $DATABASE_URL < prisma/migrations/add_schoolid_to_system_settings.sql
npx tsx scripts/migrate-system-settings-to-per-school.ts

# 3. Test thoroughly (repeat all tests from Step 4)

# 4. Monitor for 1 hour
```

#### Production Deployment

```bash
# 1. Schedule maintenance window (optional, but recommended)
# 2. Create database backup
pg_dump $DATABASE_URL > backup_before_settings_migration.sql

# 3. Deploy to production
git push production main

# 4. Run migration on production
ssh production
cd /app
npx prisma generate
psql $DATABASE_URL < prisma/migrations/add_schoolid_to_system_settings.sql
npx tsx scripts/migrate-system-settings-to-per-school.ts

# 5. Test critical paths
# - Login as admin for each school
# - Verify settings page loads
# - Update one setting
# - Verify update persists

# 6. Monitor for 24 hours
# - Check error logs
# - Check database queries
# - Check user reports
```

---

## 🔄 Rollback Procedure

If issues occur, rollback immediately:

```bash
# Run rollback script
npx tsx scripts/rollback-system-settings-migration.ts
```

**Expected Output**:
```
🔄 Starting SystemSettings rollback...

✅ Step 1: Backing up current data...
   Backed up X settings records

✅ Step 2: Removing foreign key constraint...
   Foreign key constraint removed

✅ Step 3: Removing unique constraint...
   Unique constraint removed

✅ Step 4: Dropping schoolId column...
   schoolId column dropped

✅ Step 5: Verifying rollback...
   schoolId column does not exist ✓
   Foreign key constraint does not exist ✓
   Unique constraint does not exist ✓

🎉 Rollback completed successfully!
```

**After Rollback**:
1. Investigate the issue
2. Fix the problem
3. Test in staging again
4. Re-run migration when ready

---

## 📊 Monitoring Checklist

After migration, monitor these metrics:

### Database

- [ ] Query performance (should be faster with schoolId index)
- [ ] Database size (should increase slightly with per-school records)
- [ ] Connection pool usage (should be normal)

### Application

- [ ] Settings page load time (should be same or faster)
- [ ] Cache hit rate (should be high)
- [ ] Error rate (should be zero)

### User Experience

- [ ] Admins can access settings
- [ ] Settings updates persist
- [ ] No cross-school data leakage
- [ ] Subdomain access works correctly

---

## 🎯 Success Criteria

Migration is successful when:

- ✅ All schools have settings records
- ✅ Each school sees only their own settings
- ✅ Settings updates work correctly
- ✅ Cache invalidation works per school
- ✅ Subdomain access loads correct settings
- ✅ No TypeScript errors
- ✅ No database errors
- ✅ No user-reported issues after 24 hours

---

## 📞 Support

If you encounter issues:

1. **Check logs**: `tail -f logs/application.log`
2. **Check database**: `psql $DATABASE_URL`
3. **Run verification**: `npx tsx scripts/verify-settings-migration.ts` (if exists)
4. **Rollback if needed**: `npx tsx scripts/rollback-system-settings-migration.ts`

---

## 📚 Related Documentation

- **Implementation Guide**: `SCHOOL_ISOLATION_P3_PHASE2_IMPLEMENTATION.md`
- **Comprehensive Plan**: `SCHOOL_ISOLATION_P3_PHASE2_PLAN.md`
- **Progress Tracking**: `P3_PHASE2_IMPLEMENTATION_COMPLETE.md`
- **Complete Summary**: `SCHOOL_ISOLATION_COMPLETE_SUMMARY.md`

---

**Created**: February 8, 2026, 3:25 AM IST  
**Status**: READY FOR MIGRATION ✅  
**Risk Level**: LOW  
**Rollback Available**: YES
