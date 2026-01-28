import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { enhancedAuthenticate, EnhancedAuthConfig } from '../enhanced-auth';
import { jwtService } from '@/lib/services/jwt-service';
import { schoolContextService } from '@/lib/services/school-context-service';

// Mock dependencies
jest.mock('@/lib/services/jwt-service');
jest.mock('@/lib/services/school-context-service');
jest.mock('@/lib/services/audit-service');

const mockJwtService = jwtService as jest.Mocked<typeof jwtService>;
const mockSchoolContextService = schoolContextService as jest.Mocked<typeof schoolContextService>;

describe('Enhanced Authentication Middleware', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = new NextRequest('https://example.com/api/test', {
      method: 'GET',
      headers: {
        'authorization': 'Bearer valid-token',
        'user-agent': 'Test Agent',
        'x-forwarded-for': '192.168.1.1'
      }
    });
  });

  describe('JWT Validation', () => {
    it('should successfully validate valid JWT token', async () => {
      // Arrange
      const mockTokenPayload = {
        userId: 'user-123',
        role: UserRole.TEACHER,
        authorizedSchools: ['school-1', 'school-2'],
        activeSchoolId: 'school-1',
        permissions: ['student:read', 'class:read'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: mockTokenPayload
      });

      const config: EnhancedAuthConfig = {};

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'user-123',
        name: '',
        role: UserRole.TEACHER,
        authorizedSchools: ['school-1', 'school-2'],
        activeSchoolId: 'school-1',
        permissions: ['student:read', 'class:read']
      });
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('valid-token');
    });

    it('should reject invalid JWT token', async () => {
      // Arrange
      mockJwtService.verifyToken.mockResolvedValue({
        valid: false,
        error: 'TOKEN_EXPIRED'
      });

      const config: EnhancedAuthConfig = {};

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Token validation failed');
      expect(result.statusCode).toBe(401);
    });

    it('should handle missing token', async () => {
      // Arrange
      const requestWithoutToken = new NextRequest('https://example.com/api/test', {
        method: 'GET'
      });

      const config: EnhancedAuthConfig = {};

      // Act
      const result = await enhancedAuthenticate(requestWithoutToken, config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('No authentication token provided');
      expect(result.statusCode).toBe(401);
    });
  });

  describe('Role-Based Access Control', () => {
    beforeEach(() => {
      const mockTokenPayload = {
        userId: 'user-123',
        role: UserRole.STUDENT,
        authorizedSchools: ['school-1'],
        activeSchoolId: 'school-1',
        permissions: ['profile:read'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: mockTokenPayload
      });
    });

    it('should allow access for correct role', async () => {
      // Arrange
      const config: EnhancedAuthConfig = {
        requiredRole: UserRole.STUDENT
      };

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user?.role).toBe(UserRole.STUDENT);
    });

    it('should allow access for multiple allowed roles', async () => {
      // Arrange
      const config: EnhancedAuthConfig = {
        requiredRole: [UserRole.STUDENT, UserRole.TEACHER]
      };

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should deny access for incorrect role', async () => {
      // Arrange
      const config: EnhancedAuthConfig = {
        requiredRole: UserRole.TEACHER
      };

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Required role: TEACHER, got: STUDENT');
      expect(result.statusCode).toBe(403);
    });
  });

  describe('Permission Validation', () => {
    beforeEach(() => {
      const mockTokenPayload = {
        userId: 'user-123',
        role: UserRole.TEACHER,
        authorizedSchools: ['school-1'],
        activeSchoolId: 'school-1',
        permissions: ['student:read', 'class:read'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: mockTokenPayload
      });
    });

    it('should allow access with required permissions', async () => {
      // Arrange
      const config: EnhancedAuthConfig = {
        requiredPermissions: ['student:read']
      };

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should allow access with wildcard permission', async () => {
      // Arrange
      const mockTokenPayload = {
        userId: 'user-123',
        role: UserRole.SUPER_ADMIN,
        authorizedSchools: ['school-1'],
        permissions: ['*'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: mockTokenPayload
      });

      const config: EnhancedAuthConfig = {
        requiredPermissions: ['any:permission']
      };

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should deny access without required permissions', async () => {
      // Arrange
      const config: EnhancedAuthConfig = {
        requiredPermissions: ['admin:write']
      };

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing permissions: admin:write');
      expect(result.statusCode).toBe(403);
    });
  });

  describe('School Context Validation', () => {
    beforeEach(() => {
      const mockTokenPayload = {
        userId: 'user-123',
        role: UserRole.TEACHER,
        authorizedSchools: ['school-1', 'school-2'],
        activeSchoolId: 'school-1',
        permissions: ['student:read'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: mockTokenPayload
      });
    });

    it('should validate school context successfully', async () => {
      // Arrange
      mockSchoolContextService.validateSchoolById.mockResolvedValue({
        id: 'school-1',
        name: 'Test School',
        schoolCode: 'TEST001',
        status: 'ACTIVE' as any,
        isOnboarded: true,
        onboardingStep: 0
      });

      mockSchoolContextService.validateSchoolAccess.mockResolvedValue(true);

      const config: EnhancedAuthConfig = {
        requireSchoolContext: true
      };

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.schoolContext).toEqual({
        id: 'school-1',
        name: 'Test School',
        schoolCode: 'TEST001'
      });
      expect(mockSchoolContextService.validateSchoolById).toHaveBeenCalledWith('school-1');
      expect(mockSchoolContextService.validateSchoolAccess).toHaveBeenCalledWith('user-123', 'school-1');
    });

    it('should reject invalid school context', async () => {
      // Arrange
      mockSchoolContextService.validateSchoolById.mockResolvedValue(null);

      const config: EnhancedAuthConfig = {
        requireSchoolContext: true
      };

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or inactive school context');
      expect(result.statusCode).toBe(403);
    });

    it('should reject unauthorized school access', async () => {
      // Arrange
      mockSchoolContextService.validateSchoolById.mockResolvedValue({
        id: 'school-1',
        name: 'Test School',
        schoolCode: 'TEST001',
        status: 'ACTIVE' as any,
        isOnboarded: true,
        onboardingStep: 0
      });

      mockSchoolContextService.validateSchoolAccess.mockResolvedValue(false);

      const config: EnhancedAuthConfig = {
        requireSchoolContext: true
      };

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authorized for this school');
      expect(result.statusCode).toBe(403);
    });
  });

  describe('Tenant Isolation', () => {
    beforeEach(() => {
      const mockTokenPayload = {
        userId: 'user-123',
        role: UserRole.TEACHER,
        authorizedSchools: ['school-1'],
        activeSchoolId: 'school-1',
        permissions: ['student:read'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: mockTokenPayload
      });
    });

    it('should allow access to authorized school', async () => {
      // Arrange
      const config: EnhancedAuthConfig = {
        allowedSchools: ['school-1']
      };

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should deny access to unauthorized school', async () => {
      // Arrange
      const config: EnhancedAuthConfig = {
        allowedSchools: ['school-2']
      };

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authorized for requested school');
      expect(result.statusCode).toBe(403);
    });
  });

  describe('Anonymous Access', () => {
    it('should allow anonymous access when configured', async () => {
      // Arrange
      const requestWithoutToken = new NextRequest('https://example.com/api/test', {
        method: 'GET'
      });

      const config: EnhancedAuthConfig = {
        allowAnonymous: true
      };

      // Act
      const result = await enhancedAuthenticate(requestWithoutToken, config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle JWT service errors gracefully', async () => {
      // Arrange
      mockJwtService.verifyToken.mockRejectedValue(new Error('JWT service error'));

      const config: EnhancedAuthConfig = {};

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal authentication error');
      expect(result.statusCode).toBe(500);
    });

    it('should handle school context service errors gracefully', async () => {
      // Arrange
      const mockTokenPayload = {
        userId: 'user-123',
        role: UserRole.TEACHER,
        authorizedSchools: ['school-1'],
        activeSchoolId: 'school-1',
        permissions: ['student:read'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: mockTokenPayload
      });

      mockSchoolContextService.validateSchoolById.mockRejectedValue(new Error('School service error'));

      const config: EnhancedAuthConfig = {
        requireSchoolContext: true
      };

      // Act
      const result = await enhancedAuthenticate(mockRequest, config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal authentication error');
      expect(result.statusCode).toBe(500);
    });
  });
});

/**
 * Property-based tests for authentication middleware
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
 */
describe('Enhanced Authentication Middleware Properties', () => {
  // Property 1: JWT validation consistency
  it('should consistently validate JWT tokens across all requests', async () => {
    // This would be implemented with fast-check for property-based testing
    // For now, we'll use a simplified version
    
    const validTokens = [
      'Bearer valid-token-1',
      'Bearer valid-token-2',
      'Bearer valid-token-3'
    ];

    for (const token of validTokens) {
      const request = new NextRequest('https://example.com/api/test', {
        headers: { authorization: token }
      });

      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: {
          userId: 'user-123',
          role: UserRole.STUDENT,
          authorizedSchools: ['school-1'],
          permissions: [],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        }
      });

      const result = await enhancedAuthenticate(request, {});
      expect(result.success).toBe(true);
    }
  });

  // Property 2: Role-based access control consistency
  it('should consistently enforce role-based access control', async () => {
    const roles = [UserRole.STUDENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN];
    
    for (const role of roles) {
      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: {
          userId: 'user-123',
          role,
          authorizedSchools: ['school-1'],
          permissions: [],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        }
      });

      const result = await enhancedAuthenticate(mockRequest, { requiredRole: role });
      expect(result.success).toBe(true);
      expect(result.user?.role).toBe(role);
    }
  });

  // Property 3: Tenant isolation enforcement
  it('should consistently enforce tenant isolation', async () => {
    const schools = ['school-1', 'school-2', 'school-3'];
    
    for (const schoolId of schools) {
      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: {
          userId: 'user-123',
          role: UserRole.TEACHER,
          authorizedSchools: [schoolId],
          activeSchoolId: schoolId,
          permissions: [],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        }
      });

      // Should allow access to authorized school
      const allowedResult = await enhancedAuthenticate(mockRequest, { 
        allowedSchools: [schoolId] 
      });
      expect(allowedResult.success).toBe(true);

      // Should deny access to unauthorized school
      const deniedResult = await enhancedAuthenticate(mockRequest, { 
        allowedSchools: ['other-school'] 
      });
      expect(deniedResult.success).toBe(false);
    }
  });
});