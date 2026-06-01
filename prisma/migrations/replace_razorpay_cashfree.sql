-- Migration: Replace Razorpay fields with Cashfree equivalents
-- Generated: 2026-06-01

-- schools: razorpayCustomerId → cfCustomerId
DROP INDEX IF EXISTS "schools_razorpayCustomerId_key";
ALTER TABLE "schools"
  DROP COLUMN IF EXISTS "razorpayCustomerId",
  ADD COLUMN IF NOT EXISTS "cfCustomerId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "schools_cfCustomerId_key" ON "schools"("cfCustomerId");

-- subscription_plans: remove razorpayPlanId
DROP INDEX IF EXISTS "subscription_plans_razorpayPlanId_key";
ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "razorpayPlanId";

-- enhanced_subscriptions: razorpaySubscriptionId → cfOrderRef (non-unique)
DROP INDEX IF EXISTS "enhanced_subscriptions_razorpaySubscriptionId_key";
ALTER TABLE "enhanced_subscriptions"
  DROP COLUMN IF EXISTS "razorpaySubscriptionId",
  ADD COLUMN IF NOT EXISTS "cfOrderRef" TEXT;

-- invoices: remove razorpayInvoiceId
DROP INDEX IF EXISTS "invoices_razorpayInvoiceId_key";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "razorpayInvoiceId";

-- payments: razorpayPaymentId → cfPaymentId, add paymentSessionId
DROP INDEX IF EXISTS "payments_razorpayPaymentId_key";
ALTER TABLE "payments"
  DROP COLUMN IF EXISTS "razorpayPaymentId",
  ADD COLUMN IF NOT EXISTS "cfPaymentId" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentSessionId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_cfPaymentId_key" ON "payments"("cfPaymentId");

-- payment_method_records: razorpayCustomerId → cfCustomerId
ALTER TABLE "payment_method_records"
  DROP COLUMN IF EXISTS "razorpayCustomerId",
  ADD COLUMN IF NOT EXISTS "cfCustomerId" TEXT;
