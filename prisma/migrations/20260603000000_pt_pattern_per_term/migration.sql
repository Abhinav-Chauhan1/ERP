-- Per-term PT pattern migration
-- Existing schools have no report-card data tied to legacy null-termId patterns;
-- they will re-run the wizard to set per-term patterns.

-- 1) Drop any AssessmentRule rows created by legacy PT patterns (term-less PT rules)
--    to avoid them being matched against the wrong term going forward.
DELETE FROM "AssessmentRule"
WHERE "name" LIKE 'PT Pattern:%' AND "termId" IS NULL;

-- 2) Remove legacy null-termId PT patterns
DELETE FROM "PTPattern" WHERE "termId" IS NULL;

-- 3) Add ptStartNumber column with default 1 (existing surviving rows get 1)
ALTER TABLE "PTPattern" ADD COLUMN "ptStartNumber" INTEGER NOT NULL DEFAULT 1;

-- 4) Make termId NOT NULL — safe now that all null rows are deleted
ALTER TABLE "PTPattern" ALTER COLUMN "termId" SET NOT NULL;

-- 5) Tighten the term FK: previously ON DELETE SET NULL (nullable column);
--    now termId is required, so cascade with the term when it is removed.
ALTER TABLE "PTPattern" DROP CONSTRAINT "PTPattern_termId_fkey";
ALTER TABLE "PTPattern"
  ADD CONSTRAINT "PTPattern_termId_fkey"
  FOREIGN KEY ("termId") REFERENCES "Term"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 6) Replace the composite index to put termId first (most selective filter)
DROP INDEX IF EXISTS "PTPattern_schoolId_classId_termId_idx";
CREATE INDEX "PTPattern_schoolId_termId_classId_idx"
  ON "PTPattern"("schoolId", "termId", "classId");
