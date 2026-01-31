-- Migration: Schools Management System Fixes
-- Date: 2026-01-28
-- Description: Fix Backup model, add INACTIVE status, and create school settings tables

-- Create backup type and status enums
CREATE TYPE "BackupType" AS ENUM ('MANUAL', 'SCHEDULED', 'AUTOMATIC');
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- Update SchoolStatus enum to include INACTIVE
ALTER TYPE "SchoolStatus" ADD VALUE 'INACTIVE';

-- Update Backup table
ALTER TABLE "Backup" 
  ADD COLUMN "type" "BackupType" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "includeFiles" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "errorMessage" TEXT,
  ALTER COLUMN "status" TYPE "BackupStatus" USING "status"::"BackupStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING',
  ALTER COLUMN "size" DROP NOT NULL;

-- Create index on backup type
CREATE INDEX "Backup_type_idx" ON "Backup"("type");

-- Create SchoolPermissions table
CREATE TABLE "SchoolPermissions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "manageStudents" BOOLEAN NOT NULL DEFAULT true,
    "manageTeachers" BOOLEAN NOT NULL DEFAULT true,
    "manageParents" BOOLEAN NOT NULL DEFAULT true,
    "manageAdmins" BOOLEAN NOT NULL DEFAULT true,
    "manageClasses" BOOLEAN NOT NULL DEFAULT true,
    "manageSubjects" BOOLEAN NOT NULL DEFAULT true,
    "manageSyllabus" BOOLEAN NOT NULL DEFAULT true,
    "manageExams" BOOLEAN NOT NULL DEFAULT true,
    "manageAssignments" BOOLEAN NOT NULL DEFAULT true,
    "manageAttendance" BOOLEAN NOT NULL DEFAULT true,
    "generateReportCards" BOOLEAN NOT NULL DEFAULT true,
    "messagingSystem" BOOLEAN NOT NULL DEFAULT true,
    "notificationSystem" BOOLEAN NOT NULL DEFAULT true,
    "announcementSystem" BOOLEAN NOT NULL DEFAULT true,
    "whatsappIntegration" BOOLEAN NOT NULL DEFAULT false,
    "smsIntegration" BOOLEAN NOT NULL DEFAULT false,
    "emailIntegration" BOOLEAN NOT NULL DEFAULT true,
    "feeManagement" BOOLEAN NOT NULL DEFAULT true,
    "paymentProcessing" BOOLEAN NOT NULL DEFAULT true,
    "financialReports" BOOLEAN NOT NULL DEFAULT true,
    "libraryManagement" BOOLEAN NOT NULL DEFAULT false,
    "transportManagement" BOOLEAN NOT NULL DEFAULT false,
    "hostelManagement" BOOLEAN NOT NULL DEFAULT false,
    "alumniManagement" BOOLEAN NOT NULL DEFAULT false,
    "certificateGeneration" BOOLEAN NOT NULL DEFAULT false,
    "backupRestore" BOOLEAN NOT NULL DEFAULT true,
    "dataExport" BOOLEAN NOT NULL DEFAULT true,
    "auditLogs" BOOLEAN NOT NULL DEFAULT true,
    "apiAccess" BOOLEAN NOT NULL DEFAULT false,
    "customBranding" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolPermissions_pkey" PRIMARY KEY ("id")
);

-- Create SchoolSecuritySettings table
CREATE TABLE "SchoolSecuritySettings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorRequired" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorMethods" TEXT[] DEFAULT ARRAY['SMS', 'EMAIL']::TEXT[],
    "sessionTimeout" INTEGER NOT NULL DEFAULT 480,
    "maxConcurrentSessions" INTEGER NOT NULL DEFAULT 3,
    "forceLogoutOnPasswordChange" BOOLEAN NOT NULL DEFAULT true,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
    "passwordRequireUppercase" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireLowercase" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireNumbers" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireSpecialChars" BOOLEAN NOT NULL DEFAULT false,
    "passwordExpiry" INTEGER NOT NULL DEFAULT 90,
    "ipWhitelistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowedIPs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blockUnknownIPs" BOOLEAN NOT NULL DEFAULT false,
    "auditLoggingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "auditLogLevel" TEXT NOT NULL DEFAULT 'INFO',
    "auditLogRetention" INTEGER NOT NULL DEFAULT 365,
    "encryptSensitiveData" BOOLEAN NOT NULL DEFAULT true,
    "encryptionLevel" TEXT NOT NULL DEFAULT 'AES-256',
    "rateLimitEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxRequestsPerMinute" INTEGER NOT NULL DEFAULT 100,
    "requireApiKey" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSecuritySettings_pkey" PRIMARY KEY ("id")
);

-- Create SchoolDataManagementSettings table
CREATE TABLE "SchoolDataManagementSettings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "autoBackupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "backupFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "backupRetention" INTEGER NOT NULL DEFAULT 30,
    "includeFiles" BOOLEAN NOT NULL DEFAULT true,
    "encryptBackups" BOOLEAN NOT NULL DEFAULT true,
    "allowDataExport" BOOLEAN NOT NULL DEFAULT true,
    "exportFormats" TEXT[] DEFAULT ARRAY['CSV', 'JSON', 'PDF']::TEXT[],
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "studentDataRetention" INTEGER NOT NULL DEFAULT 7,
    "auditLogRetention" INTEGER NOT NULL DEFAULT 365,
    "messageRetention" INTEGER NOT NULL DEFAULT 90,
    "autoCleanup" BOOLEAN NOT NULL DEFAULT false,
    "storageQuota" INTEGER NOT NULL DEFAULT 1,
    "compressionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoArchive" BOOLEAN NOT NULL DEFAULT true,
    "archiveAfterDays" INTEGER NOT NULL DEFAULT 365,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolDataManagementSettings_pkey" PRIMARY KEY ("id")
);

-- Create SchoolNotificationSettings table
CREATE TABLE "SchoolNotificationSettings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailAdmissionUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailFeeReminders" BOOLEAN NOT NULL DEFAULT true,
    "emailExamNotifications" BOOLEAN NOT NULL DEFAULT true,
    "emailAttendanceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "emailSystemUpdates" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsAdmissionUpdates" BOOLEAN NOT NULL DEFAULT false,
    "smsFeeReminders" BOOLEAN NOT NULL DEFAULT true,
    "smsExamNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsAttendanceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "smsEmergencyAlerts" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappAdmissionUpdates" BOOLEAN NOT NULL DEFAULT false,
    "whatsappFeeReminders" BOOLEAN NOT NULL DEFAULT true,
    "whatsappExamNotifications" BOOLEAN NOT NULL DEFAULT true,
    "whatsappAttendanceAlerts" BOOLEAN NOT NULL DEFAULT false,
    "whatsappGeneralUpdates" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushAdmissionUpdates" BOOLEAN NOT NULL DEFAULT true,
    "pushFeeReminders" BOOLEAN NOT NULL DEFAULT true,
    "pushExamNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushAttendanceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "pushSystemMaintenance" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '08:00',
    "weekendNotifications" BOOLEAN NOT NULL DEFAULT false,
    "batchNotifications" BOOLEAN NOT NULL DEFAULT true,
    "immediateEmergency" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints and indexes
CREATE UNIQUE INDEX "SchoolPermissions_schoolId_key" ON "SchoolPermissions"("schoolId");
CREATE INDEX "SchoolPermissions_schoolId_idx" ON "SchoolPermissions"("schoolId");

CREATE UNIQUE INDEX "SchoolSecuritySettings_schoolId_key" ON "SchoolSecuritySettings"("schoolId");
CREATE INDEX "SchoolSecuritySettings_schoolId_idx" ON "SchoolSecuritySettings"("schoolId");

CREATE UNIQUE INDEX "SchoolDataManagementSettings_schoolId_key" ON "SchoolDataManagementSettings"("schoolId");
CREATE INDEX "SchoolDataManagementSettings_schoolId_idx" ON "SchoolDataManagementSettings"("schoolId");

CREATE UNIQUE INDEX "SchoolNotificationSettings_schoolId_key" ON "SchoolNotificationSettings"("schoolId");
CREATE INDEX "SchoolNotificationSettings_schoolId_idx" ON "SchoolNotificationSettings"("schoolId");

-- Add foreign key constraints
ALTER TABLE "SchoolPermissions" ADD CONSTRAINT "SchoolPermissions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolSecuritySettings" ADD CONSTRAINT "SchoolSecuritySettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolDataManagementSettings" ADD CONSTRAINT "SchoolDataManagementSettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolNotificationSettings" ADD CONSTRAINT "SchoolNotificationSettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;