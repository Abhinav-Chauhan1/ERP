# Super Admin Login Redirect Issue - Fix Guide

## Problem
Super admin login redirects to `localhost/sd` in production instead of the correct super-admin dashboard.

## Root Causes

There are TWO potential root causes for this issue:

### 1. Missing or Incorrect ROOT_DOMAIN Environment Variable (Most Common)

The middleware redirects super-admin routes from subdomains to the main domain. If `ROOT_DOMAIN` is not set or is set to `localhost`, it will redirect to `localhost` even in production.

**Location:** `middleware.ts` lines 118-122

```typescript
if (pathname.startsWith('/super-admin')) {
  const mainDomainUrl = new URL(req.url);
  mainDomainUrl.hostname = process.env.ROOT_DOMAIN || 'localhost';  // ← ISSUE HERE
  return NextResponse.redirect(mainDomainUrl);
}
```

### 2. Incorrect AUTH_URL Environment Variable

NextAuth uses `AUTH_URL` as the base for all redirects. If this includes path segments or is set to localhost in production, redirects will fail.

## Solution

### 1. Check Production Environment Variables

Verify your production environment variables (Vercel, Railway, etc.):

```bash
# ❌ WRONG - ROOT_DOMAIN not set or set to localhost
ROOT_DOMAIN=localhost  # or missing entirely

# ✅ CORRECT - set to your actual domain
ROOT_DOMAIN=sikshamitra.com
NEXT_PUBLIC_ROOT_DOMAIN=sikshamitra.com

# ❌ WRONG - AUTH_URL includes /sd in the path
AUTH_URL=https://yourdomain.com/sd

# ✅ CORRECT - base domain only
AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Update Environment Variables

**For Vercel:**
1. Go to your project settings
2. Navigate to Environment Variables
3. Add or update these variables:
   - `ROOT_DOMAIN` = `yourdomain.com` (without https://)
   - `NEXT_PUBLIC_ROOT_DOMAIN` = `yourdomain.com`
   - `AUTH_URL` = `https://yourdomain.com` (no path segments)
   - `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`
4. Redeploy your application

**For Railway:**
1. Go to your project settings
2. Navigate to Variables
3. Add or update the same variables as above
4. Redeploy

**For other platforms:**
Update these environment variables in your deployment configuration.

### 3. Verify Other Auth Variables

Ensure these are also correctly set:

```bash
# Domain configuration (CRITICAL - prevents localhost redirects)
ROOT_DOMAIN=yourdomain.com
NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com

# Base URL for your application
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# NextAuth configuration
AUTH_URL=https://yourdomain.com
AUTH_TRUST_HOST=true

# Generate a new secret for production
AUTH_SECRET=your_generated_secret_here
```

### 4. Code Changes Applied

The following code changes have been made to prevent this issue:

#### `src/components/auth/super-admin-login-form.tsx`
- Added explicit `callbackUrl: '/super-admin'` to the signIn call
- Added redirect URL validation to prevent `/sd` redirects
- Ensures super-admin always goes to `/super-admin` dashboard

#### `src/auth.config.ts`
- Updated redirect callback with better documentation
- Clarified that role-based routing is handled by the form and middleware

### 5. Testing

After updating environment variables and redeploying:

1. Navigate to `https://yourdomain.com/sd`
2. Login with super-admin credentials
3. Verify you're redirected to `https://yourdomain.com/super-admin`
4. Check browser console for any errors

### 6. Common Mistakes to Avoid

❌ **Don't forget ROOT_DOMAIN (most common issue):**
```bash
# Missing ROOT_DOMAIN causes localhost redirects
# Add these to your production environment:
ROOT_DOMAIN=yourdomain.com
NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com
```

❌ **Don't include protocol in ROOT_DOMAIN:**
```bash
ROOT_DOMAIN=https://yourdomain.com  # WRONG
ROOT_DOMAIN=yourdomain.com  # CORRECT
```

❌ **Don't include paths in AUTH_URL:**
```bash
AUTH_URL=https://yourdomain.com/sd  # WRONG
AUTH_URL=https://yourdomain.com/login  # WRONG
AUTH_URL=https://yourdomain.com  # CORRECT
```

✅ **Use base domain only:**
```bash
ROOT_DOMAIN=yourdomain.com
AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

❌ **Don't use localhost in production:**
```bash
ROOT_DOMAIN=localhost  # WRONG for production
AUTH_URL=http://localhost:3000  # WRONG for production
```

✅ **Use your actual production domain:**
```bash
ROOT_DOMAIN=yourdomain.com
AUTH_URL=https://yourdomain.com
```

### 7. Debugging

If the issue persists, check:

1. **Browser Console:** Look for redirect loops or errors
2. **Network Tab:** Check the redirect chain after login
3. **Server Logs:** Look for NextAuth errors or warnings
4. **Environment Variables:** Verify they're loaded correctly in production

```javascript
// Add this temporarily to your super-admin login form to debug
console.log('AUTH_URL:', process.env.AUTH_URL)
console.log('APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
```

### 8. Prevention

To prevent this issue in the future:

1. Use environment variable templates (`.env.example`)
2. Document required environment variables
3. Add validation for critical environment variables at build time
4. Use deployment checklists

## Related Files

- `src/components/auth/super-admin-login-form.tsx` - Super admin login form
- `src/auth.config.ts` - NextAuth configuration
- `src/auth.ts` - NextAuth setup
- `middleware.ts` - Route protection and redirects
- `.env.example` - Environment variable template

## Additional Notes

- The `/sd` route is the super-admin login page
- After successful authentication, users should be redirected to `/super-admin` (the dashboard)
- The middleware handles role-based route protection
- NextAuth's redirect callback should only handle URL normalization, not role-based routing
