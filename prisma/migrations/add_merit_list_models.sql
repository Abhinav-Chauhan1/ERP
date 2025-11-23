-- Add merit list configuration and generated merit lists

-- Merit List Configuration
CREATE TABLE "MeritListConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "appliedClassId" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MeritListConfig_appliedClassId_fkey" FOREIGN KEY ("appliedClassId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Merit List (Generated)
CREATE TABLE "MeritList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configId" TEXT NOT NULL,
    "appliedClassId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "totalApplications" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MeritList_configId_fkey" FOREIGN KEY ("configId") REFERENCES "MeritListConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MeritList_appliedClassId_fkey" FOREIGN KEY ("appliedClassId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Merit List Entry (Individual ranked application)
CREATE TABLE "MeritListEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meritListId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeritListEntry_meritListId_fkey" FOREIGN KEY ("meritListId") REFERENCES "MeritList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MeritListEntry_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX "MeritListConfig_appliedClassId_idx" ON "MeritListConfig"("appliedClassId");
CREATE INDEX "MeritListConfig_isActive_idx" ON "MeritListConfig"("isActive");
CREATE INDEX "MeritList_configId_idx" ON "MeritList"("configId");
CREATE INDEX "MeritList_appliedClassId_idx" ON "MeritList"("appliedClassId");
CREATE INDEX "MeritList_generatedAt_idx" ON "MeritList"("generatedAt");
CREATE INDEX "MeritListEntry_meritListId_idx" ON "MeritListEntry"("meritListId");
CREATE INDEX "MeritListEntry_applicationId_idx" ON "MeritListEntry"("applicationId");
CREATE INDEX "MeritListEntry_rank_idx" ON "MeritListEntry"("rank");
CREATE UNIQUE INDEX "MeritListEntry_meritListId_applicationId_key" ON "MeritListEntry"("meritListId", "applicationId");
CREATE UNIQUE INDEX "MeritListEntry_meritListId_rank_key" ON "MeritListEntry"("meritListId", "rank");
