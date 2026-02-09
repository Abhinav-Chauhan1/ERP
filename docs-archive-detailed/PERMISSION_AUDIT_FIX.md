# Permission Audit Foreign Key Constraint Fix

## Issue
The application was throwing foreign key constraint errors when trying to log permission checks:

```
Error logging permission denial: Error [PrismaClientKnownRequestError]: 
Invalid `prisma.auditLog.create()` invocation:
Foreign key constraint violated: `AuditLog_userId_fkey (index)`
```

## Root Cause
The permission system was receiving Clerk user IDs (from `auth().userId`) and attempting to use them directly as database user IDs in the AuditLog table. However:

1. Clerk user IDs are different from database user IDs
2. The User table stores Clerk IDs in the `clerkId` field, not the `id` field
3. The AuditLog table has a foreign key constraint requiring `userId` to exist in the User table's `id` field

## Solution
Implemented a two-part fix:

### 1. Added User Existence Checks in Audit Logging
Updated `src/lib/services/permission-audit.ts` to verify users exist before creating audit logs:

```typescript
// Verify user exists before creating audit log
const userExists = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true },
});

if (!userExists) {
  // User doesn't exist in database, skip audit logging
  console.warn(`Skipping audit log for non-existent user: ${userId}`);
  return;
}
```

This prevents the foreign key constraint error and gracefully handles cases where the user doesn't exist.

### 2. Fixed Permission Actions to Use Database User IDs
Updated `src/lib/actions/permissionActions.ts` to properly map Clerk user IDs to database user IDs:

```typescript
/**
 * Helper function to get database user ID from Clerk user ID
 */
async function getDbUserId(clerkUserId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  return user?.id || null;
}
```

All permission action functions now:
1. Get the Clerk user ID from `auth()`
2. Look up the database user ID using `getDbUserId()`
3. Pass the database user ID to `hasPermission()`

## Files Modified
- `src/lib/services/permission-audit.ts` - Added user existence checks
- `src/lib/actions/permissionActions.ts` - Added Clerk ID to database ID mapping
- `prisma/schema.prisma` - Removed duplicate AuditLog model and AuditAction enum
- `src/components/admin/permissions/role-permissions-manager.tsx` - Added null check for permissions
- `src/components/admin/permissions/user-permissions-manager.tsx` - Added null check for permissions
- `src/components/admin/permissions/permissions-list.tsx` - Added null check for permissions
- `src/app/admin/settings/permissions/page.tsx` - Added conditional rendering for components

## Schema Fix
The Prisma schema had duplicate definitions of:
- `model AuditLog` (defined twice)
- `enum AuditAction` (defined twice)

Consolidated into a single definition with all necessary fields and indexes.

## Additional Frontend Fixes
Fixed `TypeError: Cannot convert undefined or null to object` errors in permission components:
- Added null checks before calling `Object.entries()` on permissions data
- Added conditional rendering in the page to prevent rendering components with null data
- Improved error handling and user feedback when permissions data is unavailable

## Testing
After applying these fixes:
1. Permission checks will no longer throw foreign key constraint errors
2. Audit logs will only be created for valid database users
3. The permission system will properly handle the Clerk → Database user ID mapping
4. The permissions page will render correctly without null reference errors
5. Components gracefully handle missing or loading data

## Impact
- **No breaking changes** - The fixes are backward compatible
- **Improved reliability** - Graceful handling of edge cases
- **Better error handling** - Clear warnings when users don't exist
- **Proper audit trail** - Audit logs now correctly reference database users
