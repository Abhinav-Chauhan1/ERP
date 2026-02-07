import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { 
  enhancedAuthenticate, 
  EnhancedAuthConfig, 
  AuthenticatedUser,
  AuthenticationContext 
} from './enhanced-auth';
import { rateLimit } from './rate-limit';
import { handleApiError } from '@/lib/utils/api-response';
import { getRequestMetadata } from '@/lib/utils/request-helpers';

/**
 * Enhanced Middleware Composition System
 * Integrates JWT validation, school context validation, role-based protection,
 * tenant isolation, rate limiting, and comprehensive audit logging.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */

export interface EnhancedMiddlewareConfig {
  auth?: EnhancedAuthConfig;
  rateLimit?: {
    windowMs: number;
    max: number;
    keyGenerator?: (request: NextRequest) => string;
  };
  cors?: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
  };
  validation?: {
    body?: any; // JSON schema for body validation
    query?: any; // JSON schema for query validation
    params?: any; // JSON schema for params validation
  };
}

export interface EnhancedMiddlewareContext {
  request: NextRequest;
  user?: AuthenticatedUser;
  schoolContext?: {
    id: string;
    name: string;
    schoolCode: string;
  };
  metadata: {
    ipAddress: string;
    userAgent: string;
    method: string;
    url: string;
    timestamp: Date;
  };
}

export type EnhancedRouteHandler = (
  context: EnhancedMiddlewareContext
) => Promise<NextResponse>;

/**
 * Compose enhanced middleware with route handler
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
export function composeEnhancedMiddleware(
  config: EnhancedMiddlewareConfig,
  handler: EnhancedRouteHandler
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Initialize context
      const context: EnhancedMiddlewareContext = {
        request,
        metadata: getRequestMetadata(request),
      };

      // Apply CORS if configured
      if (config.cors) {
        const corsResponse = handleCORS(request, config.cors);
        if (corsResponse) return corsResponse;
      }

      // Apply rate limiting if configured
      if (config.rateLimit) {
        const rateLimitResult = await rateLimit(request, config.rateLimit);
        if (rateLimitResult) return rateLimitResult;
      }

      // Apply enhanced authentication if configured
      if (config.auth) {
        const authResult = await enhancedAuthenticate(request, config.auth);
        
        if (!authResult.success) {
          return NextResponse.json(
            { 
              error: authResult.error,
              code: authResult.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
            },
            { status: authResult.statusCode || 500 }
          );
        }

        // Add auth info to context
        context.user = authResult.context.user;
        context.schoolContext = authResult.context.schoolContext;
      }

      // Apply request validation if configured
      if (config.validation) {
        const validationResult = await validateRequest(request, config.validation);
        if (validationResult) return validationResult;
      }

      // Execute the route handler
      const response = await handler(context);

      // Add security headers
      addSecurityHeaders(response);

      return response;

    } catch (error) {
      console.error('Enhanced middleware error:', error);
      return handleApiError(error);
    }
  };
}

/**
 * Convenience function for super admin routes with enhanced security
 * Requirements: 12.4, 12.5
 */
export function createSuperAdminRoute(
  handler: EnhancedRouteHandler,
  options?: {
    rateLimit?: EnhancedMiddlewareConfig['rateLimit'];
    additionalPermissions?: string[];
  }
) {
  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRole: UserRole.SUPER_ADMIN,
        requiredPermissions: options?.additionalPermissions,
        auditAction: 'SUPER_ADMIN_API_ACCESS'
      },
      rateLimit: options?.rateLimit || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
      },
    },
    handler
  );
}

/**
 * Convenience function for school admin routes with tenant isolation
 * Requirements: 12.2, 12.3, 8.1, 8.2, 8.3
 */
export function createSchoolAdminRoute(
  handler: EnhancedRouteHandler,
  options?: {
    rateLimit?: EnhancedMiddlewareConfig['rateLimit'];
    additionalPermissions?: string[];
    allowedSchools?: string[];
  }
) {
  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRole: UserRole.ADMIN, // Use ADMIN instead of SCHOOL_ADMIN
        requireSchoolContext: true,
        requiredPermissions: options?.additionalPermissions,
        allowedSchools: options?.allowedSchools,
        auditAction: 'SCHOOL_ADMIN_API_ACCESS'
      },
      rateLimit: options?.rateLimit || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 200,
      },
    },
    handler
  );
}

/**
 * Convenience function for teacher routes with school context
 * Requirements: 12.2, 12.3, 8.1, 8.2
 */
export function createTeacherRoute(
  handler: EnhancedRouteHandler,
  options?: {
    rateLimit?: EnhancedMiddlewareConfig['rateLimit'];
    additionalPermissions?: string[];
  }
) {
  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRole: [UserRole.TEACHER, UserRole.ADMIN], // Use ADMIN instead of SCHOOL_ADMIN
        requireSchoolContext: true,
        requiredPermissions: options?.additionalPermissions,
        auditAction: 'TEACHER_API_ACCESS'
      },
      rateLimit: options?.rateLimit || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 300,
      },
    },
    handler
  );
}

/**
 * Convenience function for student routes with school context
 * Requirements: 12.2, 12.3, 8.1, 8.2
 */
export function createStudentRoute(
  handler: EnhancedRouteHandler,
  options?: {
    rateLimit?: EnhancedMiddlewareConfig['rateLimit'];
    additionalPermissions?: string[];
  }
) {
  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRole: UserRole.STUDENT,
        requireSchoolContext: true,
        requiredPermissions: options?.additionalPermissions,
        auditAction: 'STUDENT_API_ACCESS'
      },
      rateLimit: options?.rateLimit || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500,
      },
    },
    handler
  );
}

/**
 * Convenience function for parent routes with school context
 * Requirements: 12.2, 12.3, 8.1, 8.2
 */
export function createParentRoute(
  handler: EnhancedRouteHandler,
  options?: {
    rateLimit?: EnhancedMiddlewareConfig['rateLimit'];
    additionalPermissions?: string[];
  }
) {
  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRole: UserRole.PARENT,
        requireSchoolContext: true,
        requiredPermissions: options?.additionalPermissions,
        auditAction: 'PARENT_API_ACCESS'
      },
      rateLimit: options?.rateLimit || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 400,
      },
    },
    handler
  );
}

/**
 * Convenience function for multi-role routes (e.g., teacher or admin)
 * Requirements: 12.2, 12.3
 */
export function createMultiRoleRoute(
  allowedRoles: UserRole[],
  handler: EnhancedRouteHandler,
  options?: {
    rateLimit?: EnhancedMiddlewareConfig['rateLimit'];
    additionalPermissions?: string[];
    requireSchoolContext?: boolean;
  }
) {
  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRole: allowedRoles,
        requireSchoolContext: options?.requireSchoolContext ?? true,
        requiredPermissions: options?.additionalPermissions,
        auditAction: 'MULTI_ROLE_API_ACCESS'
      },
      rateLimit: options?.rateLimit || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 250,
      },
    },
    handler
  );
}

/**
 * Convenience function for tenant-isolated routes
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export function createTenantIsolatedRoute(
  allowedSchools: string[],
  handler: EnhancedRouteHandler,
  options?: {
    rateLimit?: EnhancedMiddlewareConfig['rateLimit'];
    requiredRole?: UserRole | UserRole[];
    additionalPermissions?: string[];
  }
) {
  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRole: options?.requiredRole,
        requireSchoolContext: true,
        allowedSchools,
        requiredPermissions: options?.additionalPermissions,
        auditAction: 'TENANT_ISOLATED_API_ACCESS'
      },
      rateLimit: options?.rateLimit || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 200,
      },
    },
    handler
  );
}

/**
 * Convenience function for public routes with optional authentication
 * Requirements: 12.1
 */
export function createPublicRoute(
  handler: EnhancedRouteHandler,
  options?: {
    rateLimit?: EnhancedMiddlewareConfig['rateLimit'];
    optionalAuth?: boolean;
  }
) {
  return composeEnhancedMiddleware(
    {
      auth: options?.optionalAuth ? {
        allowAnonymous: true,
        auditAction: 'PUBLIC_API_ACCESS'
      } : undefined,
      rateLimit: options?.rateLimit || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000,
      },
    },
    handler
  );
}

// Helper functions

/**
 * Handle CORS preflight and headers
 */
function handleCORS(
  request: NextRequest,
  corsConfig: NonNullable<EnhancedMiddlewareConfig['cors']>
): NextResponse | null {
  const origin = request.headers.get('origin');
  const method = request.method;

  // Handle preflight requests
  if (method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    if (corsConfig.origin) {
      if (Array.isArray(corsConfig.origin)) {
        if (origin && corsConfig.origin.includes(origin)) {
          response.headers.set('Access-Control-Allow-Origin', origin);
        }
      } else if (corsConfig.origin === '*' || corsConfig.origin === origin) {
        response.headers.set('Access-Control-Allow-Origin', corsConfig.origin);
      }
    }

    if (corsConfig.methods) {
      response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
    }

    if (corsConfig.allowedHeaders) {
      response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
    }

    response.headers.set('Access-Control-Max-Age', '86400');
    return response;
  }

  return null;
}

/**
 * Validate request body, query, and params
 */
async function validateRequest(
  request: NextRequest,
  validationConfig: NonNullable<EnhancedMiddlewareConfig['validation']>
): Promise<NextResponse | null> {
  try {
    const url = new URL(request.url);

    // Validate query parameters
    if (validationConfig.query) {
      const queryParams = Object.fromEntries(url.searchParams.entries());
      // Add JSON schema validation here if needed
    }

    // Validate request body
    if (validationConfig.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.json();
        // Add JSON schema validation here if needed
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    }

    return null;
  } catch (error) {
    return NextResponse.json(
      { error: 'Request validation failed' },
      { status: 400 }
    );
  }
}

/**
 * Add security headers to response
 * Requirements: 12.5
 */
function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Only add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

/**
 * Extract authentication context from middleware context
 */
export function getAuthContext(context: EnhancedMiddlewareContext): AuthenticationContext | null {
  if (!context.user) {
    return null;
  }

  return {
    user: context.user,
    session: null, // Add session property
    schoolContext: context.schoolContext,
    request: context.request,
    ipAddress: context.metadata.ipAddress,
    userAgent: context.metadata.userAgent
  };
}

/**
 * Validate user has permission in current context
 */
export function validatePermissionInContext(
  context: EnhancedMiddlewareContext,
  permission: string
): boolean {
  if (!context.user) {
    return false;
  }

  // Super admins have all permissions
  if (context.user.role === UserRole.SUPER_ADMIN || context.user.permissions?.includes('*')) {
    return true;
  }

  return context.user.permissions?.includes(permission) ?? false;
}

/**
 * Validate school access in current context
 */
export function validateSchoolAccessInContext(
  context: EnhancedMiddlewareContext,
  schoolId: string
): boolean {
  if (!context.user) {
    return false;
  }

  // Super admins have access to all schools
  if (context.user.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  return context.user.authorizedSchools?.includes(schoolId) ?? false;
}

export default composeEnhancedMiddleware;