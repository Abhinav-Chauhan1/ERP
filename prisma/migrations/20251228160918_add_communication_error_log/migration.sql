-- CreateEnum
CREATE TYPE "ErrorCategory" AS ENUM ('CONFIGURATION', 'AUTHENTICATION', 'VALIDATION', 'RATE_LIMIT', 'NETWORK', 'API_ERROR', 'DATABASE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ErrorSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "communication_error_logs" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" "ErrorCategory" NOT NULL,
    "severity" "ErrorSeverity" NOT NULL,
    "channel" "CommunicationChannel",
    "errorCode" TEXT,
    "errorDetails" TEXT,
    "recipient" TEXT,
    "userId" TEXT,
    "messageId" TEXT,
    "metadata" JSONB,
    "stackTrace" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communication_error_logs_category_createdAt_idx" ON "communication_error_logs"("category", "createdAt");

-- CreateIndex
CREATE INDEX "communication_error_logs_severity_createdAt_idx" ON "communication_error_logs"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "communication_error_logs_channel_createdAt_idx" ON "communication_error_logs"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "communication_error_logs_resolved_createdAt_idx" ON "communication_error_logs"("resolved", "createdAt");
