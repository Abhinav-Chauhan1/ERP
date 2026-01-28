# Multi-School SaaS Migration Guide

This guide covers the migration from a single-school ERP to a true multi-tenant SaaS platform.

## 🚀 Overview

The ERP has been converted from a single-school system to a multi-tenant SaaS platform where:

- Multiple schools can use the same hosted system
- Data is properly isolated between schools
- Super admin can manage all schools
- Setup wizard works per-school instead of per-database

## 📋 What's Changed

### New Models Added
- `School` - Main school entity with onboarding status
- `Subscription` - Billing and subscription management
- `UsageCounter` - Monthly usage tracking (WhatsApp, SMS, storage)
- `UserSchool` - Many-to-many relationship between users and schools

### Updated Models
All school-scoped models now have `schoolId` foreign key:
- `Administrator`, `Teacher`, `Student`, `Parent`
- `AcademicYear`, `Term`, `Class`, `ClassSection`
- `StudentAttendance` (and many others)

### Authentication Changes
- Sessions now include active `schoolId`
- Users can belong to multiple schools
- Super admin role added for system management
- School selection flow for multi-school users

### Setup Wizard Changes
- Works per-school instead of per-database
- Only shows when `School.isOnboarded = false`
- Super admin can manually trigger setup wizard

## 🛠️ Migration Steps

### 1. Run Database Migration

```bash
# Generate Prisma client with new schema
npx prisma generate

# Run the migration script to convert existing data
npm run tsx scripts/migrate-to-multi-school.ts
```

The migration script will:
- Create a default school from existing system settings
- Assign all existing data to the default school
- Create user-school relationships
- Set up subscriptions and usage counters
- Create a super admin user

### 2. Environment Variables

Add these to your `.env` file:

```env
# Super Admin Credentials (used during migration)
SUPER_ADMIN_EMAIL=superadmin@yourdomain.com
SUPER_ADMIN_PASSWORD=your_secure_password

# Database
DATABASE_URL="your_postgresql_connection_string"
```

### 3. Test the Migration

```bash
# Run comprehensive tests
npm run tsx scripts/test-multi-school-setup.ts
```

This will verify:
- Schools were created correctly
- Data was migrated properly
- User-school relationships exist
- Tenant isolation is working

### 4. Update Application

```bash
# Restart your application
npm run dev
```

## 🧪 Testing the New Features

### 1. Super Admin Panel
- Visit `/super-admin` (requires SUPER_ADMIN role)
- Create new schools
- Manage subscriptions
- View usage analytics
- Launch setup wizards for schools

### 2. School Selection
- Login with a user assigned to multiple schools
- You'll be redirected to `/select-school`
- Choose which school to work with

### 3. Setup Wizard
- For new schools: Automatically shown on first access
- For existing schools: Can be triggered by super admin
- Now works per-school instead of per-database

### 4. Tenant Isolation
- Each school's data is completely isolated
- Users can only see data from their assigned schools
- No cross-school data leakage

## 🔧 API Changes

### Authentication
All authenticated requests now automatically include school context. The system:

1. Gets current user from session
2. Determines active school from `UserSchool` relationship
3. Automatically filters all queries by `schoolId`

### Helper Functions
Use these helpers in your API routes and server actions:

```typescript
import { getCurrentSchoolId, requireSchoolAccess, withSchoolScope } from '@/lib/auth/tenant';

// Get current school ID
const schoolId = await getCurrentSchoolId();

// Require school access (throws error if no access)
const context = await requireSchoolAccess();

// Filter queries by school
const students = await db.student.findMany({
  where: withSchoolScope({ /* your filters */ }),
});
```

## 📊 Plan Limits

The system now enforces plan-based limits:

- **Starter**: 100 WhatsApp/SMS, 1GB storage
- **Growth**: 1000 WhatsApp/SMS, 10GB storage
- **Dominate**: Unlimited WhatsApp/SMS, 100GB storage

Usage is tracked monthly and enforced at the application level.

## 🚨 Breaking Changes

### Database Queries
All database queries that access school-scoped data MUST include `schoolId`. Use the helper functions:

```typescript
// ❌ Old way
const students = await db.student.findMany();

// ✅ New way
const students = await db.student.findMany({
  where: withSchoolScope(),
});
```

### System Settings
System-wide settings are now separate from school-specific settings. The `SystemSettings` model is now global, while school-specific settings are in the `School` model.

### User Roles
- Added `SUPER_ADMIN` role for system management
- Users can have different roles in different schools via `UserSchool`

## 🐛 Troubleshooting

### Migration Issues
If migration fails:
1. Check database connection
2. Ensure existing data integrity
3. Run migration in a clean database if needed

### Authentication Issues
If users can't access schools:
1. Check `UserSchool` relationships exist
2. Verify user has `isActive: true` in their school assignments
3. Check school `status` is `ACTIVE`

### Setup Wizard Issues
If setup wizard doesn't appear:
1. Check `School.isOnboarded` is `false`
2. Verify user has access to the school
3. Check school `status` is not `SUSPENDED`

## 📈 Next Steps

After migration:

1. **Test thoroughly** in a staging environment
2. **Update client applications** if any
3. **Set up billing integration** for subscriptions
4. **Configure usage monitoring** alerts
5. **Update documentation** for multi-school usage
6. **Plan for scaling** - consider database optimization for multi-tenant queries

## 🔒 Security Considerations

- All data is now properly isolated by `schoolId`
- Super admin has access to all schools
- Regular users can only access assigned schools
- API routes automatically enforce tenant isolation
- Audit logs include school context

## 📞 Support

If you encounter issues:
1. Check the test script output for diagnostics
2. Review database migration logs
3. Verify environment variables
4. Check application logs for errors

The multi-school architecture is now live! 🎉