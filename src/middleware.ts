import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

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
  "/api/users/sync(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // Handle public routes
  if (publicRoutes(req)) {
    return NextResponse.next();
  }

  // Get the auth object by awaiting the auth() function
  const authObject = await auth();
  
  // If user is not signed in and tries to access a protected route
  if (!authObject.userId) {
    // Redirect to sign in
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // No database operations in middleware!
  // Instead, rely on Clerk session claims for role-based access

  // Get role from metadata in session claims
  const role = (authObject.sessionClaims?.metadata as { role?: string })?.role;

  // Role-based access control
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
