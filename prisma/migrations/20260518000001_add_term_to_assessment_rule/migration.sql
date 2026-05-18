-- AlterTable
ALTER TABLE "AssessmentRule" ADD COLUMN "termId" TEXT;

-- AddForeignKey
ALTER TABLE "AssessmentRule" ADD CONSTRAINT "AssessmentRule_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;
