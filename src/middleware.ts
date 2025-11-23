import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { rateLimit, getClientIp, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { isIpWhitelisted, createIpBlockedResponse } from "@/lib/utils/ip-whitelist";
import { checkPermissionInMiddleware } from "@/lib/utils/permission-middleware";

// Define route access patterns directly in the middleware
const adminRoutes = createRouteMatcher(["/admin(.*)"]);
const teacherRoutes = createRouteMatcher(["/teacher(.*)", "/shared(.*)"]);
const studentRoutes = createRouteMatcher(["/student(.*)", "/shared(.*)"]);
const parentRoutes = createRouteMatcher(["/parent(.*)", "/shared(.*)"]);
const publicRoutes = createRouteMatcher([
  "/", 
  "/login(.*)",  // Use (.*) to match all routes under /login
  "/register(.*)",  // Use (.*) to match all routes under /register
  "/forgot-password(.*)",  // Use (.*) to match all routes under /forgot-password
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/users/sync(.*)",
  "/api/test-rate-limit(.*)"  // Test endpoint for rate limiting
]);

const authRedirectRoute = createRouteMatcher(["/auth-redirect"]);
const apiRoutes = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Get client IP for rate limiting and IP whitelisting
  const clientIp = getClientIp(req.headers);
  
  // Apply IP whitelisting to admin routes
  if (adminRoutes(req)) {
    if (!isIpWhitelisted(clientIp)) {
      console.warn(`Blocked admin access from non-whitelisted IP: ${clientIp}`);
      return createIpBlockedResponse();
    }
  }
  
  // Apply rate limiting to all API routes
  if (apiRoutes(req)) {
    const rateLimitResult = await rateLimit(clientIp);
    
    const rateLimitResponse = createRateLimitResponse(rateLimitResult);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Add rate limit headers to successful requests
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());
    
    // Continue with authentication checks for non-public API routes
    if (!publicRoutes(req)) {
      const authObject = await auth();
      if (!authObject.userId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
    }
    
    return response;
  }
  
  // Handle public routes
  if (publicRoutes(req)) {
    return NextResponse.next();
  }

  // Get the auth object by awaiting the auth() function
  const authObject = await auth();
  
  // If user is not signed in and tries to access a protected route
  if (!authObject.userId) {
    // Redirect to login page
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Allow auth-redirect route without role checking
  if (authRedirectRoute(req)) {
    return NextResponse.next();
  }

  // No database operations in middleware!
  // Instead, rely on Clerk session claims for role-based access

  // Get role from metadata in session claims
  const role = (authObject.sessionClaims?.metadata as { role?: string })?.role;

  // Check route-level permissions
  const permissionCheck = checkPermissionInMiddleware(req.nextUrl.pathname, role as UserRole);
  
  if (!permissionCheck.allowed) {
    console.warn(
      `Permission denied for user ${authObject.userId} (${role}) accessing ${req.nextUrl.pathname}`,
      `Required: ${permissionCheck.action} ${permissionCheck.resource}`,
      `Reason: ${permissionCheck.reason}`
    );
    
    // Redirect to appropriate dashboard based on role
    const redirectMap: Record<string, string> = {
      [UserRole.ADMIN]: '/admin',
      [UserRole.TEACHER]: '/teacher',
      [UserRole.STUDENT]: '/student',
      [UserRole.PARENT]: '/parent',
    };
    
    const redirectUrl = redirectMap[role as UserRole] || '/';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  // Role-based access control (fallback for routes without specific permissions)
  if (role === UserRole.ADMIN) {
    // Admins can access everything
    return NextResponse.next();
  } else if (role === UserRole.TEACHER) {
    // Teachers cannot access admin routes
    if (adminRoutes(req)) {
      return NextResponse.redirect(new URL("/teacher", req.url));
    }
  } else if (role === UserRole.STUDENT) {
    // Students cannot access admin or teacher routes
    if (adminRoutes(req) || teacherRoutes(req)) {
      return NextResponse.redirect(new URL("/student", req.url));
    }
  } else if (role === UserRole.PARENT) {
    // Parents cannot access admin, teacher, or student routes
    if (adminRoutes(req) || teacherRoutes(req) || studentRoutes(req)) {
      return NextResponse.redirect(new URL("/parent", req.url));
    }
  }

  // Allow request to continue
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
