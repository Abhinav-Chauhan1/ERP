/**
 * IP Whitelisting Utility
 * Implements IP whitelisting for admin routes
 * Requirements: 6.4
 * 
 * Configuration:
 * - Whitelisted IPs configured via ADMIN_IP_WHITELIST environment variable
 * - Comma-separated list of IP addresses or CIDR ranges
 * - If not configured, all IPs are allowed (for development)
 */

/**
 * Parse CIDR notation to check if an IP is in range
 * @param ip - IP address to check
 * @param cidr - CIDR notation (e.g., "192.168.1.0/24")
 * @returns true if IP is in range
 */
function isIpInCidrRange(ip: string, cidr: string): boolean {
  // Handle IPv4 only for now
  if (!cidr.includes('/')) {
    // Not a CIDR range, just a single IP
    return ip === cidr;
  }

  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);

  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);

  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Convert IP address to number
 * @param ip - IP address string
 * @returns IP as number
 */
function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

/**
 * Get whitelisted IPs from environment variable
 * @returns Array of whitelisted IPs/CIDR ranges
 */
function getWhitelistedIps(): string[] {
  const whitelist = process.env.ADMIN_IP_WHITELIST;
  
  if (!whitelist || whitelist.trim() === '') {
    return [];
  }

  return whitelist
    .split(',')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0);
}

/**
 * Check if an IP address is whitelisted for admin access
 * @param ip - IP address to check
 * @returns true if IP is whitelisted or whitelist is disabled
 */
export function isIpWhitelisted(ip: string): boolean {
  const whitelistedIps = getWhitelistedIps();

  // If no whitelist is configured, allow all IPs (development mode)
  if (whitelistedIps.length === 0) {
    return true;
  }

  // Special case: allow localhost in various forms
  const localhostIps = ['127.0.0.1', '::1', 'localhost'];
  if (localhostIps.includes(ip)) {
    // Check if localhost is explicitly whitelisted
    const hasLocalhost = whitelistedIps.some(whitelistedIp => 
      localhostIps.includes(whitelistedIp)
    );
    if (hasLocalhost) {
      return true;
    }
  }

  // Check if IP matches any whitelisted IP or CIDR range
  return whitelistedIps.some(whitelistedIp => {
    try {
      return isIpInCidrRange(ip, whitelistedIp);
    } catch (error) {
      console.error(`Invalid CIDR notation: ${whitelistedIp}`, error);
      return false;
    }
  });
}

/**
 * Get client IP address from request headers
 * This is a re-export from rate-limit.ts for convenience
 * @param headers - Request headers
 * @returns IP address
 */
export function getClientIp(headers: Headers): string {
  // Try various headers that might contain the real IP
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to localhost for development
  return "127.0.0.1";
}

/**
 * Create a response for blocked IP
 * @returns Response with 403 status
 */
export function createIpBlockedResponse() {
  return new Response(
    JSON.stringify({
      success: false,
      error: "Access denied. Your IP address is not authorized to access this resource.",
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
