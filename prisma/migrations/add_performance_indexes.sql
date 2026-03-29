-- Performance Optimization Indexes
-- Created: 2026-03-29
-- Purpose: Add indexes to improve query performance for attendance, exams, and assignments

-- Student Attendance Indexes
CREATE INDEX IF NOT EXISTS "idx_student_attendance_student_date" 
ON "StudentAttendance"("studentId", "date" DESC);

CREATE INDEX IF NOT EXISTS "idx_student_attendance_school_date" 
ON "StudentAttendance"("schoolId", "date" DESC);

CREATE INDEX IF NOT EXISTS "idx_student_attendance_section_date" 
ON "StudentAttendance"("sectionId", "date" DESC);

CREATE INDEX IF NOT EXISTS "idx_student_attendance_status_date" 
ON "StudentAttendance"("status", "date" DESC);

-- Teacher Attendance Indexes
CREATE INDEX IF NOT EXISTS "idx_teacher_attendance_teacher_date" 
ON "TeacherAttendance"("teacherId", "date" DESC);

CREATE INDEX IF NOT EXISTS "idx_teacher_attendance_school_date" 
ON "TeacherAttendance"("schoolId", "date" DESC);

-- Exam Indexes
CREATE INDEX IF NOT EXISTS "idx_exam_school_date" 
ON "Exam"("schoolId", "examDate" DESC);

CREATE INDEX IF NOT EXISTS "idx_exam_creator_date" 
ON "Exam"("creatorId", "examDate" DESC);

CREATE INDEX IF NOT EXISTS "idx_exam_subject_date" 
ON "Exam"("subjectId", "examDate" DESC);

-- Exam Results Indexes
CREATE INDEX IF NOT EXISTS "idx_exam_result_student_school" 
ON "ExamResult"("studentId", "schoolId");

CREATE INDEX IF NOT EXISTS "idx_exam_result_exam_school" 
ON "ExamResult"("examId", "schoolId");

CREATE INDEX IF NOT EXISTS "idx_exam_result_school_absent" 
ON "ExamResult"("schoolId", "isAbsent");

-- Assignment Indexes
CREATE INDEX IF NOT EXISTS "idx_assignment_creator_due" 
ON "Assignment"("creatorId", "dueDate" DESC);

CREATE INDEX IF NOT EXISTS "idx_assignment_school_due" 
ON "Assignment"("schoolId", "dueDate" DESC);

-- Assignment Submission Indexes
CREATE INDEX IF NOT EXISTS "idx_assignment_submission_student_status" 
ON "AssignmentSubmission"("studentId", "status");

CREATE INDEX IF NOT EXISTS "idx_assignment_submission_assignment_status" 
ON "AssignmentSubmission"("assignmentId", "status");

CREATE INDEX IF NOT EXISTS "idx_assignment_submission_school_status" 
ON "AssignmentSubmission"("schoolId", "status");

-- Announcement Indexes
CREATE INDEX IF NOT EXISTS "idx_announcement_school_active_created" 
ON "Announcement"("schoolId", "isActive", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_announcement_school_dates" 
ON "Announcement"("schoolId", "startDate", "endDate");

-- Fee Payment Indexes
CREATE INDEX IF NOT EXISTS "idx_fee_payment_student_status" 
ON "FeePayment"("studentId", "status");

CREATE INDEX IF NOT EXISTS "idx_fee_payment_school_status" 
ON "FeePayment"("schoolId", "status");

CREATE INDEX IF NOT EXISTS "idx_fee_payment_school_date" 
ON "FeePayment"("schoolId", "paymentDate" DESC);

-- Class Enrollment Indexes
CREATE INDEX IF NOT EXISTS "idx_class_enrollment_student_status" 
ON "ClassEnrollment"("studentId", "status");

CREATE INDEX IF NOT EXISTS "idx_class_enrollment_class_status" 
ON "ClassEnrollment"("classId", "status");

CREATE INDEX IF NOT EXISTS "idx_class_enrollment_school_status" 
ON "ClassEnrollment"("schoolId", "status");

-- Parent Meeting Indexes
CREATE INDEX IF NOT EXISTS "idx_parent_meeting_parent_date" 
ON "ParentMeeting"("parentId", "scheduledDate" DESC);

CREATE INDEX IF NOT EXISTS "idx_parent_meeting_teacher_date" 
ON "ParentMeeting"("teacherId", "scheduledDate" DESC);

CREATE INDEX IF NOT EXISTS "idx_parent_meeting_school_date" 
ON "ParentMeeting"("schoolId", "scheduledDate" DESC);

-- Message Indexes
CREATE INDEX IF NOT EXISTS "idx_message_recipient_read" 
ON "Message"("recipientId", "isRead");

CREATE INDEX IF NOT EXISTS "idx_message_sender_created" 
ON "Message"("senderId", "createdAt" DESC);

-- Event Indexes
CREATE INDEX IF NOT EXISTS "idx_event_school_dates" 
ON "Event"("schoolId", "startDate", "endDate");

CREATE INDEX IF NOT EXISTS "idx_event_school_status" 
ON "Event"("schoolId", "status");

-- Report Card Indexes
CREATE INDEX IF NOT EXISTS "idx_report_card_student_school" 
ON "ReportCard"("studentId", "schoolId");

CREATE INDEX IF NOT EXISTS "idx_report_card_term_school" 
ON "ReportCard"("termId", "schoolId");

-- Timetable Slot Indexes
CREATE INDEX IF NOT EXISTS "idx_timetable_slot_class_day" 
ON "TimetableSlot"("classId", "day");

CREATE INDEX IF NOT EXISTS "idx_timetable_slot_section_day" 
ON "TimetableSlot"("sectionId", "day");

CREATE INDEX IF NOT EXISTS "idx_timetable_slot_teacher_day" 
ON "TimetableSlot"("subjectTeacherId", "day");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_student_school_active" 
ON "Student"("schoolId", "userId") WHERE "User"."isActive" = true;

CREATE INDEX IF NOT EXISTS "idx_teacher_school_active" 
ON "Teacher"("schoolId", "userId") WHERE "User"."isActive" = true;

-- Audit Log Indexes (for security monitoring)
CREATE INDEX IF NOT EXISTS "idx_audit_log_user_created" 
ON "AuditLog"("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_audit_log_school_created" 
ON "AuditLog"("schoolId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_audit_log_action_created" 
ON "AuditLog"("action", "createdAt" DESC);
