# Migration Deployment Checklist

Use this checklist to ensure a smooth migration from Clerk to NextAuth v5.

## Pre-Migration Checklist

### Environment Setup
- [ ] `DATABASE_URL` is configured and tested
- [ ] `RESEND_API_KEY` is configured and valid
- [ ] `EMAIL_FROM` is configured with proper sender address
- [ ] `AUTH_SECRET` is generated (32+ characters)
- [ ] `AUTH_URL` is set to production domain
- [ ] `AUTH_TRUST_HOST` is set to `true` for production
- [ ] OAuth credentials configured (if using OAuth)
  - [ ] `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`
  - [ ] `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`

### Database Preparation
- [ ] Database backup created and verified
- [ ] Backup restoration tested in staging
- [ ] NextAuth v5 tables exist in database
  - [ ] `Account` table
  - [ ] `Session` table
  - [ ] `VerificationToken` table
- [ ] User model has required fields
  - [ ] `password` (nullable)
  - [ ] `emailVerified` (nullable DateTime)
  - [ ] `name` (nullable)
  - [ ] `image` (nullable)
- [ ] Database indexes are in place

### Application Readiness
- [ ] NextAuth v5 is fully configured
- [ ] Authentication flows tested in staging
- [ ] Login page works with credentials
- [ ] OAuth providers tested (if applicable)
- [ ] Password reset flow works
- [ ] Email verification works
- [ ] 2FA integration tested
- [ ] Session management works correctly
- [ ] Middleware protects routes properly
- [ ] API routes are protected

### Testing in Staging
- [ ] Migration script tested with dry-run
- [ ] Migration script executed successfully
- [ ] Email script tested with dry-run
- [ ] Test emails received and links work
- [ ] Password setup flow tested end-to-end
- [ ] Login with new password works
- [ ] All user roles tested (Admin, Teacher, Student, Parent)
- [ ] No data loss verified
- [ ] Relationships preserved

### Documentation
- [ ] Migration guide reviewed
- [ ] Quick start guide available
- [ ] Support team briefed
- [ ] User communication prepared
- [ ] FAQ document created
- [ ] Rollback procedure documented

### Communication
- [ ] Users notified about upcoming migration
- [ ] Timeline communicated
- [ ] Support channels prepared
- [ ] Maintenance window scheduled (if needed)

## Migration Day Checklist

### Pre-Migration (1-2 hours before)
- [ ] Final database backup created
- [ ] Backup verified and stored securely
- [ ] Support team on standby
- [ ] Monitoring tools ready
- [ ] Rollback procedure reviewed

### Migration Execution

#### Step 1: Database Migration
- [ ] Run migration script in dry-run mode
  ```bash
  npx tsx scripts/migrate-users-to-nextauth.ts --dry-run
  ```
- [ ] Review dry-run output
- [ ] Verify expected number of users
- [ ] Check for any errors or warnings
- [ ] Run migration script in production
  ```bash
  npx tsx scripts/migrate-users-to-nextauth.ts
  ```
- [ ] Verify migration completed successfully
- [ ] Check migration statistics
- [ ] Review any errors
- [ ] Verify database changes
  ```sql
  SELECT COUNT(*) FROM "User" WHERE "clerkId" IS NOT NULL AND "password" IS NULL;
  ```

#### Step 2: Email Sending
- [ ] Run email script in dry-run mode
  ```bash
  npx tsx scripts/send-password-setup-emails.ts --dry-run
  ```
- [ ] Review dry-run output
- [ ] Verify expected number of emails
- [ ] Run email script in production
  ```bash
  npx tsx scripts/send-password-setup-emails.ts --batch-size=10
  ```
- [ ] Monitor email sending progress
- [ ] Check for any failures
- [ ] Verify email delivery in Resend dashboard
- [ ] Test password setup link from received email

#### Step 3: Verification
- [ ] Test password setup flow
- [ ] Test login with new password
- [ ] Test all user roles
- [ ] Verify session management
- [ ] Check audit logs
  ```sql
  SELECT * FROM "AuditLog" 
  WHERE action IN ('USER_MIGRATION', 'PASSWORD_SETUP_EMAIL_SENT')
  ORDER BY "createdAt" DESC;
  ```

### Post-Migration (First Hour)
- [ ] Monitor login attempts
- [ ] Check for authentication errors
- [ ] Monitor support tickets
- [ ] Verify email delivery rate
- [ ] Check password setup completion rate
- [ ] Review error logs
- [ ] Respond to user questions

## Monitoring Checklist (First 24 Hours)

### Metrics to Track
- [ ] Email delivery rate (target: >95%)
- [ ] Password setup completion rate
- [ ] Login success rate
- [ ] Authentication errors
- [ ] Support ticket volume
- [ ] User feedback

### Database Queries

#### Migration Status
```sql
SELECT 
  COUNT(*) FILTER (WHERE "clerkId" IS NOT NULL) as total_migrated_users,
  COUNT(*) FILTER (WHERE "clerkId" IS NOT NULL AND "password" IS NOT NULL) as completed_setup,
  COUNT(*) FILTER (WHERE "clerkId" IS NOT NULL AND "password" IS NULL) as pending_setup,
  ROUND(100.0 * COUNT(*) FILTER (WHERE "clerkId" IS NOT NULL AND "password" IS NOT NULL) / 
        NULLIF(COUNT(*) FILTER (WHERE "clerkId" IS NOT NULL), 0), 2) as completion_percentage
FROM "User";
```

#### Email Delivery Status
```sql
SELECT 
  COUNT(*) as total_emails_sent,
  COUNT(DISTINCT "userId") as unique_users
FROM "AuditLog"
WHERE action = 'PASSWORD_SETUP_EMAIL_SENT'
  AND "createdAt" > NOW() - INTERVAL '24 hours';
```

#### Token Status
```sql
SELECT 
  COUNT(*) as total_tokens,
  COUNT(*) FILTER (WHERE expires > NOW()) as active_tokens,
  COUNT(*) FILTER (WHERE expires <= NOW()) as expired_tokens
FROM "VerificationToken"
WHERE identifier IN (
  SELECT email FROM "User" WHERE "clerkId" IS NOT NULL
);
```

#### Recent Login Attempts
```sql
SELECT 
  action,
  COUNT(*) as count
FROM "AuditLog"
WHERE action LIKE '%LOGIN%'
  AND "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY action;
```

## Follow-Up Checklist (First Week)

### Daily Tasks
- [ ] Check password setup completion rate
- [ ] Monitor support tickets
- [ ] Review error logs
- [ ] Respond to user questions
- [ ] Track email delivery issues
- [ ] Resend emails to users who didn't receive them

### User Support
- [ ] Respond to password setup questions
- [ ] Help users with expired tokens
- [ ] Assist with email delivery issues
- [ ] Guide users through password requirements
- [ ] Handle account access issues

### Communication
- [ ] Send reminder emails to users who haven't set up passwords (Day 3)
- [ ] Send final reminder before token expiration (Day 5)
- [ ] Provide progress updates to stakeholders

## Cleanup Checklist (After 2 Weeks)

### Verification
- [ ] >90% of users have set up passwords
- [ ] All critical users have access
- [ ] No major issues reported
- [ ] Support ticket volume normalized

### Database Cleanup
- [ ] Remove expired verification tokens
  ```sql
  DELETE FROM "VerificationToken"
  WHERE expires < NOW();
  ```
- [ ] Consider removing `clerkId` field (after verification)
  ```sql
  -- Create migration to drop clerkId column
  -- Only after confirming all users have migrated successfully
  ```

### Documentation
- [ ] Update user documentation
- [ ] Remove Clerk references
- [ ] Update onboarding guides
- [ ] Archive migration documentation

## Rollback Checklist (If Needed)

### Immediate Actions
- [ ] Stop migration process
- [ ] Restore database backup
- [ ] Clear verification tokens
  ```sql
  DELETE FROM "VerificationToken"
  WHERE identifier IN (
    SELECT email FROM "User" WHERE "clerkId" IS NOT NULL
  );
  ```
- [ ] Re-enable Clerk authentication
- [ ] Notify users of temporary issue
- [ ] Document issues encountered

### Investigation
- [ ] Review error logs
- [ ] Identify root cause
- [ ] Document lessons learned
- [ ] Plan corrective actions
- [ ] Test fixes in staging
- [ ] Schedule retry

## Success Criteria

Migration is considered successful when:
- [ ] >95% email delivery rate achieved
- [ ] >80% password setup completion rate (within 1 week)
- [ ] <5% support ticket rate
- [ ] No critical authentication issues
- [ ] All user roles functioning correctly
- [ ] Session management working properly
- [ ] No data loss or corruption
- [ ] Positive user feedback

## Emergency Contacts

### Technical Team
- Lead Developer: [Name] - [Contact]
- Database Admin: [Name] - [Contact]
- DevOps Engineer: [Name] - [Contact]

### Support Team
- Support Lead: [Name] - [Contact]
- Support Email: [Email]
- Support Phone: [Phone]

### Vendors
- Resend Support: support@resend.com
- Database Provider: [Contact]

## Notes

Use this space to document any issues, observations, or important information during the migration:

---

**Migration Date:** _______________

**Migration Lead:** _______________

**Start Time:** _______________

**End Time:** _______________

**Total Users Migrated:** _______________

**Issues Encountered:** 

---

**Completion Status:** [ ] Successful [ ] Partial [ ] Rolled Back

**Sign-off:** _______________  Date: _______________
