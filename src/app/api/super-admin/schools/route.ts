import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { schoolService } from '@/lib/services/school-service';
import { logAuditEvent, logSchoolManagementAction } from '@/lib/services/audit-service';
import { authenticationService } from '@/lib/services/authentication-service';
import { schoolContextService } from '@/lib/services/school-context-service';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { db } from '@/lib/db';
import { AuditAction } from '@prisma/client';
import bcrypt from 'bcryptjs';

const createSchoolSchema = z.object({
  // Basic Information
  schoolName: z.string().min(1),
  subdomain: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  description: z.string().optional(),
  
  // Subscription & Billing - Accept plan ID instead of enum
  subscriptionPlan: z.string().min(1, "Subscription plan is required"),
  billingCycle: z.enum(['monthly', 'yearly']),
  
  // Initial Configuration
  extraStudents: z.number().min(0).default(0),
  schoolType: z.string().optional(),
  
  // Authentication Configuration (new fields for unified auth system)
  adminEmail: z.string().email().optional(),
  adminName: z.string().min(1).optional(),
  adminPassword: z.string().min(8).optional(),
  enableOTPForAdmins: z.boolean().default(false),
  authenticationMethod: z.enum(['password', 'otp', 'both']).default('password'),
  
  // Subdomain Configuration
  enableSubdomain: z.boolean().default(true),
}).refine((data) => {
  // If subdomain is enabled, it must be provided and valid
  if (data.enableSubdomain) {
    if (!data.subdomain || data.subdomain.trim() === '') {
      return false;
    }
    // Check subdomain format
    return /^[a-z0-9-]+$/.test(data.subdomain);
  }
  return true;
}, {
  message: "Subdomain is required when enabled and must contain only lowercase letters, numbers, and hyphens",
  path: ["subdomain"]
}).transform((data) => ({
  ...data,
  // Transform empty subdomain to undefined when subdomain is disabled
  subdomain: data.enableSubdomain && data.subdomain ? data.subdomain : undefined,
}));

const updateSchoolSchema = z.object({
  // Basic Information
  schoolName: z.string().min(1).optional(),
  subdomain: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  description: z.string().optional(),
  
  // Subscription & Billing
  subscriptionPlan: z.string().min(1).optional(),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
  
  // Initial Configuration
  extraStudents: z.number().min(0).optional(),
  schoolType: z.string().optional(),
  
  // Authentication Configuration
  adminEmail: z.string().email().optional(),
  adminName: z.string().min(1).optional(),
  adminPassword: z.string().min(8).optional(),
  enableOTPForAdmins: z.boolean().optional(),
  authenticationMethod: z.enum(['password', 'otp', 'both']).optional(),
  
  // Subdomain Configuration
  enableSubdomain: z.boolean().optional(),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

/**
 * GET /api/super-admin/schools
 * Get all schools with filtering and search
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      planType: searchParams.get('planType') || undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      country: searchParams.get('country') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
    };

    const schools = await schoolService.getSchools(filters);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL',
      metadata: {
        filters,
        resultCount: schools.schools.length,
      },
    });

    return NextResponse.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/super-admin/schools
 * Create a new school with SaaS configuration and unified authentication system integration
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSchoolSchema.parse(body);

    // Check subdomain availability only if subdomain is enabled and provided
    if (validatedData.enableSubdomain && validatedData.subdomain) {
      const existingSchool = await schoolService.getSchoolBySubdomain(validatedData.subdomain);
      if (existingSchool) {
        return NextResponse.json({ error: 'Subdomain already exists' }, { status: 400 });
      }
    }

    // Fetch and validate the subscription plan
    const subscriptionPlan = await db.subscriptionPlan.findUnique({
      where: { id: validatedData.subscriptionPlan }
    });

    if (!subscriptionPlan || !subscriptionPlan.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive subscription plan' }, { status: 400 });
    }

    // Generate school code - use subdomain if available, otherwise generate from school name
    const schoolCode = validatedData.subdomain 
      ? validatedData.subdomain.toUpperCase()
      : validatedData.schoolName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10) + '_' + Date.now().toString().slice(-4);
    
    const existingSchoolCode = await db.school.findUnique({
      where: { schoolCode }
    });
    if (existingSchoolCode) {
      return NextResponse.json({ error: 'School code already exists' }, { status: 400 });
    }

    // Create school with unified authentication system configuration
    const schoolData = {
      name: validatedData.schoolName,
      schoolCode: schoolCode,
      email: validatedData.contactEmail,
      phone: validatedData.contactPhone,
      subdomain: validatedData.enableSubdomain ? validatedData.subdomain : null,
      description: validatedData.description,
      plan: subscriptionPlan.name.toUpperCase().replace(/\s+/g, '_'), // Convert plan name to enum-like format
      status: 'INACTIVE' as const, // Will be activated after setup and admin creation
      isOnboarded: false, // Required by unified auth system - schools start non-onboarded
      onboardingStep: 0, // Track onboarding progress
      // Authentication system defaults
      primaryColor: "#3b82f6",
      secondaryColor: "#8b5cf6",
      metadata: {
        subscriptionPlanId: subscriptionPlan.id,
        subscriptionPlanName: subscriptionPlan.name,
        planAmount: subscriptionPlan.amount,
        planInterval: subscriptionPlan.interval,
        planFeatures: subscriptionPlan.features,
        extraStudents: validatedData.extraStudents,
        schoolType: validatedData.schoolType,
        billingCycle: validatedData.billingCycle,
        createdBy: session.user.id,
        enableSubdomain: validatedData.enableSubdomain,
        // Authentication configuration for unified auth system
        authenticationConfig: {
          enableOTPForAdmins: validatedData.enableOTPForAdmins,
          authenticationMethod: validatedData.authenticationMethod,
          requiresSetup: true, // Flag for setup wizard
          setupStep: 'admin_creation' // First step in setup process
        }
      },
    };

    // Create school with SaaS configuration
    const school = await schoolService.createSchoolWithSaasConfig(schoolData);

    // Create initial school admin user if provided
    let adminUser = null;
    if (validatedData.adminEmail && validatedData.adminName) {
      try {
        // Check if user already exists
        const existingUser = await db.user.findFirst({
          where: {
            OR: [
              { email: validatedData.adminEmail },
              { mobile: validatedData.adminEmail } // In case email is used as mobile
            ]
          }
        });

        if (existingUser) {
          // Link existing user to school as admin
          await db.userSchool.create({
            data: {
              userId: existingUser.id,
              schoolId: school.id,
              role: 'ADMIN',
              isActive: true
            }
          });
          adminUser = existingUser;
        } else {
          // Create new admin user
          const passwordHash = validatedData.adminPassword 
            ? await bcrypt.hash(validatedData.adminPassword, 12)
            : null;

          adminUser = await db.user.create({
            data: {
              name: validatedData.adminName,
              email: validatedData.adminEmail,
              passwordHash,
              isActive: true,
              // Set mobile to email if no separate mobile provided (for unified auth)
              mobile: validatedData.adminEmail.includes('@') ? null : validatedData.adminEmail
            }
          });

          // Create user-school relationship
          await db.userSchool.create({
            data: {
              userId: adminUser.id,
              schoolId: school.id,
              role: 'ADMIN',
              isActive: true
            }
          });
        }

        // Log admin user creation/assignment
        await logSchoolManagementAction(
          session.user.id,
          'CREATE',
          school.id,
          {
            action: 'admin_user_created',
            adminUserId: adminUser.id,
            adminEmail: validatedData.adminEmail,
            adminName: validatedData.adminName,
            isNewUser: !existingUser,
            authenticationMethod: validatedData.authenticationMethod
          }
        );

      } catch (adminError) {
        console.error('Error creating admin user:', adminError);
        // Continue with school creation even if admin creation fails
        // This will be handled in the setup wizard
      }
    }

    // Initialize school context in the unified authentication system
    try {
      await schoolContextService.initializeSchoolContext(school.id, {
        schoolCode: school.schoolCode,
        name: school.name,
        subdomain: school.subdomain || undefined,
        authenticationConfig: schoolData.metadata.authenticationConfig,
        createdBy: session.user.id
      });
    } catch (contextError) {
      console.error('Error initializing school context:', contextError);
      // Log the error but continue - context can be initialized later
      await logAuditEvent({
        userId: session.user.id,
        action: 'CREATE',
        resource: 'SCHOOL_CONTEXT',
        resourceId: school.id,
        changes: {
          error: 'Failed to initialize school context',
          errorMessage: contextError instanceof Error ? contextError.message : 'Unknown error'
        },
        schoolId: school.id
      });
    }

    // Log comprehensive school creation event
    await logSchoolManagementAction(
      session.user.id,
      'CREATE',
      school.id,
      {
        schoolName: validatedData.schoolName,
        subdomain: validatedData.subdomain,
        enableSubdomain: validatedData.enableSubdomain,
        plan: subscriptionPlan.name,
        planId: subscriptionPlan.id,
        billingCycle: validatedData.billingCycle,
        extraStudents: validatedData.extraStudents,
        authenticationConfig: schoolData.metadata.authenticationConfig,
        adminUserCreated: !!adminUser,
        adminUserId: adminUser?.id,
        setupRequired: true,
        unifiedAuthEnabled: true
      }
    );

    // Prepare response with setup information
    const setupUrl = `/super-admin/schools/${school.id}/setup`;
    const response = {
      success: true,
      schoolId: school.id,
      message: 'School created successfully with unified authentication system',
      setupUrl,
      school: {
        id: school.id,
        name: school.name,
        schoolCode: school.schoolCode,
        subdomain: school.subdomain,
        status: school.status,
        isOnboarded: school.isOnboarded,
        plan: school.plan
      },
      adminUser: adminUser ? {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        hasPassword: !!adminUser.passwordHash
      } : null,
      nextSteps: [
        'Complete school setup wizard',
        adminUser ? 'Admin user is ready for login' : 'Create admin user in setup wizard',
        'Configure authentication settings',
        'Activate school for student/parent access'
      ]
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating school:', error);
    
    // Log the error for audit purposes
    try {
      const session = await auth();
      if (session?.user) {
        await logAuditEvent({
          userId: session.user.id,
          action: 'CREATE',
          resource: 'SCHOOL',
          changes: {
            error: 'School creation failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log school creation error:', logError);
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to create school. Please try again.'
    }, { status: 500 });
  }
}