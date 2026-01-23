/*
  Warnings:

  - You are about to drop the column `department` on the `Administrator` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[enrollmentId,subModuleId]` on the table `lesson_progress` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Administrator" DROP COLUMN "department";

-- AlterTable
ALTER TABLE "lesson_progress" ADD COLUMN     "subModuleId" TEXT,
ALTER COLUMN "lessonId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "lesson_progress_subModuleId_idx" ON "lesson_progress"("subModuleId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_enrollmentId_subModuleId_key" ON "lesson_progress"("enrollmentId", "subModuleId");

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_subModuleId_fkey" FOREIGN KEY ("subModuleId") REFERENCES "SubModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
