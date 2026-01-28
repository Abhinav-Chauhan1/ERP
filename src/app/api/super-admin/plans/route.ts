import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { requireSuperAdminAccess } from '@/lib/auth/tenant';
import { z } from 'zod';

const createPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  amount: z.number().min(0, "Amount must be positive"),
  interval: z.enum(['monthly', 'yearly', 'quarterly']),
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
  }),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/super-admin/plans
 * Get all subscription plans
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requireSuperAdminAccess();

    const plans = await db.subscriptionPlan.findMany({
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/super-admin/plans
 * Create a new subscription plan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requireSuperAdminAccess();

    const body = await request.json();
    const validatedData = createPlanSchema.parse(body);

    // Check if plan name already exists
    const existingPlan = await db.subscriptionPlan.findFirst({
      where: { name: validatedData.name },
    });

    if (existingPlan) {
      return NextResponse.json({ error: 'Plan name already exists' }, { status: 400 });
    }

    const plan = await db.subscriptionPlan.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        amount: validatedData.amount,
        currency: 'inr',
        interval: validatedData.interval,
        features: validatedData.features,
        isActive: validatedData.isActive,
      },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}