# Permission-Based Access Control System

## Overview

The ERP system implements a comprehensive permission-based access control (PBAC) system that provides fine-grained control over user actions. This system extends the existing role-based access control (RBAC) by allowing custom permission assignments to individual users.

## Architecture

The permission system consists of three main components:

### 1. Permissions
Permissions define specific actions that can be performed on resources. Each permission has:
- **Name**: Unique identifier (e.g., `CREATE_USER`, `UPDATE_STUDENT`)
- **Resource**: The entity being acted upon (e.g., `USER`, `STUDENT`, `EXAM`)
- **Action**: The operation being performed (e.g., `CREATE`, `READ`, `UPDATE`, `DELETE`)
- **Category**: Logical grouping (e.g., `USER_MANAGEMENT`, `ACADEMIC`, `FINANCE`)
- **Description**: Human-readable explanation of the permission

### 2. Role Permissions
Default permissions assigned to each role:
- **ADMIN**: Full access to all system features
- **TEACHER**: Access to academic management, attendance, exams, assignments
- **STUDENT**: Read-only access to their own data
- **PARENT**: Read access to their children's data, payment management

### 3. User Permissions
Custom permissions assigned to individual users:
- Override or extend role-based permissions
- Support temporary permissions with expiration dates
- Track who granted the permission and when

## Database Schema

```prisma
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  resource    String
  action      PermissionAction
  category    String?
  isActive    Boolean  @default(true)
  
  userPermissions UserPermission[]
  rolePermissions RolePermission[]
}

model UserPermission {
  id           String     @id @default(cuid())
  userId       String
  permissionId String
  grantedBy    String?
  grantedAt    DateTime   @default(now())
  expiresAt    DateTime?
  
  user       User       @relation(...)
  permission Permission @relation(...)
}

model RolePermission {
  id           String     @id @default(cuid())
  role         UserRole
  permissionId String
  isDefault    Boolean    @default(true)
  
  permission Permission @relation(...)
}
```

## Permission Actions

The system supports the following actions:

- `CREATE` - Create new resources
- `READ` - View/read resources
- `UPDATE` - Modify existing resources
- `DELETE` - Remove resources
- `EXPORT` - Export data
- `IMPORT` - Import data
- `APPROVE` - Approve requests/applications
- `REJECT` - Reject requests/applications
- `PUBLISH` - Publish content
- `ARCHIVE` - Archive resources

## Permission Categories

Permissions are organized into logical categories:

- **USER_MANAGEMENT** - User and account management
- **ACADEMIC** - Classes, subjects, exams, assignments
- **FINANCE** - Fees, payments, scholarships
- **COMMUNICATION** - Messages, announcements
- **LIBRARY** - Book management
- **TRANSPORT** - Vehicle and route management
- **ADMISSION** - Application processing
- **REPORTS** - Report generation and export
- **SYSTEM** - System settings and backups

## Usage

### Checking Permissions

```typescript
import { hasPermission, PERMISSIONS } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

// Check if user can create students
const canCreate = await hasPermission(
  userId,
  'STUDENT',
  PermissionAction.CREATE
);

// Using the PERMISSIONS constant for type safety
const canUpdate = await hasPermission(
  userId,
  'STUDENT',
  PermissionAction.UPDATE
);
```

### Checking Multiple Permissions

```typescript
import { hasAllPermissions, hasAnyPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

// User must have ALL permissions
const canManageStudents = await hasAllPermissions(userId, [
  { resource: 'STUDENT', action: PermissionAction.CREATE },
  { resource: 'STUDENT', action: PermissionAction.UPDATE },
  { resource: 'STUDENT', action: PermissionAction.DELETE },
]);

// User must have AT LEAST ONE permission
const canViewData = await hasAnyPermission(userId, [
  { resource: 'STUDENT', action: PermissionAction.READ },
  { resource: 'TEACHER', action: PermissionAction.READ },
]);
```

### Getting User Permissions

```typescript
import { getUserPermissions } from '@/lib/utils/permissions';

// Get all permissions for a user
const permissions = await getUserPermissions(userId);

// Filter by category
const academicPermissions = permissions.filter(
  p => p.category === 'ACADEMIC'
);
```

### Granting Permissions

```typescript
import { grantPermission } from '@/lib/utils/permissions';

// Grant permanent permission
await grantPermission(
  userId,
  'CREATE_EXAM',
  adminUserId
);

// Grant temporary permission (expires in 30 days)
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 30);

await grantPermission(
  userId,
  'APPROVE_APPLICATION',
  adminUserId,
  expiresAt
);
```

### Revoking Permissions

```typescript
import { revokePermission } from '@/lib/utils/permissions';

// Revoke a user-specific permission
await revokePermission(userId, 'CREATE_EXAM');
```

## Middleware Integration

To protect routes with permission checks, use middleware:

```typescript
// middleware.ts
import { hasPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

export async function middleware(request: NextRequest) {
  const userId = await getCurrentUserId(request);
  
  // Check permission for the route
  if (request.nextUrl.pathname.startsWith('/admin/students/create')) {
    const hasAccess = await hasPermission(
      userId,
      'STUDENT',
      PermissionAction.CREATE
    );
    
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  return NextResponse.next();
}
```

## Component-Level Protection

Protect UI components based on permissions:

```typescript
// components/StudentCreateButton.tsx
import { hasPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

export async function StudentCreateButton({ userId }: { userId: string }) {
  const canCreate = await hasPermission(
    userId,
    'STUDENT',
    PermissionAction.CREATE
  );
  
  if (!canCreate) {
    return null; // Don't render the button
  }
  
  return (
    <button onClick={handleCreate}>
      Create Student
    </button>
  );
}
```

## Server Action Protection

Protect server actions with permission checks:

```typescript
// app/actions/students.ts
'use server';

import { hasPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

export async function createStudent(data: StudentInput) {
  const userId = await getCurrentUserId();
  
  // Check permission
  const hasAccess = await hasPermission(
    userId,
    'STUDENT',
    PermissionAction.CREATE
  );
  
  if (!hasAccess) {
    throw new Error('Unauthorized: You do not have permission to create students');
  }
  
  // Proceed with creation
  const student = await prisma.student.create({ data });
  
  // Log the action
  await auditLog.log({
    userId,
    action: 'CREATE',
    resource: 'STUDENT',
    resourceId: student.id,
  });
  
  return student;
}
```

## Best Practices

### 1. Always Check Permissions at Multiple Layers
- **Middleware**: Protect routes
- **Server Actions**: Validate before operations
- **Components**: Hide UI elements user can't access

### 2. Use Type-Safe Permission Names
```typescript
// Good - Type safe
import { PERMISSIONS } from '@/lib/utils/permissions';
await hasPermission(userId, 'STUDENT', PermissionAction.CREATE);

// Avoid - String literals prone to typos
await hasPermission(userId, 'STUDNET', PermissionAction.CREATE); // Typo!
```

### 3. Log Permission Checks
Always log permission denials for security auditing:

```typescript
const hasAccess = await hasPermission(userId, resource, action);

if (!hasAccess) {
  await auditLog.log({
    userId,
    action: 'PERMISSION_DENIED',
    resource,
    resourceId: null,
  });
  throw new Error('Unauthorized');
}
```

### 4. Use Cached Versions in Server Components
```typescript
import { hasPermissionCached } from '@/lib/utils/permissions';

// In Server Components, use cached version for better performance
const canCreate = await hasPermissionCached(
  userId,
  'STUDENT',
  PermissionAction.CREATE
);
```

### 5. Handle Expired Permissions
The system automatically filters out expired permissions. When granting temporary permissions, always set a reasonable expiration date.

## Default Role Permissions

### Admin
- Full access to all resources and actions
- Can manage users, students, teachers, parents
- Can configure system settings
- Can create backups and manage system

### Teacher
- Read access to students, teachers, parents
- Full access to exams, assignments, attendance
- Can create and manage their own content
- Can view but not modify fees and payments
- Can send messages and create announcements

### Student
- Read-only access to their own data
- Can view classes, subjects, exams, assignments
- Can view their attendance and fee records
- Can send messages
- Can view library books

### Parent
- Read access to their children's data
- Can view academic records, attendance, fees
- Can make payments
- Can send messages to teachers
- Can view announcements

## Seeding Permissions

To seed the permission system with default data:

```bash
npx tsx prisma/seed-permissions.ts
```

This will:
1. Create all 94 default permissions
2. Assign permissions to roles
3. Set up the permission hierarchy

## Migration

The permission system was added via migration:
```bash
npx prisma migrate dev --name add_permission_system
```

## Future Enhancements

Potential improvements to the permission system:

1. **Permission Groups**: Group related permissions for easier management
2. **Conditional Permissions**: Permissions based on conditions (e.g., time, location)
3. **Permission Inheritance**: Hierarchical permission structures
4. **Permission Templates**: Pre-defined permission sets for common roles
5. **Audit Dashboard**: UI for viewing permission changes and denials
6. **Permission Request Workflow**: Allow users to request additional permissions

## Troubleshooting

### Permission Not Working
1. Check if permission exists in database
2. Verify permission is active (`isActive = true`)
3. Check if user has the role or user-specific permission
4. Verify permission hasn't expired
5. Check audit logs for permission denials

### Performance Issues
1. Use cached versions of permission checks in Server Components
2. Consider caching user permissions in session
3. Use database indexes on permission tables
4. Batch permission checks when possible

## Security Considerations

1. **Never trust client-side permission checks** - Always validate on server
2. **Log all permission denials** - For security auditing
3. **Regularly review user permissions** - Remove unnecessary permissions
4. **Use temporary permissions** - For time-limited access
5. **Implement rate limiting** - On permission-sensitive operations
6. **Monitor permission changes** - Alert on suspicious activity

## Support

For questions or issues with the permission system:
1. Check this documentation
2. Review the audit logs
3. Contact the system administrator
4. File an issue in the project repository
