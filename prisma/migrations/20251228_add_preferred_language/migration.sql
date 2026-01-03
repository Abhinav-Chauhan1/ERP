-- Add preferredLanguage field to ParentSettings
ALTER TABLE "ParentSettings" ADD COLUMN "preferredLanguage" TEXT NOT NULL DEFAULT 'en';

-- Add preferredLanguage field to StudentSettings
ALTER TABLE "StudentSettings" ADD COLUMN "preferredLanguage" TEXT NOT NULL DEFAULT 'en';

-- Add index for language-based queries
CREATE INDEX "ParentSettings_preferredLanguage_idx" ON "ParentSettings"("preferredLanguage");
CREATE INDEX "StudentSettings_preferredLanguage_idx" ON "StudentSettings"("preferredLanguage");
