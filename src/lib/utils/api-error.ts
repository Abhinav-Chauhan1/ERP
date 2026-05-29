/**
 * Standardised API error helper.
 *
 * Use this instead of leaking raw `error.message` to clients:
 *   return apiError('Internal server error', 500);
 *   return apiError('Not found', 404);
 *
 * In development the original error is included for debugging.
 */

import { NextResponse } from 'next/server';

export function apiError(
  message: string,
  status: number,
  cause?: unknown,
): NextResponse {
  if (process.env.NODE_ENV === 'development' && cause) {
    console.error(`[api-error] ${message}`, cause);
  }
  return NextResponse.json({ error: message }, { status });
}
