# Bulk Messaging Actions Guide

This guide explains how to use the bulk messaging actions to send messages to multiple recipients via SMS, WhatsApp, or Email.

## Overview

The bulk messaging system provides the following capabilities:

1. **Send to Class**: Send messages to all parents of students in a specific class (with optional section filtering)
2. **Send to All Parents**: Send messages to all parents in the school (with optional academic year filtering)
3. **Progress Tracking**: Track the progress of bulk message operations
4. **History**: View history of past bulk message operations

## Features

- **Automatic Batching**: Messages are automatically batched (50 per batch) to respect API rate limits
- **Progress Tracking**: Each bulk operation is logged in the audit log for tracking
- **Summary Reports**: Detailed reports showing successful and failed deliveries
- **Role-Based Authorization**: Only administrators can send bulk messages
- **Multiple Channels**: Support for SMS, WhatsApp, and Email

## Actions

### 1. sendBulkToClass

Send a bulk message to all parents in a specific class.

**Parameters:**
```typescript
{
  classId: string;           // Required: Class ID
  sectionId?: string;        // Optional: Section ID to filter by section
  channel: CommunicationChannel; // Required: EMAIL, SMS, or WHATSAPP
  title: string;             // Required: Message title
  message: string;           // Required: Message content
  notificationType?: NotificationType; // Optional: Type of notification (default: ANNOUNCEMENT)
}
```

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    channel: CommunicationChannel;
    results: Array<{
      userId: string;
      userName?: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  };
  error?: string;
}
```

**Example Usage:**
```typescript
import { sendBulkToClass } from "@/lib/actions/bulkMessagingActions";
import { CommunicationChannel, NotificationType } from "@/lib/types/communication";

const result = await sendBulkToClass({
  classId: "class_123",
  sectionId: "section_456", // Optional
  channel: CommunicationChannel.WHATSAPP,
  title: "Important Announcement",
  message: "School will be closed tomorrow due to weather conditions.",
  notificationType: NotificationType.ANNOUNCEMENT,
});

if (result.success) {
  console.log(`Sent to ${result.data.successCount} out of ${result.data.totalRecipients} parents`);
  console.log(`Failed: ${result.data.failureCount}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

### 2. sendBulkToAllParents

Send a bulk message to all parents in the school.

**Parameters:**
```typescript
{
  channel: CommunicationChannel; // Required: EMAIL, SMS, or WHATSAPP
  title: string;             // Required: Message title
  message: string;           // Required: Message content
  notificationType?: NotificationType; // Optional: Type of notification (default: ANNOUNCEMENT)
  academicYearId?: string;   // Optional: Filter by academic year
}
```

**Returns:**
Same as `sendBulkToClass`

**Example Usage:**
```typescript
import { sendBulkToAllParents } from "@/lib/actions/bulkMessagingActions";
import { CommunicationChannel, NotificationType } from "@/lib/types/communication";

const result = await sendBulkToAllParents({
  channel: CommunicationChannel.EMAIL,
  title: "Annual Day Invitation",
  message: "You are cordially invited to our Annual Day celebration on December 15th.",
  notificationType: NotificationType.ANNOUNCEMENT,
  academicYearId: "ay_2024", // Optional: only send to parents of current academic year
});

if (result.success) {
  console.log(`Sent to ${result.data.successCount} out of ${result.data.totalRecipients} parents`);
} else {
  console.error(`Error: ${result.error}`);
}
```

### 3. getBulkMessageProgress

Track the progress of a bulk message operation.

**Parameters:**
```typescript
auditLogId: string; // Required: Audit log ID from the bulk message operation
```

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    totalRecipients: number;
    processed: number;
    successful: number;
    failed: number;
    pending: number;
    details: {
      channel: string;
      classId?: string;
      sectionId?: string;
      academicYearId?: string;
      title: string;
      createdAt: Date;
    };
  };
  error?: string;
}
```

**Example Usage:**
```typescript
import { getBulkMessageProgress } from "@/lib/actions/bulkMessagingActions";

const progress = await getBulkMessageProgress("audit_log_123");

if (progress.success) {
  console.log(`Progress: ${progress.data.processed}/${progress.data.totalRecipients}`);
  console.log(`Success: ${progress.data.successful}, Failed: ${progress.data.failed}`);
}
```

### 4. getBulkMessageHistory

Get a list of recent bulk message operations.

**Parameters:**
```typescript
limit?: number; // Optional: Maximum number of records (default: 20, max: 100)
```

**Returns:**
```typescript
{
  success: boolean;
  data?: Array<{
    id: string;
    action: string;
    userId: string;
    userName: string;
    createdAt: Date;
    details: {
      channel: string;
      classId?: string;
      sectionId?: string;
      academicYearId?: string;
      title: string;
      totalRecipients: number;
      successful: number;
      failed: number;
    };
  }>;
  error?: string;
}
```

**Example Usage:**
```typescript
import { getBulkMessageHistory } from "@/lib/actions/bulkMessagingActions";

const history = await getBulkMessageHistory(10);

if (history.success) {
  history.data.forEach((entry) => {
    console.log(`${entry.details.title} - ${entry.details.successful}/${entry.details.totalRecipients} sent`);
  });
}
```

## Authorization

All bulk messaging actions require:
- User must be authenticated
- User must have `ADMIN` role

Attempting to use these actions without proper authorization will return an error:
```typescript
{
  success: false,
  error: "Insufficient permissions. Only administrators can send bulk messages."
}
```

## Batching and Rate Limiting

The bulk messaging system automatically handles batching to respect API rate limits:

- **Batch Size**: 50 recipients per batch
- **Delay Between Batches**: 200ms
- **Retry Logic**: Each message is retried up to 3 times with exponential backoff (handled by Communication Service)

This ensures that:
1. API rate limits are not exceeded
2. Failed messages are automatically retried
3. The system remains responsive during large bulk operations

## Message Logging

All bulk messages are logged in two places:

1. **Audit Log**: Each bulk operation creates an audit log entry with:
   - Action type (BULK_MESSAGE_SENT or BULK_MESSAGE_ALL_PARENTS)
   - User who initiated the operation
   - Summary statistics (total, successful, failed)
   - Operation details (channel, class, title, etc.)

2. **Message Log**: Each individual message creates a message log entry with:
   - Channel used
   - Recipient information
   - Delivery status
   - Message ID from provider
   - Timestamps (sent, delivered, read, failed)

## Error Handling

The bulk messaging system handles various error scenarios:

### Common Errors

1. **No Recipients Found**
   ```typescript
   {
     success: false,
     error: "No parents found for the specified class."
   }
   ```

2. **Invalid Channel**
   ```typescript
   {
     success: false,
     error: "Invalid channel. Must be one of: EMAIL, SMS, WHATSAPP"
   }
   ```

3. **Missing Required Fields**
   ```typescript
   {
     success: false,
     error: "Title and message are required."
   }
   ```

4. **Class/Section Not Found**
   ```typescript
   {
     success: false,
     error: "Class not found."
   }
   ```

### Partial Failures

If some messages succeed and others fail, the operation is still considered successful:
```typescript
{
  success: true,
  data: {
    totalRecipients: 100,
    successCount: 95,
    failureCount: 5,
    results: [
      { userId: "user1", success: true, messageId: "msg_123" },
      { userId: "user2", success: false, error: "Invalid phone number" },
      // ... more results
    ]
  }
}
```

## Best Practices

1. **Test with Small Groups First**: Before sending to all parents, test with a single class
2. **Use Appropriate Channels**: 
   - Email for detailed information
   - SMS for urgent, short messages
   - WhatsApp for rich media and interactive messages
3. **Monitor Progress**: Use `getBulkMessageProgress` for large operations
4. **Review History**: Regularly check `getBulkMessageHistory` to monitor usage
5. **Handle Failures**: Check the `results` array for failed messages and retry if needed

## Integration with UI

Example React component for sending bulk messages:

```typescript
"use client";

import { useState } from "react";
import { sendBulkToClass } from "@/lib/actions/bulkMessagingActions";
import { CommunicationChannel, NotificationType } from "@/lib/types/communication";

export function BulkMessageForm({ classId }: { classId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await sendBulkToClass({
      classId,
      channel: formData.get("channel") as CommunicationChannel,
      title: formData.get("title") as string,
      message: formData.get("message") as string,
      notificationType: NotificationType.ANNOUNCEMENT,
    });

    setResult(result);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <select name="channel" required>
        <option value={CommunicationChannel.EMAIL}>Email</option>
        <option value={CommunicationChannel.SMS}>SMS</option>
        <option value={CommunicationChannel.WHATSAPP}>WhatsApp</option>
      </select>

      <input name="title" placeholder="Title" required />
      <textarea name="message" placeholder="Message" required />

      <button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send Bulk Message"}
      </button>

      {result && (
        <div>
          {result.success ? (
            <p>
              Sent to {result.data.successCount} out of {result.data.totalRecipients} parents
              {result.data.failureCount > 0 && ` (${result.data.failureCount} failed)`}
            </p>
          ) : (
            <p>Error: {result.error}</p>
          )}
        </div>
      )}
    </form>
  );
}
```

## Requirements Validation

This implementation satisfies the following requirements:

- **11.1**: ✅ Send WhatsApp messages to all parents in a specific class
- **11.2**: ✅ Send WhatsApp messages to all parents in the school
- **11.3**: ✅ Process recipients in batches to respect API rate limits
- **11.4**: ✅ Track individual delivery status for each recipient
- **11.5**: ✅ Provide summary report showing successful and failed deliveries

## Related Documentation

- [Communication Service](../services/communication-service.ts)
- [MSG91 Actions](./msg91Actions.ts)
- [WhatsApp Actions](./whatsappActions.ts)
- [Message Logging Service](../services/message-logging-service.ts)
