# Admission Document Upload Implementation

## Overview

This document describes the implementation of document upload functionality for the admission portal, allowing applicants to upload required documents (birth certificate, previous report cards, and photographs) as part of their admission application.

## Features Implemented

### 1. Document Upload to Cloudinary
- Integrated Cloudinary for secure document storage
- Supports multiple file formats: PDF, JPG, PNG
- Maximum file size: 5MB per document
- Automatic file type validation
- Real-time upload progress indication

### 2. Required Documents
- **Birth Certificate** (Required) - PDF or image format
- **Student Photograph** (Required) - Image format only
- **Previous Report Card** (Optional) - PDF or image format

### 3. User Interface
- File upload inputs with drag-and-drop support
- Real-time upload status with loading indicators
- Preview of uploaded documents
- Remove/replace document functionality
- Clear validation messages
- Disabled submit button until required documents are uploaded

### 4. Database Integration
- Documents stored in `ApplicationDocument` table
- Linked to admission applications via foreign key
- Stores document type, URL, filename, and upload timestamp

## Technical Implementation

### Schema Updates

**admissionSchemaValidation.ts**
```typescript
// Document upload schema
export const documentUploadSchema = z.object({
  type: z.enum(["BIRTH_CERTIFICATE", "PREVIOUS_REPORT_CARD", "PHOTOGRAPH", "OTHER"]),
  file: z.instanceof(File, { message: "File is required" }),
});
```

### Server Actions

**admissionActions.ts**
```typescript
// Upload document to Cloudinary
export async function uploadAdmissionDocument(formData: FormData)

// Create admission application with documents
export async function createAdmissionApplication(
  data: AdmissionApplicationFormValues,
  documents?: Array<{ type: string; url: string; filename: string }>
)
```

### Database Models

**Prisma Schema**
```prisma
model ApplicationDocument {
  id            String               @id @default(cuid())
  applicationId String
  application   AdmissionApplication @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  type          DocumentTypeEnum
  url           String
  filename      String
  uploadedAt    DateTime             @default(now())

  @@index([applicationId])
}

enum DocumentTypeEnum {
  BIRTH_CERTIFICATE
  PREVIOUS_REPORT_CARD
  PHOTOGRAPH
  OTHER
}
```

## File Upload Flow

1. **User selects file** → File input onChange handler triggered
2. **Client-side validation** → Check file size (max 5MB) and type
3. **Upload to Cloudinary** → `uploadAdmissionDocument` server action called
4. **Store metadata** → Document URL and filename stored in component state
5. **Submit application** → Documents array passed to `createAdmissionApplication`
6. **Database storage** → Application and documents created in transaction

## Validation Rules

### File Size
- Maximum: 5MB per file
- Error message displayed if exceeded

### File Types
- **Birth Certificate**: PDF, JPG, PNG
- **Report Card**: PDF, JPG, PNG
- **Photograph**: Image formats only (JPG, PNG, etc.)

### Required Documents
- Birth Certificate: Required
- Photograph: Required
- Report Card: Optional

## Error Handling

### Upload Errors
- Network failures: Retry mechanism with user feedback
- Invalid file type: Clear error message
- File too large: Size limit notification
- Cloudinary errors: Graceful fallback with error message

### Form Validation
- Submit button disabled until required documents uploaded
- Clear indication of missing documents
- Validation messages for each document type

## Security Considerations

1. **File Type Validation**: Both client-side and server-side validation
2. **File Size Limits**: Prevents abuse and ensures performance
3. **Cloudinary Integration**: Secure upload with preset configuration
4. **Database Constraints**: Foreign key relationships ensure data integrity

## Testing

### Unit Tests
- Document upload success scenario
- Error handling for missing files
- Application creation with documents
- Application creation without documents

### Test Coverage
```bash
npm run test -- admissionActions.test.ts --run
```

All tests passing:
- ✓ should upload a document successfully
- ✓ should return error when no file is provided
- ✓ should create application with documents
- ✓ should create application without documents

## Usage Example

### For Applicants
1. Fill out the admission form
2. Upload Birth Certificate (required)
3. Upload Student Photograph (required)
4. Optionally upload Previous Report Card
5. Submit application

### For Administrators
- View uploaded documents in application review interface
- Access document URLs from ApplicationDocument table
- Verify document authenticity during review process

## Environment Variables Required

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=erp_uploads
```

## Future Enhancements

1. **Document Verification**: OCR integration for automatic data extraction
2. **Multiple Report Cards**: Support uploading multiple years of report cards
3. **Document Preview**: In-app PDF/image viewer
4. **Compression**: Automatic image compression before upload
5. **Progress Bar**: Detailed upload progress for large files
6. **Drag and Drop**: Enhanced drag-and-drop interface

## Related Files

- `src/app/admission/page.tsx` - Admission form UI
- `src/lib/actions/admissionActions.ts` - Server actions
- `src/lib/schemaValidation/admissionSchemaValidation.ts` - Validation schemas
- `src/lib/cloudinary.ts` - Cloudinary integration
- `prisma/schema.prisma` - Database models

## Requirements Validated

This implementation satisfies **Requirement 8.2**:
> WHEN a parent submits documents THEN the ERP System SHALL accept file uploads for birth certificate, previous report cards, and photographs

All acceptance criteria met:
- ✅ File upload for birth certificate
- ✅ File upload for previous report cards
- ✅ File upload for photographs
- ✅ Upload documents to Cloudinary
- ✅ Store document URLs in ApplicationDocument model
