import { db } from "@/lib/db";
import { UserRole, PermissionAction } from "@prisma/client";
import { logAuditEvent } from "./audit-service";

/**
 * Enhanced Permission Service
 * Implements role-based permissions with granular controls, custom permission sets,
 * and approval workflows for the super-admin SaaS platform.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

// Enums for better type safety
export enum PermissionRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PermissionScope {
  GLOBAL = 'GLOBAL',
  SCHOOL = 'SCHOOL',
  USER = 'USER'
}

// Types for permission management
export interface PermissionSet {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionRequest {
  id: string;
  userId: string;
  requestedBy: string;
  permissionIds: string[];
  justification: string;
  status: PermissionRequestStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GranularPermission {
  id: string;
  name: string;
  resource: string;
  action: PermissionAction;
  conditions?: Record<string, any>;
  scope?: PermissionScope;
  isActive: boolean;
}

export interface RolePermissionMatrix {
  role: UserRole;
  permissions: GranularPermission[];
  inheritedFrom?: UserRole[];
}

export interface PermissionEnforcementResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: string[];
  missingPermissions?: string[];
  context?: Record<string, any>;
}

// Custom errors for better error handling
export class PermissionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class PermissionNotFoundError extends PermissionError {
  constructor(permissionId: string) {
    super(`Permission not found: ${permissionId}`, 'PERMISSION_NOT_FOUND');
  }
}

export class PermissionRequestNotFoundError extends PermissionError {
  constructor(requestId: string) {
    super(`Permission request not found: ${requestId}`, 'REQUEST_NOT_FOUND');
  }
}

export class InvalidPermissionError extends PermissionError {
  constructor(message: string) {
    super(message, 'INVALID_PERMISSION');
  }
}

class PermissionService {
  private static readonly PERMISSION_SET_EMAIL_PREFIX = 'permission-set-';
  private static readonly PERMISSION_REQUEST_PREFIX = 'perm-req-';
  
  /**
   * Get all available permissions with granular details
   * Requirements: 6.1 - Role-based permissions with granular controls
   */
  async getAllPermissions(): Promise<GranularPermission[]> {
    try {
      const permissions = await db.permission.findMany({
        where: { isActive: true },
        orderBy: [
          { resource: 'asc' },
          { action: 'asc' }
        ]
      });

      return this.mapToGranularPermissions(permissions);
    } catch (error) {
      console.error('Error getting all permissions:', error);
      throw new PermissionError('Failed to retrieve permissions', 'FETCH_ERROR');
    }
  }

  /**
   * Get role permission matrix showing all roles and their permissions
   * Requirements: 6.1 - Role-based permissions with granular controls
   */
  async getRolePermissionMatrix(): Promise<RolePermissionMatrix[]> {
    try {
      const roles = Object.values(UserRole);
      const matrix: RolePermissionMatrix[] = [];

      for (const role of roles) {
        const permissions = await this.getRolePermissions(role);
        matrix.push({
          role,
          permissions: this.mapToGranularPermissions(permissions),
          inheritedFrom: this.getRoleInheritance(role)
        });
      }

      return matrix;
    } catch (error) {
      console.error('Error getting role permission matrix:', error);
      throw new PermissionError('Failed to retrieve role permission matrix', 'MATRIX_ERROR');
    }
  }

  /**
   * Create a custom permission set
   * Requirements: 6.2 - Custom permission sets and approval workflows
   */
  async createPermissionSet(data: {
    name: string;
    description?: string;
    permissions: string[];
    createdBy: string;
  }): Promise<PermissionSet> {
    try {
      await this.validatePermissions(data.permissions);

      // Store permission set in a dedicated way (using audit log for now)
      const permissionSetId = `${PermissionService.PERMISSION_SET_EMAIL_PREFIX}${Date.now()}`;
      
      await logAuditEvent({
        userId: data.createdBy,
        action: 'CREATE',
        resource: 'permission_set',
        resourceId: permissionSetId,
        changes: {
          type: 'PERMISSION_SET',
          name: data.name,
          description: data.description,
          permissions: data.permissions,
          isActive: true,
          createdBy: data.createdBy
        }
      });

      return {
        id: permissionSetId,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        isActive: true,
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating permission set:', error);
      if (error instanceof PermissionError) throw error;
      throw new PermissionError('Failed to create permission set', 'CREATE_ERROR');
    }
  }

  /**
   * Request permissions for a user (approval workflow)
   * Requirements: 6.2 - Custom permission sets and approval workflows
   */
  async requestPermissions(data: {
    userId: string;
    requestedBy: string;
    permissionIds: string[];
    justification: string;
    expiresAt?: Date;
  }): Promise<PermissionRequest> {
    try {
      await this.validatePermissions(data.permissionIds);
      await this.validateUser(data.userId);

      const requestId = `${PermissionService.PERMISSION_REQUEST_PREFIX}${Date.now()}`;
      
      await logAuditEvent({
        userId: data.requestedBy,
        action: 'CREATE',
        resource: 'permission_request',
        resourceId: requestId,
        changes: {
          targetUserId: data.userId,
          permissionIds: data.permissionIds,
          justification: data.justification,
          status: PermissionRequestStatus.PENDING,
          expiresAt: data.expiresAt,
          requestType: 'PERMISSION_REQUEST'
        }
      });

      return {
        id: requestId,
        userId: data.userId,
        requestedBy: data.requestedBy,
        permissionIds: data.permissionIds,
        justification: data.justification,
        status: PermissionRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      if (error instanceof PermissionError) throw error;
      throw new PermissionError('Failed to request permissions', 'REQUEST_ERROR');
    }
  }

  /**
   * Approve permission request
   * Requirements: 6.2 - Custom permission sets and approval workflows
   */
  async approvePermissionRequest(
    requestId: string,
    approvedBy: string,
    notes?: string
  ): Promise<PermissionRequest> {
    try {
      const requestLog = await this.getPermissionRequestLog(requestId);
      const requestDetails = requestLog.changes as any;
      
      // Grant the permissions
      await this.grantPermissionsToUser(
        requestDetails.targetUserId,
        requestDetails.permissionIds,
        approvedBy,
        requestDetails.expiresAt
      );

      // Log the approval
      await logAuditEvent({
        userId: approvedBy,
        action: 'UPDATE',
        resource: 'permission_request',
        resourceId: requestId,
        changes: {
          originalRequest: requestDetails,
          approvedBy,
          approvedAt: new Date(),
          notes,
          status: PermissionRequestStatus.APPROVED
        }
      });

      return this.buildPermissionRequestResponse(requestLog, PermissionRequestStatus.APPROVED, {
        approvedBy,
        approvedAt: new Date()
      });
    } catch (error) {
      console.error('Error approving permission request:', error);
      if (error instanceof PermissionError) throw error;
      throw new PermissionError('Failed to approve permission request', 'APPROVE_ERROR');
    }
  }

  /**
   * Reject permission request
   * Requirements: 6.2 - Custom permission sets and approval workflows
   */
  async rejectPermissionRequest(
    requestId: string,
    rejectedBy: string,
    reason: string
  ): Promise<PermissionRequest> {
    try {
      const requestLog = await this.getPermissionRequestLog(requestId);
      const requestDetails = requestLog.changes as any;

      // Log the rejection
      await logAuditEvent({
        userId: rejectedBy,
        action: 'UPDATE',
        resource: 'permission_request',
        resourceId: requestId,
        changes: {
          originalRequest: requestDetails,
          rejectedBy,
          rejectedAt: new Date(),
          rejectionReason: reason,
          status: PermissionRequestStatus.REJECTED
        }
      });

      return this.buildPermissionRequestResponse(requestLog, PermissionRequestStatus.REJECTED, {
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason
      });
    } catch (error) {
      console.error('Error rejecting permission request:', error);
      if (error instanceof PermissionError) throw error;
      throw new PermissionError('Failed to reject permission request', 'REJECT_ERROR');
    }
  }

  /**
   * Enforce permissions at API level with multi-tenant support
   * Requirements: 6.3 - Permission enforcement at API and UI levels, 8.1, 8.2, 8.3
   */
  async enforceApiPermission(
    userId: string,
    resource: string,
    action: PermissionAction,
    context?: Record<string, any>
  ): Promise<PermissionEnforcementResult> {
    try {
      const user = await this.getUserWithSchoolContext(userId);
      if (!user) {
        return this.createEnforcementResult(false, 'User not found', { userId, resource, action });
      }

      // Extract school context from request context
      const schoolId = context?.schoolId || context?.activeSchoolId;

      // Super admin bypass (but still validate school context for school-scoped resources)
      if (user.role === 'SUPER_ADMIN') {
        // For school-scoped resources, validate school exists
        if (schoolId && this.isSchoolScopedResource(resource)) {
          const schoolExists = await this.validateSchoolExists(schoolId);
          if (!schoolExists) {
            return this.createEnforcementResult(false, 'Invalid school context', { schoolId });
          }
        }
        
        await this.logPermissionCheck(userId, resource, action, 'ALLOWED', 'SUPER_ADMIN_BYPASS', context);
        return this.createEnforcementResult(true, 'Super admin access', { role: user.role });
      }

      // For school-scoped resources, validate school context
      if (this.isSchoolScopedResource(resource)) {
        if (!schoolId) {
          return this.createEnforcementResult(false, 'School context required', { resource });
        }

        // Validate user has access to this school
        const hasSchoolAccess = await this.validateUserSchoolAccess(userId, schoolId);
        if (!hasSchoolAccess) {
          await this.logPermissionCheck(userId, resource, action, 'DENIED', 'UNAUTHORIZED_SCHOOL', context);
          return this.createEnforcementResult(false, 'Unauthorized school access', { schoolId });
        }
      }

      // Check permission exists
      const permission = await this.findPermission(resource, action);
      if (!permission) {
        return this.createEnforcementResult(
          false, 
          'Permission not defined', 
          { resource, action },
          [`${resource}:${action}`]
        );
      }

      // Check permissions with school context
      const hasRolePermission = await this.checkRolePermissionInSchool(user.role, permission.id, schoolId);
      const hasUserPermission = await this.checkUserPermissionInSchool(userId, permission.id, schoolId);
      
      const allowed = hasRolePermission || hasUserPermission;
      const reason = allowed 
        ? (hasRolePermission ? 'ROLE_BASED' : 'USER_SPECIFIC')
        : 'NO_PERMISSION';

      await this.logPermissionCheck(userId, resource, action, allowed ? 'ALLOWED' : 'DENIED', reason, context);

      return this.createEnforcementResult(
        allowed,
        allowed ? 'Permission granted' : 'Insufficient permissions',
        {
          role: user.role,
          schoolId,
          hasRolePermission,
          hasUserPermission
        },
        allowed ? undefined : [permission.name],
        allowed ? undefined : [permission.name]
      );
    } catch (error) {
      console.error('Error enforcing API permission:', error);
      
      await this.logPermissionCheck(
        userId, 
        resource, 
        action, 
        'ERROR', 
        error instanceof Error ? error.message : 'Unknown error',
        context
      );

      return this.createEnforcementResult(
        false, 
        'Permission check failed', 
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get UI permission context for a user with multi-tenant support
   * Requirements: 6.3 - Permission enforcement at API and UI levels, 8.1
   */
  async getUiPermissionContext(userId: string, schoolId?: string): Promise<{
    role: UserRole;
    permissions: string[];
    permissionSets: string[];
    restrictions: Record<string, any>;
    schoolContext?: {
      schoolId: string;
      schoolName: string;
      isOnboarded: boolean;
    };
  }> {
    try {
      const user = await this.getUserWithSchoolContext(userId);
      if (!user) {
        throw new PermissionError('User not found', 'USER_NOT_FOUND');
      }

      // Get school context if provided
      let schoolContext;
      if (schoolId) {
        const school = await db.school.findUnique({
          where: { id: schoolId },
          select: { id: true, name: true, isOnboarded: true }
        });
        
        if (school) {
          schoolContext = {
            schoolId: school.id,
            schoolName: school.name,
            isOnboarded: school.isOnboarded
          };
        }
      }

      // Get all effective permissions for the school context
      const [rolePermissions, userPermissions] = await Promise.all([
        this.getRolePermissionsInSchool(user.role, schoolId),
        this.getUserPermissionsInSchool(userId, schoolId)
      ]);

      const allPermissions = [
        ...rolePermissions.map(p => p.name),
        ...userPermissions.map(p => p.name)
      ];

      const uniquePermissions = Array.from(new Set(allPermissions));

      return {
        role: user.role,
        permissions: uniquePermissions,
        permissionSets: [], // TODO: Implement permission sets retrieval
        restrictions: this.getRoleRestrictions(user.role),
        schoolContext
      };
    } catch (error) {
      console.error('Error getting UI permission context:', error);
      if (error instanceof PermissionError) throw error;
      throw new PermissionError('Failed to get UI permission context', 'UI_CONTEXT_ERROR');
    }
  }

  /**
   * Bulk update role permissions
   * Requirements: 6.1 - Role-based permissions with granular controls
   */
  async updateRolePermissions(
    role: UserRole,
    permissionIds: string[],
    updatedBy: string
  ): Promise<void> {
    try {
      await this.validatePermissions(permissionIds);

      // Use transaction for atomicity
      await db.$transaction(async (tx) => {
        // Remove existing role permissions
        await tx.rolePermission.deleteMany({
          where: { role }
        });

        // Add new permissions
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map(permissionId => ({
              role,
              permissionId,
              isDefault: true
            }))
          });
        }
      });

      // Log the update
      await logAuditEvent({
        userId: updatedBy,
        action: 'UPDATE',
        resource: 'role_permissions',
        resourceId: role,
        changes: {
          role,
          permissionIds,
          permissionCount: permissionIds.length
        }
      });
    } catch (error) {
      console.error('Error updating role permissions:', error);
      if (error instanceof PermissionError) throw error;
      throw new PermissionError('Failed to update role permissions', 'UPDATE_ERROR');
    }
  }

  /**
   * Get pending permission requests
   * Requirements: 6.2 - Custom permission sets and approval workflows
   */
  async getPendingPermissionRequests(): Promise<PermissionRequest[]> {
    try {
      const pendingRequests = await db.auditLog.findMany({
        where: {
          resource: 'permission_request',
          action: 'CREATE'
        },
        orderBy: { timestamp: 'desc' }
      });

      const requests: PermissionRequest[] = [];

      for (const log of pendingRequests) {
        if (!log.changes) continue;
        
        const details = log.changes as any;
        
        if (details.requestType === 'PERMISSION_REQUEST') {
          // Check if this request has been approved or rejected
          const statusUpdate = await db.auditLog.findFirst({
            where: {
              resource: 'permission_request',
              resourceId: log.resourceId,
              action: 'UPDATE'
            }
          });

          const status = statusUpdate 
            ? this.extractStatusFromUpdate(statusUpdate.changes as any)
            : PermissionRequestStatus.PENDING;

          requests.push({
            id: log.resourceId || log.id,
            userId: details.targetUserId,
            requestedBy: log.userId || 'unknown',
            permissionIds: details.permissionIds,
            justification: details.justification,
            status,
            createdAt: log.timestamp || new Date(),
            updatedAt: statusUpdate?.timestamp || log.timestamp || new Date()
          });
        }
      }

      return requests;
    } catch (error) {
      console.error('Error getting pending permission requests:', error);
      throw new PermissionError('Failed to get pending permission requests', 'FETCH_ERROR');
    }
  }

  // Private helper methods

  /**
   * Get user with school context information
   */
  private async getUserWithSchoolContext(userId: string) {
    return await db.user.findUnique({
      where: { id: userId },
      select: { 
        role: true,
        userSchools: {
          where: { isActive: true },
          select: {
            schoolId: true,
            role: true,
            school: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Check if resource is school-scoped
   */
  private isSchoolScopedResource(resource: string): boolean {
    const schoolScopedResources = [
      'student',
      'teacher',
      'class',
      'subject',
      'exam',
      'attendance',
      'fee',
      'assignment',
      'grade',
      'timetable',
      'announcement',
      'event',
      'report',
      'parent',
      'library',
      'transport',
      'hostel'
    ];

    return schoolScopedResources.includes(resource);
  }

  /**
   * Validate school exists and is active
   */
  private async validateSchoolExists(schoolId: string): Promise<boolean> {
    const school = await db.school.findUnique({
      where: { 
        id: schoolId,
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    return !!school;
  }

  /**
   * Validate user has access to school
   */
  private async validateUserSchoolAccess(userId: string, schoolId: string): Promise<boolean> {
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
  }

  /**
   * Check if role has permission in specific school context
   */
  private async checkRolePermissionInSchool(role: UserRole, permissionId: string, schoolId?: string): Promise<boolean> {
    // For now, role permissions are global
    // In future, you might want school-specific role permissions
    return await this.checkRolePermission(role, permissionId);
  }

  /**
   * Check if user has specific permission in school context
   */
  private async checkUserPermissionInSchool(userId: string, permissionId: string, schoolId?: string): Promise<boolean> {
    const whereClause: any = {
      userId,
      permissionId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    // If school context is provided, filter by school
    if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    const userPermission = await db.userPermission.findFirst({
      where: whereClause
    });

    return !!userPermission;
  }

  /**
   * Get permissions for a role in school context
   */
  private async getRolePermissionsInSchool(role: UserRole, schoolId?: string) {
    // For now, role permissions are global
    // In future, you might want school-specific role permissions
    return await this.getRolePermissions(role);
  }

  /**
   * Get user-specific permissions in school context
   */
  private async getUserPermissionsInSchool(userId: string, schoolId?: string) {
    const whereClause: any = {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    // If school context is provided, filter by school
    if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    const userPermissions = await db.userPermission.findMany({
      where: whereClause,
      include: { permission: true }
    });

    return userPermissions.map(up => up.permission);
  }

  /**
   * Validate that permissions exist and are active
   */
  private async validatePermissions(permissionIds: string[]): Promise<void> {
    const validPermissions = await db.permission.findMany({
      where: {
        id: { in: permissionIds },
        isActive: true
      }
    });

    if (validPermissions.length !== permissionIds.length) {
      const invalidIds = permissionIds.filter(id => 
        !validPermissions.some(p => p.id === id)
      );
      throw new InvalidPermissionError(`Invalid or inactive permissions: ${invalidIds.join(', ')}`);
    }
  }

  /**
   * Validate that user exists
   */
  private async validateUser(userId: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      throw new PermissionError(`User not found: ${userId}`, 'USER_NOT_FOUND');
    }
  }

  /**
   * Get user with role information
   */
  private async getUser(userId: string) {
    return await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
  }

  /**
   * Find permission by resource and action
   */
  private async findPermission(resource: string, action: PermissionAction) {
    return await db.permission.findFirst({
      where: {
        resource,
        action,
        isActive: true
      }
    });
  }

  /**
   * Check if role has permission
   */
  private async checkRolePermission(role: UserRole, permissionId: string): Promise<boolean> {
    const rolePermission = await db.rolePermission.findUnique({
      where: {
        role_permissionId: {
          role,
          permissionId
        }
      }
    });
    return !!rolePermission;
  }

  /**
   * Check if user has specific permission
   */
  private async checkUserPermission(userId: string, permissionId: string): Promise<boolean> {
    const userPermission = await db.userPermission.findFirst({
      where: {
        userId,
        permissionId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    return !!userPermission;
  }

  /**
   * Get permissions for a role
   */
  private async getRolePermissions(role: UserRole) {
    const rolePermissions = await db.rolePermission.findMany({
      where: { 
        role,
        permission: {
          isActive: true
        }
      },
      include: {
        permission: true
      }
    });

    return rolePermissions.map(rp => rp.permission);
  }

  /**
   * Get user-specific permissions
   */
  private async getUserPermissions(userId: string) {
    const userPermissions = await db.userPermission.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: { permission: true }
    });

    return userPermissions.map(up => up.permission);
  }

  /**
   * Map database permissions to granular permissions
   */
  private mapToGranularPermissions(permissions: any[]): GranularPermission[] {
    return permissions.map(p => ({
      id: p.id,
      name: p.name,
      resource: p.resource,
      action: p.action,
      conditions: p.category ? { category: p.category } : undefined,
      scope: PermissionScope.GLOBAL, // Default scope
      isActive: p.isActive
    }));
  }

  /**
   * Get permission request log from audit logs
   */
  private async getPermissionRequestLog(requestId: string) {
    const requestLog = await db.auditLog.findFirst({
      where: {
        resource: 'permission_request',
        resourceId: requestId,
        action: 'CREATE'
      }
    });

    if (!requestLog || !requestLog.changes) {
      throw new PermissionRequestNotFoundError(requestId);
    }

    return requestLog;
  }

  /**
   * Grant permissions to user
   */
  private async grantPermissionsToUser(
    userId: string,
    permissionIds: string[],
    grantedBy: string,
    expiresAt?: string
  ): Promise<void> {
    for (const permissionId of permissionIds) {
      await db.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId
          }
        },
        create: {
          userId,
          permissionId,
          grantedBy,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        },
        update: {
          grantedBy,
          grantedAt: new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : null
        }
      });
    }
  }

  /**
   * Build permission request response
   */
  private buildPermissionRequestResponse(
    requestLog: any,
    status: PermissionRequestStatus,
    additionalData: Record<string, any> = {}
  ): PermissionRequest {
    const requestDetails = requestLog.changes as any;
    
    return {
      id: requestLog.resourceId || requestLog.id,
      userId: requestDetails.targetUserId,
      requestedBy: requestDetails.requestedBy || requestLog.userId,
      permissionIds: requestDetails.permissionIds,
      justification: requestDetails.justification,
      status,
      createdAt: requestLog.timestamp,
      updatedAt: new Date(),
      ...additionalData
    };
  }

  /**
   * Create enforcement result
   */
  private createEnforcementResult(
    allowed: boolean,
    reason: string,
    context: Record<string, any>,
    requiredPermissions?: string[],
    missingPermissions?: string[]
  ): PermissionEnforcementResult {
    return {
      allowed,
      reason,
      context,
      requiredPermissions,
      missingPermissions
    };
  }

  /**
   * Log permission check for audit
   */
  private async logPermissionCheck(
    userId: string,
    resource: string,
    action: PermissionAction,
    result: string,
    reason: string,
    context?: Record<string, any>
  ): Promise<void> {
    await logAuditEvent({
      userId,
      action: 'READ',
      resource: 'permission_check',
      changes: {
        resource,
        action,
        result,
        reason,
        context
      }
    });
  }

  /**
   * Extract status from audit log update
   */
  private extractStatusFromUpdate(changes: any): PermissionRequestStatus {
    if (changes.status) {
      return changes.status as PermissionRequestStatus;
    }
    // Fallback logic based on other fields
    if (changes.approvedBy) return PermissionRequestStatus.APPROVED;
    if (changes.rejectedBy) return PermissionRequestStatus.REJECTED;
    return PermissionRequestStatus.PENDING;
  }

  /**
   * Helper method to get role inheritance hierarchy
   */
  private getRoleInheritance(role: UserRole): UserRole[] {
    const hierarchy: Record<UserRole, UserRole[]> = {
      SUPER_ADMIN: [],
      ADMIN: [],
      TEACHER: [],
      STUDENT: [],
      PARENT: []
    };

    return hierarchy[role] || [];
  }

  /**
   * Helper method to get role-specific restrictions
   */
  private getRoleRestrictions(role: UserRole): Record<string, any> {
    const restrictions: Record<UserRole, Record<string, any>> = {
      SUPER_ADMIN: {},
      ADMIN: {
        cannotModifySuperAdmin: true,
        schoolScopedOnly: true
      },
      TEACHER: {
        cannotModifyAdmin: true,
        cannotModifySuperAdmin: true,
        schoolScopedOnly: true,
        classroomScopedOnly: true
      },
      STUDENT: {
        readOnlyAccess: true,
        schoolScopedOnly: true,
        personalDataOnly: true
      },
      PARENT: {
        readOnlyAccess: true,
        schoolScopedOnly: true,
        childrenDataOnly: true
      }
    };

    return restrictions[role] || {};
  }
}

export const permissionService = new PermissionService();