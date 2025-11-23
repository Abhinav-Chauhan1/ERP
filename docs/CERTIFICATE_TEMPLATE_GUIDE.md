# Certificate Template System User Guide

## Overview

The Certificate Template System allows administrators to create, manage, and customize certificate templates for generating various types of certificates including achievement certificates, completion certificates, participation certificates, and more.

## Accessing the System

Navigate to: **Admin Dashboard → Certificates → Templates**

URL: `/admin/certificates/templates`

## Features

### 1. View Certificate Templates

The templates page displays all available certificate templates in a grid layout with the following information:
- Template name and description
- Certificate type (Achievement, Completion, Participation, Merit, Custom)
- Category (Academic, Sports, Events, etc.)
- Page size and orientation
- Active/Inactive status
- Default template indicator

### 2. Create a New Template

Click the **"New Template"** button to create a new certificate template.

#### Required Fields:
- **Name**: Unique name for the template
- **Type**: Select from Achievement, Completion, Participation, Merit, or Custom
- **Content**: HTML template with merge fields

#### Optional Fields:
- **Description**: Brief description of the template
- **Category**: Categorize the template (e.g., Academic, Sports, Events)
- **Layout**: JSON configuration for header, body, and footer sections
- **Styling**: JSON configuration for colors, fonts, and borders
- **Page Size**: A4, Letter, or Legal
- **Orientation**: Portrait or Landscape
- **Images**: Header, footer, background, and signature images
- **Merge Fields**: List of available variables

### 3. Using Merge Fields

Merge fields are placeholders that get replaced with actual data when generating certificates.

#### Syntax:
```html
{{fieldName}}
```

#### Available Merge Fields:

**Student Information:**
- `{{studentName}}` - Student full name
- `{{studentFirstName}}` - Student first name
- `{{studentLastName}}` - Student last name
- `{{admissionId}}` - Student admission ID
- `{{rollNumber}}` - Student roll number
- `{{className}}` - Student class name
- `{{sectionName}}` - Student section name
- `{{dateOfBirth}}` - Student date of birth
- `{{gender}}` - Student gender

**Academic Details:**
- `{{courseName}}` - Course/Subject name
- `{{grade}}` - Grade obtained
- `{{percentage}}` - Percentage obtained
- `{{rank}}` - Rank in class
- `{{academicYear}}` - Academic year
- `{{term}}` - Term/Semester
- `{{completionDate}}` - Course completion date

**Achievement Information:**
- `{{achievementTitle}}` - Achievement title
- `{{achievementDescription}}` - Achievement description
- `{{eventName}}` - Event name
- `{{eventDate}}` - Event date
- `{{position}}` - Position/Rank achieved
- `{{category}}` - Achievement category

**School Information:**
- `{{schoolName}}` - School name
- `{{schoolAddress}}` - School address
- `{{schoolPhone}}` - School phone number
- `{{schoolEmail}}` - School email address
- `{{schoolWebsite}}` - School website URL
- `{{principalName}}` - Principal name

**Certificate Metadata:**
- `{{certificateNumber}}` - Unique certificate number
- `{{issueDate}}` - Certificate issue date
- `{{validUntil}}` - Certificate validity date
- `{{verificationCode}}` - QR/Barcode verification code

**General:**
- `{{date}}` - Current date
- `{{time}}` - Current time
- `{{year}}` - Current year

### 4. Template Content Example

```html
<div style="text-align: center; padding: 2rem;">
  <h1 style="font-size: 3rem; margin-bottom: 1rem;">
    Certificate of Achievement
  </h1>
  <p style="font-size: 1.2rem; margin: 2rem 0;">
    This is to certify that
  </p>
  <h2 style="font-size: 2.5rem; margin: 1rem 0;">
    {{studentName}}
  </h2>
  <p style="font-size: 1.2rem; margin: 2rem 0;">
    has successfully achieved
  </p>
  <h3 style="font-size: 2rem; margin: 1rem 0;">
    {{achievementTitle}}
  </h3>
  <p style="font-size: 1rem; margin: 2rem 0;">
    on {{issueDate}}
  </p>
  <p style="font-size: 0.9rem; margin-top: 3rem;">
    Certificate No: {{certificateNumber}}
  </p>
</div>
```

### 5. Layout Configuration

The layout defines the structure of the certificate with three main sections:

```json
{
  "header": {
    "height": "15%",
    "alignment": "center"
  },
  "body": {
    "height": "70%",
    "alignment": "center",
    "padding": "2rem"
  },
  "footer": {
    "height": "15%",
    "alignment": "center"
  }
}
```

**Available Alignments:** left, center, right, justify

### 6. Styling Configuration

The styling defines the visual appearance of the certificate:

```json
{
  "fontFamily": "Georgia, serif",
  "primaryColor": "#1a365d",
  "secondaryColor": "#2c5282",
  "backgroundColor": "#ffffff",
  "borderColor": "#d4af37",
  "borderWidth": "8px",
  "borderStyle": "double"
}
```

**Border Styles:** none, solid, dashed, dotted, double, groove, ridge, inset, outset

### 7. Pre-defined Template Styles

The system includes three pre-defined styles:

#### Classic
- Font: Georgia, serif
- Colors: Navy blue and gold
- Border: Double gold border
- Best for: Traditional certificates

#### Modern
- Font: Arial, sans-serif
- Colors: Blue tones
- Border: Solid blue border
- Best for: Contemporary certificates

#### Elegant
- Font: Times New Roman, serif
- Colors: Purple tones
- Border: Solid purple border
- Best for: Formal certificates

### 8. Edit a Template

1. Click on a template card to view details
2. Click the **"Edit"** button
3. Modify the template fields
4. Save changes

**Note:** Default system templates cannot be edited. Duplicate them first to create a custom version.

### 9. Duplicate a Template

To create a copy of an existing template:
1. View the template details
2. Click the **"Duplicate"** button
3. A new template will be created with "(Copy)" appended to the name
4. Edit the duplicated template as needed

### 10. Delete a Template

To delete a template:
1. View the template details
2. Click the **"Delete"** button
3. Confirm the deletion

**Restrictions:**
- Default system templates cannot be deleted
- Templates with generated certificates cannot be deleted (deactivate instead)

### 11. Activate/Deactivate Templates

Templates can be activated or deactivated:
- **Active**: Available for certificate generation
- **Inactive**: Hidden from certificate generation but preserved in the system

### 12. Preview Templates

Click the **"Preview"** button to see how the template will look with sample data.

## Best Practices

1. **Use Descriptive Names**: Give templates clear, descriptive names
2. **Add Descriptions**: Include descriptions to help identify template purposes
3. **Test with Sample Data**: Always preview templates before using them
4. **Use Categories**: Organize templates by category for easy filtering
5. **Validate Merge Fields**: Ensure all merge fields in content are declared
6. **Keep Backups**: Duplicate important templates before making major changes
7. **Use Consistent Styling**: Maintain consistent styling across related templates
8. **Optimize Images**: Use optimized images for headers, footers, and backgrounds
9. **Test Print Output**: Verify templates print correctly on actual paper
10. **Document Custom Fields**: If using custom merge fields, document their purpose

## Troubleshooting

### Template Not Displaying
- Check if the template is marked as active
- Verify the template has valid HTML content
- Check for syntax errors in merge fields

### Merge Fields Not Working
- Ensure merge fields use correct syntax: `{{fieldName}}`
- Verify field names match exactly (case-sensitive)
- Check that fields are declared in the mergeFields array

### Styling Issues
- Validate JSON syntax in layout and styling configurations
- Check color values are valid CSS colors
- Verify border width and style values

### Cannot Delete Template
- Check if template is marked as default
- Verify no certificates have been generated using this template
- Consider deactivating instead of deleting

## Support

For additional help or to report issues with the certificate template system, contact your system administrator.
