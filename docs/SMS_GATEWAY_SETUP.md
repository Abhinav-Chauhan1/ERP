# SMS Gateway Setup Guide

This guide explains how to set up and use the SMS gateway integration in the School ERP system.

## Overview

The ERP system integrates with Twilio to send SMS messages to parents, students, and staff. The SMS service supports:

- Single SMS sending
- Bulk SMS sending
- Delivery status tracking
- Automatic retry on failure (up to 3 attempts)
- Phone number validation and formatting

## Requirements

- Twilio account (sign up at https://www.twilio.com/try-twilio)
- Twilio phone number capable of sending SMS
- Account SID and Auth Token from Twilio

## Setup Instructions

### 1. Create a Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free trial account
3. Verify your email and phone number

### 2. Get Your Credentials

1. Log in to the Twilio Console: https://console.twilio.com/
2. From the dashboard, copy your:
   - **Account SID** (starts with AC...)
   - **Auth Token** (click to reveal)

### 3. Get a Phone Number

1. Go to Phone Numbers → Manage → Buy a number
2. Select a phone number with SMS capabilities
3. Purchase the number (trial accounts get a free number)
4. Copy the phone number (format: +1234567890)

### 4. Configure Environment Variables

Add the following to your `.env` file:

```env
# SMS Gateway (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Important Notes:**
- Keep your Auth Token secret and never commit it to version control
- The phone number must be in E.164 format (e.g., +1234567890)
- For production, upgrade from trial account to remove restrictions

### 5. Verify Configuration

You can verify the SMS service is configured correctly by:

1. Logging in as an admin
2. Going to Settings → Communication
3. Checking the SMS configuration status

Or programmatically:

```typescript
import { checkSMSConfiguration } from '@/lib/actions/smsActions';

const result = await checkSMSConfiguration();
console.log(result.data.message);
```

## Usage

### Send a Single SMS

```typescript
import { sendSingleSMS } from '@/lib/actions/smsActions';

const result = await sendSingleSMS({
  to: '+1234567890',
  message: 'Hello from School ERP!',
  countryCode: '+1', // Optional, defaults to +1
});

if (result.success) {
  console.log('SMS sent:', result.data.messageId);
} else {
  console.error('Failed to send SMS:', result.error);
}
```

### Send Bulk SMS

```typescript
import { sendBulkSMSAction } from '@/lib/actions/smsActions';

const result = await sendBulkSMSAction({
  recipients: ['+1234567890', '+0987654321'],
  message: 'Important announcement from school',
  countryCode: '+1', // Optional
});

if (result.success) {
  console.log(`Sent ${result.data.successful} messages`);
  console.log(`Failed ${result.data.failed} messages`);
}
```

### Send SMS to a Class

```typescript
import { sendSMSToClass } from '@/lib/actions/smsActions';

const result = await sendSMSToClass({
  classId: 'class-id-here',
  message: 'Parent-teacher meeting tomorrow at 3 PM',
});
```

### Send SMS to All Parents

```typescript
import { sendSMSToAllParents } from '@/lib/actions/smsActions';

const result = await sendSMSToAllParents(
  'School will be closed tomorrow due to weather'
);
```

### Check Delivery Status

```typescript
import { getSMSStatus } from '@/lib/actions/smsActions';

const result = await getSMSStatus('SM1234567890abcdef');

if (result.success) {
  console.log('Status:', result.data.status);
  console.log('Sent at:', result.data.dateSent);
}
```

## Phone Number Format

All phone numbers must be in **E.164 format**:
- Start with `+` followed by country code
- No spaces, dashes, or parentheses
- Examples:
  - US: `+12025551234`
  - India: `+919876543210`
  - UK: `+447911123456`

The service includes a helper function to format numbers:

```typescript
import { formatPhoneNumber } from '@/lib/services/sms-service';

const formatted = formatPhoneNumber('2025551234', '+1');
// Returns: +12025551234
```

## Delivery Status Codes

The SMS service tracks the following delivery statuses:

- `queued` - Message is queued for sending
- `sending` - Message is being sent
- `sent` - Message has been sent to carrier
- `delivered` - Message was delivered to recipient
- `failed` - Message failed to send
- `undelivered` - Message was sent but not delivered

## Error Handling

The SMS service includes automatic retry logic:
- Failed messages are retried up to 3 times
- Exponential backoff between retries (1s, 2s, 4s)
- All errors are logged for debugging

## Rate Limiting

To avoid hitting Twilio's rate limits:
- Bulk messages are sent with 100ms delay between each
- Consider implementing your own rate limiting for large batches
- Monitor your Twilio usage dashboard

## Cost Considerations

### Trial Account Limitations
- Can only send to verified phone numbers
- Messages include "Sent from your Twilio trial account" prefix
- Limited free credits

### Production Account
- Pay per message (varies by country)
- No restrictions on recipients
- Volume discounts available
- Check pricing: https://www.twilio.com/sms/pricing

### Cost Optimization Tips
1. Use SMS templates to reduce message length
2. Batch messages during off-peak hours
3. Implement opt-in/opt-out functionality
4. Monitor usage regularly
5. Consider using WhatsApp Business API for lower costs

## Security Best Practices

1. **Never expose credentials**
   - Keep Auth Token in environment variables
   - Don't commit credentials to version control
   - Use different credentials for dev/staging/production

2. **Validate phone numbers**
   - Always validate before sending
   - Use the built-in validation functions
   - Sanitize user input

3. **Implement permissions**
   - Only admins should send bulk SMS
   - Log all SMS operations
   - Monitor for abuse

4. **Protect against spam**
   - Implement rate limiting per user
   - Add confirmation for bulk sends
   - Allow users to opt-out

## Troubleshooting

### SMS Not Sending

1. **Check configuration**
   ```typescript
   const result = await checkSMSConfiguration();
   console.log(result.data.message);
   ```

2. **Verify credentials**
   - Ensure Account SID and Auth Token are correct
   - Check phone number format (+1234567890)

3. **Check Twilio console**
   - Log in to https://console.twilio.com/
   - Check error logs and message history

### Invalid Phone Number Error

- Ensure number is in E.164 format (+country code + number)
- Use the `formatPhoneNumber` helper function
- Verify the number is valid for SMS

### Trial Account Restrictions

- Add recipient numbers to verified caller IDs
- Or upgrade to a paid account

### Rate Limit Errors

- Reduce batch size
- Increase delay between messages
- Contact Twilio to increase limits

## Testing

### Test in Development

For development/testing without sending real SMS:

1. Set up a test mode flag in your environment
2. Use Twilio's test credentials (available in console)
3. Or mock the SMS service in tests

### Example Test

```typescript
import { sendSMS } from '@/lib/services/sms-service';

// In test environment
process.env.TWILIO_ACCOUNT_SID = 'test_sid';
process.env.TWILIO_AUTH_TOKEN = 'test_token';
process.env.TWILIO_PHONE_NUMBER = '+15005550006'; // Twilio test number

const result = await sendSMS('+15005550006', 'Test message');
```

## Support

For issues with:
- **Twilio service**: Contact Twilio support or check https://support.twilio.com/
- **ERP integration**: Contact your system administrator
- **Feature requests**: Submit through your project management system

## Additional Resources

- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
- [E.164 Phone Number Format](https://en.wikipedia.org/wiki/E.164)
- [Twilio Error Codes](https://www.twilio.com/docs/api/errors)
