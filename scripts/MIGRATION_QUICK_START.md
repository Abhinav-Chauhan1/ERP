# Quick Start: User Migration to NextAuth v5

## TL;DR

```bash
# 1. Preview migration (no changes)
npx tsx scripts/migrate-users-to-nextauth.ts --dry-run

# 2. Run migration
npx tsx scripts/migrate-users-to-nextauth.ts

# 3. Preview emails (no sending)
npx tsx scripts/send-password-setup-emails.ts --dry-run

# 4. Send emails
npx tsx scripts/send-password-setup-emails.ts
```

## Prerequisites Checklist

- [ ] Database backup created
- [ ] `RESEND_API_KEY` environment variable set
- [ ] `EMAIL_FROM` environment variable set
- [ ] `AUTH_URL` environment variable set
- [ ] NextAuth v5 fully configured and tested

## Step-by-Step

### 1. Backup Database

```bash
# PostgreSQL example
pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Test Migration (Dry Run)

```bash
npx tsx scripts/migrate-users-to-nextauth.ts --dry-run
```

**Expected output:**
- Number of users to migrate
- List of users that will be skipped
- No actual changes made

### 3. Run Migration

```bash
npx tsx scripts/migrate-users-to-nextauth.ts
```

**What happens:**
- User records updated
- Password set to null
- Email verification status preserved
- Password setup tokens generated (72-hour expiration)
- Actions logged to audit log

### 4. Test Email Sending (Dry Run)

```bash
npx tsx scripts/send-password-setup-emails.ts --dry-run
```

**Expected output:**
- Number of emails to send
- Preview of email recipients
- No actual emails sent

### 5. Send Password Setup Emails

```bash
npx tsx scripts/send-password-setup-emails.ts
```

**What happens:**
- Password setup emails sent to all migrated users
- Emails include secure setup links
- Links expire in 72 hours
- Email sends logged to audit log

### 6. Monitor Progress

```sql
-- Check how many users still need to set passwords
SELECT COUNT(*) FROM "User" 
WHERE "clerkId" IS NOT NULL AND "password" IS NULL;
```

## Common Options

### Migration Script

```bash
# Dry run (preview only)
npx tsx scripts/migrate-users-to-nextauth.ts --dry-run

# Production run
npx tsx scripts/migrate-users-to-nextauth.ts
```

### Email Script

```bash
# Dry run (preview only)
npx tsx scripts/send-password-setup-emails.ts --dry-run

# Production run
npx tsx scripts/send-password-setup-emails.ts

# Custom batch size (default: 10)
npx tsx scripts/send-password-setup-emails.ts --batch-size=5

# Combine options
npx tsx scripts/send-password-setup-emails.ts --dry-run --batch-size=20
```

## What Users Will See

Users receive an email with:
- Subject: "Set Up Your Password - School ERP"
- Personalized greeting
- "Set Up Password" button
- 72-hour expiration warning
- Step-by-step instructions
- Password security tips

## Troubleshooting

### "RESEND_API_KEY is not configured"
```bash
# Add to .env file
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="School ERP <noreply@schoolerp.com>"
```

### "No users to migrate"
- Check if users have `clerkId` in database
- Verify database connection

### "Failed to send email"
- Check Resend API key is valid
- Verify email service is configured
- Check Resend dashboard for errors

### User didn't receive email
- Check spam folder
- Verify email address in database
- Check Resend dashboard for delivery status
- Resend email by running script again

### Password setup link expired
- Delete old token from database
- Run migration script again to generate new token
- Send new email

## Quick Checks

### Check migration status
```sql
SELECT 
  COUNT(*) FILTER (WHERE "clerkId" IS NOT NULL) as total,
  COUNT(*) FILTER (WHERE "clerkId" IS NOT NULL AND "password" IS NOT NULL) as completed,
  COUNT(*) FILTER (WHERE "clerkId" IS NOT NULL AND "password" IS NULL) as pending
FROM "User";
```

### Check email sends
```sql
SELECT COUNT(*) 
FROM "AuditLog" 
WHERE action = 'PASSWORD_SETUP_EMAIL_SENT';
```

### Check token expiration
```sql
SELECT 
  identifier,
  expires,
  expires < NOW() as is_expired
FROM "VerificationToken"
ORDER BY expires;
```

## Timeline

**Small deployment (< 100 users):**
- Day 1: Migrate and send emails
- Day 2-3: Monitor and support
- Day 7: Cleanup

**Large deployment (> 1000 users):**
- Week 1: Migrate and send emails
- Week 2-3: Monitor and support
- Week 5: Cleanup

## Need Help?

See the full guide: [MIGRATION_USER_GUIDE.md](./MIGRATION_USER_GUIDE.md)

## Rollback

If something goes wrong:

1. Restore database backup
2. Clear verification tokens
3. Re-enable Clerk
4. Investigate issue before retrying
