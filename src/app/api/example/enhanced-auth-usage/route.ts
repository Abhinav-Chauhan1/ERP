import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { 
  createSchoolAdminRoute,
  createTeacherRoute,
  createMultiRoleRoute,
  createTenantIsolatedRoute,
  EnhancedMiddlewareContext
} from '@/lib/middleware/enhanced-compose';

/**
 * Example API routes demonstrating enhanced authentication middleware usage
 * 
 * This file shows how to use the new enhanced authentication system
 * with various security configurations and tenant isolation.
 */

// Example 1: School Admin route with comprehensive security
export const GET = createSchoolAdminRoute(
  async (context: EnhancedMiddlewareContext) => {
    const { user, schoolContext } = context;
    
    return NextResponse.json({
      message: 'School admin access granted',
      user: {
        id: user!.id,
        role: user!.role,
        school: schoolContext
      },
      timestamp: new Date().toISOString()
    });
  },
  {
    additionalPermissions: ['school:read', 'user:read'],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50 // Limit each IP to 50 requests per windowMs
    }
  }
);

// Example 2: Teacher route with school context validation
export const POST = createTeacherRoute(
  async (context: EnhancedMiddlewareContext) => {
    const { user, schoolContext, request } = context;
    
    try {
      const body = await request.json();
      
      // Process teacher-specific data
      // All school context validation is handled by middleware
      
      return NextResponse.json({
        message: 'Teacher data processed successfully',
        user: {
          id: user!.id,
          role: user!.role,
          school: schoolContext?.schoolCode
        },
        data: body
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  },
  {
    additionalPermissions: ['student:read', 'class:write']
  }
);

// Example 3: Multi-role route (Teacher or School Admin)
export const PUT = createMultiRoleRoute(
  [UserRole.TEACHER, UserRole.ADMIN],
  async (context: EnhancedMiddlewareContext) => {
    const { user, schoolContext } = context;
    
    // Different logic based on role
    if (user!.role === UserRole.ADMIN) {
      // Admin-specific logic
      return NextResponse.json({
        message: 'Admin update processed',
        permissions: 'full'
      });
    } else {
      // Teacher-specific logic
      return NextResponse.json({
        message: 'Teacher update processed',
        permissions: 'limited'
      });
    }
  },
  {
    additionalPermissions: ['data:write'],
    requireSchoolContext: true
  }
);

// Example 4: Tenant-isolated route for specific schools
export const PATCH = createTenantIsolatedRoute(
  ['school-123', 'school-456'], // Only these schools can access
  async (context: EnhancedMiddlewareContext) => {
    const { user, schoolContext } = context;
    
    return NextResponse.json({
      message: 'Tenant-isolated access granted',
      school: schoolContext?.schoolCode,
      user: user!.id,
      note: 'This endpoint is only accessible to specific schools'
    });
  },
  {
    requiredRole: [UserRole.ADMIN, UserRole.TEACHER],
    additionalPermissions: ['special:access']
  }
);

// Example 5: Simple DELETE handler with enhanced auth
export async function DELETE(request: NextRequest) {
  const { enhancedAuthenticate } = await import('@/lib/middleware/enhanced-auth');
  
  const authResult = await enhancedAuthenticate(request, {
    requiredRole: UserRole.ADMIN,
    requireSchoolContext: true,
    auditAction: 'RESOURCE_DELETE'
  });

  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  // Route handler logic
  return NextResponse.json({
    message: 'Resource deleted successfully',
    user: authResult.context.user?.id,
    school: authResult.context.schoolContext?.schoolCode
  });
}

/**
 * Example of manual enhanced authentication usage
 */
import { enhancedAuthenticate } from '@/lib/middleware/enhanced-auth';

export async function customHandler(request: NextRequest) {
  // Manual authentication with custom configuration
  const authResult = await enhancedAuthenticate(request, {
    requiredRole: UserRole.TEACHER,
    requiredPermissions: ['custom:permission'],
    requireSchoolContext: true,
    auditAction: 'CUSTOM_API_ACCESS'
  });

  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 401 }
    );
  }

  // Use authenticated user and school context
  const { user, schoolContext } = authResult.context;
  
  return NextResponse.json({
    message: 'Custom authentication successful',
    user: user!.id,
    school: schoolContext?.schoolCode
  });
}