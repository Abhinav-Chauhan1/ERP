import { NextRequest, NextResponse } from 'next/server';
import { getSubdomain, validateSubdomain } from '@/lib/middleware/subdomain';
import { z } from 'zod';

const detectSchema = z.object({
  hostname: z.string(),
});

/**
 * POST /api/subdomain/detect
 * Detect and validate subdomain from hostname
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hostname } = detectSchema.parse(body);

    const subdomain = getSubdomain(hostname);
    
    if (!subdomain) {
      return NextResponse.json({
        subdomain: null,
        schoolId: null,
        schoolName: null,
        primaryColor: null,
        secondaryColor: null,
        logo: null,
      });
    }

    const school = await validateSubdomain(subdomain);
    
    if (!school) {
      return NextResponse.json({
        error: 'Invalid subdomain',
        subdomain: null,
        schoolId: null,
        schoolName: null,
        primaryColor: null,
        secondaryColor: null,
        logo: null,
      }, { status: 404 });
    }

    return NextResponse.json({
      subdomain: school.subdomain,
      schoolId: school.id,
      schoolName: school.name,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
      logo: school.logo,
      status: school.status,
      isOnboarded: school.isOnboarded,
      plan: school.plan,
    });
  } catch (error) {
    console.error('Error detecting subdomain:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}