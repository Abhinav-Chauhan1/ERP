/**
 * Authorization utilities for the Enhanced Syllabus System
 * Implements role-based access control for syllabus operations
 * 
 * Requirements: All (Authorization checks for all operations)
 */

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

/**
 * Authorization result type
 */
export interface AuthorizationResult {
  authorized: boolean;
  user?: {
    id: string;
    role: UserRole;
    email: string;
  };
  error?: string;
  code?: string;
}

/**
 * Get the current authenticated user with role information
 * This is the base function used by all authorization checks
 */
export async function getCurrentUser(): Promise<AuthorizationResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        authorized: false,
        error: "Authentication required",
        code: "UNAUTHENTICATED",
      };
    }

    // Find user in database with role information
    const user = await db.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
        email: true,
      },
    });

    if (!user) {
      return {
        authorized: false,
        error: "User not found in database",
        code: "USER_NOT_FOUND",
      };
    }

    return {
      authorized: true,
      user: {
        id: user.id,
        role: user.role,
        email: user.email || ''
      },
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return {
      authorized: false,
      error: "Failed to authenticate user",
      code: "AUTH_ERROR",
    };
  }
}

/**
 * Check if user has admin role
 * Admins have full CRUD permissions on all syllabus operations
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1-3.6, 4.1-4.5, 8.1-8.3, 9.1-9.4
 */
export async function requireAdmin(): Promise<AuthorizationResult> {
  const authResult = await getCurrentUser();

  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }

  if (authResult.user.role !== UserRole.ADMIN) {
    return {
      authorized: false,
      error: "Admin access required",
      code: "FORBIDDEN",
    };
  }

  return authResult;
}

/**
 * Check if user has teacher role
 * Teachers can view syllabus content and track progress
 * 
 * Requirements: 5.1-5.5, 10.1-10.5
 */
export async function requireTeacher(): Promise<AuthorizationResult> {
  const authResult = await getCurrentUser();

  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }

  if (authResult.user.role !== UserRole.TEACHER) {
    return {
      authorized: false,
      error: "Teacher access required",
      code: "FORBIDDEN",
    };
  }

  return authResult;
}

/**
 * Check if user has student role
 * Students have read-only access to syllabus content
 * 
 * Requirements: 6.1-6.5
 */
export async function requireStudent(): Promise<AuthorizationResult> {
  const authResult = await getCurrentUser();

  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }

  if (authResult.user.role !== UserRole.STUDENT) {
    return {
      authorized: false,
      error: "Student access required",
      code: "FORBIDDEN",
    };
  }

  return authResult;
}

/**
 * Check if user has admin or teacher role
 * Used for operations that both admins and teachers can perform
 * 
 * Requirements: 5.1-5.5, 10.1-10.5
 */
export async function requireAdminOrTeacher(): Promise<AuthorizationResult> {
  const authResult = await getCurrentUser();

  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }

  if (
    authResult.user.role !== UserRole.ADMIN &&
    authResult.user.role !== UserRole.TEACHER
  ) {
    return {
      authorized: false,
      error: "Admin or Teacher access required",
      code: "FORBIDDEN",
    };
  }

  return authResult;
}

/**
 * Check if user can view syllabus content
 * All authenticated users (admin, teacher, student) can view syllabus
 * 
 * Requirements: 5.1-5.5, 6.1-6.5
 */
export async function requireViewAccess(): Promise<AuthorizationResult> {
  const authResult = await getCurrentUser();

  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }

  // All authenticated users with valid roles can view
  const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT];

  if (!allowedRoles.includes(authResult.user.role)) {
    return {
      authorized: false,
      error: "Access denied",
      code: "FORBIDDEN",
    };
  }

  return authResult;
}

/**
 * Check if user can modify syllabus content (modules, sub-modules, documents)
 * Only admins can modify syllabus structure
 * 
 * Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.6, 4.1-4.5, 8.1-8.3, 9.1-9.4
 */
export async function requireModifyAccess(): Promise<AuthorizationResult> {
  return requireAdmin();
}

/**
 * Check if user can track progress
 * Only teachers can mark sub-modules as complete
 * 
 * Requirements: 10.1-10.5
 */
export async function requireProgressTrackingAccess(): Promise<AuthorizationResult> {
  return requireTeacher();
}

/**
 * Verify that a teacher can only track their own progress
 * Ensures teachers cannot modify other teachers' progress
 * 
 * Requirements: 10.1-10.5
 */
export async function verifyTeacherOwnership(
  teacherId: string
): Promise<AuthorizationResult> {
  const authResult = await requireTeacher();

  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }

  // Verify the teacher is accessing their own progress
  if (authResult.user.id !== teacherId) {
    return {
      authorized: false,
      error: "Cannot access another teacher's progress",
      code: "FORBIDDEN",
    };
  }

  return authResult;
}

/**
 * Helper function to format authorization errors for API responses
 */
export function formatAuthError(authResult: AuthorizationResult): {
  success: false;
  error: string;
  code?: string;
} {
  return {
    success: false,
    error: authResult.error || "Authorization failed",
    code: authResult.code,
  };
}
