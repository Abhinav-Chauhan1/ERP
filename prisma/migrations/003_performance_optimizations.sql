-- Performance Optimization Migration
-- Adds indexes for frequently queried fields in the schools management system

-- School-related indexes
CREATE INDEX IF NOT EXISTS idx_school_status ON "School"("status");
CREATE INDEX IF NOT EXISTS idx_school_plan ON "School"("plan");
CREATE INDEX IF NOT EXISTS idx_school_subdomain ON "School"("subdomain");
CREATE INDEX IF NOT EXISTS idx_school_created_at ON "School"("createdAt");

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"("role");
CREATE INDEX IF NOT EXISTS idx_user_active ON "User"("active");
CREATE INDEX IF NOT EXISTS idx_user_mobile ON "User"("mobile");
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"("email");

-- Student-related indexes
CREATE INDEX IF NOT EXISTS idx_student_school_id ON "Student"("schoolId");
CREATE INDEX IF NOT EXISTS idx_student_class_id ON "Student"("classId");
CREATE INDEX IF NOT EXISTS idx_student_admission_number ON "Student"("admissionNumber");

-- Teacher-related indexes
CREATE INDEX IF NOT EXISTS idx_teacher_school_id ON "Teacher"("schoolId");
CREATE INDEX IF NOT EXISTS idx_teacher_employee_id ON "Teacher"("employeeId");

-- Parent-related indexes
CREATE INDEX IF NOT EXISTS idx_parent_school_id ON "Parent"("schoolId");

-- Administrator-related indexes
CREATE INDEX IF NOT EXISTS idx_administrator_school_id ON "Administrator"("schoolId");

-- Class-related indexes
CREATE INDEX IF NOT EXISTS idx_class_school_id ON "Class"("schoolId");
CREATE INDEX IF NOT EXISTS idx_class_academic_year_id ON "Class"("academicYearId");

-- Subject-related indexes
CREATE INDEX IF NOT EXISTS idx_subject_school_id ON "Subject"("schoolId");

-- Message-related indexes
CREATE INDEX IF NOT EXISTS idx_message_school_id ON "Message"("schoolId");
CREATE INDEX IF NOT EXISTS idx_message_sender_id ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS idx_message_recipient_id ON "Message"("recipientId");
CREATE INDEX IF NOT EXISTS idx_message_created_at ON "Message"("createdAt");

-- Notification-related indexes
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS idx_notification_read ON "Notification"("read");
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON "Notification"("createdAt");

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON "AuditLog"("resource");
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON "AuditLog"("createdAt");

-- Backup-related indexes (already exist in schema but ensuring they're created)
CREATE INDEX IF NOT EXISTS idx_backup_school_id ON "Backup"("schoolId");
CREATE INDEX IF NOT EXISTS idx_backup_status ON "Backup"("status");
CREATE INDEX IF NOT EXISTS idx_backup_type ON "Backup"("type");
CREATE INDEX IF NOT EXISTS idx_backup_created_at ON "Backup"("createdAt");

-- Settings tables indexes
CREATE INDEX IF NOT EXISTS idx_school_permissions_school_id ON "SchoolPermissions"("schoolId");
CREATE INDEX IF NOT EXISTS idx_school_security_settings_school_id ON "SchoolSecuritySettings"("schoolId");
CREATE INDEX IF NOT EXISTS idx_school_data_management_settings_school_id ON "SchoolDataManagementSettings"("schoolId");
CREATE INDEX IF NOT EXISTS idx_school_notification_settings_school_id ON "SchoolNotificationSettings"("schoolId");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_school_role ON "UserSchool"("schoolId", "userId");
CREATE INDEX IF NOT EXISTS idx_student_school_class ON "Student"("schoolId", "classId");
CREATE INDEX IF NOT EXISTS idx_message_school_sender ON "Message"("schoolId", "senderId");
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_action ON "AuditLog"("resource", "action");

-- Performance optimization for count queries
CREATE INDEX IF NOT EXISTS idx_student_count_by_school ON "Student"("schoolId") WHERE "active" = true;
CREATE INDEX IF NOT EXISTS idx_teacher_count_by_school ON "Teacher"("schoolId") WHERE "active" = true;
CREATE INDEX IF NOT EXISTS idx_parent_count_by_school ON "Parent"("schoolId") WHERE "active" = true;

-- Partial indexes for active records only
CREATE INDEX IF NOT EXISTS idx_active_users ON "User"("id") WHERE "active" = true;
CREATE INDEX IF NOT EXISTS idx_active_schools ON "School"("id") WHERE "status" = 'ACTIVE';

-- Text search indexes for common search fields
CREATE INDEX IF NOT EXISTS idx_school_name_search ON "School" USING gin(to_tsvector('english', "name"));
CREATE INDEX IF NOT EXISTS idx_user_name_search ON "User" USING gin(to_tsvector('english', "name"));

-- Analyze tables to update statistics
ANALYZE "School";
ANALYZE "User";
ANALYZE "Student";
ANALYZE "Teacher";
ANALYZE "Parent";
ANALYZE "Administrator";
ANALYZE "Class";
ANALYZE "Subject";
ANALYZE "Message";
ANALYZE "Notification";
ANALYZE "AuditLog";
ANALYZE "Backup";
ANALYZE "SchoolPermissions";
ANALYZE "SchoolSecuritySettings";
ANALYZE "SchoolDataManagementSettings";
ANALYZE "SchoolNotificationSettings";