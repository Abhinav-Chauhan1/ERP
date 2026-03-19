-- Migration: Remove schema duplicates
-- Removes legacy fields, duplicate enums, and unused Subscription model

-- 1. Drop legacy Subscription table (replaced by EnhancedSubscription)
DROP TABLE IF EXISTS "subscriptions" CASCADE;

-- 2. Remove legacy User columns
ALTER TABLE "User" DROP COLUMN IF EXISTS "password";
ALTER TABLE "User" DROP COLUMN IF EXISTS "image";
ALTER TABLE "User" DROP COLUMN IF EXISTS "active";
ALTER TABLE "User" DROP COLUMN IF EXISTS "mfaEnabled";
ALTER TABLE "User" DROP COLUMN IF EXISTS "mfaSecret";

-- 3. ComplaintPriority -> TicketPriority for hostel_complaints
ALTER TABLE "hostel_complaints" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "hostel_complaints"
  ALTER COLUMN "priority" TYPE "TicketPriority"
  USING "priority"::text::"TicketPriority";
ALTER TABLE "hostel_complaints" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM'::"TicketPriority";
DROP TYPE IF EXISTS "ComplaintPriority";

-- 4. DifficultyType -> Difficulty for flashcards
ALTER TABLE "flashcards" ALTER COLUMN "difficulty" DROP DEFAULT;
ALTER TABLE "flashcards"
  ALTER COLUMN "difficulty" TYPE "Difficulty"
  USING "difficulty"::text::"Difficulty";
ALTER TABLE "flashcards" ALTER COLUMN "difficulty" SET DEFAULT 'MEDIUM'::"Difficulty";
DROP TYPE IF EXISTS "DifficultyType";

-- 5. ProgressStatus -> LessonProgressStatus for student_content_progress
ALTER TABLE "student_content_progress" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "student_content_progress"
  ALTER COLUMN "status" TYPE "LessonProgressStatus"
  USING "status"::text::"LessonProgressStatus";
ALTER TABLE "student_content_progress" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED'::"LessonProgressStatus";
DROP TYPE IF EXISTS "ProgressStatus";

-- 6. TransportAttendanceStatus -> AttendanceStatus for transport_attendance
ALTER TABLE "transport_attendance" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "transport_attendance"
  ALTER COLUMN "status" TYPE "AttendanceStatus"
  USING "status"::text::"AttendanceStatus";
ALTER TABLE "transport_attendance" ALTER COLUMN "status" SET DEFAULT 'PRESENT'::"AttendanceStatus";
DROP TYPE IF EXISTS "TransportAttendanceStatus";
