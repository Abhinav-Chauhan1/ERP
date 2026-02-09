# Custom Branding Guide

## Overview

The Custom Branding feature allows school administrators to customize the appearance of the ERP system to reflect their school's brand identity. This includes logos, colors, contact information, and branding elements that appear throughout the system.

## Features

### 1. General Branding
- **School Name**: Display your school's name throughout the interface
- **Tagline**: Add a tagline or motto
- **Logo**: Upload and display your school logo in headers and navigation
- **Favicon**: Set a custom favicon for browser tabs

### 2. Color Customization
- **Primary Color**: Main brand color used for buttons, links, and accents
- **Secondary Color**: Secondary brand color for complementary elements
- **Accent Color**: Optional accent color for special highlights

### 3. Email Branding
- **Email Logo**: Custom logo for email communications
- **Email Footer**: Standard footer text for all automated emails
- **Email Signature**: Signature block for emails

### 4. Document Branding
- **Letterhead Logo**: Logo for official documents and certificates
- **Letterhead Text**: Text to appear on letterhead
- **Document Footer**: Footer text for all generated documents

### 5. Contact Information
- **Address**: School's physical address
- **Phone**: Contact phone number
- **Email**: Contact email address
- **Website**: School website URL
- **Social Media**: Links to Facebook, Twitter, LinkedIn, and Instagram

## How to Configure Branding

### For Administrators

1. **Navigate to Settings**
   - Go to Admin Dashboard → Settings → Branding

2. **Update Branding Information**
   - Fill in the branding form with your school's information
   - Use the tabs to organize different aspects:
     - General: Basic information and logos
     - Colors: Brand colors
     - Email: Email-specific branding
     - Documents: Document-specific branding
     - Contact: Contact information and social media

3. **Upload Logos**
   - Click the upload button next to logo fields
   - Supported formats: PNG, JPG, SVG
   - Recommended sizes:
     - Main Logo: 200x60px
     - Favicon: 32x32px
     - Email Logo: 150x50px
     - Letterhead Logo: 200x80px

4. **Choose Colors**
   - Use the color picker to select brand colors
   - Or enter hex color codes directly
   - Preview changes before saving

5. **Save Changes**
   - Click "Save Changes" to apply branding
   - Changes take effect immediately across the system

## Where Branding Appears

### 1. User Interface
- **Navigation Header**: School logo and name
- **Login Page**: Logo and school name
- **Dashboard**: School name in page titles
- **All Pages**: Consistent color scheme

### 2. Emails
- **Header**: School logo and name
- **Footer**: Contact information and social links
- **Signature**: Custom signature block
- **Colors**: Branded color scheme

### 3. Documents
- **Certificates**: Letterhead with logo
- **Reports**: Branded headers and footers
- **ID Cards**: School logo and information
- **Letters**: Official letterhead

### 4. Browser
- **Tab Title**: School name
- **Favicon**: Custom icon in browser tabs

## Technical Details

### Database Model

```prisma
model SchoolBranding {
  id              String   @id @default(cuid())
  schoolName      String
  tagline         String?
  logo            String?
  favicon         String?
  primaryColor    String   @default("#3b82f6")
  secondaryColor  String   @default("#8b5cf6")
  accentColor     String?
  emailLogo       String?
  emailFooter     String?
  emailSignature  String?
  letterheadLogo  String?
  letterheadText  String?
  documentFooter  String?
  address         String?
  phone           String?
  email           String?
  website         String?
  facebookUrl     String?
  twitterUrl      String?
  linkedinUrl     String?
  instagramUrl    String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Server Actions

- `getSchoolBranding()`: Fetch active branding settings
- `upsertSchoolBranding(data)`: Create or update branding
- `updateSchoolBranding(id, data)`: Update specific fields
- `deleteSchoolBranding(id)`: Delete branding configuration

### React Context

The branding is available throughout the app via the `useBranding()` hook:

```typescript
import { useBranding } from "@/lib/contexts/branding-context";

function MyComponent() {
  const { branding } = useBranding();
  
  return (
    <div>
      <h1>{branding?.schoolName}</h1>
    </div>
  );
}
```

### Utility Functions

#### Email Templates
```typescript
import { generateBrandedEmail } from "@/lib/utils/email-template";

const html = generateBrandedEmail({
  subject: "Welcome",
  body: "Welcome to our school!",
  branding: branding,
});
```

#### Document Headers
```typescript
import { generateDocumentHeader } from "@/lib/utils/document-header";

const header = generateDocumentHeader({
  branding: branding,
  title: "Student Certificate",
  includeLetterhead: true,
});
```

## Best Practices

### Logo Guidelines
1. **Format**: Use PNG with transparent background for best results
2. **Size**: Keep file sizes under 500KB for fast loading
3. **Dimensions**: Maintain aspect ratio, recommended 3:1 (width:height)
4. **Quality**: Use high-resolution images for print documents

### Color Selection
1. **Contrast**: Ensure sufficient contrast for accessibility (WCAG 2.1 AA)
2. **Consistency**: Use colors consistently across all materials
3. **Testing**: Test colors on different screens and in print
4. **Accessibility**: Consider color-blind users when choosing colors

### Content Guidelines
1. **School Name**: Use official registered name
2. **Tagline**: Keep it short and memorable (under 50 characters)
3. **Contact Info**: Keep information up-to-date
4. **Email Footer**: Include necessary legal disclaimers

## Troubleshooting

### Logo Not Displaying
- Check that the URL is accessible
- Verify image format is supported (PNG, JPG, SVG)
- Clear browser cache and refresh

### Colors Not Applying
- Ensure hex color codes are valid (e.g., #3b82f6)
- Save changes and refresh the page
- Check browser console for errors

### Changes Not Visible
- Click "Save Changes" button
- Refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache if needed

## Security Considerations

1. **Access Control**: Only administrators can modify branding
2. **Image Validation**: Uploaded images should be validated
3. **URL Validation**: External URLs should be validated
4. **XSS Prevention**: All user input is sanitized

## Future Enhancements

Planned features for future releases:
- [ ] Multiple branding profiles for different departments
- [ ] Seasonal themes and temporary branding
- [ ] Advanced logo positioning options
- [ ] Custom CSS injection for advanced styling
- [ ] Branding preview before applying changes
- [ ] Branding history and version control

## Support

For assistance with custom branding:
- Contact your system administrator
- Refer to the main ERP documentation
- Submit a support ticket through the admin portal

---

**Last Updated**: November 22, 2024
**Version**: 1.0.0
