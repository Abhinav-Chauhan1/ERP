# School Isolation P3 Phase 2 - Implementation Guide

**Date**: February 8, 2026  
**Status**: READY FOR IMPLEMENTATION  
**Priority**: MEDIUM  
**Estimated Time**: 3-5 days

---

## 📋 Overview

This guide provides step-by-step instructions for implementing per-school settings isolation by adding `schoolId` to the `SystemSettings` table.

**Goal**: Enable each school to have independent settings instead of sharing a single global configuration.

---

## ⚠️ Prerequisites

### Before Starting
1. ✅ **Backup Database**: Create full database backup
2. ✅ **Test Environment**: Test on staging first
3. ✅ **Clean Git State**: Commit all pending changes
4. ✅ **Team Notification**: Inform team of maintenance window
5. ✅ **Rollback Plan**: Review rollback procedure

### Required Tools
- Node.js 18+
- Prisma CLI
- Database access
- tsx (for running TypeScript scripts)

---

## 🚀 Implementation Steps

### Step 1: Schema Update (5 minutes)

**Status**: ✅ COMPLETE

The Prisma schema has been updated to add `schoolId` to `SystemSettings`:

```prisma
model SystemSettings {
  id                String   @id @default(cuid())
  schoolId          String   @unique
  school            School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  // ... rest of fields
  
  @@index([schoolId])
  @@map("system_settings")
}
```

**Files Modified**:
- `prisma/schema.prisma` - Added schoolId field and relation

---

### Step 2: Generate Prisma Client (2 minutes)

```bash
# Generate new Prisma client with updated schema
npx prisma generate
```

**Expected Output**:
```
✔ Generated Prisma Client
```

---

### Step 3: Run Database Migration (5 minutes)

```bash
# Apply SQL migration to add schoolId column
psql $DATABASE_URL < prisma/migrations/add_schoolid_to_system_settings.sql
```

**What This Does**:
1. Adds `schoolId` column (nullable initially)
2. Creates index on `schoolId`
3. Prepares for foreign key constraint (added later)

**Verification**:
```sql
-- Check column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'system_settings' AND column_name = 'schoolId';
```

---

### Step 4: Run Data Migration (10-15 minutes)

```bash
# Migrate existing settings to per-school records
npx tsx scripts/migrate-system-settings-to-per-school.ts
```

**What This Does**:
1. Gets current global settings
2. Creates settings record for each school
3. Deletes old global settings
4. Adds foreign key and unique constraints

**Expected Output**:
```
============================================================
SystemSettings Migration to Per-School
============================================================

Step 1: Fetching global settings...
✓ Found global settings
  ID: cuid_xxx
  School Name: School Name

Step 2: Fetching all schools...
✓ Found 5 schools

Step 3: Creating per-school settings...

[1/5] Processing: ABC School (abc)
  ✓ Created settings for ABC School
[2/5] Processing: XYZ School (xyz)
  ✓ Created settings for XYZ School
...

Step 4: Cleaning up old global settings...
✓ Deleted old global settings

Step 5: Adding database constraints...
✓ Added foreign key constraint
✓ Added unique constraint on schoolId

============================================================
Migration Summary
============================================================
Total Schools:       5
Settings Created:    5
Settings Skipped:    0
Errors:              0

✅ Migration completed successfully!

============================================================
Verification
============================================================

Schools:  5
Settings: 5

✅ All verification checks passed!

🎉 Migration and verification completed successfully!
```

**If Migration Fails**:
- Check error messages
- Review database state
- Run rollback script if needed
- Fix issues and retry

---

### Step 5: Update Action Files (30-60 minutes)

Now update the action files to use per-school settings.

#### File 1: settingsActions.ts

**Functions to Update**: 5 functions

1. **getSystemSettings()**

```typescript
export async function getSystemSettings() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { administrator: true },
    });

    if (!user || (!user.administrator && user.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized - Admin access required" };
    }

    // Get required school context - CRITICAL for multi-tenancy
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get settings for current school
    let settings = await db.systemSettings.findUnique({
      where: { schoolId } // CRITICAL: Filter by school
    });

    // Create default settings if none exist for this school
    if (!settings) {
      settings = await db.systemSettings.create({
        data: {
          schoolId, // CRITICAL: Associate with school
          schoolName: "School Name",
          timezone: "UTC",
          defaultGradingScale: "PERCENTAGE",
          passingGrade: 50,
          emailEnabled: true,
          defaultTheme: "LIGHT",
          language: "en",
          enableOfflineVerification: true,
          enableOnlinePayment: false,
          maxReceiptSizeMB: 5,
          allowedReceiptFormats: "jpg,jpeg,png,pdf",
          autoNotifyOnVerification: true,
        },
      });
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return { success: false, error: "Failed to fetch system settings" };
  }
}
```

2. **getPublicSystemSettings()**

```typescript
export async function getPublicSystemSettings() {
  try {
    // Get school from subdomain for public access
    const { getSchoolFromSubdomain } = await import('@/lib/utils/subdomain-helper');
    const school = await getSchoolFromSubdomain();
    
    if (!school) {
      // Fallback to first school's settings or default
      const settings = await db.systemSettings.findFirst();
      return { success: true, data: settings };
    }
    
    // Get settings for subdomain school
    let settings = await db.systemSettings.findUnique({
      where: { schoolId: school.id }
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await db.systemSettings.create({
        data: {
          schoolId: school.id,
          schoolName: school.name,
          timezone: "UTC",
          defaultGradingScale: "PERCENTAGE",
          passingGrade: 50,
          emailEnabled: true,
          defaultTheme: "LIGHT",
          language: "en",
          enableOfflineVerification: true,
          enableOnlinePayment: false,
          maxReceiptSizeMB: 5,
          allowedReceiptFormats: "jpg,jpeg,png,pdf",
          autoNotifyOnVerification: true,
        },
      });
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return { success: false, error: "Failed to fetch settings" };
  }
}
```

3. **updateSchoolInfo()** - Add schoolId filter to update query
4. **updateAcademicSettings()** - Add schoolId filter to update query
5. **updateNotificationSettings()** - Add schoolId filter to update query
6. **updateAppearanceSettings()** - Add schoolId filter to update query

**Pattern for Update Functions**:
```typescript
// Get required school context
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();

// Get settings for current school
const settings = await db.systemSettings.findUnique({
  where: { schoolId } // CRITICAL: Filter by school
});

if (!settings) {
  return { success: false, error: "Settings not found for this school" };
}

// Update settings
const updated = await db.systemSettings.update({
  where: { schoolId }, // CRITICAL: Update only current school
  data: sanitizedData,
});
```

---

#### File 2: paymentConfigActions.ts

**Functions to Update**: 2 functions

1. **getPaymentConfig()**

```typescript
export async function getPaymentConfig() {
  try {
    // Get required school context - CRITICAL for multi-tenancy
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();
    
    // Get settings for current school
    const settings = await db.systemSettings.findUnique({
      where: { schoolId } // CRITICAL: Filter by school
    });
    
    if (!settings) {
      return { 
        success: false, 
        error: "System settings not found for this school" 
      };
    }
    
    // Extract payment configuration fields
    const config: PaymentConfigType = {
      enableOnlinePayment: settings.enableOnlinePayment,
      enableOfflineVerification: settings.enableOfflineVerification,
      onlinePaymentGateway: settings.onlinePaymentGateway,
      maxReceiptSizeMB: settings.maxReceiptSizeMB,
      allowedReceiptFormats: settings.allowedReceiptFormats,
      autoNotifyOnVerification: settings.autoNotifyOnVerification,
    };
    
    return { 
      success: true, 
      data: config 
    };
  } catch (error) {
    console.error("Error fetching payment configuration:", error);
    return { 
      success: false, 
      error: "Failed to fetch payment configuration" 
    };
  }
}
```

2. **updatePaymentConfig()** - Add schoolId filter to queries

---

#### File 3: cached-queries.ts

Update `getSystemSettings()` to accept schoolId:

```typescript
export async function getSystemSettings(schoolId?: string) {
  // If schoolId not provided, get from context
  if (!schoolId) {
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    schoolId = await getRequiredSchoolId();
  }
  
  return unstable_cache(
    async () => {
      return await db.systemSettings.findUnique({
        where: { schoolId }
      });
    },
    [`system-settings-${schoolId}`],
    {
      tags: [CACHE_TAGS.SETTINGS, `settings-${schoolId}`],
      revalidate: 3600,
    }
  )();
}
```

---

### Step 6: Update Cache Invalidation (10 minutes)

Update cache invalidation to include schoolId:

```typescript
// In settingsActions.ts and paymentConfigActions.ts
await invalidateCache([
  CACHE_TAGS.SETTINGS, 
  `settings-${schoolId}` // School-specific cache tag
]);
```

---

### Step 7: Testing (60-90 minutes)

#### Test 1: Multi-School Settings Isolation

```typescript
// Test script: scripts/test-settings-isolation.ts

import { db } from "@/lib/db";

async function testSettingsIsolation() {
  // Get all schools
  const schools = await db.school.findMany({ take: 2 });
  
  if (schools.length < 2) {
    console.log("Need at least 2 schools for testing");
    return;
  }
  
  const [schoolA, schoolB] = schools;
  
  // Get settings for School A
  const settingsA = await db.systemSettings.findUnique({
    where: { schoolId: schoolA.id }
  });
  
  // Get settings for School B
  const settingsB = await db.systemSettings.findUnique({
    where: { schoolId: schoolB.id }
  });
  
  console.log("School A Settings:", settingsA?.schoolName);
  console.log("School B Settings:", settingsB?.schoolName);
  
  // Verify they're different records
  if (settingsA?.id === settingsB?.id) {
    console.error("❌ FAIL: Schools sharing same settings!");
  } else {
    console.log("✅ PASS: Schools have separate settings");
  }
}

testSettingsIsolation();
```

#### Test 2: Settings CRUD Operations

1. Login as admin from School A
2. Update school info
3. Verify only School A's settings changed
4. Login as admin from School B
5. Verify School B's settings unchanged

#### Test 3: Public Access

1. Access public page via School A subdomain
2. Verify School A's settings displayed
3. Access public page via School B subdomain
4. Verify School B's settings displayed

---

### Step 8: Deployment (30 minutes)

#### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Database backup created
- [ ] Staging environment tested
- [ ] Team notified
- [ ] Rollback plan reviewed

#### Deployment Steps

1. **Enable Maintenance Mode** (if applicable)
2. **Run Database Migration**:
   ```bash
   psql $DATABASE_URL < prisma/migrations/add_schoolid_to_system_settings.sql
   ```
3. **Run Data Migration**:
   ```bash
   npx tsx scripts/migrate-system-settings-to-per-school.ts
   ```
4. **Deploy Code Changes**:
   ```bash
   git push origin main
   # Or your deployment process
   ```
5. **Verify Deployment**:
   - Check all schools have settings
   - Test settings CRUD operations
   - Monitor error logs
6. **Disable Maintenance Mode**

---

## 🔄 Rollback Procedure

If issues are detected:

### Step 1: Run Rollback Script

```bash
npx tsx scripts/rollback-system-settings-migration.ts
```

### Step 2: Revert Code Changes

```bash
git revert <commit-hash>
git push origin main
```

### Step 3: Update Prisma Schema

Remove schoolId field from SystemSettings model and regenerate:

```bash
npx prisma generate
```

### Step 4: Verify Rollback

- Check single global settings exists
- Test settings access
- Monitor for errors

---

## 📊 Success Metrics

- ✅ Each school has its own SystemSettings record
- ✅ Settings properly isolated by school
- ✅ No cross-school settings leakage
- ✅ All CRUD operations work correctly
- ✅ Cache invalidation works properly
- ✅ Public pages display correct settings
- ✅ Zero TypeScript errors
- ✅ All tests passing

---

## 📝 Post-Implementation Tasks

1. **Documentation**:
   - Update API documentation
   - Update developer guide
   - Update admin guide

2. **Monitoring**:
   - Monitor error logs for 24 hours
   - Check performance metrics
   - Verify cache hit rates

3. **Team Training**:
   - Brief team on changes
   - Update code review checklist
   - Share best practices

---

## 🆘 Troubleshooting

### Issue: Migration Script Fails

**Symptoms**: Script exits with error  
**Solution**:
1. Check error message
2. Verify database connection
3. Check if schools exist
4. Run rollback if needed

### Issue: Settings Not Found

**Symptoms**: "Settings not found for this school"  
**Solution**:
1. Check if school has settings record
2. Run migration script again
3. Create settings manually if needed

### Issue: Cache Not Invalidating

**Symptoms**: Old settings still showing  
**Solution**:
1. Clear all caches manually
2. Check cache tag format
3. Verify revalidation logic

---

## 📞 Support

For issues during implementation:
1. Check this guide first
2. Review error logs
3. Check database state
4. Run verification queries
5. Contact team lead if needed

---

**Created**: February 8, 2026, 2:00 AM IST  
**Status**: READY FOR IMPLEMENTATION  
**Estimated Time**: 3-5 days  
**Risk Level**: MEDIUM (requires schema migration)
