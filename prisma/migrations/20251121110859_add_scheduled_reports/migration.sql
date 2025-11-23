-- CreateTable
CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataSource" TEXT NOT NULL,
    "selectedFields" TEXT NOT NULL,
    "filters" TEXT NOT NULL,
    "sorting" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "scheduleTime" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "recipients" TEXT NOT NULL,
    "exportFormat" TEXT NOT NULL DEFAULT 'pdf',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_reports_active_nextRunAt_idx" ON "scheduled_reports"("active", "nextRunAt");

-- CreateIndex
CREATE INDEX "scheduled_reports_createdBy_idx" ON "scheduled_reports"("createdBy");
