# Certificate Generation Guide

## Overview
The Certificate Generation system allows administrators to create professional certificates for students in bulk. Certificates are generated as print-ready PDF files with QR codes for verification.

## Features

### Bulk Generation
- Generate certificates for multiple students at once
- Select from active certificate templates
- Choose specific students or select all
- Track generation progress in real-time
- View detailed results for each certificate

### Print-Ready PDFs
- Professional PDF output with proper dimensions
- Support for multiple page sizes (A4, Letter, Legal, etc.)
- Portrait and landscape orientations
- Customizable layouts and styling
- Header/footer images and backgrounds
- Digital signatures

### Verification System
- Unique certificate numbers for each certificate
- QR codes for easy verification
- Verification codes for manual lookup
- Certificate status tracking (Active, Revoked, Expired)

## How to Use

### 1. Access Certificate Generation
Navigate to: **Admin Dashboard → Certificates → Generate**

### 2. Select Template
Choose a certificate template from the dropdown. Templates include:
- Achievement certificates
- Completion certificates
- Participation certificates
- Merit certificates
- Custom certificates

### 3. Select Students
- Use checkboxes to select individual students
- Click "Select All" to choose all students
- View student details (name, admission ID, class, section)

### 4. Generate Certificates
- Click "Generate Certificates" button
- Monitor progress bar during generation
- View results summary when complete

### 5. Download Certificates
- Download individual certificates from the results list
- Each certificate includes a unique certificate number
- QR code is embedded for verification

## Certificate Templates

### Template Components
- **Header Image**: School logo or banner
- **Content**: Main certificate text with merge fields
- **Signatures**: Digital signatures of authorized personnel
- **Footer Image**: School seal or additional branding
- **Background**: Optional background image or pattern
- **QR Code**: Automatically generated for verification

### Merge Fields
Templates support dynamic content through merge fields:

**Student Information:**
- `{{studentName}}` - Full name
- `{{studentFirstName}}` - First name
- `{{studentLastName}}` - Last name
- `{{admissionId}}` - Admission ID
- `{{rollNumber}}` - Roll number
- `{{className}}` - Class name
- `{{sectionName}}` - Section name
- `{{dateOfBirth}}` - Date of birth
- `{{gender}}` - Gender

**Academic Information:**
- `{{courseName}}` - Course/Subject name
- `{{grade}}` - Grade obtained
- `{{percentage}}` - Percentage
- `{{rank}}` - Rank in class
- `{{academicYear}}` - Academic year
- `{{term}}` - Term/Semester

**Achievement Information:**
- `{{achievementTitle}}` - Achievement title
- `{{achievementDescription}}` - Description
- `{{eventName}}` - Event name
- `{{eventDate}}` - Event date
- `{{position}}` - Position/Rank

**School Information:**
- `{{schoolName}}` - School name
- `{{schoolAddress}}` - School address
- `{{principalName}}` - Principal name

**Certificate Information:**
- `{{certificateNumber}}` - Unique certificate number
- `{{issueDate}}` - Issue date
- `{{verificationCode}}` - Verification code
- `{{date}}` - Current date
- `{{year}}` - Current year

## Certificate Verification

### For Recipients
1. Scan the QR code on the certificate
2. Or visit the verification portal and enter the certificate number
3. View certificate details and verification status

### For Administrators
1. Navigate to **Admin Dashboard → Certificates → Verify**
2. Enter certificate number or verification code
3. View full certificate details including:
   - Student name
   - Template used
   - Issue date
   - Current status
   - Issued by

## Certificate Management

### View Generated Certificates
- Navigate to **Admin Dashboard → Certificates → Generated**
- Filter by template, student, status, or date range
- View certificate details
- Download PDFs
- Revoke certificates if needed

### Revoke Certificates
1. Find the certificate in the generated certificates list
2. Click "Revoke" button
3. Provide a reason for revocation
4. Certificate status changes to "Revoked"
5. Verification will show revoked status

### Certificate Statistics
View generation statistics including:
- Total certificates generated
- Certificates by status (Active, Revoked, Expired)
- Top templates used
- Recent certificates

## Best Practices

### Template Design
1. **Keep it Simple**: Use clear, readable fonts
2. **Professional Layout**: Maintain proper spacing and alignment
3. **Brand Consistency**: Use school colors and logos
4. **Print Quality**: Use high-resolution images (300 DPI minimum)
5. **Test First**: Generate test certificates before bulk operations

### Bulk Generation
1. **Verify Data**: Ensure student data is up-to-date
2. **Test Template**: Generate one certificate first to verify layout
3. **Batch Size**: For very large batches (100+), consider splitting into smaller groups
4. **Review Results**: Check the results summary for any failures
5. **Download Promptly**: Download certificates soon after generation

### Security
1. **Access Control**: Only authorized administrators can generate certificates
2. **Audit Trail**: All certificate generation is logged
3. **Verification**: Always include QR codes for authenticity
4. **Revocation**: Revoke certificates immediately if issues are found
5. **Backup**: Keep backups of generated certificates

## Troubleshooting

### Certificate Generation Fails
**Problem**: Some certificates fail to generate
**Solutions**:
- Check if template is active
- Verify student data is complete
- Ensure merge fields match template requirements
- Check server logs for specific errors

### PDF Quality Issues
**Problem**: PDF looks different from preview
**Solutions**:
- Use high-resolution images (300 DPI)
- Test with different page sizes
- Verify font availability
- Check image formats (PNG recommended)

### QR Code Not Scanning
**Problem**: QR code cannot be scanned
**Solutions**:
- Ensure QR code is large enough (minimum 25mm)
- Use high contrast (black on white)
- Test with multiple QR code readers
- Verify verification URL is accessible

### Missing Student Data
**Problem**: Some merge fields show "N/A"
**Solutions**:
- Update student records with missing information
- Use optional merge fields for non-critical data
- Provide default values in template
- Review data completeness before generation

## API Reference

### Generate Bulk Certificates
```typescript
const result = await bulkGenerateCertificates(
  templateId: string,
  studentIds: string[]
);
```

### Generate Single Certificate
```typescript
const result = await generateCertificateForStudent(
  templateId: string,
  studentId: string,
  additionalData?: Record<string, any>
);
```

### Verify Certificate
```typescript
const result = await verifyCertificateByCode(
  verificationCode: string
);
```

### Revoke Certificate
```typescript
const result = await revokeCertificateById(
  certificateId: string,
  reason: string
);
```

## Support

For technical issues or questions:
1. Check this guide first
2. Review error messages in the results
3. Contact system administrator
4. Check server logs for detailed errors

## Future Enhancements

Planned features:
- Email delivery of certificates
- Batch processing for large operations
- Enhanced template editor
- Certificate analytics dashboard
- Bulk revocation
- Certificate expiry management
- Multi-language support
