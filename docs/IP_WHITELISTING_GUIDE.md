# IP Whitelisting Guide

## Overview

IP whitelisting is a security feature that restricts access to admin routes based on the client's IP address. This ensures that only authorized IP addresses can access sensitive administrative functions.

**Requirements:** 6.4

## Configuration

### Environment Variable

Add the `ADMIN_IP_WHITELIST` environment variable to your `.env` file:

```env
# IP Whitelisting for Admin Routes
# Comma-separated list of IP addresses or CIDR ranges
ADMIN_IP_WHITELIST=192.168.1.100,10.0.0.0/16,127.0.0.1
```

### Configuration Options

#### 1. No Configuration (Development Mode)
If `ADMIN_IP_WHITELIST` is not set or is empty, **all IP addresses are allowed**. This is useful for development environments.

```env
ADMIN_IP_WHITELIST=
```

#### 2. Single IP Address
Allow access from a specific IP address:

```env
ADMIN_IP_WHITELIST=192.168.1.100
```

#### 3. Multiple IP Addresses
Allow access from multiple specific IP addresses (comma-separated):

```env
ADMIN_IP_WHITELIST=192.168.1.100,10.0.0.50,172.16.0.1
```

#### 4. CIDR Notation (IP Range)
Allow access from an entire IP range using CIDR notation:

```env
# Allow all IPs from 192.168.1.0 to 192.168.1.255
ADMIN_IP_WHITELIST=192.168.1.0/24
```

#### 5. Multiple CIDR Ranges
Combine multiple CIDR ranges:

```env
ADMIN_IP_WHITELIST=192.168.1.0/24,10.0.0.0/16
```

#### 6. Mixed Configuration
Combine individual IPs and CIDR ranges:

```env
ADMIN_IP_WHITELIST=192.168.1.100,10.0.0.0/16,172.16.0.1,127.0.0.1
```

## How It Works

### 1. Middleware Integration
The IP whitelisting check is integrated into the Next.js middleware (`src/middleware.ts`) and runs before any admin route is accessed.

### 2. IP Extraction
The system extracts the client IP from the following headers (in order of priority):
- `x-forwarded-for` (first IP in the list)
- `x-real-ip`
- `cf-connecting-ip`
- Fallback: `127.0.0.1` (localhost)

### 3. Whitelist Check
When a user tries to access an admin route:
1. The middleware extracts the client IP
2. Checks if the IP is in the whitelist
3. If whitelisted: allows access
4. If not whitelisted: returns 403 Forbidden response

### 4. Response
Non-whitelisted IPs receive a JSON response:

```json
{
  "success": false,
  "error": "Access denied. Your IP address is not authorized to access this resource."
}
```

## Localhost Handling

Localhost IPs (`127.0.0.1`, `::1`, `localhost`) are treated specially:
- If `127.0.0.1` is in the whitelist, all localhost variants are allowed
- If `127.0.0.1` is NOT in the whitelist, all localhost variants are blocked

## CIDR Notation Examples

| CIDR | IP Range | Number of IPs |
|------|----------|---------------|
| `192.168.1.0/24` | 192.168.1.0 - 192.168.1.255 | 256 |
| `10.0.0.0/16` | 10.0.0.0 - 10.0.255.255 | 65,536 |
| `172.16.0.0/12` | 172.16.0.0 - 172.31.255.255 | 1,048,576 |

## Production Deployment

### Step 1: Identify Admin IPs
Determine which IP addresses should have admin access:
- Office network IP
- VPN IP range
- Specific administrator home IPs

### Step 2: Configure Environment Variable
Add the whitelist to your production environment:

```bash
# For Vercel
vercel env add ADMIN_IP_WHITELIST production

# For other platforms, add to your environment configuration
```

### Step 3: Test Access
1. Try accessing admin routes from a whitelisted IP - should work
2. Try accessing admin routes from a non-whitelisted IP - should be blocked with 403

### Step 4: Monitor Logs
Check your application logs for blocked access attempts:

```
Blocked admin access from non-whitelisted IP: 203.0.113.45
```

## Security Best Practices

1. **Use CIDR Ranges for Networks**: If your office has a static IP range, use CIDR notation instead of listing individual IPs

2. **Include VPN IPs**: If administrators use VPN, whitelist the VPN exit IPs

3. **Regular Audits**: Periodically review and update the whitelist

4. **Combine with Other Security**: IP whitelisting should be used alongside:
   - Strong authentication (2FA)
   - Role-based access control
   - Audit logging
   - Rate limiting

5. **Emergency Access**: Keep a backup method to access admin functions if IP whitelisting causes issues

## Troubleshooting

### Issue: Admin can't access from whitelisted IP

**Possible causes:**
1. IP address changed (dynamic IP)
2. Using VPN with different exit IP
3. Proxy or load balancer changing the IP

**Solution:**
- Check the actual IP being sent to the server
- Add the new IP to the whitelist
- Consider using CIDR ranges for dynamic IPs

### Issue: All IPs are blocked

**Possible causes:**
1. Whitelist configured but doesn't include the admin's IP
2. Incorrect CIDR notation

**Solution:**
- Verify the `ADMIN_IP_WHITELIST` environment variable
- Test CIDR notation with online calculators
- Temporarily remove the whitelist to regain access

### Issue: Localhost blocked in development

**Solution:**
Add `127.0.0.1` to the whitelist:

```env
ADMIN_IP_WHITELIST=127.0.0.1
```

Or leave the whitelist empty for development:

```env
ADMIN_IP_WHITELIST=
```

## Testing

Run the test script to verify IP whitelisting functionality:

```bash
npx tsx scripts/test-ip-whitelist.ts
```

## API Reference

### `isIpWhitelisted(ip: string): boolean`
Checks if an IP address is whitelisted.

```typescript
import { isIpWhitelisted } from '@/lib/utils/ip-whitelist';

if (isIpWhitelisted('192.168.1.100')) {
  // Allow access
}
```

### `getClientIp(headers: Headers): string`
Extracts the client IP from request headers.

```typescript
import { getClientIp } from '@/lib/utils/ip-whitelist';

const ip = getClientIp(request.headers);
```

### `createIpBlockedResponse(): Response`
Creates a 403 Forbidden response for blocked IPs.

```typescript
import { createIpBlockedResponse } from '@/lib/utils/ip-whitelist';

if (!isIpWhitelisted(ip)) {
  return createIpBlockedResponse();
}
```

## Related Features

- **Rate Limiting**: Protects against brute force attacks (Requirement 6.3)
- **Audit Logging**: Tracks all admin actions (Requirement 6.2)
- **Two-Factor Authentication**: Additional security layer (Requirement 6.1)
- **Session Timeout**: Automatic session termination (Requirement 6.5)

## Support

For issues or questions about IP whitelisting:
1. Check the troubleshooting section above
2. Review the application logs for blocked access messages
3. Verify your IP address matches the whitelist configuration
