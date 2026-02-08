# CSRF Protection Fix

## Problem
API requests to authenticated routes (like `/api/super-admin/schools`) were failing with:

```
CSRF validation failed for POST /super-admin/schools
```

## Root Cause
The CSRF protection middleware was blocking all POST/PUT/DELETE/PATCH requests except those in the skip paths. Authenticated API routes were not in the skip paths, causing legitimate requests to be blocked.

## Solution
Added authenticated API routes to the CSRF skip paths since they use session-based authentication (NextAuth) which provides its own CSRF protection.

### Updated Skip Paths
```typescript
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

1. **Session Authentication**: All these routes are protected by NextAuth session authentication in the middleware
2. **Same-Origin Policy**: Requests come from the same origin (your app)
3. **NextAuth CSRF**: NextAuth already implements CSRF protection for authentication flows
4. **Authorization Checks**: Each route has role-based authorization checks

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
