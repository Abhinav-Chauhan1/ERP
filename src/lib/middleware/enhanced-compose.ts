import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import {
  enhancedAuthenticate,
  EnhancedAuthConfig,
  AuthenticatedUser,
  AuthenticationContext,
} from './enhanced-auth';
import { rateLimit } from './rate-limit';
import { handleApiError } from '@/lib/utils/api-response';
import { getRequestMetadata } from '@/lib/utils/request-helpers';

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
    body?: unknown;
    query?: unknown;
    params?: unknown;
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

export function composeEnhancedMiddleware(
  config: EnhancedMiddlewareConfig,
  handler: EnhancedRouteHandler
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const context: EnhancedMiddlewareContext = {
        request,
        metadata: getRequestMetadata(request),
      };

      if (config.cors) {
        const corsResponse = handleCORS(request, config.cors);
        if (corsResponse) return corsResponse;
      }

      if (config.rateLimit) {
        const rateLimitResult = await rateLimit(request, config.rateLimit);
        if (rateLimitResult) return rateLimitResult;
      }

      if (config.auth) {
        const authResult = await enhancedAuthenticate(request, config.auth);

        if (!authResult.success) {
          return NextResponse.json(
            {
              error: authResult.error,
              code: authResult.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
            },
            { status: authResult.statusCode || 500 }
          );
        }

        context.user = authResult.context.user;
        if (authResult.context.user.schoolId && authResult.context.user.schoolCode) {
          context.schoolContext = {
            id: authResult.context.user.schoolId,
            name: '',
            schoolCode: authResult.context.user.schoolCode,
          };
        }
      }

      if (config.validation) {
        const validationResult = await validateRequest(request, config.validation);
        if (validationResult) return validationResult;
      }

      const response = await handler(context);
      addSecurityHeaders(response);
      return response;
    } catch (error) {
      console.error('Enhanced middleware error:', error);
      return handleApiError(error);
    }
  };
}

export function createSuperAdminRoute(
  handler: EnhancedRouteHandler,
  options?: { rateLimit?: EnhancedMiddlewareConfig['rateLimit'] }
) {
  return composeEnhancedMiddleware(
    {
      auth: { requiredRoles: [UserRole.SUPER_ADMIN] },
      rateLimit: options?.rateLimit || { windowMs: 15 * 60 * 1000, max: 100 },
    },
    handler
  );
}

export function createSchoolAdminRoute(
  handler: EnhancedRouteHandler,
  options?: {
    rateLimit?: EnhancedMiddlewareConfig['rateLimit'];
    allowedSchoolIds?: string[];
  }
) {
  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRoles: [UserRole.ADMIN],
        requireSchoolContext: true,
        allowedSchoolIds: options?.allowedSchoolIds,
      },
      rateLimit: options?.rateLimit || { windowMs: 15 * 60 * 1000, max: 200 },
    },
    handler
  );
}

export function createTeacherRoute(
  handler: EnhancedRouteHandler,
  options?: { rateLimit?: EnhancedMiddlewareConfig['rateLimit'] }
) {
  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRoles: [UserRole.TEACHER, UserRole.ADMIN],
        requireSchoolContext: true,
      },
      rateLimit: options?.rateLimit || { windowMs: 15 * 60 * 1000, max: 300 },
    },
    handler
  );
}

export function createStudentRoute(
  handler: EnhancedRouteHandler,
  options?: { rateLimit?: EnhancedMiddlewareConfig['rateLimit'] }
) {
  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRoles: [UserRole.STUDENT],
        requireSchoolContext: true,
      },
      rateLimit: options?.rateLimit || { windowMs: 15 * 60 * 1000, max: 500 },
    },
    handler
  );
}

export function createParentRoute(
  handler: EnhancedRouteHandler,
  options?: { rateLimit?: EnhancedMiddlewareConfig['rateLimit'] }
) {
  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRoles: [UserRole.PARENT],
        requireSchoolContext: true,
      },
      rateLimit: options?.rateLimit || { windowMs: 15 * 60 * 1000, max: 400 },
    },
    handler
  );
}

export function createMultiRoleRoute(
  allowedRoles: UserRole[],
  handler: EnhancedRouteHandler,
  options?: {
    rateLimit?: EnhancedMiddlewareConfig['rateLimit'];
    requireSchoolContext?: boolean;
  }
) {
  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRoles: allowedRoles,
        requireSchoolContext: options?.requireSchoolContext ?? true,
      },
      rateLimit: options?.rateLimit || { windowMs: 15 * 60 * 1000, max: 250 },
    },
    handler
  );
}

export function createTenantIsolatedRoute(
  allowedSchools: string[],
  handler: EnhancedRouteHandler,
  options?: {
    rateLimit?: EnhancedMiddlewareConfig['rateLimit'];
    requiredRole?: UserRole | UserRole[];
  }
) {
  const roles = options?.requiredRole
    ? Array.isArray(options.requiredRole)
      ? options.requiredRole
      : [options.requiredRole]
    : undefined;

  return composeEnhancedMiddleware(
    {
      auth: {
        requiredRoles: roles,
        requireSchoolContext: true,
        allowedSchoolIds: allowedSchools,
      },
      rateLimit: options?.rateLimit || { windowMs: 15 * 60 * 1000, max: 200 },
    },
    handler
  );
}

export function createPublicRoute(
  handler: EnhancedRouteHandler,
  options?: { rateLimit?: EnhancedMiddlewareConfig['rateLimit'] }
) {
  return composeEnhancedMiddleware(
    {
      rateLimit: options?.rateLimit || { windowMs: 15 * 60 * 1000, max: 1000 },
    },
    handler
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function handleCORS(
  request: NextRequest,
  corsConfig: NonNullable<EnhancedMiddlewareConfig['cors']>
): NextResponse | null {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
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

async function validateRequest(
  request: NextRequest,
  validationConfig: NonNullable<EnhancedMiddlewareConfig['validation']>
): Promise<NextResponse | null> {
  try {
    if (validationConfig.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        await request.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }
    }
    return null;
  } catch {
    return NextResponse.json({ error: 'Request validation failed' }, { status: 400 });
  }
}

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

export function getAuthContext(context: EnhancedMiddlewareContext): AuthenticationContext | null {
  if (!context.user) return null;
  return {
    user: context.user,
    ipAddress: context.metadata.ipAddress,
    userAgent: context.metadata.userAgent,
  };
}

export function validatePermissionInContext(
  context: EnhancedMiddlewareContext,
  _permission: string
): boolean {
  if (!context.user) return false;
  if (context.user.isSuperAdmin) return true;
  return false;
}

export function validateSchoolAccessInContext(
  context: EnhancedMiddlewareContext,
  schoolId: string
): boolean {
  if (!context.user) return false;
  if (context.user.isSuperAdmin) return true;
  return context.user.authorizedSchools?.includes(schoolId) ?? false;
}

export default composeEnhancedMiddleware;
