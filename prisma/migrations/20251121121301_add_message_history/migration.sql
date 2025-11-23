-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'PARTIALLY_SENT');

-- CreateTable
CREATE TABLE "message_history" (
    "id" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "templateId" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "smsCount" INTEGER NOT NULL DEFAULT 0,
    "emailCount" INTEGER NOT NULL DEFAULT 0,
    "smsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emailCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "recipientSelection" JSONB NOT NULL,
    "results" JSONB,
    "sentBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_history_sentBy_idx" ON "message_history"("sentBy");

-- CreateIndex
CREATE INDEX "message_history_sentAt_idx" ON "message_history"("sentAt");

-- CreateIndex
CREATE INDEX "message_history_status_idx" ON "message_history"("status");

-- CreateIndex
CREATE INDEX "message_history_messageType_idx" ON "message_history"("messageType");

-- CreateIndex
CREATE INDEX "message_history_templateId_idx" ON "message_history"("templateId");

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
