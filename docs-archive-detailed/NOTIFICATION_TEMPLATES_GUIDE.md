# Notification Templates Guide

## Overview

This guide provides comprehensive information about the notification template system for student promotion and alumni management features in the Sikshamitra ERP platform.

## Available Templates

### Promotion Templates

#### 1. Student Promotion Notification
- **Category:** Promotion
- **Type:** BOTH (Email & SMS)
- **Purpose:** Notify students and parents about successful promotion to the next class
- **Variables:**
  - `parentName` - Parent's full name
  - `studentName` - Student's full name
  - `sourceClass` - Previous class name
  - `sourceSection` - Previous section name
  - `targetClass` - New class name
  - `targetSection` - New section name
  - `targetAcademicYear` - Academic year (e.g., "2024-2025")
  - `rollNumber` - New roll number
  - `sessionStartDate` - Start date of new session
  - `schoolName` - School name
  - `schoolPhone` - School contact number

### Graduation Templates

#### 2. Graduation Ceremony Notification
- **Category:** Graduation
- **Type:** EMAIL
- **Purpose:** Invite students and parents to graduation ceremony
- **Variables:**
  - `parentName` - Parent's full name
  - `studentName` - Student's full name
  - `ceremonyDate` - Date of ceremony
  - `ceremonyTime` - Time of ceremony
  - `ceremonyVenue` - Venue location
  - `chiefGuest` - Chief guest name
  - `finalClass` - Final class completed
  - `finalSection` - Final section
  - `graduationDate` - Official graduation date
  - `schoolName` - School name
  - `schoolPhone` - School contact number
  - `schoolEmail` - School email address

#### 3. Graduation Congratulations
- **Category:** Graduation
- **Type:** BOTH (Email & SMS)
- **Purpose:** Send congratulatory message to graduated students
- **Variables:**
  - `studentName` - Student's full name
  - `finalClass` - Final class completed
  - `finalSection` - Final section
  - `graduationDate` - Official graduation date
  - `academicYear` - Academic year
  - `schoolName` - School name
  - `schoolPhone` - School contact number
  - `schoolEmail` - School email address

### Alumni Templates

#### 4. Alumni Welcome Message
- **Category:** Alumni
- **Type:** EMAIL
- **Purpose:** Welcome newly created alumni to the alumni network
- **Variables:**
  - `alumniName` - Alumni's full name
  - `graduationYear` - Year of graduation
  - `finalClass` - Final class completed
  - `admissionId` - Original admission ID
  - `portalUrl` - Alumni portal URL
  - `schoolName` - School name
  - `schoolPhone` - School contact number
  - `schoolEmail` - School email address

#### 5. Alumni Event Invitation
- **Category:** Alumni
- **Type:** EMAIL
- **Purpose:** Invite alumni to school events and reunions
- **Variables:**
  - `alumniName` - Alumni's full name
  - `eventName` - Name of the event
  - `eventDate` - Date of event
  - `eventTime` - Time of event
  - `eventVenue` - Venue location
  - `eventDescription` - Event description
  - `rsvpDeadline` - RSVP deadline date
  - `rsvpLink` - RSVP link
  - `contactPerson` - Contact person name
  - `contactPhone` - Contact phone number
  - `schoolName` - School name
  - `schoolPhone` - School contact number
  - `schoolEmail` - School email address

#### 6. Alumni Profile Update Reminder
- **Category:** Alumni
- **Type:** EMAIL
- **Purpose:** Remind alumni to update their profile information
- **Variables:**
  - `alumniName` - Alumni's full name
  - `lastUpdated` - Last update date
  - `graduationYear` - Year of graduation
  - `currentOccupation` - Current occupation
  - `profileUrl` - Profile update URL
  - `schoolName` - School name
  - `schoolEmail` - School email address

## Installation

### 1. Seed Templates to Database

Run the seed script to add all promotion and alumni templates:

```bash
npx tsx prisma/seed-promotion-alumni-templates.ts
```

Or run the main seed script which includes all templates:

```bash
npm run db:seed
```

### 2. Verify Templates

Check that templates were created successfully:

```typescript
import { db } from "@/lib/db";

const templates = await db.messageTemplate.findMany({
  where: {
    category: {
      in: ["Promotion", "Graduation", "Alumni"],
    },
  },
});

console.log(`Found ${templates.length} templates`);
```

## Usage

### Using Template Utilities

#### Basic Variable Replacement

```typescript
import { replaceTemplateVariables } from "@/lib/utils/templateUtils";

const template = "Hello {{name}}, welcome to {{school}}!";
const variables = { name: "John", school: "Springfield High" };
const result = replaceTemplateVariables(template, variables);
// Result: "Hello John, welcome to Springfield High!"
```

#### Render Complete Template

```typescript
import { renderMessageTemplate } from "@/lib/utils/templateUtils";

const template = {
  subject: "Welcome {{name}}",
  body: "Hello {{name}}, welcome to {{school}}!",
};
const variables = { name: "John", school: "Springfield High" };
const result = renderMessageTemplate(template, variables);
// Result: { subject: "Welcome John", body: "Hello John, welcome to Springfield High!" }
```

### Using Template Service

#### Render Promotion Notification

```typescript
import { notificationTemplateService } from "@/lib/services/notificationTemplateService";

const message = await notificationTemplateService.renderPromotionNotification({
  parentName: "John Smith",
  studentName: "Alex Smith",
  sourceClass: "Grade 10",
  sourceSection: "A",
  targetClass: "Grade 11",
  targetSection: "B",
  targetAcademicYear: "2024-2025",
  rollNumber: "11B001",
  sessionStartDate: new Date("2024-09-01"),
  schoolName: "Springfield High School",
  schoolPhone: "+1-555-0100",
});

// Use message.subject and message.body to send notification
```

#### Render Graduation Ceremony Notification

```typescript
const message = await notificationTemplateService.renderGraduationCeremonyNotification({
  parentName: "John Smith",
  studentName: "Alex Smith",
  ceremonyDate: new Date("2024-06-15"),
  ceremonyTime: "10:00 AM",
  ceremonyVenue: "School Auditorium",
  chiefGuest: "Dr. Jane Doe",
  finalClass: "Grade 12",
  finalSection: "A",
  graduationDate: new Date("2024-06-15"),
  schoolName: "Springfield High School",
  schoolPhone: "+1-555-0100",
  schoolEmail: "info@springfieldhigh.edu",
});
```

#### Render Alumni Welcome Message

```typescript
const message = await notificationTemplateService.renderAlumniWelcomeMessage({
  alumniName: "Alex Smith",
  graduationYear: 2024,
  finalClass: "Grade 12",
  admissionId: "ADM2018001",
  portalUrl: "https://springfieldhigh.edu/alumni",
  schoolName: "Springfield High School",
  schoolPhone: "+1-555-0100",
  schoolEmail: "alumni@springfieldhigh.edu",
});
```

### Integration with Promotion Service

```typescript
import { notificationTemplateService } from "@/lib/services/notificationTemplateService";
import { sendMessage } from "@/lib/services/messagingService";

// After successful promotion
async function sendPromotionNotifications(promotedStudents: any[]) {
  for (const student of promotedStudents) {
    const message = await notificationTemplateService.renderPromotionNotification({
      parentName: student.parent.name,
      studentName: student.name,
      sourceClass: student.sourceClass,
      sourceSection: student.sourceSection,
      targetClass: student.targetClass,
      targetSection: student.targetSection,
      targetAcademicYear: student.targetAcademicYear,
      rollNumber: student.newRollNumber,
      sessionStartDate: student.sessionStartDate,
      schoolName: systemSettings.schoolName,
      schoolPhone: systemSettings.schoolPhone,
    });

    // Send via email and SMS
    await sendMessage({
      to: student.parent.email,
      subject: message.subject,
      body: message.body,
      type: "EMAIL",
    });

    await sendMessage({
      to: student.parent.phone,
      body: message.body,
      type: "SMS",
    });
  }
}
```

## Template Customization

### Viewing Templates

Get all promotion and alumni templates:

```typescript
const templates = await notificationTemplateService.getAllPromotionAlumniTemplates();
```

Get templates by category:

```typescript
const promotionTemplates = await notificationTemplateService.getTemplatesByCategory("Promotion");
const graduationTemplates = await notificationTemplateService.getTemplatesByCategory("Graduation");
const alumniTemplates = await notificationTemplateService.getTemplatesByCategory("Alumni");
```

### Creating Custom Templates

```typescript
await notificationTemplateService.createOrUpdateTemplate({
  name: "Custom Promotion Message",
  description: "Custom message for special promotions",
  type: "EMAIL",
  category: "Promotion",
  subject: "Special Promotion - {{studentName}}",
  body: "Custom message body with {{variables}}",
  variables: ["studentName", "variables"],
  createdBy: userId,
});
```

### Updating Existing Templates

```typescript
// Same method as creating - will update if name exists
await notificationTemplateService.createOrUpdateTemplate({
  name: "Student Promotion Notification",
  description: "Updated description",
  type: "BOTH",
  category: "Promotion",
  subject: "Updated subject - {{studentName}}",
  body: "Updated body...",
  variables: ["studentName", "parentName", "..."],
  createdBy: userId,
});
```

### Deactivating Templates

```typescript
await notificationTemplateService.deactivateTemplate("Student Promotion Notification");
```

### Activating Templates

```typescript
await notificationTemplateService.activateTemplate("Student Promotion Notification");
```

## Template Variables

### Variable Naming Convention

- Use camelCase for variable names
- Use descriptive names (e.g., `studentName` not `name`)
- Keep names consistent across templates

### Variable Types

Variables can be:
- **String:** Text values (names, addresses, etc.)
- **Number:** Numeric values (years, scores, etc.)
- **Date:** Date values (automatically formatted)

### Date Formatting

Dates are automatically formatted using the `formatDateForTemplate` utility:

```typescript
import { formatDateForTemplate } from "@/lib/utils/templateUtils";

const date = new Date("2024-03-15");

// Short format: 03/15/2024
const short = formatDateForTemplate(date, "short");

// Long format: March 15, 2024
const long = formatDateForTemplate(date, "long");

// Time format: 02:30 PM
const time = formatDateForTemplate(date, "time");
```

## Best Practices

### 1. Always Validate Variables

```typescript
import { validateTemplateVariables } from "@/lib/utils/templateUtils";

const required = ["studentName", "parentName", "schoolName"];
const data = { studentName: "John", parentName: "Jane" };

const validation = validateTemplateVariables(required, data);
if (!validation.valid) {
  console.error(`Missing variables: ${validation.missing.join(", ")}`);
}
```

### 2. Handle Missing Variables Gracefully

The template system automatically replaces missing variables with empty strings, but it's better to provide default values:

```typescript
const variables = {
  studentName: student.name,
  parentName: parent?.name || "Parent/Guardian",
  rollNumber: student.rollNumber || "TBD",
};
```

### 3. Use Helper Functions

Use the provided helper functions for preparing variables:

```typescript
import {
  preparePromotionVariables,
  prepareGraduationVariables,
  prepareAlumniWelcomeVariables,
} from "@/lib/utils/templateUtils";

// These functions handle optional fields and formatting
const variables = preparePromotionVariables(data);
```

### 4. Test Templates Before Deployment

Always test templates with sample data before using in production:

```typescript
const testData = {
  parentName: "Test Parent",
  studentName: "Test Student",
  // ... other fields
};

const message = await notificationTemplateService.renderPromotionNotification(testData);
console.log("Subject:", message.subject);
console.log("Body:", message.body);
```

### 5. Keep Templates User-Friendly

- Use clear, professional language
- Include all necessary information
- Format for readability (use line breaks, sections)
- Provide contact information for questions

## Troubleshooting

### Template Not Found

If you get "Template not found" error:

1. Check template name is correct (case-sensitive)
2. Verify template is active: `isActive: true`
3. Run seed script if templates are missing

### Variables Not Replaced

If variables are not being replaced:

1. Check variable names match exactly (case-sensitive)
2. Verify variables are in the correct format: `{{variableName}}`
3. Ensure you're passing the variable in the data object

### Date Formatting Issues

If dates are not formatting correctly:

1. Ensure you're passing a valid Date object
2. Use the `formatDateForTemplate` utility
3. Check the format parameter ("short", "long", or "time")

## API Reference

### Template Utilities

- `replaceTemplateVariables(template, variables)` - Replace variables in template
- `validateTemplateVariables(required, data)` - Validate required variables
- `extractTemplateVariables(template)` - Extract variable names from template
- `renderMessageTemplate(template, variables)` - Render complete template
- `formatDateForTemplate(date, format)` - Format date for templates
- `preparePromotionVariables(data)` - Prepare promotion variables
- `prepareGraduationVariables(data)` - Prepare graduation variables
- `prepareAlumniWelcomeVariables(data)` - Prepare alumni welcome variables
- `prepareAlumniEventVariables(data)` - Prepare alumni event variables
- `prepareAlumniProfileUpdateVariables(data)` - Prepare profile update variables

### Template Service

- `getTemplateByName(name)` - Get template by name
- `getTemplatesByCategory(category)` - Get templates by category
- `renderPromotionNotification(data)` - Render promotion notification
- `renderGraduationCeremonyNotification(data)` - Render graduation ceremony notification
- `renderGraduationCongratulations(data)` - Render graduation congratulations
- `renderAlumniWelcomeMessage(data)` - Render alumni welcome message
- `renderAlumniEventInvitation(data)` - Render alumni event invitation
- `renderAlumniProfileUpdateReminder(data)` - Render profile update reminder
- `getAllPromotionAlumniTemplates()` - Get all promotion/alumni templates
- `createOrUpdateTemplate(data)` - Create or update template
- `deactivateTemplate(name)` - Deactivate template
- `activateTemplate(name)` - Activate template

## Support

For questions or issues with notification templates:

1. Check this documentation
2. Review the test file: `src/test/notificationTemplates.test.ts`
3. Check the implementation: `src/lib/utils/templateUtils.ts`
4. Contact the development team

## Related Documentation

- [Student Promotion and Alumni Management Design](../.kiro/specs/student-promotion-alumni/design.md)
- [Student Promotion and Alumni Management Requirements](../.kiro/specs/student-promotion-alumni/requirements.md)
- [Message Template System](./MESSAGE_TEMPLATES_GUIDE.md)
