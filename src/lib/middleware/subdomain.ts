import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Extract subdomain from hostname
 */
export function getSubdomain(hostname: string): string | null {
  // Remove port if present
  const cleanHostname = hostname.split(':')[0];
  
  // Get environment variables
  const rootDomain = process.env.ROOT_DOMAIN || 'localhost';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // In development, handle localhost differently
  if (!isProduction && cleanHostname === 'localhost') {
    return null;
  }
  
  // Split hostname into parts
  const parts = cleanHostname.split('.');
  
  // For production: subdomain.domain.com
  // For development: subdomain.localhost or subdomain.domain.dev
  if (isProduction) {
    // Production: expect format like subdomain.yourdomain.com
    const rootParts = rootDomain.split('.');
    if (parts.length > rootParts.length) {
      // Extract subdomain(s) - take everything except the root domain parts
      const subdomainParts = parts.slice(0, parts.length - rootParts.length);
      return subdomainParts.join('.');
    }
  } else {
    // Development: handle various local development scenarios
    if (parts.length > 1) {
      // subdomain.localhost or subdomain.domain.dev
      return parts[0];
    }
  }
  
  return null;
}

/**
 * Validate if subdomain exists and is active
 */
export async function validateSubdomain(subdomain: string) {
  try {
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

    return school;
  } catch (error) {
    console.error('Error validating subdomain:', error);
    return null;
  }
}

/**
 * Handle subdomain routing middleware
 */
export async function handleSubdomainRouting(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = getSubdomain(hostname);
  
  // No subdomain, continue with normal routing
  if (!subdomain) {
    return NextResponse.next();
  }

  // Validate subdomain
  const school = await validateSubdomain(subdomain);
  
  if (!school) {
    // Subdomain doesn't exist or is inactive
    return new NextResponse('School not found or inactive', { status: 404 });
  }

  // Check if school is onboarded
  if (!school.isOnboarded) {
    // Redirect to setup page
    const setupUrl = new URL('/setup', request.url);
    setupUrl.searchParams.set('school', school.id);
    return NextResponse.redirect(setupUrl);
  }

  // Clone the request URL and modify it for internal routing
  const url = request.nextUrl.clone();
  
  // Add school context to headers for the application to use
  const response = NextResponse.next();
  response.headers.set('x-school-id', school.id);
  response.headers.set('x-school-subdomain', subdomain);
  response.headers.set('x-school-name', school.name);
  response.headers.set('x-school-primary-color', school.primaryColor || '#3b82f6');
  response.headers.set('x-school-secondary-color', school.secondaryColor || '#8b5cf6');
  
  if (school.logo) {
    response.headers.set('x-school-logo', school.logo);
  }

  return response;
}

/**
 * Get school context from request headers (for use in components/pages)
 */
export function getSchoolContext(request: NextRequest) {
  return {
    schoolId: request.headers.get('x-school-id'),
    subdomain: request.headers.get('x-school-subdomain'),
    schoolName: request.headers.get('x-school-name'),
    primaryColor: request.headers.get('x-school-primary-color'),
    secondaryColor: request.headers.get('x-school-secondary-color'),
    logo: request.headers.get('x-school-logo'),
  };
}