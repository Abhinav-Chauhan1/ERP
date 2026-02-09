# Email Service Setup Guide

This guide explains how to set up and use the email service for the School ERP system.

## Overview

The ERP system uses [Resend](https://resend.com) as the email service provider. Resend is a modern, developer-friendly email API that provides reliable email delivery with excellent deliverability rates.

## Features

- ✅ Admission confirmation emails
- ✅ HTML email templates
- ✅ Error handling and logging
- ✅ Graceful degradation (system works without email configured)
- ✅ Support for multiple recipients
- ✅ Customizable sender address

## Setup Instructions

### 1. Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Log in to your Resend dashboard
2. Navigate to **API Keys** section
3. Click **Create API Key**
4. Give it a name (e.g., "School ERP Production")
5. Copy the API key (it will only be shown once)

### 3. Configure Domain (Optional but Recommended)

For production use, you should verify your domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `schoolerp.com`)
4. Add the DNS records provided by Resend to your domain's DNS settings
5. Wait for verification (usually takes a few minutes)

**Note:** Without domain verification, you can only send emails to verified email addresses. This is fine for testing but not for production.

### 4. Update Environment Variables

Add the following to your `.env` file:

```env
# Email Service (Resend)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
```

**Important:**
- Replace `re_your_api_key_here` with your actual Resend API key
- Replace `noreply@yourdomain.com` with your verified sender email
- If you haven't verified a domain, use `onboarding@resend.dev` for testing

### 5. Test the Email Service

You can test the email service by submitting an admission application:

1. Start your development server: `npm run dev`
2. Navigate to the admission portal: `http://localhost:3000/admission`
3. Fill out and submit an application
4. Check the parent's email inbox for the confirmation email

## Usage

### Sending Admission Confirmation Emails

The admission confirmation email is automatically sent when an application is submitted:

```typescript
import { sendAdmissionConfirmationEmail } from '@/lib/utils/email-service';

await sendAdmissionConfirmationEmail(
  'parent@example.com',
  'John Doe',
  'Jane Doe',
  'APP20250001',
  'Grade 1'
);
```

### Sending Custom Emails

You can send custom emails using the `sendEmail` function:

```typescript
import { sendEmail } from '@/lib/utils/email-service';

const result = await sendEmail({
  to: 'recipient@example.com',
  subject: 'Your Subject',
  html: '<p>Your HTML content</p>',
  from: 'custom@yourdomain.com', // Optional, uses EMAIL_FROM if not provided
});

if (result.success) {
  console.log('Email sent successfully:', result.messageId);
} else {
  console.error('Failed to send email:', result.error);
}
```

### Sending to Multiple Recipients

```typescript
await sendEmail({
  to: ['recipient1@example.com', 'recipient2@example.com'],
  subject: 'Bulk Email',
  html: '<p>Content</p>',
});
```

## Email Templates

### Admission Confirmation Email

The admission confirmation email includes:
- Application number (prominently displayed)
- Student name
- Applied class
- Submission date
- Next steps information
- Professional HTML formatting with school branding

## Error Handling

The email service includes comprehensive error handling:

1. **Missing API Key**: If `RESEND_API_KEY` is not configured, the system logs a warning but continues to function. The application submission succeeds, but no email is sent.

2. **Email Sending Failure**: If email sending fails (network issues, invalid recipient, etc.), the error is logged but the application submission still succeeds. This ensures that email issues don't prevent users from submitting applications.

3. **Graceful Degradation**: The system is designed to work without email configured, making it suitable for development and testing environments.

## Testing

### Unit Tests

Email service functionality is covered by unit tests:

```bash
npm run test:run -- src/lib/utils/email-service.test.ts
```

### Integration Tests

Admission application tests include email sending:

```bash
npm run test:run -- src/lib/actions/admissionActions.test.ts
```

## Monitoring

### Check Email Delivery

1. Log in to your Resend dashboard
2. Go to **Emails** section
3. View sent emails, delivery status, and any errors

### Logs

Email sending is logged in the application:
- Success: No log (silent success)
- Failure: Error logged to console with details

## Pricing

Resend offers a generous free tier:
- **Free Tier**: 3,000 emails/month, 100 emails/day
- **Pro Tier**: $20/month for 50,000 emails/month
- **Enterprise**: Custom pricing for higher volumes

For most schools, the free tier should be sufficient for admission confirmations and basic notifications.

## Troubleshooting

### Emails Not Being Sent

1. **Check API Key**: Ensure `RESEND_API_KEY` is set in `.env`
2. **Check Domain**: Verify your domain in Resend dashboard
3. **Check Logs**: Look for error messages in the console
4. **Test API Key**: Try sending a test email from Resend dashboard

### Emails Going to Spam

1. **Verify Domain**: Add SPF, DKIM, and DMARC records
2. **Use Professional Content**: Avoid spam trigger words
3. **Include Unsubscribe Link**: For bulk emails
4. **Warm Up Domain**: Start with small volumes and gradually increase

### Rate Limiting

If you're sending many emails quickly:
1. Implement batching (send in groups)
2. Add delays between batches
3. Consider upgrading to Pro tier for higher limits

## Future Enhancements

Planned email features:
- [ ] Email templates for fee reminders
- [ ] Email templates for exam notifications
- [ ] Email templates for attendance alerts
- [ ] Bulk email functionality for announcements
- [ ] Email scheduling
- [ ] Email analytics and tracking
- [ ] Unsubscribe management

## Security Best Practices

1. **Never Commit API Keys**: Keep `.env` in `.gitignore`
2. **Use Environment Variables**: Never hardcode API keys
3. **Rotate Keys Regularly**: Generate new API keys periodically
4. **Monitor Usage**: Check Resend dashboard for unusual activity
5. **Limit Permissions**: Use API keys with minimal required permissions

## Support

- **Resend Documentation**: [https://resend.com/docs](https://resend.com/docs)
- **Resend Support**: [support@resend.com](mailto:support@resend.com)
- **ERP System Issues**: Contact your development team

## Related Documentation

- [Admission Portal Implementation](./ADMISSION_PORTAL_IMPLEMENTATION.md)
- [Production Deployment Guide](./PRODUCTION_READY_ANALYSIS.md)
- [Security Implementation](./SECURITY_IMPLEMENTATION.md)
