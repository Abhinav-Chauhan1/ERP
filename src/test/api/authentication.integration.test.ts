import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { 
  authenticate, 
  createAuthMiddleware, 
  requireSuperAdmin, 
  requireAdmin, 
  requireAuth,
  validateApiKey,
  validateWebhookSignature,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getEffectivePermissions
} from '@/lib/middleware/auth';
import { getServerSession } from 'next-auth';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock audit service
vi.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('Authentication Middleware Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticate function', () => {
    it('should allow anonymous access when configured', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/public');
      const config = { allowAnonymous: true };

      // Act
      const result = await authenticate(request, config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toBeUndefined();
    });

    it('should reject unauthenticated requests by default', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/protected');

      // Act
      const result = await authenticate(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized - No valid session');
      expect(result.statusCode).toBe(401);
    });

    it('should allow authenticated users with correct role', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'admin@test.com',
          role: 'SUPER_ADMIN',
          permissions: ['read:all', 'write:all'],
        },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      
      const request = new NextRequest('http://localhost:3000/api/admin');
      const config = { requiredRole: 'SUPER_ADMIN' as const };

      // Act
      const result = await authenticate(request, config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockSession.user);
    });

    it('should reject users with insufficient role', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'teacher@test.com',
          role: 'TEACHER',
          permissions: ['read:students'],
        },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      
      const request = new NextRequest('http://localhost:3000/api/admin');
      const config = { requiredRole: 'SUPER_ADMIN' as const };

      // Act
      const result = await authenticate(request, config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Forbidden - Required role: SUPER_ADMIN');
      expect(result.statusCode).toBe(403);
    });

    it('should allow users with required permissions', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'admin@test.com',
          role: 'ADMIN',
          permissions: ['read:schools', 'write:schools', 'read:users'],
        },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      
      const request = new NextRequest('http://localhost:3000/api/schools');
      const config = { requiredPermissions: ['read:schools', 'write:schools'] };

      // Act
      const result = await authenticate(request, config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockSession.user);
    });

    it('should reject users with insufficient permissions', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'teacher@test.com',
          role: 'TEACHER',
          permissions: ['read:students'],
        },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      
      const request = new NextRequest('http://localhost:3000/api/schools');
      const config = { requiredPermissions: ['read:schools', 'write:schools'] };

      // Act
      const result = await authenticate(request, config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Forbidden - Insufficient permissions');
      expect(result.statusCode).toBe(403);
    });

    it('should handle authentication errors gracefully', async () => {
      // Arrange
      vi.mocked(getServerSession).mockRejectedValue(new Error('Session error'));
      const request = new NextRequest('http://localhost:3000/api/protected');

      // Act
      const result = await authenticate(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal authentication error');
      expect(result.statusCode).toBe(500);
    });
  });

  describe('createAuthMiddleware', () => {
    it('should create middleware that returns null for authorized requests', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'admin@test.com',
          role: 'ADMIN',
        },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      
      const middleware = createAuthMiddleware({ requiredRole: 'ADMIN' });
      const request = new NextRequest('http://localhost:3000/api/admin');

      // Act
      const result = await middleware(request);

      // Assert
      expect(result).toBeNull(); // Should continue to route handler
    });

    it('should create middleware that returns error response for unauthorized requests', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null);
      
      const middleware = createAuthMiddleware({ requiredRole: 'ADMIN' });
      const request = new NextRequest('http://localhost:3000/api/admin');

      // Act
      const result = await middleware(request);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.status).toBe(401);
      
      const responseData = await result?.json();
      expect(responseData.error).toBe('Unauthorized - No valid session');
    });
  });

  describe('Predefined middleware functions', () => {
    describe('requireSuperAdmin', () => {
      it('should allow super admin users', async () => {
        // Arrange
        const mockSession = {
          user: {
            id: 'user-1',
            email: 'superadmin@test.com',
            role: 'SUPER_ADMIN',
          },
        };
        vi.mocked(getServerSession).mockResolvedValue(mockSession);
        
        const request = new NextRequest('http://localhost:3000/api/super-admin');

        // Act
        const result = await requireSuperAdmin(request);

        // Assert
        expect(result).toBeNull();
      });

      it('should reject non-super-admin users', async () => {
        // Arrange
        const mockSession = {
          user: {
            id: 'user-1',
            email: 'admin@test.com',
            role: 'ADMIN',
          },
        };
        vi.mocked(getServerSession).mockResolvedValue(mockSession);
        
        const request = new NextRequest('http://localhost:3000/api/super-admin');

        // Act
        const result = await requireSuperAdmin(request);

        // Assert
        expect(result?.status).toBe(403);
      });
    });

    describe('requireAdmin', () => {
      it('should allow admin users', async () => {
        // Arrange
        const mockSession = {
          user: {
            id: 'user-1',
            email: 'admin@test.com',
            role: 'ADMIN',
          },
        };
        vi.mocked(getServerSession).mockResolvedValue(mockSession);
        
        const request = new NextRequest('http://localhost:3000/api/admin');

        // Act
        const result = await requireAdmin(request);

        // Assert
        expect(result).toBeNull();
      });

      it('should reject non-admin users', async () => {
        // Arrange
        const mockSession = {
          user: {
            id: 'user-1',
            email: 'teacher@test.com',
            role: 'TEACHER',
          },
        };
        vi.mocked(getServerSession).mockResolvedValue(mockSession);
        
        const request = new NextRequest('http://localhost:3000/api/admin');

        // Act
        const result = await requireAdmin(request);

        // Assert
        expect(result?.status).toBe(403);
      });
    });

    describe('requireAuth', () => {
      it('should allow any authenticated user', async () => {
        // Arrange
        const mockSession = {
          user: {
            id: 'user-1',
            email: 'student@test.com',
            role: 'STUDENT',
          },
        };
        vi.mocked(getServerSession).mockResolvedValue(mockSession);
        
        const request = new NextRequest('http://localhost:3000/api/protected');

        // Act
        const result = await requireAuth(request);

        // Assert
        expect(result).toBeNull();
      });

      it('should reject unauthenticated users', async () => {
        // Arrange
        vi.mocked(getServerSession).mockResolvedValue(null);
        
        const request = new NextRequest('http://localhost:3000/api/protected');

        // Act
        const result = await requireAuth(request);

        // Assert
        expect(result?.status).toBe(401);
      });
    });
  });

  describe('validateApiKey', () => {
    it('should validate correct API key from x-api-key header', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/webhook', {
        headers: {
          'x-api-key': 'valid-api-key',
        },
      });

      // Act
      const result = await validateApiKey(request, 'valid-api-key');

      // Assert
      expect(result).toBe(true);
    });

    it('should validate correct API key from authorization header', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/webhook', {
        headers: {
          'authorization': 'Bearer valid-api-key',
        },
      });

      // Act
      const result = await validateApiKey(request, 'valid-api-key');

      // Assert
      expect(result).toBe(true);
    });

    it('should reject incorrect API key', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/webhook', {
        headers: {
          'x-api-key': 'invalid-api-key',
        },
      });

      // Act
      const result = await validateApiKey(request, 'valid-api-key');

      // Assert
      expect(result).toBe(false);
    });

    it('should reject missing API key', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/webhook');

      // Act
      const result = await validateApiKey(request, 'valid-api-key');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('validateWebhookSignature', () => {
    it('should validate correct webhook signature with sha256', () => {
      // Arrange
      const payload = 'test payload';
      const secret = 'webhook-secret';
      const crypto = require('crypto');
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
      const signature = `sha256=${expectedSignature}`;

      // Act
      const result = validateWebhookSignature(payload, signature, secret, 'sha256');

      // Assert
      expect(result).toBe(true);
    });

    it('should validate correct webhook signature with sha1', () => {
      // Arrange
      const payload = 'test payload';
      const secret = 'webhook-secret';
      const crypto = require('crypto');
      const expectedSignature = crypto.createHmac('sha1', secret).update(payload, 'utf8').digest('hex');
      const signature = `sha1=${expectedSignature}`;

      // Act
      const result = validateWebhookSignature(payload, signature, secret, 'sha1');

      // Assert
      expect(result).toBe(true);
    });

    it('should reject incorrect webhook signature', () => {
      // Arrange
      const payload = 'test payload';
      const secret = 'webhook-secret';
      const signature = 'sha256=invalid-signature';

      // Act
      const result = validateWebhookSignature(payload, signature, secret, 'sha256');

      // Assert
      expect(result).toBe(false);
    });

    it('should handle signature validation errors gracefully', () => {
      // Arrange
      const payload = 'test payload';
      const secret = 'webhook-secret';
      const signature = 'malformed-signature';

      // Act
      const result = validateWebhookSignature(payload, signature, secret, 'sha256');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Permission helper functions', () => {
    describe('hasPermission', () => {
      it('should return true for super admin users', () => {
        // Arrange
        const user = {
          id: 'user-1',
          role: 'SUPER_ADMIN',
          permissions: ['read:basic'],
        };

        // Act
        const result = hasPermission(user, 'write:sensitive');

        // Assert
        expect(result).toBe(true);
      });

      it('should return true when user has specific permission', () => {
        // Arrange
        const user = {
          id: 'user-1',
          role: 'ADMIN',
          permissions: ['read:schools', 'write:schools'],
        };

        // Act
        const result = hasPermission(user, 'read:schools');

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when user lacks permission', () => {
        // Arrange
        const user = {
          id: 'user-1',
          role: 'TEACHER',
          permissions: ['read:students'],
        };

        // Act
        const result = hasPermission(user, 'write:schools');

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for users without permissions array', () => {
        // Arrange
        const user = {
          id: 'user-1',
          role: 'STUDENT',
        };

        // Act
        const result = hasPermission(user, 'read:schools');

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('hasAnyPermission', () => {
      it('should return true when user has at least one permission', () => {
        // Arrange
        const user = {
          id: 'user-1',
          role: 'ADMIN',
          permissions: ['read:schools', 'write:users'],
        };

        // Act
        const result = hasAnyPermission(user, ['read:schools', 'write:schools']);

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when user has none of the permissions', () => {
        // Arrange
        const user = {
          id: 'user-1',
          role: 'TEACHER',
          permissions: ['read:students'],
        };

        // Act
        const result = hasAnyPermission(user, ['write:schools', 'delete:schools']);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('hasAllPermissions', () => {
      it('should return true when user has all required permissions', () => {
        // Arrange
        const user = {
          id: 'user-1',
          role: 'ADMIN',
          permissions: ['read:schools', 'write:schools', 'read:users'],
        };

        // Act
        const result = hasAllPermissions(user, ['read:schools', 'write:schools']);

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when user is missing some permissions', () => {
        // Arrange
        const user = {
          id: 'user-1',
          role: 'ADMIN',
          permissions: ['read:schools'],
        };

        // Act
        const result = hasAllPermissions(user, ['read:schools', 'write:schools']);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('getEffectivePermissions', () => {
      it('should return all permissions for super admin', () => {
        // Arrange
        const user = {
          id: 'user-1',
          role: 'SUPER_ADMIN',
          permissions: ['read:basic'],
        };

        // Act
        const result = getEffectivePermissions(user);

        // Assert
        expect(result).toContain('*');
        expect(result).toContain('read:basic');
      });

      it('should include role-based permissions for admin', () => {
        // Arrange
        const user = {
          id: 'user-1',
          role: 'ADMIN',
          permissions: ['custom:permission'],
        };

        // Act
        const result = getEffectivePermissions(user);

        // Assert
        expect(result).toContain('custom:permission');
        expect(result).toContain('school:read');
        expect(result).toContain('school:write');
        expect(result).toContain('user:read');
        expect(result).toContain('user:write');
      });

      it('should include role-based permissions for teacher', () => {
        // Arrange
        const user = {
          id: 'user-1',
          role: 'TEACHER',
          permissions: [],
        };

        // Act
        const result = getEffectivePermissions(user);

        // Assert
        expect(result).toContain('student:read');
        expect(result).toContain('class:read');
      });

      it('should handle users without permissions array', () => {
        // Arrange
        const user = {
          id: 'user-1',
          role: 'STUDENT',
        };

        // Act
        const result = getEffectivePermissions(user);

        // Assert
        expect(result).toContain('profile:read');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should return empty array for null user', () => {
        // Act
        const result = getEffectivePermissions(null);

        // Assert
        expect(result).toEqual([]);
      });
    });
  });

  describe('Integration with audit logging', () => {
    it('should log unauthorized access attempts', async () => {
      // Arrange
      const auditMock = vi.mocked(require('@/lib/services/audit-service').logAuditEvent);
      vi.mocked(getServerSession).mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/protected', {
        headers: {
          'user-agent': 'test-browser',
        },
      });

      // Act
      await authenticate(request);

      // Assert
      expect(auditMock).toHaveBeenCalledWith({
        userId: 'anonymous',
        action: 'READ',
        resource: 'API_ACCESS',
        changes: {
          unauthorized: true,
          reason: 'No session',
          path: '/api/protected',
          method: 'GET',
          userAgent: 'test-browser',
          timestamp: expect.any(String),
        },
      });
    });

    it('should log insufficient role access attempts', async () => {
      // Arrange
      const auditMock = vi.mocked(require('@/lib/services/audit-service').logAuditEvent);
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'teacher@test.com',
          role: 'TEACHER',
        },
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      
      const request = new NextRequest('http://localhost:3000/api/super-admin');
      const config = { requiredRole: 'SUPER_ADMIN' as const };

      // Act
      await authenticate(request, config);

      // Assert
      expect(auditMock).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'READ',
        resource: 'API_ACCESS',
        changes: {
          unauthorized: true,
          reason: 'Insufficient role: TEACHER',
          path: '/api/super-admin',
          method: 'GET',
          userAgent: null,
          timestamp: expect.any(String),
        },
      });
    });
  });
});