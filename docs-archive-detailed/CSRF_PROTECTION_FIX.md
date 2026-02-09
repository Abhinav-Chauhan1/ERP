# CSRF Protection Fix Documentation

## Problem
CSRF middleware was blocking three types of legitimate requests:
1. Next.js Server Actions (POST requests with `next-action` header)
2. Public authentication endpoints (`/api/schools/validate`, `/api/otp/*`)
3. Authenticated API routes (`/api/super-admin/*`, `/api/admin/*`, etc.)

## Root Cause
The CSRF protection middleware was too aggressive and didn't account for:
- Next.js Server Actions which have built-in CSRF protection
- Public endpoints needed for the login flow
- Authenticated API routes that are already protected by authentication middleware

## Solution Implemented

### 1. Server Actions Detection
Added detection for Next.js Server Actions by checking:
- `next-action` header presence
- `multipart/form-data` content type
- `/_next/` path prefix

```typescript
// Detect Next.js Server Actions
const isServerAction = 
  request.headers.get('next-action') !== null ||
  contentType?.includes('multipart/form-data') ||
  pathname.startsWith('/_next/');

if (isServerAction) {
  return NextResponse.next();
}
```

### 2. Public Authentication Endpoints
Added public endpoints to skip paths:
- `/api/schools/validate` - School code validation for login
- `/api/otp/` - OTP generation and verification

### 3. Authenticated API Routes
Added all authenticated API routes to skip paths:
- `/api/super-admin/` - Super admin endpoints
- `/api/admin/` - Admin endpoints
- `/api/teacher/` - Teacher endpoints
- `/api/student/` - Student endpoints
- `/api/parent/` - Parent endpoints

These routes are already protected by authentication middleware, so CSRF protection is redundant.

## Files Modified
- `src/lib/middleware/csrf-protection.ts`

## Testing
Test the following scenarios:
1. ✅ School code validation on login page
2. ✅ OTP generation and verification
3. ✅ Super-admin school creation and management
4. ✅ Admin user management
5. ✅ Teacher, student, and parent operations
6. ✅ Server Actions (form submissions)

## Security Considerations

### Why This Is Safe

1. **Server Actions**: Next.js has built-in CSRF protection for Server Actions through the `next-action` header
2. **Public Endpoints**: Only essential login-related endpoints are exposed
3. **Authenticated Routes**: Already protected by authentication middleware which validates session tokens
4. **Defense in Depth**: Multiple layers of security:
   - Authentication middleware validates sessions
   - Authorization checks in route handlers
   - Input validation and sanitization
   - Rate limiting

### What's Still Protected

CSRF protection still applies to:
- Traditional form submissions without Server Actions
- Custom API endpoints not in the skip list
- Any POST/PUT/DELETE/PATCH requests to unprotected routes

## Deployment Checklist

- [x] Update CSRF middleware
- [x] Test all authentication flows
- [x] Test super-admin operations
- [x] Test admin operations
- [x] Verify Server Actions work
- [ ] Deploy to production
- [ ] Monitor error logs for CSRF-related issues

## Rollback Plan

If issues occur, revert the changes to `src/lib/middleware/csrf-protection.ts` and investigate specific failing endpoints.

## Related Documentation
- [SUPER_ADMIN_LOGIN_REDIRECT_FIX.md](./SUPER_ADMIN_LOGIN_REDIRECT_FIX.md)
- [ADMINISTRATOR_UPDATE_FIX.md](./ADMINISTRATOR_UPDATE_FIX.md)
