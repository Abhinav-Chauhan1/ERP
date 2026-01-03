-- CreateEnum
CREATE TYPE "PaymentSource" AS ENUM ('MANUAL', 'ONLINE', 'RECEIPT_UPLOAD');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "FeePayment" ADD COLUMN     "paymentSource" "PaymentSource" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "allowedReceiptFormats" TEXT NOT NULL DEFAULT 'jpg,jpeg,png,pdf',
ADD COLUMN     "autoNotifyOnVerification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableOfflineVerification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableOnlinePayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxReceiptSizeMB" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "onlinePaymentGateway" TEXT;

-- CreateTable
CREATE TABLE "payment_receipts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "transactionRef" TEXT,
    "remarks" TEXT,
    "receiptImageUrl" TEXT NOT NULL,
    "receiptPublicId" TEXT NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "feePaymentId" TEXT,
    "referenceNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_receipts_feePaymentId_key" ON "payment_receipts"("feePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_receipts_referenceNumber_key" ON "payment_receipts"("referenceNumber");

-- CreateIndex
CREATE INDEX "payment_receipts_studentId_status_idx" ON "payment_receipts"("studentId", "status");

-- CreateIndex
CREATE INDEX "payment_receipts_status_createdAt_idx" ON "payment_receipts"("status", "createdAt");

-- CreateIndex
CREATE INDEX "payment_receipts_feeStructureId_idx" ON "payment_receipts"("feeStructureId");

-- CreateIndex
CREATE INDEX "calendar_events_startDate_categoryId_idx" ON "calendar_events"("startDate", "categoryId");

-- CreateIndex
CREATE INDEX "calendar_events_isRecurring_recurrenceId_idx" ON "calendar_events"("isRecurring", "recurrenceId");

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_feePaymentId_fkey" FOREIGN KEY ("feePaymentId") REFERENCES "FeePayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
