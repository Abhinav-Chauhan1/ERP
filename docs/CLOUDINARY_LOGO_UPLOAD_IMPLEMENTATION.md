# Cloudinary Logo Upload Implementation

## Overview
Added Cloudinary integration for uploading school logos and branding images directly from the admin settings interface.

## Changes Made

### 1. School Info Form (`src/components/admin/settings/school-info-form.tsx`)

#### Features Added:
- ✅ File upload button for school logo
- ✅ Image preview with remove button
- ✅ Cloudinary integration for secure uploads
- ✅ File validation (type and size)
- ✅ Upload progress indicator
- ✅ Fallback to manual URL input

#### Implementation Details:
```typescript
// Upload handler
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    toast.error("Please upload an image file");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error("Image size should be less than 5MB");
    return;
  }

  // Upload to Cloudinary
  setUploadingLogo(true);
  try {
    const result = await uploadToCloudinary(file, {
      folder: 'school-logos',
      resource_type: 'image',
    });
    
    setSchoolLogo(result.secure_url);
    toast.success("Logo uploaded successfully");
  } catch (error) {
    console.error("Error uploading logo:", error);
    toast.error("Failed to upload logo");
  } finally {
    setUploadingLogo(false);
  }
};
```

### 2. Appearance Settings Form (`src/components/admin/settings/appearance-settings-form.tsx`)

#### Features Added:
- ✅ Upload for Main Logo
- ✅ Upload for Favicon
- ✅ Upload for Email Logo
- ✅ Upload for Letterhead Logo
- ✅ Reusable upload handler
- ✅ Individual loading states for each upload

#### Implementation Details:
```typescript
// Reusable image upload handler
const handleImageUpload = async (
  file: File,
  folder: string,
  setter: (url: string) => void,
  loadingSetter: (loading: boolean) => void
) => {
  if (!file.type.startsWith('image/')) {
    toast.error("Please upload an image file");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error("Image size should be less than 5MB");
    return;
  }

  loadingSetter(true);
  try {
    const result = await uploadToCloudinary(file, {
      folder,
      resource_type: 'image',
    });
    
    setter(result.secure_url);
    toast.success("Image uploaded successfully");
  } catch (error) {
    console.error("Error uploading image:", error);
    toast.error("Failed to upload image");
  } finally {
    loadingSetter(false);
  }
};
```

## Cloudinary Configuration

### Environment Variables (Already Configured):
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dcuqzbcma
NEXT_PUBLIC_CLOUDINARY_API_KEY=164177694563665
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=school-erp
```

### Upload Folders:
- `school-logos/` - Main school logos
- `logos/` - General application logos
- `favicons/` - Favicon images
- `email-logos/` - Email branding logos
- `letterhead-logos/` - Document letterhead logos

## Features

### File Validation:
- ✅ File type validation (images only)
- ✅ File size validation (max 5MB)
- ✅ User-friendly error messages

### User Experience:
- ✅ Image preview before saving
- ✅ Remove button to clear uploaded images
- ✅ Loading indicators during upload
- ✅ Success/error toast notifications
- ✅ Disabled state during upload
- ✅ Manual URL input as fallback

### Security:
- ✅ Client-side validation
- ✅ Cloudinary upload preset for security
- ✅ Organized folder structure
- ✅ Secure HTTPS URLs

## Usage

### For Administrators:

1. **Upload School Logo:**
   - Navigate to Admin Settings → School Info
   - Click "Upload Logo" button
   - Select an image file (JPG, PNG, SVG)
   - Image is automatically uploaded to Cloudinary
   - Preview appears immediately
   - Click "Save Changes" to persist

2. **Upload Other Branding Images:**
   - Navigate to Admin Settings → Appearance
   - Scroll to "Logos & Icons" section
   - Click upload button for desired logo type
   - Select image file
   - Preview and save

3. **Remove Uploaded Images:**
   - Click the X button on the image preview
   - Image URL is cleared
   - Click "Save Changes" to persist

4. **Manual URL Entry:**
   - Can still enter URLs manually if preferred
   - Useful for images hosted elsewhere
   - URL input field available below upload button

## Technical Details

### Dependencies:
- `@/lib/cloudinary` - Cloudinary upload utility
- `lucide-react` - Upload and X icons
- `react-hot-toast` - User notifications

### State Management:
```typescript
const [uploadingLogo, setUploadingLogo] = useState(false);
const [schoolLogo, setSchoolLogo] = useState(initialData.schoolLogo || "");
```

### Upload Function:
```typescript
import { uploadToCloudinary } from "@/lib/cloudinary";

const result = await uploadToCloudinary(file, {
  folder: 'school-logos',
  resource_type: 'image',
});
```

## Benefits

1. **Improved UX**: No need to manually upload to external services
2. **Consistency**: All images stored in one place (Cloudinary)
3. **Optimization**: Cloudinary automatically optimizes images
4. **CDN**: Fast delivery through Cloudinary's global CDN
5. **Reliability**: Professional image hosting service
6. **Flexibility**: Still supports manual URL input

## Future Enhancements

Potential improvements:
- [ ] Image cropping/editing before upload
- [ ] Multiple image format support
- [ ] Drag-and-drop upload
- [ ] Bulk image upload
- [ ] Image compression settings
- [ ] Delete from Cloudinary when removed
- [ ] Image gallery/library

## Testing

### Test Cases:
1. ✅ Upload valid image (JPG, PNG, SVG)
2. ✅ Upload oversized image (>5MB) - should show error
3. ✅ Upload non-image file - should show error
4. ✅ Remove uploaded image
5. ✅ Manual URL entry
6. ✅ Save settings with uploaded image
7. ✅ Preview uploaded image
8. ✅ Multiple uploads in same session

## Conclusion

The Cloudinary logo upload feature is now fully implemented and ready for use. Administrators can easily upload and manage school branding images directly from the settings interface without needing external tools or services.
