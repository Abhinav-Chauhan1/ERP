-- Drop the existing unique constraint that blocked having both a term card
-- (examTypeId IS NULL) and an exam-type card (examTypeId = 'some-id') for
-- the same student + term combination.
DROP INDEX IF EXISTS "ReportCard_studentId_termId_academicYearId_key";

-- Partial unique index for term-based cards: one per student per term (examTypeId must be NULL)
CREATE UNIQUE INDEX "ReportCard_term_card_unique"
  ON "ReportCard"("studentId", "termId")
  WHERE "examTypeId" IS NULL AND "termId" IS NOT NULL;

-- Partial unique index for annual CBSE cards: one per student per academic year (no term, no examType)
CREATE UNIQUE INDEX "ReportCard_annual_card_unique"
  ON "ReportCard"("studentId", "academicYearId")
  WHERE "termId" IS NULL AND "examTypeId" IS NULL;
