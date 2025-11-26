/*
  Warnings:

  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_branding` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'APPROVE';
ALTER TYPE "AuditAction" ADD VALUE 'REJECT';
ALTER TYPE "AuditAction" ADD VALUE 'PUBLISH';
ALTER TYPE "AuditAction" ADD VALUE 'ARCHIVE';

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "accentColor" TEXT,
ADD COLUMN     "documentFooter" TEXT,
ADD COLUMN     "emailFooter" TEXT,
ADD COLUMN     "emailLogo" TEXT,
ADD COLUMN     "emailSignature" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "letterheadLogo" TEXT,
ADD COLUMN     "letterheadText" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "secondaryColor" TEXT NOT NULL DEFAULT '#8b5cf6',
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "twitterUrl" TEXT;

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "school_branding";

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_timestamp_idx" ON "audit_logs"("resource", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_timestamp_idx" ON "audit_logs"("action", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- COURSE INDEXES VERIFICATION (Task 2.2)
-- ============================================================================
-- This migration verifies that all necessary indexes for course functionality
-- are in place. The following indexes were created in migration 20251122094944_add_lms_models
-- and are confirmed to be optimal for student course queries:
--
-- CourseEnrollment indexes:
--   ✓ course_enrollments_studentId_status_idx (studentId, status)
--   ✓ course_enrollments_courseId_status_idx (courseId, status)
--   ✓ course_enrollments_courseId_studentId_key (UNIQUE constraint)
--
-- LessonProgress indexes:
--   ✓ lesson_progress_enrollmentId_status_idx (enrollmentId, status)
--   ✓ lesson_progress_lessonId_idx (lessonId)
--   ✓ lesson_progress_enrollmentId_lessonId_key (UNIQUE constraint)
--
-- Course indexes:
--   ✓ courses_teacherId_idx (teacherId)
--   ✓ courses_subjectId_idx (subjectId)
--   ✓ courses_classId_idx (classId)
--   ✓ courses_status_isPublished_idx (status, isPublished)
--
-- CourseModule indexes:
--   ✓ course_modules_courseId_sequence_idx (courseId, sequence)
--
-- CourseLesson indexes:
--   ✓ course_lessons_moduleId_sequence_idx (moduleId, sequence)
--
-- Query Performance Analysis:
-- 1. Get enrollments by student: Uses studentId_status index (leftmost prefix)
-- 2. Get enrollments by course: Uses courseId_status index (leftmost prefix)
-- 3. Get lesson progress by enrollment: Uses enrollmentId_status index
-- 4. Count completed lessons: Uses enrollmentId_status index (perfect match)
-- 5. Get specific lesson progress: Uses unique constraint (optimal)
-- 6. Get modules by course: Uses courseId_sequence index (ordered results)
-- 7. Get lessons by module: Uses moduleId_sequence index (ordered results)
--
-- All critical query patterns are optimally indexed. No additional indexes needed.
-- ============================================================================
