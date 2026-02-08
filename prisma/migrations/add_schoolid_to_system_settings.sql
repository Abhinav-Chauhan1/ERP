-- Migration: Add schoolId to SystemSettings
-- Date: February 8, 2026
-- Purpose: Enable per-school settings isolation

-- Step 1: Add schoolId column (nullable initially for migration)
ALTER TABLE "system_settings" ADD COLUMN "schoolId" TEXT;

-- Step 2: Create index for performance
CREATE INDEX "system_settings_schoolId_idx" ON "system_settings"("schoolId");

-- Step 3: Add foreign key constraint (will be enforced after data migration)
-- Note: This will be added after data migration to avoid constraint violations
-- ALTER TABLE "system_settings" 
--   ADD CONSTRAINT "system_settings_schoolId_fkey" 
--   FOREIGN KEY ("schoolId") 
--   REFERENCES "schools"("id") 
--   ON DELETE CASCADE;

-- Step 4: Add unique constraint on schoolId (one settings record per school)
-- Note: This will be added after data migration
-- ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_schoolId_key" UNIQUE ("schoolId");
