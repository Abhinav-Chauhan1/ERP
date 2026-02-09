# IP Whitelisting Quick Reference

## Quick Start

### Development (Allow All)
```env
# .env
ADMIN_IP_WHITELIST=
```

### Production (Restrict Access)
```env
# .env
ADMIN_IP_WHITELIST=192.168.1.100,10.0.0.0/16,127.0.0.1
```

## Common Configurations

| Scenario | Configuration | Description |
|----------|--------------|-------------|
| **Development** | `ADMIN_IP_WHITELIST=` | Allow all IPs |
| **Single Admin** | `ADMIN_IP_WHITELIST=203.0.113.45` | One specific IP |
| **Office Network** | `ADMIN_IP_WHITELIST=192.168.1.0/24` | Entire subnet |
| **Multiple Offices** | `ADMIN_IP_WHITELIST=192.168.1.0/24,10.0.0.0/16` | Multiple subnets |
| **VPN + Office** | `ADMIN_IP_WHITELIST=192.168.1.0/24,203.0.113.0/24` | Office + VPN range |
| **With Localhost** | `ADMIN_IP_WHITELIST=192.168.1.100,127.0.0.1` | Specific IP + local |

## CIDR Cheat Sheet

| CIDR | Subnet Mask | # of IPs | Example Range |
|------|-------------|----------|---------------|
| /32 | 255.255.255.255 | 1 | Single IP |
| /24 | 255.255.255.0 | 256 | 192.168.1.0 - 192.168.1.255 |
| /16 | 255.255.0.0 | 65,536 | 10.0.0.0 - 10.0.255.255 |
| /12 | 255.240.0.0 | 1,048,576 | 172.16.0.0 - 172.31.255.255 |
| /8 | 255.0.0.0 | 16,777,216 | 10.0.0.0 - 10.255.255.255 |

## Testing

### Run Tests
```bash
npx tsx scripts/test-ip-whitelist.ts
```

### Check Your IP
```bash
curl https://api.ipify.org
```

### Test Access
1. Configure whitelist with your IP
2. Try accessing `/admin` route
3. Should work if IP is whitelisted
4. Should get 403 if not whitelisted

## Troubleshooting

### Problem: Can't access admin panel

**Solution 1**: Check your current IP
```bash
curl https://api.ipify.org
```

**Solution 2**: Add your IP to whitelist
```env
ADMIN_IP_WHITELIST=YOUR_IP_HERE,127.0.0.1
```

**Solution 3**: Temporarily disable (development only)
```env
ADMIN_IP_WHITELIST=
```

### Problem: Whitelist not working

**Check 1**: Restart the application after changing `.env`

**Check 2**: Verify environment variable is loaded
```typescript
console.log(process.env.ADMIN_IP_WHITELIST);
```

**Check 3**: Check application logs for blocked IP
```
Blocked admin access from non-whitelisted IP: 203.0.113.45
```

## Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | ✅ IP whitelisted | Access granted |
| 403 | ❌ IP not whitelisted | Access denied |
| 401 | ❌ Not authenticated | Login required |

## Security Checklist

- [ ] Configure `ADMIN_IP_WHITELIST` in production
- [ ] Use CIDR notation for network ranges
- [ ] Include VPN exit IPs if applicable
- [ ] Test access from whitelisted IPs
- [ ] Test blocking from non-whitelisted IPs
- [ ] Monitor logs for blocked attempts
- [ ] Document whitelisted IPs for team
- [ ] Review whitelist quarterly

## API Reference

### Check if IP is whitelisted
```typescript
import { isIpWhitelisted } from '@/lib/utils/ip-whitelist';

if (isIpWhitelisted('192.168.1.100')) {
  // Allow access
}
```

### Get client IP
```typescript
import { getClientIp } from '@/lib/utils/ip-whitelist';

const ip = getClientIp(request.headers);
```

### Create blocked response
```typescript
import { createIpBlockedResponse } from '@/lib/utils/ip-whitelist';

return createIpBlockedResponse(); // Returns 403
```

## Environment Variables

```env
# IP Whitelisting for Admin Routes
# Comma-separated list of IPs or CIDR ranges
# Leave empty to allow all IPs (development mode)
ADMIN_IP_WHITELIST=192.168.1.100,10.0.0.0/16,127.0.0.1
```

## Documentation

- **Full Guide**: `docs/IP_WHITELISTING_GUIDE.md`
- **Implementation**: `docs/IP_WHITELISTING_IMPLEMENTATION_SUMMARY.md`
- **Code**: `src/lib/utils/ip-whitelist.ts`
- **Tests**: `scripts/test-ip-whitelist.ts`

## Support

For issues:
1. Check this quick reference
2. Review full guide: `docs/IP_WHITELISTING_GUIDE.md`
3. Check application logs
4. Verify your IP address
5. Test with whitelist disabled

---

**Requirement**: 6.4 - IP Whitelisting for Admin Routes  
**Status**: ✅ Implemented and Tested
