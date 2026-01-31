import { NextRequest, NextResponse } from 'next/server';
import { UserRole, AuditAction } from '@prisma/client';
import { jwtService } from '@/lib/services/jwt-service';
import { schoolContextService } from '@/lib/services/school-context-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { authAnalyticsService } from '@/lib/services/auth-analytics-service';

/**
 * Enhanced Authentication Middleware
 * Implements JWT validation, school context validation, role-based route protection,
 * tenant data isolation checks, and comprehensive audit logging.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */

export interface EnhancedAuthConfig {
  requiredRole?: UserRole | UserRole[];
  requiredPermissions?: string[];
  requireSchoolContext?: boolean;
  allowedSchools?: string[]; // For tenant isolation
  allowAnonymous?: boolean;
  skipJWTValidation?: boolean; // For public routes
  auditAction?: string; // Custom audit action name
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: UserRole;
  mobile?: string;
  email?: string;
  authorizedSchools: string[];
  activeSchoolId?: string;
  activeStudentId?: string;
  permissions: string[];
}

export interface EnhancedAuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
  schoolContext?: {
    id: string;
    name: string;
    schoolCode: string;
  };
}

export interface AuthenticationContext {
  user: AuthenticatedUser;
  schoolContext?: {
    id: string;
    name: string;
    schoolCode: string;
  };
  request: NextRequest;
  ipAddress: string;
  userAgent: string;
}

// Custom errors for better error handling
export class AuthenticationMiddlewareError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationMiddlewareError';
  }
}

export class JWTValidationError extends AuthenticationMiddlewareError {
  constructor(message: string = 'Invalid or expired token') {
    super(message, 'JWT_INVALID', 401);
  }
}

export class SchoolContextError extends AuthenticationMiddlewareError {
  constructor(message: string = 'Invalid school context') {
    super(message, 'SCHOOL_CONTEXT_INVALID', 403);
  }
}

export class RolePermissionError extends AuthenticationMiddlewareError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'INSUFFICIENT_PERMISSIONS', 403);
  }
}

export class TenantIsolationError extends AuthenticationMiddlewareError {
  constructor(message: string = 'Unauthorized school access') {
    super(message, 'TENANT_ISOLATION_VIOLATION', 403);
  }
}

/**
 * Enhanced authentication middleware for API routes
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
export async function enhancedAuthenticate(
  request: NextRequest,
  config: EnhancedAuthConfig = {}
): Promise<EnhancedAuthResult> {
  const startTime = Date.now();
  const ipAddress = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const url = new URL(request.url);

  try {
    // Allow anonymous access if configured
    if (config.allowAnonymous) {
      await logAuthEvent(AuditAction.READ, null, null, 'ALLOWED', {
        path: url.pathname,
        method: request.method,
        ipAddress,
        userAgent
      });
      return { success: true };
    }

    // Skip JWT validation for public routes
    if (config.skipJWTValidation) {
      return { success: true };
    }

    // Extract and validate JWT token
    const token = extractToken(request);
    if (!token) {
      await logAuthEvent(AuditAction.LOGIN, null, null, 'NO_TOKEN', {
        path: url.pathname,
        method: request.method,
        ipAddress,
        userAgent
      });
      throw new JWTValidationError('No authentication token provided');
    }

    // Validate JWT token
    const tokenValidation = await jwtService.verifyToken(token);
    if (!tokenValidation.valid || !tokenValidation.payload) {
      await logAuthEvent(AuditAction.LOGIN, null, null, 'INVALID_TOKEN', {
        path: url.pathname,
        method: request.method,
        ipAddress,
        userAgent,
        tokenError: tokenValidation.error
      });
      throw new JWTValidationError(`Token validation failed: ${tokenValidation.error}`);
    }

    const tokenPayload = tokenValidation.payload;

    // Create authenticated user object
    const user: AuthenticatedUser = {
      id: tokenPayload.userId,
      name: '', // Will be populated from database if needed
      role: tokenPayload.role,
      authorizedSchools: tokenPayload.authorizedSchools,
      activeSchoolId: tokenPayload.activeSchoolId,
      activeStudentId: tokenPayload.activeStudentId,
      permissions: tokenPayload.permissions
    };

    // Validate role requirements
    if (config.requiredRole) {
      const requiredRoles = Array.isArray(config.requiredRole) 
        ? config.requiredRole 
        : [config.requiredRole];
      
      if (!requiredRoles.includes(user.role)) {
        await logAuthEvent(AuditAction.LOGIN, user.id, user.activeSchoolId || null, 'INSUFFICIENT_ROLE', {
          path: url.pathname,
          method: request.method,
          userRole: user.role,
          requiredRoles,
          ipAddress,
          userAgent
        });
        throw new RolePermissionError(`Required role: ${requiredRoles.join(' or ')}, got: ${user.role}`);
      }
    }

    // Validate permission requirements
    if (config.requiredPermissions && config.requiredPermissions.length > 0) {
      const hasAllPermissions = config.requiredPermissions.every(permission =>
        user.permissions.includes(permission) || user.permissions.includes('*')
      );

      if (!hasAllPermissions) {
        await logAuthEvent(AuditAction.LOGIN, user.id, user.activeSchoolId || null, 'INSUFFICIENT_PERMISSIONS', {
          path: url.pathname,
          method: request.method,
          userPermissions: user.permissions,
          requiredPermissions: config.requiredPermissions,
          ipAddress,
          userAgent
        });
        throw new RolePermissionError(`Missing permissions: ${config.requiredPermissions.join(', ')}`);
      }
    }

    // Validate school context if required
    let schoolContext;
    if (config.requireSchoolContext || user.activeSchoolId) {
      if (!user.activeSchoolId) {
        await logAuthEvent(AuditAction.LOGIN, user.id, null, 'NO_SCHOOL_CONTEXT', {
          path: url.pathname,
          method: request.method,
          ipAddress,
          userAgent
        });
        throw new SchoolContextError('School context required but not provided');
      }

      // Validate school context
      const school = await schoolContextService.validateSchoolById(user.activeSchoolId);
      if (!school) {
        await logAuthEvent(AuditAction.LOGIN, user.id, user.activeSchoolId || null, 'INVALID_SCHOOL_CONTEXT', {
          path: url.pathname,
          method: request.method,
          schoolId: user.activeSchoolId,
          ipAddress,
          userAgent
        });
        throw new SchoolContextError('Invalid or inactive school context');
      }

      schoolContext = {
        id: school.id,
        name: school.name,
        schoolCode: school.schoolCode
      };

      // Validate user has access to the school
      const hasSchoolAccess = await schoolContextService.validateSchoolAccess(user.id, user.activeSchoolId);
      if (!hasSchoolAccess) {
        await logAuthEvent(AuditAction.LOGIN, user.id, user.activeSchoolId || null, 'UNAUTHORIZED_SCHOOL_ACCESS', {
          path: url.pathname,
          method: request.method,
          schoolId: user.activeSchoolId,
          ipAddress,
          userAgent
        });
        throw new TenantIsolationError('User not authorized for this school');
      }
    }

    // Validate tenant isolation (allowed schools)
    if (config.allowedSchools && config.allowedSchools.length > 0) {
      const requestedSchoolId = extractSchoolIdFromRequest(request, url);
      
      if (requestedSchoolId && !config.allowedSchools.includes(requestedSchoolId)) {
        await logAuthEvent(AuditAction.LOGIN, user.id, requestedSchoolId, 'TENANT_ISOLATION_VIOLATION', {
          path: url.pathname,
          method: request.method,
          requestedSchoolId,
          allowedSchools: config.allowedSchools,
          ipAddress,
          userAgent
        });
        throw new TenantIsolationError('Access to requested school not allowed');
      }

      // Validate user has access to requested school
      if (requestedSchoolId && !user.authorizedSchools.includes(requestedSchoolId)) {
        await logAuthEvent(AuditAction.LOGIN, user.id, requestedSchoolId, 'UNAUTHORIZED_SCHOOL_REQUEST', {
          path: url.pathname,
          method: request.method,
          requestedSchoolId,
          authorizedSchools: user.authorizedSchools,
          ipAddress,
          userAgent
        });
        throw new TenantIsolationError('User not authorized for requested school');
      }
    }

    // Log successful authentication
    const duration = Date.now() - startTime;
    await logAuthEvent(AuditAction.LOGIN, user.id, user.activeSchoolId || null, config.auditAction || 'API_ACCESS', {
      path: url.pathname,
      method: request.method,
      role: user.role,
      schoolContext: schoolContext?.schoolCode,
      duration,
      ipAddress,
      userAgent
    });

    // Track authentication event for analytics
    await authAnalyticsService.trackAuthenticationEvent(
      'LOGIN',
      user.id,
      user.activeSchoolId || undefined,
      {
        path: url.pathname,
        method: request.method,
        role: user.role,
        authMethod: 'TOKEN',
        duration,
        ipAddress,
        userAgent,
        schoolCode: schoolContext?.schoolCode
      }
    );

    return {
      success: true,
      user,
      schoolContext
    };

  } catch (error) {
    console.error('Enhanced authentication error:', error);
    
    if (error instanceof AuthenticationMiddlewareError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode
      };
    }

    // Log system errors
    await logAuthEvent(AuditAction.LOGIN, null, null, 'SYSTEM_ERROR', {
      path: url.pathname,
      method: request.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      ipAddress,
      userAgent
    });

    return {
      success: false,
      error: 'Internal authentication error',
      statusCode: 500
    };
  }
}

/**
 * Create enhanced authentication middleware with specific configuration
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
export function createEnhancedAuthMiddleware(config: EnhancedAuthConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const result = await enhancedAuthenticate(request, config);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          code: result.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
        },
        { status: result.statusCode || 500 }
      );
    }

    // Add user context to request headers for downstream handlers
    if (result.user) {
      const headers = new Headers(request.headers);
      headers.set('x-user-id', result.user.id);
      headers.set('x-user-role', result.user.role);
      if (result.user.activeSchoolId) {
        headers.set('x-school-id', result.user.activeSchoolId);
      }
      if (result.schoolContext) {
        headers.set('x-school-code', result.schoolContext.schoolCode);
      }
    }

    return null; // Continue to route handler
  };
}

/**
 * Middleware for super admin routes
 * Requirements: 12.4
 */
export const requireSuperAdminEnhanced = createEnhancedAuthMiddleware({
  requiredRole: UserRole.SUPER_ADMIN,
  auditAction: 'SUPER_ADMIN_ACCESS'
});

/**
 * Middleware for school admin routes
 * Requirements: 12.2, 12.3
 */
export const requireSchoolAdminEnhanced = createEnhancedAuthMiddleware({
  requiredRole: UserRole.ADMIN,
  requireSchoolContext: true,
  auditAction: 'SCHOOL_ADMIN_ACCESS'
});

/**
 * Middleware for teacher routes
 * Requirements: 12.2, 12.3
 */
export const requireTeacherEnhanced = createEnhancedAuthMiddleware({
  requiredRole: [UserRole.TEACHER, UserRole.ADMIN],
  requireSchoolContext: true,
  auditAction: 'TEACHER_ACCESS'
});

/**
 * Middleware for student routes
 * Requirements: 12.2, 12.3
 */
export const requireStudentEnhanced = createEnhancedAuthMiddleware({
  requiredRole: UserRole.STUDENT,
  requireSchoolContext: true,
  auditAction: 'STUDENT_ACCESS'
});

/**
 * Middleware for parent routes
 * Requirements: 12.2, 12.3
 */
export const requireParentEnhanced = createEnhancedAuthMiddleware({
  requiredRole: UserRole.PARENT,
  requireSchoolContext: true,
  auditAction: 'PARENT_ACCESS'
});

/**
 * Middleware for any authenticated user
 * Requirements: 12.1
 */
export const requireAuthEnhanced = createEnhancedAuthMiddleware({
  auditAction: 'AUTHENTICATED_ACCESS'
});

/**
 * Middleware with tenant isolation for specific schools
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export function createTenantIsolatedMiddleware(allowedSchools: string[]) {
  return createEnhancedAuthMiddleware({
    requireSchoolContext: true,
    allowedSchools,
    auditAction: 'TENANT_ISOLATED_ACCESS'
  });
}

// Helper functions

/**
 * Extract JWT token from request headers
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Also check for token in cookies (for browser requests)
  const tokenCookie = request.cookies.get('auth-token');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

/**
 * Extract school ID from request (URL params, query, or body)
 */
function extractSchoolIdFromRequest(request: NextRequest, url: URL): string | null {
  // Check URL path parameters
  const pathSegments = url.pathname.split('/');
  const schoolIndex = pathSegments.findIndex(segment => segment === 'schools');
  if (schoolIndex !== -1 && pathSegments[schoolIndex + 1]) {
    return pathSegments[schoolIndex + 1];
  }

  // Check query parameters
  const schoolId = url.searchParams.get('schoolId') || url.searchParams.get('school_id');
  if (schoolId) {
    return schoolId;
  }

  // Check headers
  const schoolHeader = request.headers.get('x-school-id');
  if (schoolHeader) {
    return schoolHeader;
  }

  return null;
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}

/**
 * Log authentication events for audit
 * Requirements: 12.5, 8.5
 */
async function logAuthEvent(
  action: AuditAction,
  userId: string | null,
  schoolId: string | null,
  details: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await logAuditEvent({
      userId,
      schoolId: schoolId || undefined,
      action,
      resource: 'authentication_middleware',
      changes: {
        details,
        metadata,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
    // Don't throw error to avoid breaking authentication flow
  }
}

/**
 * Get user context from request (for use in route handlers)
 */
export function getUserFromRequest(request: NextRequest): AuthenticatedUser | null {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role') as UserRole;
  const schoolId = request.headers.get('x-school-id');

  if (!userId || !userRole) {
    return null;
  }

  return {
    id: userId,
    name: '', // Not available in headers
    role: userRole,
    authorizedSchools: [], // Not available in headers
    activeSchoolId: schoolId || undefined,
    permissions: [] // Not available in headers
  };
}

/**
 * Validate specific permission for authenticated user
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  if (!user || !user.permissions) {
    return false;
  }

  // Super admins have all permissions
  if (user.role === UserRole.SUPER_ADMIN || user.permissions.includes('*')) {
    return true;
  }

  return user.permissions.includes(permission);
}

/**
 * Validate user has any of the specified permissions
 */
export function hasAnyPermission(user: AuthenticatedUser, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Validate user has all of the specified permissions
 */
export function hasAllPermissions(user: AuthenticatedUser, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

export default enhancedAuthenticate;