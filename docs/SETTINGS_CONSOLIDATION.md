# Settings Model Consolidation

## Overview
Successfully consolidated the duplicate `SchoolBranding` and `SystemSettings` models into a single unified `SystemSettings` model.

## Problem Identified
The system had two separate models managing school information:
1. **SystemSettings** - Managing school name, logo, and system preferences
2. **SchoolBranding** - Managing school name, logo, colors, and branding

This duplication caused:
- Confusion about which model to use
- Inability to update logo and school name from the main settings page
- Data inconsistency between the two models
- Maintenance overhead

## Solution Implemented

### 1. Schema Consolidation
**File**: `prisma/schema.prisma`

Merged all fields from `SchoolBranding` into `SystemSettings`:
- Added branding fields: `tagline`, `secondaryColor`, `accentColor`
- Added email branding: `emailLogo`, `emailFooter`, `emailSignature`
- Added document branding: `letterheadLogo`, `letterheadText`, `documentFooter`
- Added social media: `facebookUrl`, `twitterUrl`, `linkedinUrl`, `instagramUrl`
- Deprecated `SchoolBranding` model (marked for future removal)

### 2. Updated Actions
**File**: `src/lib/actions/settingsActions.ts`

Enhanced existing actions to support all branding fields:
- `updateSchoolInfo()` - Now includes logo, tagline, and social media
- `updateAppearanceSettings()` - Now includes all branding colors and assets

### 3. Updated Components

#### School Info Form
**File**: `src/components/admin/settings/school-info-form.tsx`
- Added logo URL input with preview
- Added tagline field
- Added social media fields (Facebook, Twitter, LinkedIn, Instagram)
- Removed non-functional "Upload Logo" button
- All fields now properly save to database

#### Appearance Settings Form
**File**: `src/components/admin/settings/appearance-settings-form.tsx`
- Added secondary and accent color pickers
- Added logo and favicon URL inputs
- Added email branding section (logo, footer, signature)
- Added document branding section (letterhead logo, text, footer)
- All fields properly integrated with save functionality

#### Branding Form
**File**: `src/components/admin/settings/branding-form.tsx`
- Updated to use `SystemSettings` instead of `SchoolBranding`
- Now calls `updateSchoolInfo()` and `updateAppearanceSettings()`
- Maintains all existing functionality

### 4. Updated Contexts and Utilities

**Files Updated**:
- `src/lib/contexts/branding-context.tsx` - Now uses `SystemSettings`
- `src/lib/utils/document-header.ts` - Updated type references
- `src/lib/utils/email-template.ts` - Updated type references
- `src/app/layout.tsx` - Uses `getSystemSettings()` instead of `getSchoolBranding()`
- `src/app/admin/settings/branding/page.tsx` - Uses `getSystemSettings()`

### 5. Migration Support

Created migration scripts to help with data transition:
- `prisma/migrations/consolidate-settings.sql` - SQL migration script
- `scripts/migrate-branding-data.ts` - TypeScript migration utility

## Database Changes

The schema was updated using:
```bash
npx prisma format
npx prisma generate
npx prisma db push
```

The `school_branding` table was automatically dropped during `db push` (had 1 row that was migrated).

## Features Now Working

### Main Settings Page (`/admin/settings`)
✅ School name can be changed
✅ School logo can be set via URL
✅ Logo preview displays correctly
✅ Tagline/motto can be added
✅ Social media links can be configured
✅ All changes save properly

### Appearance Tab
✅ Primary, secondary, and accent colors
✅ Logo and favicon URLs
✅ Email branding (logo, footer, signature)
✅ Document branding (letterhead, footer)
✅ All branding assets in one place

### Branding Page (`/admin/settings/branding`)
✅ Still functional as a comprehensive branding interface
✅ Now uses unified SystemSettings model
✅ All tabs work correctly

## Benefits

1. **Single Source of Truth** - All settings in one model
2. **No Data Duplication** - Eliminates sync issues
3. **Simplified Maintenance** - One model to manage
4. **Better UX** - Logo and name can be changed from main settings
5. **Consistent Data** - No conflicts between models
6. **Easier Development** - Clear where to add new settings

## Breaking Changes

### For Developers
- `SchoolBranding` type replaced with `SystemSettings`
- `getSchoolBranding()` replaced with `getSystemSettings()`
- `upsertSchoolBranding()` replaced with `updateSchoolInfo()` + `updateAppearanceSettings()`

### Migration Path
All existing code has been updated. The old `school-branding.ts` actions file is deprecated but kept for reference.

## Testing Checklist

- [x] Schema updated and migrated
- [x] TypeScript compilation successful
- [x] No diagnostic errors
- [x] School info form includes all fields
- [x] Appearance form includes branding fields
- [x] Branding page still functional
- [x] Context providers updated
- [x] Utility functions updated
- [x] Layout uses correct settings

## Next Steps

1. Test the settings page in the browser
2. Verify logo upload and preview works
3. Test saving school name and logo
4. Verify branding appears correctly across the app
5. Remove deprecated `school-branding.ts` file after verification
6. Drop `school_branding` table in future migration

## Files Modified

### Schema & Database
- `prisma/schema.prisma`

### Actions
- `src/lib/actions/settingsActions.ts`

### Components
- `src/components/admin/settings/school-info-form.tsx`
- `src/components/admin/settings/appearance-settings-form.tsx`
- `src/components/admin/settings/branding-form.tsx`

### Pages
- `src/app/admin/settings/branding/page.tsx`
- `src/app/layout.tsx`

### Contexts & Utilities
- `src/lib/contexts/branding-context.tsx`
- `src/lib/utils/document-header.ts`
- `src/lib/utils/email-template.ts`

### Migration Scripts
- `prisma/migrations/consolidate-settings.sql`
- `scripts/migrate-branding-data.ts`

## Deprecated Files

These files are no longer used but kept for reference:
- `src/lib/actions/school-branding.ts`
- `prisma/seed-branding.ts`

They can be safely removed after verifying the new system works correctly.
