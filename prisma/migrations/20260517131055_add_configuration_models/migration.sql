-- CreateTable
CREATE TABLE "SystemConfiguration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GLOBAL',
    "environment" TEXT NOT NULL DEFAULT 'production',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
    "rolloutStrategy" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "targetSchools" JSONB,
    "targetUsers" JSONB,
    "conditions" JSONB,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemConfiguration_category_idx" ON "SystemConfiguration"("category");

-- CreateIndex
CREATE INDEX "SystemConfiguration_environment_idx" ON "SystemConfiguration"("environment");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfiguration_key_environment_key" ON "SystemConfiguration"("key", "environment");

-- CreateIndex
CREATE INDEX "FeatureFlag_environment_isEnabled_idx" ON "FeatureFlag"("environment", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_name_environment_key" ON "FeatureFlag"("name", "environment");

-- CreateIndex
CREATE INDEX "ReportCard_studentId_termId_academicYearId_idx" ON "ReportCard"("studentId", "termId", "academicYearId");
