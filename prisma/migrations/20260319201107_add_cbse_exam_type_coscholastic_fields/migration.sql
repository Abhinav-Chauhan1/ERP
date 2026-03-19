-- Add cbseComponent field to ExamType for CBSE column mapping
ALTER TABLE "ExamType" ADD COLUMN IF NOT EXISTS "cbseComponent" TEXT;

-- Add category field to co_scholastic_activities for two-section split
ALTER TABLE "co_scholastic_activities" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'CO_SCHOLASTIC';
