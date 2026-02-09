import { NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/middleware/csrf-protection';

export async function GET() {
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
