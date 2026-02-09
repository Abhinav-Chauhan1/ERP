# Session Cleanup Guide

## Overview

The session cleanup system automatically removes expired sessions from the database to maintain optimal performance and reduce storage usage. This guide covers how to configure and use the session cleanup functionality.

## Why Session Cleanup is Important

1. **Performance**: Expired sessions accumulate over time and can slow down database queries
2. **Storage**: Reduces database storage usage
3. **Security**: Removes stale session data that is no longer needed
4. **Compliance**: Helps meet data retention policies

## Session Expiration

Sessions in the system are configured with:
- **Max Age**: 30 minutes (1800 seconds)
- **Update Age**: 5 minutes (300 seconds)

This means:
- A session expires after 30 minutes of inactivity
- The session expiry is updated every 5 minutes when the user is active
- Expired sessions remain in the database until cleaned up

## Cleanup Methods

### Method 1: Manual Script Execution

Run the cleanup script manually:

```bash
# Basic cleanup
npx tsx scripts/cleanup-expired-sessions.ts

# Dry run (see what would be deleted without deleting)
npx tsx scripts/cleanup-expired-sessions.ts --dry-run

# Verbose output
npx tsx scripts/cleanup-expired-sessions.ts --verbose

# Show statistics
npx tsx scripts/cleanup-expired-sessions.ts --stats --verbose
```

### Method 2: Scheduled Cron Job (Linux/Mac)

Add to your crontab:

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * cd /path/to/your/project && npx tsx scripts/cleanup-expired-sessions.ts >> /var/log/session-cleanup.log 2>&1
```

### Method 3: Windows Task Scheduler

1. Open Task Scheduler
2. Create a new task
3. Set trigger: Daily at 2:00 AM
4. Set action: Start a program
   - Program: `cmd.exe`
   - Arguments: `/c cd /d C:\path\to\project && npx tsx scripts/cleanup-expired-sessions.ts`

### Method 4: Vercel Cron (Recommended for Vercel Deployments)

Create or update `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-sessions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Set the `CRON_SECRET` environment variable in Vercel:

```bash
# Generate a secure secret
openssl rand -base64 32

# Add to Vercel environment variables
CRON_SECRET=your-generated-secret
```

### Method 5: GitHub Actions

Create `.github/workflows/session-cleanup.yml`:

```yaml
name: Session Cleanup

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run cleanup script
        run: npx tsx scripts/cleanup-expired-sessions.ts --verbose
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Method 6: External Cron Service

Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

Configure to call:
```
POST https://your-domain.com/api/cron/cleanup-sessions
Authorization: Bearer YOUR_CRON_SECRET
```

## API Endpoint

### POST /api/cron/cleanup-sessions

Deletes expired sessions.

**Request:**
```bash
curl -X POST https://your-domain.com/api/cron/cleanup-sessions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Response:**
```json
{
  "success": true,
  "deletedCount": 42,
  "message": "Successfully deleted 42 expired session(s)",
  "timestamp": "2025-12-28T10:00:00.000Z"
}
```

### GET /api/cron/cleanup-sessions

Returns session statistics.

**Request:**
```bash
curl https://your-domain.com/api/cron/cleanup-sessions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "active": 108,
    "expired": 42,
    "timestamp": "2025-12-28T10:00:00.000Z"
  }
}
```

## Environment Variables

### Required for API Endpoint Security

```env
# Cron job secret for API endpoint protection
CRON_SECRET=your-secure-random-string
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

## Monitoring

### Check Cleanup Logs

The cleanup process logs to the `AuditLog` table:

```sql
SELECT * FROM "AuditLog" 
WHERE action IN ('SESSION_CLEANUP', 'SESSION_CLEANUP_ERROR')
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Monitor Session Count

```sql
-- Total sessions
SELECT COUNT(*) FROM "Session";

-- Active sessions
SELECT COUNT(*) FROM "Session" WHERE expires > NOW();

-- Expired sessions
SELECT COUNT(*) FROM "Session" WHERE expires <= NOW();
```

### Session Statistics Query

```sql
SELECT 
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE expires > NOW()) as active_sessions,
  COUNT(*) FILTER (WHERE expires <= NOW()) as expired_sessions,
  MIN(expires) as oldest_expiry,
  MAX(expires) as newest_expiry
FROM "Session";
```

## Recommended Cleanup Schedule

| Environment | Frequency | Method |
|-------------|-----------|--------|
| Development | Manual | Script |
| Staging | Daily | Cron/GitHub Actions |
| Production | Daily | Vercel Cron/Cron Job |

## Troubleshooting

### Issue: Cleanup script fails with database connection error

**Solution:**
- Verify `DATABASE_URL` environment variable is set
- Check database connection pooling settings
- Ensure database is accessible from the execution environment

### Issue: Too many expired sessions accumulating

**Solution:**
- Increase cleanup frequency (e.g., twice daily)
- Check if cleanup job is running successfully
- Review session expiration settings

### Issue: Cleanup takes too long

**Solution:**
- Add database index on `Session.expires` field (should already exist)
- Consider batching deletes for very large numbers of sessions
- Run cleanup more frequently to process smaller batches

### Issue: API endpoint returns 401 Unauthorized

**Solution:**
- Verify `CRON_SECRET` environment variable is set
- Check Authorization header format: `Bearer YOUR_SECRET`
- Ensure secret matches between caller and server

## Best Practices

1. **Run cleanup during low-traffic hours** (e.g., 2-4 AM)
2. **Monitor cleanup logs** regularly for errors
3. **Test with --dry-run** before scheduling
4. **Set up alerts** for cleanup failures
5. **Keep cleanup frequency** aligned with session expiration (daily is recommended)
6. **Secure the API endpoint** with a strong CRON_SECRET
7. **Log cleanup results** for audit purposes

## Session Management Utilities

The system also provides utilities for managing sessions programmatically:

```typescript
import {
  updateUserRole,
  updateUserProfile,
  invalidateUserSessions,
  getUserSessions,
  revokeSession
} from "@/lib/utils/session-management"

// Update user role (session will refresh on next request)
await updateUserRole(userId, UserRole.ADMIN)

// Update user profile
await updateUserProfile(userId, {
  name: "John Doe",
  email: "john@example.com"
})

// Invalidate all sessions for a user (except current)
await invalidateUserSessions(userId, currentSessionToken)

// Get all active sessions for a user
const sessions = await getUserSessions(userId)

// Revoke a specific session
await revokeSession(sessionToken)
```

## Related Documentation

- [NextAuth v5 Documentation](https://authjs.dev)
- [Session Management Implementation](../src/lib/utils/session-management.ts)
- [Cleanup Script](../scripts/cleanup-expired-sessions.ts)
- [Cleanup API Route](../src/app/api/cron/cleanup-sessions/route.ts)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review audit logs for error details
3. Consult the NextAuth v5 documentation
4. Contact the development team
