-- Add search optimization indexes for Alumni table
-- Requirements: 6.2, 6.3

-- Add index on currentOccupation for occupation-based searches
CREATE INDEX IF NOT EXISTS "alumni_currentOccupation_idx" ON "alumni"("currentOccupation");

-- Add index on currentEmployer for employer-based searches
CREATE INDEX IF NOT EXISTS "alumni_currentEmployer_idx" ON "alumni"("currentEmployer");

-- Add composite index for graduation date and class (common filter combination)
CREATE INDEX IF NOT EXISTS "alumni_graduationDate_finalClass_idx" ON "alumni"("graduationDate", "finalClass");

-- Add composite index for class and graduation date (class-based queries)
CREATE INDEX IF NOT EXISTS "alumni_finalClass_graduationDate_idx" ON "alumni"("finalClass", "graduationDate");

-- Add composite index for location and occupation queries
CREATE INDEX IF NOT EXISTS "alumni_currentCity_currentOccupation_idx" ON "alumni"("currentCity", "currentOccupation");

-- Note: Full-text search indexes are not added here as PostgreSQL's full-text search
-- would require additional configuration. The current implementation uses ILIKE queries
-- which work well with the existing indexes on the Student and User tables.
