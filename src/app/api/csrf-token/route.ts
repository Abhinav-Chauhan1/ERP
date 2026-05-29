import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/middleware/csrf-protection';
import { rateLimit } from '@/lib/middleware/rate-limit';

const csrfRateLimitConfig = { windowMs: 60 * 1000, max: 20 };

export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, csrfRateLimitConfig);
  if (rateLimitResult) return rateLimitResult;

  try {
    const token = generateCSRFToken();
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
