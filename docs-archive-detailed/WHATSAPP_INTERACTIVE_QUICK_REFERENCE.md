# WhatsApp Interactive Messages - Quick Reference

## Quick Start

### Send an Interactive Message

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

### Register a Custom Button Handler

```typescript
import { registerButtonAction } from '@/lib/services/whatsapp-button-handler';

registerButtonAction('my_action', async (response) => {
  // Handle button click
  console.log('Button clicked:', response.buttonId);
});
```

## Available Templates

### Attendance
- `sendAttendanceConfirmation()` - Alert with buttons
- `sendAttendanceSummary()` - Weekly summary with list

### Fees
- `sendFeePaymentReminder()` - Payment reminder with "Pay Now"
- `sendFeePaymentConfirmation()` - Payment receipt

### Leave
- `sendLeaveApprovalRequest()` - Approval request with buttons
- `sendLeaveStatusNotification()` - Status update

### General
- `sendAnnouncement()` - Custom announcements
- `sendExamReminder()` - Exam notifications

## Button ID Format

```
{action_type}_{identifier}_{params}
```

**Examples:**
- `attendance_confirm_student123_2024-01-15`
- `fee_pay_student456_fee789`
- `leave_approve_leave123`

## Message Types

### Button Message (Max 3 buttons)

```typescript
{
  type: 'button',
  header: { type: 'text', text: 'Title' },
  body: { text: 'Message' },
  footer: { text: 'Footer' },
  action: {
    buttons: [
      { type: 'reply', reply: { id: 'btn_1', title: 'Button 1' } },
    ],
  },
}
```

### List Message (Max 10 items)

```typescript
{
  type: 'list',
  header: { type: 'text', text: 'Title' },
  body: { text: 'Message' },
  action: {
    button: 'View Options',
    sections: [
      {
        title: 'Section',
        rows: [
          { id: 'opt_1', title: 'Option 1', description: 'Desc' },
        ],
      },
    ],
  },
}
```

## Built-in Handlers

| Action Type | Button ID Pattern | Description |
|------------|-------------------|-------------|
| `attendance_confirm` | `attendance_confirm_{studentId}_{date}` | Attendance acknowledgment |
| `fee_pay` | `fee_pay_{studentId}_{feeId}` | Fee payment initiation |
| `leave_approve` | `leave_approve_{leaveId}` | Leave approval |
| `leave_reject` | `leave_reject_{leaveId}` | Leave rejection |

## Common Patterns

### Send and Handle Response

```typescript
// 1. Send message
await sendAttendanceConfirmation({ ... });

// 2. Register handler (done at startup)
registerButtonAction('attendance_confirm', async (response) => {
  // Update database
  await updateAttendanceAcknowledgment(response);
  
  // Send confirmation
  await sendTextMessage(response.from, 'Thank you for confirming!');
});
```

### Custom Template

```typescript
import { sendInteractiveMessage } from '@/lib/services/whatsapp-service';

const interactive = {
  type: 'button',
  body: { text: 'Your message here' },
  action: {
    buttons: [
      { type: 'reply', reply: { id: 'custom_action_123', title: 'Click Me' } },
    ],
  },
};

await sendInteractiveMessage('+919876543210', interactive);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Button not working | Check webhook configuration and signature |
| Handler not executing | Verify button ID format matches action type |
| Message not sending | Check phone number format (E.164) |
| Too many buttons | Maximum 3 buttons per message |

## Environment Variables

```env
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_APP_SECRET=your_secret
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

## Testing

```typescript
// Test button response
import { processButtonResponse } from '@/lib/services/whatsapp-button-handler';

await processButtonResponse({
  messageId: 'test_123',
  from: '+919876543210',
  buttonId: 'test_action_123',
  buttonText: 'Test',
  timestamp: new Date(),
});
```

## Best Practices

✅ **DO:**
- Keep button titles under 20 characters
- Use clear action words
- Include context in messages
- Log all button responses
- Verify user permissions

❌ **DON'T:**
- Use more than 3 buttons
- Include sensitive data in button IDs
- Throw errors in handlers
- Skip signature verification
- Ignore user opt-outs

## Quick Links

- [Full Guide](./WHATSAPP_INTERACTIVE_MESSAGES_GUIDE.md)
- [WhatsApp Setup](./WHATSAPP_NOTIFICATION_SETUP.md)
- [Webhook Testing](./WEBHOOK_TESTING_GUIDE.md)
