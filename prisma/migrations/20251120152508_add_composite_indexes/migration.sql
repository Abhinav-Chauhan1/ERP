-- DropIndex
DROP INDEX "ExamResult_examId_idx";

-- DropIndex
DROP INDEX "FeePayment_studentId_status_idx";

-- DropIndex
DROP INDEX "StudentAttendance_sectionId_date_idx";

-- CreateIndex
CREATE INDEX "ExamResult_examId_marks_idx" ON "ExamResult"("examId", "marks");

-- CreateIndex
CREATE INDEX "ExamResult_studentId_createdAt_idx" ON "ExamResult"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "FeePayment_studentId_status_paymentDate_idx" ON "FeePayment"("studentId", "status", "paymentDate");

-- CreateIndex
CREATE INDEX "StudentAttendance_sectionId_date_status_idx" ON "StudentAttendance"("sectionId", "date", "status");
