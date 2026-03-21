-- Migration: Add per-student pricing fields to subscription_plans
-- Review this before running: prisma migrate dev --name add_per_student_pricing
--
-- Safe to run on existing data — all new columns have defaults.
-- After running: prisma generate to update the Prisma client types.

ALTER TABLE "subscription_plans"
  ADD COLUMN IF NOT EXISTS "pricePerStudent"      INTEGER NOT NULL DEFAULT 400,
  ADD COLUMN IF NOT EXISTS "minimumMonthly"       INTEGER NOT NULL DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS "annualDiscountMonths" INTEGER NOT NULL DEFAULT 2;

-- Backfill existing plans based on their name (STARTER/GROWTH/DOMINATE)
UPDATE "subscription_plans" SET
  "pricePerStudent"      = 400,
  "minimumMonthly"       = 50000,
  "annualDiscountMonths" = 2
WHERE LOWER(name) LIKE '%starter%';

UPDATE "subscription_plans" SET
  "pricePerStudent"      = 600,
  "minimumMonthly"       = 100000,
  "annualDiscountMonths" = 2
WHERE LOWER(name) LIKE '%growth%';

UPDATE "subscription_plans" SET
  "pricePerStudent"      = 900,
  "minimumMonthly"       = 250000,
  "annualDiscountMonths" = 2
WHERE LOWER(name) LIKE '%dominate%';

-- The features Json column already exists — no change needed there.
-- Existing features Json will be updated by the super admin plan editor UI.
