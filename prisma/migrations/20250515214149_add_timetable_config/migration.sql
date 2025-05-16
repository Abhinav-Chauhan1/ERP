-- CreateTable
CREATE TABLE "TimetableConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "daysOfWeek" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetablePeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL,
    "configId" TEXT NOT NULL,

    CONSTRAINT "TimetablePeriod_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TimetablePeriod" ADD CONSTRAINT "TimetablePeriod_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TimetableConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
