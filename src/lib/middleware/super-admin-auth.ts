import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@prisma/client';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  schoolId?: string | null;
  schoolName?: string | null;
  schoolCode?: string | null;
  isSuperAdmin?: boolean;
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
}

export interface AuthResult {
  success: true;
  session: AuthSession;
  user: AuthUser;
}

export interface AuthError {
  success: false;
  error: string;
  statusCode: number;
  details?: Record<string, any>;
}

export type AuthResponse = AuthResult | AuthError;

export interface AuthConfig {
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  allowAnonymous?: boolean;
  requireMFA?: boolean;
  logAccess?: boolean;
  customValidator?: (user: AuthUser, request: NextRequest) => Promise<boolean>;
}

// ============================================================================
// Error Types
// ============================================================================

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// ============================================================================
// Core Authentication Service
// ============================================================================

class AuthenticationService {
  /**
   * Get authenticated session with comprehensive error handling
   */
  async getAuthenticatedSession(request: NextRequest): Promise<AuthSession | null> {
    try {
      const session = await auth();
      
      if (!session?.user) {
        return null;
      }

      // Type-safe user object
      const user: AuthUser = {
        id: session.user.id as string,
        email: session.user.email as string,
        name: session.user.name,
        role: session.user.role as UserRole,
        schoolId: session.user.schoolId as string | null,
        schoolName: session.user.schoolName as string | null,
        schoolCode: session.user.schoolCode as string | null,
        isSuperAdmin: session.user.role === 'SUPER_ADMIN',
      };

      return {
        user,
        expires: session.expires,
      };
    } catch (error) {
      console.error('Error getting authenticated session:', error);
      return null;
    }
  }

  /**
   * Validate user against authentication configuration
   */
  async validateAuth(
    session: AuthSession,
    request: NextRequest,
    config: AuthConfig
  ): Promise<void> {
    const { user } = session;

    // Check required role
    if (config.requiredRole && user.role !== config.requiredRole) {
      throw new AuthorizationError(
        `Access denied. Required role: ${config.requiredRole}`,
        403,
        'INSUFFICIENT_ROLE',
        { userRole: user.role, requiredRole: config.requiredRole }
      );
    }

    // Check required roles (any of)
    if (config.requiredRoles && !config.requiredRoles.includes(user.role)) {
      throw new AuthorizationError(
        `Access denied. Required roles: ${config.requiredRoles.join(', ')}`,
        403,
        'INSUFFICIENT_ROLES',
        { userRole: user.role, requiredRoles: config.requiredRoles }
      );
    }

    // Custom validation
    if (config.customValidator) {
      const isValid = await config.customValidator(user, request);
      if (!isValid) {
        throw new AuthorizationError(
          'Access denied by custom validator',
          403,
          'CUSTOM_VALIDATION_FAILED'
        );
      }
    }

    // Log access if configured
    if (config.logAccess) {
      await this.logAccess(user, request);
    }
  }

  /**
   * Log access attempt for audit purposes
   */
  private async logAccess(user: AuthUser, request: NextRequest): Promise<void> {
    try {
      const url = new URL(request.url);
      
      await logAuditEvent({
        userId: user.id,
        action: AuditAction.READ,
        resource: 'API_ACCESS',
        changes: {
          path: url.pathname,
          method: request.method,
          userAgent: request.headers.get('user-agent'),
          role: user.role,
          schoolId: user.schoolId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error logging access:', error);
      // Don't throw - logging failures shouldn't break authentication
    }
  }

  /**
   * Log authentication failure for security monitoring
   */
  async logAuthFailure(
    request: NextRequest,
    reason: string,
    userId?: string
  ): Promise<void> {
    try {
      const url = new URL(request.url);
      
      await logAuditEvent({
        userId: userId || 'anonymous',
        action: AuditAction.READ,
        resource: 'AUTH_FAILURE',
        changes: {
          reason,
          path: url.pathname,
          method: request.method,
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error logging auth failure:', error);
    }
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(error: AuthenticationError | AuthorizationError): NextResponse {
    const response = {
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && error.details && { details: error.details }),
    };

    return NextResponse.json(response, { status: error.statusCode });
  }
}

// ============================================================================
// Authentication Middleware Factory
// ============================================================================

class AuthMiddlewareFactory {
  private authService = new AuthenticationService();

  /**
   * Create authentication middleware with specific configuration
   */
  create(config: AuthConfig = {}) {
    return async (request: NextRequest): Promise<AuthResponse> => {
      try {
        // Allow anonymous access if configured
        if (config.allowAnonymous) {
          return { success: true, session: null as any, user: null as any };
        }

        // Get authenticated session
        const session = await this.authService.getAuthenticatedSession(request);

        if (!session) {
          await this.authService.logAuthFailure(request, 'No valid session');
          throw new AuthenticationError(
            'Authentication required',
            401,
            'NO_SESSION'
          );
        }

        // Validate authentication requirements
        await this.authService.validateAuth(session, request, config);

        return {
          success: true,
          session,
          user: session.user,
        };
      } catch (error) {
        if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
          return {
            success: false,
            error: error.message,
            statusCode: error.statusCode,
            details: error.details,
          };
        }

        console.error('Unexpected authentication error:', error);
        return {
          success: false,
          error: 'Internal authentication error',
          statusCode: 500,
        };
      }
    };
  }

  /**
   * Create middleware that returns NextResponse for direct use in API routes
   */
  createResponseMiddleware(config: AuthConfig = {}) {
    const authMiddleware = this.create(config);

    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await authMiddleware(request);

      if (!result.success) {
        const error = new (result.statusCode >= 500 ? AuthenticationError : AuthorizationError)(
          result.error,
          result.statusCode,
          undefined,
          result.details
        );
        return this.authService.createErrorResponse(error);
      }

      return null; // Continue to route handler
    };
  }
}

// ============================================================================
// Exported Middleware Functions
// ============================================================================

const factory = new AuthMiddlewareFactory();

/**
 * Require super admin authentication with comprehensive logging
 */
export const requireSuperAdmin = factory.create({
  requiredRole: UserRole.SUPER_ADMIN,
  logAccess: true,
});

/**
 * Require super admin authentication - Response middleware version
 */
export const requireSuperAdminResponse = factory.createResponseMiddleware({
  requiredRole: UserRole.SUPER_ADMIN,
  logAccess: true,
});

/**
 * Require any authenticated user
 */
export const requireAuth = factory.create({
  logAccess: false,
});

/**
 * Require any authenticated user - Response middleware version
 */
export const requireAuthResponse = factory.createResponseMiddleware({
  logAccess: false,
});

/**
 * Require specific roles (any of the provided roles)
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return factory.create({
    requiredRoles: allowedRoles,
    logAccess: true,
  });
}

/**
 * Require specific roles - Response middleware version
 */
export function requireRolesResponse(allowedRoles: UserRole[]) {
  return factory.createResponseMiddleware({
    requiredRoles: allowedRoles,
    logAccess: true,
  });
}

/**
 * Create custom authentication middleware
 */
export function createAuthMiddleware(config: AuthConfig) {
  return factory.create(config);
}

/**
 * Create custom authentication middleware - Response version
 */
export function createAuthMiddlewareResponse(config: AuthConfig) {
  return factory.createResponseMiddleware(config);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if user has specific role
 */
export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: AuthUser | null, roles: UserRole[]): boolean {
  return user ? roles.includes(user.role) : false;
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AuthUser | null): boolean {
  return hasRole(user, UserRole.SUPER_ADMIN);
}

/**
 * Extract user from request (for use in API routes)
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const session = await auth();
    if (!session?.user) return null;

    return {
      id: session.user.id as string,
      email: session.user.email as string,
      name: session.user.name,
      role: session.user.role as UserRole,
      schoolId: session.user.schoolId as string | null,
      schoolName: session.user.schoolName as string | null,
      schoolCode: session.user.schoolCode as string | null,
      isSuperAdmin: session.user.role === 'SUPER_ADMIN',
    };
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

// ============================================================================
// Legacy Support (Backward Compatibility)
// ============================================================================

/**
 * @deprecated Use requireSuperAdmin instead
 */
export async function requireSuperAdminLegacy(request: NextRequest): Promise<AuthResult | NextResponse> {
  const result = await requireSuperAdmin(request);
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.statusCode }
    );
  }

  return {
    session: result.session,
    user: result.user,
  };
}