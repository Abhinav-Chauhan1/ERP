# School Isolation P3 Phase 2 - Settings Architecture Refactor Plan

**Date**: February 8, 2026  
**Status**: ⏳ PLANNING  
**Priority**: MEDIUM (Architectural refactor required)

---

## 📋 Executive Summary

The `SystemSettings` table is currently global (single record for entire platform) but contains school-specific settings. This violates multi-tenancy principles and prevents schools from having independent configurations.

**Files Affected**: 2 files  
**Functions to Fix**: 7 functions  
**Schema Changes Required**: YES (Major)  
**Data Migration Required**: YES (Critical)  
**Estimated Time**: 3-5 days

---

## 🚨 Current Problem

### SystemSettings Table Structure
```prisma
model SystemSettings {
  id                    String   @id @default(cuid())
  // NO schoolId field! ❌
  schoolName            String   @default("School Name")
  schoolAddress         String?
  schoolEmail           String?
  // ... 70+ fields
  // All settings are GLOBAL across all schools
}
```

### Issues Identified

1. **Single Global Record**: Only ONE SystemSettings record exists for ALL schools
2. **School-Specific Data in Global Table**: Fields like `schoolName`, `schoolAddress`, `schoolLogo` should be per-school
3. **No Isolation**: All schools share the same settings
4. **Configuration Conflicts**: Schools cannot have different:
   - Academic years
   - Grading scales
   - Notification preferences
   - Appearance settings
   - Payment configurations

---

## 🎯 Proposed Solution

### Option 1: Add schoolId to SystemSettings (Recommended)

**Pros**:
- Minimal code changes
- Preserves existing structure
- Easier migration

**Cons**:
- Mixes school-specific and platform-wide settings
- Less clean architecture

**Implementation**:
```prisma
model SystemSettings {
  id                    String   @id @default(cuid())
  schoolId              String   @unique  // NEW FIELD
  school                School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  // School-specific settings
  schoolName            String   @default("School Name")
  schoolAddress         String?
  // ... rest of fields
  
  @@index([schoolId])
  @@map("system_settings")
}
```

---

### Option 2: Separate SchoolSettings and PlatformSettings (Ideal)

**Pros**:
- Clean separation of concerns
- Clear distinction between school and platform settings
- Better architecture

**Cons**:
- More code changes required
- More complex migration
- Longer implementation time

**Implementation**:
```prisma
// Platform-wide settings (single record)
model PlatformSettings {
  id                    String   @id @default(cuid())
  
  // Platform-level settings only
  sessionTimeout        Int      @default(30)
  passwordMinLength     Int      @default(8)
  twoFactorAuth         Boolean  @default(false)
  autoBackup            Boolean  @default(true)
  backupFrequency       String   @default("daily")
  
  @@map("platform_settings")
}

// School-specific settings (one per school)
model SchoolSettings {
  id                    String   @id @default(cuid())
  schoolId              String   @unique
  school                School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  // School-specific settings
  schoolName            String   @default("School Name")
  schoolAddress         String?
  currentAcademicYear   String?
  defaultGradingScale   String   @default("PERCENTAGE")
  emailEnabled          Boolean  @default(true)
  defaultTheme          String   @default("LIGHT")
  // ... other school-specific fields
  
  @@index([schoolId])
  @@map("school_settings")
}
```

---

## 📊 Settings Classification

### School-Specific Settings (Should be per-school)
These settings vary by school and should be isolated:

1. **School Information**:
   - schoolName, schoolAddress, schoolPhone, schoolEmail
   - schoolLogo, schoolWebsite, schoolFax
   - affiliationNumber, schoolCode, board
   - tagline, facebookUrl, twitterUrl, linkedinUrl, instagramUrl

2. **Academic Settings**:
   - currentAcademicYear, currentTerm
   - defaultGradingScale, passingGrade
   - attendanceThreshold, lateArrivalMinutes
   - autoAttendance

3. **Notification Settings**:
   - emailEnabled, smsEnabled, pushEnabled
   - notifyEnrollment, notifyPayment, notifyAttendance
   - notifyExamResults, notifyLeaveApps
   - All notification channel arrays

4. **Appearance Settings**:
   - defaultTheme, defaultColorTheme
   - primaryColor, secondaryColor, accentColor
   - language, dateFormat
   - logoUrl, faviconUrl
   - emailLogo, emailFooter, emailSignature
   - letterheadLogo, letterheadText, documentFooter

5. **Payment Configuration**:
   - enableOnlinePayment, enableOfflineVerification
   - onlinePaymentGateway
   - maxReceiptSizeMB, allowedReceiptFormats
   - autoNotifyOnVerification

### Platform-Wide Settings (Can stay global)
These settings should be consistent across all schools:

1. **Security Settings**:
   - sessionTimeout
   - passwordMinLength, passwordRequireSpecialChar
   - passwordRequireNumber, passwordRequireUppercase
   - twoFactorAuth, passwordExpiry

2. **System Settings**:
   - autoBackup, backupFrequency
   - timezone (could be school-specific, but often platform-wide)

3. **Onboarding Settings**:
   - onboardingCompleted, onboardingStep
   - (These might need to be per-school too)

---

## 🔧 Implementation Plan

### Phase 1: Schema Migration (Day 1-2)

#### Step 1: Create Migration Script
```sql
-- Add schoolId to SystemSettings
ALTER TABLE "system_settings" ADD COLUMN "schoolId" TEXT;

-- Create index
CREATE INDEX "system_settings_schoolId_idx" ON "system_settings"("schoolId");

-- Add foreign key constraint
ALTER TABLE "system_settings" 
  ADD CONSTRAINT "system_settings_schoolId_fkey" 
  FOREIGN KEY ("schoolId") 
  REFERENCES "schools"("id") 
  ON DELETE CASCADE;
```

#### Step 2: Data Migration Script
```typescript
// scripts/migrate-system-settings-to-per-school.ts

import { db } from "@/lib/db";

async function migrateSystemSettings() {
  console.log("Starting SystemSettings migration...");
  
  // 1. Get the current global settings
  const globalSettings = await db.systemSettings.findFirst();
  
  if (!globalSettings) {
    console.log("No global settings found. Creating defaults.");
    return;
  }
  
  // 2. Get all schools
  const schools = await db.school.findMany({
    select: { id: true, name: true }
  });
  
  console.log(`Found ${schools.length} schools`);
  
  // 3. Create settings for each school
  for (const school of schools) {
    console.log(`Creating settings for school: ${school.name}`);
    
    // Check if settings already exist for this school
    const existing = await db.systemSettings.findFirst({
      where: { schoolId: school.id }
    });
    
    if (existing) {
      console.log(`  Settings already exist for ${school.name}, skipping`);
      continue;
    }
    
    // Create new settings record for this school
    await db.systemSettings.create({
      data: {
        ...globalSettings,
        id: undefined, // Generate new ID
        schoolId: school.id,
        schoolName: school.name, // Use actual school name
        createdAt: undefined,
        updatedAt: undefined,
      }
    });
    
    console.log(`  ✓ Created settings for ${school.name}`);
  }
  
  // 4. Delete the old global settings (if it has no schoolId)
  if (!globalSettings.schoolId) {
    await db.systemSettings.delete({
      where: { id: globalSettings.id }
    });
    console.log("✓ Deleted old global settings");
  }
  
  console.log("Migration complete!");
}

migrateSystemSettings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
```

---

### Phase 2: Update Action Files (Day 2-3)

#### File 1: settingsActions.ts (5 functions to fix)

**Functions to Update**:
1. `getSystemSettings()` - Add schoolId filter
2. `updateSchoolInfo()` - Add schoolId filter
3. `updateAcademicSettings()` - Add schoolId filter
4. `updateNotificationSettings()` - Add schoolId filter
5. `updateAppearanceSettings()` - Add schoolId filter

**Functions That Can Stay Global**:
1. `updateSecuritySettings()` - Platform-wide (or make per-school)
2. `triggerBackup()` - Platform-wide

**Fix Pattern**:
```typescript
export async function getSystemSettings() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user and verify admin role
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
          // ... other defaults
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

---

#### File 2: paymentConfigActions.ts (2 functions to fix)

**Functions to Update**:
1. `getPaymentConfig()` - Add schoolId filter
2. `updatePaymentConfig()` - Add schoolId filter

**Fix Pattern**:
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

---

### Phase 3: Update Cached Queries (Day 3)

#### File: src/lib/utils/cached-queries.ts

Update `getSystemSettings()` to accept optional schoolId:

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

### Phase 4: Update Public Settings Access (Day 3-4)

#### Challenge: Public Access Without School Context

Some pages (like login, public pages) need settings but don't have school context.

**Solutions**:

1. **For Subdomain-Based Access**:
   ```typescript
   export async function getPublicSystemSettings() {
     try {
       // Get school from subdomain
       const { getSchoolFromSubdomain } = await import('@/lib/utils/subdomain-helper');
       const school = await getSchoolFromSubdomain();
       
       if (!school) {
         // Fallback to default settings
         return getDefaultSettings();
       }
       
       const settings = await db.systemSettings.findUnique({
         where: { schoolId: school.id }
       });
       
       return { success: true, data: settings };
     } catch (error) {
       console.error("Error fetching public settings:", error);
       return { success: false, error: "Failed to fetch settings" };
     }
   }
   ```

2. **For Root Domain Access**:
   ```typescript
   // Use platform-wide defaults or first school's settings
   const settings = await db.systemSettings.findFirst();
   ```

---

### Phase 5: Testing (Day 4-5)

#### Test Scenarios

1. **Multi-School Settings Isolation**:
   - Create settings for School A
   - Create settings for School B
   - Login as admin from School A
   - Verify only School A's settings are visible/editable
   - Login as admin from School B
   - Verify only School B's settings are visible/editable

2. **Settings CRUD Operations**:
   - Create new school → Should auto-create default settings
   - Update school info → Should only update current school
   - Update academic settings → Should only update current school
   - Update notification settings → Should only update current school
   - Update appearance settings → Should only update current school
   - Update payment config → Should only update current school

3. **Cache Invalidation**:
   - Update settings → Verify cache is invalidated
   - Verify other schools' caches are NOT invalidated

4. **Public Access**:
   - Access public pages → Should show correct school's settings
   - Access via subdomain → Should show subdomain school's settings
   - Access via root domain → Should show default settings

5. **Migration Verification**:
   - Run migration script
   - Verify all schools have settings records
   - Verify no data loss
   - Verify old global settings are deleted

---

## 🚧 Risks and Mitigation

### Risk 1: Data Loss During Migration
**Mitigation**:
- Create full database backup before migration
- Test migration on staging environment first
- Keep old global settings as backup until verified

### Risk 2: Breaking Public Pages
**Mitigation**:
- Implement fallback to default settings
- Test all public pages after migration
- Monitor error logs closely

### Risk 3: Cache Invalidation Issues
**Mitigation**:
- Clear all settings caches after migration
- Update cache keys to include schoolId
- Test cache behavior thoroughly

### Risk 4: Performance Impact
**Mitigation**:
- Add database index on schoolId
- Use cached queries for frequently accessed settings
- Monitor query performance

---

## 📝 Rollback Plan

If issues are detected after deployment:

1. **Immediate Rollback**:
   ```sql
   -- Remove schoolId constraint
   ALTER TABLE "system_settings" DROP CONSTRAINT "system_settings_schoolId_fkey";
   
   -- Remove schoolId column
   ALTER TABLE "system_settings" DROP COLUMN "schoolId";
   
   -- Restore from backup if needed
   ```

2. **Code Rollback**:
   - Revert to previous version
   - Remove schoolId filters from queries
   - Restore old cached query logic

3. **Data Restoration**:
   - Restore database from backup
   - Verify data integrity
   - Test all functionality

---

## 🎯 Success Criteria

- ✅ Each school has its own SystemSettings record
- ✅ Settings are properly isolated by school
- ✅ No cross-school settings leakage
- ✅ All CRUD operations work correctly
- ✅ Cache invalidation works properly
- ✅ Public pages display correct settings
- ✅ Migration completes without data loss
- ✅ All tests pass
- ✅ Zero TypeScript errors
- ✅ Performance is acceptable

---

## 📚 Documentation to Create

1. **Migration Guide**: Step-by-step migration instructions
2. **API Documentation**: Updated settings API docs
3. **Developer Guide**: How to access settings in code
4. **Admin Guide**: How to manage school settings
5. **Troubleshooting Guide**: Common issues and solutions

---

## 🔜 Recommended Approach

### Immediate Action (This Week)
**Status**: ⏳ PENDING USER DECISION

**Option A: Implement Now (3-5 days)**
- Requires dedicated focus
- Blocks other work
- High impact on system architecture

**Option B: Defer to Later (Recommended)**
- Complete P0, P1, P2, P3 Phase 1 testing first
- Deploy and stabilize current fixes
- Plan settings refactor as separate sprint
- Less risky approach

### Recommendation: **Option B - Defer to Later**

**Rationale**:
1. P0, P1, P2, P3 Phase 1 fixes are more critical (data leakage)
2. Settings issue is architectural but not immediate security risk
3. Schools can currently share settings (not ideal but not breaking)
4. Better to stabilize current fixes before major refactor
5. Allows time for thorough planning and testing

---

## 📊 Overall Progress After P3 Phase 1

- **P0 Critical**: ✅ 8/8 files (100%)
- **P1 High**: ✅ 15/15 files (100%)
- **P2 Medium**: ✅ 10/10 files (100%)
- **P3 Phase 1**: ✅ 4/4 files (100%)
- **P3 Phase 2**: ⏳ PENDING (2 files)

**Total**: 37/46 files fixed (80%) + 7 files reviewed (15%) = **95% complete**

**Remaining**: 2 files (4%) - Settings architecture refactor

---

**Created**: February 8, 2026, 1:15 AM IST  
**Status**: PLANNING COMPLETE ⏳  
**Recommendation**: Defer to later sprint after stabilizing current fixes  
**Next Action**: User decision on whether to implement now or defer
