# Sentry Error Monitoring Setup

The application is configured to work with Sentry for error monitoring in production. Sentry integration is optional but highly recommended.

## Current Status

✅ **Error logging code enabled** - The application will automatically send errors to Sentry when configured
⏸️ **Sentry SDK not installed** - Requires installation and configuration

## Quick Setup

### 1. Install Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

The wizard will:
- Create `sentry.client.config.ts`
- Create `sentry.server.config.ts`
- Create `sentry.edge.config.ts`
- Update `next.config.js`
- Add Sentry to your build process

### 2. Configure Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_auth_token_here
```

Get your DSN from: https://sentry.io/settings/[your-org]/projects/[your-project]/keys/

### 3. Verify Setup

After installation, errors will automatically be captured and sent to Sentry.

**Test error reporting:**

```typescript
// In any component
throw new Error('Test Sentry integration');
```

## Features Enabled

When Sentry is configured, the following features work automatically:

✅ **Client-side error tracking** - All browser errors captured
✅ **Server-side error tracking** - API errors captured
✅ **Error context** - User agent, URL, timestamp included
✅ **Error tags** - Custom tags for filtering
✅ **Source maps** - Readable stack traces in production
✅ **Performance monitoring** - Optional (requires additional config)

## Error Logging Locations

Errors are automatically logged in:

1. **Global Error Boundary** - `src/app/error.tsx`
2. **Error Handler Utility** - `src/lib/utils/error-handler.ts`
3. **API Routes** - Server-side errors
4. **Client Components** - React error boundaries

## Without Sentry

If Sentry is not configured:
- ✅ Errors are still logged to console
- ✅ Application continues to work normally
- ❌ No centralized error tracking
- ❌ No error notifications
- ❌ No error analytics

## Production Best Practices

1. **Always configure Sentry in production** for better monitoring
2. **Set appropriate sample rates** to control cost:
   ```typescript
   tracesSampleRate: 0.1, // 10% of transactions
   ```
3. **Filter sensitive data** using beforeSend:
   ```typescript
   beforeSend(event) {
     // Remove sensitive data
     delete event.request?.cookies;
     return event;
   }
   ```
4. **Set up alerts** in Sentry dashboard for critical errors
5. **Configure releases** to track errors by deployment

## Cost Considerations

Sentry offers:
- **Free tier**: 5,000 errors/month
- **Paid tiers**: Starting at $26/month for more events

For production with moderate traffic, expect:
- ~500-2,000 errors/month for a stable application
- Free tier is usually sufficient for small to medium deployments

## Support

For Sentry setup help:
- Documentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Community: https://forum.sentry.io/
- Support: support@sentry.io

## Alternative Monitoring Solutions

If not using Sentry, consider:
- **LogRocket** - Session replay + error tracking
- **Rollbar** - Error tracking focused
- **Datadog** - Full observability platform
- **New Relic** - Application performance monitoring

To integrate alternative solutions, update:
- `src/lib/utils/error-handler.ts`
- `src/app/error.tsx`
