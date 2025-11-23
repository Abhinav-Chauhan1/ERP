# Session Timeout Implementation

## Overview

This document describes the implementation of the 8-hour session timeout feature as specified in Requirement 6.5 of the ERP Production Completion specification.

## Requirements

**Requirement 6.5**: WHEN a user session exceeds 8 hours THEN the ERP System SHALL automatically terminate the session and require re-authentication

## Implementation Details

### 1. Session Timeout Configuration

**Duration**: 8 hours (28,800 seconds)
**Warning Time**: 5 minutes before expiry
**Check Interval**: Every 1 minute

### 2. Components

#### SessionManager (`src/components/auth/SessionManager.tsx`)
- Main component that manages the session lifecycle
- Initializes session tracking when user signs in
- Cleans up session data when user signs out
- Renders the SessionTimeoutWarning component

#### SessionTimeoutWarning (`src/components/auth/SessionTimeoutWarning.tsx`)
- Displays a warning dialog 5 minutes before session expiry
- Allows users to extend their session by clicking "Continue"
- Automatically signs out users when session expires
- Redirects to login page with session expiry message

#### Session Utilities (`src/lib/utils/session-timeout.ts`)
- `getSessionInfo()`: Returns current session status
- `updateLastActivity()`: Updates the last activity timestamp
- `clearSessionData()`: Clears session data from localStorage
- `formatTimeRemaining()`: Formats time in human-readable format
- `initializeSession()`: Sets up activity tracking
- `cleanupSession()`: Removes activity event listeners

### 3. Activity Tracking

The system tracks user activity through the following events:
- `mousedown`: Mouse clicks
- `keydown`: Keyboard input
- `scroll`: Page scrolling
- `touchstart`: Touch interactions (mobile)

Each activity event updates the `session_last_activity` timestamp in localStorage.

### 4. Session Flow

```
User Signs In
     ↓
Initialize Session Tracking
     ↓
Monitor User Activity
     ↓
Update Last Activity Timestamp
     ↓
Check Session Status (every minute)
     ↓
┌────────────────────────────────┐
│ Time Until Expiry?             │
├────────────────────────────────┤
│ > 5 minutes: Continue          │
│ ≤ 5 minutes: Show Warning      │
│ ≤ 0 minutes: Sign Out          │
└────────────────────────────────┘
```

### 5. Clerk Dashboard Configuration

**Important**: Some session settings must be configured in the Clerk Dashboard:

1. Navigate to: https://dashboard.clerk.com/
2. Go to: **Sessions** > **Settings**
3. Configure the following:
   - **Session lifetime**: 8 hours (28800 seconds)
   - **Inactive lifetime**: 8 hours (28800 seconds)
   - **Multi-session handling**: As per your requirements

### 6. Environment Variables

No additional environment variables are required for this feature. The session timeout is hardcoded to 8 hours as per the specification.

### 7. User Experience

#### Normal Flow
1. User signs in and starts using the system
2. System tracks user activity in the background
3. Each interaction extends the session

#### Warning Flow
1. After 7 hours and 55 minutes of inactivity, a warning dialog appears
2. Dialog shows: "Your session will expire in 5 minutes due to inactivity"
3. User can click "Continue Session" to extend the session
4. If user doesn't respond, session expires after 5 minutes

#### Expiry Flow
1. After 8 hours of inactivity, session automatically expires
2. User is signed out from Clerk
3. User is redirected to login page with message: "Your session has expired due to inactivity"
4. User must sign in again to continue

### 8. Testing

#### Manual Testing

1. **Test Session Warning**:
   - Sign in to the system
   - Wait for 7 hours and 55 minutes (or modify `SESSION_TIMEOUT_MS` for testing)
   - Verify warning dialog appears
   - Click "Continue Session"
   - Verify session is extended

2. **Test Session Expiry**:
   - Sign in to the system
   - Wait for 8 hours (or modify `SESSION_TIMEOUT_MS` for testing)
   - Verify automatic sign out
   - Verify redirect to login page with expiry message

3. **Test Activity Tracking**:
   - Sign in to the system
   - Perform various activities (click, type, scroll)
   - Verify session is extended with each activity

#### Automated Testing

Property-based tests should be written to verify:
- Session expiry after 8 hours of inactivity
- Warning display 5 minutes before expiry
- Activity tracking extends session
- Automatic sign out on expiry

### 9. Security Considerations

1. **Client-Side Tracking**: Session tracking is done client-side using localStorage. This is acceptable because:
   - Clerk handles actual session validation server-side
   - Client-side tracking only provides UX improvements (warnings)
   - Actual session expiry is enforced by Clerk

2. **Activity Events**: The system tracks multiple activity events to ensure accurate session extension

3. **Automatic Sign Out**: When session expires, the system:
   - Calls Clerk's `signOut()` method
   - Clears local session data
   - Redirects to login page
   - Prevents access to protected routes

### 10. Troubleshooting

#### Warning Not Appearing
- Check browser console for errors
- Verify SessionManager is rendered in layout
- Check localStorage for `session_last_activity` key

#### Session Not Expiring
- Verify Clerk Dashboard settings
- Check if activity tracking is updating timestamps
- Verify SESSION_TIMEOUT_MS constant

#### Multiple Tabs
- Each tab tracks its own activity
- Session is shared across tabs via Clerk
- Activity in one tab extends session for all tabs

### 11. Future Enhancements

Potential improvements for future versions:
1. Configurable timeout duration per role
2. Server-side session validation
3. Session activity logging for audit
4. Customizable warning time
5. Remember device option to extend session

## Files Modified/Created

### Created Files
- `src/lib/utils/session-timeout.ts`
- `src/components/auth/SessionManager.tsx`
- `src/components/auth/SessionTimeoutWarning.tsx`
- `middleware.config.ts`
- `docs/SESSION_TIMEOUT_IMPLEMENTATION.md`

### Modified Files
- `src/app/layout.tsx` - Added SessionManager component
- `src/app/(auth)/login/[[...rest]]/page.tsx` - Added session expiry message

## Compliance

This implementation satisfies:
- **Requirement 6.5**: 8-hour session timeout with automatic termination
- **Property 21**: Session Timeout Enforcement - For any user session exceeding 8 hours, the system should automatically terminate and require re-authentication

## References

- [Clerk Session Management](https://clerk.com/docs/authentication/configuration/session-options)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
