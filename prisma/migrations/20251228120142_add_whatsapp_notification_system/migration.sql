/*
  Warnings:

  - You are about to drop the column `clerkId` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "WhatsAppTemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP');

-- CreateEnum
CREATE TYPE "MessageLogStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContactMethod" ADD VALUE 'WHATSAPP';
ALTER TYPE "ContactMethod" ADD VALUE 'EMAIL_AND_SMS';
ALTER TYPE "ContactMethod" ADD VALUE 'EMAIL_AND_WHATSAPP';
ALTER TYPE "ContactMethod" ADD VALUE 'SMS_AND_WHATSAPP';
ALTER TYPE "ContactMethod" ADD VALUE 'ALL';

-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'WHATSAPP';

-- DropIndex
DROP INDEX "User_clerkId_key";

-- AlterTable
ALTER TABLE "ParentSettings" ADD COLUMN     "whatsappNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappNumber" TEXT,
ADD COLUMN     "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "clerkId";

-- AlterTable
ALTER TABLE "message_templates" ADD COLUMN     "dltTemplateId" TEXT,
ADD COLUMN     "whatsappLanguage" TEXT,
ADD COLUMN     "whatsappStatus" "WhatsAppTemplateStatus",
ADD COLUMN     "whatsappTemplateId" TEXT,
ADD COLUMN     "whatsappTemplateName" TEXT;

-- CreateTable
CREATE TABLE "message_logs" (
    "id" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "userId" TEXT,
    "templateId" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "status" "MessageLogStatus" NOT NULL,
    "messageId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "estimatedCost" DECIMAL(10,4),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_logs_channel_createdAt_idx" ON "message_logs"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "message_logs_userId_createdAt_idx" ON "message_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "message_logs_status_createdAt_idx" ON "message_logs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "message_templates_whatsappStatus_idx" ON "message_templates"("whatsappStatus");
