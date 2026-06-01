-- Migration: Per-school Cashfree credentials in SchoolSettings
-- Generated: 2026-06-01

ALTER TABLE "school_settings"
  ADD COLUMN IF NOT EXISTS "cashfreeEnabled"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "cashfreeAppId"            TEXT,
  ADD COLUMN IF NOT EXISTS "cashfreeSecretEncrypted"  TEXT,
  ADD COLUMN IF NOT EXISTS "cashfreeWebhookEncrypted" TEXT;
