-- AlterTable
ALTER TABLE "FeeStructure" ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "FeeStructureClass" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeStructureClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeTypeClassAmount" (
    "id" TEXT NOT NULL,
    "feeTypeId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeTypeClassAmount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeeStructureClass_feeStructureId_idx" ON "FeeStructureClass"("feeStructureId");

-- CreateIndex
CREATE INDEX "FeeStructureClass_classId_idx" ON "FeeStructureClass"("classId");

-- CreateIndex
CREATE INDEX "FeeStructureClass_feeStructureId_classId_idx" ON "FeeStructureClass"("feeStructureId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructureClass_feeStructureId_classId_key" ON "FeeStructureClass"("feeStructureId", "classId");

-- CreateIndex
CREATE INDEX "FeeTypeClassAmount_feeTypeId_idx" ON "FeeTypeClassAmount"("feeTypeId");

-- CreateIndex
CREATE INDEX "FeeTypeClassAmount_classId_idx" ON "FeeTypeClassAmount"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeTypeClassAmount_feeTypeId_classId_key" ON "FeeTypeClassAmount"("feeTypeId", "classId");

-- AddForeignKey
ALTER TABLE "FeeStructureClass" ADD CONSTRAINT "FeeStructureClass_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureClass" ADD CONSTRAINT "FeeStructureClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeTypeClassAmount" ADD CONSTRAINT "FeeTypeClassAmount_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeTypeClassAmount" ADD CONSTRAINT "FeeTypeClassAmount_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
