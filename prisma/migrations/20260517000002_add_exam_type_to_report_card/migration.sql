-- Add examTypeId to ReportCard for per-exam-type report card generation
ALTER TABLE "ReportCard" ADD COLUMN "examTypeId" TEXT;

-- Partial unique index so each student can have at most one card per (term, examType)
-- Uses WHERE IS NOT NULL so it doesn't interfere with existing term/annual cards (which have examTypeId = NULL)
CREATE UNIQUE INDEX "ReportCard_studentId_termId_examTypeId_unique"
  ON "ReportCard"("studentId", "termId", "examTypeId")
  WHERE "examTypeId" IS NOT NULL;

-- Supporting index for fast lookups by examTypeId within a term
CREATE INDEX "ReportCard_studentId_termId_examTypeId_idx"
  ON "ReportCard"("studentId", "termId", "examTypeId");
