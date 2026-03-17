/*
  Warnings:

  - You are about to drop the `Lesson` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId,termId,academicYearId]` on the table `ReportCard` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SubjectCategory" AS ENUM ('SCHOLASTIC', 'ADDITIONAL');

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_syllabusUnitId_fkey";

-- DropForeignKey
ALTER TABLE "ReportCard" DROP CONSTRAINT "ReportCard_termId_fkey";

-- DropIndex
DROP INDEX "ReportCard_studentId_termId_key";

-- AlterTable
ALTER TABLE "ReportCard" ADD COLUMN     "academicYearId" TEXT,
ADD COLUMN     "remarkType" TEXT,
ADD COLUMN     "resultStatus" TEXT,
ALTER COLUMN "termId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "category" "SubjectCategory" NOT NULL DEFAULT 'SCHOLASTIC';

-- DropTable
DROP TABLE "Lesson";

-- CreateTable
CREATE TABLE "exam_components" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "maxMarks" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "exam_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_component_marks" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "exam_component_marks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_components_examId_idx" ON "exam_components"("examId");

-- CreateIndex
CREATE INDEX "exam_components_schoolId_idx" ON "exam_components"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_components_examId_name_key" ON "exam_components"("examId", "name");

-- CreateIndex
CREATE INDEX "exam_component_marks_studentId_idx" ON "exam_component_marks"("studentId");

-- CreateIndex
CREATE INDEX "exam_component_marks_schoolId_idx" ON "exam_component_marks"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_component_marks_componentId_studentId_key" ON "exam_component_marks"("componentId", "studentId");

-- CreateIndex
CREATE INDEX "ReportCard_academicYearId_idx" ON "ReportCard"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCard_studentId_termId_academicYearId_key" ON "ReportCard"("studentId", "termId", "academicYearId");

-- AddForeignKey
ALTER TABLE "exam_components" ADD CONSTRAINT "exam_components_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_components" ADD CONSTRAINT "exam_components_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_component_marks" ADD CONSTRAINT "exam_component_marks_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "exam_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_component_marks" ADD CONSTRAINT "exam_component_marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_component_marks" ADD CONSTRAINT "exam_component_marks_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "course_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
