# R2 Production Image Fix - Quick Summary

## Problem
Images uploaded to R2 in production are not visible. URLs show incorrect format:
```
❌ https://sikshamitra.r2.dev/...
```

## Root Cause
1. R2 public access not enabled in Cloudflare
2. Wrong environment variable used (`R2_PUBLIC_DOMAIN` instead of `R2_CUSTOM_DOMAIN`)
3. Incorrect URL format (bucket name instead of public URL)

## Solution (3 Steps)

### 1. Enable R2 Public Access (CRITICAL!)
Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2 → sikshamitra → Settings → Enable Public Access

### 2. Set Environment Variable
Add to your production environment:
```env
R2_CUSTOM_DOMAIN=https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev
```

### 3. Deploy Code Changes
```bash
git add .
git commit -m "fix: R2 image visibility"
git push origin main
```

## Fix Existing Images (Optional)
Run this script to update URLs in database:
```bash
# Preview changes
npx tsx scripts/fix-r2-urls-production.ts --dry-run

# Apply changes
npx tsx scripts/fix-r2-urls-production.ts
```

## Files Changed
- ✅ `src/lib/middleware/csrf-protection.ts` - Fixed CSRF validation
- ✅ `src/app/api/r2/upload/route.ts` - Fixed URL generation
- ✅ `src/lib/config/r2-config.ts` - Enhanced URL handling
- ✅ `next.config.js` - Added R2 image domains
- ✅ `.env` - Updated R2_CUSTOM_DOMAIN

## Verification
After deployment:
1. Upload a new logo → Should generate correct URL
2. Check existing images → Should be visible
3. Test student enrollment → Should work without CSRF error

## Need Help?
See detailed guides:
- `PRODUCTION_R2_FIX.md` - Comprehensive troubleshooting
- `DEPLOY_R2_FIX.md` - Step-by-step deployment guide
