-- CreateTable
CREATE TABLE "MeritListConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appliedClassId" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeritListConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeritList" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "appliedClassId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "totalApplications" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeritList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeritListEntry" (
    "id" TEXT NOT NULL,
    "meritListId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeritListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeritListConfig_appliedClassId_idx" ON "MeritListConfig"("appliedClassId");

-- CreateIndex
CREATE INDEX "MeritListConfig_isActive_idx" ON "MeritListConfig"("isActive");

-- CreateIndex
CREATE INDEX "MeritList_configId_idx" ON "MeritList"("configId");

-- CreateIndex
CREATE INDEX "MeritList_appliedClassId_idx" ON "MeritList"("appliedClassId");

-- CreateIndex
CREATE INDEX "MeritList_generatedAt_idx" ON "MeritList"("generatedAt");

-- CreateIndex
CREATE INDEX "MeritListEntry_meritListId_idx" ON "MeritListEntry"("meritListId");

-- CreateIndex
CREATE INDEX "MeritListEntry_applicationId_idx" ON "MeritListEntry"("applicationId");

-- CreateIndex
CREATE INDEX "MeritListEntry_rank_idx" ON "MeritListEntry"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "MeritListEntry_meritListId_applicationId_key" ON "MeritListEntry"("meritListId", "applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "MeritListEntry_meritListId_rank_key" ON "MeritListEntry"("meritListId", "rank");

-- AddForeignKey
ALTER TABLE "MeritListConfig" ADD CONSTRAINT "MeritListConfig_appliedClassId_fkey" FOREIGN KEY ("appliedClassId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeritList" ADD CONSTRAINT "MeritList_configId_fkey" FOREIGN KEY ("configId") REFERENCES "MeritListConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeritList" ADD CONSTRAINT "MeritList_appliedClassId_fkey" FOREIGN KEY ("appliedClassId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeritListEntry" ADD CONSTRAINT "MeritListEntry_meritListId_fkey" FOREIGN KEY ("meritListId") REFERENCES "MeritList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeritListEntry" ADD CONSTRAINT "MeritListEntry_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
