# Report Card Publishing Workflow

## Overview

The Report Card Publishing Workflow enables administrators to control when report cards become visible to students and parents. This ensures that report cards are only shared after they have been reviewed and finalized.

## Features

### 1. Draft/Published Status
- Report cards are created in **draft** status by default
- Draft report cards are only visible to administrators
- Published report cards are visible to students and parents

### 2. Publishing Controls
- Single report card publishing with confirmation dialog
- Batch publishing for multiple report cards
- Optional notification sending on publish

### 3. Access Control
- **Draft Status**: Only administrators can view
- **Published Status**: Visible to:
  - The student
  - All parents linked to the student
  - Administrators

### 4. Notifications
When publishing with notifications enabled:
- **In-app notifications** are created for:
  - The student
  - All parents linked to the student
- **Email notifications** (placeholder for future implementation)

## Usage

### Publishing a Single Report Card

#### From the Report Cards List Page

1. Navigate to **Admin > Assessment > Report Cards**
2. Switch to the **Draft** tab
3. Find the report card you want to publish
4. Click the **Publish** button
5. In the confirmation dialog:
   - Review the report card details
   - Check/uncheck "Send notification to student and parents"
   - Click **Publish Report Card**

#### From the Report Card Details View

1. Open a draft report card
2. Click the **Publish** button in the dialog footer
3. Confirm the publication in the dialog

### Batch Publishing Report Cards

Use the `batchPublishReportCards` server action to publish multiple report cards at once:

```typescript
import { batchPublishReportCards } from '@/lib/actions/reportCardsActions';

const result = await batchPublishReportCards(
  ['report-id-1', 'report-id-2', 'report-id-3'],
  true // sendNotification
);

if (result.success) {
  console.log(`Published ${result.data.successful.length} report cards`);
  console.log(`Failed: ${result.data.failed.length}`);
}
```

## Database Schema

### ReportCard Model Fields

```prisma
model ReportCard {
  // ... other fields
  
  isPublished      Boolean   @default(false)
  publishDate      DateTime?
  
  // ... other fields
}
```

- `isPublished`: Boolean flag indicating publication status
- `publishDate`: Timestamp when the report card was published

## Server Actions

### publishReportCard

Publishes a single report card and optionally sends notifications.

```typescript
export async function publishReportCard(data: ReportCardPublishValues): Promise<ActionResult>
```

**Parameters:**
- `data.id`: Report card ID
- `data.sendNotification`: Whether to send notifications (default: false)

**Returns:**
- `success`: Boolean indicating operation success
- `data`: Updated report card object (if successful)
- `error`: Error message (if failed)

**Validation:**
- Report card must exist
- Report card must not already be published

**Side Effects:**
- Sets `isPublished` to `true`
- Sets `publishDate` to current timestamp
- Creates in-app notifications (if `sendNotification` is true)
- Revalidates relevant pages

### batchPublishReportCards

Publishes multiple report cards in a batch operation.

```typescript
export async function batchPublishReportCards(
  reportCardIds: string[],
  sendNotification?: boolean
): Promise<ActionResult>
```

**Parameters:**
- `reportCardIds`: Array of report card IDs to publish
- `sendNotification`: Whether to send notifications (default: false)

**Returns:**
- `success`: Boolean indicating operation success
- `data.successful`: Array of successfully published report card IDs
- `data.failed`: Array of objects with failed IDs and error messages
- `message`: Summary message

## Access Control Implementation

### Student Portal

Students can only view their own published report cards:

```typescript
// src/lib/actions/student-assessment-actions.ts
export async function getReportCards() {
  const reportCards = await db.reportCard.findMany({
    where: {
      studentId: student.id,
      isPublished: true, // Only published cards
    },
    // ...
  });
}
```

### Parent Portal

Parents can only view published report cards for their children:

```typescript
// src/lib/actions/parent-performance-actions.ts
export async function getProgressReports(input: GetProgressReportsInput) {
  const where: any = {
    studentId: validated.childId
  };
  
  if (!validated.includeUnpublished) {
    where.isPublished = true; // Only published cards by default
  }
  
  const reportCards = await db.reportCard.findMany({ where });
}
```

## Notification System

### In-App Notifications

When a report card is published with notifications enabled:

**For Students:**
```
Title: "Report Card Published"
Message: "Your report card for [Term Name] ([Academic Year]) has been published and is now available for viewing."
Type: ACADEMIC
```

**For Parents:**
```
Title: "Report Card Published"
Message: "Report card for [Student Name] - [Term Name] ([Academic Year]) has been published."
Type: ACADEMIC
```

### Email Notifications (Future Enhancement)

Email notifications are currently a placeholder. To implement:

1. Integrate with an email service (SendGrid, AWS SES, etc.)
2. Create email templates for report card publication
3. Uncomment and implement the email sending logic in `publishReportCard`

```typescript
// Example implementation
await sendEmail({
  to: reportCard.student.user.email,
  subject: "Report Card Published",
  template: "report-card-published",
  data: {
    studentName: `${reportCard.student.user.firstName} ${reportCard.student.user.lastName}`,
    termName: reportCard.term.name,
    academicYear: reportCard.term.academicYear.name,
    reportCardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/assessments/report-cards/${reportCard.id}`
  }
});
```

## UI Components

### Publish Confirmation Dialog

The publish dialog includes:
- Report card details summary
- Checkbox for sending notifications
- Cancel and Publish buttons

### Report Cards List

The list page shows:
- **Published Tab**: All published report cards with issue date
- **Draft Tab**: All draft report cards with publish action

## Best Practices

1. **Review Before Publishing**: Always review report card details, remarks, and grades before publishing
2. **Batch Operations**: Use batch publishing for entire classes to save time
3. **Notifications**: Enable notifications for important term reports
4. **Timing**: Publish report cards during appropriate times (e.g., end of term)
5. **Verification**: Check that all required data (grades, remarks, attendance) is complete before publishing

## Error Handling

The system handles various error scenarios:

- **Report card not found**: Returns error message
- **Already published**: Prevents duplicate publication
- **Notification failures**: Logs error but doesn't fail the publish operation
- **Database errors**: Returns appropriate error messages

## Testing

Unit tests are provided in `src/lib/actions/__tests__/reportCardsActions.publish.test.ts`:

- Publishing draft report cards
- Preventing duplicate publication
- Handling missing report cards
- Notification sending
- Batch publishing with partial failures

Run tests:
```bash
npm test -- reportCardsActions.publish.test.ts --run
```

## Requirements Validation

This implementation satisfies the following requirements:

- **12.1**: Draft report cards are not visible to students or parents
- **12.2**: Publishing sets `isPublished` to true and `publishDate` to current timestamp
- **12.3**: Optional email notifications on publish (in-app notifications implemented)
- **12.4**: Published report cards are visible in student and parent portals
- **12.5**: Publication date is displayed on published report cards

## Future Enhancements

1. **Email Integration**: Complete email notification implementation
2. **SMS Notifications**: Add SMS notification option
3. **Scheduled Publishing**: Allow scheduling report card publication for a future date
4. **Bulk Actions**: Add UI for batch publishing from the admin interface
5. **Unpublish Feature**: Allow administrators to unpublish report cards if needed
6. **Publication History**: Track publication history and changes
7. **Preview Mode**: Allow parents to preview report cards before official publication
