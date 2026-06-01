-- Migration: Subscription model improvements
-- Generated: 2026-06-01

-- EnhancedSubscription: add studentCount, fix metadata default
ALTER TABLE "enhanced_subscriptions"
  ADD COLUMN IF NOT EXISTS "studentCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "enhanced_subscriptions" SET "metadata" = '{}' WHERE "metadata" IS NULL;
ALTER TABLE "enhanced_subscriptions" ALTER COLUMN "metadata" SET DEFAULT '{}';
ALTER TABLE "enhanced_subscriptions" ALTER COLUMN "metadata" SET NOT NULL;

-- Invoice: add invoiceNumber, fix metadata default
ALTER TABLE "invoices"
  ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber") WHERE "invoiceNumber" IS NOT NULL;

UPDATE "invoices" SET "metadata" = '{}' WHERE "metadata" IS NULL;
ALTER TABLE "invoices" ALTER COLUMN "metadata" SET DEFAULT '{}';
ALTER TABLE "invoices" ALTER COLUMN "metadata" SET NOT NULL;

-- SubscriptionPlan: add unique constraint on name
-- First check for duplicates (remove any before adding constraint)
DELETE FROM "subscription_plans" a USING "subscription_plans" b
  WHERE a.id > b.id AND a.name = b.name;
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_plans_name_key" ON "subscription_plans"("name");
