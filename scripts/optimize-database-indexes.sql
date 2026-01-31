-- Database Index Optimization for Super Admin SaaS Platform
-- Run this to optimize query performance and reduce N+1 issues

-- 1. Audit Logs Performance Indexes
-- These queries are heavily used in the super admin dashboard

-- Index for audit log filtering by date and action
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_action 
ON "audit_logs" ("createdAt", "action") 
WHERE "createdAt" IS NOT NULL;

-- Index for audit log filtering by school and date
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_date 
ON "audit_logs" ("schoolId", "createdAt") 
WHERE "schoolId" IS NOT NULL AND "createdAt" IS NOT NULL;

-- Index for audit log user lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date 
ON "audit_logs" ("userId", "createdAt") 
WHERE "userId" IS NOT NULL;

-- Composite index for common audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite 
ON "audit_logs" ("createdAt", "action", "schoolId") 
WHERE "createdAt" IS NOT NULL;

-- 2. User Statistics Indexes
-- Used heavily in dashboard analytics

-- Index for user role statistics
CREATE INDEX IF NOT EXISTS idx_users_role_created 
ON "User" ("role", "createdAt");

-- Index for user growth calculations
CREATE INDEX IF NOT EXISTS idx_users_created_at 
ON "User" ("createdAt") 
WHERE "createdAt" IS NOT NULL;

-- Index for user school relationships
CREATE INDEX IF NOT EXISTS idx_users_school_role 
ON "User" ("schoolId", "role") 
WHERE "schoolId" IS NOT NULL;

-- 3. School Statistics Indexes
-- Used in dashboard and school management

-- Index for school status filtering
CREATE INDEX IF NOT EXISTS idx_schools_status_created 
ON "schools" ("status", "createdAt");

-- Index for school plan distribution
CREATE INDEX IF NOT EXISTS idx_schools_plan_status 
ON "schools" ("plan", "status");

-- Index for recent schools
CREATE INDEX IF NOT EXISTS idx_schools_created_at 
ON "schools" ("createdAt") 
WHERE "createdAt" IS NOT NULL;

-- 4. Subscription Analytics Indexes
-- Used in billing and revenue analytics

-- Index for subscription status and dates
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_created 
ON "subscriptions" ("isActive", "createdAt");

-- Index for subscription school relationships
CREATE INDEX IF NOT EXISTS idx_subscriptions_school_active 
ON "subscriptions" ("schoolId", "isActive") 
WHERE "schoolId" IS NOT NULL;

-- Index for subscription date range queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_updated 
ON "subscriptions" ("createdAt", "updatedAt");

-- 5. Authentication Session Indexes
-- Used in auth analytics

-- Index for session date filtering
CREATE INDEX IF NOT EXISTS idx_auth_sessions_created_at 
ON "auth_sessions" ("createdAt") 
WHERE "createdAt" IS NOT NULL;

-- Index for active session lookups
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active 
ON "auth_sessions" ("userId", "expiresAt") 
WHERE "userId" IS NOT NULL;

-- Index for school context sessions
CREATE INDEX IF NOT EXISTS idx_auth_sessions_school_created 
ON "auth_sessions" ("activeSchoolId", "createdAt") 
WHERE "activeSchoolId" IS NOT NULL;

-- 6. Analytics Events Indexes
-- Used in feature usage analytics

-- Index for event type and timestamp
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp 
ON "analytics_events" ("eventType", "timestamp");

-- Index for school-specific analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_school_timestamp 
ON "analytics_events" ("schoolId", "timestamp") 
WHERE "schoolId" IS NOT NULL;

-- Index for user-specific analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp 
ON "analytics_events" ("userId", "timestamp") 
WHERE "userId" IS NOT NULL;

-- 7. Performance Monitoring Indexes
-- For system health monitoring

-- Index for error tracking in audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_errors 
ON "audit_logs" ("action", "createdAt") 
WHERE "action" IN ('ERROR', 'FAILED_LOGIN', 'SECURITY_VIOLATION');

-- Index for user activity monitoring
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_activity 
ON "audit_logs" ("userId", "action", "createdAt") 
WHERE "userId" IS NOT NULL AND "action" IN ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE');

-- 8. Cleanup and Maintenance Indexes
-- For data cleanup operations

-- Index for expired sessions cleanup
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expired 
ON "auth_sessions" ("expiresAt") 
WHERE "expiresAt" < NOW();

-- Index for old audit log cleanup
CREATE INDEX IF NOT EXISTS idx_audit_logs_old 
ON "audit_logs" ("createdAt") 
WHERE "createdAt" < (NOW() - INTERVAL '90 days');

-- 9. Partial Indexes for Common Filters
-- More efficient for specific use cases

-- Index for active schools only
CREATE INDEX IF NOT EXISTS idx_schools_active_only 
ON "schools" ("createdAt", "plan") 
WHERE "status" = 'ACTIVE';

-- Index for active subscriptions only
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_only 
ON "subscriptions" ("createdAt", "schoolId") 
WHERE "isActive" = true;

-- Index for recent activity (last 30 days)
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent 
ON "audit_logs" ("createdAt", "action", "userId") 
WHERE "createdAt" >= (NOW() - INTERVAL '30 days');

-- 10. Analyze Tables for Query Planner
-- Update statistics for better query planning
ANALYZE "audit_logs";
ANALYZE "User";
ANALYZE "schools";
ANALYZE "subscriptions";
ANALYZE "auth_sessions";
ANALYZE "analytics_events";

-- 11. Check Index Usage
-- Run this query to see which indexes are being used
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/

-- 12. Check for Unused Indexes
-- Run this to find indexes that might not be needed
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
    AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
*/

-- 13. Monitor Query Performance
-- Use this to identify slow queries
/*
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%audit_logs%' 
    OR query LIKE '%User%' 
    OR query LIKE '%schools%'
    OR query LIKE '%subscriptions%'
ORDER BY mean_time DESC 
LIMIT 20;
*/