-- CreateTable
CREATE TABLE "FeeInvoiceSummary" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "grossTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "FeeInvoiceSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeeInvoiceSummary_studentId_feeStructureId_key" ON "FeeInvoiceSummary"("studentId", "feeStructureId");

-- CreateIndex
CREATE INDEX "FeeInvoiceSummary_schoolId_idx" ON "FeeInvoiceSummary"("schoolId");

-- CreateIndex
CREATE INDEX "FeeInvoiceSummary_schoolId_status_idx" ON "FeeInvoiceSummary"("schoolId", "status");

-- CreateIndex
CREATE INDEX "FeeInvoiceSummary_schoolId_dueAmount_idx" ON "FeeInvoiceSummary"("schoolId", "dueAmount");

-- AddForeignKey
ALTER TABLE "FeeInvoiceSummary" ADD CONSTRAINT "FeeInvoiceSummary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInvoiceSummary" ADD CONSTRAINT "FeeInvoiceSummary_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInvoiceSummary" ADD CONSTRAINT "FeeInvoiceSummary_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
