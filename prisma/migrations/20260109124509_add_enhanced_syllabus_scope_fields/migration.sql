/*
  Warnings:

  - A unique constraint covering the columns `[homeRoomId]` on the table `ClassSection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[classId,sectionId,teacherId]` on the table `ClassTeacher` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subjectId,academicYearId,classId,sectionId,curriculumType]` on the table `Syllabus` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdBy` to the `Syllabus` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SyllabusStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "CurriculumType" AS ENUM ('GENERAL', 'ADVANCED', 'REMEDIAL', 'INTEGRATED', 'VOCATIONAL', 'SPECIAL_NEEDS');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- DropIndex
DROP INDEX "ClassTeacher_classId_teacherId_key";

-- AlterTable
ALTER TABLE "ClassSection" ADD COLUMN     "homeRoomId" TEXT;

-- AlterTable
ALTER TABLE "ClassTeacher" ADD COLUMN     "sectionId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "apaarId" VARCHAR(50),
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "pen" VARCHAR(50),
ADD COLUMN     "weight" DOUBLE PRECISION;

-- AlterTable - Add new columns to Syllabus table
-- Step 1: Add columns as nullable first
ALTER TABLE "Syllabus" ADD COLUMN     "academicYearId" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "boardType" TEXT,
ADD COLUMN     "classId" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "curriculumType" "CurriculumType" DEFAULT 'GENERAL',
ADD COLUMN     "difficultyLevel" "DifficultyLevel" DEFAULT 'INTERMEDIATE',
ADD COLUMN     "effectiveFrom" TIMESTAMP(3),
ADD COLUMN     "effectiveTo" TIMESTAMP(3),
ADD COLUMN     "estimatedHours" INTEGER,
ADD COLUMN     "isActive" BOOLEAN DEFAULT true,
ADD COLUMN     "parentSyllabusId" TEXT,
ADD COLUMN     "prerequisites" TEXT,
ADD COLUMN     "sectionId" TEXT,
ADD COLUMN     "status" "SyllabusStatus" DEFAULT 'DRAFT',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "updatedBy" TEXT,
ADD COLUMN     "version" TEXT DEFAULT '1.0';

-- Step 2: Set default values for existing records
-- For existing syllabi, set them as PUBLISHED (backward compatibility)
UPDATE "Syllabus" 
SET "status" = 'PUBLISHED',
    "curriculumType" = 'GENERAL',
    "difficultyLevel" = 'INTERMEDIATE',
    "isActive" = true,
    "version" = '1.0',
    "createdBy" = 'system',
    "tags" = ARRAY[]::TEXT[]
WHERE "status" IS NULL;

-- Step 3: Make required fields NOT NULL after setting defaults
ALTER TABLE "Syllabus" 
ALTER COLUMN "createdBy" SET NOT NULL,
ALTER COLUMN "curriculumType" SET NOT NULL,
ALTER COLUMN "difficultyLevel" SET NOT NULL,
ALTER COLUMN "isActive" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "version" SET NOT NULL;

-- AlterTable
ALTER TABLE "TimetableSlot" ADD COLUMN     "topicId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClassSection_homeRoomId_key" ON "ClassSection"("homeRoomId");

-- CreateIndex
CREATE INDEX "ClassTeacher_sectionId_idx" ON "ClassTeacher"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTeacher_classId_sectionId_teacherId_key" ON "ClassTeacher"("classId", "sectionId", "teacherId");

-- CreateIndex
CREATE INDEX "Syllabus_subjectId_classId_idx" ON "Syllabus"("subjectId", "classId");

-- CreateIndex
CREATE INDEX "Syllabus_academicYearId_isActive_idx" ON "Syllabus"("academicYearId", "isActive");

-- CreateIndex
CREATE INDEX "Syllabus_status_isActive_idx" ON "Syllabus"("status", "isActive");

-- CreateIndex
CREATE INDEX "Syllabus_curriculumType_boardType_idx" ON "Syllabus"("curriculumType", "boardType");

-- CreateIndex
CREATE UNIQUE INDEX "Syllabus_subjectId_academicYearId_classId_sectionId_curricu_key" ON "Syllabus"("subjectId", "academicYearId", "classId", "sectionId", "curriculumType");

-- CreateIndex
CREATE INDEX "TimetableSlot_topicId_idx" ON "TimetableSlot"("topicId");

-- AddForeignKey
ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_homeRoomId_fkey" FOREIGN KEY ("homeRoomId") REFERENCES "ClassRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_parentSyllabusId_fkey" FOREIGN KEY ("parentSyllabusId") REFERENCES "Syllabus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "SubModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
