-- Performance indexes to fix N+1 queries and improve query performance
-- Run this script to add missing indexes

-- Index for scheduled reports polling (already exists but verify)
CREATE INDEX IF NOT EXISTS "scheduled_reports_active_nextRunAt_idx" 
ON "scheduled_reports"("active", "nextRunAt");

-- Index for audit logs by timestamp and action (for analytics)
CREATE INDEX IF NOT EXISTS "audit_logs_timestamp_action_idx" 
ON "audit_logs"("timestamp", "action");

-- Index for audit logs by created date and resource (for recent activity)
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_resource_idx" 
ON "audit_logs"("createdAt", "resource");

-- Index for schools by status and created date (for dashboard stats)
CREATE INDEX IF NOT EXISTS "schools_status_createdAt_idx" 
ON "schools"("status", "createdAt");

-- Index for subscriptions by active status and school (for billing queries)
CREATE INDEX IF NOT EXISTS "subscriptions_isActive_schoolId_idx" 
ON "subscriptions"("isActive", "schoolId");

-- Index for users by role and created date (for user analytics)
CREATE INDEX IF NOT EXISTS "users_role_createdAt_idx" 
ON "User"("role", "createdAt");

-- Index for auth sessions by expires and last access (for cleanup)
CREATE INDEX IF NOT EXISTS "auth_sessions_expiresAt_lastAccessAt_idx" 
ON "auth_sessions"("expiresAt", "lastAccessAt");

-- Composite index for school filtering
CREATE INDEX IF NOT EXISTS "schools_status_plan_onboarded_idx" 
ON "schools"("status", "plan", "isOnboarded");

-- Index for administrators by school (for user counts)
CREATE INDEX IF NOT EXISTS "administrators_schoolId_createdAt_idx" 
ON "Administrator"("schoolId", "createdAt");

-- Index for teachers by school (for user counts)  
CREATE INDEX IF NOT EXISTS "teachers_schoolId_createdAt_idx" 
ON "Teacher"("schoolId", "createdAt");

-- Index for students by school (for user counts)
CREATE INDEX IF NOT EXISTS "students_schoolId_createdAt_idx" 
ON "Student"("schoolId", "createdAt");

-- Analyze tables to update statistics
ANALYZE "scheduled_reports";
ANALYZE "audit_logs"; 
ANALYZE "schools";
ANALYZE "subscriptions";
ANALYZE "User";
ANALYZE "auth_sessions";
ANALYZE "Administrator";
ANALYZE "Teacher";
ANALYZE "Student";