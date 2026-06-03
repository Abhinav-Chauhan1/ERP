-- CreateEnum
CREATE TYPE "PTPatternAggregation" AS ENUM ('SUM', 'AVERAGE', 'BEST_OF', 'USE_LAST', 'CUSTOM_GROUPS');

-- AlterEnum (add CUSTOM_GROUPS to existing AssessmentRuleType)
ALTER TYPE "AssessmentRuleType" ADD VALUE IF NOT EXISTS 'CUSTOM_GROUPS';

-- CreateTable
CREATE TABLE "PTPattern" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT,
    "termId" TEXT,
    "cbseLevel" TEXT,
    "name" TEXT NOT NULL,
    "ptCount" INTEGER NOT NULL,
    "perMarks" DOUBLE PRECISION NOT NULL,
    "passingMarks" DOUBLE PRECISION NOT NULL,
    "aggregation" "PTPatternAggregation" NOT NULL,
    "bestOfCount" INTEGER,
    "groups" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PTPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PTPattern_schoolId_idx" ON "PTPattern"("schoolId");

-- CreateIndex
CREATE INDEX "PTPattern_schoolId_classId_termId_idx" ON "PTPattern"("schoolId", "classId", "termId");

-- AddForeignKey
ALTER TABLE "PTPattern" ADD CONSTRAINT "PTPattern_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PTPattern" ADD CONSTRAINT "PTPattern_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PTPattern" ADD CONSTRAINT "PTPattern_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;
