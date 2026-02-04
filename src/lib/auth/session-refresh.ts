/**
 * Session Refresh Utilities
 * Handles session refresh after critical authentication events like school onboarding
 */

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

/**
 * Force refresh the current user's session data
 * This is useful after school onboarding or other critical auth state changes
 */
export async function refreshUserSession(userId: string): Promise<boolean> {
  try {
    // Get fresh user data from database
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        userSchools: {
          where: { isActive: true },
          include: {
            school: {
              select: {
                id: true,
                name: true,
                schoolCode: true,
                status: true,
                isOnboarded: true,
                onboardingCompletedAt: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      console.error("User not found or inactive during session refresh:", userId);
      return false;
    }

    // Check if user has completed onboarding
    const hasCompletedOnboarding = user.role === UserRole.SUPER_ADMIN || 
      user.userSchools.some(us => us.school.isOnboarded && us.school.onboardingCompletedAt);

    if (!hasCompletedOnboarding) {
      console.warn("User session refresh attempted but onboarding not completed:", userId);
      return false;
    }

    console.log("Session refresh successful for user:", userId, {
      role: user.role,
      schoolCount: user.userSchools.length,
      onboardedSchools: user.userSchools.filter(us => us.school.isOnboarded).length
    });

    return true;
  } catch (error) {
    console.error("Error refreshing user session:", error);
    return false;
  }
}

/**
 * Validate that the current session is valid and user has proper access
 */
export async function validateCurrentSession(): Promise<{
  isValid: boolean;
  session: any;
  error?: string;
}> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return {
        isValid: false,
        session: null,
        error: "No active session found"
      };
    }

    // Verify user still exists and is active
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        isActive: true,
        role: true,
        userSchools: {
          where: { isActive: true },
          include: {
            school: {
              select: {
                id: true,
                status: true,
                isOnboarded: true,
                onboardingCompletedAt: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return {
        isValid: false,
        session: null,
        error: "User account is inactive or not found"
      };
    }

    // For non-super-admin users, check if they have access to at least one onboarded school
    if (user.role !== UserRole.SUPER_ADMIN) {
      const hasOnboardedSchool = user.userSchools.some(us => 
        us.school.status === 'ACTIVE' && 
        us.school.isOnboarded && 
        us.school.onboardingCompletedAt
      );

      if (!hasOnboardedSchool) {
        return {
          isValid: false,
          session: session,
          error: "User has no access to onboarded schools"
        };
      }
    }

    return {
      isValid: true,
      session: session
    };
  } catch (error) {
    console.error("Error validating current session:", error);
    return {
      isValid: false,
      session: null,
      error: error instanceof Error ? error.message : "Unknown validation error"
    };
  }
}

/**
 * Enhanced session validation for security wrappers
 * Provides detailed error information for debugging
 */
export async function validateSessionForSecurityWrapper(): Promise<{
  isValid: boolean;
  session: any;
  userId?: string;
  role?: UserRole;
  schoolId?: string;
  error?: string;
  debugInfo?: Record<string, any>;
}> {
  try {
    // First try to get the session
    let session;
    try {
      session = await auth();
    } catch (authError) {
      // If auth() fails (e.g., outside request context), try to handle gracefully
      if (authError instanceof Error && authError.message.includes('request scope')) {
        return {
          isValid: false,
          session: null,
          error: "Session validation called outside request context",
          debugInfo: {
            timestamp: new Date().toISOString(),
            validationStep: "auth_context_error",
            authError: authError.message
          }
        };
      }
      throw authError; // Re-throw if it's a different error
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userRole: session?.user?.role,
      schoolId: session?.user?.schoolId
    };

    if (!session) {
      return {
        isValid: false,
        session: null,
        error: "No session object returned from auth()",
        debugInfo: {
          ...debugInfo,
          validationStep: "session_null"
        }
      };
    }

    if (!session.user) {
      return {
        isValid: false,
        session: session,
        error: "Session exists but no user object",
        debugInfo: {
          ...debugInfo,
          validationStep: "user_null"
        }
      };
    }

    if (!session.user.id) {
      return {
        isValid: false,
        session: session,
        error: "Session and user exist but no user ID",
        debugInfo: {
          ...debugInfo,
          validationStep: "user_id_null"
        }
      };
    }

    const userId = session.user.id;
    const role = session.user.role as UserRole;
    const schoolId = session.user.schoolId;

    // For server components, we'll trust the session data more
    // and do lighter validation to avoid database calls in every component
    
    // Only do database validation if we suspect the session might be stale
    const shouldValidateInDb = !role || (role !== UserRole.SUPER_ADMIN && !schoolId);
    
    if (shouldValidateInDb) {
      try {
        // Verify user still exists and is active
        const user = await db.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            isActive: true,
            role: true,
            userSchools: {
              where: { isActive: true },
              select: {
                schoolId: true,
                school: {
                  select: {
                    id: true,
                    status: true,
                    isOnboarded: true,
                    onboardingCompletedAt: true
                  }
                }
              }
            }
          }
        });

        if (!user || !user.isActive) {
          return {
            isValid: false,
            session: session,
            error: "User account is inactive or not found in database",
            debugInfo: {
              ...debugInfo,
              validationStep: "db_user_check",
              userExists: !!user,
              userActive: user?.isActive
            }
          };
        }

        // For non-super-admin users, check if they have access to at least one onboarded school
        if (user.role !== UserRole.SUPER_ADMIN) {
          const hasOnboardedSchool = user.userSchools.some(us => 
            us.school.status === 'ACTIVE' && 
            us.school.isOnboarded && 
            us.school.onboardingCompletedAt
          );

          if (!hasOnboardedSchool) {
            return {
              isValid: false,
              session: session,
              error: "User has no access to onboarded schools",
              debugInfo: {
                ...debugInfo,
                validationStep: "onboarded_school_check",
                schoolCount: user.userSchools.length,
                onboardedSchools: user.userSchools.filter(us => us.school.isOnboarded).length
              }
            };
          }
        }
      } catch (dbError) {
        // If database validation fails, we'll still allow the session if it looks valid
        console.warn("Database validation failed, trusting session data:", dbError);
      }
    }

    return {
      isValid: true,
      session: session,
      userId: userId,
      role: role,
      schoolId: schoolId,
      debugInfo: {
        ...debugInfo,
        validationStep: "success",
        dbValidationSkipped: !shouldValidateInDb
      }
    };
  } catch (error) {
    console.error("Error in enhanced session validation:", error);
    return {
      isValid: false,
      session: null,
      error: error instanceof Error ? error.message : "Unknown validation error",
      debugInfo: {
        timestamp: new Date().toISOString(),
        validationStep: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      }
    };
  }
}