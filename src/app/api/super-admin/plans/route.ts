import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { requireSuperAdminAccess } from '@/lib/auth/tenant';
import { z } from 'zod';

const supportSchema = z.object({
  email:     z.boolean().default(true),
  phone:     z.boolean().default(false),
  priority:  z.boolean().default(false),
  dedicated: z.boolean().default(false),
});

const featuresSchema = z.object({
  pricePerStudent:      z.number().int().positive('Price per student must be positive'),
  minimumMonthly:       z.number().int().positive('Minimum monthly must be positive'),
  annualDiscountMonths: z.number().int().min(0).max(12).default(2),
  storageGB:            z.number().int().positive(),
  smsLimit:             z.number().int().min(-1),     // -1 = unlimited
  whatsappLimit:        z.number().int().min(-1),     // -1 = unlimited
  includedFeatures:     z.array(z.string()).default([]),
  support:              supportSchema.default({}),
});

const createPlanSchema = z.object({
  name:        z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  interval:    z.enum(['monthly', 'yearly', 'quarterly']).default('monthly'),
  features:    featuresSchema,
  isActive:    z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requireSuperAdminAccess();

    const plans = await db.subscriptionPlan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requireSuperAdminAccess();

    const body = await request.json();
    const validated = createPlanSchema.parse(body);

    const existing = await db.subscriptionPlan.findFirst({
      where: { name: validated.name },
    });
    if (existing) {
      return NextResponse.json({ error: 'Plan name already exists' }, { status: 400 });
    }

    const plan = await db.subscriptionPlan.create({
      data: {
        name:            validated.name,
        description:     validated.description,
        interval:        validated.interval,
        // Keep amount in sync with minimumMonthly for Razorpay compat (convert paise → paise)
        amount:          validated.features.minimumMonthly,
        // NOTE: pricePerStudent, minimumMonthly, annualDiscountMonths are new schema fields.
        // Run `prisma migrate dev` then `prisma generate` to pick them up in the client types.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(validated.features as any),
        pricePerStudent: validated.features.pricePerStudent,
        minimumMonthly:  validated.features.minimumMonthly,
        annualDiscountMonths: validated.features.annualDiscountMonths,
        features:        validated.features,
        isActive:        validated.isActive,
      } as any,
      include: { _count: { select: { subscriptions: true } } },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
