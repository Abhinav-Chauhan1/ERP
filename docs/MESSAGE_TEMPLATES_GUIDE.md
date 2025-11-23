# Message Templates Guide

## Overview

The Message Template Management system allows administrators to create, manage, and reuse message templates for SMS and email communications. Templates support dynamic variables that are automatically replaced with actual values when sending messages.

## Features

- **Template Types**: Create templates for SMS, Email, or Both
- **Dynamic Variables**: Use placeholders like `{{studentName}}` that get replaced with actual data
- **Categories**: Organize templates by purpose (Fees, Attendance, Exams, etc.)
- **Default Templates**: System comes with 8 pre-configured templates
- **Template Preview**: See how your message will look before saving
- **Duplicate Templates**: Quickly create variations of existing templates
- **Active/Inactive Status**: Control which templates are available for use

## Accessing Message Templates

Navigate to: **Admin Dashboard → Communication → Message Templates**

Or directly: `/admin/communication/templates`

## Creating a New Template

1. Click the **"New Template"** button
2. Fill in the template details:
   - **Name**: Unique identifier for the template
   - **Description**: Brief explanation of when to use this template
   - **Type**: Choose SMS, Email, or Both
   - **Category**: Optional grouping (e.g., "Fees", "Attendance")
   - **Subject**: Required for email templates
   - **Body**: The message content with variables
3. Insert variables by clicking on them from the available variables panel
4. Preview your template in real-time
5. Click **"Create Template"**

## Using Variables

Variables are placeholders that get replaced with actual data when sending messages. They are written in double curly braces: `{{variableName}}`

### Available Variable Categories

#### Student Variables
- `{{studentName}}` - Student full name
- `{{studentFirstName}}` - Student first name
- `{{studentLastName}}` - Student last name
- `{{admissionId}}` - Student admission ID
- `{{rollNumber}}` - Student roll number
- `{{className}}` - Student class name
- `{{sectionName}}` - Student section name

#### Parent Variables
- `{{parentName}}` - Parent full name
- `{{parentFirstName}}` - Parent first name
- `{{parentLastName}}` - Parent last name
- `{{parentEmail}}` - Parent email address
- `{{parentPhone}}` - Parent phone number

#### Teacher Variables
- `{{teacherName}}` - Teacher full name
- `{{teacherFirstName}}` - Teacher first name
- `{{teacherLastName}}` - Teacher last name
- `{{employeeId}}` - Teacher employee ID

#### School Variables
- `{{schoolName}}` - School name
- `{{schoolAddress}}` - School address
- `{{schoolPhone}}` - School phone number
- `{{schoolEmail}}` - School email address
- `{{schoolWebsite}}` - School website URL

#### General Variables
- `{{date}}` - Current date
- `{{time}}` - Current time
- `{{academicYear}}` - Current academic year
- `{{term}}` - Current term

#### Fee Variables
- `{{feeAmount}}` - Fee amount
- `{{dueDate}}` - Fee due date
- `{{balance}}` - Outstanding balance
- `{{receiptNumber}}` - Payment receipt number

#### Attendance Variables
- `{{attendanceDate}}` - Attendance date
- `{{attendanceStatus}}` - Attendance status (Present/Absent)
- `{{attendancePercentage}}` - Attendance percentage

#### Exam Variables
- `{{examName}}` - Exam name
- `{{examDate}}` - Exam date
- `{{examTime}}` - Exam time
- `{{subject}}` - Subject name
- `{{marks}}` - Marks obtained
- `{{totalMarks}}` - Total marks
- `{{grade}}` - Grade obtained

## Example Templates

### Fee Payment Reminder (Email & SMS)

**Subject**: `Fee Payment Reminder - {{schoolName}}`

**Body**:
```
Dear {{parentName}},

This is a friendly reminder that the fee payment for {{studentName}} ({{className}}) is due on {{dueDate}}.

Amount Due: {{feeAmount}}
Outstanding Balance: {{balance}}

Please make the payment at your earliest convenience to avoid any late fees.

Thank you,
{{schoolName}}
```

### Attendance Alert (SMS)

**Body**:
```
Dear {{parentName}}, {{studentName}} was marked absent on {{attendanceDate}}. If this is unexpected, please contact the school. - {{schoolName}}
```

### Exam Results Published (Email)

**Subject**: `{{examName}} Results Published`

**Body**:
```
Dear {{studentName}},

Your {{examName}} results have been published.

Subject: {{subject}}
Marks Obtained: {{marks}}/{{totalMarks}}
Grade: {{grade}}

You can view your detailed results by logging into the student portal.

Keep up the good work!

{{schoolName}}
```

## Managing Templates

### Editing Templates
1. Navigate to the templates list
2. Click the three-dot menu on any template
3. Select **"Edit"**
4. Make your changes
5. Click **"Update Template"**

**Note**: System default templates cannot be edited. Duplicate them to create custom versions.

### Duplicating Templates
1. Click the three-dot menu on any template
2. Select **"Duplicate"**
3. A copy will be created with "(Copy)" appended to the name
4. Edit the duplicate as needed

### Deleting Templates
1. Click the three-dot menu on any template
2. Select **"Delete"**
3. Confirm the deletion

**Note**: System default templates cannot be deleted.

### Activating/Deactivating Templates
- Use the **"Active"** toggle when creating or editing a template
- Inactive templates are hidden from selection when sending messages
- This allows you to keep templates without deleting them

## Filtering Templates

Use the tabs at the top of the templates list to filter by type:
- **All Templates**: Show all templates
- **SMS Only**: Show only SMS templates
- **Email Only**: Show only email templates
- **Both**: Show templates that support both SMS and email

## Best Practices

1. **Use Clear Names**: Give templates descriptive names that indicate their purpose
2. **Add Descriptions**: Help other administrators understand when to use each template
3. **Categorize**: Use categories to organize templates by purpose
4. **Test Variables**: Preview templates to ensure variables are placed correctly
5. **Keep It Concise**: Especially for SMS templates (160 character limit)
6. **Personalize**: Use variables to make messages feel personal and relevant
7. **Proofread**: Check spelling and grammar before saving
8. **Version Control**: Instead of editing default templates, duplicate and modify them

## Using Templates in Bulk Messaging

When sending bulk SMS or emails (feature coming in task 44), you'll be able to:
1. Select a template from the dropdown
2. Choose recipients (by class, role, etc.)
3. The system will automatically replace variables with actual data for each recipient
4. Preview and send

## Technical Details

### Database Model
Templates are stored in the `message_templates` table with the following fields:
- `id`: Unique identifier
- `name`: Template name (unique)
- `description`: Optional description
- `type`: SMS, EMAIL, or BOTH
- `category`: Optional category
- `subject`: Email subject (required for email templates)
- `body`: Message body with variables
- `variables`: JSON array of available variables
- `isActive`: Whether template is active
- `isDefault`: Whether it's a system default template
- `createdBy`: User who created the template
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### API Endpoints

Server actions available:
- `getMessageTemplates(filters)` - Get all templates with optional filters
- `getMessageTemplate(id)` - Get a single template
- `createMessageTemplate(data)` - Create a new template
- `updateMessageTemplate(id, data)` - Update a template
- `deleteMessageTemplate(id)` - Delete a template
- `duplicateMessageTemplate(id)` - Duplicate a template
- `renderTemplate(template, variables)` - Render a template with actual values
- `getAvailableTemplateVariables()` - Get all available variables

## Troubleshooting

### Template Not Saving
- Ensure the template name is unique
- For email templates, subject is required
- Check that all required fields are filled

### Variables Not Replacing
- Ensure variables are wrapped in double curly braces: `{{variableName}}`
- Check that the variable name matches exactly (case-sensitive)
- Verify the variable is in the selected variables list

### Cannot Edit Template
- System default templates cannot be edited
- Duplicate the template to create an editable version

### Template Not Showing in List
- Check if the template is marked as inactive
- Use the filter tabs to ensure you're viewing the correct type

## Future Enhancements

Planned features for message templates:
- Template usage statistics
- Template versioning
- Template sharing between schools (multi-tenant)
- Rich text editor for email templates
- Template testing with sample data
- Template approval workflow
- Template scheduling

## Support

For questions or issues with message templates, contact the system administrator or refer to the main ERP documentation.
