import { NextRequest } from 'next/server';

/**
 * IP Whitelisting for Vercel and trusted infrastructure
 * 
 * This module provides IP whitelisting functionality to bypass rate limiting
 * for trusted sources like Vercel's infrastructure, monitoring services, etc.
 */

// Parse environment variable IPs
function parseEnvIps(envVar: string | undefined): string[] {
  if (!envVar) return [];
  return envVar.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
}

// Vercel's IP ranges (these are approximate - Vercel uses dynamic IPs)
// For production, you should use Vercel's actual IP ranges or use header-based detection
const VERCEL_IP_RANGES = [
  '76.76.21.0/24',    // Vercel infrastructure
  '76.76.21.21',      // Vercel health checks
  '76.223.0.0/16',    // Vercel edge network
];

// Load IPs from environment variables
const MONITORING_IPS = parseEnvIps(process.env.MONITORING_SERVICE_IPS);
const TRUSTED_IPS = [
  '127.0.0.1',        // Localhost
  '::1',              // IPv6 localhost
  ...parseEnvIps(process.env.TRUSTED_IPS),
  ...parseEnvIps(process.env.WHITELISTED_IPS),
];

/**
 * Get the real client IP from request headers
 * Handles various proxy headers used by Vercel, Cloudflare, etc.
 */
export function getClientIp(request: NextRequest): string {
  // Try various headers in order of preference
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for'); // Vercel
  
  // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
  // The first IP is the original client
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  return vercelForwardedFor || cfConnectingIp || realIp || 'unknown';
}

/**
 * Check if an IP is in a CIDR range
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  // Simple CIDR check - for production, use a proper IP library like 'ipaddr.js'
  if (!cidr.includes('/')) {
    return ip === cidr;
  }
  
  // For now, just do exact match for single IPs
  // In production, implement proper CIDR matching
  return ip === cidr.split('/')[0];
}

/**
 * Check if IP is whitelisted
 */
export function isIpWhitelisted(ip: string): boolean {
  const allWhitelistedIps = [
    ...VERCEL_IP_RANGES,
    ...MONITORING_IPS,
    ...TRUSTED_IPS,
  ];
  
  return allWhitelistedIps.some(whitelistedIp => 
    isIpInCidr(ip, whitelistedIp)
  );
}

/**
 * Check if request is from Vercel infrastructure
 * Uses multiple detection methods for reliability
 */
export function isVercelInfrastructure(request: NextRequest): boolean {
  // Method 1: Check Vercel-specific headers
  const vercelId = request.headers.get('x-vercel-id');
  const vercelDeploymentUrl = request.headers.get('x-vercel-deployment-url');
  
  if (vercelId || vercelDeploymentUrl) {
    return true;
  }
  
  // Method 2: Check if it's a Vercel preview deployment
  if (process.env.VERCEL_ENV === 'preview') {
    return true;
  }
  
  // Method 3: Check user agent for Vercel bots
  const userAgent = request.headers.get('user-agent') || '';
  if (userAgent.toLowerCase().includes('vercel')) {
    return true;
  }
  
  // Method 4: Check IP whitelist
  const clientIp = getClientIp(request);
  if (isIpWhitelisted(clientIp)) {
    return true;
  }
  
  return false;
}

/**
 * Check if request is from a monitoring service
 */
export function isMonitoringService(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const monitoringAgents = [
    'uptimerobot',
    'pingdom',
    'newrelic',
    'datadog',
    'statuspage',
    'googlehc', // Google Health Check
  ];
  
  const lowerUserAgent = userAgent.toLowerCase();
  if (monitoringAgents.some(agent => lowerUserAgent.includes(agent))) {
    return true;
  }
  
  // Check IP whitelist
  const clientIp = getClientIp(request);
  return MONITORING_IPS.some(ip => isIpInCidr(clientIp, ip));
}

/**
 * Check if request should bypass rate limiting
 * This is the main function to use in middleware
 */
export function shouldBypassRateLimit(request: NextRequest): boolean {
  // Always bypass in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Bypass for Vercel infrastructure
  if (isVercelInfrastructure(request)) {
    return true;
  }
  
  // Bypass for monitoring services
  if (isMonitoringService(request)) {
    return true;
  }
  
  // Check if IP is in trusted list
  const clientIp = getClientIp(request);
  if (TRUSTED_IPS.some(ip => isIpInCidr(clientIp, ip))) {
    return true;
  }
  
  return false;
}

/**
 * Get bypass reason for logging purposes
 */
export function getBypassReason(request: NextRequest): string | null {
  if (process.env.NODE_ENV === 'development') {
    return 'development_environment';
  }
  
  if (isVercelInfrastructure(request)) {
    return 'vercel_infrastructure';
  }
  
  if (isMonitoringService(request)) {
    return 'monitoring_service';
  }
  
  const clientIp = getClientIp(request);
  if (TRUSTED_IPS.some(ip => isIpInCidr(clientIp, ip))) {
    return 'trusted_ip';
  }
  
  return null;
}

/**
 * Add custom whitelisted IPs at runtime (for admin configuration)
 */
const runtimeWhitelistedIps: string[] = [];

export function addWhitelistedIp(ip: string): void {
  if (!runtimeWhitelistedIps.includes(ip)) {
    runtimeWhitelistedIps.push(ip);
  }
}

export function removeWhitelistedIp(ip: string): void {
  const index = runtimeWhitelistedIps.indexOf(ip);
  if (index > -1) {
    runtimeWhitelistedIps.splice(index, 1);
  }
}

export function getWhitelistedIps(): string[] {
  return [
    ...VERCEL_IP_RANGES,
    ...MONITORING_IPS,
    ...TRUSTED_IPS,
    ...runtimeWhitelistedIps,
  ];
}
