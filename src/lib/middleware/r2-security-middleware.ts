/**
 * R2 Security Middleware
 * 
 * Middleware that integrates R2 security service with file operations
 * to enforce access control, authentication, and audit logging.
 * 
 * Requirements: 8.1, 8.2, 8.4, 8.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/auth';
import {
  r2SecurityService,
  type FileAccessContext,
  type FileOperation
} from '../services/r2-security-service';

/**
 * R2 security middleware configuration
 */
export interface R2SecurityConfig {
  operation: FileOperation;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  requiredPermissions?: string[];
  sensitivityLevel?: 'PUBLIC' | 'SCHOOL' | 'ROLE' | 'PRIVATE' | 'SENSITIVE';
}

/**
 * Create R2 security middleware for file operations
 */
export function createR2SecurityMiddleware(config: R2SecurityConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      // Extract file key from request
      const fileKey = extractFileKeyFromRequest(request);
      if (!fileKey) {
        return NextResponse.json(
          { error: 'File key not found in request' },
          { status: 400 }
        );
      }

      // Check if authentication is required
      const requiresAuth = config.requireAuth !== false; // Default to true
      if (requiresAuth) {
        const authRequired = await r2SecurityService.requiresAuthentication(
          fileKey,
          config.operation
        );

        if (authRequired) {
          // Get authenticated user session
          const session = await auth();

          if (!session?.user) {
            return NextResponse.json(
              { error: 'Authentication required' },
              { status: 401 }
            );
          }

          const user = session.user;

          // Get user permissions - simplified version
          const permissions: string[] = [];

          // Create file access context
          const context: FileAccessContext = {
            userId: user.id,
            userRole: user.role as UserRole,
            schoolId: user.schoolId || '',
            authorizedSchools: [user.schoolId || ''],
            permissions: permissions,
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') || 'Unknown'
          };

          // Validate file access
          const accessResult = await r2SecurityService.validateFileAccess(
            context,
            fileKey,
            config.operation
          );

          if (!accessResult.allowed) {
            return NextResponse.json(
              {
                error: accessResult.reason || 'Access denied',
                requiresAdditionalAuth: accessResult.requiresAdditionalAuth,
                additionalAuthType: accessResult.additionalAuthType
              },
              { status: 403 }
            );
          }
        }
      }

      // Validate CORS if this is a cross-origin request
      const origin = request.headers.get('origin');
      if (origin) {
        const corsValid = await r2SecurityService.validateCORSPolicy(
          origin,
          request.method,
          Array.from(request.headers.keys())
        );

        if (!corsValid) {
          return NextResponse.json(
            { error: 'CORS policy violation' },
            { status: 403 }
          );
        }
      }

      return null; // Continue to route handler

    } catch (error) {
      console.error('R2 security middleware error:', error);
      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Utility function to extract file key from request
 */
function extractFileKeyFromRequest(request: NextRequest): string | null {
  const url = new URL(request.url);
  
  // Try to get file key from URL path
  const pathSegments = url.pathname.split('/');
  const fileIndex = pathSegments.findIndex(segment => segment === 'files');
  if (fileIndex !== -1 && pathSegments[fileIndex + 1]) {
    // Decode the file key from URL
    return decodeURIComponent(pathSegments.slice(fileIndex + 1).join('/'));
  }

  // Try to get file key from query parameters
  const fileKey = url.searchParams.get('fileKey') || 
                  url.searchParams.get('key') ||
                  url.searchParams.get('file');
  if (fileKey) {
    return decodeURIComponent(fileKey);
  }

  // Try to get file key from headers
  const keyHeader = request.headers.get('x-file-key');
  if (keyHeader) {
    return keyHeader;
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

export default createR2SecurityMiddleware;