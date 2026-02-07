/*
  Warnings:

  - The `status` column on the `Backup` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[subjectId,classId,sectionId]` on the table `SubjectClass` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `action` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('MANUAL', 'SCHEDULED', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AchievementCategoryType" AS ENUM ('ACADEMIC', 'ATTENDANCE', 'PARTICIPATION', 'STREAK', 'SPECIAL');

-- CreateEnum
CREATE TYPE "RarityType" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "DifficultyType" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "LessonContentType" AS ENUM ('VIDEO', 'TEXT', 'AUDIO', 'INTERACTIVE');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- DropIndex
DROP INDEX "SubjectClass_subjectId_classId_key";

-- AlterTable
ALTER TABLE "Backup" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "includeFiles" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "BackupType" NOT NULL DEFAULT 'MANUAL',
ALTER COLUMN "size" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "BackupStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "SubjectClass" ADD COLUMN     "sectionId" TEXT;

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "action",
ADD COLUMN     "action" "AuditAction" NOT NULL;

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "emergency_access" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "disabledUntil" TIMESTAMP(3),
    "affectedUsers" INTEGER NOT NULL DEFAULT 0,
    "invalidatedSessions" INTEGER NOT NULL DEFAULT 0,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedAt" TIMESTAMP(3),
    "reversedBy" TEXT,
    "reversedReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_achievements" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "AchievementCategoryType" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "rarity" "RarityType" NOT NULL DEFAULT 'COMMON',
    "icon" TEXT NOT NULL DEFAULT 'Star',
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "maxProgress" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_xp_levels" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentLevelXP" INTEGER NOT NULL DEFAULT 0,
    "xpToNextLevel" INTEGER NOT NULL DEFAULT 100,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_xp_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_notes" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "tags" TEXT[],
    "folder" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_decks" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcard_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "difficulty" "DifficultyType" NOT NULL DEFAULT 'MEDIUM',
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" TIMESTAMP(3),
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mind_maps" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "connections" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mind_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_contents" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT,
    "courseId" TEXT,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "LessonContentType" NOT NULL,
    "content" TEXT NOT NULL,
    "duration" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_content_progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_content_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolPermissions_schoolId_key" ON "SchoolPermissions"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolPermissions_schoolId_idx" ON "SchoolPermissions"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSecuritySettings_schoolId_key" ON "SchoolSecuritySettings"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolSecuritySettings_schoolId_idx" ON "SchoolSecuritySettings"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolDataManagementSettings_schoolId_key" ON "SchoolDataManagementSettings"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolDataManagementSettings_schoolId_idx" ON "SchoolDataManagementSettings"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolNotificationSettings_schoolId_key" ON "SchoolNotificationSettings"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolNotificationSettings_schoolId_idx" ON "SchoolNotificationSettings"("schoolId");

-- CreateIndex
CREATE INDEX "emergency_access_targetType_targetId_idx" ON "emergency_access"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "emergency_access_performedBy_createdAt_idx" ON "emergency_access"("performedBy", "createdAt");

-- CreateIndex
CREATE INDEX "emergency_access_action_createdAt_idx" ON "emergency_access"("action", "createdAt");

-- CreateIndex
CREATE INDEX "emergency_access_isReversed_createdAt_idx" ON "emergency_access"("isReversed", "createdAt");

-- CreateIndex
CREATE INDEX "emergency_access_targetType_action_isReversed_idx" ON "emergency_access"("targetType", "action", "isReversed");

-- CreateIndex
CREATE INDEX "student_achievements_studentId_idx" ON "student_achievements"("studentId");

-- CreateIndex
CREATE INDEX "student_achievements_schoolId_idx" ON "student_achievements"("schoolId");

-- CreateIndex
CREATE INDEX "student_achievements_category_idx" ON "student_achievements"("category");

-- CreateIndex
CREATE INDEX "student_achievements_unlocked_idx" ON "student_achievements"("unlocked");

-- CreateIndex
CREATE UNIQUE INDEX "student_xp_levels_studentId_key" ON "student_xp_levels"("studentId");

-- CreateIndex
CREATE INDEX "student_xp_levels_schoolId_idx" ON "student_xp_levels"("schoolId");

-- CreateIndex
CREATE INDEX "student_xp_levels_level_idx" ON "student_xp_levels"("level");

-- CreateIndex
CREATE INDEX "student_notes_studentId_idx" ON "student_notes"("studentId");

-- CreateIndex
CREATE INDEX "student_notes_schoolId_idx" ON "student_notes"("schoolId");

-- CreateIndex
CREATE INDEX "student_notes_subject_idx" ON "student_notes"("subject");

-- CreateIndex
CREATE INDEX "student_notes_folder_idx" ON "student_notes"("folder");

-- CreateIndex
CREATE INDEX "flashcard_decks_studentId_idx" ON "flashcard_decks"("studentId");

-- CreateIndex
CREATE INDEX "flashcard_decks_schoolId_idx" ON "flashcard_decks"("schoolId");

-- CreateIndex
CREATE INDEX "flashcard_decks_subject_idx" ON "flashcard_decks"("subject");

-- CreateIndex
CREATE INDEX "flashcards_deckId_idx" ON "flashcards"("deckId");

-- CreateIndex
CREATE INDEX "flashcards_studentId_idx" ON "flashcards"("studentId");

-- CreateIndex
CREATE INDEX "flashcards_schoolId_idx" ON "flashcards"("schoolId");

-- CreateIndex
CREATE INDEX "mind_maps_studentId_idx" ON "mind_maps"("studentId");

-- CreateIndex
CREATE INDEX "mind_maps_schoolId_idx" ON "mind_maps"("schoolId");

-- CreateIndex
CREATE INDEX "mind_maps_subject_idx" ON "mind_maps"("subject");

-- CreateIndex
CREATE INDEX "lesson_contents_lessonId_idx" ON "lesson_contents"("lessonId");

-- CreateIndex
CREATE INDEX "lesson_contents_courseId_idx" ON "lesson_contents"("courseId");

-- CreateIndex
CREATE INDEX "lesson_contents_schoolId_idx" ON "lesson_contents"("schoolId");

-- CreateIndex
CREATE INDEX "lesson_contents_order_idx" ON "lesson_contents"("order");

-- CreateIndex
CREATE INDEX "student_content_progress_studentId_idx" ON "student_content_progress"("studentId");

-- CreateIndex
CREATE INDEX "student_content_progress_contentId_idx" ON "student_content_progress"("contentId");

-- CreateIndex
CREATE INDEX "student_content_progress_schoolId_idx" ON "student_content_progress"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "student_content_progress_studentId_contentId_key" ON "student_content_progress"("studentId", "contentId");

-- CreateIndex
CREATE INDEX "Backup_status_idx" ON "Backup"("status");

-- CreateIndex
CREATE INDEX "Backup_type_idx" ON "Backup"("type");

-- CreateIndex
CREATE INDEX "SubjectClass_sectionId_idx" ON "SubjectClass"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClass_subjectId_classId_sectionId_key" ON "SubjectClass"("subjectId", "classId", "sectionId");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "SubjectClass" ADD CONSTRAINT "SubjectClass_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolPermissions" ADD CONSTRAINT "SchoolPermissions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolSecuritySettings" ADD CONSTRAINT "SchoolSecuritySettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolDataManagementSettings" ADD CONSTRAINT "SchoolDataManagementSettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolNotificationSettings" ADD CONSTRAINT "SchoolNotificationSettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_access" ADD CONSTRAINT "emergency_access_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_access" ADD CONSTRAINT "emergency_access_reversedBy_fkey" FOREIGN KEY ("reversedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_xp_levels" ADD CONSTRAINT "student_xp_levels_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_xp_levels" ADD CONSTRAINT "student_xp_levels_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mind_maps" ADD CONSTRAINT "mind_maps_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mind_maps" ADD CONSTRAINT "mind_maps_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_content_progress" ADD CONSTRAINT "student_content_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_content_progress" ADD CONSTRAINT "student_content_progress_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "lesson_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_content_progress" ADD CONSTRAINT "student_content_progress_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
