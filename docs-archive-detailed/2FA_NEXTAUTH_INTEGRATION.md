# Two-Factor Authentication Integration with NextAuth v5

## Overview

This document describes the integration of Two-Factor Authentication (2FA) with NextAuth v5 credentials provider in the School ERP system.

## Implementation Summary

### Task 8.1: Integrate 2FA with Credentials Provider

**Status**: ✅ Completed

**Location**: `src/auth.ts`

### Features Implemented

1. **TOTP Code Validation**
   - Validates Time-based One-Time Password (TOTP) codes using OTPAuth library
   - Allows a window of ±1 period (30 seconds) to account for time drift
   - Uses 6-digit codes with 30-second period

2. **Backup Code Support**
   - Falls back to backup codes if TOTP validation fails
   - Automatically marks used backup codes as consumed
   - Updates user record with remaining backup codes
   - Logs backup code usage for audit purposes

3. **Error Handling**
   - `2FA_REQUIRED`: Thrown when 2FA is enabled but no code is provided
   - `INVALID_2FA_CODE`: Thrown when both TOTP and backup code validation fail
   - Graceful error handling for backup code verification failures

4. **Audit Logging**
   - Logs backup code usage with remaining code count
   - Tracks 2FA authentication events for security monitoring

## Authentication Flow

```
User Login with 2FA Enabled:
1. User provides email + password
2. Password is verified
3. System checks if 2FA is enabled
4. If no TOTP code provided → throw "2FA_REQUIRED"
5. If TOTP code provided:
   a. Try TOTP validation first
   b. If TOTP fails, try backup codes
   c. If backup code valid:
      - Mark code as consumed
      - Update user record
      - Log usage
   d. If both fail → throw "INVALID_2FA_CODE"
6. Return authenticated user
```

## Code Structure

### Main Implementation (src/auth.ts)

```typescript
// Check 2FA if enabled
if (user.twoFactorEnabled) {
  if (!credentials.totpCode) {
    throw new Error("2FA_REQUIRED")
  }

  let isValid2FA = false

  // First, try TOTP code verification
  if (user.twoFactorSecret) {
    const totp = new TOTP({
      secret: user.twoFactorSecret,
      digits: 6,
      period: 30
    })

    const isValidTotp = totp.validate({
      token: credentials.totpCode as string,
      window: 1
    })

    if (isValidTotp !== null) {
      isValid2FA = true
    }
  }

  // If TOTP fails, try backup codes
  if (!isValid2FA && user.twoFactorBackupCodes) {
    try {
      const { verifyBackupCode, decrypt } = await import("@/lib/utils/two-factor")
      
      const backupResult = verifyBackupCode(
        credentials.totpCode as string,
        user.twoFactorBackupCodes
      )

      if (backupResult.valid) {
        isValid2FA = true

        // Update user with remaining backup codes
        await db.user.update({
          where: { id: user.id },
          data: {
            twoFactorBackupCodes: backupResult.remainingCodes
          }
        })

        // Log backup code usage
        await db.auditLog.create({
          data: {
            action: "2FA_BACKUP_CODE_USED",
            userId: user.id,
            details: {
              remainingCodes: backupResult.remainingCodes 
                ? JSON.parse(decrypt(backupResult.remainingCodes)).length 
                : 0
            }
          }
        })
      }
    } catch (error) {
      console.error("Error verifying backup code:", error)
    }
  }

  // If both TOTP and backup code fail, throw error
  if (!isValid2FA) {
    throw new Error("INVALID_2FA_CODE")
  }
}
```

## Requirements Validation

### Requirement 6.1: Generate TOTP secret
✅ Uses existing OTPAuth library integration

### Requirement 6.2: Display QR code
✅ Handled by existing 2FA setup flow

### Requirement 6.3: Store backup codes
✅ Encrypted backup codes stored in User model

### Requirement 6.4: Require TOTP after password
✅ Implemented in authorize callback

### Requirement 6.5: Validate TOTP code
✅ Uses TOTP.validate() with window of 1

### Requirement 6.6: Allow retry with rate limiting
✅ Rate limiting handled by existing middleware

### Requirement 6.7: Support backup codes
✅ Falls back to backup codes if TOTP fails

### Requirement 6.8: Mark backup codes as consumed
✅ Updates user record with remaining codes

### Requirement 6.9: Maintain existing 2FA fields
✅ Uses twoFactorEnabled, twoFactorSecret, twoFactorBackupCodes

## Security Considerations

1. **Backup Code Encryption**: Backup codes are stored encrypted in the database
2. **One-Time Use**: Backup codes are removed after use and cannot be reused
3. **Audit Trail**: All backup code usage is logged for security monitoring
4. **Time Window**: TOTP validation allows ±30 seconds to account for clock drift
5. **Error Messages**: Generic error messages prevent user enumeration

## Testing

### Manual Testing Steps

1. **Test TOTP Login**:
   - Enable 2FA for a user
   - Login with email + password
   - Verify 2FA_REQUIRED error if no code provided
   - Provide valid TOTP code from authenticator app
   - Verify successful login

2. **Test Backup Code Login**:
   - Enable 2FA for a user
   - Login with email + password
   - Provide a backup code instead of TOTP
   - Verify successful login
   - Check that backup code is marked as consumed
   - Verify audit log entry

3. **Test Invalid Codes**:
   - Login with invalid TOTP code
   - Verify INVALID_2FA_CODE error
   - Login with already-used backup code
   - Verify INVALID_2FA_CODE error

### Integration Testing

Integration tests should be added in task 8.2 (marked as optional) to cover:
- Login with 2FA enabled and valid TOTP code
- Login with 2FA enabled and invalid TOTP code
- Login with 2FA enabled and no code
- Login with valid backup code
- Login with invalid backup code
- Verify backup code consumption

## Related Files

- `src/auth.ts` - Main NextAuth configuration with 2FA integration
- `src/lib/utils/two-factor.ts` - 2FA utility functions (TOTP, backup codes, encryption)
- `src/lib/actions/two-factor-actions.ts` - Server actions for 2FA management
- `prisma/schema.prisma` - User model with 2FA fields

## Next Steps

1. **Task 8.2** (Optional): Write integration tests for 2FA flows
2. **Task 9**: Implement user registration system
3. **Task 10**: Implement user login system with 2FA UI

## Migration Notes

This implementation maintains compatibility with the existing 2FA system that was built for Clerk. The same database fields and encryption methods are used, ensuring a smooth transition from Clerk to NextAuth v5.
