import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { requireSuperAdminAccess } from '@/lib/auth/tenant';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { z } from 'zod';

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
};

const quotaUpdateSchema = z.object({
  schoolId: z.string().min(1),
  limitMB: z.number().min(1).max(1024 * 1024) // Max 1TB
});

/**
 * PUT /api/storage/quota
 * Update custom storage quota for a school
 */
export async function PUT(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requireSuperAdminAccess();

    const body = await request.json();
    const { schoolId, limitMB } = quotaUpdateSchema.parse(body);

    // Verify school exists
    const school = await db.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Get current month for usage counter
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Update or create usage counter with custom limit
    await db.usageCounter.upsert({
      where: {
        schoolId_month: {
          schoolId,
          month: currentMonth
        }
      },
      update: {
        storageLimitMB: limitMB,
        updatedAt: new Date()
      },
      create: {
        schoolId,
        month: currentMonth,
        storageLimitMB: limitMB,
        storageUsedMB: 0,
        whatsappUsed: 0,
        smsUsed: 0,
        whatsappLimit: 500,
        smsLimit: 500
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Storage quota updated successfully'
    });

  } catch (error) {
    console.error('Error updating storage quota:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}