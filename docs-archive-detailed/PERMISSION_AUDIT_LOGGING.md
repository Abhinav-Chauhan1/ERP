# Permission Audit Logging Implementation

## Overview

This document describes the implementation of comprehensive permission audit logging for the ERP system. The system logs all permission checks and denials to provide security monitoring, compliance tracking, and access control auditing.

**Validates:** Requirements 20.4 - "WHEN auditing access THEN the ERP System SHALL log all permission checks and denials"

## Features

### 1. Automatic Audit Logging

All permission checks are automatically logged with the following information:
- User ID and details
- Resource being accessed
- Action being performed
- Whether permission was granted or denied
- IP address of the request
- User agent (browser/client information)
- Timestamp
- Additional metadata (grant type, reason for denial, etc.)

### 2. Permission Check Logging

Every call to `hasPermission()` creates an audit log entry:
- **Granted permissions**: Logged with grant type (role-based or user-specific)
- **Denied permissions**: Logged with reason for denial

### 3. Audit Log Storage

Audit logs are stored in the `AuditLog` table with the following structure:
```prisma
model AuditLog {
  id         String      @id @default(cuid())
  userId     String
  user       User        @relation(fields: [userId], references: [id])
  action     AuditAction
  resource   String
  resourceId String?
  changes    Json?
  ipAddress  String
  userAgent  String
  timestamp  DateTime    @default(now())
}
```

### 4. Audit Log Types

- **PERMISSION_CHECK**: Successful permission grants
- **PERMISSION_DENIED**: Permission denials

## Usage

### Basic Permission Check with Audit Logging

```typescript
import { hasPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

// Check permission with audit context
const canCreateUser = await hasPermission(
  userId,
  'USER',
  PermissionAction.CREATE,
  {
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    metadata: {
      source: 'api',
      endpoint: '/api/users/create',
    },
  }
);
```

### Retrieving Audit Logs

#### Get User's Permission Audit Logs

```typescript
import { getPermissionAuditLogs } from '@/lib/services/permission-audit';

const logs = await getPermissionAuditLogs(userId, 100);
```

#### Get Resource Permission Audit Logs

```typescript
import { getResourcePermissionAuditLogs } from '@/lib/services/permission-audit';

const logs = await getResourcePermissionAuditLogs('USER', 100);
```

#### Get Permission Denial Statistics

```typescript
import { getPermissionDenialStats } from '@/lib/services/permission-audit';

const stats = await getPermissionDenialStats(startDate, endDate);
```

### API Endpoints

#### GET /api/permissions/audit-logs

Retrieve permission audit logs with optional filters.

**Query Parameters:**
- `userId`: Filter by user ID
- `resource`: Filter by resource
- `limit`: Maximum number of logs (default: 100)
- `stats`: If 'true', return denial statistics

**Example:**
```bash
# Get logs for a specific user
GET /api/permissions/audit-logs?userId=user_123&limit=50

# Get logs for a specific resource
GET /api/permissions/audit-logs?resource=USER&limit=50

# Get denial statistics
GET /api/permissions/audit-logs?stats=true
```

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "log_123",
      "userId": "user_123",
      "action": "READ",
      "resource": "PERMISSION_CHECK",
      "resourceId": "USER:CREATE",
      "changes": {
        "resource": "USER",
        "action": "CREATE",
        "granted": true,
        "grantType": "role-based",
        "role": "ADMIN"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2024-01-01T12:00:00Z",
      "user": {
        "id": "user_123",
        "email": "admin@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "ADMIN"
      }
    }
  ],
  "count": 1
}
```

## UI Components

### Permission Audit Logs Component

Display permission audit logs in the admin interface:

```tsx
import { PermissionAuditLogs } from '@/components/admin/permissions/permission-audit-logs';

// Display all logs
<PermissionAuditLogs />

// Display logs for a specific user
<PermissionAuditLogs userId="user_123" />

// Display logs for a specific resource
<PermissionAuditLogs resource="USER" />
```

### Permission Denial Statistics Component

Display aggregated denial statistics:

```tsx
import { PermissionDenialStats } from '@/components/admin/permissions/permission-audit-logs';

<PermissionDenialStats />
```

## Security Considerations

1. **Access Control**: Only users with `READ` permission on `AUDIT_LOG` resource can view audit logs
2. **Data Privacy**: Audit logs contain sensitive information and should be protected
3. **Retention**: Consider implementing log retention policies to manage database size
4. **Performance**: Audit logging is non-blocking and won't affect permission check performance

## Audit Log Information

Each audit log entry includes:

### For Granted Permissions
- User information (ID, email, name, role)
- Resource and action
- Grant type (role-based or user-specific)
- IP address and user agent
- Timestamp
- Additional metadata

### For Denied Permissions
- User information (ID, email, name, role)
- Resource and action
- Reason for denial:
  - "User not found"
  - "Permission not found or inactive"
  - "No role-based or user-specific permission found"
  - "Error during permission check"
- IP address and user agent
- Timestamp
- Additional metadata

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Denial Rate**: High denial rates may indicate:
   - Misconfigured permissions
   - Unauthorized access attempts
   - User training needs

2. **Denial Patterns**: Look for:
   - Repeated denials from same user
   - Denials for sensitive resources
   - Unusual access patterns

3. **Denial by Resource**: Identify:
   - Most frequently denied resources
   - Resources needing permission review

### Setting Up Alerts

Consider setting up alerts for:
- Unusual spike in permission denials
- Repeated denials from same user (potential attack)
- Denials for critical resources (USER, ADMIN, SETTINGS)

## Database Indexes

The following indexes optimize audit log queries:

```sql
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
```

## Best Practices

1. **Always Pass Audit Context**: Include IP address and user agent when checking permissions
2. **Review Logs Regularly**: Monitor for suspicious patterns
3. **Implement Retention Policies**: Archive or delete old logs to manage database size
4. **Use Statistics**: Leverage denial statistics for security insights
5. **Protect Audit Logs**: Ensure only authorized users can access audit logs

## Compliance

This implementation helps meet compliance requirements for:
- **SOC 2**: Access control monitoring and logging
- **GDPR**: Data access tracking and audit trails
- **HIPAA**: Access logging for protected health information
- **ISO 27001**: Information security management

## Future Enhancements

Potential improvements:
1. Real-time alerting for suspicious patterns
2. Machine learning for anomaly detection
3. Export audit logs to external SIEM systems
4. Automated log archival and retention
5. Advanced filtering and search capabilities
6. Audit log visualization and dashboards

## Related Documentation

- [Permission System Guide](./PERMISSION_SYSTEM.md)
- [Security Implementation](./SECURITY_IMPLEMENTATION.md)
- [Audit Log Model](../prisma/schema.prisma)
