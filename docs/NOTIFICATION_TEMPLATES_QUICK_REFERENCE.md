# Notification Templates Quick Reference

## Quick Start

### 1. Seed Templates
```bash
npx tsx prisma/seed-promotion-alumni-templates.ts
```

### 2. Use in Code
```typescript
import { notificationTemplateService } from "@/lib/services/notificationTemplateService";

// Render promotion notification
const message = await notificationTemplateService.renderPromotionNotification({
  parentName: "John Smith",
  studentName: "Alex Smith",
  sourceClass: "Grade 10",
  targetClass: "Grade 11",
  targetAcademicYear: "2024-2025",
  sessionStartDate: new Date("2024-09-01"),
  schoolName: "Springfield High",
  schoolPhone: "+1-555-0100",
});
```

## Available Templates

| Template Name | Category | Type | Purpose |
|--------------|----------|------|---------|
| Student Promotion Notification | Promotion | BOTH | Notify about promotion |
| Graduation Ceremony Notification | Graduation | EMAIL | Invite to ceremony |
| Graduation Congratulations | Graduation | BOTH | Congratulate graduate |
| Alumni Welcome Message | Alumni | EMAIL | Welcome to alumni network |
| Alumni Event Invitation | Alumni | EMAIL | Invite to alumni event |
| Alumni Profile Update Reminder | Alumni | EMAIL | Remind to update profile |

## Common Operations

### Get Template
```typescript
const template = await notificationTemplateService.getTemplateByName("Student Promotion Notification");
```

### Get Templates by Category
```typescript
const templates = await notificationTemplateService.getTemplatesByCategory("Promotion");
```

### Render Template
```typescript
import { renderMessageTemplate } from "@/lib/utils/templateUtils";

const result = renderMessageTemplate(template, variables);
// Returns: { subject: string | null, body: string }
```

### Validate Variables
```typescript
import { validateTemplateVariables } from "@/lib/utils/templateUtils";

const validation = validateTemplateVariables(["name", "school"], data);
if (!validation.valid) {
  console.error(`Missing: ${validation.missing.join(", ")}`);
}
```

## Template Variables

### Promotion Template
```typescript
{
  parentName: string,
  studentName: string,
  sourceClass: string,
  sourceSection?: string,
  targetClass: string,
  targetSection?: string,
  targetAcademicYear: string,
  rollNumber?: string,
  sessionStartDate: Date,
  schoolName: string,
  schoolPhone: string,
}
```

### Graduation Template
```typescript
{
  parentName?: string,
  studentName: string,
  ceremonyDate: Date,
  ceremonyTime: string,
  ceremonyVenue: string,
  chiefGuest?: string,
  finalClass: string,
  finalSection?: string,
  graduationDate: Date,
  academicYear?: string,
  schoolName: string,
  schoolPhone: string,
  schoolEmail: string,
}
```

### Alumni Welcome Template
```typescript
{
  alumniName: string,
  graduationYear: number,
  finalClass: string,
  admissionId: string,
  portalUrl: string,
  schoolName: string,
  schoolPhone: string,
  schoolEmail: string,
}
```

## Helper Functions

### Prepare Variables
```typescript
import {
  preparePromotionVariables,
  prepareGraduationVariables,
  prepareAlumniWelcomeVariables,
} from "@/lib/utils/templateUtils";

const variables = preparePromotionVariables(data);
```

### Format Dates
```typescript
import { formatDateForTemplate } from "@/lib/utils/templateUtils";

const date = new Date("2024-03-15");
const short = formatDateForTemplate(date, "short");  // 03/15/2024
const long = formatDateForTemplate(date, "long");    // March 15, 2024
const time = formatDateForTemplate(date, "time");    // 02:30 PM
```

## Template Management

### Create/Update Template
```typescript
await notificationTemplateService.createOrUpdateTemplate({
  name: "Custom Template",
  description: "Description",
  type: "EMAIL",
  category: "Promotion",
  subject: "Subject {{variable}}",
  body: "Body {{variable}}",
  variables: ["variable"],
  createdBy: userId,
});
```

### Activate/Deactivate
```typescript
await notificationTemplateService.deactivateTemplate("Template Name");
await notificationTemplateService.activateTemplate("Template Name");
```

## Integration Example

```typescript
// In promotion service
import { notificationTemplateService } from "@/lib/services/notificationTemplateService";

async function sendPromotionNotifications(students: any[]) {
  for (const student of students) {
    const message = await notificationTemplateService.renderPromotionNotification({
      parentName: student.parent.name,
      studentName: student.name,
      sourceClass: student.sourceClass,
      targetClass: student.targetClass,
      targetAcademicYear: student.targetAcademicYear,
      sessionStartDate: new Date("2024-09-01"),
      schoolName: "Springfield High",
      schoolPhone: "+1-555-0100",
    });

    // Send notification
    await sendEmail({
      to: student.parent.email,
      subject: message.subject,
      body: message.body,
    });
  }
}
```

## Testing

```typescript
// Run tests
npm run test:run -- src/test/notificationTemplates.test.ts
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Template not found | Run seed script, check template name |
| Variables not replaced | Check variable names match exactly |
| Date formatting issues | Use `formatDateForTemplate` utility |
| Missing variables | Use `validateTemplateVariables` |

## File Locations

- **Seed Script:** `prisma/seed-promotion-alumni-templates.ts`
- **Template Utils:** `src/lib/utils/templateUtils.ts`
- **Template Service:** `src/lib/services/notificationTemplateService.ts`
- **Tests:** `src/test/notificationTemplates.test.ts`
- **Documentation:** `docs/NOTIFICATION_TEMPLATES_GUIDE.md`

## Requirements Mapping

- **Requirement 15.1:** Promotion notifications ✓
- **Requirement 15.2:** Include class/year details ✓
- **Requirement 15.4:** Graduation messages ✓
- **Requirement 15.5:** Customizable templates ✓
- **Requirement 11.6:** Congratulatory messages ✓
