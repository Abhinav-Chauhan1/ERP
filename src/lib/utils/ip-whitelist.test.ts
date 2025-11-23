/**
 * Tests for IP Whitelisting Utility
 * Requirements: 6.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock environment variable
const originalEnv = process.env.ADMIN_IP_WHITELIST;

// We need to dynamically import to test with different env values
async function getIpWhitelistModule() {
  // Clear the module cache
  delete require.cache[require.resolve('./ip-whitelist')];
  return await import('./ip-whitelist');
}

describe('IP Whitelisting', () => {
  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.ADMIN_IP_WHITELIST = originalEnv;
    } else {
      delete process.env.ADMIN_IP_WHITELIST;
    }
  });

  describe('isIpWhitelisted', () => {
    it('should allow all IPs when whitelist is not configured', async () => {
      delete process.env.ADMIN_IP_WHITELIST;
      const { isIpWhitelisted } = await getIpWhitelistModule();
      
      expect(isIpWhitelisted('192.168.1.1')).toBe(true);
      expect(isIpWhitelisted('10.0.0.1')).toBe(true);
      expect(isIpWhitelisted('8.8.8.8')).toBe(true);
    });

    it('should allow whitelisted single IP', async () => {
      process.env.ADMIN_IP_WHITELIST = '192.168.1.100';
      const { isIpWhitelisted } = await getIpWhitelistModule();
      
      expect(isIpWhitelisted('192.168.1.100')).toBe(true);
      expect(isIpWhitelisted('192.168.1.101')).toBe(false);
    });

    it('should allow multiple whitelisted IPs', async () => {
      process.env.ADMIN_IP_WHITELIST = '192.168.1.100,10.0.0.50,172.16.0.1';
      const { isIpWhitelisted } = await getIpWhitelistModule();
      
      expect(isIpWhitelisted('192.168.1.100')).toBe(true);
      expect(isIpWhitelisted('10.0.0.50')).toBe(true);
      expect(isIpWhitelisted('172.16.0.1')).toBe(true);
      expect(isIpWhitelisted('192.168.1.101')).toBe(false);
    });

    it('should handle whitespace in IP list', async () => {
      process.env.ADMIN_IP_WHITELIST = ' 192.168.1.100 , 10.0.0.50 , 172.16.0.1 ';
      const { isIpWhitelisted } = await getIpWhitelistModule();
      
      expect(isIpWhitelisted('192.168.1.100')).toBe(true);
      expect(isIpWhitelisted('10.0.0.50')).toBe(true);
      expect(isIpWhitelisted('172.16.0.1')).toBe(true);
    });

    it('should support CIDR notation', async () => {
      process.env.ADMIN_IP_WHITELIST = '192.168.1.0/24';
      const { isIpWhitelisted } = await getIpWhitelistModule();
      
      expect(isIpWhitelisted('192.168.1.1')).toBe(true);
      expect(isIpWhitelisted('192.168.1.100')).toBe(true);
      expect(isIpWhitelisted('192.168.1.255')).toBe(true);
      expect(isIpWhitelisted('192.168.2.1')).toBe(false);
    });

    it('should support multiple CIDR ranges', async () => {
      process.env.ADMIN_IP_WHITELIST = '192.168.1.0/24,10.0.0.0/16';
      const { isIpWhitelisted } = await getIpWhitelistModule();
      
      expect(isIpWhitelisted('192.168.1.50')).toBe(true);
      expect(isIpWhitelisted('10.0.5.100')).toBe(true);
      expect(isIpWhitelisted('172.16.0.1')).toBe(false);
    });

    it('should allow localhost when explicitly whitelisted', async () => {
      process.env.ADMIN_IP_WHITELIST = '127.0.0.1,192.168.1.100';
      const { isIpWhitelisted } = await getIpWhitelistModule();
      
      expect(isIpWhitelisted('127.0.0.1')).toBe(true);
      expect(isIpWhitelisted('::1')).toBe(true);
      expect(isIpWhitelisted('localhost')).toBe(true);
    });

    it('should block localhost when not whitelisted', async () => {
      process.env.ADMIN_IP_WHITELIST = '192.168.1.100';
      const { isIpWhitelisted } = await getIpWhitelistModule();
      
      expect(isIpWhitelisted('127.0.0.1')).toBe(false);
      expect(isIpWhitelisted('::1')).toBe(false);
      expect(isIpWhitelisted('localhost')).toBe(false);
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const { getClientIp } = await getIpWhitelistModule();
      const headers = new Headers();
      headers.set('x-forwarded-for', '192.168.1.100, 10.0.0.1');
      
      expect(getClientIp(headers)).toBe('192.168.1.100');
    });

    it('should extract IP from x-real-ip header', async () => {
      const { getClientIp } = await getIpWhitelistModule();
      const headers = new Headers();
      headers.set('x-real-ip', '192.168.1.100');
      
      expect(getClientIp(headers)).toBe('192.168.1.100');
    });

    it('should extract IP from cf-connecting-ip header', async () => {
      const { getClientIp } = await getIpWhitelistModule();
      const headers = new Headers();
      headers.set('cf-connecting-ip', '192.168.1.100');
      
      expect(getClientIp(headers)).toBe('192.168.1.100');
    });

    it('should prioritize x-forwarded-for over other headers', async () => {
      const { getClientIp } = await getIpWhitelistModule();
      const headers = new Headers();
      headers.set('x-forwarded-for', '192.168.1.100');
      headers.set('x-real-ip', '10.0.0.1');
      headers.set('cf-connecting-ip', '172.16.0.1');
      
      expect(getClientIp(headers)).toBe('192.168.1.100');
    });

    it('should return localhost as fallback', async () => {
      const { getClientIp } = await getIpWhitelistModule();
      const headers = new Headers();
      
      expect(getClientIp(headers)).toBe('127.0.0.1');
    });
  });

  describe('createIpBlockedResponse', () => {
    it('should create a 403 response', async () => {
      const { createIpBlockedResponse } = await getIpWhitelistModule();
      const response = createIpBlockedResponse();
      
      expect(response.status).toBe(403);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Access denied');
    });
  });
});
