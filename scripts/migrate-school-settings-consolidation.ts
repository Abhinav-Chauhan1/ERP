import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration Script: Consolidate School Settings Models
 * 
 * This script merges data from four separate settings models into one unified SchoolSettings model:
 * - SystemSettings
 * - SchoolSecuritySettings
 * - SchoolDataManagementSettings
 * - SchoolNotificationSettings
 * 
 * Strategy:
 * 1. For each school, fetch all four settings records
 * 2. Merge them into a single SchoolSettings record
 * 3. Handle conflicts by prioritizing: SystemSettings > Specialized Settings
 * 4. Create the new unified record
 * 5. Verify the migration
 */

interface MigrationStats {
  totalSchools: number;
  successfulMigrations: number;
  failedMigrations: number;
  errors: Array<{ schoolId: string; error: string }>;
}

async function migrateSchoolSettings(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalSchools: 0,
    successfulMigrations: 0,
    failedMigrations: 0,
    errors: [],
  };

  try {
    console.log('🚀 Starting School Settings Consolidation Migration...\n');

    // Get all schools
    const schools = await prisma.school.findMany({
      select: { id: true, name: true, schoolCode: true },
    });

    stats.totalSchools = schools.length;
    console.log(`📊 Found ${schools.length} schools to migrate\n`);

    for (const school of schools) {
      try {
        console.log(`\n🏫 Processing: ${school.name} (${school.schoolCode})`);

        // Fetch all existing settings
        const [systemSettings, securitySettings, dataSettings, notificationSettings] =
          await Promise.all([
            prisma.systemSettings.findUnique({ where: { schoolId: school.id } }),
            prisma.schoolSecuritySettings.findUnique({ where: { schoolId: school.id } }),
            prisma.schoolDataManagementSettings.findUnique({ where: { schoolId: school.id } }),
            prisma.schoolNotificationSettings.findUnique({ where: { schoolId: school.id } }),
          ]);

        console.log(`  ✓ SystemSettings: ${systemSettings ? 'Found' : 'Missing'}`);
        console.log(`  ✓ SecuritySettings: ${securitySettings ? 'Found' : 'Missing'}`);
        console.log(`  ✓ DataSettings: ${dataSettings ? 'Found' : 'Missing'}`);
        console.log(`  ✓ NotificationSettings: ${notificationSettings ? 'Found' : 'Missing'}`);

        // Check if SchoolSettings already exists
        const existingSettings = await prisma.schoolSettings.findUnique({
          where: { schoolId: school.id },
        });

        if (existingSettings) {
          console.log(`  ⚠️  SchoolSettings already exists, skipping...`);
          stats.successfulMigrations++;
          continue;
        }

        // Merge all settings into one unified record
        const mergedSettings = {
          schoolId: school.id,

          // ========== FROM SYSTEM SETTINGS ==========
          onboardingCompleted: systemSettings?.onboardingCompleted ?? false,
          onboardingStep: systemSettings?.onboardingStep ?? 0,
          schoolName: systemSettings?.schoolName ?? school.name,
          schoolAddress: systemSettings?.schoolAddress ?? null,
          schoolPhone: systemSettings?.schoolPhone ?? null,
          schoolEmail: systemSettings?.schoolEmail ?? null,
          schoolLogo: systemSettings?.schoolLogo ?? null,
          schoolWebsite: systemSettings?.schoolWebsite ?? null,
          schoolFax: systemSettings?.schoolFax ?? null,
          affiliationNumber: systemSettings?.affiliationNumber ?? null,
          schoolCode: systemSettings?.schoolCode ?? null,
          board: systemSettings?.board ?? 'CBSE',
          timezone: systemSettings?.timezone ?? 'UTC',
          tagline: systemSettings?.tagline ?? null,

          // Academic
          currentAcademicYear: systemSettings?.currentAcademicYear ?? '',
          currentTerm: systemSettings?.currentTerm ?? '',
          defaultGradingScale: systemSettings?.defaultGradingScale ?? 'PERCENTAGE',
          attendanceThreshold: systemSettings?.attendanceThreshold ?? 75,
          lateArrivalMinutes: systemSettings?.lateArrivalMinutes ?? 15,
          passingGrade: systemSettings?.passingGrade ?? 50,
          autoAttendance: systemSettings?.autoAttendance ?? false,

          // ========== SECURITY SETTINGS ==========
          // Two-Factor (prefer SecuritySettings, fallback to SystemSettings)
          twoFactorEnabled: securitySettings?.twoFactorEnabled ?? systemSettings?.twoFactorAuth ?? false,
          twoFactorRequired: securitySettings?.twoFactorRequired ?? false,
          twoFactorMethods: securitySettings?.twoFactorMethods ?? ['SMS', 'EMAIL'],

          // Session Management
          sessionTimeout: securitySettings?.sessionTimeout ?? systemSettings?.sessionTimeout ?? 480,
          maxConcurrentSessions: securitySettings?.maxConcurrentSessions ?? 3,
          forceLogoutOnPasswordChange: securitySettings?.forceLogoutOnPasswordChange ?? true,

          // Password Policy
          passwordMinLength: securitySettings?.passwordMinLength ?? systemSettings?.passwordMinLength ?? 8,
          passwordRequireUppercase: securitySettings?.passwordRequireUppercase ?? systemSettings?.passwordRequireUppercase ?? true,
          passwordRequireLowercase: securitySettings?.passwordRequireLowercase ?? true,
          passwordRequireNumbers: securitySettings?.passwordRequireNumbers ?? systemSettings?.passwordRequireNumber ?? true,
          passwordRequireSpecialChars: securitySettings?.passwordRequireSpecialChars ?? systemSettings?.passwordRequireSpecialChar ?? false,
          passwordExpiry: securitySettings?.passwordExpiry ?? systemSettings?.passwordExpiry ?? 90,

          // IP Whitelisting
          ipWhitelistEnabled: securitySettings?.ipWhitelistEnabled ?? false,
          allowedIPs: securitySettings?.allowedIPs ?? [],
          blockUnknownIPs: securitySettings?.blockUnknownIPs ?? false,

          // Audit Logging
          auditLoggingEnabled: securitySettings?.auditLoggingEnabled ?? true,
          auditLogLevel: securitySettings?.auditLogLevel ?? 'INFO',
          auditLogRetention: securitySettings?.auditLogRetention ?? 365,

          // Data Encryption
          encryptSensitiveData: securitySettings?.encryptSensitiveData ?? true,
          encryptionLevel: securitySettings?.encryptionLevel ?? 'AES-256',

          // API Security
          rateLimitEnabled: securitySettings?.rateLimitEnabled ?? true,
          maxRequestsPerMinute: securitySettings?.maxRequestsPerMinute ?? 100,
          requireApiKey: securitySettings?.requireApiKey ?? false,

          // ========== DATA MANAGEMENT SETTINGS ==========
          // Backup (prefer DataSettings, fallback to SystemSettings)
          autoBackupEnabled: dataSettings?.autoBackupEnabled ?? systemSettings?.autoBackup ?? true,
          backupFrequency: dataSettings?.backupFrequency ?? systemSettings?.backupFrequency?.toUpperCase() ?? 'DAILY',
          backupRetention: dataSettings?.backupRetention ?? 30,
          includeFiles: dataSettings?.includeFiles ?? true,
          encryptBackups: dataSettings?.encryptBackups ?? true,

          // Export
          allowDataExport: dataSettings?.allowDataExport ?? true,
          exportFormats: dataSettings?.exportFormats ?? ['CSV', 'JSON', 'PDF'],
          requireApproval: dataSettings?.requireApproval ?? true,

          // Data Retention
          studentDataRetention: dataSettings?.studentDataRetention ?? 7,
          messageRetention: dataSettings?.messageRetention ?? 90,
          autoCleanup: dataSettings?.autoCleanup ?? false,

          // Storage
          storageQuota: dataSettings?.storageQuota ?? 1,
          compressionEnabled: dataSettings?.compressionEnabled ?? true,
          autoArchive: dataSettings?.autoArchive ?? true,
          archiveAfterDays: dataSettings?.archiveAfterDays ?? 365,

          // ========== NOTIFICATION SETTINGS ==========
          // Email (prefer NotificationSettings, fallback to SystemSettings)
          emailEnabled: notificationSettings?.emailEnabled ?? systemSettings?.emailEnabled ?? true,
          emailAdmissionUpdates: notificationSettings?.emailAdmissionUpdates ?? true,
          emailFeeReminders: notificationSettings?.emailFeeReminders ?? true,
          emailExamNotifications: notificationSettings?.emailExamNotifications ?? true,
          emailAttendanceAlerts: notificationSettings?.emailAttendanceAlerts ?? true,
          emailSystemUpdates: notificationSettings?.emailSystemUpdates ?? true,

          // SMS
          smsEnabled: notificationSettings?.smsEnabled ?? systemSettings?.smsEnabled ?? false,
          smsAdmissionUpdates: notificationSettings?.smsAdmissionUpdates ?? false,
          smsFeeReminders: notificationSettings?.smsFeeReminders ?? true,
          smsExamNotifications: notificationSettings?.smsExamNotifications ?? true,
          smsAttendanceAlerts: notificationSettings?.smsAttendanceAlerts ?? true,
          smsEmergencyAlerts: notificationSettings?.smsEmergencyAlerts ?? true,

          // WhatsApp
          whatsappEnabled: notificationSettings?.whatsappEnabled ?? false,
          whatsappAdmissionUpdates: notificationSettings?.whatsappAdmissionUpdates ?? false,
          whatsappFeeReminders: notificationSettings?.whatsappFeeReminders ?? true,
          whatsappExamNotifications: notificationSettings?.whatsappExamNotifications ?? true,
          whatsappAttendanceAlerts: notificationSettings?.whatsappAttendanceAlerts ?? false,
          whatsappGeneralUpdates: notificationSettings?.whatsappGeneralUpdates ?? false,

          // Push
          pushEnabled: notificationSettings?.pushEnabled ?? systemSettings?.pushEnabled ?? true,
          pushAdmissionUpdates: notificationSettings?.pushAdmissionUpdates ?? true,
          pushFeeReminders: notificationSettings?.pushFeeReminders ?? true,
          pushExamNotifications: notificationSettings?.pushExamNotifications ?? true,
          pushAttendanceAlerts: notificationSettings?.pushAttendanceAlerts ?? true,
          pushSystemMaintenance: notificationSettings?.pushSystemMaintenance ?? true,

          // Legacy notification channels (from SystemSettings)
          notifyEnrollment: systemSettings?.notifyEnrollment ?? true,
          notifyPayment: systemSettings?.notifyPayment ?? true,
          notifyAttendance: systemSettings?.notifyAttendance ?? true,
          notifyExamResults: systemSettings?.notifyExamResults ?? true,
          notifyLeaveApps: systemSettings?.notifyLeaveApps ?? true,
          enrollmentNotificationChannels: systemSettings?.enrollmentNotificationChannels ?? ['EMAIL', 'IN_APP'],
          paymentNotificationChannels: systemSettings?.paymentNotificationChannels ?? ['EMAIL', 'IN_APP'],
          attendanceNotificationChannels: systemSettings?.attendanceNotificationChannels ?? ['SMS', 'IN_APP'],
          examResultNotificationChannels: systemSettings?.examResultNotificationChannels ?? ['EMAIL', 'IN_APP'],
          leaveAppNotificationChannels: systemSettings?.leaveAppNotificationChannels ?? ['EMAIL', 'IN_APP'],

          // Timing & Delivery
          quietHoursEnabled: notificationSettings?.quietHoursEnabled ?? true,
          quietHoursStart: notificationSettings?.quietHoursStart ?? '22:00',
          quietHoursEnd: notificationSettings?.quietHoursEnd ?? '08:00',
          weekendNotifications: notificationSettings?.weekendNotifications ?? false,
          batchNotifications: notificationSettings?.batchNotifications ?? true,
          immediateEmergency: notificationSettings?.immediateEmergency ?? true,
          digestFrequency: notificationSettings?.digestFrequency ?? 'DAILY',

          // ========== BRANDING & THEME ==========
          defaultTheme: systemSettings?.defaultTheme ?? 'LIGHT',
          defaultColorTheme: systemSettings?.defaultColorTheme ?? 'blue',
          primaryColor: systemSettings?.primaryColor ?? '#3b82f6',
          secondaryColor: systemSettings?.secondaryColor ?? '#8b5cf6',
          accentColor: systemSettings?.accentColor ?? null,
          logoUrl: systemSettings?.logoUrl ?? null,
          faviconUrl: systemSettings?.faviconUrl ?? null,
          emailLogo: systemSettings?.emailLogo ?? null,
          emailFooter: systemSettings?.emailFooter ?? null,
          emailSignature: systemSettings?.emailSignature ?? null,
          letterheadLogo: systemSettings?.letterheadLogo ?? null,
          letterheadText: systemSettings?.letterheadText ?? null,
          documentFooter: systemSettings?.documentFooter ?? null,

          // ========== SOCIAL MEDIA ==========
          facebookUrl: systemSettings?.facebookUrl ?? null,
          twitterUrl: systemSettings?.twitterUrl ?? null,
          linkedinUrl: systemSettings?.linkedinUrl ?? null,
          instagramUrl: systemSettings?.instagramUrl ?? null,

          // ========== LOCALIZATION ==========
          language: systemSettings?.language ?? 'en',
          dateFormat: systemSettings?.dateFormat ?? 'mdy',

          // ========== PAYMENT SETTINGS ==========
          enableOnlinePayment: systemSettings?.enableOnlinePayment ?? false,
          enableOfflineVerification: systemSettings?.enableOfflineVerification ?? true,
          onlinePaymentGateway: systemSettings?.onlinePaymentGateway ?? null,
          maxReceiptSizeMB: systemSettings?.maxReceiptSizeMB ?? 5,
          allowedReceiptFormats: systemSettings?.allowedReceiptFormats ?? 'jpg,jpeg,png,pdf',
          autoNotifyOnVerification: systemSettings?.autoNotifyOnVerification ?? true,
        };

        // Create the unified SchoolSettings record
        await prisma.schoolSettings.create({
          data: mergedSettings,
        });

        console.log(`  ✅ Successfully migrated to SchoolSettings`);
        stats.successfulMigrations++;
      } catch (error) {
        console.error(`  ❌ Failed to migrate ${school.name}:`, error);
        stats.failedMigrations++;
        stats.errors.push({
          schoolId: school.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Schools:        ${stats.totalSchools}`);
    console.log(`✅ Successful:        ${stats.successfulMigrations}`);
    console.log(`❌ Failed:            ${stats.failedMigrations}`);
    console.log('='.repeat(60));

    if (stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      stats.errors.forEach((err, idx) => {
        console.log(`${idx + 1}. School ID: ${err.schoolId}`);
        console.log(`   Error: ${err.error}\n`);
      });
    }

    return stats;
  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    throw error;
  }
}

async function verifyMigration(): Promise<void> {
  console.log('\n🔍 Verifying migration...\n');

  const schoolCount = await prisma.school.count();
  const settingsCount = await prisma.schoolSettings.count();

  console.log(`Schools in database:          ${schoolCount}`);
  console.log(`SchoolSettings records:       ${settingsCount}`);

  if (schoolCount === settingsCount) {
    console.log('✅ All schools have SchoolSettings records!');
  } else {
    console.log(`⚠️  Mismatch: ${schoolCount - settingsCount} schools missing settings`);
  }

  // Sample a few records to verify data integrity
  const sampleSettings = await prisma.schoolSettings.findMany({
    take: 3,
    include: { school: { select: { name: true } } },
  });

  console.log('\n📋 Sample migrated records:');
  sampleSettings.forEach((setting, idx) => {
    console.log(`\n${idx + 1}. ${setting.school.name}`);
    console.log(`   - Email Enabled: ${setting.emailEnabled}`);
    console.log(`   - SMS Enabled: ${setting.smsEnabled}`);
    console.log(`   - 2FA Enabled: ${setting.twoFactorEnabled}`);
    console.log(`   - Backup Frequency: ${setting.backupFrequency}`);
    console.log(`   - Session Timeout: ${setting.sessionTimeout} min`);
  });
}

async function cleanupOldTables(): Promise<void> {
  console.log('\n🧹 Cleanup Phase (Optional)');
  console.log('='.repeat(60));
  console.log('⚠️  The old tables still exist:');
  console.log('   - SystemSettings (system_settings)');
  console.log('   - SchoolSecuritySettings');
  console.log('   - SchoolDataManagementSettings');
  console.log('   - SchoolNotificationSettings');
  console.log('\n💡 To remove them, run:');
  console.log('   npx prisma migrate dev --name remove_old_settings_tables');
  console.log('\n   Then manually drop the tables in the migration SQL file.');
}

async function main() {
  try {
    const stats = await migrateSchoolSettings();
    await verifyMigration();
    await cleanupOldTables();

    if (stats.failedMigrations === 0) {
      console.log('\n✨ Migration completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the error log above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
