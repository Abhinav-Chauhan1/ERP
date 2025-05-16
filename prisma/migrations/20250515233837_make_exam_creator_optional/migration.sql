-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_creatorId_fkey";

-- AlterTable
ALTER TABLE "Exam" ALTER COLUMN "creatorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
