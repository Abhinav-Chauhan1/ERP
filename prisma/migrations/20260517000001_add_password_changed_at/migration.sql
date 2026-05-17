-- Add passwordChangedAt to User for JWT revocation after password reset
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
