import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const checkSubdomainSchema = z.object({
  subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/, "Subdomain must contain only lowercase letters, numbers, and hyphens").optional(),
});

/**
 * POST /api/super-admin/schools/check-subdomain
 * Check if a subdomain is available
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subdomain } = checkSubdomainSchema.parse(body);

    // If no subdomain provided, return as available (for optional subdomain case)
    if (!subdomain) {
      return NextResponse.json({
        available: true,
        subdomain: null,
        message: 'No subdomain specified - school will use main platform access',
      });
    }

    // Check if subdomain exists
    const existingSchool = await db.school.findFirst({
      where: {
        OR: [
          { subdomain: subdomain },
          { schoolCode: subdomain.toUpperCase() },
        ],
      },
      select: { id: true },
    });

    const available = !existingSchool;

    return NextResponse.json({
      available,
      subdomain,
      message: available ? 'Subdomain is available' : 'Subdomain is already taken',
    });
  } catch (error) {
    console.error('Error checking subdomain:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid subdomain format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}