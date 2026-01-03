# User Migration Guide: Clerk to NextAuth v5

This guide provides step-by-step instructions for migrating users from Clerk authentication to NextAuth v5.

## Overview

The migration process consists of three main steps:

1. **Migrate User Data** - Update user records in the database
2. **Send Password Setup Emails** - Notify users and provide password setup links
3. **Monitor and Support** - Track completion and assist users

## Prerequisites

Before running the migration scripts, ensure:

- ✅ NextAuth v5 is fully configured and tested
- ✅ Database schema has been updated with NextAuth tables
- ✅ Email service (Resend) is configured
- ✅ Environment variables are set correctly
- ✅ You have a database backup

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Email Service
RESEND_API_KEY="re_..."
EMAIL_FROM="School ERP <noreply@schoolerp.com>"

# NextAuth v5
AUTH_SECRET="<32+ character random string>"
AUTH_URL="https://your-domain.com"
```

## Step 1: Migrate User Data

The migration script updates user records to prepare them for NextAuth v5 authentication.

### What It Does

- Reads all users with `clerkId`
- Sets `password` to `null` (users will set their own)
- Sets `emailVerified` based on Clerk verification status
- Sets `name` field for NextAuth compatibility
- Generates password setup tokens (72-hour expiration)
- Logs all actions to audit log
- Generates migration report

### Dry Run (Recommended First)

Always run a dry run first to preview changes:

```bash
npx tsx scripts/migrate-users-to-nextauth.ts --dry-run
```

This will show you:
- How many users will be migrated
- Which users will be skipped and why
- Any potential errors

### Production Migration

Once you've reviewed the dry run results:

```bash
npx tsx scripts/migrate-users-to-nextauth.ts
```

### Expected Output

```
============================================================
User Migration: Clerk to NextAuth v5
============================================================

📊 Fetching users with Clerk authentication...
Found 150 users with Clerk authentication

🔄 Starting user migration...

✓ Migrated user: john.doe@school.com (TEACHER)
✓ Migrated user: jane.smith@school.com (STUDENT)
⊘ Skipped: admin@school.com - User already has password set
...

============================================================
Migration Summary
============================================================
Total users:     150
Migrated:        145
Skipped:         5
Failed:          0

✓ Migration completed successfully

⚠️  Remember to send password setup emails to users
   Run: npx tsx scripts/send-password-setup-emails.ts
```

## Step 2: Send Password Setup Emails

After migrating user data, send password setup emails to all affected users.

### What It Does

- Finds all users who need to set up passwords
- Generates secure password setup links
- Sends beautifully formatted HTML emails
- Tracks email delivery status
- Logs all email sends to audit log
- Handles rate limiting automatically

### Dry Run (Recommended First)

Preview emails without sending:

```bash
npx tsx scripts/send-password-setup-emails.ts --dry-run
```

### Send Emails

Send password setup emails to all users:

```bash
npx tsx scripts/send-password-setup-emails.ts
```

### Batch Processing

Control the batch size to manage rate limits:

```bash
# Send 5 emails at a time (slower but safer)
npx tsx scripts/send-password-setup-emails.ts --batch-size=5

# Send 20 emails at a time (faster)
npx tsx scripts/send-password-setup-emails.ts --batch-size=20
```

### Expected Output

```
============================================================
Send Password Setup Emails
============================================================

📊 Fetching users who need password setup...
Found 145 users who need password setup

📧 Sending password setup emails (batch size: 10)...

Processing batch 1 (10 users)...
✓ Sent password setup email to: john.doe@school.com
✓ Sent password setup email to: jane.smith@school.com
...

============================================================
Email Sending Summary
============================================================
Total users:     145
Emails sent:     145
Skipped:         0
Failed:          0

✓ Password setup emails sent successfully
```

## Step 3: Monitor and Support

### Track Password Setup Completion

Query the database to see how many users have set up their passwords:

```sql
-- Users who still need to set up passwords
SELECT 
  COUNT(*) as pending_users
FROM "User"
WHERE "clerkId" IS NOT NULL 
  AND "password" IS NULL;

-- Users who have completed setup
SELECT 
  COUNT(*) as completed_users
FROM "User"
WHERE "clerkId" IS NOT NULL 
  AND "password" IS NOT NULL;
```

### Resend Emails to Specific Users

If a user didn't receive their email or the token expired, you can resend:

1. Delete the old token:
```sql
DELETE FROM "VerificationToken"
WHERE identifier = 'user@example.com';
```

2. Run the migration script for that user to generate a new token
3. Run the email script to send a new email

### Common Issues and Solutions

#### Issue: User didn't receive email

**Solutions:**
- Check spam/junk folder
- Verify email address is correct in database
- Check Resend dashboard for delivery status
- Resend email using the script

#### Issue: Password setup link expired

**Solutions:**
- Generate new token (delete old one first)
- Run email script again
- Consider extending token expiration in migration script

#### Issue: User forgot which email was used

**Solutions:**
- Search database by name or other identifiers
- Verify identity through other means
- Update email address if needed and resend

#### Issue: Email bounced

**Solutions:**
- Update email address in database
- Contact user through alternative means
- Generate new token and resend

## Email Template Preview

Users will receive a professional email with:

- 🔐 Clear subject line: "Set Up Your Password - School ERP"
- 👤 Personalized greeting with their name
- 📋 Account details (email, role, status)
- 🔘 Prominent "Set Up Password" button
- ⏰ Expiration warning (72 hours)
- 📝 Step-by-step instructions
- 🛡️ Password security tips
- 💬 Support contact information

## Security Considerations

### Token Security

- Tokens are cryptographically secure (32 bytes)
- Tokens expire after 72 hours
- Tokens are single-use (deleted after password setup)
- Tokens are stored in database, not in email

### Password Requirements

Users must create passwords that meet these requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Rate Limiting

The email script includes built-in rate limiting:
- 200ms delay between individual emails
- 2 second delay between batches
- Configurable batch size

## Rollback Procedure

If you need to rollback the migration:

1. **Restore Database Backup**
   ```bash
   # Restore from your backup
   pg_restore -d your_database backup_file.dump
   ```

2. **Clear Verification Tokens**
   ```sql
   DELETE FROM "VerificationToken"
   WHERE identifier IN (
     SELECT email FROM "User" WHERE "clerkId" IS NOT NULL
   );
   ```

3. **Re-enable Clerk**
   - Restore Clerk environment variables
   - Redeploy previous version of application

## Monitoring Queries

### Migration Status

```sql
-- Overall migration status
SELECT 
  COUNT(*) FILTER (WHERE "clerkId" IS NOT NULL) as total_clerk_users,
  COUNT(*) FILTER (WHERE "clerkId" IS NOT NULL AND "password" IS NOT NULL) as completed,
  COUNT(*) FILTER (WHERE "clerkId" IS NOT NULL AND "password" IS NULL) as pending
FROM "User";
```

### Email Delivery Status

```sql
-- Check audit log for email sends
SELECT 
  action,
  "userId",
  details->>'email' as email,
  details->>'messageId' as message_id,
  "createdAt"
FROM "AuditLog"
WHERE action = 'PASSWORD_SETUP_EMAIL_SENT'
ORDER BY "createdAt" DESC
LIMIT 50;
```

### Token Expiration Status

```sql
-- Check for expired tokens
SELECT 
  identifier as email,
  expires,
  CASE 
    WHEN expires < NOW() THEN 'Expired'
    ELSE 'Valid'
  END as status
FROM "VerificationToken"
WHERE identifier IN (
  SELECT email FROM "User" WHERE "clerkId" IS NOT NULL
)
ORDER BY expires;
```

## Timeline Recommendations

### Small Deployment (< 100 users)
- **Day 1**: Run migration script, send emails
- **Day 2-3**: Monitor and provide support
- **Day 4**: Follow up with users who haven't completed setup
- **Day 7**: Cleanup phase (remove clerkId)

### Medium Deployment (100-1000 users)
- **Day 1**: Run migration script
- **Day 2**: Send emails in batches
- **Day 3-7**: Monitor and provide support
- **Day 8-10**: Follow up with pending users
- **Day 14**: Cleanup phase

### Large Deployment (> 1000 users)
- **Week 1**: Run migration script, send emails in batches
- **Week 2-3**: Monitor, support, and follow up
- **Week 4**: Final follow-ups
- **Week 5**: Cleanup phase

## Support Resources

### For Administrators

- Migration script logs: Check console output
- Audit logs: Query `AuditLog` table
- Email delivery: Check Resend dashboard
- Database queries: Use provided SQL queries

### For Users

Provide users with:
- Clear instructions in the email
- Support contact information
- FAQ document
- Video tutorial (optional)

## Post-Migration Checklist

After migration is complete:

- [ ] All users have received password setup emails
- [ ] Email delivery rate is > 95%
- [ ] Support tickets are being addressed
- [ ] Password setup completion rate is tracked
- [ ] Follow-up plan is in place for pending users
- [ ] Rollback procedure is documented and tested
- [ ] Monitoring is in place for login attempts
- [ ] Success metrics are being tracked

## Success Metrics

Track these metrics to measure migration success:

1. **Email Delivery Rate**: % of emails successfully delivered
2. **Password Setup Rate**: % of users who set up passwords
3. **Time to Complete**: Average time from email to password setup
4. **Support Tickets**: Number of migration-related support requests
5. **Login Success Rate**: % of successful logins post-migration

## Troubleshooting

### Script Errors

**Error: "RESEND_API_KEY is not configured"**
- Solution: Set the `RESEND_API_KEY` environment variable

**Error: "User not found"**
- Solution: Verify user ID exists in database

**Error: "Failed to send email"**
- Solution: Check Resend API status and credentials

### Database Errors

**Error: "Unique constraint violation"**
- Solution: Check for duplicate verification tokens

**Error: "Foreign key constraint violation"**
- Solution: Ensure user relationships are intact

## Additional Resources

- [NextAuth v5 Documentation](https://authjs.dev/)
- [Resend Documentation](https://resend.com/docs)
- [Migration Design Document](.kiro/specs/clerk-to-nextauth-migration/design.md)
- [Migration Requirements](.kiro/specs/clerk-to-nextauth-migration/requirements.md)

## Support

For questions or issues:
- Check the troubleshooting section above
- Review audit logs for detailed information
- Contact the development team
- Refer to the design and requirements documents
