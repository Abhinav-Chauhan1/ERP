# Bulk Messaging Examples

## Common Use Cases

### Example 1: Send Fee Reminder to All Parents

```typescript
import { sendBulkMessage } from "@/lib/actions/bulkMessagingActions";

const result = await sendBulkMessage({
  messageType: "BOTH", // Send both SMS and Email
  subject: "Fee Payment Reminder",
  body: `Dear {{parentName}},

This is a reminder that the fee payment for {{studentName}} ({{className}}) is due on {{dueDate}}.

Amount Due: {{feeAmount}}

Please make the payment at your earliest convenience.

Thank you,
{{schoolName}}`,
  recipientSelection: {
    type: "ALL_PARENTS"
  }
});

console.log(`Sent to ${result.data.total} recipients`);
console.log(`SMS: ${result.data.sms.sent} sent, ${result.data.sms.failed} failed`);
console.log(`Email: ${result.data.email.sent} sent, ${result.data.email.failed} failed`);
```

### Example 2: Send Exam Schedule to Specific Classes

```typescript
const result = await sendBulkMessage({
  messageType: "EMAIL",
  subject: "Exam Schedule - Final Term",
  body: `Dear Students and Parents,

The final term examination schedule for {{className}} has been published.

Exam Start Date: {{examStartDate}}
Exam End Date: {{examEndDate}}

Please check the school portal for the detailed schedule.

Best regards,
{{schoolName}}`,
  recipientSelection: {
    type: "CLASS",
    classIds: ["class-id-1", "class-id-2", "class-id-3"]
  }
});
```

### Example 3: Send Emergency Alert to All Users

```typescript
const result = await sendBulkMessage({
  messageType: "SMS", // SMS for immediate delivery
  body: `URGENT: School will be closed tomorrow ({{date}}) due to weather conditions. Stay safe!`,
  recipientSelection: {
    type: "ROLE",
    roles: ["PARENT", "TEACHER", "STUDENT"]
  }
});
```

### Example 4: Send Welcome Message to New Teachers

```typescript
const result = await sendBulkMessage({
  messageType: "EMAIL",
  subject: "Welcome to {{schoolName}}!",
  body: `Dear {{teacherName}},

Welcome to {{schoolName}}! We're excited to have you join our team.

Your employee ID is: {{employeeId}}

Please visit the school office to complete your onboarding process.

If you have any questions, feel free to contact us at {{schoolEmail}}.

Best regards,
Administration Team`,
  recipientSelection: {
    type: "ROLE",
    roles: ["TEACHER"]
  }
});
```

### Example 5: Send Attendance Alert to Parents of Absent Students

```typescript
// First, get the list of absent students
const absentStudents = await getAbsentStudentsToday();

// Get their parent user IDs
const parentIds = absentStudents.flatMap(student => 
  student.parents.map(p => p.parent.userId)
);

const result = await sendBulkMessage({
  messageType: "SMS",
  body: `Dear {{parentName}}, {{studentName}} was marked absent today ({{date}}). Please contact the school if this is an error.`,
  recipientSelection: {
    type: "MANUAL",
    manualRecipients: parentIds
  }
});
```

### Example 6: Using Templates

```typescript
// First, create or get a template
const template = await getMessageTemplate("fee-reminder-template-id");

// Send using the template
const result = await sendBulkMessage({
  messageType: "BOTH",
  templateId: template.id,
  templateVariables: {
    dueDate: "2024-01-31",
    feeAmount: "₹5,000",
    schoolName: "ABC School"
  },
  recipientSelection: {
    type: "ALL_PARENTS"
  }
});
```

### Example 7: Preview Recipients Before Sending

```typescript
import { previewRecipients } from "@/lib/actions/bulkMessagingActions";

// Preview who will receive the message
const preview = await previewRecipients({
  type: "CLASS",
  classIds: ["class-id-1", "class-id-2"]
});

console.log(`This message will be sent to ${preview.data.length} recipients:`);
preview.data.forEach(recipient => {
  console.log(`- ${recipient.name} (${recipient.role})`);
});

// If preview looks good, send the message
if (confirm("Send message to these recipients?")) {
  const result = await sendBulkMessage({
    messageType: "EMAIL",
    subject: "Important Announcement",
    body: "...",
    recipientSelection: {
      type: "CLASS",
      classIds: ["class-id-1", "class-id-2"]
    }
  });
}
```

### Example 8: Send Birthday Wishes

```typescript
// Get students with birthdays today
const birthdayStudents = await getStudentsWithBirthdayToday();

for (const student of birthdayStudents) {
  await sendBulkMessage({
    messageType: "EMAIL",
    subject: "Happy Birthday {{studentName}}! 🎉",
    body: `Dear {{studentName}},

Wishing you a very happy birthday! 🎂

May this year bring you success, happiness, and wonderful memories.

Best wishes,
{{schoolName}} Family`,
    templateVariables: {
      studentName: student.name,
      schoolName: "ABC School"
    },
    recipientSelection: {
      type: "MANUAL",
      manualRecipients: [student.userId]
    }
  });
}
```

### Example 9: Send Report Card Notification

```typescript
const result = await sendBulkMessage({
  messageType: "BOTH",
  subject: "Report Card Available - {{term}}",
  body: `Dear {{parentName}},

The report card for {{studentName}} ({{className}}) is now available on the school portal.

Academic Performance: {{grade}}
Attendance: {{attendancePercentage}}%

Please log in to view the detailed report card.

Portal: {{schoolWebsite}}

Regards,
{{schoolName}}`,
  recipientSelection: {
    type: "ALL_PARENTS"
  }
});
```

### Example 10: Send Event Invitation

```typescript
const result = await sendBulkMessage({
  messageType: "EMAIL",
  subject: "Invitation: Annual Day Celebration",
  body: `Dear {{parentName}},

You are cordially invited to our Annual Day Celebration!

Date: {{eventDate}}
Time: {{eventTime}}
Venue: {{eventVenue}}

Your child {{studentName}} will be performing in the event.

Please confirm your attendance by replying to this email.

We look forward to seeing you!

Best regards,
{{schoolName}}`,
  recipientSelection: {
    type: "CLASS",
    classIds: ["class-id-1", "class-id-2"]
  }
});
```

## Advanced Patterns

### Pattern 1: Conditional Messaging

```typescript
// Send different messages based on student performance
const students = await getAllStudents();

const excellentStudents = students.filter(s => s.grade === "A+");
const needsImprovementStudents = students.filter(s => s.grade === "D" || s.grade === "F");

// Send congratulations to excellent students
await sendBulkMessage({
  messageType: "EMAIL",
  subject: "Congratulations on Excellent Performance!",
  body: "...",
  recipientSelection: {
    type: "MANUAL",
    manualRecipients: excellentStudents.map(s => s.userId)
  }
});

// Send improvement suggestions to struggling students
await sendBulkMessage({
  messageType: "EMAIL",
  subject: "Academic Support Available",
  body: "...",
  recipientSelection: {
    type: "MANUAL",
    manualRecipients: needsImprovementStudents.map(s => s.userId)
  }
});
```

### Pattern 2: Scheduled Messaging

```typescript
// Schedule a message to be sent later (requires additional implementation)
async function scheduleMessage(message: BulkMessageInput, sendAt: Date) {
  // Store the message in database with scheduled time
  await db.scheduledMessage.create({
    data: {
      ...message,
      scheduledFor: sendAt,
      status: "PENDING"
    }
  });
}

// Cron job to send scheduled messages
async function sendScheduledMessages() {
  const now = new Date();
  const pendingMessages = await db.scheduledMessage.findMany({
    where: {
      scheduledFor: { lte: now },
      status: "PENDING"
    }
  });

  for (const message of pendingMessages) {
    await sendBulkMessage(message);
    await db.scheduledMessage.update({
      where: { id: message.id },
      data: { status: "SENT" }
    });
  }
}
```

### Pattern 3: Personalized Batch Messaging

```typescript
// Send personalized messages to each recipient
const students = await getStudentsWithCustomData();

for (const student of students) {
  await sendBulkMessage({
    messageType: "EMAIL",
    subject: "Your Personalized Report",
    body: `Dear {{studentName}},

Your performance summary:
- Math: {{mathGrade}}
- Science: {{scienceGrade}}
- English: {{englishGrade}}

Overall Grade: {{overallGrade}}

Keep up the good work!`,
    templateVariables: {
      studentName: student.name,
      mathGrade: student.grades.math,
      scienceGrade: student.grades.science,
      englishGrade: student.grades.english,
      overallGrade: student.overallGrade
    },
    recipientSelection: {
      type: "MANUAL",
      manualRecipients: [student.userId]
    }
  });
  
  // Small delay between personalized messages
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

## Error Handling

### Example: Handling Failures

```typescript
const result = await sendBulkMessage({
  messageType: "BOTH",
  subject: "Important Notice",
  body: "...",
  recipientSelection: {
    type: "ALL_PARENTS"
  }
});

if (result.success) {
  // Check for partial failures
  if (result.data.sms.failed > 0) {
    console.error(`${result.data.sms.failed} SMS messages failed to send`);
    // Log failed SMS recipients for retry
    result.data.sms.results
      .filter(r => !r.success)
      .forEach(r => console.error(`Failed to send SMS to ${r.to}: ${r.error}`));
  }
  
  if (result.data.email.failed > 0) {
    console.error(`${result.data.email.failed} email messages failed to send`);
    // Log failed email recipients for retry
    result.data.email.results
      .filter(r => !r.success)
      .forEach(r => console.error(`Failed to send email to ${r.to}: ${r.error}`));
  }
} else {
  console.error(`Bulk message failed: ${result.error}`);
}
```

## Best Practices

1. **Always Preview**: Use `previewRecipients()` before sending to large groups
2. **Test First**: Test with a small group before sending to everyone
3. **Personalize**: Use template variables to make messages more personal
4. **Clear Subject**: Use descriptive subject lines for emails
5. **Concise SMS**: Keep SMS messages under 160 characters when possible
6. **Error Handling**: Always check the result and handle failures appropriately
7. **Rate Limits**: Be mindful of your SMS/Email provider's rate limits
8. **Timing**: Send messages at appropriate times (not too early or too late)
9. **Opt-out**: Respect user preferences for notifications
10. **Audit Trail**: Log all bulk messaging operations for compliance

## Related Documentation

- [Bulk Messaging Guide](./BULK_MESSAGING_GUIDE.md)
- [Message Templates Guide](./MESSAGE_TEMPLATES_GUIDE.md)
- [SMS Gateway Setup](./SMS_GATEWAY_SETUP.md)
- [Email Service Integration](./EMAIL_SERVICE_INTEGRATION.md)
