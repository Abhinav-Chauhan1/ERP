# Audit Logging System Guide

## Overview

The audit logging system provides comprehensive tracking of all user actions, authentication events, and data changes in the ERP system. This ensures compliance, security, and accountability.

**Requirements:** 6.2

## Features

- ✅ Automatic logging of CREATE, READ, UPDATE, DELETE operations
- ✅ Authentication event logging (LOGIN, LOGOUT)
- ✅ IP address and user agent tracking
- ✅ Change tracking with before/after snapshots
- ✅ Export and import operation logging
- ✅ Query and statistics capabilities
- ✅ Automatic cleanup of old logs

## Database Schema

```prisma
model AuditLog {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  action      AuditAction
  resource    String
  resourceId  String?
  changes     Json?
  ipAddress   String
  userAgent   String
  timestamp   DateTime    @default(now())
  
  @@index([userId, timestamp])
  @@index([resource, resourceId])
  @@index([timestamp])
  @@index([action])
}

enum AuditAction {
  CREATE
  READ
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  EXPORT
  IMPORT
}
```

## Usage

### Basic Logging Functions

```typescript
import { 
  logCreate, 
  logRead, 
  logUpdate, 
  logDelete,
  logLogin,
  logLogout,
  logExport,
  logImport
} from '@/lib/utils/audit-log';

// Log a CREATE action
await logCreate(
  userId,
  'student',
  studentId,
  {
    email: 'student@example.com',
    firstName: 'John',
    lastName: 'Doe',
  }
);

// Log a READ action
await logRead(userId, 'student', studentId);

// Log an UPDATE action
await logUpdate(
  userId,
  'student',
  studentId,
  {
    before: { email: 'old@example.com' },
    after: { email: 'new@example.com' }
  }
);

// Log a DELETE action
await logDelete(
  userId,
  'student',
  studentId,
  {
    email: 'student@example.com',
    firstName: 'John',
    lastName: 'Doe',
  }
);

// Log authentication events
await logLogin(userId);
await logLogout(userId);

// Log export/import operations
await logExport(userId, 'students', 'csv', { class: 'Grade 10' });
await logImport(userId, 'students', 150, { created: 100, updated: 50 });
```

### Using Audit Wrappers

For automatic audit logging, use the wrapper functions:

```typescript
import { 
  withCreateAudit, 
  withUpdateAudit, 
  withDeleteAudit 
} from '@/lib/utils/audit-wrapper';

// Wrap a create function
export const createStudent = withCreateAudit(
  'student',
  async (data: StudentData) => {
    const student = await prisma.student.create({ data });
    return student;
  }
);

// Wrap an update function
export const updateStudent = withUpdateAudit(
  'student',
  async (id: string, data: StudentData) => {
    const student = await prisma.student.update({
      where: { id },
      data,
    });
    return student;
  }
);

// Wrap a delete function
export const deleteStudent = withDeleteAudit(
  'student',
  async (id: string) => {
    await prisma.student.delete({ where: { id } });
    return { success: true };
  }
);
```

### Querying Audit Logs

```typescript
import { queryAuditLogs, getAuditStats } from '@/lib/utils/audit-log';

// Query logs with filters
const result = await queryAuditLogs({
  userId: 'user_123',
  action: 'CREATE',
  resource: 'student',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 50,
  offset: 0,
});

console.log(result.logs); // Array of audit log entries
console.log(result.total); // Total count

// Get statistics
const stats = await getAuditStats(
  'user_123',
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

console.log(stats.totalLogs); // Total number of logs
console.log(stats.actionCounts); // Count by action type
console.log(stats.topResources); // Most accessed resources
```

### Cleanup Old Logs

```typescript
import { deleteOldAuditLogs } from '@/lib/utils/audit-log';

// Delete logs older than 1 year
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

const deletedCount = await deleteOldAuditLogs(oneYearAgo);
console.log(`Deleted ${deletedCount} old audit logs`);
```

## Integration Examples

### Server Actions

```typescript
"use server";

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { logCreate, logUpdate, logDelete } from '@/lib/utils/audit-log';

export async function createStudent(data: StudentData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const student = await prisma.student.create({ data });
    
    // Log the creation
    await logCreate(
      userId,
      'student',
      student.id,
      {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      }
    );
    
    return { success: true, data: student };
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
}

export async function updateStudent(id: string, data: StudentData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    // Get current data for change tracking
    const before = await prisma.student.findUnique({ where: { id } });
    
    // Update the student
    const after = await prisma.student.update({
      where: { id },
      data,
    });
    
    // Log the update with changes
    await logUpdate(
      userId,
      'student',
      id,
      {
        before: { email: before?.email },
        after: { email: after.email }
      }
    );
    
    return { success: true, data: after };
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
}

export async function deleteStudent(id: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    // Get data before deletion
    const student = await prisma.student.findUnique({ where: { id } });
    
    // Delete the student
    await prisma.student.delete({ where: { id } });
    
    // Log the deletion
    await logDelete(
      userId,
      'student',
      id,
      {
        email: student?.email,
        firstName: student?.firstName,
        lastName: student?.lastName,
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
}
```

### Authentication Events

Authentication events are automatically logged via the Clerk webhook handler at `/api/webhooks/clerk-auth`.

To enable this:

1. Configure the webhook in your Clerk dashboard
2. Set the webhook URL to: `https://your-domain.com/api/webhooks/clerk-auth`
3. Subscribe to these events:
   - `session.created` (for login)
   - `session.ended` (for logout)
   - `session.removed` (for logout)
   - `session.revoked` (for logout)
4. Set the `CLERK_WEBHOOK_SECRET` environment variable

## Best Practices

### 1. Always Log User Actions

Every CREATE, UPDATE, and DELETE operation should be logged:

```typescript
// ✅ Good
await logCreate(userId, 'student', studentId, data);

// ❌ Bad - no logging
await prisma.student.create({ data });
```

### 2. Include Relevant Context

Log enough information to understand what changed:

```typescript
// ✅ Good - includes relevant fields
await logUpdate(userId, 'student', studentId, {
  before: { email: 'old@example.com', grade: 'A' },
  after: { email: 'new@example.com', grade: 'B' }
});

// ❌ Bad - no context
await logUpdate(userId, 'student', studentId, {});
```

### 3. Don't Log Sensitive Data

Avoid logging passwords, tokens, or other sensitive information:

```typescript
// ✅ Good - excludes password
await logCreate(userId, 'user', user.id, {
  email: data.email,
  firstName: data.firstName,
  // password is NOT logged
});

// ❌ Bad - logs password
await logCreate(userId, 'user', user.id, {
  email: data.email,
  password: data.password, // Don't do this!
});
```

### 4. Handle Errors Gracefully

Audit logging should not break the main flow:

```typescript
try {
  await logCreate(userId, 'student', studentId, data);
} catch (error) {
  // Log error but don't throw
  console.error('Failed to create audit log:', error);
}
```

The `logAudit` function already handles this internally.

### 5. Regular Cleanup

Set up a cron job to clean up old audit logs:

```typescript
// Run monthly
import { deleteOldAuditLogs } from '@/lib/utils/audit-log';

const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

await deleteOldAuditLogs(oneYearAgo);
```

## Viewing Audit Logs

### Admin Dashboard

Create an admin page to view audit logs:

```typescript
// app/admin/audit-logs/page.tsx
import { queryAuditLogs } from '@/lib/utils/audit-log';

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { page?: string; action?: string; resource?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const result = await queryAuditLogs({
    action: searchParams.action as any,
    resource: searchParams.resource,
    limit,
    offset,
  });

  return (
    <div>
      <h1>Audit Logs</h1>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Resource</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {result.logs.map((log) => (
            <tr key={log.id}>
              <td>{log.timestamp.toLocaleString()}</td>
              <td>{log.user.email}</td>
              <td>{log.action}</td>
              <td>{log.resource}</td>
              <td>{log.ipAddress}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Security Considerations

1. **Access Control**: Only administrators should be able to view audit logs
2. **Data Retention**: Implement a retention policy (e.g., keep logs for 1 year)
3. **Encryption**: Consider encrypting sensitive data in the `changes` field
4. **Integrity**: Audit logs should be immutable (no updates or deletes except for cleanup)
5. **Monitoring**: Set up alerts for suspicious patterns (e.g., mass deletions)

## Performance Considerations

1. **Async Logging**: Audit logging is non-blocking and won't slow down operations
2. **Indexes**: The schema includes indexes on frequently queried fields
3. **Batch Operations**: For bulk operations, consider batching audit log entries
4. **Archival**: Move old logs to cold storage to keep the main table performant

## Compliance

This audit logging system helps meet compliance requirements for:

- **GDPR**: Track data access and modifications
- **FERPA**: Log access to student records
- **SOC 2**: Demonstrate security controls
- **ISO 27001**: Maintain audit trails

## Troubleshooting

### Logs Not Being Created

1. Check that the user is authenticated
2. Verify the database connection
3. Check console for error messages
4. Ensure the AuditLog model is in the Prisma schema

### Missing IP Address or User Agent

1. Verify the request is coming through Next.js server
2. Check that headers are being passed correctly
3. For local development, IP may show as "unknown"

### Performance Issues

1. Check database indexes are created
2. Implement log archival for old entries
3. Consider pagination for large result sets
4. Use filters to narrow down queries

## Future Enhancements

- [ ] Real-time audit log streaming
- [ ] Advanced search with full-text search
- [ ] Audit log export functionality
- [ ] Anomaly detection and alerts
- [ ] Integration with SIEM systems
- [ ] Audit log visualization dashboard
