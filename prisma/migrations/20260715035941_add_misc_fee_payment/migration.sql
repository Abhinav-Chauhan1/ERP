-- CreateEnum
CREATE TYPE "MiscFeeCategory" AS ENUM ('BOOKS', 'TRANSPORT');

-- CreateTable
CREATE TABLE "MiscFeePayment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "category" "MiscFeeCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountType" "DiscountType",
    "discountValue" DOUBLE PRECISION,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "MiscFeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MiscFeePayment_studentId_academicYearId_category_key" ON "MiscFeePayment"("studentId", "academicYearId", "category");

-- CreateIndex
CREATE INDEX "MiscFeePayment_schoolId_category_idx" ON "MiscFeePayment"("schoolId", "category");

-- CreateIndex
CREATE INDEX "MiscFeePayment_schoolId_status_idx" ON "MiscFeePayment"("schoolId", "status");

-- CreateIndex
CREATE INDEX "MiscFeePayment_academicYearId_idx" ON "MiscFeePayment"("academicYearId");

-- AddForeignKey
ALTER TABLE "MiscFeePayment" ADD CONSTRAINT "MiscFeePayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiscFeePayment" ADD CONSTRAINT "MiscFeePayment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiscFeePayment" ADD CONSTRAINT "MiscFeePayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
