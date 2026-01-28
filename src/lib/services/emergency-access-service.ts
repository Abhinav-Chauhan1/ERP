import { db } from "@/lib/db";
import { UserRole, SchoolStatus, Prisma } from "@prisma/client";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { logAuditEvent, AuditSeverity } from "./audit-service";
import { schoolContextService } from "./school-context-service";
import { jwtService } from "./jwt-service";

/**
 * Emergency Access Service
 * Provides emergency access controls for super admins to quickly disable any school or user account
 * Requirements: 10.7 - Super admin should have emergency access to disable any school or user account
 */

export interface EmergencyDisableRequest {
  reason: string;
  disableUntil?: Date;
  notifyUsers?: boolean;
  revokeActiveSessions?: boolean;
  preventNewLogins?: boolean;
}

export interface EmergencyDisableResult {
  success: boolean;
  message: string;
  affectedUsers?: number;
  invalidatedSessions?: number;
  error?: string;
}

export interface EmergencyAccessHistory {
  id: string;
  targetType: 'USER' | 'SCHOOL';
  targetId: string;
  targetName: string;
  action: 'DISABLE' | 'ENABLE' | 'FORCE_DISABLE';
  reason: string;
  performedBy: string;
  performedByName: string;
  performedAt: Date;
  disabledUntil?: Date;
  affectedUsers: number;
  invalidatedSessions: number;
  isReversed: boolean;
  reversedAt?: Date;
  reversedBy?: string;
  reversedReason?: string;
}

export interface EmergencyAccessStats {
  totalEmergencyActions: number;
  activeDisabledAccounts: number;
  recentActions: number; // Last 24 hours
  topReasons: Array<{ reason: string; count: number }>;
}

class EmergencyAccessService {
  /**
   * Emergency disable user account with immediate effect
   * Requirements: 10.7 - Super admin should have emergency access to disable any school or user account
   */
  async emergencyDisableUser(
    userId: string,
    request: EmergencyDisableRequest,
    performedBy: string
  ): Promise<EmergencyDisableResult> {
    await requireSuperAdminAccess();

    try {
      // Validate user exists
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          userSchools: {
            include: {
              school: {
                select: { name: true, schoolCode: true }
              }
            }
          }
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        };
      }

      // Prevent disabling super admin users (safety check)
      const isSuperAdmin = user.userSchools.some(us => us.role === UserRole.SUPER_ADMIN);
      if (isSuperAdmin) {
        return {
          success: false,
          message: 'Cannot emergency disable super admin users',
          error: 'SUPER_ADMIN_PROTECTION'
        };
      }

      // Disable user account
      await db.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      // Disable all user-school relationships
      await db.userSchool.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      let invalidatedSessions = 0;
      
      // Revoke active sessions if requested
      if (request.revokeActiveSessions !== false) {
        const activeSessions = await db.authSession.findMany({
          where: { userId, expiresAt: { gt: new Date() } }
        });

        // Invalidate sessions in database
        await db.authSession.updateMany({
          where: { userId },
          data: { expiresAt: new Date() } // Expire immediately
        });

        // Revoke JWT tokens
        for (const session of activeSessions) {
          try {
            await jwtService.revokeToken(session.token);
          } catch (error) {
            console.error('Failed to revoke JWT token:', error);
          }
        }

        invalidatedSessions = activeSessions.length;
      }

      // Create emergency access record
      const emergencyRecord = await db.emergencyAccess.create({
        data: {
          targetType: 'USER',
          targetId: userId,
          targetName: user.name,
          action: 'DISABLE',
          reason: request.reason,
          performedBy,
          disabledUntil: request.disableUntil,
          affectedUsers: 1,
          invalidatedSessions,
          metadata: {
            userEmail: user.email,
            userMobile: user.mobile,
            schools: user.userSchools.map(us => ({
              schoolId: us.schoolId,
              schoolName: us.school.name,
              schoolCode: us.school.schoolCode,
              role: us.role
            })),
            notifyUsers: request.notifyUsers,
            preventNewLogins: request.preventNewLogins
          }
        }
      });

      // Log comprehensive audit event
      await logAuditEvent({
        userId: performedBy,
        action: 'EMERGENCY_DISABLE',
        resource: 'USER',
        resourceId: userId,
        severity: AuditSeverity.CRITICAL,
        changes: {
          emergencyRecordId: emergencyRecord.id,
          targetUser: {
            id: userId,
            name: user.name,
            email: user.email,
            mobile: user.mobile
          },
          reason: request.reason,
          disabledUntil: request.disableUntil,
          affectedSchools: user.userSchools.length,
          invalidatedSessions,
          safeguards: {
            preventedSuperAdminDisable: isSuperAdmin,
            revokedActiveSessions: request.revokeActiveSessions !== false
          }
        }
      });

      return {
        success: true,
        message: `User ${user.name} has been emergency disabled`,
        affectedUsers: 1,
        invalidatedSessions
      };

    } catch (error) {
      console.error('Emergency disable user error:', error);
      
      // Log the error
      await logAuditEvent({
        userId: performedBy,
        action: 'EMERGENCY_DISABLE',
        resource: 'USER',
        resourceId: userId,
        severity: AuditSeverity.CRITICAL,
        changes: {
          error: error instanceof Error ? error.message : 'Unknown error',
          reason: request.reason,
          failed: true
        }
      });

      return {
        success: false,
        message: 'Failed to emergency disable user',
        error: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Emergency disable school account with immediate effect
   * Requirements: 10.7 - Super admin should have emergency access to disable any school or user account
   */
  async emergencyDisableSchool(
    schoolId: string,
    request: EmergencyDisableRequest,
    performedBy: string
  ): Promise<EmergencyDisableResult> {
    await requireSuperAdminAccess();

    try {
      // Validate school exists
      const school = await db.school.findUnique({
        where: { id: schoolId },
        include: {
          userSchools: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      if (!school) {
        return {
          success: false,
          message: 'School not found',
          error: 'SCHOOL_NOT_FOUND'
        };
      }

      if (school.status === SchoolStatus.SUSPENDED) {
        return {
          success: false,
          message: 'School is already suspended',
          error: 'ALREADY_SUSPENDED'
        };
      }

      // Suspend school
      await db.school.update({
        where: { id: schoolId },
        data: {
          status: SchoolStatus.SUSPENDED,
          updatedAt: new Date()
        }
      });

      // Disable all user-school relationships for this school
      await db.userSchool.updateMany({
        where: { schoolId },
        data: { isActive: false }
      });

      let invalidatedSessions = 0;
      const affectedUsers = school.userSchools.length;

      // Revoke active sessions for all school users if requested
      if (request.revokeActiveSessions !== false) {
        try {
          const sessionResult = await schoolContextService.invalidateSchoolSessions(
            schoolId,
            `Emergency disable: ${request.reason}`
          );
          invalidatedSessions = sessionResult.invalidatedSessions;
        } catch (error) {
          console.error('Error invalidating school sessions:', error);
        }
      }

      // Create emergency access record
      const emergencyRecord = await db.emergencyAccess.create({
        data: {
          targetType: 'SCHOOL',
          targetId: schoolId,
          targetName: school.name,
          action: 'DISABLE',
          reason: request.reason,
          performedBy,
          disabledUntil: request.disableUntil,
          affectedUsers,
          invalidatedSessions,
          metadata: {
            schoolCode: school.schoolCode,
            schoolPlan: school.plan,
            schoolStatus: school.status,
            users: school.userSchools.map(us => ({
              userId: us.user.id,
              userName: us.user.name,
              userEmail: us.user.email,
              role: us.role
            })),
            notifyUsers: request.notifyUsers,
            preventNewLogins: request.preventNewLogins
          }
        }
      });

      // Log comprehensive audit event
      await logAuditEvent({
        userId: performedBy,
        action: 'EMERGENCY_DISABLE',
        resource: 'SCHOOL',
        resourceId: schoolId,
        severity: AuditSeverity.CRITICAL,
        changes: {
          emergencyRecordId: emergencyRecord.id,
          targetSchool: {
            id: schoolId,
            name: school.name,
            schoolCode: school.schoolCode,
            plan: school.plan
          },
          reason: request.reason,
          disabledUntil: request.disableUntil,
          affectedUsers,
          invalidatedSessions,
          safeguards: {
            revokedActiveSessions: request.revokeActiveSessions !== false
          }
        }
      });

      return {
        success: true,
        message: `School ${school.name} has been emergency disabled`,
        affectedUsers,
        invalidatedSessions
      };

    } catch (error) {
      console.error('Emergency disable school error:', error);
      
      // Log the error
      await logAuditEvent({
        userId: performedBy,
        action: 'EMERGENCY_DISABLE',
        resource: 'SCHOOL',
        resourceId: schoolId,
        severity: AuditSeverity.CRITICAL,
        changes: {
          error: error instanceof Error ? error.message : 'Unknown error',
          reason: request.reason,
          failed: true
        }
      });

      return {
        success: false,
        message: 'Failed to emergency disable school',
        error: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Emergency enable user account (reverse emergency disable)
   */
  async emergencyEnableUser(
    userId: string,
    reason: string,
    performedBy: string
  ): Promise<EmergencyDisableResult> {
    await requireSuperAdminAccess();

    try {
      // Validate user exists
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, isActive: true }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        };
      }

      if (user.isActive) {
        return {
          success: false,
          message: 'User is already active',
          error: 'ALREADY_ACTIVE'
        };
      }

      // Enable user account
      await db.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          updatedAt: new Date()
        }
      });

      // Enable user-school relationships
      await db.userSchool.updateMany({
        where: { userId },
        data: { isActive: true }
      });

      // Find and update the original emergency record
      const originalRecord = await db.emergencyAccess.findFirst({
        where: {
          targetType: 'USER',
          targetId: userId,
          action: 'DISABLE',
          isReversed: false
        },
        orderBy: { createdAt: 'desc' }
      });

      if (originalRecord) {
        await db.emergencyAccess.update({
          where: { id: originalRecord.id },
          data: {
            isReversed: true,
            reversedAt: new Date(),
            reversedBy: performedBy,
            reversedReason: reason
          }
        });
      }

      // Create new emergency access record for the enable action
      await db.emergencyAccess.create({
        data: {
          targetType: 'USER',
          targetId: userId,
          targetName: user.name,
          action: 'ENABLE',
          reason,
          performedBy,
          affectedUsers: 1,
          invalidatedSessions: 0,
          metadata: {
            userEmail: user.email,
            reversedEmergencyId: originalRecord?.id
          }
        }
      });

      // Log audit event
      await logAuditEvent({
        userId: performedBy,
        action: 'EMERGENCY_ENABLE',
        resource: 'USER',
        resourceId: userId,
        severity: AuditSeverity.HIGH,
        changes: {
          targetUser: {
            id: userId,
            name: user.name,
            email: user.email
          },
          reason,
          reversedEmergencyId: originalRecord?.id
        }
      });

      return {
        success: true,
        message: `User ${user.name} has been emergency enabled`,
        affectedUsers: 1,
        invalidatedSessions: 0
      };

    } catch (error) {
      console.error('Emergency enable user error:', error);
      return {
        success: false,
        message: 'Failed to emergency enable user',
        error: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Emergency enable school account (reverse emergency disable)
   */
  async emergencyEnableSchool(
    schoolId: string,
    reason: string,
    performedBy: string
  ): Promise<EmergencyDisableResult> {
    await requireSuperAdminAccess();

    try {
      // Validate school exists
      const school = await db.school.findUnique({
        where: { id: schoolId },
        include: {
          userSchools: true
        }
      });

      if (!school) {
        return {
          success: false,
          message: 'School not found',
          error: 'SCHOOL_NOT_FOUND'
        };
      }

      if (school.status === SchoolStatus.ACTIVE) {
        return {
          success: false,
          message: 'School is already active',
          error: 'ALREADY_ACTIVE'
        };
      }

      // Activate school
      await db.school.update({
        where: { id: schoolId },
        data: {
          status: SchoolStatus.ACTIVE,
          updatedAt: new Date()
        }
      });

      // Enable user-school relationships
      await db.userSchool.updateMany({
        where: { schoolId },
        data: { isActive: true }
      });

      const affectedUsers = school.userSchools.length;

      // Find and update the original emergency record
      const originalRecord = await db.emergencyAccess.findFirst({
        where: {
          targetType: 'SCHOOL',
          targetId: schoolId,
          action: 'DISABLE',
          isReversed: false
        },
        orderBy: { createdAt: 'desc' }
      });

      if (originalRecord) {
        await db.emergencyAccess.update({
          where: { id: originalRecord.id },
          data: {
            isReversed: true,
            reversedAt: new Date(),
            reversedBy: performedBy,
            reversedReason: reason
          }
        });
      }

      // Create new emergency access record for the enable action
      await db.emergencyAccess.create({
        data: {
          targetType: 'SCHOOL',
          targetId: schoolId,
          targetName: school.name,
          action: 'ENABLE',
          reason,
          performedBy,
          affectedUsers,
          invalidatedSessions: 0,
          metadata: {
            schoolCode: school.schoolCode,
            reversedEmergencyId: originalRecord?.id
          }
        }
      });

      // Log audit event
      await logAuditEvent({
        userId: performedBy,
        action: 'EMERGENCY_ENABLE',
        resource: 'SCHOOL',
        resourceId: schoolId,
        severity: AuditSeverity.HIGH,
        changes: {
          targetSchool: {
            id: schoolId,
            name: school.name,
            schoolCode: school.schoolCode
          },
          reason,
          affectedUsers,
          reversedEmergencyId: originalRecord?.id
        }
      });

      return {
        success: true,
        message: `School ${school.name} has been emergency enabled`,
        affectedUsers,
        invalidatedSessions: 0
      };

    } catch (error) {
      console.error('Emergency enable school error:', error);
      return {
        success: false,
        message: 'Failed to emergency enable school',
        error: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Get emergency access history with filtering
   */
  async getEmergencyAccessHistory(
    filters: {
      targetType?: 'USER' | 'SCHOOL';
      targetId?: string;
      performedBy?: string;
      action?: 'DISABLE' | 'ENABLE' | 'FORCE_DISABLE';
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    history: EmergencyAccessHistory[];
    total: number;
    hasMore: boolean;
  }> {
    await requireSuperAdminAccess();

    const {
      targetType,
      targetId,
      performedBy,
      action,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = filters;

    // Build where clause
    const where: Prisma.EmergencyAccessWhereInput = {};

    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (performedBy) where.performedBy = performedBy;
    if (action) where.action = action;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get total count
    const total = await db.emergencyAccess.count({ where });

    // Get records
    const records = await db.emergencyAccess.findMany({
      where,
      include: {
        performedByUser: {
          select: { name: true, email: true }
        },
        reversedByUser: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Transform to EmergencyAccessHistory format
    const history: EmergencyAccessHistory[] = records.map(record => ({
      id: record.id,
      targetType: record.targetType as 'USER' | 'SCHOOL',
      targetId: record.targetId,
      targetName: record.targetName,
      action: record.action as 'DISABLE' | 'ENABLE' | 'FORCE_DISABLE',
      reason: record.reason,
      performedBy: record.performedBy,
      performedByName: record.performedByUser?.name || 'Unknown',
      performedAt: record.createdAt,
      disabledUntil: record.disabledUntil,
      affectedUsers: record.affectedUsers,
      invalidatedSessions: record.invalidatedSessions,
      isReversed: record.isReversed,
      reversedAt: record.reversedAt,
      reversedBy: record.reversedBy,
      reversedReason: record.reversedReason
    }));

    return {
      history,
      total,
      hasMore: offset + limit < total
    };
  }

  /**
   * Get emergency access statistics
   */
  async getEmergencyAccessStats(): Promise<EmergencyAccessStats> {
    await requireSuperAdminAccess();

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get total emergency actions
    const totalEmergencyActions = await db.emergencyAccess.count();

    // Get active disabled accounts (not reversed)
    const activeDisabledAccounts = await db.emergencyAccess.count({
      where: {
        action: 'DISABLE',
        isReversed: false,
        OR: [
          { disabledUntil: null },
          { disabledUntil: { gt: now } }
        ]
      }
    });

    // Get recent actions (last 24 hours)
    const recentActions = await db.emergencyAccess.count({
      where: {
        createdAt: { gte: yesterday }
      }
    });

    // Get top reasons
    const reasonCounts = await db.emergencyAccess.groupBy({
      by: ['reason'],
      _count: { reason: true },
      orderBy: { _count: { reason: 'desc' } },
      take: 10
    });

    const topReasons = reasonCounts.map(item => ({
      reason: item.reason,
      count: item._count.reason
    }));

    return {
      totalEmergencyActions,
      activeDisabledAccounts,
      recentActions,
      topReasons
    };
  }

  /**
   * Check if account is emergency disabled
   */
  async isEmergencyDisabled(targetType: 'USER' | 'SCHOOL', targetId: string): Promise<{
    isDisabled: boolean;
    reason?: string;
    disabledAt?: Date;
    disabledUntil?: Date;
    performedBy?: string;
  }> {
    const record = await db.emergencyAccess.findFirst({
      where: {
        targetType,
        targetId,
        action: 'DISABLE',
        isReversed: false,
        OR: [
          { disabledUntil: null },
          { disabledUntil: { gt: new Date() } }
        ]
      },
      include: {
        performedByUser: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return { isDisabled: false };
    }

    return {
      isDisabled: true,
      reason: record.reason,
      disabledAt: record.createdAt,
      disabledUntil: record.disabledUntil,
      performedBy: record.performedByUser?.name || 'Unknown'
    };
  }
}

export const emergencyAccessService = new EmergencyAccessService();