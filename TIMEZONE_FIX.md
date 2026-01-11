# Timezone Configuration Fix

## Problem
Production deployment was failing with 500 errors:
```
RangeError: An error occurred while loading instrumentation hook: Invalid time zone specified: :UTC
```

## Root Cause
The `TZ` environment variable in Vercel was set to `:UTC` (with a leading colon), which is an invalid timezone format. The valid format is `UTC` without the colon.

## Solution Applied

### Code Fix (Defensive Programming)
Updated `src/lib/utils/scheduled-backup.ts` to sanitize the timezone value:

```typescript
// Before
timezone: process.env.TZ || 'UTC'

// After
timezone: (process.env.TZ || 'UTC').replace(/^:/, '')
```

This ensures that even if the environment variable is malformed, the application will handle it gracefully.

### Vercel Environment Variable Fix (Required)

**Action Required:** Update the Vercel environment variable:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Find the `TZ` variable
4. Change the value from `:UTC` to `UTC` (remove the leading colon)
5. Redeploy the application

## Deployment Steps

1. **Commit and push the code fix:**
   ```bash
   git add src/lib/utils/scheduled-backup.ts
   git commit -m "fix: sanitize timezone environment variable to handle malformed values"
   git push
   ```

2. **Fix Vercel environment variable:**
   - Update `TZ` from `:UTC` to `UTC` in Vercel dashboard

3. **Verify the fix:**
   - Check that the application loads without 500 errors
   - Monitor the Vercel logs for any timezone-related errors

## Prevention
The code fix adds defensive programming to handle malformed timezone values, so even if the environment variable is misconfigured in the future, the application will continue to work.

## Testing
After deployment, verify:
- ✅ Application loads without 500 errors
- ✅ All routes are accessible
- ✅ No timezone-related errors in logs
- ✅ Scheduled backups work correctly (check logs at 2:00 AM)
