import { NextRequest, NextResponse } from 'next/server';

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
 * Handle subdomain routing middleware
 * NOTE: We skip database validation in middleware to avoid Edge Runtime issues.
 * Subdomain validation will happen in the application layer (API routes/server components).
 */
export async function handleSubdomainRouting(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = getSubdomain(hostname);
  
  // No subdomain, continue with normal routing
  if (!subdomain) {
    return NextResponse.next();
  }

  // Add subdomain to headers for the application to use
  // The application layer will validate the subdomain and handle errors
  const response = NextResponse.next();
  response.headers.set('x-subdomain', subdomain);
  response.headers.set('x-hostname', hostname);

  return response;
}

/**
 * Get school context from request headers (for use in components/pages)
 */
export function getSchoolContext(request: NextRequest) {
  return {
    subdomain: request.headers.get('x-subdomain'),
    hostname: request.headers.get('x-hostname'),
  };
}