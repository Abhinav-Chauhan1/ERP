# Permission Management System

This directory contains components for managing the fine-grained permission system in the ERP application.

## Components

### RolePermissionsManager
Manages permissions for each role (ADMIN, TEACHER, STUDENT, PARENT). Allows bulk assignment of permissions to roles.

**Features:**
- View and edit permissions for each role
- Permissions organized by category
- Bulk save functionality
- Visual indicators for assigned permissions

### UserPermissionsManager
Manages custom permissions for individual users, overriding their role-based permissions.

**Features:**
- Search and select users
- Add custom permissions to users
- Set expiration dates for temporary permissions
- Remove custom permissions
- View all custom permissions for a user

### PermissionsList
Displays all available permissions in the system, organized by category.

**Features:**
- Search permissions by name, description, resource, or action
- Accordion view by category
- Permission count per category
- Active/inactive status indicators

## Usage

### Accessing Permission Management
Navigate to: `/admin/settings/permissions`

Or from the Settings page, go to the "Permissions" tab.

### Managing Role Permissions
1. Select a role (ADMIN, TEACHER, STUDENT, PARENT)
2. Check/uncheck permissions for that role
3. Click "Save Changes" to apply

### Managing User Permissions
1. Search and select a user from the list
2. Click "Add Permission" to grant a custom permission
3. Select the permission and optionally set an expiration date
4. Click "Add Permission" to confirm
5. Remove permissions by clicking the trash icon

## Permission Structure

Each permission has:
- **Name**: Unique identifier (e.g., "CREATE_USER")
- **Resource**: The entity being accessed (e.g., "USER", "STUDENT")
- **Action**: The operation being performed (e.g., "CREATE", "READ", "UPDATE", "DELETE")
- **Category**: Grouping for organization (e.g., "USER_MANAGEMENT", "ACADEMIC")
- **Description**: Human-readable explanation
- **Active Status**: Whether the permission is currently in use

## Permission Checking

Permissions are checked at multiple layers:
1. **Middleware**: Route-level protection
2. **Server Actions**: Action-level validation
3. **Components**: UI-level conditional rendering

Example:
```typescript
import { hasPermission } from '@/lib/utils/permissions';

// Check if user has permission
const canCreate = await hasPermission(userId, 'USER', 'CREATE');

if (canCreate) {
  // Show create button
}
```

## Audit Logging

All permission checks and changes are logged for audit purposes. See the audit logs page for details.

## Related Files

- **Actions**: `src/lib/actions/permissionActions.ts`
- **Utilities**: `src/lib/utils/permissions.ts`
- **Seed Script**: `prisma/seed-permissions.ts`
- **Schema**: `prisma/schema.prisma` (Permission, UserPermission, RolePermission models)
