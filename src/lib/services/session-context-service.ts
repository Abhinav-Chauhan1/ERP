import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { logAuditEvent } from "./audit-service";

/**
 * Session Context Service
 * Manages active school and student contexts in user sessions.
 * 
 * Requirements: 5.4, 6.2, 6.3
 */

export interface SessionContext {
  userId: string;
  activeSchoolId?: string;
  activeStudentId?: string;
  role: UserRole;
  token: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  class?: string;
  section?: string;
  rollNumber?: string;
}

export interface SchoolInfo {
  id: string;
  name: string;
  schoolCode: string;
}

// Custom errors for better error handling
export class SessionContextError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SessionContextError';
  }
}

export class InvalidSessionError extends SessionContextError {
  constructor() {
    super('Invalid or expired session', 'INVALID_SESSION');
  }
}

export class UnauthorizedContextError extends SessionContextError {
  constructor(context: string) {
    super(`Unauthorized access to ${context}`, 'UNAUTHORIZED_CONTEXT');
  }
}

class SessionContextService {
  /**
   * Get current session context
   * Requirements: 5.4
   */
  async getSessionContext(token: string): Promise<SessionContext | null> {
    try {
      const session = await db.authSession.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              userSchools: {
                where: { isActive: true },
                include: { school: true }
              }
            }
          }
        }
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      // Get user's role in active school
      let role = UserRole.STUDENT;
      if (session.activeSchoolId) {
        const userSchool = session.user.userSchools.find(
          us => us.schoolId === session.activeSchoolId
        );
        if (userSchool) {
          role = userSchool.role as "STUDENT";
        }
      } else if (session.user.userSchools.length > 0) {
        role = session.user.userSchools[0].role as "STUDENT";
      }

      return {
        userId: session.userId,
        activeSchoolId: session.activeSchoolId || undefined,
        activeStudentId: undefined, // We'll implement this with a separate storage
        role,
        token
      };

    } catch (error) {
      console.error('Get session context error:', error);
      return null;
    }
  }

  /**
   * Update active school context in session
   * Requirements: 5.2, 5.3
   */
  async updateSchoolContext(
    token: string,
    newSchoolId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Validate user has access to the school
      const hasAccess = await this.validateUserSchoolAccess(userId, newSchoolId);
      if (!hasAccess) {
        throw new UnauthorizedContextError('school');
      }

      // Update session
      const result = await db.authSession.updateMany({
        where: {
          token,
          userId,
          expiresAt: { gt: new Date() }
        },
        data: {
          activeSchoolId: newSchoolId,
          lastAccessAt: new Date()
        }
      });

      if (result.count === 0) {
        throw new InvalidSessionError();
      }

      await this.logContextEvent('SCHOOL_CONTEXT_UPDATED', userId, newSchoolId, {
        newSchoolId,
        token: 'PROVIDED'
      });

      return true;

    } catch (error) {
      console.error('Update school context error:', error);
      if (error instanceof SessionContextError) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Get parent's children for selection
   * Requirements: 6.1, 6.4
   */
  async getParentChildren(
    userId: string,
    schoolId?: string
  ): Promise<StudentInfo[]> {
    try {
      // Get parent record
      const parent = await db.parent.findFirst({
        where: {
          userId,
          ...(schoolId && { schoolId })
        }
      });

      if (!parent) {
        return [];
      }

      // Get children
      const studentParents = await db.studentParent.findMany({
        where: {
          parentId: parent.id,
          ...(schoolId && { schoolId })
        },
        include: {
          student: {
            include: {
              user: true,
              enrollments: {
                include: {
                  class: true,
                  section: true
                },
                take: 1,
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        },
        orderBy: {
          student: {
            user: {
              name: 'asc'
            }
          }
        }
      });

      return studentParents
        .filter(sp => sp.student.user.isActive)
        .map(sp => ({
          id: sp.student.id,
          name: sp.student.user.name,
          class: sp.student.enrollments[0]?.class?.name,
          section: sp.student.enrollments[0]?.section?.name,
          rollNumber: sp.student.rollNumber || undefined
        }));

    } catch (error) {
      console.error('Get parent children error:', error);
      return [];
    }
  }

  /**
   * Validate parent has access to student
   * Requirements: 6.4, 6.5
   */
  async validateParentStudentAccess(
    userId: string,
    studentId: string,
    schoolId?: string
  ): Promise<boolean> {
    try {
      // Get parent record
      const parent = await db.parent.findFirst({
        where: {
          userId,
          ...(schoolId && { schoolId })
        }
      });

      if (!parent) {
        return false;
      }

      // Check parent-student relationship
      const studentParent = await db.studentParent.findFirst({
        where: {
          parentId: parent.id,
          studentId,
          ...(schoolId && { schoolId })
        },
        include: {
          student: {
            include: {
              user: true
            }
          }
        }
      });

      const hasAccess = !!studentParent && studentParent.student.user.isActive;

      await this.logContextEvent(
        hasAccess ? 'STUDENT_ACCESS_VALIDATED' : 'STUDENT_ACCESS_DENIED',
        userId,
        schoolId || null,
        {
          studentId,
          parentId: parent.id,
          hasAccess
        }
      );

      return hasAccess;

    } catch (error) {
      console.error('Validate parent student access error:', error);
      return false;
    }
  }

  /**
   * Get user's available schools
   * Requirements: 5.1, 5.4
   */
  async getUserSchools(userId: string): Promise<SchoolInfo[]> {
    try {
      const userSchools = await db.userSchool.findMany({
        where: {
          userId,
          isActive: true,
          school: {
            status: 'ACTIVE'
          }
        },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              schoolCode: true
            }
          }
        },
        orderBy: {
          school: {
            name: 'asc'
          }
        }
      });

      return userSchools.map(us => us.school);

    } catch (error) {
      console.error('Get user schools error:', error);
      return [];
    }
  }

  /**
   * Validate user has access to school
   * Requirements: 5.4, 5.5
   */
  async validateUserSchoolAccess(userId: string, schoolId: string): Promise<boolean> {
    try {
      const userSchool = await db.userSchool.findFirst({
        where: {
          userId,
          schoolId,
          isActive: true,
          school: {
            status: 'ACTIVE'
          }
        }
      });

      return !!userSchool;

    } catch (error) {
      console.error('Validate user school access error:', error);
      return false;
    }
  }

  /**
   * Clean up expired sessions
   * Requirements: 5.4
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await db.authSession.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });

      if (result.count > 0) {
        await this.logContextEvent('SESSIONS_CLEANED', null, null, {
          cleanedCount: result.count
        });
      }

      return result.count;

    } catch (error) {
      console.error('Cleanup expired sessions error:', error);
      return 0;
    }
  }

  /**
   * Revoke all user sessions (for security)
   * Requirements: 5.4
   */
  async revokeUserSessions(userId: string, reason: string = 'MANUAL_REVOCATION'): Promise<number> {
    try {
      const result = await db.authSession.deleteMany({
        where: { userId }
      });

      await this.logContextEvent('USER_SESSIONS_REVOKED', userId, null, {
        revokedCount: result.count,
        reason
      });

      return result.count;

    } catch (error) {
      console.error('Revoke user sessions error:', error);
      return 0;
    }
  }

  /**
   * Get session statistics for monitoring
   * Requirements: 5.4
   */
  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    expiredSessions: number;
    sessionsByRole: Record<string, number>;
  }> {
    try {
      const now = new Date();

      // Get total active sessions
      const totalActiveSessions = await db.authSession.count({
        where: {
          expiresAt: { gt: now }
        }
      });

      // Get expired sessions
      const expiredSessions = await db.authSession.count({
        where: {
          expiresAt: { lte: now }
        }
      });

      // Get sessions by role (this would require joining with user data)
      const sessionsByRole: Record<string, number> = {};

      return {
        totalActiveSessions,
        expiredSessions,
        sessionsByRole
      };

    } catch (error) {
      console.error('Get session stats error:', error);
      return {
        totalActiveSessions: 0,
        expiredSessions: 0,
        sessionsByRole: {}
      };
    }
  }

  // Private helper methods

  /**
   * Log context events for audit
   */
  private async logContextEvent(
    action: string,
    userId: string | null,
    schoolId: string | null,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await logAuditEvent({
        userId,
        schoolId: schoolId || undefined,
        action: action as any, // TODO: Fix AuditAction type
        resource: 'session_context',
        changes: {
          metadata,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log context event:', error);
      // Don't throw error to avoid breaking context flow
    }
  }
}

export const sessionContextService = new SessionContextService();