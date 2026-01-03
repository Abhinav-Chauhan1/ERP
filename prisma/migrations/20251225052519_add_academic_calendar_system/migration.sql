-- CreateEnum
CREATE TYPE "EventSourceType" AS ENUM ('EXAM', 'ASSIGNMENT', 'MEETING', 'HOLIDAY', 'SCHOOL_EVENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- DropIndex
DROP INDEX "Event_category_idx";

-- CreateTable
CREATE TABLE "calendar_event_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_event_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "visibleToRoles" TEXT[],
    "visibleToClasses" TEXT[],
    "visibleToSections" TEXT[],
    "sourceType" "EventSourceType",
    "sourceId" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "recurrenceId" TEXT,
    "exceptionDates" TIMESTAMP(3)[],
    "attachments" TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_notes" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_reminders" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderTime" TIMESTAMP(3) NOT NULL,
    "reminderType" "ReminderType" NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_calendar_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultView" TEXT NOT NULL DEFAULT 'month',
    "filterSettings" JSONB,
    "defaultReminderTime" INTEGER NOT NULL DEFAULT 1440,
    "reminderTypes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_calendar_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_event_categories_name_key" ON "calendar_event_categories"("name");

-- CreateIndex
CREATE INDEX "calendar_event_categories_isActive_order_idx" ON "calendar_event_categories"("isActive", "order");

-- CreateIndex
CREATE INDEX "calendar_events_startDate_endDate_idx" ON "calendar_events"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "calendar_events_categoryId_idx" ON "calendar_events"("categoryId");

-- CreateIndex
CREATE INDEX "calendar_events_sourceType_sourceId_idx" ON "calendar_events"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "calendar_events_recurrenceId_idx" ON "calendar_events"("recurrenceId");

-- CreateIndex
CREATE INDEX "calendar_events_createdBy_idx" ON "calendar_events"("createdBy");

-- CreateIndex
CREATE INDEX "event_notes_eventId_userId_idx" ON "event_notes"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_notes_userId_idx" ON "event_notes"("userId");

-- CreateIndex
CREATE INDEX "event_reminders_eventId_userId_idx" ON "event_reminders"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_reminders_userId_isSent_idx" ON "event_reminders"("userId", "isSent");

-- CreateIndex
CREATE INDEX "event_reminders_reminderTime_isSent_idx" ON "event_reminders"("reminderTime", "isSent");

-- CreateIndex
CREATE UNIQUE INDEX "user_calendar_preferences_userId_key" ON "user_calendar_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_calendar_preferences_userId_idx" ON "user_calendar_preferences"("userId");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "calendar_event_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_notes" ADD CONSTRAINT "event_notes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
