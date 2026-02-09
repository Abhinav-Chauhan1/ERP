# Syllabus Authorization - Quick Reference

## Quick Authorization Guide

### When to Use Each Function

| Function | Use Case | Allowed Roles |
|----------|----------|---------------|
| `requireAdmin()` | CRUD operations on modules, sub-modules, documents | Admin only |
| `requireTeacher()` | Progress tracking operations | Teacher only |
| `requireStudent()` | Student-specific operations | Student only |
| `requireAdminOrTeacher()` | Operations for both admins and teachers | Admin, Teacher |
| `requireViewAccess()` | Read-only operations (viewing content) | Admin, Teacher, Student |
| `requireModifyAccess()` | Modifying syllabus structure | Admin only |
| `requireProgressTrackingAccess()` | Marking progress | Teacher only |
| `verifyTeacherOwnership(id)` | Teacher accessing their own data | Teacher (own data only) |

## Code Examples

### Admin-Only Operation

```typescript
export async function createModule(input: CreateModuleInput) {
  try {
    // Check authorization
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Continue with operation...
  } catch (error) {
    // Handle error
  }
}
```

### Teacher Progress Tracking

```typescript
export async function markSubModuleComplete(input: MarkSubModuleCompleteInput) {
  try {
    // Verify teacher can only mark their own progress
    const authResult = await verifyTeacherOwnership(input.teacherId);
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Continue with operation...
  } catch (error) {
    // Handle error
  }
}
```

### View Operation (All Users)

```typescript
export async function getModulesBySyllabus(syllabusId: string) {
  try {
    // Allow all authenticated users to view
    const authResult = await requireViewAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Continue with operation...
  } catch (error) {
    // Handle error
  }
}
```

## Authorization Flow

```
1. User makes request
   ↓
2. Server action called
   ↓
3. Authorization check (requireXXX function)
   ↓
4. Check Clerk authentication
   ↓
5. Fetch user from database
   ↓
6. Verify role matches requirement
   ↓
7. Return authorization result
   ↓
8. If authorized: Continue with operation
   If not authorized: Return error
```

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `UNAUTHENTICATED` | User not logged in | Redirect to login |
| `USER_NOT_FOUND` | User not in database | Show error, contact support |
| `FORBIDDEN` | Wrong role for operation | Show "Access Denied" message |
| `AUTH_ERROR` | General auth failure | Show error, retry |

## Common Patterns

### Pattern 1: Admin CRUD Operation

```typescript
// 1. Check admin authorization
const authResult = await requireModifyAccess();
if (!authResult.authorized) {
  return formatAuthError(authResult);
}

// 2. Validate input
const validationResult = schema.safeParse(input);
if (!validationResult.success) {
  return { success: false, error: "Validation failed" };
}

// 3. Perform database operation
const result = await db.entity.create({ data: validatedData });

// 4. Revalidate paths
revalidatePath("/admin/academic/syllabus");

// 5. Return success
return { success: true, data: result };
```

### Pattern 2: Teacher Progress Tracking

```typescript
// 1. Verify teacher ownership
const authResult = await verifyTeacherOwnership(teacherId);
if (!authResult.authorized) {
  return formatAuthError(authResult);
}

// 2. Validate input
const validationResult = schema.safeParse(input);
if (!validationResult.success) {
  return { success: false, error: "Validation failed" };
}

// 3. Update progress
const progress = await db.subModuleProgress.upsert({
  where: { subModuleId_teacherId: { subModuleId, teacherId } },
  update: { completed, completedAt: new Date() },
  create: { subModuleId, teacherId, completed }
});

// 4. Revalidate paths
revalidatePath("/teacher");

// 5. Return success
return { success: true, data: progress };
```

### Pattern 3: View Operation

```typescript
// 1. Check view access
const authResult = await requireViewAccess();
if (!authResult.authorized) {
  return formatAuthError(authResult);
}

// 2. Validate input
if (!id) {
  return { success: false, error: "ID required" };
}

// 3. Fetch data
const data = await db.entity.findMany({
  where: { id },
  include: { relations: true }
});

// 4. Return data
return { success: true, data };
```

## Testing Authorization

```typescript
import { requireAdmin } from '@/lib/utils/syllabus-authorization';

describe('Authorization', () => {
  it('should authorize admin users', async () => {
    // Mock auth to return admin user
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' });
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 'user-123',
      role: UserRole.ADMIN
    });

    const result = await requireAdmin();
    
    expect(result.authorized).toBe(true);
  });

  it('should reject non-admin users', async () => {
    // Mock auth to return teacher user
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' });
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 'user-123',
      role: UserRole.TEACHER
    });

    const result = await requireAdmin();
    
    expect(result.authorized).toBe(false);
    expect(result.error).toBe('Admin access required');
  });
});
```

## UI Integration

### Handling Authorization Errors

```typescript
// In React component
const handleCreateModule = async (data: ModuleInput) => {
  const result = await createModule(data);
  
  if (!result.success) {
    // Check for authorization errors
    if (result.code === 'FORBIDDEN') {
      toast.error('You do not have permission to perform this action');
      return;
    }
    
    if (result.code === 'UNAUTHENTICATED') {
      router.push('/login');
      return;
    }
    
    // Handle other errors
    toast.error(result.error || 'Operation failed');
    return;
  }
  
  // Success
  toast.success('Module created successfully');
};
```

### Conditional Rendering Based on Role

```typescript
// In React component
import { useUser } from '@clerk/nextjs';

function SyllabusActions() {
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  
  return (
    <div>
      {/* Admin-only actions */}
      {role === 'ADMIN' && (
        <>
          <Button onClick={handleCreate}>Create Module</Button>
          <Button onClick={handleEdit}>Edit Module</Button>
          <Button onClick={handleDelete}>Delete Module</Button>
        </>
      )}
      
      {/* Teacher actions */}
      {role === 'TEACHER' && (
        <Checkbox onChange={handleMarkComplete}>
          Mark as Complete
        </Checkbox>
      )}
      
      {/* All users can view */}
      <Button onClick={handleView}>View Details</Button>
    </div>
  );
}
```

## Checklist for Adding New Operations

- [ ] Determine required role(s) for the operation
- [ ] Add authorization check at the start of server action
- [ ] Use appropriate `requireXXX()` function
- [ ] Handle authorization errors with `formatAuthError()`
- [ ] Add route pattern to `permission-middleware.ts` if needed
- [ ] Write tests for authorization logic
- [ ] Update UI to handle authorization errors
- [ ] Document the authorization requirements

## Common Mistakes to Avoid

❌ **Don't**: Skip authorization checks
```typescript
export async function deleteModule(id: string) {
  // Missing authorization check!
  await db.module.delete({ where: { id } });
}
```

✅ **Do**: Always check authorization first
```typescript
export async function deleteModule(id: string) {
  const authResult = await requireModifyAccess();
  if (!authResult.authorized) {
    return formatAuthError(authResult);
  }
  await db.module.delete({ where: { id } });
}
```

❌ **Don't**: Use wrong authorization function
```typescript
// Teacher trying to delete module - should be admin only!
const authResult = await requireTeacher();
```

✅ **Do**: Use correct authorization function
```typescript
// Only admins can delete modules
const authResult = await requireModifyAccess();
```

❌ **Don't**: Forget to verify ownership for teacher operations
```typescript
// Teacher could mark another teacher's progress!
const authResult = await requireTeacher();
```

✅ **Do**: Verify teacher ownership
```typescript
// Ensure teacher can only mark their own progress
const authResult = await verifyTeacherOwnership(teacherId);
```

## Resources

- Full Documentation: `docs/SYLLABUS_AUTHORIZATION_IMPLEMENTATION.md`
- Authorization Utility: `src/lib/utils/syllabus-authorization.ts`
- Test Examples: `src/lib/actions/__tests__/syllabus-authorization.test.ts`
- Middleware Config: `src/lib/utils/permission-middleware.ts`
