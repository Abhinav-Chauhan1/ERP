import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { rateLimit, rateLimitConfigs, clearRateLimit } from '@/lib/middleware/rate-limit';

describe('Rate Limiting Integration Tests', () => {
  beforeEach(() => {
    // Clear any existing rate limit data
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up rate limit store
    clearRateLimit('test-client');
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      // Arrange
      const config = {
        windowMs: 60000, // 1 minute
        max: 5,
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'test-agent',
        },
      });

      // Act & Assert
      for (let i = 0; i < 5; i++) {
        const result = await rateLimit(request, config);
        expect(result).toBeNull(); // Should allow request
      }
    });

    it('should block requests exceeding rate limit', async () => {
      // Arrange
      const config = {
        windowMs: 60000, // 1 minute
        max: 3,
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.2',
          'user-agent': 'test-agent',
        },
      });

      // Act
      // Allow first 3 requests
      for (let i = 0; i < 3; i++) {
        const result = await rateLimit(request, config);
        expect(result).toBeNull();
      }

      // Block 4th request
      const blockedResult = await rateLimit(request, config);

      // Assert
      expect(blockedResult).not.toBeNull();
      expect(blockedResult?.status).toBe(429);
      
      const responseData = await blockedResult?.json();
      expect(responseData.error).toBe('Too many requests');
      expect(responseData.limit).toBe(3);
      expect(responseData.retryAfter).toBeGreaterThan(0);
    });

    it('should reset rate limit after window expires', async () => {
      // Arrange
      const config = {
        windowMs: 100, // 100ms for quick test
        max: 2,
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.3',
          'user-agent': 'test-agent',
        },
      });

      // Act
      // Use up the rate limit
      await rateLimit(request, config);
      await rateLimit(request, config);
      
      // Should be blocked
      const blockedResult = await rateLimit(request, config);
      expect(blockedResult?.status).toBe(429);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be allowed again
      const allowedResult = await rateLimit(request, config);
      expect(allowedResult).toBeNull();
    });
  });

  describe('Client Identification', () => {
    it('should differentiate between different IP addresses', async () => {
      // Arrange
      const config = {
        windowMs: 60000,
        max: 1,
      };

      const request1 = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.10',
          'user-agent': 'test-agent',
        },
      });

      const request2 = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.11',
          'user-agent': 'test-agent',
        },
      });

      // Act
      const result1 = await rateLimit(request1, config);
      const result2 = await rateLimit(request2, config);

      // Assert
      expect(result1).toBeNull(); // First IP should be allowed
      expect(result2).toBeNull(); // Second IP should also be allowed
    });

    it('should differentiate between different user agents', async () => {
      // Arrange
      const config = {
        windowMs: 60000,
        max: 1,
      };

      const request1 = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.20',
          'user-agent': 'browser-agent',
        },
      });

      const request2 = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.20', // Same IP
          'user-agent': 'mobile-agent', // Different user agent
        },
      });

      // Act
      const result1 = await rateLimit(request1, config);
      const result2 = await rateLimit(request2, config);

      // Assert
      expect(result1).toBeNull(); // First user agent should be allowed
      expect(result2).toBeNull(); // Second user agent should also be allowed
    });

    it('should handle missing headers gracefully', async () => {
      // Arrange
      const config = {
        windowMs: 60000,
        max: 2,
      };

      const request = new NextRequest('http://localhost:3000/api/test');

      // Act
      const result1 = await rateLimit(request, config);
      const result2 = await rateLimit(request, config);
      const result3 = await rateLimit(request, config);

      // Assert
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3?.status).toBe(429); // Should be blocked
    });
  });

  describe('Proxy Header Support', () => {
    it('should use x-forwarded-for header', async () => {
      // Arrange
      const config = {
        windowMs: 60000,
        max: 1,
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1',
          'user-agent': 'test-agent',
        },
      });

      // Act
      const result1 = await rateLimit(request, config);
      const result2 = await rateLimit(request, config);

      // Assert
      expect(result1).toBeNull();
      expect(result2?.status).toBe(429);
    });

    it('should use x-real-ip header when available', async () => {
      // Arrange
      const config = {
        windowMs: 60000,
        max: 1,
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': '203.0.113.2',
          'user-agent': 'test-agent',
        },
      });

      // Act
      const result1 = await rateLimit(request, config);
      const result2 = await rateLimit(request, config);

      // Assert
      expect(result1).toBeNull();
      expect(result2?.status).toBe(429);
    });

    it('should use cf-connecting-ip header for Cloudflare', async () => {
      // Arrange
      const config = {
        windowMs: 60000,
        max: 1,
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'cf-connecting-ip': '203.0.113.3',
          'user-agent': 'test-agent',
        },
      });

      // Act
      const result1 = await rateLimit(request, config);
      const result2 = await rateLimit(request, config);

      // Assert
      expect(result1).toBeNull();
      expect(result2?.status).toBe(429);
    });
  });

  describe('Predefined Configurations', () => {
    it('should apply critical rate limit configuration', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/critical', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'test-agent',
        },
      });

      // Act
      const results = [];
      for (let i = 0; i < 7; i++) {
        const result = await rateLimit(request, rateLimitConfigs.critical);
        results.push(result);
      }

      // Assert
      // First 5 should be allowed (critical config max: 5)
      expect(results.slice(0, 5).every(r => r === null)).toBe(true);
      // 6th and 7th should be blocked
      expect(results[5]?.status).toBe(429);
      expect(results[6]?.status).toBe(429);
    });

    it('should apply standard rate limit configuration', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/standard', {
        headers: {
          'x-forwarded-for': '192.168.1.101',
          'user-agent': 'test-agent',
        },
      });

      // Act
      const results = [];
      for (let i = 0; i < 102; i++) {
        const result = await rateLimit(request, rateLimitConfigs.standard);
        results.push(result);
      }

      // Assert
      // First 100 should be allowed (standard config max: 100)
      expect(results.slice(0, 100).every(r => r === null)).toBe(true);
      // 101st and 102nd should be blocked
      expect(results[100]?.status).toBe(429);
      expect(results[101]?.status).toBe(429);
    });
  });

  describe('Custom Error Messages', () => {
    it('should use custom error message when provided', async () => {
      // Arrange
      const config = {
        windowMs: 60000,
        max: 1,
        message: 'Custom rate limit exceeded',
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.200',
          'user-agent': 'test-agent',
        },
      });

      // Act
      await rateLimit(request, config); // Use up the limit
      const blockedResult = await rateLimit(request, config);

      // Assert
      expect(blockedResult?.status).toBe(429);
      const responseData = await blockedResult?.json();
      expect(responseData.error).toBe('Custom rate limit exceeded');
    });
  });

  describe('Response Headers', () => {
    it('should include rate limit headers in response', async () => {
      // Arrange
      const config = {
        windowMs: 60000,
        max: 5,
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.300',
          'user-agent': 'test-agent',
        },
      });

      // Act
      await rateLimit(request, config); // First request
      const blockedResult = await rateLimit(request, config); // Second request
      
      // Use up remaining requests
      await rateLimit(request, config);
      await rateLimit(request, config);
      await rateLimit(request, config);
      
      // This should be blocked
      const finalResult = await rateLimit(request, config);

      // Assert
      expect(finalResult?.status).toBe(429);
      expect(finalResult?.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(finalResult?.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(finalResult?.headers.get('X-RateLimit-Reset')).toBeDefined();
      expect(finalResult?.headers.get('Retry-After')).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should clean up expired entries', async () => {
      // This test verifies that the cleanup mechanism works
      // In a real scenario, this would be tested with longer time periods
      
      // Arrange
      const config = {
        windowMs: 50, // Very short window for testing
        max: 1,
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.400',
          'user-agent': 'test-agent',
        },
      });

      // Act
      await rateLimit(request, config); // Create entry
      
      // Wait for cleanup interval (mocked in real implementation)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should be able to make request again
      const result = await rateLimit(request, config);

      // Assert
      expect(result).toBeNull(); // Should be allowed after cleanup
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests correctly', async () => {
      // Arrange
      const config = {
        windowMs: 60000,
        max: 5,
      };

      const createRequest = () => new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.500',
          'user-agent': 'test-agent',
        },
      });

      // Act
      const promises = Array.from({ length: 10 }, () => 
        rateLimit(createRequest(), config)
      );
      
      const results = await Promise.all(promises);

      // Assert
      const allowedCount = results.filter(r => r === null).length;
      const blockedCount = results.filter(r => r?.status === 429).length;
      
      expect(allowedCount).toBe(5); // Should allow exactly 5
      expect(blockedCount).toBe(5); // Should block exactly 5
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero max limit', async () => {
      // Arrange
      const config = {
        windowMs: 60000,
        max: 0,
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.600',
          'user-agent': 'test-agent',
        },
      });

      // Act
      const result = await rateLimit(request, config);

      // Assert
      expect(result?.status).toBe(429); // Should be immediately blocked
    });

    it('should handle very large max limit', async () => {
      // Arrange
      const config = {
        windowMs: 60000,
        max: 1000000,
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.700',
          'user-agent': 'test-agent',
        },
      });

      // Act
      const results = [];
      for (let i = 0; i < 100; i++) {
        const result = await rateLimit(request, config);
        results.push(result);
      }

      // Assert
      expect(results.every(r => r === null)).toBe(true); // All should be allowed
    });

    it('should handle very short window', async () => {
      // Arrange
      const config = {
        windowMs: 1, // 1ms window
        max: 1,
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.800',
          'user-agent': 'test-agent',
        },
      });

      // Act
      const result1 = await rateLimit(request, config);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 5));
      
      const result2 = await rateLimit(request, config);

      // Assert
      expect(result1).toBeNull(); // First should be allowed
      expect(result2).toBeNull(); // Second should be allowed after window expires
    });
  });
});