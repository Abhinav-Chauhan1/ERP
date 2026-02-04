import { db } from "@/lib/db";
import { SchoolStatus, AuditAction } from "@prisma/client";
import { logAuditEvent } from "./audit-service";

/**
 * School Context Service
 * Manages school identification, validation, and context switching.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5
 */

export interface School {
  id: string;
  name: string;
  schoolCode: string;
  status: SchoolStatus;
  isOnboarded: boolean;
  onboardingStep: number;
}

export interface SchoolContextSwitchResult {
  success: boolean;
  message: string;
  error?: string;
}

// Custom errors for better error handling
export class SchoolContextError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SchoolContextError';
  }
}

export class SchoolNotFoundError extends SchoolContextError {
  constructor(identifier: string) {
    super(`School not found: ${identifier}`, 'SCHOOL_NOT_FOUND');
  }
}

export class SchoolInactiveError extends SchoolContextError {
  constructor(schoolCode: string) {
    super(`School is inactive: ${schoolCode}`, 'SCHOOL_INACTIVE');
  }
}

export class UnauthorizedSchoolAccessError extends SchoolContextError {
  constructor(userId: string, schoolId: string) {
    super(`User ${userId} not authorized for school ${schoolId}`, 'UNAUTHORIZED_ACCESS');
  }
}

class SchoolContextService {
  /**
   * Validate school code and return school if valid and active
   * Requirements: 2.2, 2.3
   */
  async validateSchoolCode(code: string): Promise<School | null> {
    try {
      const school = await db.school.findUnique({
        where: { 
          schoolCode: code.toUpperCase().trim()
        },
        select: {
          id: true,
          name: true,
          schoolCode: true,
          status: true,
          isOnboarded: true,
          onboardingStep: true
        }
      });

      if (!school) {
        await this.logSchoolEvent('VALIDATION_FAILED', null, code, 'SCHOOL_NOT_FOUND');
        return null;
      }

      if (school.status !== SchoolStatus.ACTIVE) {
        await this.logSchoolEvent('VALIDATION_FAILED', school.id, code, 'SCHOOL_INACTIVE');
        throw new SchoolInactiveError(code);
      }

      await this.logSchoolEvent('VALIDATION_SUCCESS', school.id, code, 'SCHOOL_VALIDATED');
      return school;

    } catch (error) {
      console.error('School code validation error:', error);
      
      if (error instanceof SchoolContextError) {
        throw error;
      }

      await this.logSchoolEvent('VALIDATION_ERROR', null, code, 'SYSTEM_ERROR');
      return null;
    }
  }

  /**
   * Validate school by ID and return school if valid and active
   * Requirements: 2.2, 2.3, 10.2 - School status affects authentication
   */
  async validateSchoolById(schoolId: string): Promise<School | null> {
    try {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: {
          id: true,
          name: true,
          schoolCode: true,
          status: true,
          isOnboarded: true,
          onboardingStep: true
        }
      });

      if (!school) {
        await this.logSchoolEvent('VALIDATION_FAILED', schoolId, null, 'SCHOOL_NOT_FOUND');
        return null;
      }

      // Check if school is suspended - this affects authentication
      if (school.status === SchoolStatus.SUSPENDED) {
        await this.logSchoolEvent('VALIDATION_FAILED', schoolId, school.schoolCode, 'SCHOOL_SUSPENDED');
        throw new SchoolInactiveError(school.schoolCode);
      }

      // Check if school is deactivated
      if (school.status === SchoolStatus.DEACTIVATED) {
        await this.logSchoolEvent('VALIDATION_FAILED', schoolId, school.schoolCode, 'SCHOOL_DEACTIVATED');
        throw new SchoolInactiveError(school.schoolCode);
      }

      // Only allow ACTIVE schools for authentication
      if (school.status !== SchoolStatus.ACTIVE) {
        await this.logSchoolEvent('VALIDATION_FAILED', schoolId, school.schoolCode, 'SCHOOL_INACTIVE');
        throw new SchoolInactiveError(school.schoolCode);
      }

      await this.logSchoolEvent('VALIDATION_SUCCESS', schoolId, school.schoolCode, 'SCHOOL_VALIDATED');
      return school;

    } catch (error) {
      console.error('School ID validation error:', error);
      
      if (error instanceof SchoolContextError) {
        throw error;
      }

      await this.logSchoolEvent('VALIDATION_ERROR', schoolId, null, 'SYSTEM_ERROR');
      return null;
    }
  }

  /**
   * Get all schools a user has access to
   * Requirements: 5.1, 5.4
   */
  async getUserSchools(userId: string): Promise<School[]> {
    try {
      const userSchools = await db.userSchool.findMany({
        where: {
          userId,
          isActive: true,
          school: {
            status: SchoolStatus.ACTIVE
          }
        },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              schoolCode: true,
              status: true,
              isOnboarded: true,
              onboardingStep: true
            }
          }
        },
        orderBy: {
          school: {
            name: 'asc'
          }
        }
      });

      const schools = userSchools.map(us => us.school);
      
      await this.logSchoolEvent('USER_SCHOOLS_RETRIEVED', null, null, 'SUCCESS', {
        userId,
        schoolCount: schools.length
      });

      return schools;

    } catch (error) {
      console.error('Get user schools error:', error);
      await this.logSchoolEvent('USER_SCHOOLS_ERROR', null, null, 'SYSTEM_ERROR', { userId });
      return [];
    }
  }

  /**
   * Get user's school IDs for token payload
   * Requirements: 11.1
   */
  async getUserSchoolIds(userId: string): Promise<string[]> {
    try {
      const userSchools = await db.userSchool.findMany({
        where: {
          userId,
          isActive: true,
          school: {
            status: SchoolStatus.ACTIVE
          }
        },
        select: {
          schoolId: true
        }
      });

      return userSchools.map(us => us.schoolId);

    } catch (error) {
      console.error('Get user school IDs error:', error);
      return [];
    }
  }

  /**
   * Validate user has access to specific school
   * Requirements: 5.4, 8.2, 8.3
   */
  async validateSchoolAccess(userId: string, schoolId: string): Promise<boolean> {
    try {
      const userSchool = await db.userSchool.findFirst({
        where: {
          userId,
          schoolId,
          isActive: true,
          school: {
            status: SchoolStatus.ACTIVE
          }
        }
      });

      const hasAccess = !!userSchool;
      
      await this.logSchoolEvent(
        hasAccess ? 'ACCESS_VALIDATED' : 'ACCESS_DENIED',
        schoolId,
        null,
        hasAccess ? 'ACCESS_GRANTED' : 'UNAUTHORIZED_ACCESS',
        { userId, schoolId }
      );

      return hasAccess;

    } catch (error) {
      console.error('School access validation error:', error);
      await this.logSchoolEvent('ACCESS_ERROR', schoolId, null, 'SYSTEM_ERROR', { userId });
      return false;
    }
  }

  /**
   * Switch user's active school context
   * Requirements: 5.2, 5.3
   */
  async switchSchoolContext(
    userId: string,
    newSchoolId: string,
    sessionToken?: string
  ): Promise<SchoolContextSwitchResult> {
    try {
      // Validate user has access to the new school
      const hasAccess = await this.validateSchoolAccess(userId, newSchoolId);
      if (!hasAccess) {
        throw new UnauthorizedSchoolAccessError(userId, newSchoolId);
      }

      // Update session if token provided
      if (sessionToken) {
        await db.authSession.updateMany({
          where: {
            userId,
            token: sessionToken
          },
          data: {
            activeSchoolId: newSchoolId,
            lastAccessAt: new Date()
          }
        });
      }

      await this.logSchoolEvent('CONTEXT_SWITCHED', newSchoolId, null, 'CONTEXT_CHANGED', {
        userId,
        newSchoolId,
        sessionToken: sessionToken ? 'PROVIDED' : 'NOT_PROVIDED'
      });

      return {
        success: true,
        message: 'School context switched successfully'
      };

    } catch (error) {
      console.error('School context switch error:', error);
      
      if (error instanceof SchoolContextError) {
        return {
          success: false,
          message: error.message,
          error: error.code
        };
      }

      await this.logSchoolEvent('CONTEXT_SWITCH_ERROR', newSchoolId, null, 'SYSTEM_ERROR', { userId });
      return {
        success: false,
        message: 'Failed to switch school context',
        error: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Get school context from session token
   * Requirements: 11.2
   */
  async getSchoolContextFromToken(token: string): Promise<string | null> {
    try {
      const session = await db.authSession.findUnique({
        where: { token },
        select: { activeSchoolId: true }
      });

      return session?.activeSchoolId || null;

    } catch (error) {
      console.error('Get school context from token error:', error);
      return null;
    }
  }

  /**
   * Validate school context for API requests
   * Requirements: 8.1, 8.4
   */
  async validateSchoolContextForRequest(
    userId: string,
    requestedSchoolId: string,
    activeSchoolId?: string
  ): Promise<boolean> {
    try {
      // If no active school context, validate user has access to requested school
      if (!activeSchoolId) {
        return await this.validateSchoolAccess(userId, requestedSchoolId);
      }

      // If active school context exists, it must match the requested school
      if (activeSchoolId !== requestedSchoolId) {
        await this.logSchoolEvent('CONTEXT_MISMATCH', requestedSchoolId, null, 'CONTEXT_VIOLATION', {
          userId,
          activeSchoolId,
          requestedSchoolId
        });
        return false;
      }

      // Validate user still has access to the active school
      return await this.validateSchoolAccess(userId, activeSchoolId);

    } catch (error) {
      console.error('School context validation for request error:', error);
      return false;
    }
  }

  /**
   * Initialize school context for new schools in unified authentication system
   * Requirements: 10.1, 10.2, 10.3
   */
  async initializeSchoolContext(
    schoolId: string,
    config: {
      schoolCode: string;
      name: string;
      subdomain?: string;
      authenticationConfig?: Record<string, any>;
      createdBy: string;
    }
  ): Promise<void> {
    try {
      // Validate school exists
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: { id: true, name: true, schoolCode: true }
      });

      if (!school) {
        throw new SchoolNotFoundError(schoolId);
      }

      // Initialize authentication context
      const authContext = {
        schoolId,
        schoolCode: config.schoolCode,
        name: config.name,
        subdomain: config.subdomain,
        authenticationMethod: config.authenticationConfig?.authenticationMethod || 'password',
        enableOTPForAdmins: config.authenticationConfig?.enableOTPForAdmins || false,
        requiresSetup: config.authenticationConfig?.requiresSetup || true,
        setupStep: config.authenticationConfig?.setupStep || 'admin_creation',
        initializedAt: new Date(),
        initializedBy: config.createdBy
      };

      // Store authentication context in school metadata
      await db.school.update({
        where: { id: schoolId },
        data: {
          metadata: {
            ...(school as any).metadata,
            authenticationContext: authContext,
            unifiedAuthEnabled: true,
            contextInitialized: true
          }
        }
      });

      // Log context initialization
      await this.logSchoolEvent(
        'CONTEXT_INITIALIZED',
        schoolId,
        config.schoolCode,
        'AUTHENTICATION_CONTEXT_CREATED',
        {
          authContext,
          createdBy: config.createdBy
        }
      );

    } catch (error) {
      console.error('School context initialization error:', error);
      
      if (error instanceof SchoolContextError) {
        throw error;
      }

      await this.logSchoolEvent(
        'CONTEXT_INIT_ERROR',
        schoolId,
        config.schoolCode,
        'INITIALIZATION_FAILED',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          config
        }
      );

      throw new SchoolContextError(
        'Failed to initialize school context',
        'INITIALIZATION_ERROR'
      );
    }
  }

  /**
   * Get school onboarding status
   * Requirements: 9.1, 9.2
   */
  async getSchoolOnboardingStatus(schoolId: string): Promise<{
    isOnboarded: boolean;
    onboardingStep: number;
    requiresSetup: boolean;
  } | null> {
    try {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: {
          isOnboarded: true,
          onboardingStep: true
        }
      });

      if (!school) {
        return null;
      }

      return {
        isOnboarded: school.isOnboarded,
        onboardingStep: school.onboardingStep,
        requiresSetup: !school.isOnboarded
      };

    } catch (error) {
      console.error('Get school onboarding status error:', error);
      return null;
    }
  }

  /**
   * Invalidate all active sessions for a school when it's suspended
   * Requirements: 10.2 - Authentication impact when school is suspended
   */
  async invalidateSchoolSessions(schoolId: string, reason: string = 'School suspended'): Promise<{
    invalidatedSessions: number;
    affectedUsers: number;
  }> {
    try {
      // Get all active sessions for this school
      const activeSessions = await db.authSession.findMany({
        where: {
          activeSchoolId: schoolId,
          expiresAt: {
            gt: new Date()
          }
        },
        select: {
          id: true,
          userId: true,
          token: true
        }
      });

      const sessionCount = activeSessions.length;
      const uniqueUsers = new Set(activeSessions.map(s => s.userId)).size;

      if (sessionCount === 0) {
        return {
          invalidatedSessions: 0,
          affectedUsers: 0
        };
      }

      // Mark sessions as expired
      await db.authSession.updateMany({
        where: {
          activeSchoolId: schoolId,
          expiresAt: {
            gt: new Date()
          }
        },
        data: {
          expiresAt: new Date(), // Expire immediately
          lastAccessAt: new Date()
        }
      });

      // Note: JWT tokens are handled by NextAuth and will be invalidated automatically
      // when the user tries to access protected routes

      // Log session invalidation
      await this.logSchoolEvent(
        'SESSIONS_INVALIDATED',
        schoolId,
        null,
        'SCHOOL_SUSPENDED_SESSIONS_CLEARED',
        {
          reason,
          sessionCount,
          affectedUsers: uniqueUsers,
          sessionIds: activeSessions.map(s => s.id)
        }
      );

      return {
        invalidatedSessions: sessionCount,
        affectedUsers: uniqueUsers
      };

    } catch (error) {
      console.error('Error invalidating school sessions:', error);
      await this.logSchoolEvent(
        'SESSION_INVALIDATION_ERROR',
        schoolId,
        null,
        'SYSTEM_ERROR',
        {
          reason,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      );

      return {
        invalidatedSessions: 0,
        affectedUsers: 0
      };
    }
  }

  /**
   * Check if a school status allows authentication
   * Requirements: 10.2 - School status affects authentication
   */
  async isSchoolAuthenticationAllowed(schoolId: string): Promise<{
    allowed: boolean;
    reason?: string;
    status?: SchoolStatus;
  }> {
    try {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: {
          status: true,
          name: true
        }
      });

      if (!school) {
        return {
          allowed: false,
          reason: 'School not found'
        };
      }

      if (school.status === SchoolStatus.SUSPENDED) {
        return {
          allowed: false,
          reason: 'School is suspended. Please contact support.',
          status: school.status
        };
      }

      if (school.status === SchoolStatus.DEACTIVATED) {
        return {
          allowed: false,
          reason: 'School is deactivated. Please contact support.',
          status: school.status
        };
      }

      if (school.status !== SchoolStatus.ACTIVE) {
        return {
          allowed: false,
          reason: 'School is not active. Please contact support.',
          status: school.status
        };
      }

      return {
        allowed: true,
        status: school.status
      };

    } catch (error) {
      console.error('Error checking school authentication status:', error);
      return {
        allowed: false,
        reason: 'Unable to verify school status. Please try again.'
      };
    }
  }

  // Private helper methods

  /**
   * Log school context events for audit
   */
  private async logSchoolEvent(
    action: string,
    schoolId: string | null,
    schoolCode: string | null,
    details: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await logAuditEvent({
        userId: metadata?.userId || null,
        schoolId: schoolId || undefined,
        action: AuditAction.VIEW,
        resource: 'school_context',
        changes: {
          schoolCode,
          details,
          metadata,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log school event:', error);
      // Don't throw error to avoid breaking school context flow
    }
  }
}

export const schoolContextService = new SchoolContextService();