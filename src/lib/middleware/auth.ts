import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { 
  enhancedAuthenticate, 
  EnhancedAuthConfig, 
  AuthenticatedUser 
} from './enhanced-auth';
import { authAuditLogger } from './auth-audit-logger';

/**
 * Updated Authentication Middleware
 * Integrates with the new enhanced authentication system while maintaining
 * backward compatibility with existing code.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */

export interface AuthConfig {
  requiredRole?: UserRole | UserRole[];
  requiredPermissions?: string[];
  allowAnonymous?: boolean;
  requireSchoolContext?: boolean;
  allowedSchools?: string[];
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}

/**
 * Enhanced authentication middleware for API routes
 * Now uses the new enhanced authentication system
 */
export async function authenticate(
  request: NextRequest,
  config: AuthConfig = {}
): Promise<AuthResult> {
  try {
    // Convert old config to new enhanced config
    const enhancedConfig: EnhancedAuthConfig = {
      requiredRole: config.requiredRole,
      requiredPermissions: config.requiredPermissions,
      allowAnonymous: config.allowAnonymous,
      requireSchoolContext: config.requireSchoolContext,
      allowedSchools: config.allowedSchools,
      auditAction: 'LEGACY_API_ACCESS'
    };

    // Use enhanced authentication
    const result = await enhancedAuthenticate(request, enhancedConfig);

    if (!result.success) {
      // Log failed authentication
      await authAuditLogger.logFailedAuth(
        'unknown',
        result.error || 'Authentication failed',
        request
      );
    } else if (result.user) {
      // Log successful authentication
      await authAuditLogger.logSuccessfulAuth(
        result.user.id,
        result.user.role,
        result.user.activeSchoolId,
        request
      );
    }

    return {
      success: result.success,
      user: result.user,
      error: result.error,
      statusCode: result.statusCode
    };

  } catch (error) {
    console.error('Authentication error:', error);
    
    await authAuditLogger.logAuthEvent({
      action: 'AUTHENTICATION_ERROR' as any,
      result: 'ERROR',
      details: `Authentication system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      securityLevel: 'HIGH',
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'Unknown',
      timestamp: new Date(),
      metadata: {
        path: new URL(request.url).pathname,
        method: request.method
      }
    });

    return {
      success: false,
      error: 'Internal authentication error',
      statusCode: 500
    };
  }
}

/**
 * Create authentication middleware with specific configuration
 * Now uses enhanced authentication system
 */
export function createAuthMiddleware(config: AuthConfig) {
  return async (request: NextRequest) => {
    const result = await authenticate(request, config);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return null; // Continue to route handler
  };
}

/**
 * Super admin authentication middleware
 * Enhanced with comprehensive security checks
 */
export const requireSuperAdmin = createAuthMiddleware({
  requiredRole: UserRole.SUPER_ADMIN,
});

/**
 * School admin authentication middleware
 * Enhanced with school context validation
 */
export const requireSchoolAdmin = createAuthMiddleware({
  requiredRole: UserRole.ADMIN,
  requireSchoolContext: true,
});

/**
 * Teacher authentication middleware
 * Enhanced with school context validation
 */
export const requireTeacher = createAuthMiddleware({
  requiredRole: [UserRole.TEACHER, UserRole.ADMIN],
  requireSchoolContext: true,
});

/**
 * Student authentication middleware
 * Enhanced with school context validation
 */
export const requireStudent = createAuthMiddleware({
  requiredRole: UserRole.STUDENT,
  requireSchoolContext: true,
});

/**
 * Parent authentication middleware
 * Enhanced with school context validation
 */
export const requireParent = createAuthMiddleware({
  requiredRole: UserRole.PARENT,
  requireSchoolContext: true,
});

/**
 * Any authenticated user middleware
 * Enhanced with JWT validation
 */
export const requireAuth = createAuthMiddleware({});

/**
 * Multi-role authentication middleware
 */
export function requireRoles(roles: UserRole[]) {
  return createAuthMiddleware({
    requiredRole: roles,
    requireSchoolContext: !roles.includes(UserRole.SUPER_ADMIN),
  });
}

/**
 * Tenant-isolated authentication middleware
 */
export function requireTenantAccess(allowedSchools: string[]) {
  return createAuthMiddleware({
    requireSchoolContext: true,
    allowedSchools,
  });
}

/**
 * Extract user information from request
 * Enhanced to work with new authentication system
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const result = await authenticate(request, { allowAnonymous: true });
    return result.user || null;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

/**
 * Check if user has specific permission
 * Enhanced with role-based permission checking
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
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: AuthenticatedUser, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: AuthenticatedUser, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Get user's effective permissions (including role-based permissions)
 * Enhanced with comprehensive role-based permissions
 */
export function getEffectivePermissions(user: AuthenticatedUser): string[] {
  if (!user) {
    return [];
  }

  const permissions = new Set(user.permissions || []);

  // Add role-based permissions
  switch (user.role) {
    case UserRole.SUPER_ADMIN:
      // Super admins have all permissions
      permissions.add('*');
      break;
    case UserRole.ADMIN:
      permissions.add('school:read');
      permissions.add('school:write');
      permissions.add('user:read');
      permissions.add('user:write');
      permissions.add('student:read');
      permissions.add('student:write');
      permissions.add('teacher:read');
      permissions.add('teacher:write');
      permissions.add('parent:read');
      permissions.add('parent:write');
      permissions.add('class:read');
      permissions.add('class:write');
      permissions.add('subject:read');
      permissions.add('subject:write');
      permissions.add('exam:read');
      permissions.add('exam:write');
      permissions.add('fee:read');
      permissions.add('fee:write');
      break;
    case UserRole.TEACHER:
      permissions.add('student:read');
      permissions.add('class:read');
      permissions.add('subject:read');
      permissions.add('exam:read');
      permissions.add('exam:write');
      permissions.add('assignment:read');
      permissions.add('assignment:write');
      permissions.add('attendance:read');
      permissions.add('attendance:write');
      break;
    case UserRole.STUDENT:
      permissions.add('profile:read');
      permissions.add('assignment:read');
      permissions.add('exam:read');
      permissions.add('attendance:read');
      permissions.add('fee:read');
      permissions.add('result:read');
      break;
    case UserRole.PARENT:
      permissions.add('child:read');
      permissions.add('child:attendance:read');
      permissions.add('child:exam:read');
      permissions.add('child:fee:read');
      permissions.add('child:result:read');
      permissions.add('child:assignment:read');
      break;
  }

  return Array.from(permissions);
}

// Helper functions

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
 * Validate API key for webhook endpoints
 * Enhanced with audit logging
 */
export async function validateApiKey(
  request: NextRequest,
  expectedKey: string
): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key') || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey || apiKey !== expectedKey) {
    await authAuditLogger.logAccessDenied(
      null,
      'Invalid API key',
      'webhook_endpoint',
      request
    );
    return false;
  }

  return true;
}

/**
 * Validate webhook signature
 * Enhanced with security logging
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload, 'utf8')
      .digest('hex');

    const providedSignature = signature.replace(`${algorithm}=`, '');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

/**
 * Validate school access for current user
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export async function validateSchoolAccess(
  user: AuthenticatedUser,
  schoolId: string,
  request?: NextRequest
): Promise<boolean> {
  // Super admins have access to all schools
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Check if user is authorized for this school
  const hasAccess = user.authorizedSchools.includes(schoolId);
  
  if (!hasAccess && request) {
    await authAuditLogger.logAccessDenied(
      user.id,
      'Unauthorized school access',
      `school:${schoolId}`,
      request
    );
  }

  return hasAccess;
}

/**
 * Validate tenant isolation for API requests
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export async function validateTenantIsolation(
  user: AuthenticatedUser,
  requestedSchoolId: string,
  request?: NextRequest
): Promise<boolean> {
  // Super admins bypass tenant isolation
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Validate user has access to requested school
  const hasAccess = await validateSchoolAccess(user, requestedSchoolId, request);
  
  if (!hasAccess) {
    await authAuditLogger.logSuspiciousActivity(
      `Tenant isolation violation: User ${user.id} attempted to access school ${requestedSchoolId}`,
      user.id,
      requestedSchoolId,
      request,
      85 // High risk score
    );
  }

  return hasAccess;
}

/**
 * Create context-aware authentication middleware
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
export function createContextAwareAuth(
  config: AuthConfig & {
    contextValidator?: (user: AuthenticatedUser, request: NextRequest) => Promise<boolean>;
    onAccessDenied?: (user: AuthenticatedUser | null, request: NextRequest) => Promise<void>;
  }
) {
  return async (request: NextRequest) => {
    const result = await authenticate(request, config);
    
    if (!result.success) {
      if (config.onAccessDenied) {
        await config.onAccessDenied(null, request);
      }
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    // Run additional context validation if provided
    if (config.contextValidator && result.user) {
      const contextValid = await config.contextValidator(result.user, request);
      if (!contextValid) {
        if (config.onAccessDenied) {
          await config.onAccessDenied(result.user, request);
        }
        return NextResponse.json(
          { error: 'Context validation failed' },
          { status: 403 }
        );
      }
    }

    return null; // Continue to route handler
  };
}

export default authenticate;