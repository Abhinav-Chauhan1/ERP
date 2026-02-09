# NextAuth v5 Middleware Testing Guide

## Overview

This guide provides manual testing procedures for the NextAuth v5 middleware implementation. The middleware handles authentication checks, role-based access control, rate limiting, and IP whitelisting.

## Prerequisites

- NextAuth v5 configured and running
- Database with test users for each role (ADMIN, TEACHER, STUDENT, PARENT)
- Development server running (`npm run dev`)

## Test Scenarios

### 1. Authentication Checks

#### 1.1 Public Routes Access (Unauthenticated)

**Test**: Verify unauthenticated users can access public routes

**Steps**:
1. Open browser in incognito/private mode
2. Navigate to the following URLs:
   - `http://localhost:3000/`
   - `http://localhost:3000/login`
   - `http://localhost:3000/register`
   - `http://localhost:3000/forgot-password`
   - `http://localhost:3000/verify-email`

**Expected Result**: All pages load successfully without redirect to login

**Status**: ☐ Pass ☐ Fail

---

#### 1.2 Protected Routes Redirect (Unauthenticated)

**Test**: Verify unauthenticated users are redirected to login for protected routes

**Steps**:
1. Open browser in incognito/private mode
2. Navigate to the following URLs:
   - `http://localhost:3000/admin`
   - `http://localhost:3000/teacher`
   - `http://localhost:3000/student`
   - `http://localhost:3000/parent`

**Expected Result**: All requests redirect to `/login?redirect_url=<original_url>`

**Status**: ☐ Pass ☐ Fail

---

#### 1.3 Authenticated Access

**Test**: Verify authenticated users can access protected routes

**Steps**:
1. Log in as any user
2. Navigate to your role-appropriate dashboard
3. Verify page loads successfully

**Expected Result**: Dashboard loads without redirect

**Status**: ☐ Pass ☐ Fail

---

#### 1.4 API Route Authentication

**Test**: Verify API routes require authentication

**Steps**:
1. Open browser console
2. Run: `fetch('/api/admin/users').then(r => r.json()).then(console.log)`
3. Without being logged in

**Expected Result**: Response is `{ success: false, error: "Unauthorized" }` with status 401

**Status**: ☐ Pass ☐ Fail

---

### 2. Role-Based Access Control

#### 2.1 Admin Access

**Test**: Verify ADMIN can access all routes

**Steps**:
1. Log in as ADMIN user
2. Navigate to:
   - `/admin` - Should load
   - `/teacher` - Should load
   - `/student` - Should load
   - `/parent` - Should load

**Expected Result**: All routes accessible

**Status**: ☐ Pass ☐ Fail

---

#### 2.2 Teacher Access Restrictions

**Test**: Verify TEACHER cannot access admin routes

**Steps**:
1. Log in as TEACHER user
2. Navigate to `/admin`

**Expected Result**: Redirected to `/teacher`

**Status**: ☐ Pass ☐ Fail

---

#### 2.3 Student Access Restrictions

**Test**: Verify STUDENT cannot access admin or teacher routes

**Steps**:
1. Log in as STUDENT user
2. Navigate to:
   - `/admin` - Should redirect to `/student`
   - `/teacher` - Should redirect to `/student`

**Expected Result**: Both routes redirect to `/student`

**Status**: ☐ Pass ☐ Fail

---

#### 2.4 Parent Access Restrictions

**Test**: Verify PARENT cannot access admin, teacher, or student routes

**Steps**:
1. Log in as PARENT user
2. Navigate to:
   - `/admin` - Should redirect to `/parent`
   - `/teacher` - Should redirect to `/parent`
   - `/student` - Should redirect to `/parent`

**Expected Result**: All routes redirect to `/parent`

**Status**: ☐ Pass ☐ Fail

---

#### 2.5 Permission-Based Access Control

**Test**: Verify permission middleware enforces route-level permissions

**Steps**:
1. Log in as TEACHER user
2. Navigate to `/admin/users/create`

**Expected Result**: Redirected to `/teacher` (insufficient permissions)

**Status**: ☐ Pass ☐ Fail

---

### 3. Rate Limiting

#### 3.1 API Rate Limiting

**Test**: Verify rate limiting is applied to API routes

**Steps**:
1. Log in as any user
2. Open browser console
3. Run the following script to make 101 requests:
```javascript
for (let i = 0; i < 101; i++) {
  fetch('/api/admin/users')
    .then(r => r.json())
    .then(data => console.log(`Request ${i + 1}:`, data))
    .catch(err => console.error(`Request ${i + 1} failed:`, err));
}
```

**Expected Result**: 
- First 100 requests succeed (or return 401 if not authorized)
- 101st request returns 429 with rate limit error
- Response headers include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Status**: ☐ Pass ☐ Fail

---

#### 3.2 Rate Limit Headers

**Test**: Verify rate limit headers are present on API responses

**Steps**:
1. Log in as any user
2. Open browser DevTools Network tab
3. Make an API request to `/api/admin/users`
4. Check response headers

**Expected Result**: Headers present:
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: <number>`
- `X-RateLimit-Reset: <timestamp>`

**Status**: ☐ Pass ☐ Fail

---

### 4. IP Whitelisting

#### 4.1 Admin Route IP Check

**Test**: Verify IP whitelisting is checked for admin routes

**Steps**:
1. Set `ADMIN_IP_WHITELIST` environment variable to a specific IP (not your current IP)
2. Restart the development server
3. Log in as ADMIN user
4. Navigate to `/admin`

**Expected Result**: Access denied with 403 status (IP not whitelisted)

**Status**: ☐ Pass ☐ Fail

---

#### 4.2 Whitelisted IP Access

**Test**: Verify whitelisted IPs can access admin routes

**Steps**:
1. Set `ADMIN_IP_WHITELIST` to `127.0.0.1` (or your current IP)
2. Restart the development server
3. Log in as ADMIN user
4. Navigate to `/admin`

**Expected Result**: Admin dashboard loads successfully

**Status**: ☐ Pass ☐ Fail

---

#### 4.3 Non-Admin Routes Skip IP Check

**Test**: Verify IP whitelisting is not applied to non-admin routes

**Steps**:
1. Set `ADMIN_IP_WHITELIST` to a specific IP (not your current IP)
2. Restart the development server
3. Log in as TEACHER user
4. Navigate to `/teacher`

**Expected Result**: Teacher dashboard loads successfully (IP check not applied)

**Status**: ☐ Pass ☐ Fail

---

## Testing Checklist

### Authentication
- ☐ Public routes accessible without authentication
- ☐ Protected routes redirect to login when unauthenticated
- ☐ Authenticated users can access protected routes
- ☐ API routes return 401 for unauthenticated requests

### Role-Based Access Control
- ☐ ADMIN can access all routes
- ☐ TEACHER redirected from admin routes
- ☐ STUDENT redirected from admin and teacher routes
- ☐ PARENT redirected from admin, teacher, and student routes
- ☐ Permission middleware enforces route-level permissions

### Rate Limiting
- ☐ Rate limiting applied to API routes
- ☐ Rate limit headers present on responses
- ☐ Requests blocked after limit exceeded

### IP Whitelisting
- ☐ IP whitelist checked for admin routes
- ☐ Whitelisted IPs can access admin routes
- ☐ Non-whitelisted IPs blocked from admin routes
- ☐ IP whitelist not applied to non-admin routes

## Notes

- All tests should be performed in a development environment
- Use different browsers or incognito mode to test different user roles
- Check browser console and network tab for detailed error messages
- Verify middleware logs in the terminal for debugging

## Troubleshooting

### Issue: Middleware not executing
**Solution**: Check that `middleware.ts` is in the `src` directory and the config matcher is correct

### Issue: Session not found
**Solution**: Verify NextAuth configuration is correct and database sessions are being created

### Issue: Rate limiting not working
**Solution**: Check Upstash Redis configuration or verify in-memory rate limiter is being used

### Issue: IP whitelisting not working
**Solution**: Verify `ADMIN_IP_WHITELIST` environment variable is set correctly

## Automated Testing

For automated testing of middleware functionality, consider:
1. Integration tests using Playwright or Cypress
2. API endpoint tests using Supertest
3. End-to-end tests covering complete user flows

## Requirements Validation

This testing guide validates the following requirements:
- **8.1**: Middleware uses NextAuth v5 auth() helper for session checking
- **8.2**: Middleware validates session from database
- **8.3**: Middleware redirects unauthenticated users to login page
- **8.4**: Middleware maintains existing rate limiting functionality
- **8.5**: Middleware maintains existing IP whitelisting for admin routes
- **8.6**: Middleware maintains existing permission checking logic
