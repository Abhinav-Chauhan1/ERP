# Bulk Messaging Guide

## Overview

The Bulk Messaging feature allows administrators to send SMS and email messages to multiple recipients at once. Messages are sent in batches with automatic retry logic to handle rate limits and ensure reliable delivery.

## Features

- **Multiple Message Types**: Send SMS, Email, or both simultaneously
- **Flexible Recipient Selection**: Select recipients by class, role, or send to all users
- **Template Support**: Use pre-defined message templates with variable substitution
- **Batch Processing**: Messages are sent in batches of 50 to avoid rate limits
- **Automatic Retry**: Failed messages are automatically retried up to 3 times with exponential backoff
- **Preview Recipients**: Preview the list of recipients before sending
- **Delivery Tracking**: Track successful and failed message deliveries

## Requirements

**Validates: Requirements 11.4** - Bulk Messaging with Retry Logic

## Usage

### Accessing Bulk Messaging

Navigate to: **Admin Dashboard → Communication → Bulk Messaging**

### Sending a Bulk Message

1. **Select Message Type**
   - Email Only
   - SMS Only
   - Both (Email + SMS)

2. **Choose a Template (Optional)**
   - Select from pre-defined message templates
   - Templates automatically populate the subject and body
   - Templates support variable substitution

3. **Compose Your Message**
   - **Subject**: Required for email messages
   - **Body**: The message content
   - Use template variables like `{{studentName}}`, `{{className}}`, etc.

4. **Select Recipients**
   - **All Parents**: Send to all parent users
   - **All Teachers**: Send to all teacher users
   - **All Students**: Send to all student users
   - **By Class**: Select specific classes
   - **By Role**: Select specific user roles

5. **Preview Recipients**
   - Click "Preview Recipients" to see who will receive the message
   - Review the list of recipients with their contact information

6. **Send Message**
   - Click "Send Message" to start sending
   - Messages are sent in batches with progress tracking
   - View delivery statistics after sending completes

## Technical Details

### Batch Processing

Messages are sent in batches to avoid overwhelming the SMS/Email service providers and to respect rate limits:

- **Batch Size**: 50 messages per batch
- **Batch Delay**: 1 second delay between batches
- **Total Time**: For 500 recipients, approximately 10 seconds

### Retry Logic

Failed messages are automatically retried with exponential backoff:

- **Max Retries**: 3 attempts per message
- **Backoff Strategy**: 2^attempt seconds (2s, 4s, 8s)
- **Total Retry Time**: Up to 14 seconds per failed message

### Recipient Selection

#### By Class
Sends messages to:
- All students in the selected classes
- All parents of students in the selected classes

#### By Role
Sends messages to all users with the selected roles:
- PARENT
- TEACHER
- STUDENT
- ADMIN

#### All Parents/Teachers/Students
Sends messages to all active users of the selected type.

### Template Variables

Available template variables:

**Student Variables:**
- `{{studentName}}` - Student full name
- `{{studentFirstName}}` - Student first name
- `{{studentLastName}}` - Student last name
- `{{admissionId}}` - Student admission ID
- `{{rollNumber}}` - Student roll number
- `{{className}}` - Student class name
- `{{sectionName}}` - Student section name

**Parent Variables:**
- `{{parentName}}` - Parent full name
- `{{parentFirstName}}` - Parent first name
- `{{parentLastName}}` - Parent last name
- `{{parentEmail}}` - Parent email address
- `{{parentPhone}}` - Parent phone number

**Teacher Variables:**
- `{{teacherName}}` - Teacher full name
- `{{teacherFirstName}}` - Teacher first name
- `{{teacherLastName}}` - Teacher last name
- `{{employeeId}}` - Teacher employee ID

**School Variables:**
- `{{schoolName}}` - School name
- `{{schoolAddress}}` - School address
- `{{schoolPhone}}` - School phone number
- `{{schoolEmail}}` - School email address
- `{{schoolWebsite}}` - School website URL

**General Variables:**
- `{{date}}` - Current date
- `{{time}}` - Current time
- `{{academicYear}}` - Current academic year
- `{{term}}` - Current term

## API Reference

### Server Actions

#### `sendBulkMessage(input: BulkMessageInput)`

Sends bulk messages to selected recipients.

**Parameters:**
```typescript
interface BulkMessageInput {
  messageType: "SMS" | "EMAIL" | "BOTH";
  subject?: string; // Required for email
  body: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  recipientSelection: {
    type: "MANUAL" | "CLASS" | "ROLE" | "ALL_PARENTS" | "ALL_TEACHERS" | "ALL_STUDENTS";
    classIds?: string[];
    roles?: string[];
    manualRecipients?: string[]; // User IDs
  };
}
```

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    total: number;
    sms: { sent: number; failed: number; results: any[] };
    email: { sent: number; failed: number; results: any[] };
  };
  error?: string;
}
```

#### `getRecipients(selection: RecipientSelection)`

Gets the list of recipients based on selection criteria.

**Returns:**
```typescript
{
  success: boolean;
  data?: BulkMessageRecipient[];
  error?: string;
}
```

#### `previewRecipients(selection: RecipientSelection)`

Previews recipients before sending (alias for `getRecipients`).

#### `getAvailableClasses()`

Gets all available classes for recipient selection.

**Returns:**
```typescript
{
  success: boolean;
  data?: Array<{ id: string; name: string; grade: string }>;
  error?: string;
}
```

#### `getBulkMessagingStats()`

Gets statistics about available recipients.

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    totalParents: number;
    totalTeachers: number;
    totalStudents: number;
    totalClasses: number;
    totalUsers: number;
  };
  error?: string;
}
```

## Best Practices

1. **Preview Before Sending**: Always preview recipients to ensure you're sending to the right people

2. **Use Templates**: Create reusable templates for common messages to save time

3. **Test with Small Groups**: Test your message with a small group before sending to everyone

4. **Monitor Delivery**: Check the delivery statistics after sending to identify any issues

5. **Respect Rate Limits**: The system automatically handles rate limits, but avoid sending too many bulk messages in quick succession

6. **Personalize Messages**: Use template variables to personalize messages for better engagement

7. **Clear Subject Lines**: For emails, use clear and descriptive subject lines

8. **Keep Messages Concise**: Especially for SMS, keep messages short and to the point

## Troubleshooting

### Messages Not Sending

1. **Check Configuration**: Ensure SMS and Email services are properly configured
   - SMS: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
   - Email: RESEND_API_KEY, EMAIL_FROM

2. **Verify Permissions**: Only ADMIN users can send bulk messages

3. **Check Recipient Data**: Ensure recipients have valid email addresses or phone numbers

### High Failure Rate

1. **Invalid Contact Information**: Check that email addresses and phone numbers are valid

2. **Service Provider Issues**: Check the status of your SMS/Email service provider

3. **Rate Limiting**: If sending very large volumes, consider increasing batch delays

### Template Variables Not Working

1. **Correct Syntax**: Use `{{variableName}}` format (double curly braces)

2. **Available Variables**: Ensure you're using variables that are available for the recipient type

3. **Template Data**: When using templates, provide the necessary template variables

## Related Documentation

- [SMS Gateway Setup](./SMS_GATEWAY_SETUP.md)
- [Email Service Integration](./EMAIL_SERVICE_INTEGRATION.md)
- [Message Templates Guide](./MESSAGE_TEMPLATES_GUIDE.md)

## Implementation Files

- **Server Actions**: `src/lib/actions/bulkMessagingActions.ts`
- **UI Component**: `src/components/admin/communication/bulk-message-composer.tsx`
- **Page**: `src/app/admin/communication/bulk-messaging/page.tsx`
- **Tests**: `src/lib/actions/bulkMessagingActions.test.ts`
