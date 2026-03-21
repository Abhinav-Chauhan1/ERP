-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "annualDiscountMonths" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "minimumMonthly" INTEGER NOT NULL DEFAULT 50000,
ADD COLUMN     "pricePerStudent" INTEGER NOT NULL DEFAULT 400,
ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "interval" SET DEFAULT 'monthly';
