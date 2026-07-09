-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FLAT_AMOUNT', 'PERCENTAGE');

-- CreateTable
CREATE TABLE "FeeDiscount" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "grantedBy" TEXT NOT NULL,
    "grantedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "FeeDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeeDiscount_studentId_feeStructureId_key" ON "FeeDiscount"("studentId", "feeStructureId");

-- CreateIndex
CREATE INDEX "FeeDiscount_studentId_idx" ON "FeeDiscount"("studentId");

-- CreateIndex
CREATE INDEX "FeeDiscount_feeStructureId_idx" ON "FeeDiscount"("feeStructureId");

-- CreateIndex
CREATE INDEX "FeeDiscount_schoolId_idx" ON "FeeDiscount"("schoolId");

-- CreateIndex
CREATE INDEX "FeeDiscount_schoolId_studentId_idx" ON "FeeDiscount"("schoolId", "studentId");

-- AddForeignKey
ALTER TABLE "FeeDiscount" ADD CONSTRAINT "FeeDiscount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeDiscount" ADD CONSTRAINT "FeeDiscount_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeDiscount" ADD CONSTRAINT "FeeDiscount_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
