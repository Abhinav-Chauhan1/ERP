-- Migration for Unified Authentication Multi-Tenant Schema Updates
-- This migration implements the database schema changes for Task 1

-- 1.1 Update User model to support nullable mobile and email fields
-- Make email nullable and add mobile field
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mobile" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" VARCHAR(255);

-- Add unique constraint on mobile if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_mobile_key'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_mobile_key" UNIQUE ("mobile");
    END IF;
END $$;

-- 1.2 Update UserSchool model to use UserRole enum instead of string
-- First, update existing string roles to match enum values
UPDATE "user_schools" SET "role" = 'STUDENT' WHERE "role" = 'student' OR "role" = 'STUDENT';
UPDATE "user_schools" SET "role" = 'PARENT' WHERE "role" = 'parent' OR "role" = 'PARENT';
UPDATE "user_schools" SET "role" = 'TEACHER' WHERE "role" = 'teacher' OR "role" = 'TEACHER';
UPDATE "user_schools" SET "role" = 'ADMIN' WHERE "role" = 'admin' OR "role" = 'ADMIN' OR "role" = 'SCHOOL_ADMIN';
UPDATE "user_schools" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'super_admin' OR "role" = 'SUPER_ADMIN';

-- Change column type to enum
ALTER TABLE "user_schools" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";

-- Add index on role
CREATE INDEX IF NOT EXISTS "user_schools_role_idx" ON "user_schools"("role");

-- 1.3 Create OTP model for secure code storage and verification
CREATE TABLE IF NOT EXISTS "otps" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- Add indexes for OTP model
CREATE INDEX IF NOT EXISTS "otps_identifier_idx" ON "otps"("identifier");
CREATE INDEX IF NOT EXISTS "otps_expiresAt_idx" ON "otps"("expiresAt");

-- 1.4 Create Session model for JWT session management (AuthSession)
CREATE TABLE IF NOT EXISTS "auth_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "activeSchoolId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on token
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_token_key" UNIQUE ("token");

-- Add indexes for AuthSession model
CREATE INDEX IF NOT EXISTS "auth_sessions_userId_idx" ON "auth_sessions"("userId");
CREATE INDEX IF NOT EXISTS "auth_sessions_token_idx" ON "auth_sessions"("token");
CREATE INDEX IF NOT EXISTS "auth_sessions_expiresAt_idx" ON "auth_sessions"("expiresAt");

-- Add foreign key constraint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.5 Update AuditLog model for comprehensive authentication logging
-- Make userId nullable and add schoolId
ALTER TABLE "audit_logs" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;

-- Change action column from enum to text for flexibility
ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE TEXT;

-- Make some fields nullable for backward compatibility
ALTER TABLE "audit_logs" ALTER COLUMN "resource" DROP NOT NULL;
ALTER TABLE "audit_logs" ALTER COLUMN "checksum" DROP NOT NULL;

-- Add foreign key for schoolId
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS "audit_logs_userId_timestamp_idx";
DROP INDEX IF EXISTS "audit_logs_resource_resourceId_idx";
DROP INDEX IF EXISTS "audit_logs_resource_timestamp_idx";
DROP INDEX IF EXISTS "audit_logs_action_timestamp_idx";
DROP INDEX IF EXISTS "audit_logs_timestamp_idx";
DROP INDEX IF EXISTS "audit_logs_action_idx";

CREATE INDEX IF NOT EXISTS "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_schoolId_createdAt_idx" ON "audit_logs"("schoolId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- 1.6 Update Student model to include parentMobile field for parent-child linking
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "parentMobile" TEXT;

-- Add index for parentMobile
CREATE INDEX IF NOT EXISTS "students_parentMobile_idx" ON "students"("parentMobile");

-- 1.7 Additional database indexes for performance optimization
-- Add indexes for User model
CREATE INDEX IF NOT EXISTS "users_mobile_idx" ON "users"("mobile");
CREATE INDEX IF NOT EXISTS "users_isActive_idx" ON "users"("isActive");

-- Add indexes for School model
CREATE INDEX IF NOT EXISTS "schools_schoolCode_idx" ON "schools"("schoolCode");
CREATE INDEX IF NOT EXISTS "schools_status_idx" ON "schools"("status");
CREATE INDEX IF NOT EXISTS "schools_isOnboarded_idx" ON "schools"("isOnboarded");

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS "user_schools_userId_isActive_idx" ON "user_schools"("userId", "isActive");
CREATE INDEX IF NOT EXISTS "user_schools_schoolId_role_idx" ON "user_schools"("schoolId", "role");

COMMIT;