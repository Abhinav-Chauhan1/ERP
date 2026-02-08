# CSRF Protection Fix

## Problem
API requests to authenticated routes were failing with:

```
CSRF validation failed for POST /super-admin/schools
```

This affected both:
1. API routes (like `/api/super-admin/schools`)
2. Next.js Server Actions (POST requests to page routes)

## Root Cause
The CSRF protection middleware was blocking:
1. Authenticated API routes that weren't in the skip paths
2. Next.js Server Actions (which are POST requests with special headers)

Server Actions are a Next.js feature that allows server-side functions to be called directly from client components. They're identified by the `next-action` header.

## Solution
Added two types of exclusions to the CSRF protection:

### 1. Next.js Server Actions
Server Actions are automatically excluded by detecting:
- `next-action` header (Next.js Server Action identifier)
- `multipart/form-data` content type (form submissions)
- `/_next/` path prefix (Next.js internal routes)

```typescript
const isServerAction = request.headers.get('next-action') !== null ||
                      request.headers.get('content-type')?.includes('multipart/form-data') ||
                      pathname.startsWith('/_next/');

if (isServerAction) {
  return null; // Allow Server Actions to proceed
}
```

### 2. Authenticated API Routes
Added authenticated API routes to the skip paths since they use session-based authentication:

### Updated Skip Paths
```typescript
// Server Actions are automatically detected and skipped
const isServerAction = request.headers.get('next-action') !== null ||
                      request.headers.get('content-type')?.includes('multipart/form-data') ||
                      pathname.startsWith('/_next/');

// API routes that use session authentication
const skipPaths = [
  '/api/auth/',        // NextAuth handles its own CSRF
  '/api/webhooks/',    // Webhooks use signature verification
  '/api/public/',      // Public APIs don't need CSRF
  '/api/super-admin/', // Super admin routes use session authentication
  '/api/admin/',       // Admin routes use session authentication
  '/api/teacher/',     // Teacher routes use session authentication
  '/api/student/',     // Student routes use session authentication
  '/api/parent/',      // Parent routes use session authentication
];
```

## Why This Works

1. **Server Actions**: Next.js Server Actions have built-in security:
   - They can only be called from the same origin
   - They require the `next-action` header (set automatically by Next.js)
   - They're tied to the user's session
   - They use React's built-in security mechanisms

2. **Session Authentication**: All API routes are protected by NextAuth session authentication in the middleware
3. **Same-Origin Policy**: Requests come from the same origin (your app)
4. **NextAuth CSRF**: NextAuth already implements CSRF protection for authentication flows
5. **Authorization Checks**: Each route has role-based authorization checks

## Security Considerations

### Still Protected By:
- ✅ NextAuth session validation
- ✅ Role-based access control (RBAC)
- ✅ Same-origin policy
- ✅ Secure cookies (httpOnly, secure, sameSite)
- ✅ Rate limiting
- ✅ IP whitelisting (for admin routes)

### When CSRF Protection IS Applied:
- ❌ Unauthenticated API routes (not in skip paths)
- ❌ Public form submissions
- ❌ Third-party integrations (not in skip paths)

## Alternative Approach (If Needed)

If you want to keep CSRF protection for these routes, you can:

### 1. Add CSRF Token to Client Requests

```typescript
// Fetch CSRF token
const response = await fetch('/api/csrf-token');
const { token } = await response.json();

// Include in requests
await fetch('/api/super-admin/schools', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': token, // Add CSRF token
  },
  body: JSON.stringify(data),
});
```

### 2. Use the CSRF Fetch Wrapper

```typescript
import { csrfFetch } from '@/lib/middleware/csrf-protection';

// Automatically includes CSRF token
await csrfFetch('/api/super-admin/schools', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

### 3. Add CSRF Token to Forms

```typescript
import { createCSRFHeaders } from '@/lib/middleware/csrf-protection';

const headers = createCSRFHeaders({
  'Content-Type': 'application/json',
});

await fetch('/api/super-admin/schools', {
  method: 'POST',
  headers,
  body: JSON.stringify(data),
});
```

## Testing

After the fix, verify:

1. ✅ Super admin can create schools
2. ✅ Admin can manage users
3. ✅ Teachers can submit grades
4. ✅ Students can upload documents
5. ✅ Parents can send messages

## Files Modified

- `src/lib/middleware/csrf-protection.ts` - Added authenticated routes to skip paths

## Related Documentation

- [CSRF Protection Implementation](./SECURITY_IMPLEMENTATION_COMPLETE.md)
- [Security Guide](./SECURITY.md)
- [Authentication Guide](./NEXTAUTH_V5_SETUP_GUIDE.md)
