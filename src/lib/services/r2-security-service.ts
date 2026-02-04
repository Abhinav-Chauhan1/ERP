/**
 * R2 Security Service
 * 
 * Implements security and access control for R2 file operations including:
 * - Role-based access control for file operations
 * - Authentication requirements for sensitive files
 * - CORS policy enforcement
 * - Audit logging for file access attempts
 * 
 * Requirements: 8.1, 8.2, 8.4, 8.6
 */

import { UserRole } from '@prisma/client';
import { auditService } from './audit-service';
import { db } from '@/lib/db';


/**
 * File operation types for access control
 */
export type FileOperation = 
  | 'READ' 
  | 'WRITE' 
  | 'DELETE' 
  | 'LIST' 
  | 'UPLOAD' 
  | 'DOWNLOAD';

/**
 * File sensitivity levels
 */
export type FileSensitivityLevel = 
  | 'PUBLIC'     // Accessible to all authenticated users
  | 'SCHOOL'     // Accessible to school members only
  | 'ROLE'       // Accessible based on role permissions
  | 'PRIVATE'    // Accessible to owner and admins only
  | 'SENSITIVE'; // Requires additional authentication

/**
 * File access context for security validation
 */
export interface FileAccessContext {
  userId: string;
  userRole: UserRole;
  schoolId: string;
  authorizedSchools: string[];
  permissions: string[];
  ipAddress?: string;
  userAgent?: string;
}

/**
 * File security metadata
 */
export interface FileSecurityMetadata {
  sensitivityLevel: FileSensitivityLevel;
  ownerId?: string;
  allowedRoles?: UserRole[];
  requiredPermissions?: string[];
  schoolId: string;
  isEncrypted?: boolean;
  accessRestrictions?: {
    requireMFA?: boolean;
    allowedIPs?: string[];
    timeRestrictions?: {
      startTime?: string;
      endTime?: string;
      allowedDays?: number[];
    };
  };
}

/**
 * Access validation result
 */
export interface AccessValidationResult {
  allowed: boolean;
  reason?: string;
  requiresAdditionalAuth?: boolean;
  additionalAuthType?: 'MFA' | 'ADMIN_APPROVAL';
}

/**
 * File access audit log entry
 */
export interface FileAccessAuditLog {
  userId: string;
  schoolId: string;
  fileKey: string;
  operation: FileOperation;
  result: 'ALLOWED' | 'DENIED' | 'ERROR';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * CORS configuration for R2 bucket
 */
export interface CORSRule {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders?: string[];
  maxAgeSeconds?: number;
}

/**
 * R2 Security Service Class
 */
export class R2SecurityService {
  
  /**
   * Validate file access permissions
   * Requirements: 8.1 - Role-based access control for file operations
   */
  async validateFileAccess(
    context: FileAccessContext,
    fileKey: string,
    operation: FileOperation,
    securityMetadata?: FileSecurityMetadata
  ): Promise<AccessValidationResult> {
    try {
      // Extract school ID from file key for validation
      const fileSchoolId = this.extractSchoolIdFromKey(fileKey);
      
      // Super admins have access to all operations
      if (context.userRole === UserRole.SUPER_ADMIN) {
        await this.logFileAccess({
          userId: context.userId,
          schoolId: context.schoolId,
          fileKey,
          operation,
          result: 'ALLOWED',
          reason: 'Super admin access',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          timestamp: new Date()
        });
        
        return { allowed: true };
      }

      // Validate school isolation - file must belong to user's school
      if (fileSchoolId !== context.schoolId) {
        await this.logFileAccess({
          userId: context.userId,
          schoolId: context.schoolId,
          fileKey,
          operation,
          result: 'DENIED',
          reason: 'Cross-school access denied',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          timestamp: new Date()
        });
        
        return {
          allowed: false,
          reason: 'Access denied: File belongs to different school'
        };
      }

      // Check if user is authorized for the school
      if (!context.authorizedSchools.includes(fileSchoolId)) {
        await this.logFileAccess({
          userId: context.userId,
          schoolId: context.schoolId,
          fileKey,
          operation,
          result: 'DENIED',
          reason: 'User not authorized for school',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          timestamp: new Date()
        });
        
        return {
          allowed: false,
          reason: 'Access denied: User not authorized for this school'
        };
      }

      // If no security metadata provided, use default validation
      if (!securityMetadata) {
        return await this.validateDefaultAccess(context, fileKey, operation);
      }

      // Validate based on sensitivity level
      const sensitivityResult = await this.validateSensitivityLevel(
        context, 
        operation, 
        securityMetadata
      );
      
      if (!sensitivityResult.allowed) {
        await this.logFileAccess({
          userId: context.userId,
          schoolId: context.schoolId,
          fileKey,
          operation,
          result: 'DENIED',
          reason: sensitivityResult.reason || 'Sensitivity level check failed',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          timestamp: new Date()
        });
        
        return sensitivityResult;
      }

      // Validate role-based permissions
      const roleResult = await this.validateRolePermissions(
        context, 
        operation, 
        securityMetadata
      );
      
      if (!roleResult.allowed) {
        await this.logFileAccess({
          userId: context.userId,
          schoolId: context.schoolId,
          fileKey,
          operation,
          result: 'DENIED',
          reason: roleResult.reason || 'Role permission check failed',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          timestamp: new Date()
        });
        
        return roleResult;
      }

      // Validate access restrictions
      const restrictionResult = await this.validateAccessRestrictions(
        context, 
        securityMetadata
      );
      
      if (!restrictionResult.allowed) {
        await this.logFileAccess({
          userId: context.userId,
          schoolId: context.schoolId,
          fileKey,
          operation,
          result: 'DENIED',
          reason: restrictionResult.reason || 'Access restriction check failed',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          timestamp: new Date()
        });
        
        return restrictionResult;
      }

      // Log successful access
      await this.logFileAccess({
        userId: context.userId,
        schoolId: context.schoolId,
        fileKey,
        operation,
        result: 'ALLOWED',
        reason: 'All security checks passed',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: new Date()
      });

      return { allowed: true };

    } catch (error) {
      console.error('File access validation error:', error);
      
      await this.logFileAccess({
        userId: context.userId,
        schoolId: context.schoolId,
        fileKey,
        operation,
        result: 'ERROR',
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: new Date()
      });

      return {
        allowed: false,
        reason: 'Security validation failed due to system error'
      };
    }
  }

  /**
   * Check if file requires authentication
   * Requirements: 8.2 - Authentication requirements for sensitive files
   */
  async requiresAuthentication(
    fileKey: string,
    operation: FileOperation,
    securityMetadata?: FileSecurityMetadata
  ): Promise<boolean> {
    try {
      // All operations require authentication by default
      if (!securityMetadata) {
        return true;
      }

      // Public files may not require authentication for read operations
      if (securityMetadata.sensitivityLevel === 'PUBLIC' && operation === 'READ') {
        return false;
      }

      // All other operations require authentication
      return true;
    } catch (error) {
      console.error('Authentication requirement check error:', error);
      // Default to requiring authentication on error
      return true;
    }
  }

  /**
   * Validate CORS policy for request
   * Requirements: 8.4 - CORS policy enforcement
   */
  async validateCORSPolicy(
    origin: string,
    method: string,
    headers: string[]
  ): Promise<boolean> {
    try {
      // Get CORS configuration from environment or database
      const corsConfig = await this.getCORSConfiguration();
      
      // Check allowed origins
      const isOriginAllowed = corsConfig.allowedOrigins.includes('*') ||
                             corsConfig.allowedOrigins.includes(origin) ||
                             corsConfig.allowedOrigins.some(allowed => 
                               allowed.endsWith('*') && 
                               origin.startsWith(allowed.slice(0, -1))
                             );

      if (!isOriginAllowed) {
        return false;
      }

      // Check allowed methods
      if (!corsConfig.allowedMethods.includes(method.toUpperCase())) {
        return false;
      }

      // Check allowed headers
      const forbiddenHeaders = headers.filter(header => 
        !corsConfig.allowedHeaders.includes(header.toLowerCase()) &&
        !corsConfig.allowedHeaders.includes('*')
      );

      if (forbiddenHeaders.length > 0) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('CORS validation error:', error);
      return false;
    }
  }

  /**
   * Log file access attempt for audit
   * Requirements: 8.6 - Audit logging for file access attempts
   */
  async logFileAccess(auditLog: FileAccessAuditLog): Promise<void> {
    try {
      await auditService.logAuditEvent({
        userId: auditLog.userId,
        action: auditLog.operation as any,
        resource: 'file_access',
        resourceId: auditLog.fileKey,
        details: {
          operation: auditLog.operation,
          result: auditLog.result,
          reason: auditLog.reason,
          fileKey: auditLog.fileKey,
          schoolId: auditLog.schoolId,
          timestamp: auditLog.timestamp,
          metadata: auditLog.metadata
        },
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent
      });
    } catch (error) {
      console.error('Failed to log file access:', error);
      // Don't throw error to avoid breaking file operations
    }
  }

  /**
   * Get file security metadata from database or infer from file path
   */
  async getFileSecurityMetadata(fileKey: string): Promise<FileSecurityMetadata> {
    try {
      // Try to get metadata from database first (if FileMetadata model exists)
      // Note: FileMetadata model is not currently defined in schema
      // This would require adding the model to prisma/schema.prisma
      
      // For now, infer security metadata from file path
      return this.inferSecurityMetadata(fileKey);
    } catch (error) {
      console.error('Error getting file security metadata:', error);
      // Return default security metadata
      return this.inferSecurityMetadata(fileKey);
    }
  }

  /**
   * Create security metadata for new files
   */
  async createFileSecurityMetadata(
    fileKey: string,
    ownerId: string,
    schoolId: string,
    customMetadata?: Partial<FileSecurityMetadata>
  ): Promise<FileSecurityMetadata> {
    const defaultMetadata = this.inferSecurityMetadata(fileKey);
    
    const securityMetadata: FileSecurityMetadata = {
      ...defaultMetadata,
      ownerId,
      schoolId,
      ...customMetadata
    };

    try {
      // Store security metadata in database if FileMetadata model exists
      // Note: FileMetadata model is not currently defined in schema
      // This would require adding the model to prisma/schema.prisma
      
      // TODO: Uncomment when FileMetadata model is added to schema
      // await db.fileMetadata.create({
      //   data: {
      //     key: fileKey,
      //     schoolId,
      //     ownerId,
      //     securityMetadata: securityMetadata as any,
      //     createdAt: new Date(),
      //     updatedAt: new Date()
      //   }
      // });
      
      console.log('File security metadata created (in-memory only):', { fileKey, schoolId, ownerId });
    } catch (error) {
      console.error('Failed to store file security metadata:', error);
      // Continue without storing - metadata will be inferred next time
    }

    return securityMetadata;
  }

  // Private helper methods

  /**
   * Extract school ID from file key
   */
  private extractSchoolIdFromKey(fileKey: string): string {
    const match = fileKey.match(/^school-([^/]+)\//);
    if (!match) {
      throw new Error('Invalid file key format - missing school prefix');
    }
    return match[1];
  }

  /**
   * Validate default access when no security metadata is provided
   */
  private async validateDefaultAccess(
    context: FileAccessContext,
    fileKey: string,
    operation: FileOperation
  ): Promise<AccessValidationResult> {
    // Default role-based access control
    switch (context.userRole) {
      case UserRole.ADMIN:
        // Admins can perform all operations within their school
        return { allowed: true };
        
      case UserRole.TEACHER:
        // Teachers can read and upload, but limited delete access
        if (operation === 'DELETE') {
          // Only allow deletion of files they own or in specific folders
          const isTeacherFolder = fileKey.includes('/teachers/') || 
                                 fileKey.includes('/assignments/') ||
                                 fileKey.includes('/materials/');
          return { 
            allowed: isTeacherFolder,
            reason: isTeacherFolder ? undefined : 'Teachers can only delete files in teacher folders'
          };
        }
        return { allowed: ['READ', 'WRITE', 'UPLOAD', 'LIST'].includes(operation) };
        
      case UserRole.STUDENT:
        // Students have limited access
        if (operation === 'READ' || operation === 'LIST') {
          return { allowed: true };
        }
        if (operation === 'UPLOAD') {
          // Students can only upload to specific folders
          const isStudentFolder = fileKey.includes('/students/') || 
                                 fileKey.includes('/assignments/submissions/');
          return { 
            allowed: isStudentFolder,
            reason: isStudentFolder ? undefined : 'Students can only upload to student folders'
          };
        }
        return { 
          allowed: false, 
          reason: 'Students have limited file operation permissions' 
        };
        
      case UserRole.PARENT:
        // Parents have read-only access to their children's files
        return { 
          allowed: operation === 'READ' || operation === 'LIST',
          reason: operation === 'READ' || operation === 'LIST' ? undefined : 'Parents have read-only access'
        };
        
      default:
        return { 
          allowed: false, 
          reason: 'Unknown user role' 
        };
    }
  }

  /**
   * Validate access based on file sensitivity level
   */
  private async validateSensitivityLevel(
    context: FileAccessContext,
    operation: FileOperation,
    metadata: FileSecurityMetadata
  ): Promise<AccessValidationResult> {
    switch (metadata.sensitivityLevel) {
      case 'PUBLIC':
        return { allowed: true };
        
      case 'SCHOOL':
        // Already validated school access in main function
        return { allowed: true };
        
      case 'ROLE':
        if (metadata.allowedRoles && !metadata.allowedRoles.includes(context.userRole)) {
          return { 
            allowed: false, 
            reason: `Role ${context.userRole} not allowed for this file` 
          };
        }
        return { allowed: true };
        
      case 'PRIVATE':
        // Only owner and admins can access
        if (metadata.ownerId !== context.userId && 
            context.userRole !== UserRole.ADMIN && 
            context.userRole !== UserRole.SUPER_ADMIN) {
          return { 
            allowed: false, 
            reason: 'Private file - access restricted to owner and admins' 
          };
        }
        return { allowed: true };
        
      case 'SENSITIVE':
        // Requires additional authentication
        return { 
          allowed: false, 
          requiresAdditionalAuth: true,
          additionalAuthType: 'MFA',
          reason: 'Sensitive file requires multi-factor authentication'
        };
        
      default:
        return { 
          allowed: false, 
          reason: 'Unknown sensitivity level' 
        };
    }
  }

  /**
   * Validate role-based permissions
   */
  private async validateRolePermissions(
    context: FileAccessContext,
    operation: FileOperation,
    metadata: FileSecurityMetadata
  ): Promise<AccessValidationResult> {
    if (!metadata.requiredPermissions || metadata.requiredPermissions.length === 0) {
      return { allowed: true };
    }

    const hasAllPermissions = metadata.requiredPermissions.every(permission =>
      context.permissions.includes(permission) || context.permissions.includes('*')
    );

    if (!hasAllPermissions) {
      return {
        allowed: false,
        reason: `Missing required permissions: ${metadata.requiredPermissions.join(', ')}`
      };
    }

    return { allowed: true };
  }

  /**
   * Validate access restrictions (IP, time, etc.)
   */
  private async validateAccessRestrictions(
    context: FileAccessContext,
    metadata: FileSecurityMetadata
  ): Promise<AccessValidationResult> {
    const restrictions = metadata.accessRestrictions;
    if (!restrictions) {
      return { allowed: true };
    }

    // Check IP restrictions
    if (restrictions.allowedIPs && context.ipAddress) {
      const isIPAllowed = restrictions.allowedIPs.some(allowedIP => {
        if (allowedIP.includes('/')) {
          // CIDR notation - would need IP range checking library
          return allowedIP === context.ipAddress;
        }
        return allowedIP === context.ipAddress;
      });

      if (!isIPAllowed) {
        return {
          allowed: false,
          reason: 'Access denied from this IP address'
        };
      }
    }

    // Check time restrictions
    if (restrictions.timeRestrictions) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

      if (restrictions.timeRestrictions.startTime && restrictions.timeRestrictions.endTime) {
        const startHour = parseInt(restrictions.timeRestrictions.startTime.split(':')[0]);
        const endHour = parseInt(restrictions.timeRestrictions.endTime.split(':')[0]);
        
        if (currentHour < startHour || currentHour > endHour) {
          return {
            allowed: false,
            reason: 'Access denied outside allowed time window'
          };
        }
      }

      if (restrictions.timeRestrictions.allowedDays) {
        if (!restrictions.timeRestrictions.allowedDays.includes(currentDay)) {
          return {
            allowed: false,
            reason: 'Access denied on this day of the week'
          };
        }
      }
    }

    // Check MFA requirement
    if (restrictions.requireMFA) {
      return {
        allowed: false,
        requiresAdditionalAuth: true,
        additionalAuthType: 'MFA',
        reason: 'Multi-factor authentication required'
      };
    }

    return { allowed: true };
  }

  /**
   * Infer security metadata from file path
   */
  private inferSecurityMetadata(fileKey: string): FileSecurityMetadata {
    const schoolId = this.extractSchoolIdFromKey(fileKey);
    
    // Determine sensitivity level based on file path
    let sensitivityLevel: FileSensitivityLevel = 'SCHOOL';
    let allowedRoles: UserRole[] | undefined;

    if (fileKey.includes('/public/')) {
      sensitivityLevel = 'PUBLIC';
    } else if (fileKey.includes('/private/') || fileKey.includes('/personal/')) {
      sensitivityLevel = 'PRIVATE';
    } else if (fileKey.includes('/sensitive/') || fileKey.includes('/confidential/')) {
      sensitivityLevel = 'SENSITIVE';
    } else if (fileKey.includes('/admin/')) {
      sensitivityLevel = 'ROLE';
      allowedRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    } else if (fileKey.includes('/teachers/')) {
      sensitivityLevel = 'ROLE';
      allowedRoles = [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
    }

    return {
      sensitivityLevel,
      allowedRoles,
      schoolId,
      isEncrypted: sensitivityLevel === 'SENSITIVE'
    };
  }

  /**
   * Get CORS configuration
   */
  private async getCORSConfiguration(): Promise<CORSRule> {
    // Default CORS configuration for R2
    return {
      allowedOrigins: [
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        process.env.NEXT_PUBLIC_CDN_DOMAIN || 'https://cdn.schoolerp.com',
        '*.schoolerp.com'
      ],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
      allowedHeaders: [
        'authorization',
        'content-type',
        'x-requested-with',
        'x-school-id',
        'x-user-id',
        'cache-control'
      ],
      exposedHeaders: ['etag', 'content-length'],
      maxAgeSeconds: 3600
    };
  }
}

// Export singleton instance
export const r2SecurityService = new R2SecurityService();