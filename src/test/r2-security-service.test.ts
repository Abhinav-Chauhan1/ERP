/**
 * R2 Security Service Tests
 * 
 * Tests for role-based access control, authentication requirements,
 * CORS policy enforcement, and audit logging for R2 file operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserRole } from '@prisma/client';
import { 
  r2SecurityService,
  type FileAccessContext,
  type FileSecurityMetadata,
  type FileAccessAuditLog
} from '../lib/services/r2-security-service';

// Mock dependencies
vi.mock('../lib/services/audit-service', () => ({
  auditService: {
    logAuditEvent: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../lib/db', () => ({
  db: {
    fileMetadata: {
      findFirst: vi.fn(),
      create: vi.fn()
    }
  }
}));

describe('R2SecurityService', () => {
  let mockContext: FileAccessContext;
  let mockSecurityMetadata: FileSecurityMetadata;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {
      userId: 'user-123',
      userRole: UserRole.TEACHER,
      schoolId: '456', // School ID without prefix
      authorizedSchools: ['456'], // School IDs without prefix
      permissions: ['file:read', 'file:write'],
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 Test Browser'
    };

    mockSecurityMetadata = {
      sensitivityLevel: 'SCHOOL',
      schoolId: '456', // School ID without prefix
      ownerId: 'user-123',
      isEncrypted: false
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateFileAccess', () => {
    it('should allow super admin access to any file', async () => {
      const superAdminContext: FileAccessContext = {
        ...mockContext,
        userRole: UserRole.SUPER_ADMIN
      };

      const result = await r2SecurityService.validateFileAccess(
        superAdminContext,
        'school-different-school/documents/test.pdf',
        'READ'
      );

      expect(result.allowed).toBe(true);
    });

    it('should deny cross-school access for non-super-admin users', async () => {
      const result = await r2SecurityService.validateFileAccess(
        mockContext,
        'school-different-school/documents/test.pdf',
        'READ'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('different school');
    });

    it('should deny access when user is not authorized for school', async () => {
      const unauthorizedContext: FileAccessContext = {
        ...mockContext,
        authorizedSchools: ['school-999'] // Different school
      };

      const result = await r2SecurityService.validateFileAccess(
        unauthorizedContext,
        'school-456/documents/test.pdf',
        'READ'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not authorized for this school');
    });

    it('should allow access when all security checks pass', async () => {
      const result = await r2SecurityService.validateFileAccess(
        mockContext,
        'school-456/documents/test.pdf',
        'READ',
        mockSecurityMetadata
      );

      expect(result.allowed).toBe(true);
    });

    it('should deny access for private files when user is not owner', async () => {
      const privateMetadata: FileSecurityMetadata = {
        ...mockSecurityMetadata,
        sensitivityLevel: 'PRIVATE',
        ownerId: 'different-user'
      };

      const result = await r2SecurityService.validateFileAccess(
        mockContext,
        'school-456/private/test.pdf',
        'READ',
        privateMetadata
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Private file');
    });

    it('should require additional auth for sensitive files', async () => {
      const sensitiveMetadata: FileSecurityMetadata = {
        ...mockSecurityMetadata,
        sensitivityLevel: 'SENSITIVE'
      };

      const result = await r2SecurityService.validateFileAccess(
        mockContext,
        'school-456/sensitive/test.pdf',
        'READ',
        sensitiveMetadata
      );

      expect(result.allowed).toBe(false);
      expect(result.requiresAdditionalAuth).toBe(true);
      expect(result.additionalAuthType).toBe('MFA');
    });

    it('should validate role-based access restrictions', async () => {
      const roleRestrictedMetadata: FileSecurityMetadata = {
        ...mockSecurityMetadata,
        sensitivityLevel: 'ROLE',
        allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
      };

      const result = await r2SecurityService.validateFileAccess(
        mockContext,
        'school-456/admin/test.pdf',
        'READ',
        roleRestrictedMetadata
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Role TEACHER not allowed');
    });

    it('should validate required permissions', async () => {
      const permissionRestrictedMetadata: FileSecurityMetadata = {
        ...mockSecurityMetadata,
        requiredPermissions: ['admin:access', 'sensitive:read']
      };

      const result = await r2SecurityService.validateFileAccess(
        mockContext,
        'school-456/documents/test.pdf',
        'READ',
        permissionRestrictedMetadata
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Missing required permissions');
    });

    it('should validate IP address restrictions', async () => {
      const ipRestrictedMetadata: FileSecurityMetadata = {
        ...mockSecurityMetadata,
        accessRestrictions: {
          allowedIPs: ['10.0.0.1', '10.0.0.2']
        }
      };

      const result = await r2SecurityService.validateFileAccess(
        mockContext,
        'school-456/documents/test.pdf',
        'READ',
        ipRestrictedMetadata
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Access denied from this IP address');
    });

    it('should handle validation errors gracefully', async () => {
      // Mock an error in the validation process
      const invalidFileKey = 'invalid-key-format';

      const result = await r2SecurityService.validateFileAccess(
        mockContext,
        invalidFileKey,
        'READ'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Security validation failed');
    });
  });

  describe('Default Access Validation', () => {
    it('should allow admin full access within their school', async () => {
      const adminContext: FileAccessContext = {
        ...mockContext,
        userRole: UserRole.ADMIN
      };

      const result = await r2SecurityService.validateFileAccess(
        adminContext,
        'school-456/documents/test.pdf',
        'DELETE'
      );

      expect(result.allowed).toBe(true);
    });

    it('should restrict teacher delete access to specific folders', async () => {
      const result = await r2SecurityService.validateFileAccess(
        mockContext,
        'school-456/students/test.pdf',
        'DELETE'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Teachers can only delete files in teacher folders');
    });

    it('should allow teacher delete access in teacher folders', async () => {
      const result = await r2SecurityService.validateFileAccess(
        mockContext,
        'school-456/teachers/materials/test.pdf',
        'DELETE'
      );

      expect(result.allowed).toBe(true);
    });

    it('should restrict student upload access to specific folders', async () => {
      const studentContext: FileAccessContext = {
        ...mockContext,
        userRole: UserRole.STUDENT
      };

      const result = await r2SecurityService.validateFileAccess(
        studentContext,
        'school-456/admin/test.pdf',
        'UPLOAD'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Students can only upload to student folders');
    });

    it('should allow student upload access in student folders', async () => {
      const studentContext: FileAccessContext = {
        ...mockContext,
        userRole: UserRole.STUDENT
      };

      const result = await r2SecurityService.validateFileAccess(
        studentContext,
        'school-456/students/assignments/test.pdf',
        'UPLOAD'
      );

      expect(result.allowed).toBe(true);
    });

    it('should restrict parent access to read-only', async () => {
      const parentContext: FileAccessContext = {
        ...mockContext,
        userRole: UserRole.PARENT
      };

      const readResult = await r2SecurityService.validateFileAccess(
        parentContext,
        'school-456/students/test.pdf',
        'READ'
      );

      const writeResult = await r2SecurityService.validateFileAccess(
        parentContext,
        'school-456/students/test.pdf',
        'WRITE'
      );

      expect(readResult.allowed).toBe(true);
      expect(writeResult.allowed).toBe(false);
      expect(writeResult.reason).toContain('read-only access');
    });
  });

  describe('requiresAuthentication', () => {
    it('should require authentication by default', async () => {
      const result = await r2SecurityService.requiresAuthentication(
        'school-456/documents/test.pdf',
        'READ'
      );

      expect(result).toBe(true);
    });

    it('should not require authentication for public file reads', async () => {
      const publicMetadata: FileSecurityMetadata = {
        ...mockSecurityMetadata,
        sensitivityLevel: 'PUBLIC'
      };

      const result = await r2SecurityService.requiresAuthentication(
        'school-456/public/test.pdf',
        'READ',
        publicMetadata
      );

      expect(result).toBe(false);
    });

    it('should require authentication for public file writes', async () => {
      const publicMetadata: FileSecurityMetadata = {
        ...mockSecurityMetadata,
        sensitivityLevel: 'PUBLIC'
      };

      const result = await r2SecurityService.requiresAuthentication(
        'school-456/public/test.pdf',
        'WRITE',
        publicMetadata
      );

      expect(result).toBe(true);
    });
  });

  describe('validateCORSPolicy', () => {
    it('should allow requests from allowed origins', async () => {
      const result = await r2SecurityService.validateCORSPolicy(
        'http://localhost:3000',
        'GET',
        ['content-type', 'authorization']
      );

      expect(result).toBe(true);
    });

    it('should deny requests from disallowed origins', async () => {
      const result = await r2SecurityService.validateCORSPolicy(
        'https://malicious-site.com',
        'GET',
        ['content-type']
      );

      expect(result).toBe(false);
    });

    it('should deny requests with disallowed methods', async () => {
      const result = await r2SecurityService.validateCORSPolicy(
        'http://localhost:3000',
        'PATCH',
        ['content-type']
      );

      expect(result).toBe(false);
    });

    it('should deny requests with forbidden headers', async () => {
      const result = await r2SecurityService.validateCORSPolicy(
        'http://localhost:3000',
        'GET',
        ['content-type', 'x-forbidden-header']
      );

      expect(result).toBe(false);
    });
  });

  describe('logFileAccess', () => {
    it('should log file access attempts', async () => {
      const { auditService } = await import('../lib/services/audit-service');
      
      const auditLog: FileAccessAuditLog = {
        userId: 'user-123',
        schoolId: 'school-456',
        fileKey: 'school-456/documents/test.pdf',
        operation: 'READ',
        result: 'ALLOWED',
        reason: 'Access granted',
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser',
        timestamp: new Date()
      };

      await r2SecurityService.logFileAccess(auditLog);

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        userId: auditLog.userId,
        action: auditLog.operation,
        resource: 'file_access',
        resourceId: auditLog.fileKey,
        details: expect.objectContaining({
          operation: auditLog.operation,
          result: auditLog.result,
          reason: auditLog.reason,
          fileKey: auditLog.fileKey,
          schoolId: auditLog.schoolId
        }),
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent
      });
    });

    it('should handle logging errors gracefully', async () => {
      const { auditService } = await import('../lib/services/audit-service');
      vi.mocked(auditService.logAuditEvent).mockRejectedValue(new Error('Logging failed'));

      const auditLog: FileAccessAuditLog = {
        userId: 'user-123',
        schoolId: 'school-456',
        fileKey: 'school-456/documents/test.pdf',
        operation: 'READ',
        result: 'ALLOWED',
        timestamp: new Date()
      };

      // Should not throw error
      await expect(r2SecurityService.logFileAccess(auditLog)).resolves.toBeUndefined();
    });
  });

  describe('getFileSecurityMetadata', () => {
    it('should return stored metadata when available', async () => {
      const { db } = await import('../lib/db');
      const storedMetadata = {
        key: 'school-456/documents/test.pdf',
        securityMetadata: mockSecurityMetadata
      };
      
      vi.mocked(db.fileMetadata?.findFirst).mockResolvedValue(storedMetadata as any);

      const result = await r2SecurityService.getFileSecurityMetadata(
        'school-456/documents/test.pdf'
      );

      expect(result).toEqual(mockSecurityMetadata);
    });

    it('should infer metadata when not stored', async () => {
      const { db } = await import('../lib/db');
      vi.mocked(db.fileMetadata?.findFirst).mockResolvedValue(null);

      const result = await r2SecurityService.getFileSecurityMetadata(
        'school-456/private/test.pdf'
      );

      expect(result.sensitivityLevel).toBe('PRIVATE');
      expect(result.schoolId).toBe('456');
    });

    it('should infer admin folder restrictions', async () => {
      const { db } = await import('../lib/db');
      vi.mocked(db.fileMetadata?.findFirst).mockResolvedValue(null);

      const result = await r2SecurityService.getFileSecurityMetadata(
        'school-456/admin/test.pdf'
      );

      expect(result.sensitivityLevel).toBe('ROLE');
      expect(result.allowedRoles).toContain(UserRole.ADMIN);
      expect(result.allowedRoles).toContain(UserRole.SUPER_ADMIN);
    });

    it('should infer teacher folder restrictions', async () => {
      const { db } = await import('../lib/db');
      vi.mocked(db.fileMetadata?.findFirst).mockResolvedValue(null);

      const result = await r2SecurityService.getFileSecurityMetadata(
        'school-456/teachers/test.pdf'
      );

      expect(result.sensitivityLevel).toBe('ROLE');
      expect(result.allowedRoles).toContain(UserRole.TEACHER);
      expect(result.allowedRoles).toContain(UserRole.ADMIN);
    });
  });

  describe('createFileSecurityMetadata', () => {
    it('should create and store security metadata', async () => {
      const { db } = await import('../lib/db');
      vi.mocked(db.fileMetadata?.create).mockResolvedValue({} as any);

      const result = await r2SecurityService.createFileSecurityMetadata(
        'school-456/documents/test.pdf',
        'user-123',
        'school-456',
        { sensitivityLevel: 'PRIVATE' }
      );

      expect(result.ownerId).toBe('user-123');
      expect(result.schoolId).toBe('school-456');
      expect(result.sensitivityLevel).toBe('PRIVATE');

      expect(db.fileMetadata?.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: 'school-456/documents/test.pdf',
          schoolId: 'school-456',
          ownerId: 'user-123',
          securityMetadata: expect.any(Object)
        })
      });
    });

    it('should handle storage errors gracefully', async () => {
      const { db } = await import('../lib/db');
      vi.mocked(db.fileMetadata?.create).mockRejectedValue(new Error('Storage failed'));

      const result = await r2SecurityService.createFileSecurityMetadata(
        'school-456/documents/test.pdf',
        'user-123',
        'school-456'
      );

      // Should still return metadata even if storage fails
      expect(result.ownerId).toBe('user-123');
      expect(result.schoolId).toBe('school-456');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid file key format', async () => {
      const result = await r2SecurityService.validateFileAccess(
        mockContext,
        'invalid-key-without-school-prefix',
        'READ'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Security validation failed');
    });

    it('should handle missing context properties', async () => {
      const incompleteContext = {
        userId: 'user-123',
        userRole: UserRole.TEACHER,
        schoolId: 'school-456',
        authorizedSchools: [],
        permissions: []
      } as FileAccessContext;

      const result = await r2SecurityService.validateFileAccess(
        incompleteContext,
        'school-456/documents/test.pdf',
        'READ'
      );

      // Should handle gracefully and make security decisions
      expect(typeof result.allowed).toBe('boolean');
    });
  });
});