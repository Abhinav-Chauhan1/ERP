# Rate Limiting Quick Reference

## TL;DR

**Problem:** Vercel deployment getting 429 errors  
**Solution:** IP whitelisting + header detection  
**Status:** ✅ Production-ready

## Quick Setup

### 1. Environment Variables

Add to `.env`:

```bash
WHITELISTED_IPS=127.0.0.1,::1
MONITORING_SERVICE_IPS=
TRUSTED_IPS=
```

### 2. Deploy

```bash
git add .
git commit -m "feat: Production rate limiting with IP whitelist"
git push
```

### 3. Verify

Check Vercel logs - should see no 429 errors during build.

## How It Works

```
Request → Check Headers → Check IP → Apply Rate Limit
            ↓ (Vercel)     ↓ (Trusted)   ↓ (User)
          Bypass         Bypass        Limit
```

## Detection Methods (Priority Order)

1. **Vercel Headers** (x-vercel-id) - Most reliable
2. **Environment** (VERCEL_ENV=preview) - Simple
3. **IP Whitelist** (Configured IPs) - Secure
4. **User Agent** (vercel-bot) - Fallback

## What Gets Bypassed

✅ Vercel infrastructure  
✅ Health checks  
✅ Monitoring services  
✅ Trusted IPs  
✅ Development mode  

❌ Production user traffic (rate limited)

## Configuration

### Add Monitoring Service IP

```bash
# .env
MONITORING_SERVICE_IPS=1.2.3.4,5.6.7.8
```

### Add Office IP

```bash
# .env
TRUSTED_IPS=192.168.1.0/24
```

### Add CI/CD Server

```bash
# .env
TRUSTED_IPS=10.0.0.50
```

## Testing

### Local

```bash
npm run dev
# Rate limiting bypassed in development
```

### Production

```bash
# Should bypass (from whitelisted IP)
curl https://your-domain.com/api/health

# Should rate limit (from non-whitelisted IP)
for i in {1..20}; do curl https://your-domain.com/api/test; done
```

## Monitoring

Check logs for bypass events:

```
[Rate Limit Bypass] /api/auth/session - Reason: vercel_infrastructure
```

## Troubleshooting

### Still Getting 429 Errors?

1. Check Vercel headers in logs
2. Add Vercel IPs to whitelist
3. Increase rate limits

### Too Many Bypasses?

1. Audit whitelist
2. Remove unnecessary IPs
3. Tighten user agent checks

## Files Modified

- `src/lib/middleware/ip-whitelist.ts` (new)
- `middleware.ts` (updated)
- `.env.example` (updated)

## Documentation

Full docs: [PRODUCTION_RATE_LIMITING_SOLUTION.md](./PRODUCTION_RATE_LIMITING_SOLUTION.md)

## Security

✅ Header detection (cannot be spoofed)  
✅ Environment-based (preview only)  
✅ IP whitelist (configurable)  
⚠️ User agent (can be spoofed - fallback only)

## Rate Limits

| Endpoint | Window | Max Requests |
|----------|--------|--------------|
| Auth | 15 min | 10 |
| API | 15 min | 100 |
| General | 15 min | 1000 |

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Monitor logs
3. ✅ Verify no 429 errors
4. ⏳ Add monitoring service IPs (if needed)
5. ⏳ Add office IPs (if needed)
6. ⏳ Set up alerts for high bypass rate
