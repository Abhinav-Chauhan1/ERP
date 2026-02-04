# R2 Upload Components

Custom React components that replace Cloudinary's `CldUploadWidget` with Cloudflare R2 storage integration. These components provide comprehensive file upload capabilities with enhanced security, school-based data isolation, and storage quota management.

## Components

### 1. R2UploadWidget

A general-purpose file upload component that supports multiple file types and provides drag-and-drop functionality.

```tsx
import { R2UploadWidget } from '@/components/upload';

function MyComponent() {
  const handleUploadSuccess = (result) => {
    console.log('File uploaded:', result.url);
  };

  return (
    <R2UploadWidget
      onSuccess={handleUploadSuccess}
      folder="assignments"
      maxFiles={5}
      accept={['image/*', 'application/pdf']}
      uploadText="Click to upload files"
      descriptionText="Upload PDF or image files"
    />
  );
}
```

**Key Features:**
- Multiple file upload support
- Drag and drop interface
- Real-time progress tracking
- File type and size validation
- Storage quota checking
- School-based folder isolation

### 2. R2ImageUpload

Specialized component for image uploads with preview functionality.

```tsx
import { R2ImageUpload } from '@/components/upload';

function ImageUploadExample() {
  const [imageUrl, setImageUrl] = useState('');

  return (
    <R2ImageUpload
      value={imageUrl}
      onChange={setImageUrl}
      folder="profile-images"
      label="Profile Picture"
      width={200}
      height={200}
      generateThumbnails={true}
    />
  );
}
```

**Key Features:**
- Image preview with remove functionality
- Automatic thumbnail generation
- Drag and drop support
- Manual URL input fallback
- Image format validation
- Responsive design

### 3. R2DocumentUpload

Document-focused upload component with file list management.

```tsx
import { R2DocumentUpload } from '@/components/upload';

function DocumentUploadExample() {
  const [documents, setDocuments] = useState([]);

  return (
    <R2DocumentUpload
      value={documents}
      onChange={setDocuments}
      folder="lesson-materials"
      label="Lesson Documents"
      maxFiles={10}
      accept={['application/pdf', 'application/msword']}
    />
  );
}
```

**Key Features:**
- Multiple document management
- File list with download links
- Document type icons
- Batch upload support
- File size formatting
- Upload progress tracking

## Migration from CldUploadWidget

### Before (Cloudinary)
```tsx
import { CldUploadWidget } from "next-cloudinary";

<CldUploadWidget 
  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
  onSuccess={handleUploadSuccess}
>
  {({ open }) => (
    <div onClick={() => open()}>
      <Upload className="h-10 w-10" />
      <p>Click to upload files</p>
    </div>
  )}
</CldUploadWidget>
```

### After (R2)
```tsx
import { R2UploadWidget } from "@/components/upload";

<R2UploadWidget
  onSuccess={handleUploadSuccess}
  folder="assignments"
  uploadText="Click to upload files"
  descriptionText="Upload PDF, Word, Excel, or image files"
/>
```

## API Reference

### R2UploadWidget Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSuccess` | `(result: UploadResult) => void` | - | Callback when upload succeeds |
| `onError` | `(error: string) => void` | - | Callback when upload fails |
| `onProgress` | `(progress: UploadProgress) => void` | - | Callback for upload progress |
| `maxFiles` | `number` | `10` | Maximum number of files |
| `accept` | `string[]` | `[]` | Accepted file types (MIME types) |
| `maxSize` | `number` | `50MB` | Maximum file size in bytes |
| `folder` | `string` | `'general'` | Upload folder within school structure |
| `category` | `'image' \| 'document'` | - | File category for validation |
| `generateThumbnails` | `boolean` | `false` | Generate thumbnails for images |
| `disabled` | `boolean` | `false` | Disabled state |
| `multiple` | `boolean` | `true` | Allow multiple file selection |
| `showPreviews` | `boolean` | `true` | Show file previews |

### R2ImageUpload Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Current image URL |
| `onChange` | `(url: string) => void` | - | Callback when image changes |
| `onSuccess` | `(result: ImageUploadResult) => void` | - | Callback when upload succeeds |
| `folder` | `string` | `'images'` | Upload folder |
| `maxSize` | `number` | `5MB` | Maximum file size |
| `width` | `number` | `200` | Preview width |
| `height` | `number` | `200` | Preview height |
| `generateThumbnails` | `boolean` | `true` | Generate thumbnails |
| `showUrlInput` | `boolean` | `true` | Show manual URL input |

### R2DocumentUpload Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `DocumentInfo[]` | `[]` | Current documents array |
| `onChange` | `(documents: DocumentInfo[]) => void` | - | Callback when documents change |
| `onSuccess` | `(result: DocumentUploadResult) => void` | - | Callback when upload succeeds |
| `folder` | `string` | `'documents'` | Upload folder |
| `maxFiles` | `number` | `10` | Maximum number of files |
| `maxSize` | `number` | `50MB` | Maximum file size |
| `accept` | `string[]` | PDF, DOC, DOCX, etc. | Accepted document types |
| `showFileList` | `boolean` | `true` | Show uploaded file list |

## Features

### School-Based Data Isolation
All uploads are automatically organized by school ID:
```
bucket-root/
├── school-123/
│   ├── assignments/
│   ├── images/
│   └── documents/
└── school-456/
    ├── assignments/
    ├── images/
    └── documents/
```

### Storage Quota Management
Components automatically check storage quotas and display warnings:
- Warning at 80% usage
- Upload blocking at 100% usage
- Real-time quota updates

### Security Features
- CSRF token protection
- File type validation (MIME type + extension)
- Size limit enforcement
- School access verification
- Rate limiting integration

### Error Handling
- Comprehensive error messages
- Retry logic for transient failures
- Graceful degradation
- User-friendly error display

## Testing

A test page is available at `/test-upload` to verify component functionality:

```bash
# Navigate to test page
http://localhost:3000/test-upload
```

## Dependencies

The components require these UI components:
- `@/components/ui/button`
- `@/components/ui/progress`
- `@/components/ui/alert`
- `@/components/ui/badge`
- `@/components/ui/input`
- `@/components/ui/label`

And these services:
- `@/lib/services/r2-storage-service`
- `@/lib/services/upload-handler`
- `@/lib/services/storage-quota-service`

## Environment Variables

No Cloudinary environment variables are needed. The components use R2 configuration:

```env
# R2 Storage Configuration (server-side only)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_CUSTOM_DOMAIN=cdn.yourdomain.com
```

## Migration Checklist

- [ ] Replace all `CldUploadWidget` imports with R2 components
- [ ] Update upload success handlers to use new result format
- [ ] Remove Cloudinary environment variables from client code
- [ ] Test file uploads in all affected pages
- [ ] Verify storage quota warnings work correctly
- [ ] Check that school isolation is working properly
- [ ] Update any hardcoded Cloudinary URLs in the database

## Support

For issues or questions about the R2 upload components:
1. Check the test page at `/test-upload`
2. Review the migration examples in `migration-examples.tsx`
3. Verify R2 storage service configuration
4. Check browser console for detailed error messages