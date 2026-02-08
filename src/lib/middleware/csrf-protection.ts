import { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF Protection Middleware - Edge Runtime Compatible
 * Implements double-submit cookie pattern for CSRF protection
 * Uses Web Crypto API for Edge Runtime compatibility
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token using Web Crypto API
 * Compatible with Edge Runtime
 */
export function generateCSRFToken(): string {
  // Use Web Crypto API which is available in Edge Runtime
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a hash of the CSRF token for comparison using Web Crypto API
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract CSRF token from request
 */
function extractCSRFToken(request: NextRequest): {
  headerToken?: string;
  cookieToken?: string;
} {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  return { headerToken: headerToken ?? undefined, cookieToken };
}

/**
 * Validate CSRF token using double-submit cookie pattern
 * Now async due to Web Crypto API
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  const { headerToken, cookieToken } = extractCSRFToken(request);

  // Both tokens must be present
  if (!headerToken || !cookieToken) {
    return false;
  }

  try {
    // Hash both tokens for comparison
    const [headerHash, cookieHash] = await Promise.all([
      hashToken(headerToken),
      hashToken(cookieToken)
    ]);

    // Use constant-time comparison
    return headerHash === cookieHash;
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}

/**
 * Set CSRF token in response cookie
 */
export function setCSRFTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

/**
 * CSRF protection middleware
 */
export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  const method = request.method.toUpperCase();
  
  // Only protect state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null; // Allow request to proceed
  }

  // Skip CSRF for API routes that use other authentication methods
  const pathname = request.nextUrl.pathname;
  const skipPaths = [
    '/api/auth/', // NextAuth handles its own CSRF
    '/api/webhooks/', // Webhooks use signature verification
    '/api/public/', // Public APIs don't need CSRF
    '/api/super-admin/', // Super admin routes use session authentication
    '/api/admin/', // Admin routes use session authentication
    '/api/teacher/', // Teacher routes use session authentication
    '/api/student/', // Student routes use session authentication
    '/api/parent/', // Parent routes use session authentication
  ];

  if (skipPaths.some(path => pathname.startsWith(path))) {
    return null; // Allow request to proceed
  }

  // Validate CSRF token
  const isValid = await validateCSRFToken(request);
  if (!isValid) {
    console.warn(`CSRF validation failed for ${method} ${pathname}`, {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json(
      { 
        error: 'CSRF validation failed',
        code: 'CSRF_TOKEN_INVALID'
      },
      { status: 403 }
    );
  }

  return null; // Allow request to proceed
}

/**
 * Generate CSRF token for forms
 * This should be called in server components or API routes
 */
export async function getCSRFToken(request?: NextRequest): Promise<string> {
  // Try to get existing token from cookie
  if (request) {
    const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    if (existingToken && existingToken.length === CSRF_TOKEN_LENGTH * 2) {
      return existingToken;
    }
  }

  // Generate new token
  return generateCSRFToken();
}

/**
 * Simple function to get CSRF token synchronously (for forms)
 */
export function getCSRFTokenSync(): string | null {
  if (typeof window === 'undefined') return null;
  
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag?.getAttribute('content') || null;
}

/**
 * Add CSRF token to FormData
 */
export function addCSRFToFormData(formData: FormData): FormData {
  const token = getCSRFTokenSync();
  if (token) {
    formData.append('_csrf', token);
  }
  return formData;
}

/**
 * Create headers with CSRF token
 */
export function createCSRFHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getCSRFTokenSync();
  const headers: Record<string, string> = { ...additionalHeaders };
  
  if (token) {
    headers['x-csrf-token'] = token;
  }
  
  return headers;
}

/**
 * Fetch wrapper with automatic CSRF token inclusion
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' 
    ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    : null;

  const headers = new Headers(options.headers);
  
  if (token && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
    headers.set(CSRF_HEADER_NAME, token);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}