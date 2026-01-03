-- Rollback script for NextAuth v5 migration
-- WARNING: This will remove all NextAuth tables and fields
-- Make sure to backup your database before running this script

-- Drop foreign key constraints first
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";

-- Drop tables
DROP TABLE IF EXISTS "VerificationToken";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "Account";

-- Remove columns from User table
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerified";
ALTER TABLE "User" DROP COLUMN IF EXISTS "image";
ALTER TABLE "User" DROP COLUMN IF EXISTS "name";
ALTER TABLE "User" DROP COLUMN IF EXISTS "password";

-- Restore clerkId to NOT NULL (only if all users have clerkId)
-- CAUTION: Uncomment only if you're sure all users have clerkId values
-- ALTER TABLE "User" ALTER COLUMN "clerkId" SET NOT NULL;

-- Remove AuditAction enum values (if they were added by this migration)
-- Note: PostgreSQL doesn't support removing enum values directly
-- You would need to recreate the enum type without these values
-- This is complex and should be done carefully in production

-- Verification query to check rollback success
-- Run this after the rollback to verify:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('Account', 'Session', 'VerificationToken');
-- Should return 0 rows

-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'User' 
-- AND column_name IN ('emailVerified', 'password', 'name', 'image');
-- Should return 0 rows
