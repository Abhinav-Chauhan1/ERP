/**
 * CSRF Protection Utility
 * Implements CSRF token generation and verification for form submissions
 * Requirements: 10.1, 10.2
 */

import { cookies } from "next/headers";
import crypto from "crypto";

const CSRF_TOKEN_NAME = "csrf_token";
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Generate a random CSRF token
 */
function generateToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Generate and store a CSRF token in cookies
 * Returns the token to be included in forms
 */
export async function generateCsrfToken(): Promise<string> {
  const token = generateToken();
  const cookieStore = await cookies();
  
  // Store token in HTTP-only cookie with expiry
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_TOKEN_EXPIRY / 1000, // Convert to seconds
    path: "/",
  });
  
  return token;
}

/**
 * Verify CSRF token from request against stored token
 * Returns true if valid, false otherwise
 */
export async function verifyCsrfToken(token: string | null | undefined): Promise<boolean> {
  if (!token) {
    return false;
  }
  
  const cookieStore = await cookies();
  const storedToken = cookieStore.get(CSRF_TOKEN_NAME);
  
  if (!storedToken || !storedToken.value) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken.value)
  );
}

/**
 * Delete CSRF token from cookies
 * Should be called after successful form submission
 */
export async function deleteCsrfToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_TOKEN_NAME);
}

/**
 * Refresh CSRF token
 * Generates a new token and replaces the old one
 */
export async function refreshCsrfToken(): Promise<string> {
  await deleteCsrfToken();
  return await generateCsrfToken();
}

/**
 * Get current CSRF token from cookies without generating a new one
 * Returns null if no token exists
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_TOKEN_NAME);
  return token?.value || null;
}

/**
 * Middleware helper to validate CSRF token from FormData or JSON body
 * Throws error if token is invalid
 */
export async function validateCsrfToken(
  tokenFromRequest: string | null | undefined
): Promise<void> {
  const isValid = await verifyCsrfToken(tokenFromRequest);
  
  if (!isValid) {
    throw new Error("Invalid CSRF token");
  }
}
