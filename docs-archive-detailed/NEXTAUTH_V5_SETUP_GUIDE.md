# NextAuth v5 Setup Guide

## Overview

This School ERP system uses NextAuth v5 (Auth.js) for authentication and session management. This guide covers setup, configuration, and usage.

## Features

- **Credentials Authentication**: Email/password login with bcrypt hashing
- **OAuth Providers**: Google and GitHub OAuth support
- **Two-Factor Authentication**: TOTP-based 2FA with backup codes
- **Database Sessions**: Secure session storage with 30-minute expiry
- **Email Verification**: Required for new user accounts
- **Password Reset**: Secure token-based password reset flow
- **Role-Based Access**: Integrated with RBAC system

## Environment Variables

### Required Variables

```env
# Authentication Secret (Generate with: openssl rand -base64 32)
AUTH_SECRET=your_generated_secret_here

# Application URL
AUTH_URL=http://localhost:3000

# For production deployments
AUTH_TRUST_HOST=true
```

### Optional OAuth Variables

```env
# Google OAuth (Get from: https://console.cloud.google.com/apis/credentials)
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# GitHub OAuth (Get from: https://github.com/settings/developers)
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_client_secret
```

### Other Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Email Service (for verification and password reset)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@schoolerp.com

# Two-Factor Authentication Encryption
TWO_FACTOR_ENCRYPTION_KEY=your_32_byte_hex_key
```

## Database Setup

NextAuth v5 requires specific database tables. These are already included in the Prisma schema:

- `User` - User accounts with authentication fields
- `Account` - OAuth account linkages
- `Session` - Active user sessions
- `VerificationToken` - Email verification and password reset tokens

Run migrations to create these tables:

```bash
npx prisma migrate dev
```

## Configuration

The NextAuth configuration is located in `src/auth.ts`. Key settings:

### Session Strategy

```typescript
session: {
  strategy: "database",  // Store sessions in database
  maxAge: 1800,          // 30 minutes in seconds
  updateAge: 300,        // Update session every 5 minutes
}
```

### Providers

1. **Credentials Provider**: Email/password authentication
   - Password hashing with bcrypt (12 salt rounds)
   - Email verification required
   - 2FA support with TOTP and backup codes

2. **Google OAuth**: Social login with Google accounts
   - Automatic account linking by email
   - Email verification not required (trusted provider)

3. **GitHub OAuth**: Social login with GitHub accounts
   - Automatic account linking by email
   - Email verification not required (trusted provider)

### Callbacks

- **signIn**: Handles OAuth account linking and validation
- **session**: Adds user role to session object
- **jwt**: Adds role to JWT token (for compatibility)
- **redirect**: Custom redirect logic after authentication

## Usage

### Server-Side Authentication

```typescript
import { auth } from "@/auth";

export default async function ProtectedPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  // Access user data
  const userId = session.user.id;
  const userRole = session.user.role;
  const userEmail = session.user.email;
  
  return <div>Welcome {session.user.name}</div>;
}
```

### Client-Side Authentication

```typescript
"use client";

import { useSession } from "next-auth/react";

export function ClientComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <div>Loading...</div>;
  }
  
  if (status === "unauthenticated") {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome {session.user.name}</div>;
}
```

### API Route Protection

```typescript
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // Your API logic here
  return NextResponse.json({ data: "Protected data" });
}
```

### Sign In/Out

```typescript
import { signIn, signOut } from "@/auth";

// Sign in with credentials
await signIn("credentials", {
  email: "user@example.com",
  password: "password123",
  redirect: false
});

// Sign in with OAuth
await signIn("google", { redirectTo: "/dashboard" });
await signIn("github", { redirectTo: "/dashboard" });

// Sign out
await signOut({ redirectTo: "/login" });
```

## Two-Factor Authentication

### Enabling 2FA

1. User navigates to settings
2. Confirms password
3. System generates TOTP secret
4. User scans QR code with authenticator app
5. User verifies with TOTP code
6. System generates backup codes
7. 2FA is enabled

### Login with 2FA

1. User enters email and password
2. If 2FA is enabled, system prompts for TOTP code
3. User enters 6-digit code from authenticator app
4. System validates code (30-second window, ±1 period)
5. If valid, user is authenticated
6. If invalid, user can retry or use backup code

### Backup Codes

- Generated when 2FA is enabled
- One-time use only
- Encrypted in database
- Can be used if authenticator is unavailable

## Email Verification

### Registration Flow

1. User registers with email and password
2. System creates user account (emailVerified = null)
3. System sends verification email with token
4. User clicks link in email
5. System verifies token and marks email as verified
6. User can now log in

### Resending Verification

Users can request a new verification email if:
- Original email was not received
- Token has expired (24 hours)

## Password Reset

### Reset Flow

1. User clicks "Forgot Password"
2. User enters email address
3. System sends reset email with token (1-hour expiry)
4. User clicks link in email
5. User enters new password
6. System validates password strength
7. System updates password and invalidates token
8. All other sessions are invalidated (except current)

## Security Features

### Password Security

- **Hashing**: bcrypt with 12 salt rounds
- **Strength Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### Session Security

- **Storage**: Database sessions (more secure than JWT-only)
- **Expiry**: 30 minutes of inactivity
- **Rotation**: Session updated every 5 minutes
- **Cookies**: httpOnly, secure (production), sameSite: lax

### Rate Limiting

- Login attempts: 5 per 15 minutes per IP
- Password reset: 3 per hour per email
- Email verification: 3 per hour per email

## Middleware Integration

The authentication middleware protects routes automatically:

```typescript
// src/middleware.ts
import { auth } from "@/auth";

export default auth(async (req) => {
  const session = req.auth;
  
  // Public routes
  if (isPublicRoute(req.nextUrl.pathname)) {
    return NextResponse.next();
  }
  
  // Require authentication
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  
  // Role-based access control
  const roleCheck = checkPermission(
    req.nextUrl.pathname,
    session.user.role
  );
  
  if (!roleCheck.allowed) {
    return NextResponse.redirect(
      new URL(getDashboardUrl(session.user.role), req.url)
    );
  }
  
  return NextResponse.next();
});
```

## OAuth Provider Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret to `.env`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in application details
4. Set Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github` (development)
   - `https://yourdomain.com/api/auth/callback/github` (production)
5. Copy Client ID and generate Client Secret
6. Add to `.env`

## Troubleshooting

### Common Issues

**Issue**: "Invalid AUTH_SECRET"
- **Solution**: Generate a new secret with `openssl rand -base64 32`

**Issue**: "Session not found"
- **Solution**: Check database connection and ensure Session table exists

**Issue**: "OAuth callback error"
- **Solution**: Verify redirect URIs match exactly in provider settings

**Issue**: "Email not sending"
- **Solution**: Check RESEND_API_KEY and EMAIL_FROM configuration

**Issue**: "2FA code invalid"
- **Solution**: Ensure system time is synchronized (TOTP is time-based)

### Debug Mode

Enable debug logging in development:

```typescript
// src/auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  // ... rest of config
});
```

## Migration from Clerk

If migrating from Clerk, see the [NextAuth Migration Guide](./NEXTAUTH_MIGRATION_GUIDE.md) for detailed instructions.

## Additional Resources

- [NextAuth v5 Documentation](https://authjs.dev/)
- [Prisma Adapter Documentation](https://authjs.dev/reference/adapter/prisma)
- [OAuth Provider Setup](https://authjs.dev/getting-started/providers)
- [Security Best Practices](https://authjs.dev/guides/basics/security)
