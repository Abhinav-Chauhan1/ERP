/**
 * Clerk Middleware Configuration
 * 
 * Configures Clerk session settings including:
 * - Session timeout duration (8 hours)
 * - Session token lifetime
 * 
 * Note: Some settings must be configured in the Clerk Dashboard:
 * https://dashboard.clerk.com/
 * 
 * Dashboard Settings:
 * - Navigate to: Sessions > Settings
 * - Set "Session lifetime" to 8 hours (28800 seconds)
 * - Set "Inactive lifetime" to 8 hours (28800 seconds)
 * 
 * Implements Requirement 6.5: 8-hour session timeout
 */

export const clerkMiddlewareConfig = {
  // Session configuration
  session: {
    // Maximum session lifetime in seconds (8 hours)
    maxAge: 8 * 60 * 60, // 28800 seconds
    
    // Inactive session timeout in seconds (8 hours)
    inactiveExpiration: 8 * 60 * 60, // 28800 seconds
  },
  
  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    '/login(.*)',
    '/register(.*)',
    '/forgot-password(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
    '/api/users/sync(.*)',
    '/api/test-rate-limit(.*)',
  ],
  
  // Routes that should ignore authentication
  ignoredRoutes: [
    '/api/webhooks(.*)',
  ],
};

export default clerkMiddlewareConfig;
