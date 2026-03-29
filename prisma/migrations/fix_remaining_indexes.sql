-- Fix remaining indexes that had errors
-- Created: 2026-03-29

-- Note: The WHERE clause with JOIN is not supported in PostgreSQL partial indexes
-- We'll create these as regular indexes instead

-- Student and Teacher indexes (without WHERE clause)
CREATE INDEX IF NOT EXISTS "idx_student_school_user" 
ON "Student"("schoolId", "userId");

CREATE INDEX IF NOT EXISTS "idx_teacher_school_user" 
ON "Teacher"("schoolId", "userId");

-- Check if AuditLog table exists before creating indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'AuditLog') THEN
        -- Audit Log Indexes (for security monitoring)
        CREATE INDEX IF NOT EXISTS "idx_audit_log_user_created" 
        ON "AuditLog"("userId", "createdAt" DESC);

        CREATE INDEX IF NOT EXISTS "idx_audit_log_school_created" 
        ON "AuditLog"("schoolId", "createdAt" DESC);

        CREATE INDEX IF NOT EXISTS "idx_audit_log_action_created" 
        ON "AuditLog"("action", "createdAt" DESC);
        
        RAISE NOTICE 'AuditLog indexes created successfully';
    ELSE
        RAISE NOTICE 'AuditLog table does not exist, skipping audit log indexes';
    END IF;
END $$;
