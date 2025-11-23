# Rate Limiting Implementation

## Overview

The ERP system implements rate limiting to protect against abuse and ensure fair resource usage. Rate limiting is applied to all API routes with a limit of **100 requests per 10 seconds per IP address**.

## Implementation Details

### Configuration

- **Limit**: 100 requests per 10 seconds
- **Identifier**: Client IP address
- **Response**: 429 (Too Many Requests) when limit exceeded
- **Headers**: Rate limit information included in all API responses

### Technology Stack

The implementation supports two backends:

1. **Upstash Redis** (Production - Recommended)
   - Distributed rate limiting across multiple instances
   - Persistent storage
   - Analytics support

2. **In-Memory** (Development/Fallback)
   - No external dependencies
   - Automatic cleanup of old entries
   - Suitable for single-instance deployments

## Setup

### Using Upstash Redis (Recommended for Production)

1. Create an account at [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy your REST URL and token
4. Add to your `.env` file:

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Using In-Memory (Development)

Simply leave the Upstash environment variables empty. The system will automatically fall back to in-memory rate limiting.

## Response Headers

All API responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890000
```

When rate limited, additional header:

```
Retry-After: 8
```

## Rate Limited Response

When the rate limit is exceeded, the API returns:

```json
{
  "success": false,
  "error": "Too many requests. Please try again later."
}
```

**Status Code**: 429 (Too Many Requests)

## Testing

### Manual Testing

Use the test endpoint:

```bash
curl http://localhost:3000/api/test-rate-limit
```

### Automated Testing

Run the test script:

```bash
npm run dev  # Start the development server in another terminal
tsx scripts/test-rate-limit.ts
```

The script will:
1. Make 105 rapid requests
2. Verify that ~100 succeed and ~5 are rate limited
3. Wait 11 seconds for reset
4. Verify the rate limit has reset

## Architecture

### Middleware Flow

```
Request → Middleware → Rate Limit Check → API Route
                            ↓
                    Rate Limit Exceeded?
                            ↓
                    Return 429 Response
```

### IP Address Detection

The system checks multiple headers to determine the client IP:

1. `x-forwarded-for` (proxy/load balancer)
2. `x-real-ip` (nginx)
3. `cf-connecting-ip` (Cloudinary)
4. Fallback to "unknown"

## Monitoring

### Rate Limit Analytics

When using Upstash Redis, analytics are automatically enabled. You can view:

- Request patterns
- Rate limit hits
- Top consumers

Access analytics in the [Upstash Console](https://console.upstash.com/).

### Logging

Rate limit events are logged in the middleware. Monitor your logs for:

- Frequent 429 responses (potential abuse)
- Unusual IP patterns
- Rate limit configuration issues

## Customization

### Adjusting Limits

To change the rate limit configuration, edit `src/lib/utils/rate-limit.ts`:

```typescript
// For Upstash
rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "10 s"), // Change here
  // ...
});

// For in-memory
rateLimiter = new InMemoryRateLimiter(100, 10000); // Change here
```

### Per-Route Limits

To implement different limits for different routes, modify the middleware:

```typescript
if (apiRoutes(req)) {
  const limit = req.url.includes('/api/upload') ? 10 : 100;
  // Apply custom limit
}
```

## Security Considerations

1. **IP Spoofing**: The system trusts proxy headers. Ensure your reverse proxy is configured correctly.

2. **Distributed Systems**: Use Upstash Redis for multi-instance deployments to ensure consistent rate limiting.

3. **Bypass Prevention**: Rate limiting is applied in middleware before authentication, preventing unauthenticated abuse.

4. **DDoS Protection**: Rate limiting provides basic DDoS protection but should be combined with:
   - CDN-level protection (Cloudflare, etc.)
   - Network-level firewalls
   - Application-level monitoring

## Troubleshooting

### Issue: Rate limit not working

**Solution**: Check that:
1. Middleware is properly configured
2. Environment variables are set (if using Upstash)
3. The route matches the API pattern in middleware

### Issue: Too many false positives

**Solution**: 
1. Verify IP detection is working correctly
2. Consider increasing the limit for your use case
3. Check if multiple users share the same IP (NAT)

### Issue: Rate limit not resetting

**Solution**:
1. For Upstash: Check Redis connection
2. For in-memory: Verify cleanup is running
3. Check system time is correct

## Requirements Validation

This implementation satisfies:

- ✅ **Requirement 6.3**: Rate limiting of 100 requests per 10 seconds per IP
- ✅ Returns 429 status code when limit exceeded
- ✅ Applied to all API routes via middleware
- ✅ Includes rate limit headers in responses
- ✅ Supports both production (Upstash) and development (in-memory) modes

## Related Documentation

- [Security Implementation](./SECURITY_IMPLEMENTATION.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Middleware Configuration](./MIDDLEWARE.md)
