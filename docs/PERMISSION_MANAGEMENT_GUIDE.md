# Permission Management Guide

## Overview

The Permission Management System provides fine-grained access control for the ERP application. Administrators can manage both role-based permissions (applying to all users with a specific role) and user-specific permissions (custom permissions for individual users).

## Accessing Permission Management

1. Log in as an administrator
2. Navigate to **Settings** from the admin dashboard
3. Click on the **Permissions** tab
4. Click **Manage Permissions** button

Or directly access: `/admin/settings/permissions`

## Interface Overview

The permission management interface has three main tabs:

### 1. Role Permissions Tab

Manage default permissions for each role in the system.

**Roles Available:**
- **ADMIN** - Full system access
- **TEACHER** - Academic and classroom management
- **STUDENT** - View own academic information
- **PARENT** - View children's information

**How to Use:**
1. Click on a role badge to select it
2. Permissions are organized by category (e.g., USER_MANAGEMENT, ACADEMIC, FINANCE)
3. Check/uncheck permissions as needed
4. Click **Save Changes** to apply

**Permission Display:**
- Each permission shows:
  - Name (e.g., CREATE_USER)
  - Description (what it allows)
  - Resource (what entity it affects)
  - Action (what operation it permits)

### 2. User Permissions Tab

Assign custom permissions to individual users, overriding their role-based permissions.

**Layout:**
- **Left Panel**: User list with search
- **Right Panel**: Selected user's custom permissions

**How to Add Custom Permission:**
1. Search and select a user from the left panel
2. Click **Add Permission** button
3. Select a permission from the dropdown
4. (Optional) Set an expiration date for temporary access
5. Click **Add Permission** to confirm

**How to Remove Custom Permission:**
1. Select a user from the left panel
2. Find the permission in the right panel
3. Click the trash icon next to the permission

**Features:**
- Search users by name or email
- View user's role
- See all custom permissions with expiration dates
- Temporary permissions automatically expire

### 3. All Permissions Tab

View all available permissions in the system.

**Features:**
- Search permissions by name, description, resource, or action
- Permissions organized by category in accordion view
- Shows permission count per category
- Displays active/inactive status

**Categories:**
- **USER_MANAGEMENT** - User account operations
- **ACADEMIC** - Classes, subjects, exams, assignments
- **FINANCE** - Fees, payments, scholarships
- **COMMUNICATION** - Messages, announcements
- **LIBRARY** - Book management
- **TRANSPORT** - Vehicle and route management
- **ADMISSION** - Application processing
- **REPORTS** - Report generation and export
- **SYSTEM** - Settings, backups, certificates

## Permission Structure

Each permission consists of:

- **Name**: Unique identifier (e.g., `CREATE_STUDENT`)
- **Resource**: Entity being accessed (e.g., `STUDENT`)
- **Action**: Operation being performed (e.g., `CREATE`)
- **Category**: Organizational grouping
- **Description**: Human-readable explanation
- **Status**: Active or inactive

## Common Use Cases

### Use Case 1: Grant Teacher Additional Permissions

**Scenario**: A teacher needs to manage fee payments for their class.

**Steps:**
1. Go to **User Permissions** tab
2. Search for the teacher
3. Click **Add Permission**
4. Select `CREATE_PAYMENT` or `READ_PAYMENT`
5. Click **Add Permission**

### Use Case 2: Temporary Admin Access

**Scenario**: Grant a teacher temporary admin access for a specific period.

**Steps:**
1. Go to **User Permissions** tab
2. Search for the teacher
3. Click **Add Permission**
4. Select admin-level permissions
5. Set expiration date (e.g., end of month)
6. Click **Add Permission**

### Use Case 3: Customize Role Permissions

**Scenario**: Modify default permissions for all students.

**Steps:**
1. Go to **Role Permissions** tab
2. Select **STUDENT** role
3. Check/uncheck permissions as needed
4. Click **Save Changes**

### Use Case 4: Restrict Access

**Scenario**: Remove a specific permission from a role.

**Steps:**
1. Go to **Role Permissions** tab
2. Select the role
3. Uncheck the permission
4. Click **Save Changes**

## Permission Actions

The system supports these actions:

- **CREATE** - Add new records
- **READ** - View records
- **UPDATE** - Modify existing records
- **DELETE** - Remove records
- **EXPORT** - Export data
- **IMPORT** - Import data
- **APPROVE** - Approve requests
- **REJECT** - Reject requests
- **PUBLISH** - Publish content

## Best Practices

### 1. Principle of Least Privilege
- Grant only the minimum permissions needed
- Use role-based permissions as the default
- Add user-specific permissions only when necessary

### 2. Regular Audits
- Review permissions periodically
- Remove unused custom permissions
- Check for expired permissions

### 3. Temporary Access
- Use expiration dates for temporary permissions
- Set clear end dates for special access
- Review and renew if needed

### 4. Documentation
- Document why custom permissions were granted
- Keep track of special access cases
- Review audit logs regularly

### 5. Testing
- Test permission changes in a safe environment
- Verify users can access what they need
- Ensure restricted access works correctly

## Security Considerations

### Permission Checks
Permissions are checked at multiple layers:
1. **Middleware** - Route-level protection
2. **Server Actions** - Action-level validation
3. **Components** - UI-level conditional rendering

### Audit Logging
All permission-related activities are logged:
- Permission assignments
- Permission removals
- Permission checks
- Access denials

### Cache Invalidation
Permission changes trigger cache invalidation to ensure:
- Immediate effect of changes
- Consistent permission enforcement
- No stale permission data

## Troubleshooting

### Issue: Changes Not Taking Effect

**Solution:**
1. Clear browser cache
2. Log out and log back in
3. Verify changes were saved
4. Check audit logs for confirmation

### Issue: User Can't Access Feature

**Solution:**
1. Check user's role permissions
2. Check user's custom permissions
3. Verify permission is active
4. Check if permission has expired

### Issue: Permission Not Available

**Solution:**
1. Verify permission exists in the system
2. Check if permission is active
3. Run permission seed script if needed
4. Contact system administrator

## Initial Setup

### First Time Setup

1. **Seed Permissions**:
   ```powershell
   # Windows
   .\scripts\seed-permissions.ps1
   
   # Unix/Linux
   ./scripts/seed-permissions.sh
   ```

2. **Verify Seeding**:
   - Navigate to **All Permissions** tab
   - Verify permissions are listed
   - Check all categories are present

3. **Review Default Permissions**:
   - Check each role's default permissions
   - Adjust as needed for your organization
   - Save changes

4. **Test Access**:
   - Log in as different roles
   - Verify appropriate access
   - Test restricted features

## Support

For additional help:
- Check the audit logs for permission-related events
- Review the system documentation
- Contact your system administrator
- Refer to the technical documentation in `src/components/admin/permissions/README.md`

## Related Documentation

- [Permission System Technical Documentation](../src/components/admin/permissions/README.md)
- [Implementation Summary](../PERMISSION_MANAGEMENT_IMPLEMENTATION.md)
- [Security Guide](./SECURITY.md)
- [Audit Logging Guide](./PERMISSION_AUDIT_LOGGING.md)
