# Notification Templates Seed Script

## Overview

This directory contains the seed script for adding notification templates for student promotion and alumni management features.

## Files

- `seed-promotion-alumni-templates.ts` - Standalone seed script for promotion and alumni templates
- `seed-message-templates.ts` - Main message templates seed (includes all templates)

## Templates Included

### Promotion Templates (1)
1. **Student Promotion Notification** - Notify about successful promotion

### Graduation Templates (2)
1. **Graduation Ceremony Notification** - Invite to graduation ceremony
2. **Graduation Congratulations** - Congratulate graduated students

### Alumni Templates (3)
1. **Alumni Welcome Message** - Welcome to alumni network
2. **Alumni Event Invitation** - Invite to alumni events
3. **Alumni Profile Update Reminder** - Remind to update profile

## Usage

### Run Standalone Script

To add only promotion and alumni templates:

```bash
npx tsx prisma/seed-promotion-alumni-templates.ts
```

### Run Main Seed Script

To seed all templates (including existing ones):

```bash
npm run db:seed
```

Or directly:

```bash
npx tsx prisma/seed.ts
```

## Prerequisites

- Database must be set up and migrated
- At least one ADMIN user must exist in the database
- Prisma client must be generated (`npm run postinstall`)

## Output

The script will output:
- ✓ Created template: [Template Name] - for newly created templates
- ✓ Template "[Template Name]" already exists, skipping... - for existing templates
- Summary with counts of created and skipped templates

Example output:
```
Seeding promotion and alumni message templates...
✓ Created template: Student Promotion Notification
✓ Created template: Graduation Ceremony Notification
✓ Created template: Graduation Congratulations
✓ Created template: Alumni Welcome Message
✓ Created template: Alumni Event Invitation
✓ Created template: Alumni Profile Update Reminder

✅ Template seeding completed!
   Created: 6 templates
   Skipped: 0 templates (already exist)
```

## Troubleshooting

### "No admin user found"

If you see this message, you need to create an admin user first:

```bash
npm run db:seed  # This will create admin user and other data
```

Then run the promotion/alumni templates seed:

```bash
npx tsx prisma/seed-promotion-alumni-templates.ts
```

### Templates Already Exist

If templates already exist, the script will skip them. To update existing templates:

1. Delete the templates from the database
2. Run the seed script again

Or use the template service to update them programmatically:

```typescript
import { notificationTemplateService } from "@/lib/services/notificationTemplateService";

await notificationTemplateService.createOrUpdateTemplate({
  name: "Student Promotion Notification",
  // ... updated data
});
```

### Database Connection Issues

Ensure your `.env` file has the correct `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database"
```

## Verification

After running the seed script, verify templates were created:

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

Or check in the database directly:

```sql
SELECT name, category, type, "isActive"
FROM message_templates
WHERE category IN ('Promotion', 'Graduation', 'Alumni');
```

## Template Structure

Each template includes:
- `name` - Unique template name
- `description` - Template description
- `type` - Message type (SMS, EMAIL, WHATSAPP, BOTH)
- `category` - Template category (Promotion, Graduation, Alumni)
- `subject` - Email subject (null for SMS)
- `body` - Template body with {{variables}}
- `variables` - JSON array of available variables
- `isActive` - Whether template is active
- `isDefault` - Whether it's a system default template
- `createdBy` - User ID who created the template

## Related Documentation

- [Notification Templates Guide](../docs/NOTIFICATION_TEMPLATES_GUIDE.md)
- [Notification Templates Quick Reference](../docs/NOTIFICATION_TEMPLATES_QUICK_REFERENCE.md)
- [Task 26 Implementation Summary](../docs/TASK_26_NOTIFICATION_TEMPLATES_SUMMARY.md)

## Support

For issues or questions:
1. Check the documentation in `docs/NOTIFICATION_TEMPLATES_GUIDE.md`
2. Review the test file: `src/test/notificationTemplates.test.ts`
3. Check the implementation: `src/lib/services/notificationTemplateService.ts`
