import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * API Route to validate subdomain
 * This is called from middleware to avoid Edge Runtime Prisma issues
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain parameter is required' },
        { status: 400 }
      );
    }

    const school = await db.school.findFirst({
      where: {
        subdomain: subdomain,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        isOnboarded: true,
        primaryColor: true,
        secondaryColor: true,
        logo: true,
        plan: true,
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found or inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json(school);
  } catch (error) {
    console.error('Error validating subdomain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
