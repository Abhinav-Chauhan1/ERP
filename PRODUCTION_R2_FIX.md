# Production R2 Image Visibility Fix

## Problem
Images uploaded to R2 in production are not visible. The URL format shows:
```
https://sikshamitra.r2.dev/cmd/dkbsax0500v4dkvw/xbz0lqqxv/772024519683-ic55-logo.jpeg
```

This URL format is incorrect and won't work.

## Root Cause
The production environment variable `R2_CUSTOM_DOMAIN` is not set correctly. It's likely using a placeholder value or the bucket name format instead of the proper R2 public URL.

## Solution

### Step 1: Enable R2 Public Access (CRITICAL)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → **sikshamitra** bucket
3. Click the **Settings** tab
4. Under **Public Access**, click **"Allow Access"**
5. You'll see a public URL like: `https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev`

### Step 2: Update Production Environment Variables

In your production environment (Vercel/Railway/etc.), set:

```env
R2_CUSTOM_DOMAIN=https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev
```

**Important**: 
- Include `https://` in the URL
- Use `pub-{accountId}.r2.dev` format, NOT `{bucketname}.r2.dev`
- Your account ID is: `0ea3345fbf2e324457b0ce0fb45eace0`

### Step 3: Verify Next.js Image Configuration

Ensure your production build includes these image domains in `next.config.js`:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'pub-*.r2.dev',
    },
    {
      protocol: 'https',
      hostname: '*.r2.cloudflarestorage.com',
    },
  ],
}
```

### Step 4: Redeploy

After updating the environment variable:
1. Trigger a new deployment
2. The new build will use the correct R2 public URL

## Testing

### Test 1: Check Environment Variable
In your production environment, verify:
```bash
echo $R2_CUSTOM_DOMAIN
# Should output: https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev
```

### Test 2: Upload a New Image
1. Upload a new logo or image
2. Check the generated URL
3. It should be: `https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev/school-{id}/...`

### Test 3: Access Existing Images
Once public access is enabled, existing images should also become accessible at:
```
https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev/{existing-key}
```

## Platform-Specific Instructions

### Vercel
1. Go to your project → **Settings** → **Environment Variables**
2. Find `R2_CUSTOM_DOMAIN` or add it
3. Set value: `https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev`
4. Select **Production** environment
5. Click **Save**
6. Redeploy from **Deployments** tab

### Railway
1. Go to your project → **Variables** tab
2. Find `R2_CUSTOM_DOMAIN` or add it
3. Set value: `https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev`
4. Railway will auto-redeploy

### Netlify
1. Go to **Site settings** → **Environment variables**
2. Find `R2_CUSTOM_DOMAIN` or add it
3. Set value: `https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev`
4. Trigger a new deploy

### Docker/VPS
Update your `.env.production` file:
```env
R2_CUSTOM_DOMAIN=https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev
```
Then restart your application.

## Alternative: Custom Domain (Optional)

If you want to use a custom domain like `cdn.sikshamitra.com`:

### Step 1: Add Custom Domain in Cloudflare R2
1. Go to R2 bucket → **Settings** → **Custom Domains**
2. Click **Connect Domain**
3. Enter: `cdn.sikshamitra.com`
4. Follow the DNS setup instructions

### Step 2: Update DNS
Add a CNAME record:
```
Type: CNAME
Name: cdn
Target: pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev
Proxy: Yes (Orange cloud)
```

### Step 3: Update Environment Variable
```env
R2_CUSTOM_DOMAIN=https://cdn.sikshamitra.com
```

### Step 4: Update Next.js Config
```javascript
{
  protocol: 'https',
  hostname: 'cdn.sikshamitra.com',
}
```

## Troubleshooting

### Images Still Not Visible After Fix

1. **Check R2 Public Access**
   - Verify public access is enabled in Cloudflare dashboard
   - Test URL directly in browser: `https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev/`

2. **Check Environment Variable**
   - Verify `R2_CUSTOM_DOMAIN` is set correctly in production
   - Ensure it includes `https://`
   - Ensure it uses `pub-` prefix, not bucket name

3. **Check Next.js Image Config**
   - Verify `pub-*.r2.dev` is in `remotePatterns`
   - Redeploy after config changes

4. **Check Generated URLs**
   - Upload a new image
   - Check the URL in the database
   - It should match: `https://pub-{accountId}.r2.dev/school-{id}/...`

5. **Clear Cache**
   - Clear browser cache
   - Clear CDN cache if using Cloudflare proxy

### CORS Issues

If you see CORS errors in browser console:

1. Check R2 CORS configuration
2. Run the setup script:
   ```bash
   npm run setup:r2
   ```

## Security Considerations

### Public Access
- Enabling public access makes ALL files in the bucket publicly accessible
- Anyone with the URL can access the files
- Consider this for sensitive documents

### Alternative: Presigned URLs
For sensitive files, use presigned URLs instead:
```typescript
const presignedUrl = await r2StorageService.generatePresignedUrl(
  schoolId,
  key,
  3600 // 1 hour expiry
);
```

## Summary

The fix requires:
1. ✅ Enable R2 public access in Cloudflare
2. ✅ Set `R2_CUSTOM_DOMAIN=https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev`
3. ✅ Verify Next.js image config includes R2 domains
4. ✅ Redeploy production

After these steps, all images should be visible!
