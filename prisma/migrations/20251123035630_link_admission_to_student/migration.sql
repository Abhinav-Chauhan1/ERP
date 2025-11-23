/*
  Warnings:

  - A unique constraint covering the columns `[studentId]` on the table `AdmissionApplication` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AdmissionApplication" ADD COLUMN     "studentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionApplication_studentId_key" ON "AdmissionApplication"("studentId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_studentId_idx" ON "AdmissionApplication"("studentId");

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
