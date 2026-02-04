import NextAuth from "next-auth";
import { authConfig } from "./src/auth.config";
import { NextResponse } from "next/server";
import { handleSubdomainRouting, getSubdomain } from "./src/lib/middleware/subdomain";
import { csrfProtection } from "./src/lib/middleware/csrf-protection";
import { rateLimit } from "./src/lib/middleware/rate-limit";
import { UserRole } from "@prisma/client";

const { auth } = NextAuth(authConfig);

// Routes that are public (don't require authentication)
const publicRoutes = [
  /^\/$/,
  /^\/login/,
  /^\/register/,
  /^\/forgot-password/,
  /^\/reset-password/,
  /^\/verify-email/,
  /^\/setup/,
  /^\/select-school/,
  /^\/select-child/,
  /^\/sd/, // Super admin login
  /^\/api\/auth/,
  /^\/api\/webhooks/,
  /^\/api\/csrf-token/,
  /^\/api\/web-vitals/,
  /^\/api\/test-rate-limit/,
  /^\/api\/subdomain/, // Subdomain validation API
  /^\/api\/schools\/validate/, // School validation API
  /^\/api\/otp/, // OTP generation API
  /^\/api\/health/,
  /^\/api\/status/,
  /^\/about/,
  /^\/contact/,
  /^\/privacy/,
  /^\/terms/,
  /^\/verify-certificate/,
];

// Context selection routes
const contextRoutes = [
  /^\/select-school/,
  /^\/select-child/,
  /^\/setup/,
];

// Rate limiting configurations for different route types
const rateLimitConfigs = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many API requests'
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes for auth endpoints
    message: 'Too many authentication attempts'
  },
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes for general routes
    message: 'Too many requests'
  }
};

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const subdomain = getSubdomain(hostname);

  // Apply rate limiting first (before any other processing)
  let rateLimitConfig = rateLimitConfigs.general;

  if (pathname.startsWith('/api/auth/')) {
    rateLimitConfig = rateLimitConfigs.auth;
  } else if (pathname.startsWith('/api/')) {
    rateLimitConfig = rateLimitConfigs.api;
  }

  const rateLimitResponse = await rateLimit(req, rateLimitConfig);
  if (rateLimitResponse) {
    return rateLimitResponse; // Rate limit exceeded
  }

  // Apply CSRF protection for state-changing requests
  const csrfResponse = await csrfProtection(req);
  if (csrfResponse) {
    return csrfResponse; // CSRF validation failed
  }

  // Handle subdomain routing first
  if (subdomain) {
    // For subdomains, we need to handle routing differently
    const subdomainResponse = await handleSubdomainRouting(req);

    // If subdomain handling returns a redirect or error, return it
    if (subdomainResponse.status !== 200) {
      return subdomainResponse;
    }

    // For subdomain requests, super-admin routes should redirect to main domain
    if (pathname.startsWith('/super-admin')) {
      const mainDomainUrl = new URL(req.url);
      mainDomainUrl.hostname = process.env.ROOT_DOMAIN || 'localhost';
      return NextResponse.redirect(mainDomainUrl);
    }

    // Continue with subdomain-specific auth logic
    const session = req.auth;

    // For subdomain public routes, allow access
    if (publicRoutes.some(pattern => pattern.test(pathname))) {
      return subdomainResponse;
    }

    // Require authentication for protected routes on subdomains
    if (!session?.user?.id) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Get school ID from subdomain response headers
    const schoolId = subdomainResponse.headers.get('x-school-id');

    // Verify user has access to this school
    if (session.user.role !== 'SUPER_ADMIN' && session.user.schoolId !== schoolId) {
      return new NextResponse('Access denied to this school', { status: 403 });
    }

    return subdomainResponse;
  }

  // Main domain logic (no subdomain)
  // Skip middleware for public routes
  if (publicRoutes.some(pattern => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // Get session from the request (injected by the auth wrapper)
  const session = req.auth;

  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  const user = session.user;

  // Super admin routes
  if (pathname.startsWith('/super-admin')) {
    if (user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/login?error=access_denied", req.url));
    }
    return NextResponse.next();
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Teacher routes
  if (pathname.startsWith('/teacher')) {
    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Student routes
  if (pathname.startsWith('/student')) {
    if (user.role !== UserRole.STUDENT && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Parent routes
  if (pathname.startsWith('/parent')) {
    if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Context selection routes - allow when needed
  if (contextRoutes.some(pattern => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // Default dashboard route
  // Handle /dashboard and /dashboard/ explicitly
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    console.log(`[Middleware] Handling /dashboard redirect for user: ${user.id}, role: ${user.role}`);

    // Redirect to role-specific dashboard
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return NextResponse.redirect(new URL("/super-admin", req.url));
      case UserRole.ADMIN:
        return NextResponse.redirect(new URL("/admin", req.url));
      case UserRole.TEACHER:
        return NextResponse.redirect(new URL("/teacher", req.url));
      case UserRole.STUDENT:
        return NextResponse.redirect(new URL("/student", req.url));
      case UserRole.PARENT:
        return NextResponse.redirect(new URL("/parent", req.url));
      default:
        console.log(`[Middleware] No matching role for /dashboard, redirecting to login. Role: ${user.role}`);
        return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Route validation passed, allow request
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};