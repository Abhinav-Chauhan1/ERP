import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { requireSuperAdminAccess } from '@/lib/auth/tenant';
import { r2StorageService } from '@/lib/services/r2-storage-service';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { z } from 'zod';

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
};

const syncSchema = z.object({
  schoolId: z.string().min(1)
});

/**
 * POST /api/storage/quota/sync
 * Sync storage quota from subscription plan
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requireSuperAdminAccess();

    const body = await request.json();
    const { schoolId } = syncSchema.parse(body);

    // Get school with plan information
    const school = await db.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Calculate plan-based storage limits
    const planLimits = {
      STARTER: 1024, // 1GB in MB
      GROWTH: 5120,  // 5GB in MB
      DOMINATE: 51200 // 50GB in MB
    };

    const planLimit = planLimits[school.plan as keyof typeof planLimits] || planLimits.STARTER;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Update usage counter with plan-based limit
    await db.usageCounter.upsert({
      where: {
        schoolId_month: {
          schoolId,
          month: currentMonth
        }
      },
      update: {
        storageLimitMB: planLimit,
        updatedAt: new Date()
      },
      create: {
        schoolId,
        month: currentMonth,
        storageLimitMB: planLimit,
        storageUsedMB: 0,
        whatsappUsed: 0,
        smsUsed: 0,
        whatsappLimit: 500,
        smsLimit: 500
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Storage quota synced from plan successfully',
      data: {
        planLimit,
        planType: school.plan
      }
    });

  } catch (error) {
    console.error('Error syncing storage quota:', error);
    
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

/**
 * PUT /api/storage/quota/sync
 * Sync storage usage with R2
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
    const { schoolId } = syncSchema.parse(body);

    // Verify school exists
    const school = await db.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    try {
      // Get actual usage from R2
      const actualUsageMB = await r2StorageService.getSchoolStorageUsage(schoolId);
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      // Update usage counter with actual R2 usage
      await db.usageCounter.upsert({
        where: {
          schoolId_month: {
            schoolId,
            month: currentMonth
          }
        },
        update: {
          storageUsedMB: actualUsageMB,
          updatedAt: new Date()
        },
        create: {
          schoolId,
          month: currentMonth,
          storageUsedMB: actualUsageMB,
          storageLimitMB: 1024, // Default 1GB
          whatsappUsed: 0,
          smsUsed: 0,
          whatsappLimit: 500,
          smsLimit: 500
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Storage usage synced with R2 successfully',
        data: {
          actualUsageMB,
          schoolName: school.name
        }
      });

    } catch (r2Error) {
      console.error('Error fetching R2 usage:', r2Error);
      return NextResponse.json(
        { error: 'Failed to sync with R2 storage' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error syncing storage usage:', error);
    
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