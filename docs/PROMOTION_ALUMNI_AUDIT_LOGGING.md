# Promotion and Alumni Audit Logging Implementation

## Overview

This document describes the comprehensive audit logging implementation for the Student Promotion and Alumni Management feature. All critical operations are logged to the `AuditLog` table for compliance, security, and troubleshooting purposes.

**Requirements:** 14.4, 5.6

## Audit Logging Architecture

### Core Components

1. **Audit Log Utility** (`src/lib/utils/audit-log.ts`)
   - Centralized logging service
   - Automatic IP address and user agent capture
   - Consistent error handling
   - Non-blocking operation (failures don't break main flow)

2. **Database Model** (`prisma/schema.prisma`)
   - `AuditLog` model with indexed fields
   - `AuditAction` enum for standardized actions
   - JSON storage for flexible change tracking

### Audit Log Structure

```typescript
{
  id: string;           // Unique identifier
  userId: string;       // User who performed the action
  action: AuditAction;  // Type of action (CREATE, UPDATE, DELETE, VIEW, EXPORT)
  resource: string;     // Resource type (PROMOTION, ALUMNI, etc.)
  resourceId?: string;  // Specific resource identifier
  changes?: Json;       // Detailed change information
  ipAddress?: string;   // Request IP address
  userAgent?: string;   // Request user agent
  timestamp: DateTime;  // When the action occurred
}
```

## Promotion Operations Audit Logging

### 1. Bulk Promotion Execution

**Action:** `AuditAction.CREATE`  
**Resource:** `PROMOTION`  
**Resource ID:** Promotion History ID

**Logged Information:**
- Operation type: "BULK_PROMOTION"
- Source class, section, and academic year
- Target class, section, and academic year
- Total students selected
- Number of students promoted
- Number of students excluded
- Number of failed promotions
- Roll number strategy used
- Whether notifications were enabled

**Example:**
```typescript
await logAudit({
  userId: "user-123",
  action: AuditAction.CREATE,
  resource: "PROMOTION",
  resourceId: "promo-hist-456",
  changes: {
    operation: "BULK_PROMOTION",
    sourceClass: "Grade 10",
    sourceSection: "A",
    sourceAcademicYear: "2023-2024",
    targetClass: "Grade 11",
    targetSection: "A",
    targetAcademicYear: "2024-2025",
    totalStudents: 50,
    promoted: 48,
    excluded: 2,
    failed: 0,
    rollNumberStrategy: "auto",
    notificationsEnabled: true,
  },
});
```

### 2. Promotion Rollback

**Action:** `AuditAction.DELETE`  
**Resource:** `PROMOTION`  
**Resource ID:** Promotion History ID

**Logged Information:**
- Operation type: "PROMOTION_ROLLBACK"
- Rollback reason
- Number of students affected
- Source and target class information
- Original execution timestamp

**Example:**
```typescript
await logAudit({
  userId: "admin-789",
  action: AuditAction.DELETE,
  resource: "PROMOTION",
  resourceId: "promo-hist-456",
  changes: {
    operation: "PROMOTION_ROLLBACK",
    reason: "Incorrect target class selected",
    studentsAffected: 48,
    sourceClass: "Grade 10",
    targetClass: "Grade 11",
    executedAt: "2024-01-15T10:30:00Z",
  },
});
```

### 3. View Promotion History

**Action:** `AuditAction.VIEW`  
**Resource:** `PROMOTION_HISTORY`

**Logged Information:**
- Operation type: "VIEW_PROMOTION_HISTORY"
- Applied filters (academic year, class, date range)
- Number of results returned

**Example:**
```typescript
await logAudit({
  userId: "admin-789",
  action: AuditAction.VIEW,
  resource: "PROMOTION_HISTORY",
  changes: {
    operation: "VIEW_PROMOTION_HISTORY",
    filters: {
      academicYear: "2023-2024",
      classId: "class-123",
      startDate: "2024-01-01T00:00:00Z",
      endDate: "2024-12-31T23:59:59Z",
    },
    resultCount: 15,
  },
});
```

### 4. View Promotion Details

**Action:** `AuditAction.VIEW`  
**Resource:** `PROMOTION_HISTORY`  
**Resource ID:** Promotion History ID

**Logged Information:**
- Operation type: "VIEW_PROMOTION_DETAILS"
- Number of students in the promotion

**Example:**
```typescript
await logAudit({
  userId: "admin-789",
  action: AuditAction.VIEW,
  resource: "PROMOTION_HISTORY",
  resourceId: "promo-hist-456",
  changes: {
    operation: "VIEW_PROMOTION_DETAILS",
    studentCount: 48,
  },
});
```

## Alumni Operations Audit Logging

### 1. Alumni Profile Update

**Action:** `AuditAction.UPDATE`  
**Resource:** `ALUMNI`  
**Resource ID:** Alumni ID

**Logged Information:**
- Operation type: "PROFILE_UPDATE"
- List of updated fields
- Before and after values for key fields

**Example:**
```typescript
await logAudit({
  userId: "admin-789",
  action: AuditAction.UPDATE,
  resource: "ALUMNI",
  resourceId: "alumni-123",
  changes: {
    operation: "PROFILE_UPDATE",
    updatedFields: ["currentOccupation", "currentEmployer", "currentCity"],
    before: {
      currentOccupation: "Student",
      currentEmployer: null,
      currentCity: "Mumbai",
      collegeName: null,
    },
    after: {
      currentOccupation: "Software Engineer",
      currentEmployer: "Tech Corp",
      currentCity: "Bangalore",
      collegeName: "IIT Bombay",
    },
  },
});
```

### 2. Alumni Search

**Action:** `AuditAction.VIEW`  
**Resource:** `ALUMNI`

**Logged Information:**
- Operation type: "SEARCH_ALUMNI"
- Search filters applied
- Number of results returned

**Example:**
```typescript
await logAudit({
  userId: "teacher-456",
  action: AuditAction.VIEW,
  resource: "ALUMNI",
  changes: {
    operation: "SEARCH_ALUMNI",
    filters: {
      searchTerm: "John",
      graduationYearFrom: 2020,
      graduationYearTo: 2023,
      finalClass: "Grade 12",
      currentCity: "Mumbai",
    },
    resultCount: 12,
  },
});
```

### 3. View Alumni Profile

**Action:** `AuditAction.VIEW`  
**Resource:** `ALUMNI`  
**Resource ID:** Alumni ID

**Logged Information:**
- Operation type: "VIEW_ALUMNI_PROFILE"

**Example:**
```typescript
await logAudit({
  userId: "teacher-456",
  action: AuditAction.VIEW,
  resource: "ALUMNI",
  resourceId: "alumni-123",
  changes: {
    operation: "VIEW_ALUMNI_PROFILE",
  },
});
```

### 4. Alumni Report Generation

**Action:** `AuditAction.EXPORT`  
**Resource:** `ALUMNI`

**Logged Information:**
- Operation type: "REPORT_GENERATION"
- Export format (PDF/Excel)
- Applied filters
- Number of records in report

**Example:**
```typescript
await logAudit({
  userId: "admin-789",
  action: AuditAction.EXPORT,
  resource: "ALUMNI",
  changes: {
    operation: "REPORT_GENERATION",
    format: "pdf",
    filters: {
      graduationYearFrom: 2020,
      graduationYearTo: 2023,
      finalClass: "Grade 12",
    },
    recordCount: 150,
  },
});
```

## Communication Operations Audit Logging

### Alumni Bulk Communication

**Action:** `AuditAction.CREATE`  
**Resource:** `ALUMNI_COMMUNICATION`

**Logged Information:**
- Operation type: "BULK_COMMUNICATION"
- Message subject
- Total recipients selected
- Eligible recipients (opted in)
- Success and failure counts
- Communication channels used

**Example:**
```typescript
await logAudit({
  userId: "admin-789",
  action: AuditAction.CREATE,
  resource: "ALUMNI_COMMUNICATION",
  changes: {
    operation: "BULK_COMMUNICATION",
    subject: "Annual Alumni Meet 2024",
    totalRecipients: 100,
    eligibleRecipients: 85,
    successCount: 82,
    failureCount: 3,
    channels: ["email", "whatsapp"],
  },
});
```

## Querying Audit Logs

### Using the Audit Log Utility

```typescript
import { queryAuditLogs } from "@/lib/utils/audit-log";

// Query promotion operations by a specific user
const promotionLogs = await queryAuditLogs({
  userId: "admin-789",
  resource: "PROMOTION",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  limit: 50,
  offset: 0,
});

// Query all alumni profile updates
const alumniUpdateLogs = await queryAuditLogs({
  resource: "ALUMNI",
  action: AuditAction.UPDATE,
  limit: 100,
});

// Query specific promotion history views
const historyViewLogs = await queryAuditLogs({
  resource: "PROMOTION_HISTORY",
  action: AuditAction.VIEW,
  resourceId: "promo-hist-456",
});
```

### Database Queries

```sql
-- Get all promotion operations in the last 30 days
SELECT * FROM audit_logs
WHERE resource = 'PROMOTION'
  AND timestamp >= NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC;

-- Get all alumni profile updates by a specific admin
SELECT * FROM audit_logs
WHERE resource = 'ALUMNI'
  AND action = 'UPDATE'
  AND "userId" = 'admin-789'
ORDER BY timestamp DESC;

-- Get communication operations with failure counts
SELECT 
  "userId",
  changes->>'operation' as operation,
  changes->>'totalRecipients' as total_recipients,
  changes->>'successCount' as success_count,
  changes->>'failureCount' as failure_count,
  timestamp
FROM audit_logs
WHERE resource = 'ALUMNI_COMMUNICATION'
ORDER BY timestamp DESC;
```

## Audit Log Statistics

### Get Audit Statistics

```typescript
import { getAuditStats } from "@/lib/utils/audit-log";

// Get overall statistics
const stats = await getAuditStats();

// Get statistics for a specific user
const userStats = await getAuditStats("admin-789");

// Get statistics for a date range
const rangeStats = await getAuditStats(
  undefined,
  new Date("2024-01-01"),
  new Date("2024-12-31")
);
```

## Security and Compliance

### Data Retention

- Audit logs are retained indefinitely by default
- Use `deleteOldAuditLogs()` function for cleanup if needed
- Consider archiving old logs to separate storage

### Access Control

- Only ADMIN users can perform promotion and alumni management operations
- TEACHER users can view alumni information (logged as VIEW actions)
- All access attempts are logged, including unauthorized attempts

### Privacy Considerations

- Sensitive data (passwords, tokens) is never logged
- Personal information in changes is limited to necessary fields
- IP addresses and user agents are captured for security

### Compliance Features

- Complete audit trail for all operations
- Immutable log records (no updates, only creates)
- Timestamp precision for chronological ordering
- User attribution for accountability

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Failed Promotions**
   - Track promotions with high failure rates
   - Alert on repeated failures

2. **Unauthorized Access Attempts**
   - Monitor VIEW actions by non-authorized users
   - Alert on suspicious patterns

3. **Bulk Operations**
   - Track large-scale promotions
   - Monitor communication delivery rates

4. **Profile Updates**
   - Track frequency of alumni profile changes
   - Identify unusual update patterns

### Example Monitoring Queries

```sql
-- Promotions with high failure rates
SELECT 
  "resourceId",
  changes->>'sourceClass' as source_class,
  changes->>'targetClass' as target_class,
  (changes->>'failed')::int as failed_count,
  (changes->>'promoted')::int as promoted_count,
  timestamp
FROM audit_logs
WHERE resource = 'PROMOTION'
  AND action = 'CREATE'
  AND (changes->>'failed')::int > 5
ORDER BY timestamp DESC;

-- Communication operations with low success rates
SELECT 
  changes->>'subject' as subject,
  (changes->>'successCount')::int as success_count,
  (changes->>'failureCount')::int as failure_count,
  timestamp
FROM audit_logs
WHERE resource = 'ALUMNI_COMMUNICATION'
  AND (changes->>'failureCount')::int > (changes->>'successCount')::int * 0.1
ORDER BY timestamp DESC;
```

## Best Practices

1. **Always Log Critical Operations**
   - All CREATE, UPDATE, DELETE operations
   - Bulk operations affecting multiple records
   - Export and communication operations

2. **Include Sufficient Context**
   - Operation type for clarity
   - Before/after values for updates
   - Filter criteria for searches
   - Result counts for queries

3. **Handle Logging Failures Gracefully**
   - Log errors but don't fail the main operation
   - Use try-catch blocks around logging calls
   - Monitor logging failures separately

4. **Regular Audit Reviews**
   - Review logs periodically for anomalies
   - Generate compliance reports
   - Archive old logs as needed

5. **Performance Considerations**
   - Logging is non-blocking
   - Database indexes optimize queries
   - Consider async logging for high-volume operations

## Troubleshooting

### Common Issues

1. **Missing Audit Logs**
   - Check if logging failed silently (check console errors)
   - Verify user authentication is working
   - Ensure database connection is stable

2. **Incomplete Change Information**
   - Verify all required fields are passed to logAudit()
   - Check JSON serialization of complex objects
   - Review error logs for parsing failures

3. **Performance Issues**
   - Ensure database indexes are present
   - Consider pagination for large queries
   - Archive old logs if table is very large

## Related Documentation

- [Audit Logging Service](../src/lib/utils/audit-log.ts)
- [Promotion Actions](../src/lib/actions/promotionActions.ts)
- [Alumni Actions](../src/lib/actions/alumniActions.ts)
- [Permission System](./PERMISSION_SYSTEM.md)
- [Security Implementation](./SECURITY_IMPLEMENTATION.md)
