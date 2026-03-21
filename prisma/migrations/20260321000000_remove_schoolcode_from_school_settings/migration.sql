-- Migration: Remove schoolCode from SchoolSettings
-- schoolCode is a system identifier managed exclusively on the School model.
-- School model is now the authoritative source; settingsActions syncs back to it.

ALTER TABLE "school_settings" DROP COLUMN IF EXISTS "schoolCode";
