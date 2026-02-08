# Quick Fix Reference

## Summary
Fixed 4 critical production issues affecting super-admin functionality, user management, and onboarding.

---

## Issue 1: Super-Admin Redirect to Localhost

**Symptom**: Accessing `/super-admin` from subdomain redirects to `localhost/sd`

**Fix**: Add environment variables
```env
ROOT_DOMAIN=yourdomain.com
NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com
AUTH_URL=https://yourdomain.com
```

**Files**: `.env`, `.env.example`, `scripts/validate-env-vars.ts`

---

## Issue 2: CSRF Blocking Legitimate Requests

**Symptom**: 403 errors on school code validation, OTP, and Server Actions

**Fix**: Updated `src/lib/middleware/csrf-protection.ts` to skip:
- Next.js Server Actions (detected by `next-action` header)
- Public auth endpoints (`/api/schools/validate`, `/api/otp/`)
- Authenticated API routes (`/api/super-admin/`, `/api/admin/`, etc.)

**Files**: `src/lib/middleware/csrf-protection.ts`

---

## Issue 3: User Update Errors from Super-Admin

**Symptom**: "Error: An error occurred in the Server Components render" when updating users from super-admin panel

**Fix**: Modified 4 functions in `src/lib/actions/usersAction.ts`:
- `updateAdministrator`
- `updateTeacher`
- `updateStudent`
- `updateParent`

Changed to:
1. Remove `updateUserDetails` call (requires school context)
2. Update user table directly in transaction
3. Revalidate both `/admin/users` and `/super-admin/schools`

**Files**: `src/lib/actions/usersAction.ts`

---

## Issue 4: Admin Email Not Verified During Onboarding

**Symptom**: Admin users created during school onboarding cannot login immediately because email is not verified

**Fix**: Modified 2 occurrences in `src/lib/actions/onboarding/setup-actions.ts`:
- Changed `emailVerified: null` to `emailVerified: new Date()`
- Line 211: `completeSystemSetup` function
- Line 416: Admin creation in setup wizard

**Why**: Admin-created users should be pre-verified for immediate access. Self-registered users still require email verification.

**Files**: `src/lib/actions/onboarding/setup-actions.ts`

**Optional Database Migration**:
```sql
UPDATE "User"
SET "emailVerified" = "createdAt"
WHERE role = 'ADMIN'
AND "emailVerified" IS NULL;
```

---

## Testing Quick Checklist

### Super-Admin
- [ ] Login from subdomain works (no localhost redirect)
- [ ] Can view schools list
- [ ] Can edit administrators
- [ ] Can edit teachers
- [ ] Can edit students
- [ ] Password reset works

### Admin Panel
- [ ] Can edit administrators
- [ ] Can edit teachers
- [ ] Can edit students
- [ ] Can edit parents
- [ ] All changes save correctly

### Authentication
- [ ] School code validation works
- [ ] OTP generation works
- [ ] OTP verification works
- [ ] Login flow completes
- [ ] No CSRF errors in console

### Email Verification
- [ ] New admin users created during onboarding have verified emails
- [ ] Admin users can login immediately after creation
- [ ] Check database: `SELECT email, emailVerified FROM "User" WHERE role = 'ADMIN' ORDER BY "createdAt" DESC LIMIT 10;`

---

## Deployment Steps

1. **Set environment variables** in production:
   ```env
   ROOT_DOMAIN=yourdomain.com
   NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com
   AUTH_URL=https://yourdomain.com
   ```

2. **Deploy code changes**:
   - `src/lib/middleware/csrf-protection.ts`
   - `src/lib/actions/usersAction.ts`
   - `src/lib/actions/onboarding/setup-actions.ts`
   - `scripts/validate-env-vars.ts`

3. **Optional: Fix existing admin users**:
   ```sql
   UPDATE "User"
   SET "emailVerified" = "createdAt"
   WHERE role = 'ADMIN'
   AND "emailVerified" IS NULL;
   ```

4. **Test immediately after deployment**:
   - Super-admin login
   - School code validation
   - User updates from super-admin panel
   - Create new school and admin user
   - Verify admin can login immediately

5. **Monitor error logs** for 24 hours

---

## Rollback

If issues occur:

1. **Environment variables**: Set `ROOT_DOMAIN` to correct value
2. **CSRF middleware**: Revert `src/lib/middleware/csrf-protection.ts`
3. **User actions**: Revert `src/lib/actions/usersAction.ts`
4. **Email verification**: Revert `src/lib/actions/onboarding/setup-actions.ts`

---

## Documentation

- [PRODUCTION_FIXES_SUMMARY.md](./PRODUCTION_FIXES_SUMMARY.md) - Complete overview
- [docs/SUPER_ADMIN_LOGIN_REDIRECT_FIX.md](./docs/SUPER_ADMIN_LOGIN_REDIRECT_FIX.md) - Fix 1 details
- [docs/CSRF_PROTECTION_FIX.md](./docs/CSRF_PROTECTION_FIX.md) - Fix 2 details
- [docs/ADMINISTRATOR_UPDATE_FIX.md](./docs/ADMINISTRATOR_UPDATE_FIX.md) - Fix 3 details
- [docs/EMAIL_VERIFICATION_ONBOARDING_FIX.md](./docs/EMAIL_VERIFICATION_ONBOARDING_FIX.md) - Fix 4 details

---

**Last Updated**: February 8, 2026
