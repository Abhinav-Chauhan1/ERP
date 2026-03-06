/*
  Warnings:

  - Added the required column `classId` to the `Exam` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "classId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Exam_classId_idx" ON "Exam"("classId");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
