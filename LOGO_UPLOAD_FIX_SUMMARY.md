# Logo Upload Fix - Summary

## Problem
The school logo upload functionality was disabled with a temporary message: "Logo upload temporarily disabled during migration to R2 storage"

## Solution
Fully integrated R2 storage for logo uploads with the following components:

### 1. Created R2 Upload API Endpoint
**File**: `src/app/api/r2/upload/route.ts`
- Handles file uploads to Cloudflare R2 storage
- Validates file size (50MB max)
- Generates unique keys with school isolation
- Uses AWS S3 SDK for R2 compatibility
- Returns public URL for uploaded files

### 2. Created CSRF Token Endpoint
**File**: `src/app/api/csrf-token/route.ts`
- Generates CSRF tokens for secure uploads
- Required by R2 upload widget

### 3. Created Storage Quota Endpoint
**File**: `src/app/api/storage/quota/route.ts`
- Checks school storage quota
- Returns usage statistics
- Warns when approaching limits

### 4. Updated School Info Form
**File**: `src/components/admin/settings/school-info-form.tsx`
- Replaced disabled upload button with R2UploadWidget
- Integrated upload success/error callbacks
- Maintains manual URL input option
- Shows logo preview with remove functionality

## Features

### R2 Upload Widget
The integrated widget provides:
- Drag and drop file upload
- Progress tracking
- File validation (type, size)
- Storage quota warnings
- Multiple file support (configured for single logo)
- Image preview
- Error handling with user-friendly messages

### Upload Configuration
- **Max file size**: 5MB for logos
- **Accepted formats**: JPG, PNG, SVG, WebP
- **Folder**: `logos` (organized by school)
- **Category**: `image`
- **Thumbnails**: Enabled

### Security
- Authentication required (session check)
- School context isolation
- CSRF protection
- File type validation
- Size limits enforced

## Environment Variables Required

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_DOMAIN=your_public_domain (optional, defaults to bucket.r2.dev)
```

## Usage

1. Navigate to Settings > General > Logo & Branding
2. Click or drag and drop logo file
3. Widget validates and uploads to R2
4. Logo URL is automatically set
5. Click "Save Changes" to persist

## File Structure

```
src/
├── app/
│   └── api/
│       ├── r2/
│       │   └── upload/
│       │       └── route.ts          # R2 upload endpoint
│       ├── csrf-token/
│       │   └── route.ts              # CSRF token generation
│       └── storage/
│           └── quota/
│               └── route.ts          # Storage quota check
└── components/
    ├── admin/
    │   └── settings/
    │       └── school-info-form.tsx  # Updated with R2 integration
    └── upload/
        └── r2-upload-widget.tsx      # Reusable upload widget
```

## Testing

To test the logo upload:

1. Ensure R2 environment variables are configured
2. Start the development server
3. Log in as school admin
4. Navigate to Settings
5. Upload a logo file
6. Verify the logo appears in preview
7. Save changes
8. Refresh page to confirm persistence

## Notes

- Logo files are stored in R2 with path: `{schoolId}/logos/{timestamp}-{random}-{filename}`
- Each school's logos are isolated by schoolId
- Old Cloudinary integration has been fully replaced
- Manual URL input still available for external logos
- Storage quota is checked before upload

## Future Enhancements

- Image optimization (resize, compress)
- Multiple logo variants (light/dark mode)
- Favicon upload
- Bulk asset management
- CDN integration for faster delivery
