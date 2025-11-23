# Permission System Documentation

## Overview

The ERP system implements a comprehensive permission-based access control system that validates permissions at multiple layers:

1. **Middleware Layer** - Route-level permission checks
2. **Server Action Layer** - Function-level permission checks
3. **Component Layer** - UI-level permission checks

This multi-layer approach ensures that permissions are validated at every level of the application, providing defense in depth.

## Architecture

### Database Models

The permission system uses three main models:

- **Permission**: Defines available permissions (resource + action)
- **RolePermission**: Maps permissions to roles (ADMIN, TEACHER, STUDENT, PARENT)
- **UserPermission**: Grants specific permissions to individual users

### Permission Structure

Each permission consists of:
- **Resource**: The entity being accessed (e.g., USER, STUDENT, EXAM)
- **Action**: The operation being performed (CREATE, READ, UPDATE, DELETE, EXPORT, etc.)

## Usage Guide

### 1. Middleware Layer (Route Protection)

The middleware automatically checks permissions for protected routes based on the `ROUTE_PERMISSIONS` configuration.

```typescript
// Defined in src/lib/utils/permission-middleware.ts
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { 
    pattern: /^\/admin\/users\/create/, 
    resource: 'USER', 
    action: 'CREATE', 
    roles: [UserRole.ADMIN] 
  },
  // ... more routes
];
```

**How it works:**
1. User accesses a route
2. Middleware checks if route requires specific permissions
3. If user's role is not in the allowed roles list, access is denied
4. User is redirected to their appropriate dashboard

### 2. Server Action Layer (Function Protection)

#### Option A: Using Wrapper Functions (Recommended)

```typescript
import { withPermission } from '@/lib/utils/permission-wrapper';

export const createStudent = withPermission(
  'STUDENT',
  'CREATE',
  async (studentData: StudentInput) => {
    // Your implementation
    return { success: true, data: student };
  }
);
```

#### Option B: Using Inline Checks

```typescript
import { requirePermission } from '@/lib/utils/permission-wrapper';

export async function deleteStudent(studentId: string) {
  const { userId } = await auth();
  await requirePermission(userId!, 'STUDENT', 'DELETE');
  
  // Your implementation
}
```

#### Option C: Multiple Permissions (AND logic)

```typescript
import { withAllPermissions } from '@/lib/utils/permission-wrapper';

export const publishExam = withAllPermissions(
  [
    { resource: 'EXAM', action: 'UPDATE' },
    { resource: 'EXAM', action: 'PUBLISH' },
  ],
  async (examId: string) => {
    // Your implementation
  }
);
```

#### Option D: Alternative Permissions (OR logic)

```typescript
import { withAnyPermission } from '@/lib/utils/permission-wrapper';

export const viewReport = withAnyPermission(
  [
    { resource: 'REPORT', action: 'READ' },
    { resource: 'REPORT', action: 'EXPORT' },
  ],
  async (reportId: string) => {
    // Your implementation
  }
);
```

### 3. Component Layer (UI Protection)

#### Server Components

```typescript
import { auth } from '@clerk/nextjs/server';
import { hasPermission } from '@/lib/utils/permissions';
import { ServerPermissionGuard } from '@/components/auth/PermissionGuard';

export default async function UsersPage() {
  const { userId } = await auth();
  const canCreate = await hasPermission(userId!, 'USER', 'CREATE');
  
  return (
    <div>
      <h1>Users</h1>
      <ServerPermissionGuard hasPermission={canCreate}>
        <CreateUserButton />
      </ServerPermissionGuard>
    </div>
  );
}
```

#### Client Components

```typescript
'use client';

import { PermissionGuard } from '@/components/auth/PermissionGuard';

export function UserManagement({ userId }: { userId: string }) {
  return (
    <div>
      <h1>Users</h1>
      <PermissionGuard 
        userId={userId} 
        resource="USER" 
        action="CREATE"
        fallback={<p>You don't have permission to create users</p>}
      >
        <CreateUserButton />
      </PermissionGuard>
    </div>
  );
}
```

#### Using the Hook

```typescript
'use client';

import { usePermission } from '@/components/auth/PermissionGuard';

export function UserActions({ userId }: { userId: string }) {
  const { hasPermission, loading } = usePermission(userId, 'USER', 'DELETE');
  
  if (loading) return <Spinner />;
  
  return (
    <div>
      {hasPermission && <DeleteButton />}
    </div>
  );
}
```

## Permission List

### User Management
- `CREATE_USER` - Create new users
- `READ_USER` - View user details
- `UPDATE_USER` - Edit user information
- `DELETE_USER` - Delete users
- `EXPORT_USER` - Export user data
- `IMPORT_USER` - Import user data

### Student Management
- `CREATE_STUDENT` - Create new students
- `READ_STUDENT` - View student details
- `UPDATE_STUDENT` - Edit student information
- `DELETE_STUDENT` - Delete students
- `EXPORT_STUDENT` - Export student data
- `IMPORT_STUDENT` - Import student data

### Teacher Management
- `CREATE_TEACHER` - Create new teachers
- `READ_TEACHER` - View teacher details
- `UPDATE_TEACHER` - Edit teacher information
- `DELETE_TEACHER` - Delete teachers
- `EXPORT_TEACHER` - Export teacher data

### Exam Management
- `CREATE_EXAM` - Create new exams
- `READ_EXAM` - View exam details
- `UPDATE_EXAM` - Edit exam information
- `DELETE_EXAM` - Delete exams
- `PUBLISH_EXAM` - Publish exams to students

### Payment Management
- `CREATE_PAYMENT` - Record new payments
- `READ_PAYMENT` - View payment details
- `UPDATE_PAYMENT` - Edit payment information
- `DELETE_PAYMENT` - Delete payments
- `APPROVE_PAYMENT` - Approve pending payments
- `EXPORT_PAYMENT` - Export payment data

### And many more...

See `src/lib/utils/permissions.ts` for the complete list.

## Best Practices

### 1. Always Validate at Multiple Layers

```typescript
// ✅ GOOD: Validation at all layers
// Middleware checks route access
// Server action checks permission
// Component hides UI if no permission

// ❌ BAD: Only checking in one place
// Relying solely on UI hiding is insecure
```

### 2. Use Wrapper Functions for Server Actions

```typescript
// ✅ GOOD: Using wrapper
export const createUser = withPermission('USER', 'CREATE', async (data) => {
  // Implementation
});

// ❌ BAD: Manual checks everywhere
export async function createUser(data) {
  const { userId } = await auth();
  const hasPermission = await checkPermission(userId, 'USER', 'CREATE');
  if (!hasPermission) throw new Error('Forbidden');
  // Implementation
}
```

### 3. Check Permissions in Server Components

```typescript
// ✅ GOOD: Check on server, pass result to client
export default async function Page() {
  const { userId } = await auth();
  const canCreate = await hasPermission(userId!, 'USER', 'CREATE');
  
  return <ClientComponent canCreate={canCreate} />;
}

// ❌ BAD: Checking in client component (slower, less secure)
'use client';
export default function Page() {
  const [canCreate, setCanCreate] = useState(false);
  useEffect(() => {
    checkPermission().then(setCanCreate);
  }, []);
}
```

### 4. Use Descriptive Permission Names

```typescript
// ✅ GOOD: Clear and specific
await hasPermission(userId, 'EXAM', 'PUBLISH');

// ❌ BAD: Vague or unclear
await hasPermission(userId, 'EXAM', 'DO_SOMETHING');
```

### 5. Handle Permission Errors Gracefully

```typescript
// ✅ GOOD: User-friendly error messages
return {
  success: false,
  error: 'You do not have permission to delete users. Please contact an administrator.',
};

// ❌ BAD: Technical error messages
return {
  success: false,
  error: 'PermissionError: DELETE_USER not granted',
};
```

## Testing Permissions

### Unit Testing

```typescript
import { hasPermission } from '@/lib/utils/permissions';

describe('Permission System', () => {
  it('should grant permission to admin users', async () => {
    const result = await hasPermission('admin-user-id', 'USER', 'CREATE');
    expect(result).toBe(true);
  });
  
  it('should deny permission to unauthorized users', async () => {
    const result = await hasPermission('student-user-id', 'USER', 'DELETE');
    expect(result).toBe(false);
  });
});
```

### Integration Testing

```typescript
import { createUser } from '@/lib/actions/userActions';

describe('User Actions', () => {
  it('should allow admin to create users', async () => {
    // Mock auth to return admin user
    const result = await createUser(userData);
    expect(result.success).toBe(true);
  });
  
  it('should prevent student from creating users', async () => {
    // Mock auth to return student user
    const result = await createUser(userData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('permission');
  });
});
```

## Troubleshooting

### Permission Check Fails Unexpectedly

1. Verify the permission exists in the database
2. Check if the user has the correct role
3. Verify role permissions are configured correctly
4. Check if user-specific permissions have expired

### Middleware Blocks Valid Access

1. Check the `ROUTE_PERMISSIONS` configuration
2. Verify the route pattern matches correctly
3. Ensure the user's role is in the allowed roles list

### Component Doesn't Hide Despite No Permission

1. Verify you're using the correct permission name
2. Check if the permission check is actually running
3. Ensure the userId is being passed correctly

## Security Considerations

1. **Never trust client-side checks alone** - Always validate on the server
2. **Use HTTPS** - Protect session tokens and user data in transit
3. **Audit permission changes** - Log when permissions are granted or revoked
4. **Regular permission reviews** - Periodically review and update permissions
5. **Principle of least privilege** - Grant minimum permissions necessary
6. **Separate admin access** - Use IP whitelisting for admin routes

## Migration Guide

### Adding New Permissions

1. Add permission to database:
```sql
INSERT INTO permissions (name, resource, action, description)
VALUES ('CREATE_VEHICLE', 'VEHICLE', 'CREATE', 'Create new vehicles');
```

2. Add to PERMISSIONS constant in `src/lib/utils/permissions.ts`

3. Configure role permissions:
```sql
INSERT INTO role_permissions (role, permission_id)
SELECT 'ADMIN', id FROM permissions WHERE name = 'CREATE_VEHICLE';
```

4. Add route protection in `src/lib/utils/permission-middleware.ts`

5. Use in server actions and components

## Performance Optimization

### Caching

The system uses React's `cache` function for Server Components:

```typescript
import { hasPermissionCached } from '@/lib/utils/permissions';

// This will be cached for the duration of the request
const canCreate = await hasPermissionCached(userId, 'USER', 'CREATE');
```

### Batch Permission Checks

```typescript
// ✅ GOOD: Check multiple permissions in parallel
const [canCreate, canUpdate, canDelete] = await Promise.all([
  hasPermission(userId, 'USER', 'CREATE'),
  hasPermission(userId, 'USER', 'UPDATE'),
  hasPermission(userId, 'USER', 'DELETE'),
]);

// ❌ BAD: Sequential checks
const canCreate = await hasPermission(userId, 'USER', 'CREATE');
const canUpdate = await hasPermission(userId, 'USER', 'UPDATE');
const canDelete = await hasPermission(userId, 'USER', 'DELETE');
```

## Support

For questions or issues with the permission system:
1. Check this documentation
2. Review the example implementations in `src/lib/actions/permission-examples.ts`
3. Contact the development team
