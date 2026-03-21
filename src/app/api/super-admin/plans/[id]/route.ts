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
  pricePerStudent:      z.number().int().positive(),
  minimumMonthly:       z.number().int().positive(),
  annualDiscountMonths: z.number().int().min(0).max(12).default(2),
  storageGB:            z.number().int().positive(),
  smsLimit:             z.number().int().min(-1),
  whatsappLimit:        z.number().int().min(-1),
  includedFeatures:     z.array(z.string()).default([]),
  support:              supportSchema.default({}),
});

const updatePlanSchema = z.object({
  name:        z.string().min(1).optional(),
  description: z.string().optional(),
  interval:    z.enum(['monthly', 'yearly', 'quarterly']).optional(),
  features:    featuresSchema.optional(),
  isActive:    z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requireSuperAdminAccess();
    const { id } = await params;

    const plan = await db.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requireSuperAdminAccess();
    const { id } = await params;

    const existing = await db.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const body = await request.json();
    const validated = updatePlanSchema.parse(body);

    if (validated.name && validated.name !== existing.name) {
      const conflict = await db.subscriptionPlan.findFirst({
        where: { name: validated.name, id: { not: id } },
      });
      if (conflict) return NextResponse.json({ error: 'Plan name already exists' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined)        updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.interval !== undefined)    updateData.interval = validated.interval;
    if (validated.isActive !== undefined)    updateData.isActive = validated.isActive;
    if (validated.features !== undefined) {
      updateData.features        = validated.features;
      updateData.pricePerStudent = validated.features.pricePerStudent;
      updateData.minimumMonthly  = validated.features.minimumMonthly;
      updateData.annualDiscountMonths = validated.features.annualDiscountMonths;
      updateData.amount          = validated.features.minimumMonthly; // keep in sync
    }

    const plan = await db.subscriptionPlan.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { subscriptions: true } } },
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error updating plan:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requireSuperAdminAccess();
    const { id } = await params;

    const existing = await db.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    if (existing._count.subscriptions > 0) {
      return NextResponse.json({
        error: 'Cannot delete plan with active subscriptions. Migrate or cancel them first.',
      }, { status: 400 });
    }

    await db.subscriptionPlan.delete({ where: { id } });
    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
