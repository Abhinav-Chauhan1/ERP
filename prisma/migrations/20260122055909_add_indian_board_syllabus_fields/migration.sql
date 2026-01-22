/*
  Warnings:

  - A unique constraint covering the columns `[boardType,grade]` on the table `GradeScale` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('CORE', 'LANGUAGE', 'ELECTIVE', 'ADDITIONAL', 'VOCATIONAL', 'SKILL_BASED');

-- CreateEnum
CREATE TYPE "AssessmentRuleType" AS ENUM ('BEST_OF', 'AVERAGE', 'WEIGHTED_AVERAGE', 'SUM');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('GRADED', 'CO_SCHOLASTIC');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "reportCardTemplateId" TEXT;

-- AlterTable
ALTER TABLE "GradeScale" ADD COLUMN     "boardType" TEXT NOT NULL DEFAULT 'CBSE',
ADD COLUMN     "gradePoint" DOUBLE PRECISION,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "term" TEXT,
ADD COLUMN     "weightage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "hasPractical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasTheory" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isCompulsory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "SubjectType" NOT NULL DEFAULT 'CORE';

-- AlterTable
ALTER TABLE "Syllabus" ADD COLUMN     "assessmentType" "AssessmentType" NOT NULL DEFAULT 'GRADED';

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "affiliationNumber" TEXT,
ADD COLUMN     "attendanceNotificationChannels" TEXT[] DEFAULT ARRAY['SMS', 'IN_APP']::TEXT[],
ADD COLUMN     "board" TEXT DEFAULT 'CBSE',
ADD COLUMN     "enrollmentNotificationChannels" TEXT[] DEFAULT ARRAY['EMAIL', 'IN_APP']::TEXT[],
ADD COLUMN     "examResultNotificationChannels" TEXT[] DEFAULT ARRAY['EMAIL', 'IN_APP']::TEXT[],
ADD COLUMN     "leaveAppNotificationChannels" TEXT[] DEFAULT ARRAY['EMAIL', 'IN_APP']::TEXT[],
ADD COLUMN     "paymentNotificationChannels" TEXT[] DEFAULT ARRAY['EMAIL', 'IN_APP']::TEXT[],
ADD COLUMN     "schoolCode" TEXT;

-- CreateTable
CREATE TABLE "SubjectVariant" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "variantType" TEXT NOT NULL,
    "description" TEXT,
    "prerequisite" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "boardType" TEXT NOT NULL DEFAULT 'CBSE',
    "applicableClasses" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectGroupMapping" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "isCompulsory" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SubjectGroupMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT,
    "subjectId" TEXT,
    "ruleType" "AssessmentRuleType" NOT NULL,
    "examTypes" TEXT[],
    "count" INTEGER,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_report_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataSource" TEXT NOT NULL,
    "selectedFields" TEXT[],
    "filters" JSONB NOT NULL,
    "sorting" JSONB NOT NULL,
    "chartConfig" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_report_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectVariant_subjectId_variantType_key" ON "SubjectVariant"("subjectId", "variantType");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectGroup_code_key" ON "SubjectGroup"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectGroupMapping_groupId_subjectId_key" ON "SubjectGroupMapping"("groupId", "subjectId");

-- CreateIndex
CREATE INDEX "saved_report_configs_userId_idx" ON "saved_report_configs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeScale_boardType_grade_key" ON "GradeScale"("boardType", "grade");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_reportCardTemplateId_fkey" FOREIGN KEY ("reportCardTemplateId") REFERENCES "report_card_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectVariant" ADD CONSTRAINT "SubjectVariant_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectGroupMapping" ADD CONSTRAINT "SubjectGroupMapping_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SubjectGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectGroupMapping" ADD CONSTRAINT "SubjectGroupMapping_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRule" ADD CONSTRAINT "AssessmentRule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_report_configs" ADD CONSTRAINT "saved_report_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
