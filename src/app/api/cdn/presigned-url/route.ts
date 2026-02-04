/**
 * Presigned URL Generation API Route
 * 
 * Provides endpoints for generating secure presigned URLs with expiration
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { urlManagementService } from '@/lib/services/url-management-service';
import { currentUser } from '@/lib/auth-helpers';

// Request validation schema
const PresignedUrlSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  category: z.string().min(1, 'Category is required'),
  filename: z.string().min(1, 'Filename is required'),
  expiresIn: z.number().min(60).max(86400).default(3600), // 1 minute to 24 hours, default 1 hour
  permissions: z.array(z.enum(['read', 'write', 'delete'])).default(['read']),
});

export async function POST(request: NextRequest) {
  try {
    // Get current user and validate authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = PresignedUrlSchema.parse(body);

    const { schoolId, category, filename, expiresIn, permissions } = validatedData;

    // Validate user has access to the school
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json(
        { error: 'Access denied: Cannot generate URLs for other schools' },
        { status: 403 }
      );
    }

    // Validate permissions based on user role
    const allowedPermissions = ['read'];
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      allowedPermissions.push('write', 'delete');
    } else if (user.role === 'TEACHER') {
      allowedPermissions.push('write');
    }

    const hasInvalidPermissions = permissions.some(
      permission => !allowedPermissions.includes(permission)
    );

    if (hasInvalidPermissions) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          allowedPermissions 
        },
        { status: 403 }
      );
    }

    // Generate presigned URL
    const result = await urlManagementService.generatePresignedUrl(
      schoolId,
      category,
      filename,
      expiresIn,
      permissions
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      expiresAt: result.expiresAt,
      permissions,
      schoolId,
      category,
      filename,
    });

  } catch (error) {
    console.error('Presigned URL generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// URL validation endpoint
const ValidateUrlSchema = z.object({
  url: z.string().url('Invalid URL format'),
  schoolId: z.string().min(1, 'School ID is required'),
  requiredPermission: z.enum(['read', 'write', 'delete']).default('read'),
});

export async function GET(request: NextRequest) {
  try {
    // Get current user and validate authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const schoolId = searchParams.get('schoolId');
    const requiredPermission = searchParams.get('requiredPermission') || 'read';

    // Validate required parameters
    const validatedData = ValidateUrlSchema.parse({
      url,
      schoolId,
      requiredPermission,
    });

    // Validate user has access to the school
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== validatedData.schoolId) {
      return NextResponse.json(
        { error: 'Access denied: Cannot validate URLs for other schools' },
        { status: 403 }
      );
    }

    // Validate URL access
    const validation = urlManagementService.validateUrlAccess(
      validatedData.url,
      validatedData.schoolId,
      validatedData.requiredPermission
    );

    return NextResponse.json({
      isValid: validation.isValid,
      hasAccess: validation.hasAccess,
      error: validation.error,
      url: validatedData.url,
      schoolId: validatedData.schoolId,
      requiredPermission: validatedData.requiredPermission,
    });

  } catch (error) {
    console.error('URL validation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}