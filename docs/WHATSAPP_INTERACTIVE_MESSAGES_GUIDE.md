# WhatsApp Interactive Messages Guide

## Overview

This guide explains how to use WhatsApp interactive messages in the School ERP system. Interactive messages allow users to take quick actions directly from WhatsApp using buttons, making communication more engaging and efficient.

**Requirements:** 19.1, 19.2, 19.3, 19.4, 19.5

## Features

### 1. Button Response Handling

The system automatically processes button clicks from WhatsApp messages and routes them to appropriate handlers.

**Key Components:**
- `whatsapp-button-handler.ts` - Core button response processing
- Webhook integration for receiving button clicks
- Action registry for custom handlers

### 2. Interactive Message Templates

Pre-built templates for common use cases:

#### Attendance Templates
- **Attendance Confirmation** - Alert parents about absent/late students with acknowledgment buttons
- **Attendance Summary** - Weekly attendance overview with interactive list

#### Fee Templates
- **Fee Payment Reminder** - Payment reminders with "Pay Now" button
- **Fee Payment Confirmation** - Payment receipt with download options

#### Leave Templates
- **Leave Approval Request** - Send leave applications to admins with approve/reject buttons
- **Leave Status Notification** - Notify applicants about leave status

#### General Templates
- **Announcements** - School announcements with custom action buttons
- **Exam Reminders** - Exam notifications with schedule and syllabus buttons

## Usage

### Sending Interactive Messages

#### Example 1: Attendance Confirmation

```typescript
import { sendAttendanceConfirmation } from '@/lib/actions/whatsappInteractiveActions';

await sendAttendanceConfirmation({
  to: '+919876543210',
  studentName: 'John Doe',
  studentId: 'student_123',
  date: '2024-01-15',
  status: 'ABSENT',
  attendancePercentage: 92.5,
});
```

#### Example 2: Fee Payment Reminder

```typescript
import { sendFeePaymentReminder } from '@/lib/actions/whatsappInteractiveActions';

await sendFeePaymentReminder({
  to: '+919876543210',
  studentName: 'John Doe',
  studentId: 'student_123',
  feeType: 'Tuition Fee - Term 1',
  amount: 15000,
  dueDate: '2024-01-31',
  isOverdue: false,
  outstandingBalance: 15000,
  paymentLink: 'https://school.com/pay/abc123',
});
```

#### Example 3: Leave Approval Request

```typescript
import { sendLeaveApprovalRequest } from '@/lib/actions/whatsappInteractiveActions';

await sendLeaveApprovalRequest({
  to: '+919876543210',
  applicantName: 'Jane Smith',
  applicantType: 'Student',
  leaveType: 'Sick Leave',
  startDate: '2024-01-20',
  endDate: '2024-01-22',
  duration: 3,
  reason: 'Medical appointment',
  leaveId: 'leave_456',
});
```

### Creating Custom Button Handlers

You can register custom handlers for button responses:

```typescript
import { registerButtonAction } from '@/lib/services/whatsapp-button-handler';

// Register a custom handler
registerButtonAction('custom_action', async (response) => {
  console.log('Button clicked:', response.buttonId);
  console.log('From:', response.from);
  console.log('Text:', response.buttonText);
  
  // Your custom logic here
  // For example: update database, send confirmation, etc.
});
```

### Button ID Format

Button IDs follow a consistent format for easy routing:

```
{action_type}_{identifier}_{additional_params}
```

**Examples:**
- `attendance_confirm_student123_2024-01-15`
- `fee_pay_student456_fee789`
- `leave_approve_leave123`
- `leave_reject_leave123`

## Built-in Button Handlers

### 1. Attendance Confirmation Handler

**Button ID:** `attendance_confirm_{studentId}_{date}`

**Action:** Logs the confirmation (can be extended to update attendance records)

### 2. Fee Payment Handler

**Button ID:** `fee_pay_{studentId}_{feeId}`

**Action:** Initiates payment flow (can be extended to generate payment links)

### 3. Leave Approval Handler

**Button IDs:** 
- `leave_approve_{leaveId}`
- `leave_reject_{leaveId}`

**Action:** Processes leave approval/rejection (can be extended to update leave status)

## Interactive Message Types

### Button Messages

Up to 3 buttons per message. Best for simple yes/no or multiple choice actions.

```typescript
{
  type: 'button',
  header: { type: 'text', text: 'Header Text' },
  body: { text: 'Message body' },
  footer: { text: 'Footer text' },
  action: {
    buttons: [
      { type: 'reply', reply: { id: 'btn_1', title: 'Button 1' } },
      { type: 'reply', reply: { id: 'btn_2', title: 'Button 2' } },
    ],
  },
}
```

### List Messages

Up to 10 items per section. Best for longer lists of options.

```typescript
{
  type: 'list',
  header: { type: 'text', text: 'Header Text' },
  body: { text: 'Message body' },
  footer: { text: 'Footer text' },
  action: {
    button: 'View Options',
    sections: [
      {
        title: 'Section 1',
        rows: [
          { id: 'opt_1', title: 'Option 1', description: 'Description' },
          { id: 'opt_2', title: 'Option 2', description: 'Description' },
        ],
      },
    ],
  },
}
```

## Webhook Processing

Button responses are automatically processed by the WhatsApp webhook:

1. **Webhook receives button click** from WhatsApp
2. **Signature verification** ensures authenticity
3. **Button response extracted** from webhook payload
4. **Action type determined** from button ID
5. **Handler executed** based on action type
6. **Response logged** to database

## Best Practices

### 1. Button Design

- **Keep titles short** - Maximum 20 characters
- **Use clear action words** - "Approve", "Pay Now", "View Details"
- **Add emojis sparingly** - One emoji per button for visual clarity

### 2. Message Content

- **Be concise** - WhatsApp users prefer short messages
- **Use formatting** - Bold (*text*) for emphasis
- **Include context** - Student name, dates, amounts
- **Add footer** - Consistent branding (e.g., "School ERP System")

### 3. Button IDs

- **Use descriptive IDs** - Easy to understand and debug
- **Include identifiers** - Student ID, leave ID, etc.
- **Keep consistent format** - Follow the pattern: `action_type_identifier`

### 4. Error Handling

- **Log all responses** - Even unhandled buttons
- **Fail gracefully** - Don't throw errors that stop webhook processing
- **Provide feedback** - Send confirmation messages when actions complete

## Testing

### Test Button Responses

1. Send an interactive message to a test WhatsApp number
2. Click a button in the message
3. Check webhook logs for button response
4. Verify handler was executed
5. Check database for logged response

### Test Custom Handlers

```typescript
import { processButtonResponse } from '@/lib/services/whatsapp-button-handler';

// Simulate a button response
await processButtonResponse({
  messageId: 'test_msg_123',
  from: '+919876543210',
  buttonId: 'custom_action_test',
  buttonText: 'Test Button',
  timestamp: new Date(),
});
```

## Troubleshooting

### Button Not Working

1. **Check webhook configuration** - Verify webhook URL is correct
2. **Verify signature** - Ensure WHATSAPP_APP_SECRET is set
3. **Check handler registration** - Verify handler is registered for button ID
4. **Review logs** - Check console for error messages

### Handler Not Executing

1. **Verify button ID format** - Must match registered action type
2. **Check handler registration** - Use `getRegisteredActions()` to list handlers
3. **Review error logs** - Handler errors are logged but don't stop processing

### Message Not Sending

1. **Check WhatsApp configuration** - Verify credentials are correct
2. **Verify phone number format** - Must be E.164 format (+country code)
3. **Check button count** - Maximum 3 buttons per message
4. **Review API errors** - Check WhatsApp API response

## Security Considerations

### Webhook Security

- **Signature verification** - All webhooks are verified using app secret
- **HTTPS only** - Webhooks must use HTTPS
- **Rate limiting** - Implement rate limiting on webhook endpoint

### Button Response Security

- **Verify permissions** - Check user has permission for the action
- **Validate identifiers** - Verify student IDs, leave IDs, etc. exist
- **Sanitize inputs** - Clean any user-provided data

### Data Privacy

- **Log minimal data** - Don't log sensitive information
- **Encrypt messages** - Message content is hashed in logs
- **Respect opt-outs** - Honor user preferences

## API Reference

### Button Handler Functions

#### `registerButtonAction(actionId, handler)`
Register a custom button action handler.

**Parameters:**
- `actionId` (string) - Action identifier (e.g., "custom_action")
- `handler` (function) - Handler function

#### `unregisterButtonAction(actionId)`
Unregister a button action handler.

**Parameters:**
- `actionId` (string) - Action identifier to unregister

#### `getRegisteredActions()`
Get list of all registered action IDs.

**Returns:** Array of action IDs

#### `processButtonResponse(response)`
Process a button response from WhatsApp.

**Parameters:**
- `response` (ButtonResponse) - Button response data

### Interactive Message Actions

All actions require authentication and return a result object:

```typescript
{
  success: boolean;
  messageId?: string;
  error?: string;
}
```

#### Attendance Actions
- `sendAttendanceConfirmation(params)`
- `sendAttendanceSummary(params)`

#### Fee Actions
- `sendFeePaymentReminder(params)`
- `sendFeePaymentConfirmation(params)`

#### Leave Actions
- `sendLeaveApprovalRequest(params)`
- `sendLeaveStatusNotification(params)`

#### General Actions
- `sendAnnouncement(params)`
- `sendExamReminder(params)`

## Examples

### Complete Workflow: Attendance Alert

```typescript
// 1. Student marked absent
const student = await getStudent('student_123');
const parent = await getParent(student.parentId);

// 2. Send interactive message
const result = await sendAttendanceConfirmation({
  to: parent.whatsappNumber,
  studentName: student.name,
  studentId: student.id,
  date: new Date().toLocaleDateString(),
  status: 'ABSENT',
  attendancePercentage: student.attendancePercentage,
});

// 3. Parent clicks "Acknowledged" button
// 4. Webhook receives button response
// 5. Handler logs acknowledgment
// 6. (Optional) Send confirmation message back to parent
```

### Complete Workflow: Leave Approval

```typescript
// 1. Student submits leave application
const leave = await createLeaveApplication({
  studentId: 'student_123',
  startDate: '2024-01-20',
  endDate: '2024-01-22',
  reason: 'Medical appointment',
});

// 2. Send approval request to admin
const admin = await getAdmin();
await sendLeaveApprovalRequest({
  to: admin.whatsappNumber,
  applicantName: leave.studentName,
  applicantType: 'Student',
  leaveType: leave.type,
  startDate: leave.startDate,
  endDate: leave.endDate,
  duration: leave.duration,
  reason: leave.reason,
  leaveId: leave.id,
});

// 3. Admin clicks "Approve" button
// 4. Webhook receives button response
// 5. Handler updates leave status
// 6. Send status notification to student/parent
await sendLeaveStatusNotification({
  to: parent.whatsappNumber,
  applicantName: leave.studentName,
  leaveType: leave.type,
  startDate: leave.startDate,
  endDate: leave.endDate,
  status: 'APPROVED',
  approverName: admin.name,
  leaveId: leave.id,
});
```

## Support

For issues or questions:
1. Check webhook logs in console
2. Review message logs in database
3. Test with sandbox credentials first
4. Contact WhatsApp Business API support for API issues

## Related Documentation

- [WhatsApp Notification Setup](./WHATSAPP_NOTIFICATION_SETUP.md)
- [MSG91 Migration Guide](./TWILIO_TO_MSG91_MIGRATION_GUIDE.md)
- [Webhook Testing Guide](./WEBHOOK_TESTING_GUIDE.md)
