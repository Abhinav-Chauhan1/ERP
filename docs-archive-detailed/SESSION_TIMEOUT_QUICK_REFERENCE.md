# Session Timeout Quick Reference

## Overview
8-hour session timeout with 5-minute warning before expiry.

## Key Constants

```typescript
SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;  // 8 hours
SESSION_WARNING_MS = 5 * 60 * 1000;        // 5 minutes
SESSION_CHECK_INTERVAL_MS = 60 * 1000;     // 1 minute
```

## Components

### SessionManager
**Location**: `src/components/auth/SessionManager.tsx`
**Purpose**: Manages session lifecycle
**Usage**: Already integrated in root layout

### SessionTimeoutWarning
**Location**: `src/components/auth/SessionTimeoutWarning.tsx`
**Purpose**: Displays warning dialog
**Usage**: Rendered by SessionManager

## Utilities

### getSessionInfo()
Returns current session status including:
- `lastActivity`: Timestamp of last activity
- `expiresAt`: When session will expire
- `isExpired`: Boolean if session is expired
- `timeUntilExpiry`: Milliseconds until expiry
- `shouldShowWarning`: Boolean if warning should show

### updateLastActivity()
Updates the last activity timestamp. Called automatically on:
- Mouse clicks
- Keyboard input
- Page scrolling
- Touch interactions

### formatTimeRemaining(ms)
Converts milliseconds to human-readable format:
- `28800000` → "8 hours 0 minutes"
- `300000` → "5 minutes"

## User Experience

### Normal Usage
- User signs in
- System tracks activity
- Session extends with each interaction
- No interruption for active users

### Warning State (5 minutes before expiry)
- Warning dialog appears
- Shows time remaining
- "Continue Session" button
- Clicking extends session

### Expiry State (8 hours of inactivity)
- Automatic sign out
- Redirect to login page
- Message: "Your session has expired due to inactivity"

## Configuration

### Clerk Dashboard
1. Go to: https://dashboard.clerk.com/
2. Navigate to: Sessions → Settings
3. Set:
   - Session lifetime: `28800` seconds
   - Inactive lifetime: `28800` seconds

### Environment Variables
None required - timeout is hardcoded to 8 hours per specification.

## Testing

### Quick Test (Development)
Temporarily modify timeout for testing:

```typescript
// In session-timeout.ts
export const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes for testing
export const SESSION_WARNING_MS = 1 * 60 * 1000; // 1 minute warning
```

### Manual Test Steps
1. Sign in
2. Wait for warning (7h 55m or modified time)
3. Verify warning appears
4. Click "Continue Session"
5. Wait for expiry (8h or modified time)
6. Verify automatic sign out
7. Verify login page message

## Troubleshooting

### Warning Not Appearing
- Check browser console for errors
- Verify SessionManager is in layout
- Check localStorage for `session_last_activity`
- Ensure user is signed in

### Session Not Expiring
- Verify Clerk Dashboard settings
- Check if activity is being tracked
- Clear browser cache and cookies
- Sign out and sign in again

### Multiple Tabs
- Each tab tracks independently
- Activity in any tab extends session for all
- Clerk session is shared across tabs

## API Reference

### initializeSession()
```typescript
initializeSession(): void
```
Sets up session tracking. Called automatically by SessionManager.

### cleanupSession()
```typescript
cleanupSession(): void
```
Removes event listeners. Called automatically on unmount.

### clearSessionData()
```typescript
clearSessionData(): void
```
Clears localStorage data. Called automatically on sign out.

## Storage

### localStorage Keys
- `session_last_activity`: Timestamp of last user activity

### Data Format
```typescript
{
  session_last_activity: "1700000000000" // Unix timestamp in ms
}
```

## Security Notes

1. **Client-side tracking is for UX only**
   - Actual session validation is server-side via Clerk
   - Cannot be bypassed by modifying localStorage

2. **Activity tracking is passive**
   - No sensitive data is stored
   - Only timestamps are tracked

3. **Automatic cleanup**
   - Data is cleared on sign out
   - No persistent tracking across sessions

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS/Android)

Requires:
- localStorage support
- Modern JavaScript (ES6+)
- React 18+

## Performance Impact

- **Minimal**: Event listeners are passive
- **Storage**: < 1KB in localStorage
- **CPU**: Check runs once per minute
- **Memory**: Negligible

## Accessibility

- ✅ Keyboard accessible warning dialog
- ✅ Screen reader compatible
- ✅ Focus management
- ✅ ARIA labels

## Mobile Considerations

- Touch events tracked (touchstart)
- Warning dialog is mobile-responsive
- Works in mobile browsers
- No app-specific code needed

## Future Enhancements

Potential improvements:
1. Configurable timeout per role
2. Server-side session validation
3. Session activity logging
4. Customizable warning time
5. "Remember me" option

## Support

For issues or questions:
1. Check documentation in `docs/`
2. Review implementation in source files
3. Contact system administrator
4. Check Clerk documentation

## Related Documentation

- [Full Implementation Guide](./SESSION_TIMEOUT_IMPLEMENTATION.md)
- [Clerk Configuration Guide](./CLERK_SESSION_CONFIGURATION.md)
- [Implementation Summary](./SESSION_TIMEOUT_SUMMARY.md)

---

**Last Updated**: November 21, 2025
**Version**: 1.0
