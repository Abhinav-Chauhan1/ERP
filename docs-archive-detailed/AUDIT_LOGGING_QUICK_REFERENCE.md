# Audit Logging Quick Reference

## Quick Start

### Import the Utility
```typescript
import { logAudit } from "@/lib/utils/audit-log";
import { AuditAction } from "@prisma/client";
```

### Basic Usage
```typescript
await logAudit({
  userId: "user-123",
  action: AuditAction.CREATE,
  resource: "RESOURCE_NAME",
  resourceId: "resource-456",
  changes: {
    operation: "OPERATION_NAME",
    // ... additional details
  },
});
```

## Common Patterns

### CREATE Operation
```typescript
await logAudit({
  userId: authCheck.userId!,
  action: AuditAction.CREATE,
  resource: "PROMOTION",
  resourceId: historyId,
  changes: {
    operation: "BULK_PROMOTION",
    totalStudents: 50,
    promoted: 48,
  },
});
```

### UPDATE Operation
```typescript
await logAudit({
  userId: authCheck.userId!,
  action: AuditAction.UPDATE,
  resource: "ALUMNI",
  resourceId: alumniId,
  changes: {
    operation: "PROFILE_UPDATE",
    before: { field: "old value" },
    after: { field: "new value" },
  },
});
```

### DELETE Operation
```typescript
await logAudit({
  userId: authCheck.userId!,
  action: AuditAction.DELETE,
  resource: "PROMOTION",
  resourceId: historyId,
  changes: {
    operation: "PROMOTION_ROLLBACK",
    reason: "User requested",
  },
});
```

### VIEW Operation
```typescript
await logAudit({
  userId: authCheck.userId!,
  action: AuditAction.VIEW,
  resource: "ALUMNI",
  resourceId: alumniId,
  changes: {
    operation: "VIEW_ALUMNI_PROFILE",
  },
});
```

### EXPORT Operation
```typescript
await logAudit({
  userId: authCheck.userId!,
  action: AuditAction.EXPORT,
  resource: "ALUMNI",
  changes: {
    operation: "REPORT_GENERATION",
    format: "pdf",
    recordCount: 150,
  },
});
```

## Query Audit Logs

### Basic Query
```typescript
import { queryAuditLogs } from "@/lib/utils/audit-log";

const logs = await queryAuditLogs({
  resource: "PROMOTION",
  limit: 50,
});
```

### Filter by User
```typescript
const userLogs = await queryAuditLogs({
  userId: "admin-123",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
});
```

### Filter by Action
```typescript
const createLogs = await queryAuditLogs({
  action: AuditAction.CREATE,
  resource: "PROMOTION",
});
```

### Filter by Resource ID
```typescript
const resourceLogs = await queryAuditLogs({
  resource: "ALUMNI",
  resourceId: "alumni-456",
});
```

## Get Statistics

```typescript
import { getAuditStats } from "@/lib/utils/audit-log";

// Overall stats
const stats = await getAuditStats();

// User-specific stats
const userStats = await getAuditStats("admin-123");

// Date range stats
const rangeStats = await getAuditStats(
  undefined,
  new Date("2024-01-01"),
  new Date("2024-12-31")
);
```

## Resource Names

| Resource | Description |
|----------|-------------|
| `PROMOTION` | Student promotion operations |
| `PROMOTION_HISTORY` | Viewing promotion history |
| `ALUMNI` | Alumni profile operations |
| `ALUMNI_COMMUNICATION` | Alumni messaging operations |

## Action Types

| Action | Use Case |
|--------|----------|
| `CREATE` | Creating new records, bulk operations |
| `UPDATE` | Modifying existing records |
| `DELETE` | Deleting records, rollbacks |
| `VIEW` | Viewing records, searches |
| `EXPORT` | Generating reports, exports |

## Best Practices

### ✅ DO
- Always include `userId`
- Use appropriate `AuditAction` enum values
- Include operation type in `changes`
- Add relevant context in `changes`
- Use `resourceId` for specific records
- Log all critical operations

### ❌ DON'T
- Don't log sensitive data (passwords, tokens)
- Don't throw errors if logging fails
- Don't use custom action strings
- Don't skip user attribution
- Don't log excessive detail

## Error Handling

```typescript
// Logging is non-blocking - failures are logged but don't throw
try {
  await logAudit({
    userId: "user-123",
    action: AuditAction.CREATE,
    resource: "PROMOTION",
    changes: { operation: "TEST" },
  });
} catch (error) {
  // This will never throw - errors are caught internally
  console.error("This won't happen");
}
```

## SQL Queries

### Recent Promotions
```sql
SELECT * FROM audit_logs
WHERE resource = 'PROMOTION'
  AND action = 'CREATE'
ORDER BY timestamp DESC
LIMIT 50;
```

### Failed Operations
```sql
SELECT * FROM audit_logs
WHERE changes->>'failed' IS NOT NULL
  AND (changes->>'failed')::int > 0
ORDER BY timestamp DESC;
```

### User Activity
```sql
SELECT 
  action,
  resource,
  COUNT(*) as count
FROM audit_logs
WHERE "userId" = 'admin-123'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY action, resource
ORDER BY count DESC;
```

### Communication Stats
```sql
SELECT 
  changes->>'subject' as subject,
  (changes->>'successCount')::int as success,
  (changes->>'failureCount')::int as failure,
  timestamp
FROM audit_logs
WHERE resource = 'ALUMNI_COMMUNICATION'
ORDER BY timestamp DESC;
```

## Monitoring Queries

### High Failure Rate
```sql
SELECT 
  "resourceId",
  changes->>'operation' as operation,
  (changes->>'failed')::int as failed,
  (changes->>'promoted')::int as promoted,
  timestamp
FROM audit_logs
WHERE resource = 'PROMOTION'
  AND (changes->>'failed')::int > 5
ORDER BY timestamp DESC;
```

### Frequent Updates
```sql
SELECT 
  "resourceId",
  COUNT(*) as update_count,
  MAX(timestamp) as last_update
FROM audit_logs
WHERE resource = 'ALUMNI'
  AND action = 'UPDATE'
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY "resourceId"
HAVING COUNT(*) > 5
ORDER BY update_count DESC;
```

## Related Documentation

- [Full Documentation](./PROMOTION_ALUMNI_AUDIT_LOGGING.md)
- [Audit Log Utility](../src/lib/utils/audit-log.ts)
- [Promotion Actions](../src/lib/actions/promotionActions.ts)
- [Alumni Actions](../src/lib/actions/alumniActions.ts)
