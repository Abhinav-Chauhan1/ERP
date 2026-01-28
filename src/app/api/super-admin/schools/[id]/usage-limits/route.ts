import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const usageLimitsSchema = z.object({
  limits: z.object({
    maxStudents: z.number().min(1),
    maxTeachers: z.number().min(1),
    maxClasses: z.number().min(1),
    maxSubjects: z.number().min(1),
    storageLimit: z.number().min(1), // GB
    whatsappLimit: z.number().min(0),
    smsLimit: z.number().min(0),
    emailLimit: z.number().min(0),
    apiCallsLimit: z.number().min(0),
  }),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

/**
 * GET /api/super-admin/schools/[id]/usage-limits
 * Get school usage limits and current usage
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if school exists and get basic info
    const school = await db.school.findUnique({
      where: { id: params.id },
      select: { 
        id: true, 
        name: true, 
        plan: true,
        _count: {
          select: {
            students: true,
            teachers: true,
            classes: true,
            subjects: true,
          }
        }
      },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Get usage counters
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const usageCounter = await db.usageCounter.findUnique({
      where: {
        schoolId_month: {
          schoolId: params.id,
          month: currentMonth,
        }
      }
    });

    // Define limits based on plan
    const planLimits = {
      STARTER: {
        maxStudents: 100,
        maxTeachers: 10,
        maxClasses: 10,
        maxSubjects: 20,
        storageLimit: 1, // GB
        whatsappLimit: 500,
        smsLimit: 500,
        emailLimit: 1000,
        apiCallsLimit: 1000,
      },
      GROWTH: {
        maxStudents: 500,
        maxTeachers: 50,
        maxClasses: 25,
        maxSubjects: 50,
        storageLimit: 5, // GB
        whatsappLimit: 2000,
        smsLimit: 2000,
        emailLimit: 5000,
        apiCallsLimit: 5000,
      },
      DOMINATE: {
        maxStudents: -1, // Unlimited
        maxTeachers: -1, // Unlimited
        maxClasses: -1, // Unlimited
        maxSubjects: -1, // Unlimited
        storageLimit: 50, // GB
        whatsappLimit: 10000,
        smsLimit: 10000,
        emailLimit: 25000,
        apiCallsLimit: 25000,
      }
    };

    const limits = planLimits[school.plan as keyof typeof planLimits];
    
    const currentUsage = {
      students: school._count.students,
      teachers: school._count.teachers,
      classes: school._count.classes,
      subjects: school._count.subjects,
      storage: 0.5, // This would come from actual storage calculation
      whatsapp: usageCounter?.whatsappUsed || 0,
      sms: usageCounter?.smsUsed || 0,
      email: 0, // This would come from email tracking
      apiCalls: 0, // This would come from API usage tracking
    };

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL_USAGE_LIMITS',
      resourceId: params.id,
    });

    return NextResponse.json({
      schoolId: params.id,
      schoolName: school.name,
      plan: school.plan,
      limits,
      currentUsage,
      usagePercentages: {
        students: limits.maxStudents === -1 ? 0 : (currentUsage.students / limits.maxStudents) * 100,
        teachers: limits.maxTeachers === -1 ? 0 : (currentUsage.teachers / limits.maxTeachers) * 100,
        classes: limits.maxClasses === -1 ? 0 : (currentUsage.classes / limits.maxClasses) * 100,
        subjects: limits.maxSubjects === -1 ? 0 : (currentUsage.subjects / limits.maxSubjects) * 100,
        storage: (currentUsage.storage / limits.storageLimit) * 100,
        whatsapp: (currentUsage.whatsapp / limits.whatsappLimit) * 100,
        sms: (currentUsage.sms / limits.smsLimit) * 100,
        email: (currentUsage.email / limits.emailLimit) * 100,
        apiCalls: (currentUsage.apiCalls / limits.apiCallsLimit) * 100,
      }
    });
  } catch (error) {
    console.error('Error fetching school usage limits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/super-admin/schools/[id]/usage-limits
 * Update school usage limits (custom limits override plan defaults)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { limits } = usageLimitsSchema.parse(body);

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: params.id },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // In a real implementation, you would store custom limits in a separate table
    // For now, we'll update the usage counter limits
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    await db.usageCounter.upsert({
      where: {
        schoolId_month: {
          schoolId: params.id,
          month: currentMonth,
        }
      },
      update: {
        whatsappLimit: limits.whatsappLimit,
        smsLimit: limits.smsLimit,
        storageLimitMB: limits.storageLimit * 1024, // Convert GB to MB
      },
      create: {
        schoolId: params.id,
        month: currentMonth,
        whatsappLimit: limits.whatsappLimit,
        smsLimit: limits.smsLimit,
        storageLimitMB: limits.storageLimit * 1024,
      }
    });

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SCHOOL_USAGE_LIMITS',
      resourceId: params.id,
      changes: { limits },
    });

    return NextResponse.json({
      message: 'School usage limits updated successfully',
      limits,
    });
  } catch (error) {
    console.error('Error updating school usage limits:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}