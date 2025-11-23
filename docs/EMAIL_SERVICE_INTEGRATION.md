# Email Service Integration

This document describes the email service integration for the School ERP system.

## Overview

The email service provides comprehensive email sending capabilities with delivery tracking, bounce handling, and retry logic. It integrates with Resend as the email service provider.

**Requirements:** 11.3 - Email Service Provider Integration

## Features

- ✅ Single and bulk email sending
- ✅ Delivery tracking
- ✅ Bounce handling
- ✅ Retry logic (up to 3 attempts)
- ✅ Template-based emails
- ✅ Email validation
- ✅ Support for attachments
- ✅ CC and BCC support

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Email Service (Resend)
# Get your API key from: https://resend.com/api-keys
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=noreply@schoolerp.com
```

### Getting Started with Resend

1. Sign up for a Resend account at https://resend.com
2. Verify your domain or use the test domain for development
3. Generate an API key from https://resend.com/api-keys
4. Add the API key to your `.env` file

## Usage

### Server Actions (Recommended)

The email service is exposed through server actions in `src/lib/actions/emailActions.ts`:

#### Send Single Email

```typescript
import { sendSingleEmail } from '@/lib/actions/emailActions';

const result = await sendSingleEmail({
  to: 'recipient@example.com',
  subject: 'Welcome to School ERP',
  html: '<h1>Welcome!</h1><p>Your account has been created.</p>',
  text: 'Welcome! Your account has been created.', // Optional plain text version
  replyTo: 'support@schoolerp.com', // Optional
});

if (result.success) {
  console.log('Email sent:', result.data.messageId);
} else {
  console.error('Failed to send email:', result.error);
}
```

#### Send Bulk Emails

```typescript
import { sendBulkEmailAction } from '@/lib/actions/emailActions';

const result = await sendBulkEmailAction({
  recipients: [
    'parent1@example.com',
    'parent2@example.com',
    'parent3@example.com',
  ],
  subject: 'Important Announcement',
  html: '<h1>Announcement</h1><p>School will be closed tomorrow.</p>',
  text: 'Announcement: School will be closed tomorrow.',
});

if (result.success) {
  console.log(`Sent ${result.data.successful} emails successfully`);
  console.log(`Failed to send ${result.data.failed} emails`);
}
```

#### Send Email to Class

```typescript
import { sendEmailToClass } from '@/lib/actions/emailActions';

const result = await sendEmailToClass({
  classId: 'class-id-here',
  subject: 'Class Update',
  html: '<h1>Class Update</h1><p>Tomorrow\'s class is postponed.</p>',
});
```

#### Send Email to All Parents

```typescript
import { sendEmailToAllParents } from '@/lib/actions/emailActions';

const result = await sendEmailToAllParents({
  subject: 'School Announcement',
  html: '<h1>Important Notice</h1><p>Annual day celebration next week.</p>',
});
```

#### Send Templated Email

```typescript
import { sendTemplatedEmailAction } from '@/lib/actions/emailActions';

const result = await sendTemplatedEmailAction({
  template: 'admission-confirmation',
  to: 'parent@example.com',
  templateData: {
    parentName: 'John Doe',
    studentName: 'Jane Doe',
    applicationNumber: 'APP20250001',
  },
});
```

Available templates:
- `welcome` - Welcome email for new users
- `password-reset` - Password reset email
- `admission-confirmation` - Admission application confirmation
- `fee-reminder` - Fee payment reminder

### Direct Service Usage (Advanced)

For advanced use cases, you can use the email service directly:

```typescript
import { sendEmail, sendEmailWithRetry } from '@/lib/services/email-service';

// Send email with automatic retry
const result = await sendEmailWithRetry({
  to: 'recipient@example.com',
  subject: 'Test Email',
  html: '<p>This is a test email</p>',
  attachments: [
    {
      filename: 'report.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
  ],
});
```

## Bounce Handling

The email service includes bounce handling capabilities. When an email bounces, the system logs the bounce information:

```typescript
import { handleEmailBounce } from '@/lib/services/email-service';

// This would typically be called from a webhook endpoint
await handleEmailBounce(
  'message-id',
  'hard', // or 'soft'
  'Mailbox does not exist'
);
```

### Setting Up Bounce Webhooks

To receive bounce notifications:

1. Go to your Resend dashboard
2. Navigate to Webhooks
3. Add a webhook endpoint: `https://your-domain.com/api/webhooks/email-bounce`
4. Select the events: `email.bounced`, `email.complained`

## Email Validation

The service includes email validation utilities:

```typescript
import { isValidEmail, validateEmails } from '@/lib/services/email-service';

// Validate single email
if (isValidEmail('test@example.com')) {
  console.log('Valid email');
}

// Validate multiple emails
const { valid, invalid } = validateEmails([
  'valid@example.com',
  'invalid-email',
  'another@example.com',
]);

console.log('Valid emails:', valid);
console.log('Invalid emails:', invalid);
```

## Retry Logic

The email service automatically retries failed sends up to 3 times with exponential backoff:

- Attempt 1: Immediate
- Attempt 2: After 1 second
- Attempt 3: After 2 seconds
- Attempt 4: After 4 seconds

This satisfies **Requirement 11.4**: Message retry logic.

## Error Handling

All email functions return a result object with the following structure:

```typescript
{
  success: boolean;
  data?: {
    messageId: string;
    status: string;
    to: string | string[];
  };
  error?: string;
}
```

Always check the `success` field before accessing `data`:

```typescript
const result = await sendSingleEmail({ ... });

if (result.success) {
  // Email sent successfully
  console.log('Message ID:', result.data.messageId);
} else {
  // Handle error
  console.error('Error:', result.error);
}
```

## Testing

The email service includes comprehensive tests. Run them with:

```bash
npm run test:run -- src/lib/utils/email-service.test.ts
```

## Rate Limits

Resend has the following rate limits:

- **Free tier**: 100 emails/day
- **Paid tier**: Varies by plan

The service includes automatic rate limiting with delays between bulk emails to avoid hitting limits.

## Best Practices

1. **Always use retry logic** for important emails by using `sendEmailWithRetry`
2. **Validate email addresses** before sending to avoid bounces
3. **Use templates** for consistent branding and easier maintenance
4. **Include both HTML and text versions** for better compatibility
5. **Monitor bounce rates** and remove invalid addresses
6. **Test emails** in development using Resend's test domain
7. **Use BCC for bulk emails** when you don't want recipients to see each other

## Troubleshooting

### Email not sending

1. Check that `RESEND_API_KEY` is set in `.env`
2. Check that `EMAIL_FROM` is set and uses a verified domain
3. Check the console for error messages
4. Verify your Resend account is active

### Emails going to spam

1. Verify your domain with Resend
2. Set up SPF, DKIM, and DMARC records
3. Avoid spam trigger words in subject and content
4. Include an unsubscribe link for bulk emails

### Rate limit errors

1. Reduce the frequency of bulk emails
2. Upgrade your Resend plan
3. Implement queuing for large email batches

## Support

For issues with the email service:
- Check the Resend documentation: https://resend.com/docs
- Review the error logs in your application
- Contact Resend support for API-related issues

## Related Files

- Service: `src/lib/services/email-service.ts`
- Actions: `src/lib/actions/emailActions.ts`
- Legacy service: `src/lib/utils/email-service.ts`
- Tests: `src/lib/utils/email-service.test.ts`
