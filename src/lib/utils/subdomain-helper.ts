import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

/**
 * Get and validate school from subdomain
 * This should be called in server components/layouts to validate subdomain access
 */
export async function getSchoolFromSubdomain() {
  const headersList = headers();
  const subdomain = headersList.get('x-subdomain');

  if (!subdomain) {
    return null;
  }

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

    if (!school) {
      // Subdomain doesn't exist or is inactive
      throw new Error('School not found or inactive');
    }

    // Check if school is onboarded
    if (!school.isOnboarded) {
      // Redirect to setup page
      redirect(`/setup?school=${school.id}`);
    }

    return school;
  } catch (error) {
    console.error('Error validating subdomain:', error);
    throw error;
  }
}

/**
 * Get subdomain from headers (without validation)
 */
export function getSubdomainFromHeaders() {
  const headersList = headers();
  return headersList.get('x-subdomain');
}

/**
 * Check if current request is on a subdomain
 */
export function isSubdomainRequest() {
  const subdomain = getSubdomainFromHeaders();
  return subdomain !== null && subdomain !== '';
}
