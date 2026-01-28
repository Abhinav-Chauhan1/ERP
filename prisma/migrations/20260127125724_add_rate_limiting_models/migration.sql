/*
  Warnings:

  - You are about to drop the column `stripeSubscriptionId` on the `enhanced_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `stripeInvoiceId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceId` on the `subscription_plans` table. All the data in the column will be lost.
  - The `role` column on the `user_schools` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[mobile]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpaySubscriptionId]` on the table `enhanced_subscriptions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpayInvoiceId]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpayPaymentId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subdomain]` on the table `schools` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpayCustomerId]` on the table `schools` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpayPlanId]` on the table `subscription_plans` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `action` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SubdomainStatus" AS ENUM ('PENDING', 'DNS_CONFIGURED', 'SSL_CONFIGURED', 'ACTIVE', 'FAILED');

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropIndex
DROP INDEX "audit_logs_action_idx";

-- DropIndex
DROP INDEX "audit_logs_action_timestamp_idx";

-- DropIndex
DROP INDEX "audit_logs_resource_resourceId_idx";

-- DropIndex
DROP INDEX "audit_logs_resource_timestamp_idx";

-- DropIndex
DROP INDEX "audit_logs_timestamp_idx";

-- DropIndex
DROP INDEX "audit_logs_userId_timestamp_idx";

-- DropIndex
DROP INDEX "enhanced_subscriptions_stripeSubscriptionId_key";

-- DropIndex
DROP INDEX "invoices_stripeInvoiceId_key";

-- DropIndex
DROP INDEX "payments_stripePaymentId_key";

-- DropIndex
DROP INDEX "subscription_plans_stripePriceId_key";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "parentMobile" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "details" JSONB,
ADD COLUMN     "schoolId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
DROP COLUMN "action",
ADD COLUMN     "action" TEXT NOT NULL,
ALTER COLUMN "resource" DROP NOT NULL,
ALTER COLUMN "timestamp" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "checksum" DROP NOT NULL;

-- AlterTable
ALTER TABLE "enhanced_subscriptions" DROP COLUMN "stripeSubscriptionId",
ADD COLUMN     "razorpaySubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "stripeInvoiceId",
ADD COLUMN     "razorpayInvoiceId" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'inr';

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "stripePaymentId",
ADD COLUMN     "razorpayPaymentId" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'inr';

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "dnsConfigured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "razorpayCustomerId" TEXT,
ADD COLUMN     "sslConfigured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sslExpiresAt" TIMESTAMP(3),
ADD COLUMN     "subdomainStatus" "SubdomainStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "stripePriceId",
ADD COLUMN     "razorpayPlanId" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'inr';

-- AlterTable
ALTER TABLE "user_schools" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'STUDENT';

-- CreateTable
CREATE TABLE "payment_method_records" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "razorpayCustomerId" TEXT,
    "type" TEXT NOT NULL,
    "encryptedDetails" TEXT NOT NULL,
    "last4" TEXT,
    "brand" TEXT,
    "expiryMonth" TEXT,
    "expiryYear" TEXT,
    "holderName" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "activeSchoolId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "tags" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "metadata" JSONB,
    "threshold" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "condition" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyAdmins" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT false,
    "emailRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "schoolId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_health" (
    "id" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responseTime" DOUBLE PRECISION,
    "errorRate" DOUBLE PRECISION,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "system_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "component" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_identifiers" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_failures" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_failures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_logs" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otps_identifier_idx" ON "otps"("identifier");

-- CreateIndex
CREATE INDEX "otps_expiresAt_idx" ON "otps"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_key" ON "auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_idx" ON "auth_sessions"("userId");

-- CreateIndex
CREATE INDEX "auth_sessions_token_idx" ON "auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_expiresAt_idx" ON "auth_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "system_metrics_metricName_timestamp_idx" ON "system_metrics"("metricName", "timestamp");

-- CreateIndex
CREATE INDEX "system_metrics_schoolId_timestamp_idx" ON "system_metrics"("schoolId", "timestamp");

-- CreateIndex
CREATE INDEX "alerts_alertType_isResolved_idx" ON "alerts"("alertType", "isResolved");

-- CreateIndex
CREATE INDEX "alerts_severity_createdAt_idx" ON "alerts"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "alerts_schoolId_isResolved_idx" ON "alerts"("schoolId", "isResolved");

-- CreateIndex
CREATE INDEX "alert_configs_alertType_enabled_idx" ON "alert_configs"("alertType", "enabled");

-- CreateIndex
CREATE INDEX "alert_configs_schoolId_idx" ON "alert_configs"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "system_health_component_key" ON "system_health"("component");

-- CreateIndex
CREATE INDEX "system_health_component_lastChecked_idx" ON "system_health"("component", "lastChecked");

-- CreateIndex
CREATE INDEX "system_health_status_lastChecked_idx" ON "system_health"("status", "lastChecked");

-- CreateIndex
CREATE INDEX "performance_metrics_metricType_timestamp_idx" ON "performance_metrics"("metricType", "timestamp");

-- CreateIndex
CREATE INDEX "performance_metrics_component_timestamp_idx" ON "performance_metrics"("component", "timestamp");

-- CreateIndex
CREATE INDEX "blocked_identifiers_identifier_isActive_expiresAt_idx" ON "blocked_identifiers"("identifier", "isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "blocked_identifiers_expiresAt_isActive_idx" ON "blocked_identifiers"("expiresAt", "isActive");

-- CreateIndex
CREATE INDEX "login_failures_identifier_createdAt_idx" ON "login_failures"("identifier", "createdAt");

-- CreateIndex
CREATE INDEX "login_failures_createdAt_idx" ON "login_failures"("createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_logs_identifier_action_createdAt_idx" ON "rate_limit_logs"("identifier", "action", "createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_logs_action_createdAt_idx" ON "rate_limit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_logs_createdAt_idx" ON "rate_limit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "Student_parentMobile_idx" ON "Student"("parentMobile");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_schoolId_createdAt_idx" ON "audit_logs"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "enhanced_subscriptions_razorpaySubscriptionId_key" ON "enhanced_subscriptions"("razorpaySubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_razorpayInvoiceId_key" ON "invoices"("razorpayInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpayPaymentId_key" ON "payments"("razorpayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "schools_subdomain_key" ON "schools"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "schools_razorpayCustomerId_key" ON "schools"("razorpayCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_razorpayPlanId_key" ON "subscription_plans"("razorpayPlanId");

-- CreateIndex
CREATE INDEX "user_schools_role_idx" ON "user_schools"("role");

-- AddForeignKey
ALTER TABLE "payment_method_records" ADD CONSTRAINT "payment_method_records_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_metrics" ADD CONSTRAINT "system_metrics_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_configs" ADD CONSTRAINT "alert_configs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_configs" ADD CONSTRAINT "alert_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
