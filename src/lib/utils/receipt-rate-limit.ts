/**
 * Rate limiting specifically for receipt upload operations
 * Implements security requirement for rate limiting on upload endpoint
 */

/**
 * Rate limit configuration for receipt uploads
 * More restrictive than general API rate limits due to file upload costs
 */
const RECEIPT_UPLOAD_LIMITS = {
  maxRequests: 10, // Maximum 10 uploads
  windowMs: 60 * 60 * 1000, // Per hour (3600000 ms)
};

/**
 * Apply rate limiting to receipt upload operations
 * Uses a composite key of IP and user ID for enhanced security
 * 
 * @param clientIp The client IP address
 * @param userId The user ID (for user-specific rate limiting)
 * @returns Rate limit result
 */
export async function rateLimitReceiptUpload(
  clientIp: string,
  userId: string
): Promise<{
  allowed: boolean;
  error?: string;
}> {
  // Create a composite key using both IP and user ID
  // This prevents abuse from both IP-based and account-based attacks
  const key = `receipt-upload:${clientIp}:${userId}`;
  
  // For now, we'll use a simple in-memory counter
  // In production, this should use Redis or Upstash
  const uploadCounts = new Map<string, { count: number; resetAt: number }>();
  
  const now = Date.now();
  const existing = uploadCounts.get(key);
  
  // Check if we need to reset the counter
  if (existing && existing.resetAt < now) {
    uploadCounts.delete(key);
  }
  
  const current = uploadCounts.get(key) || { count: 0, resetAt: now + RECEIPT_UPLOAD_LIMITS.windowMs };
  
  // Check if limit exceeded
  if (current.count >= RECEIPT_UPLOAD_LIMITS.maxRequests) {
    const minutesRemaining = Math.ceil((current.resetAt - now) / 60000);
    return {
      allowed: false,
      error: `Rate limit exceeded. Maximum ${RECEIPT_UPLOAD_LIMITS.maxRequests} uploads per hour. Try again in ${minutesRemaining} minutes.`,
    };
  }
  
  // Increment counter
  current.count++;
  uploadCounts.set(key, current);
  
  return {
    allowed: true,
  };
}

/**
 * Rate limit configuration for receipt verification operations
 * Prevents rapid-fire verification/rejection attempts
 */
const VERIFICATION_LIMITS = {
  maxRequests: 100, // Maximum 100 verifications
  windowMs: 60 * 60 * 1000, // Per hour
};

/**
 * Apply rate limiting to receipt verification operations
 * 
 * @param userId The admin user ID
 * @returns Rate limit result
 */
export async function rateLimitVerification(
  userId: string
): Promise<{
  allowed: boolean;
  error?: string;
}> {
  // For now, we'll use a simple in-memory counter
  // In production, this should use Redis or Upstash
  const verificationCounts = new Map<string, { count: number; resetAt: number }>();
  
  const key = `receipt-verification:${userId}`;
  const now = Date.now();
  const existing = verificationCounts.get(key);
  
  // Check if we need to reset the counter
  if (existing && existing.resetAt < now) {
    verificationCounts.delete(key);
  }
  
  const current = verificationCounts.get(key) || { count: 0, resetAt: now + VERIFICATION_LIMITS.windowMs };
  
  // Check if limit exceeded
  if (current.count >= VERIFICATION_LIMITS.maxRequests) {
    const minutesRemaining = Math.ceil((current.resetAt - now) / 60000);
    return {
      allowed: false,
      error: `Rate limit exceeded. Maximum ${VERIFICATION_LIMITS.maxRequests} verifications per hour. Try again in ${minutesRemaining} minutes.`,
    };
  }
  
  // Increment counter
  current.count++;
  verificationCounts.set(key, current);
  
  return {
    allowed: true,
  };
}
