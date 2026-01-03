# Authentication Audit Logging Implementation

## Overview

This document describes the comprehensive authentication audit logging system implemented for the NextAuth v5 migration. The system logs all security-relevant authentication events as required by Requirements 16.1-16.7.

## Implementation Summary

### New Files Created

1. **`src/lib/services/auth-audit-service.ts`**
   - Comprehensive authentication audit logging service
   - Provides functions for logging all authentication events
   - Automatically captures IP address and user agent from request context
   - Handles errors gracefully without breaking authentication flows

2. **`src/lib/services/__tests__/auth-audit-service.test.ts`**
   - Complete test suite with 27 tests covering all audit logging functions
   - Tests for all requirements (16.1-16.7)
   - Validates proper event logging and error handling

### Modified Files

1. **`src/auth.ts`**
   - Added failed login attempt logging in the `authorize` callback
   - Logs all failure scenarios: invalid credentials, email not verified, account inactive, 2FA required, invalid 2FA code
   - Updated 2FA backup code usage logging to use new service

2. **`src/middleware.ts`**
   - Added failed authorization logging for IP whitelisting violations
   - Added failed authorization logging for rate limiting violations
   - Added failed authorization logging for permission check failures
   - Added failed authorization logging for role-based access control violations

## Authentication Events Logged

### 1. Login Events (Requirement 16.1)

**Success Events:**
- `LOGIN_SUCCESS` - Successful credentials-based login
- `OAUTH_LOGIN_SUCCESS` - Successful OAuth login (Google, GitHub)

**Failure Events:**
- `LOGIN_FAILED_INVALID_CREDENTIALS` - Invalid email or password
- `LOGIN_FAILED_EMAIL_NOT_VERIFIED` - Email not verified
- `LOGIN_FAILED_ACCOUNT_INACTIVE` - Account is inactive
- `LOGIN_FAILED_2FA_REQUIRED` - 2FA code required but not provided
- `LOGIN_FAILED_INVALID_2FA` - Invalid 2FA code provided

**Logged Information:**
- User ID (if available)
- Email address
- IP address
- User agent
- Failure reason
- Timestamp

### 2. Logout Events (Requirement 16.2)

**Events:**
- `LOGOUT_SUCCESS` - User logged out
- `SESSION_REVOKED` - Individual session revoked
- `ALL_SESSIONS_REVOKED` - All user sessions revoked

**Logged Information:**
- User ID
- Session ID (for individual revocation)
- Session count (for all sessions revocation)
- Revoked by (user, admin, or system)
- IP address
- User agent
- Timestamp

### 3. Password Events (Requirement 16.3)

**Events:**
- `PASSWORD_CHANGED` - Password changed successfully
- `PASSWORD_RESET_REQUESTED` - Password reset requested
- `PASSWORD_RESET_COMPLETED` - Password reset completed

**Logged Information:**
- User ID
- Email address
- Initiated by (user, admin, or reset)
- IP address
- User agent
- Timestamp

### 4. Two-Factor Authentication Events (Requirement 16.4)

**Events:**
- `TWO_FA_ENABLED` - 2FA enabled for account
- `TWO_FA_DISABLED` - 2FA disabled for account
- `TWO_FA_BACKUP_CODE_USED` - Backup code used for login
- `TWO_FA_BACKUP_CODES_REGENERATED` - Backup codes regenerated

**Logged Information:**
- User ID
- Email address
- Remaining backup codes (for usage)
- IP address
- User agent
- Timestamp

### 5. Role Change Events (Requirement 16.5)

**Events:**
- `ROLE_CHANGED` - User role changed

**Logged Information:**
- User ID
- Old role
- New role
- Changed by (admin user ID)
- IP address
- User agent
- Timestamp

### 6. Password Reset Events (Requirement 16.6)

**Events:**
- `PASSWORD_RESET_REQUESTED` - Password reset link requested
- `PASSWORD_RESET_COMPLETED` - Password successfully reset

**Logged Information:**
- User ID (if available)
- Email address
- IP address
- User agent
- Timestamp

### 7. Failed Authorization Events (Requirement 16.7)

**Events:**
- `AUTHORIZATION_FAILED` - General authorization failure
- `AUTHORIZATION_FAILED_INSUFFICIENT_PERMISSIONS` - Insufficient permissions
- `AUTHORIZATION_FAILED_IP_BLOCKED` - IP address not whitelisted
- `AUTHORIZATION_FAILED_RATE_LIMITED` - Rate limit exceeded

**Logged Information:**
- User ID
- Resource being accessed
- Action attempted
- Failure reason
- Route/pathname
- User role
- Required role/permissions
- IP address
- User agent
- Timestamp

## Additional Events Logged

### OAuth Events
- `OAUTH_ACCOUNT_LINKED` - OAuth account linked to existing user
- `OAUTH_LOGIN_FAILED` - OAuth login failed

### Registration Events
- `USER_REGISTERED` - New user registered
- `EMAIL_VERIFIED` - Email address verified

### Session Events
- `SESSION_CREATED` - New session created
- `SESSION_EXPIRED` - Session expired

## Usage Examples

### Logging a Failed Login Attempt

```typescript
import { logLoginFailure } from "@/lib/services/auth-audit-service"

// In auth.ts authorize callback
if (!isValidPassword) {
  await logLoginFailure(email, "INVALID_CREDENTIALS", { 
    reason: "Invalid password" 
  })
  return null
}
```

### Logging a Failed Authorization Attempt

```typescript
import { logAuthorizationFailure } from "@/lib/services/auth-audit-service"

// In middleware
if (!permissionCheck.allowed) {
  await logAuthorizationFailure(
    session.user.id,
    permissionCheck.resource || pathname,
    permissionCheck.action || "ACCESS",
    permissionCheck.reason || "Insufficient permissions",
    { pathname, role }
  )
  return NextResponse.redirect(new URL(redirectUrl, req.url))
}
```

### Logging a Password Change

```typescript
import { logPasswordChange } from "@/lib/services/auth-audit-service"

// After password change
await logPasswordChange(userId, email, "user", {
  method: "profile_update"
})
```

## Database Schema

All audit events are stored in the `AuditLog` table with the following structure:

```prisma
model AuditLog {
  id         String      @id @default(cuid())
  userId     String
  action     String      // Event type (e.g., "LOGIN_FAILED_INVALID_CREDENTIALS")
  resource   String      // Resource type (e.g., "AUTH", "ADMIN_ROUTE")
  resourceId String?     // Resource ID if applicable
  changes    Json?       // Event details (email, reason, etc.)
  ipAddress  String?     // Client IP address
  userAgent  String?     // Client user agent
  timestamp  DateTime    @default(now())
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}
```

## Security Considerations

1. **No Sensitive Data**: Passwords and tokens are never logged
2. **IP Address Tracking**: All events include IP address for security monitoring
3. **User Agent Tracking**: Browser/client information logged for forensics
4. **Graceful Failure**: Audit logging failures don't break authentication flows
5. **Detailed Context**: Each event includes relevant context for investigation

## Monitoring and Analysis

The audit logs can be queried for:

- Failed login attempts by IP address (detect brute force attacks)
- Failed authorization attempts by user (detect privilege escalation attempts)
- Password changes and resets (detect account compromise)
- 2FA enablement/disablement (monitor security posture)
- Role changes (track privilege modifications)
- Session management events (track user activity)

## Testing

All audit logging functions are covered by comprehensive unit tests:

- 27 tests covering all event types
- Tests for all requirements (16.1-16.7)
- Error handling tests
- IP address and user agent capture tests

Run tests with:
```bash
npm test -- src/lib/services/__tests__/auth-audit-service.test.ts --run
```

## Compliance

This implementation satisfies all requirements:

- ✅ **Requirement 16.1**: Login attempts (success and failure) are logged
- ✅ **Requirement 16.2**: Logout events are logged
- ✅ **Requirement 16.3**: Password changes are logged
- ✅ **Requirement 16.4**: 2FA enable/disable events are logged
- ✅ **Requirement 16.5**: Role changes are logged
- ✅ **Requirement 16.6**: Password reset requests are logged
- ✅ **Requirement 16.7**: Failed authorization attempts are logged

## Future Enhancements

Potential improvements for future iterations:

1. **Real-time Alerting**: Send alerts for suspicious activity patterns
2. **Dashboard**: Visual dashboard for security monitoring
3. **Retention Policy**: Automated cleanup of old audit logs
4. **Export**: Export audit logs for compliance reporting
5. **Analytics**: Advanced analytics for security insights
6. **Anomaly Detection**: ML-based detection of unusual patterns

## References

- Requirements Document: `.kiro/specs/clerk-to-nextauth-migration/requirements.md`
- Design Document: `.kiro/specs/clerk-to-nextauth-migration/design.md`
- Task List: `.kiro/specs/clerk-to-nextauth-migration/tasks.md`
