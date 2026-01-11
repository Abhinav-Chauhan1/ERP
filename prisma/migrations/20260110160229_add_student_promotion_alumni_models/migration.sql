-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('PROMOTED', 'EXCLUDED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CertificateType" ADD VALUE 'CHARACTER';
ALTER TYPE "CertificateType" ADD VALUE 'BONAFIDE';
ALTER TYPE "CertificateType" ADD VALUE 'TRANSFER';

-- CreateTable
CREATE TABLE "alumni" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "graduationDate" TIMESTAMP(3) NOT NULL,
    "finalClass" TEXT NOT NULL,
    "finalSection" TEXT NOT NULL,
    "finalAcademicYear" TEXT NOT NULL,
    "currentOccupation" TEXT,
    "currentEmployer" TEXT,
    "currentJobTitle" TEXT,
    "currentAddress" TEXT,
    "currentCity" TEXT,
    "currentState" TEXT,
    "currentCountry" TEXT DEFAULT 'India',
    "currentPhone" TEXT,
    "currentEmail" TEXT,
    "higherEducation" TEXT,
    "collegeName" TEXT,
    "collegeLocation" TEXT,
    "graduationYearCollege" INTEGER,
    "achievements" TEXT,
    "linkedInProfile" TEXT,
    "profilePhoto" TEXT,
    "allowCommunication" BOOLEAN NOT NULL DEFAULT true,
    "communicationEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_history" (
    "id" TEXT NOT NULL,
    "sourceAcademicYear" TEXT NOT NULL,
    "sourceClass" TEXT NOT NULL,
    "sourceSection" TEXT,
    "targetAcademicYear" TEXT NOT NULL,
    "targetClass" TEXT NOT NULL,
    "targetSection" TEXT,
    "totalStudents" INTEGER NOT NULL,
    "promotedStudents" INTEGER NOT NULL,
    "excludedStudents" INTEGER NOT NULL,
    "failedStudents" INTEGER NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedBy" TEXT NOT NULL,
    "notes" TEXT,
    "excludedList" TEXT,
    "failureDetails" TEXT,

    CONSTRAINT "promotion_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_records" (
    "id" TEXT NOT NULL,
    "historyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "previousEnrollmentId" TEXT NOT NULL,
    "newEnrollmentId" TEXT,
    "status" "PromotionStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alumni_studentId_key" ON "alumni"("studentId");

-- CreateIndex
CREATE INDEX "alumni_graduationDate_idx" ON "alumni"("graduationDate");

-- CreateIndex
CREATE INDEX "alumni_finalClass_idx" ON "alumni"("finalClass");

-- CreateIndex
CREATE INDEX "alumni_currentCity_idx" ON "alumni"("currentCity");

-- CreateIndex
CREATE INDEX "alumni_collegeName_idx" ON "alumni"("collegeName");

-- CreateIndex
CREATE INDEX "promotion_history_sourceAcademicYear_sourceClass_idx" ON "promotion_history"("sourceAcademicYear", "sourceClass");

-- CreateIndex
CREATE INDEX "promotion_history_targetAcademicYear_targetClass_idx" ON "promotion_history"("targetAcademicYear", "targetClass");

-- CreateIndex
CREATE INDEX "promotion_history_executedAt_idx" ON "promotion_history"("executedAt");

-- CreateIndex
CREATE INDEX "promotion_records_historyId_idx" ON "promotion_records"("historyId");

-- CreateIndex
CREATE INDEX "promotion_records_studentId_idx" ON "promotion_records"("studentId");

-- AddForeignKey
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_records" ADD CONSTRAINT "promotion_records_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "promotion_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_records" ADD CONSTRAINT "promotion_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
