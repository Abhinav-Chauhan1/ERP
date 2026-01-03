# MSG91 Migration Quick Reference

## Quick Start

### Enable MSG91

```bash
# .env file
USE_MSG91=true
MSG91_AUTH_KEY=your_auth_key
MSG91_SENDER_ID=SCHOOL
MSG91_ROUTE=transactional
MSG91_COUNTRY=91
```

### Disable MSG91 (Rollback to Twilio)

```bash
# .env file
USE_MSG91=false
```

## Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `USE_MSG91` | `true` or `false` | Yes |
| `MSG91_AUTH_KEY` | Your MSG91 auth key | Yes (if USE_MSG91=true) |
| `MSG91_SENDER_ID` | Your sender ID (e.g., SCHOOL) | Yes (if USE_MSG91=true) |
| `MSG91_ROUTE` | `transactional` or `promotional` | No (default: transactional) |
| `MSG91_COUNTRY` | Country code (e.g., 91 for India) | No (default: 91) |

## Code Changes

### Sending SMS (Backward Compatible)

```typescript
// Works with both Twilio and MSG91
import { sendSMS } from '@/lib/services/sms-service';

// Basic usage (works with both providers)
await sendSMS('+919876543210', 'Your message here');

// With DLT template ID (MSG91 only, ignored by Twilio)
await sendSMS('+919876543210', 'Your message here', 'dlt_template_id');
```

### Sending Bulk SMS

```typescript
import { sendBulkSMS } from '@/lib/services/sms-service';

// Works with both providers
await sendBulkSMS(
  ['+919876543210', '+919876543211'],
  'Your message here',
  'dlt_template_id' // Optional, for MSG91
);
```

### Checking Provider

```typescript
import { getSMSProvider } from '@/lib/services/sms-service';

const provider = getSMSProvider(); // Returns 'MSG91' or 'Twilio'
console.log(`Using ${provider} for SMS`);
```

## API Changes

### Server Actions

All existing server actions work with both providers:

```typescript
// Send single SMS
await sendSingleSMS({
  to: '+919876543210',
  message: 'Your message',
  dltTemplateId: 'optional_dlt_id' // New parameter
});

// Send bulk SMS
await sendBulkSMSAction({
  recipients: ['+919876543210'],
  message: 'Your message',
  dltTemplateId: 'optional_dlt_id' // New parameter
});

// Check configuration
const config = await checkSMSConfiguration();
// Returns: { configured: true, provider: 'MSG91', message: '...' }
```

## Testing Commands

### Check Configuration

```bash
curl -X POST https://your-url.com/api/admin/check-sms-config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send Test SMS

```bash
curl -X POST https://your-url.com/api/admin/send-sms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "message": "Test message",
    "dltTemplateId": "your_dlt_template_id"
  }'
```

## Common Issues

### Issue: SMS not sending after enabling MSG91

**Quick Fix**:
1. Check `MSG91_AUTH_KEY` is set correctly
2. Check `MSG91_SENDER_ID` is set correctly
3. Restart application
4. Check logs for error messages

### Issue: "DLT template ID not found"

**Quick Fix**:
1. Verify template is approved in MSG91 dashboard
2. Use correct DLT template ID
3. Ensure message content matches registered template

### Issue: Need to rollback immediately

**Quick Fix**:
```bash
# Set in .env
USE_MSG91=false

# Restart application
pm2 restart all
```

## Phone Number Format

Both providers require E.164 format:

✅ Correct: `+919876543210`
❌ Wrong: `9876543210`, `+91 98765 43210`, `91-9876543210`

## DLT Template Format

MSG91 templates use `{#var#}` for variables:

```
Dear Parent, {#student_name#} was marked {#status#} on {#date#}.
```

## Migration Checklist

- [ ] MSG91 account created
- [ ] DLT templates registered
- [ ] Environment variables set
- [ ] Tested in staging
- [ ] Deployed to production
- [ ] Monitoring for 7 days

## Support Links

- **MSG91 Dashboard**: [https://msg91.com/](https://msg91.com/)
- **MSG91 Docs**: [https://docs.msg91.com/](https://docs.msg91.com/)
- **MSG91 Support**: support@msg91.com
- **Full Migration Guide**: See `TWILIO_TO_MSG91_MIGRATION_GUIDE.md`

## Cost Savings

| Monthly SMS | Twilio Cost | MSG91 Cost | Savings |
|-------------|-------------|------------|---------|
| 5,000 | ₹3,000 | ₹1,000 | ₹2,000 (67%) |
| 10,000 | ₹6,000 | ₹2,000 | ₹4,000 (67%) |
| 20,000 | ₹12,000 | ₹4,000 | ₹8,000 (67%) |

*Approximate costs based on transactional SMS rates in India*

## Feature Flag Behavior

| USE_MSG91 | Provider | Credentials Required |
|-----------|----------|---------------------|
| `true` | MSG91 | MSG91_AUTH_KEY, MSG91_SENDER_ID |
| `false` | Twilio | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER |
| Not set | Twilio | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER |

## Backward Compatibility

✅ All existing code continues to work
✅ No breaking changes to API
✅ Existing SMS actions work with both providers
✅ Can switch between providers without code changes
✅ DLT template ID is optional (ignored by Twilio)

## Next Steps

1. Read full migration guide: `TWILIO_TO_MSG91_MIGRATION_GUIDE.md`
2. Set up MSG91 account
3. Test in staging environment
4. Deploy to production
5. Monitor and optimize
