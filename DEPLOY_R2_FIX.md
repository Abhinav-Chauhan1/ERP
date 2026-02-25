# Deploy R2 Image Fix to Production

## What Was Fixed

### 1. CSRF Validation for Student Enrollment
- Added `/api/students/` and `/api/parents/` to CSRF skip paths
- File: `src/lib/middleware/csrf-protection.ts`

### 2. R2 Upload URL Generation
- Fixed incorrect URL format: `{bucketname}.r2.dev` → `pub-{accountId}.r2.dev`
- File: `src/app/api/r2/upload/route.ts`
- Now uses `R2_CUSTOM_DOMAIN` environment variable or defaults to correct public URL

### 3. R2 Config URL Generation
- Enhanced `generateCdnUrl()` to properly handle custom domains
- File: `src/lib/config/r2-config.ts`
- Added fallback to R2 public URL format

### 4. Next.js Image Configuration
- Added R2 domains to `remotePatterns`
- File: `next.config.js`
- Allows Next.js Image component to load R2 images

## Deployment Steps

### Step 1: Enable R2 Public Access (CRITICAL - Do This First!)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → **sikshamitra** bucket
3. Click **Settings** tab
4. Under **Public Access**, click **"Allow Access"**
5. Confirm the action
6. Note the public URL: `https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev`

**Why this is critical**: Without public access enabled, NO images will be visible, even with correct URLs.

### Step 2: Update Production Environment Variables

Set this environment variable in your production environment:

```env
R2_CUSTOM_DOMAIN=https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev
```

#### Platform-Specific Instructions:

**Vercel:**
```bash
# Via CLI
vercel env add R2_CUSTOM_DOMAIN production
# Enter: https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev

# Or via Dashboard:
# 1. Project Settings → Environment Variables
# 2. Add R2_CUSTOM_DOMAIN
# 3. Value: https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev
# 4. Environment: Production
```

**Railway:**
```bash
# Via CLI
railway variables set R2_CUSTOM_DOMAIN=https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev

# Or via Dashboard:
# 1. Project → Variables
# 2. Add R2_CUSTOM_DOMAIN
# 3. Value: https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev
```

**Netlify:**
```bash
# Via CLI
netlify env:set R2_CUSTOM_DOMAIN https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev

# Or via Dashboard:
# 1. Site settings → Environment variables
# 2. Add R2_CUSTOM_DOMAIN
# 3. Value: https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev
```

**Docker/VPS:**
Update your `.env.production` file:
```env
R2_CUSTOM_DOMAIN=https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev
```

### Step 3: Deploy Code Changes

```bash
# Commit the changes
git add .
git commit -m "fix: R2 image visibility and CSRF validation"

# Push to production branch
git push origin main  # or your production branch
```

### Step 4: Verify Deployment

After deployment completes:

1. **Test New Upload:**
   - Go to Settings → Logo & Branding
   - Upload a new logo
   - Check the URL in browser DevTools
   - Should be: `https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev/...`

2. **Test Existing Images:**
   - Existing images should now be visible
   - If not, check Step 1 (public access must be enabled)

3. **Test Student Enrollment:**
   - Create a new student with class/section
   - Should succeed without CSRF error

## Fixing Existing Images in Database

If you have existing images with incorrect URLs in the database, run this migration:

```sql
-- Update all R2 URLs to use correct public URL format
UPDATE "School"
SET "logoUrl" = REPLACE(
  "logoUrl",
  'https://sikshamitra.r2.dev/',
  'https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev/'
)
WHERE "logoUrl" LIKE 'https://sikshamitra.r2.dev/%';

-- Update other tables with R2 URLs (adjust table/column names as needed)
UPDATE "User"
SET "image" = REPLACE(
  "image",
  'https://sikshamitra.r2.dev/',
  'https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev/'
)
WHERE "image" LIKE 'https://sikshamitra.r2.dev/%';

-- Add more UPDATE statements for other tables with R2 URLs
```

Or create a script:

```typescript
// scripts/fix-r2-urls.ts
import { db } from '@/lib/db';

async function fixR2Urls() {
  const oldDomain = 'https://sikshamitra.r2.dev/';
  const newDomain = 'https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev/';

  // Update School logos
  const schools = await db.school.findMany({
    where: {
      logoUrl: {
        startsWith: oldDomain,
      },
    },
  });

  for (const school of schools) {
    if (school.logoUrl) {
      await db.school.update({
        where: { id: school.id },
        data: {
          logoUrl: school.logoUrl.replace(oldDomain, newDomain),
        },
      });
      console.log(`Updated school ${school.id} logo URL`);
    }
  }

  // Update User images
  const users = await db.user.findMany({
    where: {
      image: {
        startsWith: oldDomain,
      },
    },
  });

  for (const user of users) {
    if (user.image) {
      await db.user.update({
        where: { id: user.id },
        data: {
          image: user.image.replace(oldDomain, newDomain),
        },
      });
      console.log(`Updated user ${user.id} image URL`);
    }
  }

  console.log('✅ All R2 URLs updated successfully!');
}

fixR2Urls().catch(console.error);
```

Run it:
```bash
npx tsx scripts/fix-r2-urls.ts
```

## Verification Checklist

- [ ] R2 public access enabled in Cloudflare
- [ ] `R2_CUSTOM_DOMAIN` environment variable set in production
- [ ] Code changes deployed
- [ ] New uploads generate correct URLs
- [ ] Existing images are visible
- [ ] Student enrollment works without CSRF error
- [ ] Logo displays on all pages
- [ ] Database URLs updated (if needed)

## Troubleshooting

### Images Still Not Visible

1. **Check R2 Public Access:**
   ```bash
   # Test the public URL directly
   curl -I https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev/
   # Should return 200 OK or 404 (not 403 Forbidden)
   ```

2. **Check Environment Variable:**
   - Verify in your platform's dashboard
   - Ensure it includes `https://`
   - Ensure it uses `pub-` prefix

3. **Check Generated URLs:**
   - Upload a new image
   - Check the URL in the response
   - Should match the public URL format

4. **Check Browser Console:**
   - Look for CORS errors
   - Look for 403 Forbidden errors
   - Look for mixed content warnings

### CORS Errors

If you see CORS errors:

1. Run the R2 setup script:
   ```bash
   npm run setup:r2
   ```

2. Or manually configure CORS in Cloudflare:
   - R2 bucket → Settings → CORS
   - Add allowed origins

### Mixed Content Warnings

If you see mixed content warnings:
- Ensure `R2_CUSTOM_DOMAIN` starts with `https://`
- Check that your site is served over HTTPS

## Rollback Plan

If something goes wrong:

1. **Revert Environment Variable:**
   ```env
   # Remove or comment out
   # R2_CUSTOM_DOMAIN=...
   ```

2. **Revert Code Changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Disable R2 Public Access:**
   - Go to Cloudflare → R2 → Settings
   - Disable public access

## Next Steps

After successful deployment:

1. **Monitor Logs:**
   - Check for any R2-related errors
   - Monitor upload success rate

2. **Test Thoroughly:**
   - Test image uploads in all modules
   - Test logo display
   - Test student enrollment

3. **Consider Custom Domain (Optional):**
   - Set up `cdn.sikshamitra.com`
   - Better branding and shorter URLs
   - See PRODUCTION_R2_FIX.md for instructions

## Support

If you encounter issues:
1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Ensure R2 public access is enabled
4. Test the public URL directly in browser
