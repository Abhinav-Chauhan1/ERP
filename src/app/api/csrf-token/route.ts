import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFTokenCookie } from '@/lib/middleware/csrf-protection';

/**
 * CSRF Token API Endpoint
 * Provides CSRF tokens for client-side forms and AJAX requests
 */

export async function GET(request: NextRequest) {
  try {
    // Generate a new CSRF token
    const token = generateCSRFToken();
    
    // Create response with token
    const response = NextResponse.json({
      token,
      success: true
    });

    // Set the token in a secure cookie
    setCSRFTokenCookie(response, token);

    // Add security headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Error generating CSRF token:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate CSRF token',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // POST method can be used to refresh the token
  return GET(request);
}