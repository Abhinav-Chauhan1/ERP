import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'app', 'admin', 'superadmin', 'mail', 'smtp', 'imap', 'pop',
  'static', 'assets', 'cdn', 'media', 'uploads', 'files', 'img', 'images',
  'blog', 'help', 'support', 'docs', 'status', 'dashboard', 'login',
  'auth', 'oauth', 'sso', 'dev', 'staging', 'test', 'demo', 'sandbox',
  'ftp', 'ssh', 'vpn', 'proxy', 'ns', 'ns1', 'ns2', 'mx', 'mx1', 'mx2',
]);

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

    if (RESERVED_SUBDOMAINS.has(subdomain.toLowerCase())) {
      return NextResponse.json(
        { error: 'School not found or inactive' },
        { status: 404 }
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
