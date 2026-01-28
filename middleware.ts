import NextAuth from "next-auth";
import { authConfig } from "./src/auth.config";
import { NextResponse } from "next/server";
import { handleSubdomainRouting, getSubdomain } from "./src/lib/middleware/subdomain";
import { roleRouterService } from "./src/lib/services/role-router-service";
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

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const subdomain = getSubdomain(hostname);

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
    
    // Verify user has access to this school using RoleRouterService
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

  // Create session context for route validation
  const sessionContext = {
    userId: session.user.id,
    role: session.user.role as UserRole,
    activeSchoolId: session.user.schoolId || undefined,
    activeStudentId: session.user.activeStudentId || undefined,
    authorizedSchools: session.user.authorizedSchools || [],
    availableChildren: session.user.availableChildren || [],
    permissions: session.user.permissions || [],
    isOnboarded: session.user.isOnboarded || false,
    requiresSchoolSelection: !session.user.schoolId && session.user.role !== UserRole.SUPER_ADMIN,
    requiresChildSelection: session.user.role === UserRole.PARENT && 
                           !session.user.activeStudentId && 
                           session.user.availableChildren && 
                           session.user.availableChildren.length > 1
  };

  // Allow context selection routes when needed
  if (contextRoutes.some(pattern => pattern.test(pathname))) {
    const validation = roleRouterService.validateRouteAccessDetailed(sessionContext, pathname);
    if (validation.isValid) {
      return NextResponse.next();
    } else if (validation.suggestedRoute) {
      return NextResponse.redirect(new URL(validation.suggestedRoute, req.url));
    }
  }

  // Use RoleRouterService for comprehensive route validation
  const routeValidation = roleRouterService.validateRouteAccessDetailed(sessionContext, pathname);
  
  if (!routeValidation.isValid) {
    // Handle different validation failures
    switch (routeValidation.reason) {
      case 'MISSING_SCHOOL_CONTEXT':
        return NextResponse.redirect(new URL("/select-school", req.url));
      
      case 'MISSING_CHILD_CONTEXT':
        return NextResponse.redirect(new URL("/select-child", req.url));
      
      case 'ONBOARDING_INCOMPLETE':
        return NextResponse.redirect(new URL("/setup", req.url));
      
      case 'ROLE_MISMATCH':
        // Redirect to appropriate dashboard for user's role
        const userRoute = roleRouterService.getDefaultRoute(sessionContext);
        return NextResponse.redirect(new URL(userRoute, req.url));
      
      case 'INSUFFICIENT_PERMISSIONS':
        // Redirect to user's default route with error parameter
        const defaultRoute = roleRouterService.getDefaultRoute(sessionContext);
        const errorUrl = new URL(defaultRoute, req.url);
        errorUrl.searchParams.set("error", "insufficient_permissions");
        return NextResponse.redirect(errorUrl);
      
      default:
        // For other validation failures, redirect to appropriate dashboard
        if (routeValidation.suggestedRoute) {
          return NextResponse.redirect(new URL(routeValidation.suggestedRoute, req.url));
        } else {
          const fallbackRoute = roleRouterService.getDefaultRoute(sessionContext);
          return NextResponse.redirect(new URL(fallbackRoute, req.url));
        }
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