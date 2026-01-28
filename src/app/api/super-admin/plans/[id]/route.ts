import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { requireSuperAdminAccess } from '@/lib/auth/tenant';
import { z } from 'zod';

const updatePlanSchema = z.object({
  name: z.string().min(1, "Plan name is required").optional(),
  description: z.string().optional(),
  amount: z.number().min(0, "Amount must be positive").optional(),
  interval: z.enum(['monthly', 'yearly', 'quarterly']).optional(),
  features: z.object({
    maxStudents: z.number().min(0),
    maxTeachers: z.number().min(0),
    maxAdmins: z.number().min(0),
    storageGB: z.number().min(0),
    whatsappMessages: z.number().min(0),
    smsMessages: z.number().min(0),
    pricePerExtraStudent: z.number().min(0),
    emailSupport: z.boolean(),
    phoneSupport: z.boolean(),
    prioritySupport: z.boolean(),
    customBranding: z.boolean(),
    apiAccess: z.boolean(),
    advancedReports: z.boolean(),
    multipleSchools: z.boolean(),
    backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
  }).optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/super-admin/plans/[id]
 * Get a specific subscription plan
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requireSuperAdminAccess();
    const { id } = await params;

    const plan = await db.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/super-admin/plans/[id]
 * Update a subscription plan
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requireSuperAdminAccess();
    const { id } = await params;

    const body = await request.json();
    const validatedData = updatePlanSchema.parse(body);

    // Check if plan exists
    const existingPlan = await db.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check if name is being changed and if it conflicts
    if (validatedData.name && validatedData.name !== existingPlan.name) {
      const nameConflict = await db.subscriptionPlan.findFirst({
        where: { 
          name: validatedData.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        return NextResponse.json({ error: 'Plan name already exists' }, { status: 400 });
      }
    }

    const plan = await db.subscriptionPlan.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error updating plan:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/super-admin/plans/[id]
 * Delete a subscription plan
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requireSuperAdminAccess();
    const { id } = await params;

    // Check if plan exists
    const existingPlan = await db.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check if plan has active subscriptions
    if (existingPlan._count.subscriptions > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete plan with active subscriptions. Please migrate or cancel all subscriptions first.' 
      }, { status: 400 });
    }

    await db.subscriptionPlan.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}