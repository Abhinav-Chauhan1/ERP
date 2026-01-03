-- CreateTable
CREATE TABLE "receipt_notes" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "receipt_notes_receiptId_createdAt_idx" ON "receipt_notes"("receiptId", "createdAt");

-- CreateIndex
CREATE INDEX "receipt_notes_receiptId_idx" ON "receipt_notes"("receiptId");

-- AddForeignKey
ALTER TABLE "receipt_notes" ADD CONSTRAINT "receipt_notes_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "payment_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
