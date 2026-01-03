import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { rateLimit, getClientIp, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { isIpWhitelisted, createIpBlockedResponse } from "@/lib/utils/ip-whitelist";
import { checkPermissionInMiddleware } from "@/lib/utils/permission-middleware";

// Use Node.js runtime instead of Edge Runtime for compatibility with bcryptjs and crypto
export const runtime = 'nodejs';

/**
 * Helper function to check if a route matches a pattern
 */
function matchesRoute(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Convert pattern to regex (e.g., "/admin(.*)" -> /^\/admin.*/)
    const regexPattern = pattern
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .replace(/\.\*/g, '.*');

    // Use strict matching with boundary check (matches "/path" or "/path/...")
    // This prevents "/" from matching "/admin"
    const regex = new RegExp(`^${regexPattern}(?:/|$)`);
    return regex.test(pathname);
  });
}

// Define route access patterns
const adminRoutePatterns = ["/admin"];
const teacherRoutePatterns = ["/teacher", "/shared"];
const studentRoutePatterns = ["/student", "/shared"];
const parentRoutePatterns = ["/parent", "/shared"];
const publicRoutePatterns = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/sign-in",
  "/sign-up",
  "/api/auth",
  "/api/webhooks",
  "/api/users/sync",
  "/api/test-rate-limit",
  "/verify-certificate"
];
const authRedirectRoutePatterns = ["/auth-redirect"];
const apiRoutePatterns = ["/api"];

export default auth(async (req) => {
  const session = req.auth;
  const pathname = req.nextUrl.pathname;

  // Get client IP for rate limiting and IP whitelisting
  const clientIp = getClientIp(req.headers);

  // Apply IP whitelisting to admin routes
  if (matchesRoute(pathname, adminRoutePatterns)) {
    if (!isIpWhitelisted(clientIp)) {
      console.warn(`Blocked admin access from non-whitelisted IP: ${clientIp}`);

      // Log failed authorization - IP blocked
      if (session?.user?.id) {
        const { logAuthorizationFailure } = await import("@/lib/services/auth-audit-service");
        await logAuthorizationFailure(
          session.user.id,
          "ADMIN_ROUTE",
          "ACCESS",
          "IP address not whitelisted",
          { pathname, clientIp }
        );
      }

      return createIpBlockedResponse();
    }
  }

  // Apply rate limiting to all API routes
  if (matchesRoute(pathname, apiRoutePatterns)) {
    const rateLimitResult = await rateLimit(clientIp);

    const rateLimitResponse = createRateLimitResponse(rateLimitResult);
    if (rateLimitResponse) {
      // Log failed authorization - rate limited
      if (session?.user?.id) {
        const { logAuthorizationFailure } = await import("@/lib/services/auth-audit-service");
        await logAuthorizationFailure(
          session.user.id,
          "API_ROUTE",
          "ACCESS",
          "Rate limit exceeded",
          { pathname, clientIp, limit: rateLimitResult.limit }
        );
      }

      return rateLimitResponse;
    }

    // Add rate limit headers to successful requests
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());

    // Continue with authentication checks for non-public API routes
    if (!matchesRoute(pathname, publicRoutePatterns)) {
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    return response;
  }

  // Handle public routes
  if (matchesRoute(pathname, publicRoutePatterns)) {
    // If user is already logged in and trying to access auth pages, redirect to their dashboard
    if (session?.user) {
      const authPages = ["/login", "/register", "/forgot-password", "/sign-in", "/sign-up"];
      if (authPages.some(page => pathname.startsWith(page))) {
        const role = session.user.role;
        const redirectMap: Record<string, string> = {
          [UserRole.ADMIN]: '/admin',
          [UserRole.TEACHER]: '/teacher',
          [UserRole.STUDENT]: '/student',
          [UserRole.PARENT]: '/parent',
        };
        const redirectUrl = redirectMap[role] || '/';
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
    }
    return NextResponse.next();
  }

  // If user is not signed in and tries to access a protected route
  if (!session?.user) {
    // Redirect to login page
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Allow auth-redirect route without role checking
  if (matchesRoute(pathname, authRedirectRoutePatterns)) {
    return NextResponse.next();
  }

  // Get role from session
  const role = session.user.role;

  // Check route-level permissions
  const permissionCheck = checkPermissionInMiddleware(pathname, role);

  if (!permissionCheck.allowed) {
    console.warn(
      `Permission denied for user ${session.user.id} (${role}) accessing ${pathname}`,
      `Required: ${permissionCheck.action} ${permissionCheck.resource}`,
      `Reason: ${permissionCheck.reason}`
    );

    // Log failed authorization - insufficient permissions
    const { logAuthorizationFailure } = await import("@/lib/services/auth-audit-service");
    await logAuthorizationFailure(
      session.user.id,
      permissionCheck.resource || pathname,
      permissionCheck.action || "ACCESS",
      permissionCheck.reason || "Insufficient permissions",
      {
        pathname,
        role,
        requiredAction: permissionCheck.action,
        requiredResource: permissionCheck.resource
      }
    );

    // Redirect to appropriate dashboard based on role
    const redirectMap: Record<string, string> = {
      [UserRole.ADMIN]: '/admin',
      [UserRole.TEACHER]: '/teacher',
      [UserRole.STUDENT]: '/student',
      [UserRole.PARENT]: '/parent',
    };

    const redirectUrl = redirectMap[role] || '/';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  // Role-based access control (fallback for routes without specific permissions)
  if (role === UserRole.ADMIN) {
    // Admins can access everything
    return NextResponse.next();
  } else if (role === UserRole.TEACHER) {
    // Teachers cannot access admin routes
    if (matchesRoute(pathname, adminRoutePatterns)) {
      // Log failed authorization - role-based access denied
      const { logAuthorizationFailure } = await import("@/lib/services/auth-audit-service");
      await logAuthorizationFailure(
        session.user.id,
        "ADMIN_ROUTE",
        "ACCESS",
        "Insufficient role permissions",
        { pathname, role, requiredRole: "ADMIN" }
      );

      return NextResponse.redirect(new URL("/teacher", req.url));
    }
  } else if (role === UserRole.STUDENT) {
    // Students cannot access admin or teacher routes
    if (matchesRoute(pathname, adminRoutePatterns) || matchesRoute(pathname, teacherRoutePatterns)) {
      // Log failed authorization - role-based access denied
      const { logAuthorizationFailure } = await import("@/lib/services/auth-audit-service");
      await logAuthorizationFailure(
        session.user.id,
        matchesRoute(pathname, adminRoutePatterns) ? "ADMIN_ROUTE" : "TEACHER_ROUTE",
        "ACCESS",
        "Insufficient role permissions",
        { pathname, role, requiredRole: matchesRoute(pathname, adminRoutePatterns) ? "ADMIN" : "TEACHER" }
      );

      return NextResponse.redirect(new URL("/student", req.url));
    }
  } else if (role === UserRole.PARENT) {
    // Parents cannot access admin, teacher, or student routes
    if (matchesRoute(pathname, adminRoutePatterns) ||
      matchesRoute(pathname, teacherRoutePatterns) ||
      matchesRoute(pathname, studentRoutePatterns)) {
      // Log failed authorization - role-based access denied
      const { logAuthorizationFailure } = await import("@/lib/services/auth-audit-service");
      let requiredRole = "ADMIN";
      if (matchesRoute(pathname, teacherRoutePatterns)) requiredRole = "TEACHER";
      if (matchesRoute(pathname, studentRoutePatterns)) requiredRole = "STUDENT";

      await logAuthorizationFailure(
        session.user.id,
        `${requiredRole}_ROUTE`,
        "ACCESS",
        "Insufficient role permissions",
        { pathname, role, requiredRole }
      );

      return NextResponse.redirect(new URL("/parent", req.url));
    }
  }

  // Allow request to continue
  return NextResponse.next();
}) as any;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
