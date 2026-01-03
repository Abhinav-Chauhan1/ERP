# Communication Service Configuration

This document describes the configuration setup for the WhatsApp Notification System and MSG91 SMS integration.

## Overview

The communication service supports multiple channels:
- **SMS** via MSG91 (recommended for India) or Twilio (legacy)
- **WhatsApp** via WhatsApp Business API
- **Email** via Resend (existing)
- **In-App** notifications (existing)

## Environment Variables

### MSG91 SMS Configuration

```env
# Enable MSG91 for SMS
USE_MSG91=true

# MSG91 credentials (get from https://msg91.com/)
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SENDER_ID=SCHOOL
MSG91_ROUTE=transactional
MSG91_COUNTRY=91
```

**Configuration Details:**
- `MSG91_AUTH_KEY`: Your MSG91 authentication key (required)
- `MSG91_SENDER_ID`: 6-character sender ID registered with MSG91 (required)
- `MSG91_ROUTE`: Either "transactional" or "promotional" (required)
- `MSG91_COUNTRY`: Country code without + (default: 91 for India)

### WhatsApp Business API Configuration

```env
# Enable WhatsApp notifications
USE_WHATSAPP=true

# WhatsApp Business API credentials (get from https://developers.facebook.com/)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_APP_SECRET=your_app_secret
WHATSAPP_API_VERSION=v18.0
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
```

**Configuration Details:**
- `WHATSAPP_ACCESS_TOKEN`: Access token from Meta Business Suite (required)
- `WHATSAPP_PHONE_NUMBER_ID`: Phone number ID from WhatsApp Business API (required)
- `WHATSAPP_BUSINESS_ACCOUNT_ID`: Business account ID (required)
- `WHATSAPP_APP_SECRET`: App secret for webhook signature verification (required)
- `WHATSAPP_API_VERSION`: API version (default: v18.0)
- `WHATSAPP_VERIFY_TOKEN`: Custom token for webhook verification (required)

## Configuration Validation

The system includes built-in configuration validation utilities:

### Validate MSG91 Configuration

```typescript
import { validateMSG91Config, isMSG91Configured } from '@/lib/utils/communication-config';

// Check if MSG91 is properly configured
if (isMSG91Configured()) {
  console.log('MSG91 is ready to use');
}

// Get detailed validation results
const validation = validateMSG91Config();
if (!validation.isValid) {
  console.error('MSG91 Errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('MSG91 Warnings:', validation.warnings);
}
```

### Validate WhatsApp Configuration

```typescript
import { validateWhatsAppConfig, isWhatsAppConfigured } from '@/lib/utils/communication-config';

// Check if WhatsApp is properly configured
if (isWhatsAppConfigured()) {
  console.log('WhatsApp is ready to use');
}

// Get detailed validation results
const validation = validateWhatsAppConfig();
if (!validation.isValid) {
  console.error('WhatsApp Errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('WhatsApp Warnings:', validation.warnings);
}
```

### Validate All Configurations

```typescript
import { validateAllCommunicationConfigs, logCommunicationConfigStatus } from '@/lib/utils/communication-config';

// Validate all communication services
const allConfigs = validateAllCommunicationConfigs();
if (allConfigs.hasErrors) {
  console.error('Configuration errors detected');
}

// Log configuration status to console
logCommunicationConfigStatus();
```

## Getting Configuration Objects

```typescript
import { getMSG91Config, getWhatsAppConfig } from '@/lib/utils/communication-config';

// Get MSG91 configuration (throws error if invalid)
try {
  const msg91Config = getMSG91Config();
  console.log('MSG91 Sender ID:', msg91Config.senderId);
} catch (error) {
  console.error('MSG91 configuration error:', error.message);
}

// Get WhatsApp configuration (throws error if invalid)
try {
  const whatsappConfig = getWhatsAppConfig();
  console.log('WhatsApp Phone Number ID:', whatsappConfig.phoneNumberId);
} catch (error) {
  console.error('WhatsApp configuration error:', error.message);
}
```

## Setup Instructions

### MSG91 Setup

1. **Create MSG91 Account**
   - Visit https://msg91.com/
   - Sign up for an account
   - Complete KYC verification

2. **Get Credentials**
   - Navigate to Settings → API Keys
   - Copy your Auth Key
   - Register a Sender ID (6 characters, uppercase)

3. **DLT Registration (India)**
   - Register your templates with DLT
   - Get DLT template IDs for each message type
   - Add DLT IDs to your message templates

4. **Configure Environment**
   - Add MSG91 credentials to `.env`
   - Set `USE_MSG91=true`
   - Test with sandbox credentials first

### WhatsApp Business API Setup

1. **Create Meta Business Account**
   - Visit https://business.facebook.com/
   - Create a business account
   - Verify your business

2. **Create WhatsApp Business App**
   - Go to https://developers.facebook.com/apps/
   - Create a new app
   - Add WhatsApp product

3. **Get Credentials**
   - Navigate to WhatsApp → API Setup
   - Copy Access Token
   - Copy Phone Number ID
   - Copy Business Account ID
   - Copy App Secret from Settings → Basic

4. **Configure Webhooks**
   - Set webhook URL: `https://your-domain.com/api/webhooks/whatsapp`
   - Set verify token (custom string)
   - Subscribe to: messages, message_status

5. **Configure Environment**
   - Add WhatsApp credentials to `.env`
   - Set `USE_WHATSAPP=true`
   - Test with test phone numbers first

## Feature Flags

The system uses feature flags to enable/disable services:

- `USE_MSG91`: Enable MSG91 SMS service (default: false)
- `USE_WHATSAPP`: Enable WhatsApp notifications (default: false)

This allows gradual rollout and easy rollback if issues occur.

## Migration from Twilio to MSG91

To migrate from Twilio to MSG91:

1. Keep existing Twilio configuration
2. Add MSG91 configuration
3. Set `USE_MSG91=false` initially
4. Test MSG91 in staging
5. Set `USE_MSG91=true` in production
6. Monitor for issues
7. Remove Twilio configuration after successful migration

## Troubleshooting

### MSG91 Issues

**Error: "Invalid authentication key"**
- Verify `MSG91_AUTH_KEY` is correct
- Check if key has expired
- Regenerate key from MSG91 dashboard

**Error: "Invalid sender ID"**
- Verify sender ID is exactly 6 characters
- Ensure sender ID is registered with MSG91
- Check if sender ID is approved

**Error: "DLT template not found"**
- Verify DLT template ID is correct
- Check if template is approved
- Register template with DLT if not done

### WhatsApp Issues

**Error: "Invalid access token"**
- Verify `WHATSAPP_ACCESS_TOKEN` is correct
- Check if token has expired
- Generate new token from Meta Business Suite

**Error: "Invalid phone number"**
- Ensure phone number is in E.164 format
- Verify phone number is registered with WhatsApp
- Check if phone number is verified

**Error: "Template not approved"**
- Submit template for approval in Meta Business Suite
- Wait for approval (can take 24-48 hours)
- Use approved templates only

## Security Best Practices

1. **Never commit credentials to version control**
   - Use `.env` files (already in `.gitignore`)
   - Use different credentials for dev/staging/production

2. **Rotate credentials regularly**
   - Change API keys every 90 days
   - Update webhook tokens periodically

3. **Use HTTPS for webhooks**
   - Always use HTTPS in production
   - Verify webhook signatures

4. **Monitor API usage**
   - Set up alerts for unusual activity
   - Track API call volumes
   - Monitor error rates

## Support

For issues or questions:
- MSG91: https://msg91.com/help
- WhatsApp Business API: https://developers.facebook.com/support/
- Internal: Contact system administrator
