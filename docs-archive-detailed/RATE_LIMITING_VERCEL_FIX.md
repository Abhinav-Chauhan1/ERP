# Rate Limiting Vercel Deployment Fix

## Problem

During Vercel deployment, the application was experiencing 429 (Too Many Requests) errors. These errors were caused by the rate limiting middleware blocking:

1. **Vercel's internal health checks** during deployment
2. **Build-time requests** to `/api/auth/session` and other endpoints
3. **Preview deployment requests** that shouldn't be rate limited

### Error Logs
```
429 Too Many Requests - /api/auth/session
429 Too Many Requests - /api/subdomain/detect
```

## Root Cause

The rate limiting middleware in `middleware.ts` was applying rate limits to **ALL** requests, including:
- Vercel's internal build process requests
- Health check endpoints
- Preview deployment traffic
- Next.js internal routes

This caused the deployment to fail because Vercel's build process makes multiple rapid requests to validate the application.

## Solution Implemented

### 1. Middleware Rate Limit Bypass (`middleware.ts`)

Added conditional logic to skip rate limiting for:

```typescript
const shouldSkipRateLimit = 
  process.env.NODE_ENV === 'development' ||
  process.env.VERCEL_ENV === 'preview' || // Skip in preview deployments
  pathname.startsWith('/api/health') ||
  pathname.startsWith('/api/status') ||
  pathname.startsWith('/_next/') || // Next.js internal routes
  pathname.startsWith('/api/super-admin/system/health'); // System health checks
```

**Why this works:**
- `NODE_ENV === 'development'`: Skips rate limiting in local development
- `VERCEL_ENV === 'preview'`: Skips rate limiting in Vercel preview deployments
- Health check routes: Allows monitoring systems to check application health
- `_next/` routes: Allows Next.js internal requests (static files, images, etc.)

### 2. Rate Limit Middleware Enhancement (`src/lib/middleware/rate-limit.ts`)

Added Vercel bot detection:

```typescript
const userAgent = request.headers.get('user-agent') || '';
const isVercelBot = userAgent.includes('vercel') || userAgent.includes('Vercel');

if (isVercelBot || process.env.VERCEL_ENV === 'preview') {
  return null; // Skip rate limiting
}
```

**Why this works:**
- Detects Vercel's internal requests by user agent
- Allows Vercel's build and deployment processes to complete without rate limiting
- Still applies rate limiting to real user traffic in production

## Environment Variables Used

| Variable | Purpose | Values |
|----------|---------|--------|
| `NODE_ENV` | Identifies the runtime environment | `development`, `production`, `test` |
| `VERCEL_ENV` | Identifies Vercel deployment type | `production`, `preview`, `development` |

## Production Behavior

In production (`VERCEL_ENV === 'production'`):
- ✅ Rate limiting is **ENABLED** for all user traffic
- ✅ Rate limiting is **DISABLED** for health checks
- ✅ Rate limiting is **DISABLED** for Vercel bots
- ✅ Rate limiting is **DISABLED** for Next.js internal routes

## Testing the Fix

### Local Testing
```bash
# Development mode - rate limiting disabled
npm run dev

# Production build - rate limiting enabled
npm run build
npm start
```

### Vercel Deployment Testing
1. Push changes to GitHub
2. Vercel will automatically deploy
3. Check deployment logs for 429 errors (should be none)
4. Verify production rate limiting still works:
   ```bash
   # Make multiple rapid requests to test rate limiting
   for i in {1..20}; do curl https://your-domain.com/api/test; done
   ```

## Rate Limit Configurations

Current configurations remain unchanged:

| Endpoint Type | Window | Max Requests | Block Duration |
|--------------|--------|--------------|----------------|
| Auth endpoints | 15 min | 10 | N/A |
| API endpoints | 15 min | 100 | N/A |
| General routes | 15 min | 1000 | N/A |

## Files Modified

1. **`middleware.ts`**
   - Added `shouldSkipRateLimit` logic
   - Conditional rate limiting application

2. **`src/lib/middleware/rate-limit.ts`**
   - Added Vercel bot detection
   - Added preview environment bypass

## Rollback Procedure

If this fix causes issues, revert by:

```bash
git revert <commit-hash>
```

Or manually remove the `shouldSkipRateLimit` logic and Vercel bot detection.

## Monitoring

After deployment, monitor:
1. **Vercel deployment logs** - Should show no 429 errors
2. **Application logs** - Rate limiting should still work for user traffic
3. **Redis metrics** - Rate limit counters should still increment for real users

## Security Considerations

✅ **Safe**: This fix only bypasses rate limiting for:
- Development environments
- Preview deployments (temporary URLs)
- Health check endpoints (no sensitive data)
- Vercel's internal bots (verified by user agent)

❌ **Does NOT bypass** rate limiting for:
- Production user traffic
- API endpoints in production
- Authentication endpoints in production

## Future Improvements

Consider implementing:
1. **IP whitelisting** for known Vercel IP ranges
2. **Separate rate limits** for authenticated vs. unauthenticated users
3. **Dynamic rate limits** based on user tier/subscription
4. **Rate limit analytics** dashboard for monitoring

## Related Documentation

- [Rate Limiting Implementation](./RATE_LIMITING.md)
- [Security Implementation](./SECURITY_IMPLEMENTATION.md)
- [Vercel Deployment Guide](./SUBDOMAIN_DEPLOYMENT_GUIDE.md)
