# User Registration System Guide

## Overview

The user registration system allows new users to create accounts with email and password authentication. This guide covers the registration flow, API endpoints, and UI components.

## Features

- ✅ Email/password registration
- ✅ Client-side and server-side validation
- ✅ Password strength indicator
- ✅ Email verification
- ✅ Duplicate email detection
- ✅ Secure password hashing (bcrypt with 12 salt rounds)
- ✅ Audit logging
- ✅ User-friendly error messages

## Registration Flow

1. User fills out registration form with:
   - First Name
   - Last Name
   - Email
   - Password
   - Password Confirmation

2. Client-side validation checks:
   - All fields are required
   - Email format is valid
   - Password meets strength requirements
   - Passwords match

3. Server-side validation:
   - Email format validation
   - Email uniqueness check
   - Password strength validation
   - All required fields present

4. Account creation:
   - Password is hashed with bcrypt (12 salt rounds)
   - User record created with default STUDENT role
   - Email verification token generated (24-hour expiration)
   - Verification email sent

5. Email verification:
   - User receives email with verification link
   - Clicking link verifies email address
   - User can then log in

## API Endpoint

### POST /api/auth/register

Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "clxxx..."
}
```

**Error Responses:**

400 Bad Request - Missing fields:
```json
{
  "success": false,
  "error": "All fields are required"
}
```

400 Bad Request - Invalid email:
```json
{
  "success": false,
  "error": "Invalid email format"
}
```

400 Bad Request - Weak password:
```json
{
  "success": false,
  "error": "Password does not meet requirements",
  "details": [
    "Password must be at least 8 characters long",
    "Password must contain at least one uppercase letter"
  ]
}
```

409 Conflict - Duplicate email:
```json
{
  "success": false,
  "error": "An account with this email already exists"
}
```

500 Internal Server Error:
```json
{
  "success": false,
  "error": "An error occurred during registration. Please try again."
}
```

## Password Requirements

Passwords must meet ALL of the following criteria:

- ✅ Minimum 8 characters long
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

## UI Component

### RegisterForm Component

Located at: `src/components/auth/register-form.tsx`

**Features:**
- Real-time password strength indicator
- Show/hide password toggle
- Field-specific error messages
- Loading states
- Success message with auto-redirect
- Responsive design

**Usage:**
```tsx
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return <RegisterForm />
}
```

## Registration Page

The registration page is available at `/register` and uses the `RegisterForm` component.

**Route:** `src/app/(auth)/register/page.tsx`

## Email Verification

After registration, users receive a verification email with a link containing a token. The verification link format is:

```
https://your-domain.com/verify-email?token=<verification-token>
```

The token:
- Is cryptographically secure (32 random bytes)
- Expires after 24 hours
- Is single-use (deleted after verification)

## Security Features

1. **Password Hashing:**
   - Uses bcrypt with 12 salt rounds
   - Passwords never stored in plaintext

2. **Email Verification:**
   - Prevents login until email is verified
   - Tokens expire after 24 hours

3. **Duplicate Prevention:**
   - Checks for existing email before registration
   - Case-insensitive email comparison

4. **Audit Logging:**
   - All registration attempts logged
   - Includes user ID, email, and role

5. **Rate Limiting:**
   - Implemented at middleware level
   - Prevents brute force attacks

## Testing

Unit tests are available at:
`src/app/api/auth/register/__tests__/route.test.ts`

**Run tests:**
```bash
npm test src/app/api/auth/register/__tests__/route.test.ts
```

**Test Coverage:**
- ✅ Successful registration
- ✅ Missing required fields
- ✅ Invalid email format
- ✅ Weak password
- ✅ Duplicate email
- ✅ Database error handling

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."

# Email Service (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="School ERP <noreply@schoolerp.com>"

# NextAuth
AUTH_SECRET="your-secret-key"
AUTH_URL="https://your-domain.com"  # Production only
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## Integration with NextAuth v5

The registration system integrates with NextAuth v5:

1. Users register via `/api/auth/register`
2. Email verification required before login
3. Login via NextAuth credentials provider
4. Session managed by NextAuth with database strategy

## Default User Role

All newly registered users are assigned the **STUDENT** role by default. Administrators can change user roles after registration through the admin panel.

## Troubleshooting

### Email not received

1. Check spam/junk folder
2. Verify RESEND_API_KEY is configured
3. Check email service logs
4. Verify EMAIL_FROM is a verified sender

### Registration fails with 500 error

1. Check database connection
2. Verify all environment variables are set
3. Check server logs for detailed error
4. Ensure Prisma schema is up to date

### Password validation errors

Ensure password meets all requirements:
- 8+ characters
- Uppercase letter
- Lowercase letter
- Number
- Special character

## Related Documentation

- [NextAuth v5 Migration Guide](./NEXTAUTH_MIGRATION_GUIDE.md)
- [Email Verification System](./EMAIL_VERIFICATION_GUIDE.md)
- [Password Reset System](./PASSWORD_RESET_GUIDE.md)
- [Security Implementation](./SECURITY.md)

## Requirements Validation

This implementation satisfies the following requirements:

- ✅ **3.1** - Email format validation
- ✅ **3.2** - Password strength validation
- ✅ **3.3** - Duplicate email check
- ✅ **3.4** - Password hashing with bcrypt (12 salt rounds)
- ✅ **3.5** - Email verification link sent
- ✅ **3.8** - Default STUDENT role assigned
- ✅ **15.2** - Registration form component created
- ✅ **15.8** - Field-specific error messages displayed
