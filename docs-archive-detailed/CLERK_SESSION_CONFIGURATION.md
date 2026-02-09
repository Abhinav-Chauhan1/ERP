# Clerk Session Configuration Guide

## Overview

This guide provides step-by-step instructions for configuring Clerk session settings to enforce the 8-hour session timeout requirement.

## Prerequisites

- Access to Clerk Dashboard
- Admin permissions for your Clerk application

## Configuration Steps

### 1. Access Clerk Dashboard

1. Navigate to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Sign in with your Clerk account
3. Select your application from the dashboard

### 2. Navigate to Session Settings

1. In the left sidebar, click on **Sessions**
2. Click on the **Settings** tab

### 3. Configure Session Lifetime

Configure the following settings:

#### Session Lifetime
- **Setting**: Maximum session duration
- **Value**: `28800` seconds (8 hours)
- **Description**: The maximum time a session can remain active

#### Inactive Lifetime
- **Setting**: Maximum inactive duration
- **Value**: `28800` seconds (8 hours)
- **Description**: The maximum time a session can remain inactive before expiring

### 4. Additional Recommended Settings

#### Multi-Session Handling
- **Recommended**: Allow multiple sessions
- **Description**: Allows users to be signed in on multiple devices

#### Session Token Lifetime
- **Recommended**: `3600` seconds (1 hour)
- **Description**: How long a session token is valid before needing refresh

### 5. Save Configuration

1. Review all settings
2. Click **Save** or **Update** button
3. Wait for confirmation message

## Verification

After configuration, verify the settings:

1. Sign in to your application
2. Check that session expires after 8 hours of inactivity
3. Verify warning appears 5 minutes before expiry
4. Confirm automatic sign out on expiry

## Configuration via API (Optional)

If you prefer to configure via API, use the Clerk Backend API:

```bash
curl -X PATCH https://api.clerk.com/v1/instance/session_settings \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "session_lifetime": 28800,
    "inactive_lifetime": 28800
  }'
```

## Troubleshooting

### Sessions Not Expiring

**Problem**: Sessions remain active beyond 8 hours

**Solutions**:
1. Verify settings were saved in Clerk Dashboard
2. Clear browser cache and cookies
3. Sign out and sign in again
4. Check for any custom session handling in your code

### Warning Not Appearing

**Problem**: Session timeout warning doesn't show

**Solutions**:
1. Verify client-side code is deployed
2. Check browser console for errors
3. Ensure SessionManager component is rendered
4. Verify localStorage is enabled in browser

### Multiple Tabs Behavior

**Problem**: Session expires in one tab but not others

**Solutions**:
1. This is expected behavior - each tab tracks independently
2. Clerk session is shared across tabs
3. Activity in any tab extends the session for all tabs

## Environment-Specific Configuration

### Development
- Consider shorter timeout for testing (e.g., 5 minutes)
- Enable verbose logging
- Use test mode in Clerk

### Staging
- Use production-like settings (8 hours)
- Test with real user scenarios
- Monitor session behavior

### Production
- Use 8-hour timeout as specified
- Enable monitoring and alerts
- Document any custom configurations

## Security Best Practices

1. **Never expose session tokens**: Keep Clerk secret keys secure
2. **Use HTTPS**: Always use HTTPS in production
3. **Monitor sessions**: Track unusual session patterns
4. **Regular audits**: Review session logs periodically
5. **Update regularly**: Keep Clerk SDK updated

## Support

If you encounter issues:

1. Check [Clerk Documentation](https://clerk.com/docs)
2. Visit [Clerk Support](https://clerk.com/support)
3. Contact your system administrator
4. Review application logs

## Related Documentation

- [Session Timeout Implementation](./SESSION_TIMEOUT_IMPLEMENTATION.md)
- [Clerk Session Management](https://clerk.com/docs/authentication/configuration/session-options)
- [Security Best Practices](./SECURITY.md)

## Changelog

### Version 1.0 (Current)
- Initial configuration for 8-hour session timeout
- Added session warning at 5 minutes before expiry
- Implemented automatic sign out on expiry
