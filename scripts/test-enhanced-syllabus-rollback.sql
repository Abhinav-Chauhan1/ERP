-- Rollback Script for Enhanced Syllabus Scope Migration
-- This script can be used to rollback the migration if needed
-- WARNING: This will remove all enhanced scope data from syllabi

-- Step 1: Drop foreign key constraints
ALTER TABLE "Syllabus" DROP CONSTRAINT IF EXISTS "Syllabus_academicYearId_fkey";
ALTER TABLE "Syllabus" DROP CONSTRAINT IF EXISTS "Syllabus_classId_fkey";
ALTER TABLE "Syllabus" DROP CONSTRAINT IF EXISTS "Syllabus_sectionId_fkey";
ALTER TABLE "Syllabus" DROP CONSTRAINT IF EXISTS "Syllabus_parentSyllabusId_fkey";

-- Step 2: Drop indexes
DROP INDEX IF EXISTS "Syllabus_subjectId_classId_idx";
DROP INDEX IF EXISTS "Syllabus_academicYearId_isActive_idx";
DROP INDEX IF EXISTS "Syllabus_status_isActive_idx";
DROP INDEX IF EXISTS "Syllabus_curriculumType_boardType_idx";
DROP INDEX IF EXISTS "Syllabus_subjectId_academicYearId_classId_sectionId_curricu_key";

-- Step 3: Drop columns
ALTER TABLE "Syllabus" 
DROP COLUMN IF EXISTS "academicYearId",
DROP COLUMN IF EXISTS "approvedAt",
DROP COLUMN IF EXISTS "approvedBy",
DROP COLUMN IF EXISTS "boardType",
DROP COLUMN IF EXISTS "classId",
DROP COLUMN IF EXISTS "createdBy",
DROP COLUMN IF EXISTS "curriculumType",
DROP COLUMN IF EXISTS "difficultyLevel",
DROP COLUMN IF EXISTS "effectiveFrom",
DROP COLUMN IF EXISTS "effectiveTo",
DROP COLUMN IF EXISTS "estimatedHours",
DROP COLUMN IF EXISTS "isActive",
DROP COLUMN IF EXISTS "parentSyllabusId",
DROP COLUMN IF EXISTS "prerequisites",
DROP COLUMN IF EXISTS "sectionId",
DROP COLUMN IF EXISTS "status",
DROP COLUMN IF EXISTS "tags",
DROP COLUMN IF EXISTS "updatedBy",
DROP COLUMN IF EXISTS "version";

-- Step 4: Drop enums
DROP TYPE IF EXISTS "SyllabusStatus";
DROP TYPE IF EXISTS "CurriculumType";
DROP TYPE IF EXISTS "DifficultyLevel";

-- Verification queries (run these after rollback to verify)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'Syllabus';
-- SELECT typname FROM pg_type WHERE typname IN ('SyllabusStatus', 'CurriculumType', 'DifficultyLevel');
