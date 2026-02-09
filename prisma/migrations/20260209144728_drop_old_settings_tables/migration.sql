-- WARNING: This migration drops the old settings tables
-- Only run this AFTER verifying the data migration was successful
-- Run: npx tsx scripts/migrate-school-settings-consolidation.ts
-- Then verify all data is correct before running this migration

-- Drop old settings tables
DROP TABLE IF EXISTS "SchoolSecuritySettings" CASCADE;
DROP TABLE IF EXISTS "SchoolDataManagementSettings" CASCADE;
DROP TABLE IF EXISTS "SchoolNotificationSettings" CASCADE;
DROP TABLE IF EXISTS "system_settings" CASCADE;
