-- AlterTable
ALTER TABLE "MiscFeePayment" ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "transactionId" TEXT,
ADD COLUMN     "receiptNumber" TEXT;
