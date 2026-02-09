# OAuth Configuration Guide

This guide provides step-by-step instructions for configuring OAuth providers (Google and GitHub) for the School ERP authentication system using NextAuth v5.

## Overview

The system supports OAuth authentication through:
- **Google OAuth 2.0** - Allows users to sign in with their Google accounts
- **GitHub OAuth** - Allows users to sign in with their GitHub accounts

OAuth accounts are automatically linked to existing users by email address, or new user accounts are created if no matching email exists.

## Prerequisites

- Access to Google Cloud Console (for Google OAuth)
- Access to GitHub Developer Settings (for GitHub OAuth)
- Admin access to your application's environment variables

---

## Google OAuth Configuration

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: "School ERP" (or your preferred name)
5. Click "Create"

### Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (or "Internal" if using Google Workspace)
3. Click "Create"
4. Fill in the required information:
   - **App name**: School ERP
   - **User support email**: Your support email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Add these scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
8. Click "Save and Continue"
9. Add test users if needed (for testing phase)
10. Click "Save and Continue"
11. Review and click "Back to Dashboard"

### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name: "School ERP Web Client"
5. Add **Authorized JavaScript origins**:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
6. Add **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Click "Create"
8. Copy the **Client ID** and **Client Secret**

### Step 5: Add to Environment Variables

Add the following to your `.env` file:

```env
AUTH_GOOGLE_ID=your_google_client_id_here
AUTH_GOOGLE_SECRET=your_google_client_secret_here
```

---

## GitHub OAuth Configuration

### Step 1: Register OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" in the left sidebar
3. Click "New OAuth App"

### Step 2: Fill in Application Details

1. **Application name**: School ERP
2. **Homepage URL**:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. **Application description**: School ERP Authentication (optional)
4. **Authorization callback URL**:
   - Development: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://yourdomain.com/api/auth/callback/github`
5. Click "Register application"

### Step 3: Generate Client Secret

1. After registration, you'll see your **Client ID**
2. Click "Generate a new client secret"
3. Copy the **Client Secret** immediately (it won't be shown again)

### Step 4: Add to Environment Variables

Add the following to your `.env` file:

```env
AUTH_GITHUB_ID=your_github_client_id_here
AUTH_GITHUB_SECRET=your_github_client_secret_here
```

---

## Testing OAuth Configuration

### Test OAuth Callback URLs

You can test if your OAuth callback URLs are correctly configured by checking these endpoints:

**Google OAuth Test**:
```
http://localhost:3000/api/auth/signin/google
```

**GitHub OAuth Test**:
```
http://localhost:3000/api/auth/signin/github
```

### Verify Environment Variables

Run this command to verify your environment variables are loaded:

```bash
# On Windows PowerShell
$env:AUTH_GOOGLE_ID
$env:AUTH_GITHUB_ID

# On Linux/Mac
echo $AUTH_GOOGLE_ID
echo $AUTH_GITHUB_ID
```

### Test OAuth Flow

1. Navigate to your login page: `http://localhost:3000/login`
2. Click on "Sign in with Google" or "Sign in with GitHub"
3. You should be redirected to the OAuth provider
4. After authorization, you should be redirected back to your application
5. Check if the user is created or linked correctly in the database

---

## Production Deployment

### Update Redirect URLs

When deploying to production, you must update the redirect URLs in both Google Cloud Console and GitHub OAuth settings:

**Google Cloud Console**:
1. Go to "APIs & Services" > "Credentials"
2. Click on your OAuth client
3. Add production URLs to "Authorized redirect URIs":
   - `https://yourdomain.com/api/auth/callback/google`

**GitHub OAuth Settings**:
1. Go to your OAuth App settings
2. Update "Authorization callback URL":
   - `https://yourdomain.com/api/auth/callback/github`

### Update Environment Variables

Update your production environment variables:

```env
AUTH_URL=https://yourdomain.com
AUTH_TRUST_HOST=true
AUTH_GOOGLE_ID=your_production_google_client_id
AUTH_GOOGLE_SECRET=your_production_google_client_secret
AUTH_GITHUB_ID=your_production_github_client_id
AUTH_GITHUB_SECRET=your_production_github_client_secret
```

---

## Security Considerations

### Account Linking

The system uses `allowDangerousEmailAccountLinking: true` in the OAuth provider configuration. This means:

- If a user signs in with OAuth and an account with that email already exists, the OAuth account will be linked automatically
- This is convenient but requires that email addresses are verified by the OAuth provider
- Both Google and GitHub verify email addresses, so this is safe

### Email Verification

- OAuth accounts are automatically marked as email verified
- Users who sign up with OAuth don't need to verify their email separately
- The OAuth provider (Google/GitHub) has already verified the email

### Session Security

- OAuth sessions use the same database session strategy as credentials login
- Sessions expire after 30 minutes of inactivity
- All security features (rate limiting, IP whitelisting) apply to OAuth users

---

## Troubleshooting

### "Redirect URI mismatch" Error

**Problem**: OAuth provider shows "redirect_uri_mismatch" error

**Solution**:
1. Check that your redirect URI exactly matches what's configured in the OAuth provider
2. Ensure there are no trailing slashes
3. Verify the protocol (http vs https)
4. Check that AUTH_URL environment variable is set correctly

### "Invalid client" Error

**Problem**: OAuth provider shows "invalid_client" error

**Solution**:
1. Verify AUTH_GOOGLE_ID/AUTH_GITHUB_ID is correct
2. Verify AUTH_GOOGLE_SECRET/AUTH_GITHUB_SECRET is correct
3. Check for extra spaces or newlines in environment variables
4. Restart your development server after changing environment variables

### OAuth Button Not Working

**Problem**: Clicking OAuth button does nothing or shows error

**Solution**:
1. Check browser console for JavaScript errors
2. Verify NextAuth API route is accessible: `/api/auth/providers`
3. Check that environment variables are loaded
4. Verify the signIn function is imported correctly

### User Not Created After OAuth Sign-in

**Problem**: OAuth sign-in succeeds but user is not created in database

**Solution**:
1. Check database connection
2. Verify Prisma schema includes Account and Session models
3. Check server logs for database errors
4. Verify the signIn callback in auth.ts is working correctly

---

## Additional Resources

- [NextAuth v5 Documentation](https://authjs.dev/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [NextAuth OAuth Providers](https://authjs.dev/getting-started/providers)

---

## Support

If you encounter issues not covered in this guide:

1. Check the application logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test OAuth flow in incognito/private browsing mode
4. Check the AuditLog table for authentication events
5. Contact your system administrator for assistance
