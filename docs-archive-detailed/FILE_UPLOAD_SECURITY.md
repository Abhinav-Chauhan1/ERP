# File Upload Security and Validation

This document describes the comprehensive file upload security implementation in the School ERP system.

## Overview

The file upload system implements multiple layers of security validation to protect against malicious file uploads, including:

1. **Client-side validation** - Fast feedback for users
2. **Server-side validation** - Authoritative security checks
3. **Magic number verification** - Content-based file type validation
4. **Rate limiting** - Prevents abuse
5. **CSRF protection** - Prevents cross-site attacks
6. **Cloudinary integration** - Secure cloud storage

## Security Features

### 1. File Type Validation

**Client-side:**
- Validates MIME type against whitelist
- Checks file extension matches MIME type
- Blocks dangerous extensions (.exe, .bat, .sh, etc.)

**Server-side:**
- Re-validates MIME type and extension
- Verifies file signature (magic numbers)
- Ensures file content matches declared type

**Allowed File Types:**
```typescript
// Images
image/jpeg, image/png, image/gif, image/webp

// Documents
application/pdf
application/msword (.doc)
application/vnd.openxmlformats-officedocument.wordprocessingml.document (.docx)
application/vnd.ms-excel (.xls)
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (.xlsx)
application/vnd.ms-powerpoint (.ppt)
application/vnd.openxmlformats-officedocument.presentationml.presentation (.pptx)

// Text
text/plain, text/csv

// Archives
application/zip, application/x-rar-compressed
```

### 2. File Size Validation

Maximum file sizes by category:
- **Avatar**: 5 MB
- **Attachment**: 10 MB
- **Document**: 20 MB
- **General**: 10 MB

### 3. Magic Number Verification

The system verifies file content by checking magic numbers (file signatures):

```typescript
// Example: PDF files must start with %PDF
const pdfSignature = [0x25, 0x50, 0x44, 0x46];

// Example: PNG files must start with PNG header
const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
```

This prevents attackers from uploading malicious files with fake extensions.

### 4. Filename Sanitization

All filenames are sanitized to prevent:
- Directory traversal attacks (../)
- Path injection (/, \)
- Null byte injection (\0)
- Special characters that could cause issues

**Sanitization process:**
1. Remove path separators and null bytes
2. Remove leading dots
3. Replace spaces with underscores
4. Remove special characters (except dots, dashes, underscores)
5. Limit filename length to 100 characters
6. Generate secure random filename for storage

### 5. Rate Limiting

File uploads are rate-limited to prevent abuse:
- **10 uploads per minute per user**
- Returns 429 status code when exceeded
- Includes Retry-After header

### 6. CSRF Protection

All upload requests must include a valid CSRF token to prevent cross-site request forgery attacks.

### 7. Authentication & Authorization

- Users must be authenticated via Clerk
- User ID is verified before upload
- Files are stored in user-specific folders

## Implementation

### Server-Side API Route

```typescript
// src/app/api/upload/route.ts
export async function POST(req: NextRequest) {
  // 1. Verify authentication
  const user = await currentUser();
  
  // 2. Check rate limit
  const rateLimitResult = await rateLimitMiddleware(user.id, RateLimitPresets.FILE_UPLOAD);
  
  // 3. Verify CSRF token
  const isCsrfValid = await verifyCsrfToken(csrfToken);
  
  // 4. Validate file with magic number check
  const validation = await validateFileUploadSecure(file, category);
  
  // 5. Generate secure filename
  const secureFileName = generateSecureFileName(file.name);
  
  // 6. Upload to Cloudinary
  const uploadResult = await uploadToCloudinary(file, options);
  
  return NextResponse.json({ success: true, data: uploadResult });
}
```

### Client-Side Component

```typescript
// src/components/shared/secure-file-upload.tsx
<SecureFileUpload
  onUploadComplete={(result) => {
    // Handle successful upload
  }}
  onUploadError={(error) => {
    // Handle upload error
  }}
  folder="teacher/documents"
  category="document"
  accept=".pdf,.doc,.docx"
/>
```

## Cloudinary Configuration

### Folder Structure

Files are organized in Cloudinary using a structured folder hierarchy:

```
/avatars/{userId}
/documents/{userId}
/teacher/documents/{userId}
/teacher/achievements/{userId}
/teacher/lesson-plans/{userId}
/student/documents/{userId}
/student/assignments/{userId}
/admin/documents/{userId}
```

### Upload Presets

Configure these presets in your Cloudinary dashboard:

1. **avatar_preset**
   - Small images
   - Auto-crop with face detection
   - Max dimensions: 400x400

2. **document_preset**
   - PDFs and Office files
   - No transformations
   - Max size: 20MB

3. **erp_uploads** (default)
   - General purpose
   - Auto-detect file type
   - Max size: 10MB

### Environment Variables

Required environment variables:

```env
# Public (client-side)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=erp_uploads

# Private (server-side only)
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: Upstash Redis for rate limiting
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## Usage Examples

### Basic Upload

```typescript
import { SecureFileUpload } from "@/components/shared/secure-file-upload";

function MyComponent() {
  const handleUploadComplete = (result) => {
    console.log("File uploaded:", result.url);
    // Save to database, etc.
  };

  return (
    <SecureFileUpload
      onUploadComplete={handleUploadComplete}
      category="document"
    />
  );
}
```

### Upload with Custom Folder

```typescript
<SecureFileUpload
  onUploadComplete={handleUploadComplete}
  folder="teacher/lesson-plans"
  category="document"
  accept=".pdf,.docx"
  maxSizeMB={20}
/>
```

### Upload Avatar

```typescript
<SecureFileUpload
  onUploadComplete={handleUploadComplete}
  folder="avatars"
  category="avatar"
  accept="image/*"
  maxSizeMB={5}
/>
```

## Security Best Practices

### 1. Never Trust Client-Side Validation

Always re-validate on the server. Client-side validation is for UX only.

### 2. Verify File Content

Use magic number verification to ensure file content matches the declared type.

### 3. Sanitize Filenames

Never use user-provided filenames directly. Always sanitize or generate new names.

### 4. Limit File Sizes

Enforce reasonable file size limits to prevent DoS attacks.

### 5. Use Rate Limiting

Prevent abuse by limiting upload frequency per user.

### 6. Store Files Securely

Use cloud storage (Cloudinary) with proper access controls.

### 7. Scan for Malware

Consider integrating malware scanning for high-security applications.

### 8. Use HTTPS

Always serve and upload files over HTTPS.

### 9. Implement CSRF Protection

Require CSRF tokens for all upload requests.

### 10. Log Upload Activity

Log all uploads for audit and security monitoring.

## Testing

### Unit Tests

Test file validation functions:

```typescript
import { validateFileUpload, verifyFileSignature } from "@/lib/utils/file-security";

test("rejects dangerous file extensions", () => {
  const file = new File(["content"], "malware.exe", { type: "application/x-msdownload" });
  const result = validateFileUpload(file);
  expect(result.valid).toBe(false);
});

test("accepts valid PDF files", async () => {
  const file = new File([pdfBuffer], "document.pdf", { type: "application/pdf" });
  const result = await validateFileUploadSecure(file);
  expect(result.valid).toBe(true);
});
```

### Integration Tests

Test the upload API route:

```typescript
test("POST /api/upload requires authentication", async () => {
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  expect(response.status).toBe(401);
});

test("POST /api/upload validates file type", async () => {
  const file = new File(["content"], "test.exe", { type: "application/x-msdownload" });
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });
  
  expect(response.status).toBe(400);
});
```

## Troubleshooting

### Upload Fails with "Invalid CSRF token"

Ensure you're including the CSRF token in the request:

```typescript
const { csrfToken } = useCsrfToken();
formData.append("csrf_token", csrfToken);
```

### Upload Fails with "File type not allowed"

Check that the file type is in the allowed list and the extension matches the MIME type.

### Upload Fails with "File content does not match its declared type"

The file's magic number doesn't match its MIME type. This could indicate:
- Corrupted file
- File with wrong extension
- Malicious file attempting to bypass validation

### Rate Limit Exceeded

Wait for the rate limit window to reset (shown in Retry-After header) or contact an administrator to adjust limits.

### Cloudinary Upload Fails

Check that environment variables are configured correctly:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

Verify the upload preset exists in your Cloudinary dashboard.

## References

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [Cloudinary Upload API](https://cloudinary.com/documentation/upload_images)
- [File Signatures (Magic Numbers)](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [MIME Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)

## Compliance

This implementation follows security best practices and helps meet compliance requirements:

- **OWASP Top 10**: Addresses A03:2021 – Injection and A05:2021 – Security Misconfiguration
- **GDPR**: Secure handling of user-uploaded data
- **SOC 2**: Audit logging and access controls
- **PCI DSS**: If handling payment-related documents

## Support

For questions or issues related to file upload security, contact the development team or refer to the main project documentation.
