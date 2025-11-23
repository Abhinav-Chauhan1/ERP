# Permission System Quick Reference

## Quick Start

### 1. Check if User Has Permission

```typescript
import { hasPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

const canCreate = await hasPermission(userId, 'STUDENT', PermissionAction.CREATE);
```

### 2. Protect a Server Action

```typescript
'use server';

import { hasPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

export async function createStudent(data: StudentInput) {
  const userId = await getCurrentUserId();
  
  if (!await hasPermission(userId, 'STUDENT', PermissionAction.CREATE)) {
    throw new Error('Unauthorized');
  }
  
  return await prisma.student.create({ data });
}
```

### 3. Protect a Component

```typescript
import { hasPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

export async function CreateButton({ userId }: { userId: string }) {
  const canCreate = await hasPermission(userId, 'STUDENT', PermissionAction.CREATE);
  
  if (!canCreate) return null;
  
  return <button>Create Student</button>;
}
```

### 4. Grant Custom Permission

```typescript
import { grantPermission } from '@/lib/utils/permissions';

// Permanent permission
await grantPermission(userId, 'DELETE_STUDENT', adminUserId);

// Temporary permission (30 days)
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 30);
await grantPermission(userId, 'APPROVE_APPLICATION', adminUserId, expiresAt);
```

### 5. Revoke Permission

```typescript
import { revokePermission } from '@/lib/utils/permissions';

await revokePermission(userId, 'DELETE_STUDENT');
```

## Permission Actions

```typescript
enum PermissionAction {
  CREATE,   // Create new resources
  READ,     // View/read resources
  UPDATE,   // Modify existing resources
  DELETE,   // Remove resources
  EXPORT,   // Export data
  IMPORT,   // Import data
  APPROVE,  // Approve requests
  REJECT,   // Reject requests
  PUBLISH,  // Publish content
  ARCHIVE,  // Archive resources
}
```

## Common Resources

```typescript
// User Management
'USER', 'STUDENT', 'TEACHER', 'PARENT'

// Academic
'CLASS', 'SUBJECT', 'EXAM', 'ASSIGNMENT', 'ATTENDANCE'

// Finance
'FEE', 'PAYMENT'

// Communication
'ANNOUNCEMENT', 'MESSAGE'

// System
'DOCUMENT', 'REPORT', 'CERTIFICATE', 'BACKUP', 'SETTINGS'

// Library
'BOOK'

// Transport
'VEHICLE', 'ROUTE'

// Admission
'APPLICATION'
```

## Permission Names (Type-Safe)

```typescript
import { PERMISSIONS } from '@/lib/utils/permissions';

// Use constants for type safety
PERMISSIONS.CREATE_STUDENT
PERMISSIONS.READ_STUDENT
PERMISSIONS.UPDATE_STUDENT
PERMISSIONS.DELETE_STUDENT
// ... etc
```

## Check Multiple Permissions

### AND Logic (User must have ALL)

```typescript
import { hasAllPermissions } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

const canManage = await hasAllPermissions(userId, [
  { resource: 'STUDENT', action: PermissionAction.CREATE },
  { resource: 'STUDENT', action: PermissionAction.UPDATE },
  { resource: 'STUDENT', action: PermissionAction.DELETE },
]);
```

### OR Logic (User must have ANY)

```typescript
import { hasAnyPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

const canView = await hasAnyPermission(userId, [
  { resource: 'STUDENT', action: PermissionAction.READ },
  { resource: 'TEACHER', action: PermissionAction.READ },
]);
```

## Get All User Permissions

```typescript
import { getUserPermissions } from '@/lib/utils/permissions';

const permissions = await getUserPermissions(userId);

// Filter by category
const academicPerms = permissions.filter(p => p.category === 'ACADEMIC');

// Filter by resource
const studentPerms = permissions.filter(p => p.resource === 'STUDENT');
```

## Middleware Protection

```typescript
// middleware.ts
import { hasPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

export async function middleware(request: NextRequest) {
  const userId = await getCurrentUserId(request);
  
  if (request.nextUrl.pathname.startsWith('/admin/students/create')) {
    if (!await hasPermission(userId, 'STUDENT', PermissionAction.CREATE)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  return NextResponse.next();
}
```

## Cached Versions (Server Components Only)

```typescript
import { hasPermissionCached, getUserPermissionsCached } from '@/lib/utils/permissions';

// Use in Server Components for better performance
const canCreate = await hasPermissionCached(userId, 'STUDENT', PermissionAction.CREATE);
const permissions = await getUserPermissionsCached(userId);
```

## Default Role Permissions

### ADMIN
- All 94 permissions
- Full system access

### TEACHER
- 35 permissions
- Academic management
- Communication
- Reports

### STUDENT
- 15 permissions
- Read own data
- Communication
- Library access

### PARENT
- 14 permissions
- Read children's data
- Payment management
- Communication

## Seeding Permissions

```bash
# Seed all permissions and role mappings
npx tsx prisma/seed-permissions.ts
```

## Testing

```bash
# Run permission system tests
npx tsx scripts/test-permission-system.ts
```

## Common Patterns

### Pattern 1: Check Before Action

```typescript
async function deleteStudent(studentId: string) {
  const userId = await getCurrentUserId();
  
  if (!await hasPermission(userId, 'STUDENT', PermissionAction.DELETE)) {
    throw new Error('Unauthorized');
  }
  
  await prisma.student.delete({ where: { id: studentId } });
}
```

### Pattern 2: Conditional UI Rendering

```typescript
async function StudentActions({ userId, studentId }: Props) {
  const canUpdate = await hasPermission(userId, 'STUDENT', PermissionAction.UPDATE);
  const canDelete = await hasPermission(userId, 'STUDENT', PermissionAction.DELETE);
  
  return (
    <div>
      {canUpdate && <EditButton studentId={studentId} />}
      {canDelete && <DeleteButton studentId={studentId} />}
    </div>
  );
}
```

### Pattern 3: Permission-Based Routing

```typescript
async function getAccessibleRoutes(userId: string) {
  const routes = [];
  
  if (await hasPermission(userId, 'STUDENT', PermissionAction.READ)) {
    routes.push('/students');
  }
  
  if (await hasPermission(userId, 'EXAM', PermissionAction.CREATE)) {
    routes.push('/exams/create');
  }
  
  return routes;
}
```

### Pattern 4: Bulk Permission Check

```typescript
async function getUserCapabilities(userId: string) {
  const permissions = await getUserPermissions(userId);
  
  return {
    canManageStudents: permissions.some(p => 
      p.resource === 'STUDENT' && 
      ['CREATE', 'UPDATE', 'DELETE'].includes(p.action)
    ),
    canManageExams: permissions.some(p => 
      p.resource === 'EXAM' && 
      ['CREATE', 'UPDATE', 'DELETE'].includes(p.action)
    ),
    // ... etc
  };
}
```

## Error Handling

```typescript
try {
  const hasAccess = await hasPermission(userId, 'STUDENT', PermissionAction.CREATE);
  
  if (!hasAccess) {
    // Log permission denial
    await auditLog.log({
      userId,
      action: 'PERMISSION_DENIED',
      resource: 'STUDENT',
      resourceId: null,
    });
    
    throw new Error('You do not have permission to create students');
  }
  
  // Proceed with action
} catch (error) {
  console.error('Permission check failed:', error);
  throw error;
}
```

## Best Practices

1. ✅ Always check permissions on the server side
2. ✅ Use type-safe permission names from PERMISSIONS constant
3. ✅ Log permission denials for security auditing
4. ✅ Use cached versions in Server Components
5. ✅ Check permissions at multiple layers (middleware, server action, component)
6. ✅ Grant temporary permissions for time-limited access
7. ✅ Regularly review and revoke unnecessary permissions

## Troubleshooting

### Permission Not Working?
1. Check if permission exists: `SELECT * FROM permissions WHERE name = 'PERMISSION_NAME'`
2. Check if permission is active: `isActive = true`
3. Check role permissions: `SELECT * FROM role_permissions WHERE role = 'USER_ROLE'`
4. Check user permissions: `SELECT * FROM user_permissions WHERE userId = 'USER_ID'`
5. Check expiration: `expiresAt IS NULL OR expiresAt > NOW()`

### Performance Issues?
1. Use cached versions in Server Components
2. Batch permission checks when possible
3. Consider caching user permissions in session
4. Use database indexes (already configured)

## Documentation

- Full Documentation: `docs/PERMISSION_SYSTEM.md`
- Implementation Summary: `docs/PERMISSION_SYSTEM_IMPLEMENTATION_SUMMARY.md`
- This Quick Reference: `docs/PERMISSION_SYSTEM_QUICK_REFERENCE.md`
