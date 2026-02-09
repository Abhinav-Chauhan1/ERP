# School Settings Consolidation Migration

## Overview

This migration consolidates four separate school settings models into one unified `SchoolSettings` model to eliminate data duplication and improve maintainability.

## Previous Architecture (4 Models)

```
School
  ├── SystemSettings (system_settings)
  ├── SchoolSecuritySettings
  ├── SchoolDataManagementSettings
  └── SchoolNotificationSettings
```

### Problems with Old Architecture

1. **Data Duplication**: Fields like `sessionTimeout`, `passwordMinLength`, `emailEnabled`, `smsEnabled`, `autoBackup`, and `backupFrequency` existed in multiple tables
2. **Inconsistency Risk**: Same setting could have different values across tables
3. **Complex Queries**: Required multiple joins to get complete settings
4. **Maintenance Overhead**: Schema changes needed updates across multiple models
5. **Confusion**: Developers unsure which model to query for specific settings

## New Architecture (1 Model)

```
School
  └── SchoolSettings (school_settings)
```

### Benefits

1. **Single Source of Truth**: All settings in one place
2. **Simplified Queries**: One query to get all settings
3. **Better Performance**: No joins needed
4. **Easier Maintenance**: Schema changes in one location
5. **Clear API**: One model to understand and use

## Migration Process

### Step 1: Run Database Migration

```bash
# Apply the schema changes (creates new table)
npx prisma migrate deploy
```

This creates the new `school_settings` table while keeping old tables intact.

### Step 2: Migrate Data

```bash
# Run the data migration script
npx tsx scripts/migrate-school-settings-consolidation.ts
```

This script:
- Fetches all four settings records for each school
- Merges them intelligently (prioritizing SystemSettings for conflicts)
- Creates unified SchoolSettings records
- Provides detailed migration report
- Verifies data integrity

### Step 3: Verify Migration

The script automatically verifies:
- All schools have SchoolSettings records
- Sample data looks correct
- No data loss occurred

Manual verification:
```sql
-- Check counts match
SELECT COUNT(*) FROM schools;
SELECT COUNT(*) FROM school_settings;

-- Sample data comparison
SELECT 
  s.name,
  ss.emailEnabled,
  ss.smsEnabled,
  ss.twoFactorEnabled,
  ss.backupFrequency
FROM schools s
JOIN school_settings ss ON s.id = ss."schoolId"
LIMIT 10;
```

### Step 4: Update Application Code

Update all references from old models to new model:

**Before:**
```typescript
// Multiple queries needed
const systemSettings = await prisma.systemSettings.findUnique({
  where: { schoolId }
});
const securitySettings = await prisma.schoolSecuritySettings.findUnique({
  where: { schoolId }
});
const notificationSettings = await prisma.schoolNotificationSettings.findUnique({
  where: { schoolId }
});
```

**After:**
```typescript
// Single query
const settings = await prisma.schoolSettings.findUnique({
  where: { schoolId }
});
```

### Step 5: Drop Old Tables (After Verification)

**⚠️ ONLY after confirming everything works:**

```bash
# Apply the cleanup migration
npx prisma migrate deploy
```

Or manually:
```sql
DROP TABLE IF EXISTS "SchoolSecuritySettings" CASCADE;
DROP TABLE IF EXISTS "SchoolDataManagementSettings" CASCADE;
DROP TABLE IF EXISTS "SchoolNotificationSettings" CASCADE;
DROP TABLE IF EXISTS "system_settings" CASCADE;
```

## Field Mapping

### Onboarding & Basic Info
| Old Model | Old Field | New Field |
|-----------|-----------|-----------|
| SystemSettings | onboardingCompleted | onboardingCompleted |
| SystemSettings | onboardingStep | onboardingStep |
| SystemSettings | schoolName | schoolName |
| SystemSettings | schoolAddress | schoolAddress |
| SystemSettings | schoolPhone | schoolPhone |
| SystemSettings | schoolEmail | schoolEmail |
| SystemSettings | schoolLogo | schoolLogo |
| SystemSettings | schoolWebsite | schoolWebsite |
| SystemSettings | schoolFax | schoolFax |
| SystemSettings | affiliationNumber | affiliationNumber |
| SystemSettings | schoolCode | schoolCode |
| SystemSettings | board | board |
| SystemSettings | timezone | timezone |
| SystemSettings | tagline | tagline |

### Academic Settings
| Old Model | Old Field | New Field |
|-----------|-----------|-----------|
| SystemSettings | currentAcademicYear | currentAcademicYear |
| SystemSettings | currentTerm | currentTerm |
| SystemSettings | defaultGradingScale | defaultGradingScale |
| SystemSettings | attendanceThreshold | attendanceThreshold |
| SystemSettings | lateArrivalMinutes | lateArrivalMinutes |
| SystemSettings | passingGrade | passingGrade |
| SystemSettings | autoAttendance | autoAttendance |

### Security Settings
| Old Model | Old Field | New Field | Notes |
|-----------|-----------|-----------|-------|
| SchoolSecuritySettings | twoFactorEnabled | twoFactorEnabled | Preferred over SystemSettings.twoFactorAuth |
| SystemSettings | twoFactorAuth | twoFactorEnabled | Fallback |
| SchoolSecuritySettings | twoFactorRequired | twoFactorRequired | |
| SchoolSecuritySettings | twoFactorMethods | twoFactorMethods | |
| SchoolSecuritySettings | sessionTimeout | sessionTimeout | Preferred over SystemSettings |
| SystemSettings | sessionTimeout | sessionTimeout | Fallback (converted from minutes) |
| SchoolSecuritySettings | maxConcurrentSessions | maxConcurrentSessions | |
| SchoolSecuritySettings | forceLogoutOnPasswordChange | forceLogoutOnPasswordChange | |
| SchoolSecuritySettings | passwordMinLength | passwordMinLength | Preferred |
| SystemSettings | passwordMinLength | passwordMinLength | Fallback |
| SchoolSecuritySettings | passwordRequireUppercase | passwordRequireUppercase | Preferred |
| SystemSettings | passwordRequireUppercase | passwordRequireUppercase | Fallback |
| SchoolSecuritySettings | passwordRequireLowercase | passwordRequireLowercase | |
| SchoolSecuritySettings | passwordRequireNumbers | passwordRequireNumbers | Preferred |
| SystemSettings | passwordRequireNumber | passwordRequireNumbers | Fallback |
| SchoolSecuritySettings | passwordRequireSpecialChars | passwordRequireSpecialChars | Preferred |
| SystemSettings | passwordRequireSpecialChar | passwordRequireSpecialChars | Fallback |
| SchoolSecuritySettings | passwordExpiry | passwordExpiry | Preferred |
| SystemSettings | passwordExpiry | passwordExpiry | Fallback |
| SchoolSecuritySettings | ipWhitelistEnabled | ipWhitelistEnabled | |
| SchoolSecuritySettings | allowedIPs | allowedIPs | |
| SchoolSecuritySettings | blockUnknownIPs | blockUnknownIPs | |
| SchoolSecuritySettings | auditLoggingEnabled | auditLoggingEnabled | |
| SchoolSecuritySettings | auditLogLevel | auditLogLevel | |
| SchoolSecuritySettings | auditLogRetention | auditLogRetention | |
| SchoolSecuritySettings | encryptSensitiveData | encryptSensitiveData | |
| SchoolSecuritySettings | encryptionLevel | encryptionLevel | |
| SchoolSecuritySettings | rateLimitEnabled | rateLimitEnabled | |
| SchoolSecuritySettings | maxRequestsPerMinute | maxRequestsPerMinute | |
| SchoolSecuritySettings | requireApiKey | requireApiKey | |

### Data Management Settings
| Old Model | Old Field | New Field | Notes |
|-----------|-----------|-----------|-------|
| SchoolDataManagementSettings | autoBackupEnabled | autoBackupEnabled | Preferred |
| SystemSettings | autoBackup | autoBackupEnabled | Fallback |
| SchoolDataManagementSettings | backupFrequency | backupFrequency | Preferred (DAILY format) |
| SystemSettings | backupFrequency | backupFrequency | Fallback (converted to uppercase) |
| SchoolDataManagementSettings | backupRetention | backupRetention | |
| SchoolDataManagementSettings | includeFiles | includeFiles | |
| SchoolDataManagementSettings | encryptBackups | encryptBackups | |
| SchoolDataManagementSettings | allowDataExport | allowDataExport | |
| SchoolDataManagementSettings | exportFormats | exportFormats | |
| SchoolDataManagementSettings | requireApproval | requireApproval | |
| SchoolDataManagementSettings | studentDataRetention | studentDataRetention | |
| SchoolDataManagementSettings | messageRetention | messageRetention | |
| SchoolDataManagementSettings | autoCleanup | autoCleanup | |
| SchoolDataManagementSettings | storageQuota | storageQuota | |
| SchoolDataManagementSettings | compressionEnabled | compressionEnabled | |
| SchoolDataManagementSettings | autoArchive | autoArchive | |
| SchoolDataManagementSettings | archiveAfterDays | archiveAfterDays | |

### Notification Settings
| Old Model | Old Field | New Field | Notes |
|-----------|-----------|-----------|-------|
| SchoolNotificationSettings | emailEnabled | emailEnabled | Preferred |
| SystemSettings | emailEnabled | emailEnabled | Fallback |
| SchoolNotificationSettings | emailAdmissionUpdates | emailAdmissionUpdates | |
| SchoolNotificationSettings | emailFeeReminders | emailFeeReminders | |
| SchoolNotificationSettings | emailExamNotifications | emailExamNotifications | |
| SchoolNotificationSettings | emailAttendanceAlerts | emailAttendanceAlerts | |
| SchoolNotificationSettings | emailSystemUpdates | emailSystemUpdates | |
| SchoolNotificationSettings | smsEnabled | smsEnabled | Preferred |
| SystemSettings | smsEnabled | smsEnabled | Fallback |
| SchoolNotificationSettings | smsAdmissionUpdates | smsAdmissionUpdates | |
| SchoolNotificationSettings | smsFeeReminders | smsFeeReminders | |
| SchoolNotificationSettings | smsExamNotifications | smsExamNotifications | |
| SchoolNotificationSettings | smsAttendanceAlerts | smsAttendanceAlerts | |
| SchoolNotificationSettings | smsEmergencyAlerts | smsEmergencyAlerts | |
| SchoolNotificationSettings | whatsappEnabled | whatsappEnabled | |
| SchoolNotificationSettings | whatsappAdmissionUpdates | whatsappAdmissionUpdates | |
| SchoolNotificationSettings | whatsappFeeReminders | whatsappFeeReminders | |
| SchoolNotificationSettings | whatsappExamNotifications | whatsappExamNotifications | |
| SchoolNotificationSettings | whatsappAttendanceAlerts | whatsappAttendanceAlerts | |
| SchoolNotificationSettings | whatsappGeneralUpdates | whatsappGeneralUpdates | |
| SchoolNotificationSettings | pushEnabled | pushEnabled | Preferred |
| SystemSettings | pushEnabled | pushEnabled | Fallback |
| SchoolNotificationSettings | pushAdmissionUpdates | pushAdmissionUpdates | |
| SchoolNotificationSettings | pushFeeReminders | pushFeeReminders | |
| SchoolNotificationSettings | pushExamNotifications | pushExamNotifications | |
| SchoolNotificationSettings | pushAttendanceAlerts | pushAttendanceAlerts | |
| SchoolNotificationSettings | pushSystemMaintenance | pushSystemMaintenance | |
| SystemSettings | notifyEnrollment | notifyEnrollment | Legacy field |
| SystemSettings | notifyPayment | notifyPayment | Legacy field |
| SystemSettings | notifyAttendance | notifyAttendance | Legacy field |
| SystemSettings | notifyExamResults | notifyExamResults | Legacy field |
| SystemSettings | notifyLeaveApps | notifyLeaveApps | Legacy field |
| SystemSettings | enrollmentNotificationChannels | enrollmentNotificationChannels | Legacy field |
| SystemSettings | paymentNotificationChannels | paymentNotificationChannels | Legacy field |
| SystemSettings | attendanceNotificationChannels | attendanceNotificationChannels | Legacy field |
| SystemSettings | examResultNotificationChannels | examResultNotificationChannels | Legacy field |
| SystemSettings | leaveAppNotificationChannels | leaveAppNotificationChannels | Legacy field |
| SchoolNotificationSettings | quietHoursEnabled | quietHoursEnabled | |
| SchoolNotificationSettings | quietHoursStart | quietHoursStart | |
| SchoolNotificationSettings | quietHoursEnd | quietHoursEnd | |
| SchoolNotificationSettings | weekendNotifications | weekendNotifications | |
| SchoolNotificationSettings | batchNotifications | batchNotifications | |
| SchoolNotificationSettings | immediateEmergency | immediateEmergency | |
| SchoolNotificationSettings | digestFrequency | digestFrequency | |

### Branding & Theme
| Old Model | Old Field | New Field |
|-----------|-----------|-----------|
| SystemSettings | defaultTheme | defaultTheme |
| SystemSettings | defaultColorTheme | defaultColorTheme |
| SystemSettings | primaryColor | primaryColor |
| SystemSettings | secondaryColor | secondaryColor |
| SystemSettings | accentColor | accentColor |
| SystemSettings | logoUrl | logoUrl |
| SystemSettings | faviconUrl | faviconUrl |
| SystemSettings | emailLogo | emailLogo |
| SystemSettings | emailFooter | emailFooter |
| SystemSettings | emailSignature | emailSignature |
| SystemSettings | letterheadLogo | letterheadLogo |
| SystemSettings | letterheadText | letterheadText |
| SystemSettings | documentFooter | documentFooter |

### Social Media
| Old Model | Old Field | New Field |
|-----------|-----------|-----------|
| SystemSettings | facebookUrl | facebookUrl |
| SystemSettings | twitterUrl | twitterUrl |
| SystemSettings | linkedinUrl | linkedinUrl |
| SystemSettings | instagramUrl | instagramUrl |

### Localization
| Old Model | Old Field | New Field |
|-----------|-----------|-----------|
| SystemSettings | language | language |
| SystemSettings | dateFormat | dateFormat |

### Payment Settings
| Old Model | Old Field | New Field |
|-----------|-----------|-----------|
| SystemSettings | enableOnlinePayment | enableOnlinePayment |
| SystemSettings | enableOfflineVerification | enableOfflineVerification |
| SystemSettings | onlinePaymentGateway | onlinePaymentGateway |
| SystemSettings | maxReceiptSizeMB | maxReceiptSizeMB |
| SystemSettings | allowedReceiptFormats | allowedReceiptFormats |
| SystemSettings | autoNotifyOnVerification | autoNotifyOnVerification |

## Conflict Resolution Strategy

When the same field exists in multiple old models, the migration script uses this priority:

1. **SystemSettings** (highest priority - most likely to have user-configured values)
2. **Specialized Settings** (SchoolSecuritySettings, SchoolDataManagementSettings, SchoolNotificationSettings)
3. **Default Values** (lowest priority)

Example:
```typescript
// If both exist, SystemSettings wins
sessionTimeout: securitySettings?.sessionTimeout ?? systemSettings?.sessionTimeout ?? 480
```

## Rollback Plan

If issues are discovered:

1. **Before dropping old tables**: Simply stop using the new `SchoolSettings` model and revert code changes
2. **After dropping old tables**: Restore from backup before the migration

## Testing Checklist

- [ ] All schools have SchoolSettings records
- [ ] Settings values match old tables
- [ ] No data loss occurred
- [ ] Application queries work correctly
- [ ] Settings updates work correctly
- [ ] Performance is improved (fewer joins)
- [ ] All tests pass

## Support

If you encounter issues:
1. Check migration logs for errors
2. Verify database state with SQL queries
3. Review the migration script logic
4. Contact the development team

## Related Files

- Schema: `prisma/schema.prisma`
- Migration Script: `scripts/migrate-school-settings-consolidation.ts`
- SQL Migration: `prisma/migrations/20260209144727_consolidate_school_settings/migration.sql`
- Cleanup Migration: `prisma/migrations/20260209144728_drop_old_settings_tables/migration.sql`
