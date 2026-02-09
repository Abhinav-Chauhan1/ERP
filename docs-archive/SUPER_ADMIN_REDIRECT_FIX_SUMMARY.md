# Super Admin Redirect to Localhost - URGENT FIX

## The Problem
Super admin login redirects to `localhost` in production.

## The Root Cause
**Missing `ROOT_DOMAIN` environment variable in production.**

In `middleware.ts` (lines 118-122), when accessing `/super-admin` from a subdomain, the code redirects to the main domain:

```typescript
if (pathname.startsWith('/super-admin')) {
  const mainDomainUrl = new URL(req.url);
  mainDomainUrl.hostname = process.env.ROOT_DOMAIN || 'localhost';  // ← DEFAULTS TO LOCALHOST!
  return NextResponse.redirect(mainDomainUrl);
}
```

If `ROOT_DOMAIN` is not set, it defaults to `'localhost'`, causing production redirects to localhost.

## The Fix

### Add these environment variables to your production deployment:

```bash
# CRITICAL - prevents localhost redirects
ROOT_DOMAIN=yourdomain.com
NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com

# Also verify these are correct:
AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
AUTH_TRUST_HOST=true
```

### Important Notes:
- `ROOT_DOMAIN` should be **just the domain** (e.g., `sikshamitra.com`)
- **NO protocol** (no `https://`)
- **NO paths** (no `/sd` or `/super-admin`)
- **NO port numbers** (no `:3000`)

### For Vercel:
1. Go to Project Settings → Environment Variables
2. Add `ROOT_DOMAIN` = `yourdomain.com`
3. Add `NEXT_PUBLIC_ROOT_DOMAIN` = `yourdomain.com`
4. Verify `AUTH_URL` = `https://yourdomain.com`
5. Redeploy

### For Railway:
1. Go to Project → Variables
2. Add the same variables as above
3. Redeploy

## Verification

After deploying with the correct environment variables:

1. Go to `https://yourdomain.com/sd`
2. Login with super-admin credentials
3. Should redirect to `https://yourdomain.com/super-admin`
4. Should NOT redirect to `localhost`

## Files Updated

1. `.env` - Added ROOT_DOMAIN with documentation
2. `.env.example` - Added ROOT_DOMAIN with documentation
3. `scripts/validate-env-vars.ts` - Added ROOT_DOMAIN validation
4. `docs/SUPER_ADMIN_LOGIN_REDIRECT_FIX.md` - Updated with ROOT_DOMAIN fix
5. `src/components/auth/super-admin-login-form.tsx` - Added redirect validation

## Run Validation

Before deploying, run:

```bash
npm run validate-env
```

This will check for missing or incorrect environment variables.
