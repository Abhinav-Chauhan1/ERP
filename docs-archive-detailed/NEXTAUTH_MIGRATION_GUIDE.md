# NextAuth v5 Migration Guide

This guide provides step-by-step instructions for migrating from Clerk to NextAuth v5 authentication.

## Overview

The migration involves:
1. Database schema changes (adding NextAuth tables and fields)
2. User data migration (preserving existing users)
3. Code updates (replacing Clerk with NextAuth)
4. Testing and verification

## Prerequisites

- Database backup completed
- All team members notified of migration
- Staging environment available for testing
- Email service configured (Resend)

## Phase 1: Database Schema Migration

### Step 1: Review the Migration

The migration adds three new tables and updates the User model:

**New Tables:**
- `Account` - OAuth provider accounts
- `Session` - Active user sessions
- `VerificationToken` - Email verification and password reset tokens

**User Model Changes:**
- Added `emailVerified` (DateTime?) - Email verification status
- Added `password` (String?) - Hashed password for credentials auth
- Added `name` (String?) - Full name for NextAuth
- Added `image` (String?) - Profile image for OAuth
- Modified `clerkId` to nullable (temporary, for migration)

### Step 2: Apply Migration in Staging

```bash
# 1. Backup staging database
pg_dump $DATABASE_URL > backup_staging_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply the migration
npx prisma migrate deploy

# 3. Verify the migration
npx ts-node scripts/verify-nextauth-migration.ts
```

### Step 3: Test Rollback Capability

```bash
# Test rollback in a separate staging environment
psql $DATABASE_URL -f prisma/migrations/20251228043745_add_nextauth_tables/rollback.sql

# Verify rollback
npx ts-node scripts/verify-nextauth-migration.ts
# Should show failures (expected after rollback)

# Re-apply migration
npx prisma migrate deploy

# Verify again
npx ts-node scripts/verify-nextauth-migration.ts
# Should show all passes
```

### Step 4: Apply Migration in Production

**IMPORTANT: Schedule during low-traffic period**

```bash
# 1. Backup production database
pg_dump $DATABASE_URL > backup_production_$(date +%Y%m%d_%H%M%S).sql

# 2. Put application in maintenance mode (optional)
# Set MAINTENANCE_MODE=true in environment

# 3. Apply the migration
npx prisma migrate deploy

# 4. Verify the migration
npx ts-node scripts/verify-nextauth-migration.ts

# 5. If successful, proceed to Phase 2
# 6. If failed, rollback immediately:
#    psql $DATABASE_URL -f prisma/migrations/20251228043745_add_nextauth_tables/rollback.sql
```

## Phase 2: User Data Migration

### Step 1: Review Migration Script

The user migration script (`scripts/migrate-users-to-nextauth.ts`) will:
- Set password to null for all existing users
- Set emailVerified based on Clerk verification status
- Preserve all user data and relationships
- Generate password setup tokens
- Send password setup emails

### Step 2: Run Migration in Staging

```bash
# Run the migration script
npx ts-node scripts/migrate-users-to-nextauth.ts

# Review the migration report
# Check logs/migration-{timestamp}.log
```

### Step 3: Test User Flows in Staging

1. **Password Setup Flow:**
   - Check that password setup emails were sent
   - Click password setup link
   - Set new password
   - Login with new credentials

2. **OAuth Flow:**
   - Login with Google
   - Login with GitHub
   - Verify account linking works

3. **2FA Flow:**
   - Enable 2FA for test user
   - Login with 2FA
   - Verify TOTP codes work

### Step 4: Run Migration in Production

```bash
# 1. Run the migration script
npx ts-node scripts/migrate-users-to-nextauth.ts

# 2. Monitor email delivery
# Check Resend dashboard for delivery status

# 3. Review migration report
cat logs/migration-$(date +%Y%m%d)*.log

# 4. Monitor for errors
# Check application logs for authentication errors
```

## Phase 3: Code Deployment

### Step 1: Deploy NextAuth Code

The code changes include:
- NextAuth v5 configuration (`src/auth.ts`)
- API route handlers (`app/api/auth/[...nextauth]/route.ts`)
- Updated middleware
- Authentication utilities
- UI components (login, register, password reset)

```bash
# 1. Deploy to staging
git push staging main

# 2. Test all authentication flows
# - Login with credentials
# - Login with OAuth
# - Registration
# - Password reset
# - 2FA
# - Session management

# 3. Deploy to production
git push production main

# 4. Monitor for errors
# Check application logs and error tracking
```

### Step 2: Update Environment Variables

Ensure these environment variables are set:

```bash
# Required
AUTH_SECRET=<generated-secret>
AUTH_URL=https://your-domain.com
AUTH_TRUST_HOST=true

# Optional (for OAuth)
AUTH_GOOGLE_ID=<google-client-id>
AUTH_GOOGLE_SECRET=<google-client-secret>
AUTH_GITHUB_ID=<github-client-id>
AUTH_GITHUB_SECRET=<github-client-secret>
```

Generate AUTH_SECRET:
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

## Phase 4: Cleanup

### Step 1: Monitor for Issues

Monitor for 7-14 days:
- Authentication errors
- Session issues
- Email delivery problems
- User complaints

### Step 2: Remove Clerk Code

After confirming everything works:

```bash
# 1. Remove Clerk packages
npm uninstall @clerk/nextjs @clerk/clerk-sdk-node

# 2. Remove Clerk environment variables
# Remove from .env:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - NEXT_PUBLIC_CLERK_SIGN_IN_URL
# - NEXT_PUBLIC_CLERK_SIGN_UP_URL
# - NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
# - NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL

# 3. Remove Clerk code
# - Delete src/types/clerk.d.ts
# - Remove Clerk imports from all files
# - Remove ClerkProvider from layout
# - Remove Clerk webhooks

# 4. Commit and deploy
git add .
git commit -m "Remove Clerk dependencies"
git push production main
```

### Step 3: Remove clerkId Field

After all users have migrated and no longer need clerkId:

```bash
# 1. Create migration to drop clerkId
npx prisma migrate dev --name remove-clerk-id

# 2. Apply in staging
npx prisma migrate deploy

# 3. Test thoroughly

# 4. Apply in production
npx prisma migrate deploy
```

## Verification Checklist

### Database Schema
- [ ] Account table exists
- [ ] Session table exists
- [ ] VerificationToken table exists
- [ ] User table has new fields (emailVerified, password, name, image)
- [ ] clerkId is nullable
- [ ] All indexes created
- [ ] Foreign keys configured
- [ ] Existing data preserved

### User Migration
- [ ] All users migrated successfully
- [ ] Password setup emails sent
- [ ] Email verification status preserved
- [ ] User relationships intact (teacher, student, parent, admin)
- [ ] 2FA settings preserved

### Authentication Flows
- [ ] Login with credentials works
- [ ] Login with Google works
- [ ] Login with GitHub works
- [ ] Registration works
- [ ] Email verification works
- [ ] Password reset works
- [ ] 2FA works
- [ ] Session management works
- [ ] Logout works

### Authorization
- [ ] Role-based access control works
- [ ] Admin routes protected
- [ ] Teacher routes protected
- [ ] Student routes protected
- [ ] Parent routes protected
- [ ] API routes protected
- [ ] Middleware enforces permissions

### Security
- [ ] Passwords hashed with bcrypt
- [ ] Sessions stored in database
- [ ] CSRF protection enabled
- [ ] Rate limiting works
- [ ] IP whitelisting works (admin routes)
- [ ] Audit logging works

## Troubleshooting

### Migration Fails

**Symptom:** Migration command fails with error

**Solution:**
1. Check database connection
2. Review migration SQL for syntax errors
3. Check for conflicting migrations
4. Verify database user has sufficient permissions
5. Try rollback and re-apply

### Users Can't Login

**Symptom:** Users get "Invalid credentials" error

**Solution:**
1. Check if user migration completed
2. Verify password setup emails were sent
3. Check if emailVerified is set correctly
4. Verify session table is working
5. Check application logs for errors

### OAuth Not Working

**Symptom:** OAuth login fails or redirects incorrectly

**Solution:**
1. Verify OAuth credentials in environment variables
2. Check OAuth callback URLs in provider settings
3. Verify AUTH_URL is set correctly
4. Check for CORS issues
5. Review NextAuth debug logs

### Sessions Expiring Too Quickly

**Symptom:** Users logged out frequently

**Solution:**
1. Check session maxAge configuration (should be 1800 seconds)
2. Verify session update mechanism works
3. Check for session cleanup job conflicts
4. Review middleware session validation

### 2FA Not Working

**Symptom:** 2FA codes not accepted

**Solution:**
1. Verify TOTP secret is decrypted correctly
2. Check time synchronization on server
3. Verify OTPAuth library is working
4. Check 2FA fields preserved in migration
5. Test with backup codes

## Rollback Procedure

If critical issues occur and you need to rollback:

### Immediate Rollback

```bash
# 1. Revert to previous deployment
git revert HEAD
git push production main

# 2. Rollback database migration
psql $DATABASE_URL -f prisma/migrations/20251228043745_add_nextauth_tables/rollback.sql

# 3. Restore Clerk environment variables

# 4. Reinstall Clerk packages
npm install @clerk/nextjs @clerk/clerk-sdk-node

# 5. Deploy
git push production main
```

### Data Recovery

If user data was affected:

```bash
# Restore from backup
psql $DATABASE_URL < backup_production_YYYYMMDD_HHMMSS.sql
```

## Support

For issues during migration:
1. Check application logs
2. Review migration logs in `logs/` directory
3. Run verification script: `npx ts-node scripts/verify-nextauth-migration.ts`
4. Check NextAuth documentation: https://authjs.dev/
5. Contact development team

## Post-Migration Tasks

- [ ] Update documentation
- [ ] Train support team on new authentication flows
- [ ] Update user guides
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Plan for clerkId removal
- [ ] Archive Clerk credentials securely
- [ ] Update disaster recovery procedures

## Timeline

Recommended timeline for migration:

- **Week 1:** Schema migration in staging, testing
- **Week 2:** User data migration in staging, testing
- **Week 3:** Code deployment to staging, comprehensive testing
- **Week 4:** Production migration (schema + data + code)
- **Week 5-6:** Monitoring and issue resolution
- **Week 7-8:** Cleanup (remove Clerk code)
- **Week 9-10:** Remove clerkId field

## Success Criteria

Migration is considered successful when:
- All users can authenticate successfully
- No increase in authentication-related errors
- All protected routes remain secure
- Session management works correctly
- 2FA continues to function
- OAuth providers work correctly
- No data loss or corruption
- Performance is maintained or improved
