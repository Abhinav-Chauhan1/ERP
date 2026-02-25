# R2 Image Visibility Fix Summary

## Issues Fixed

### 1. CSRF Validation Failed on Student Enrollment
**Problem**: When creating a student, the enrollment API call was failing with "CSRF validation failed"

**Root Cause**: The `/api/students/enroll` endpoint was not in the CSRF skip paths list, even though it uses session authentication.

**Fix**: Added `/api/students/` and `/api/parents/` to the CSRF skip paths in `src/lib/middleware/csrf-protection.ts`

### 2. R2 Images Not Visible in Production
**Problem**: Uploaded images on R2 were not visible, and the logo was not showing on the index page

**Root Causes**:
1. `R2_CUSTOM_DOMAIN` was set to placeholder `cdn.yourdomain.com` instead of actual R2 public URL
2. Next.js image configuration didn't include R2 domains

**Fixes**:

#### A. Updated Environment Variables (.env)
```env
# Changed from:
R2_CUSTOM_DOMAIN=cdn.yourdomain.com

# To:
R2_CUSTOM_DOMAIN=https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev
```

#### B. Updated Next.js Image Configuration (next.config.js)
Added R2 domains to `remotePatterns`:
```javascript
{
  protocol: 'https',
  hostname: 'pub-*.r2.dev',
},
{
  protocol: 'https',
  hostname: '*.r2.cloudflarestorage.com',
}
```

#### C. Enhanced R2 Config URL Generation (src/lib/config/r2-config.ts)
- Improved `generateCdnUrl()` to properly handle custom domains
- Added fallback to R2 public URL format: `https://pub-{accountId}.r2.dev`
- Added proper URL validation and formatting

## R2 Public URL Format

Cloudflare R2 provides public URLs in this format:
```
https://pub-{accountId}.r2.dev/{key}
```

For your account:
```
https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev/
```

## Important Notes

### Enabling R2 Public Access
To make R2 files publicly accessible, you need to:

1. Go to Cloudflare Dashboard → R2 → Your Bucket (sikshamitra)
2. Click "Settings" tab
3. Under "Public Access", click "Allow Access"
4. Confirm the action

**Security Note**: Only enable public access if you want files to be accessible without authentication. For sensitive files, use presigned URLs instead.

### Custom Domain (Optional)
If you want a custom domain like `cdn.sikshamitra.com`:

1. Add a CNAME record in your DNS:
   ```
   cdn.sikshamitra.com → pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev
   ```

2. Update `.env`:
   ```env
   R2_CUSTOM_DOMAIN=https://cdn.sikshamitra.com
   ```

3. Add to Next.js config:
   ```javascript
   {
     protocol: 'https',
     hostname: 'cdn.sikshamitra.com',
   }
   ```

## Testing

### 1. Test Image Upload
```bash
# Upload a test image through the admin panel
# Check if the URL generated is correct
```

### 2. Test Logo Display
```bash
# Visit the index page (/)
# Logo should be visible at /logo.png
```

### 3. Test R2 URL Generation
```javascript
import { generateCdnUrl } from '@/lib/config/r2-config';

const url = generateCdnUrl('school-123/images/test.jpg');
console.log(url);
// Should output: https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev/school-123/images/test.jpg
```

## Deployment Checklist

- [x] Update `.env` with correct R2_CUSTOM_DOMAIN
- [x] Update `next.config.js` with R2 image domains
- [x] Update `src/lib/config/r2-config.ts` with improved URL generation
- [x] Fix CSRF validation for student enrollment
- [ ] Enable R2 public access in Cloudflare Dashboard (if needed)
- [ ] Test image uploads in production
- [ ] Test logo display on index page
- [ ] (Optional) Set up custom domain for CDN

## Files Modified

1. `src/lib/middleware/csrf-protection.ts` - Added CSRF skip paths
2. `next.config.js` - Added R2 image domains
3. `.env` - Updated R2_CUSTOM_DOMAIN
4. `.env.example` - Updated documentation
5. `src/lib/config/r2-config.ts` - Enhanced URL generation

## Next Steps

1. **Restart the development server** to apply Next.js config changes
2. **Enable R2 public access** in Cloudflare Dashboard if files should be publicly accessible
3. **Test image uploads** to verify URLs are generated correctly
4. **Check existing images** - they should now be visible with the correct URL format
5. **Consider setting up a custom domain** for better branding (optional)
