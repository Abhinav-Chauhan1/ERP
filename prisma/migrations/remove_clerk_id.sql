-- Migration: Remove clerkId column from User table
-- This migration should be run after all users have been migrated to NextAuth
-- and all code references to clerkId have been updated

-- Step 1: Verify no null clerkId values are being used in queries
-- (This is a safety check - run this first and verify results before proceeding)
-- SELECT COUNT(*) FROM "User" WHERE "clerkId" IS NOT NULL;

-- Step 2: Drop the unique index on clerkId
DROP INDEX IF EXISTS "User_clerkId_key";

-- Step 3: Drop the clerkId column
ALTER TABLE "User" DROP COLUMN IF EXISTS "clerkId";

-- Migration complete
-- Note: After running this migration, update the Prisma schema to remove the clerkId field
-- and run: npx prisma generate
