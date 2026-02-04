import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { requireSuperAdminAccess } from '@/lib/auth/tenant';
import { rateLimit } from '@/lib/middleware/rate-limit';

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
};

/**
 * GET /api/storage/schools
 * Get detailed storage usage for all schools
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requireSuperAdminAccess();

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'usage';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Calculate plan-based storage limits
    const planLimits = {
      STARTER: 1024, // 1GB in MB
      GROWTH: 5120,  // 5GB in MB
      DOMINATE: 51200 // 50GB in MB
    };

    const planStorageGB = {
      STARTER: 1,
      GROWTH: 5,
      DOMINATE: 50
    };

    // Get all schools with their usage counters
    const schools = await db.school.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        usageCounters: {
          orderBy: {
            month: 'desc'
          },
          take: 1
        }
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Process and format school storage data
    const schoolsUsage = schools.map(school => {
      const planLimit = planLimits[school.plan as keyof typeof planLimits] || planLimits.STARTER;
      const currentUsage = school.usageCounters[0]?.storageUsedMB || 0;
      const percentageUsed = (currentUsage / planLimit) * 100;

      return {
        schoolId: school.id,
        schoolName: school.name,
        currentUsageMB: currentUsage,
        maxLimitMB: planLimit,
        percentageUsed,
        planType: school.plan,
        planStorageGB: planStorageGB[school.plan as keyof typeof planStorageGB] || 1,
        isOverLimit: percentageUsed >= 100,
        lastUpdated: school.usageCounters[0]?.updatedAt || school.updatedAt
      };
    });

    // Sort the results
    schoolsUsage.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'usage':
          aValue = a.currentUsageMB;
          bValue = b.currentUsageMB;
          break;
        case 'percentage':
          aValue = a.percentageUsed;
          bValue = b.percentageUsed;
          break;
        case 'name':
          aValue = a.schoolName.toLowerCase();
          bValue = b.schoolName.toLowerCase();
          break;
        default:
          aValue = a.currentUsageMB;
          bValue = b.currentUsageMB;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
      }

      return order === 'desc' ? (bValue as number) - (aValue as number) : (aValue as number) - (bValue as number);
    });

    // Get total count for pagination
    const totalCount = await db.school.count({
      where: {
        status: 'ACTIVE'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        schools: schoolsUsage,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching schools storage data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}