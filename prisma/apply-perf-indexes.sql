-- Performance indexes — safe to re-run (IF NOT EXISTS)
-- Run this in the Neon SQL editor or via: psql $DATABASE_URL -f prisma/apply-perf-indexes.sql

CREATE INDEX IF NOT EXISTS "ClassEnrollment_schoolId_status_idx"
  ON "ClassEnrollment"("schoolId", "status");

CREATE INDEX IF NOT EXISTS "ClassEnrollment_classId_sectionId_status_idx"
  ON "ClassEnrollment"("classId", "sectionId", "status");

CREATE INDEX IF NOT EXISTS "Exam_schoolId_classId_termId_idx"
  ON "Exam"("schoolId", "classId", "termId");

CREATE INDEX IF NOT EXISTS "ExamResult_schoolId_studentId_idx"
  ON "ExamResult"("schoolId", "studentId");

CREATE INDEX IF NOT EXISTS "ExamResult_schoolId_examId_idx"
  ON "ExamResult"("schoolId", "examId");

CREATE INDEX IF NOT EXISTS "StudentAttendance_schoolId_studentId_date_idx"
  ON "StudentAttendance"("schoolId", "studentId", "date");

CREATE INDEX IF NOT EXISTS "FeePayment_schoolId_status_paymentDate_idx"
  ON "FeePayment"("schoolId", "status", "paymentDate");

CREATE INDEX IF NOT EXISTS "Message_schoolId_recipientId_isRead_idx"
  ON "Message"("schoolId", "recipientId", "isRead");

CREATE INDEX IF NOT EXISTS "Event_schoolId_startDate_endDate_idx"
  ON "Event"("schoolId", "startDate", "endDate");

CREATE INDEX IF NOT EXISTS "Notification_userId_schoolId_createdAt_idx"
  ON "Notification"("userId", "schoolId", "createdAt");

CREATE INDEX IF NOT EXISTS "payment_receipts_schoolId_status_idx"
  ON "payment_receipts"("schoolId", "status");

CREATE INDEX IF NOT EXISTS "payment_receipts_schoolId_status_verifiedAt_idx"
  ON "payment_receipts"("schoolId", "status", "verifiedAt");
