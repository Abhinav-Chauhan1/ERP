# Student Settings - Database Migration Instructions

## Overview
The Student Settings feature has been implemented with a new database model. You need to run a Prisma migration to update your database schema.

## Migration Steps

### 1. Generate and Apply Migration

Run the following commands in your terminal:

```bash
# Generate the migration
npx prisma migrate dev --name add_student_settings

# This will:
# - Create the StudentSettings table
# - Add phone and emergencyPhone fields to Student table
# - Create ProfileVisibility, Theme, and TimeFormat enums
# - Generate the Prisma Client with new types
```

### 2. Verify Migration

After running the migration, verify it was successful:

```bash
# Check the database
npx prisma studio

# Look for:
# - StudentSettings table
# - Updated Student table with new fields
```

## What Was Added

### New Model: StudentSettings
- Notification preferences (7 settings)
- Privacy settings (profile visibility, contact info visibility)
- Appearance settings (theme, language, date/time formats)

### New Enums:
- `ProfileVisibility`: PUBLIC, PRIVATE, CLASSMATES_ONLY
- `Theme`: LIGHT, DARK, SYSTEM
- `TimeFormat`: TWELVE_HOUR, TWENTY_FOUR_HOUR

### Updated Student Model:
- Added `settings` relation (one-to-one with StudentSettings)
- Added `phone` field (String?)
- Added `emergencyPhone` field (String?)

## Files Created

### Components:
- `src/components/student/settings/account-settings.tsx`
- `src/components/student/settings/notification-settings.tsx`
- `src/components/student/settings/privacy-settings.tsx`
- `src/components/student/settings/appearance-settings.tsx`

### Pages:
- `src/app/student/settings/page.tsx`

### Actions:
- `src/lib/actions/student-settings-actions.ts`

## Features Implemented

### 1. Account Settings Tab
- View and edit personal information
- Update email and phone number
- Manage emergency contact details
- View account information (Student ID, DOB, Gender, etc.)

### 2. Notifications Tab
- Toggle email notifications
- Configure assignment reminders
- Set exam reminders
- Enable/disable attendance alerts
- Manage fee reminders
- Control event notifications
- Configure announcement notifications

### 3. Privacy Tab
- Set profile visibility (Public/Private/Classmates Only)
- Control email address visibility
- Control phone number visibility
- Privacy notice information

### 4. Appearance Tab
- Choose theme (Light/Dark/System)
- Select language (English, Spanish, French, German, Chinese, Arabic)
- Set date format (4 options)
- Set time format (12-hour/24-hour)

## Default Settings

When a student accesses settings for the first time, default values are created:
- All notifications: Enabled
- Profile visibility: Private
- Contact info: Hidden
- Theme: Light
- Language: English
- Date format: MM/DD/YYYY
- Time format: 12-hour

## Testing

After migration, test the following:

1. **Access Settings Page**
   - Navigate to `/student/settings`
   - Verify all 4 tabs load correctly

2. **Update Account Settings**
   - Change phone number
   - Update emergency contact
   - Verify changes are saved

3. **Toggle Notifications**
   - Enable/disable various notification types
   - Verify settings persist after page refresh

4. **Change Privacy Settings**
   - Change profile visibility
   - Toggle contact info visibility
   - Verify changes are saved

5. **Update Appearance**
   - Change theme (note: full theme switching requires additional implementation)
   - Change language preference
   - Change date/time formats
   - Verify settings persist

## Notes

- Settings are created automatically on first access
- All settings changes are validated server-side
- Toast notifications confirm successful updates
- Unauthorized access is prevented with role checks
- Settings are student-specific and isolated

## Troubleshooting

### Migration Fails
If the migration fails, check:
1. Database connection is working
2. No conflicting migrations exist
3. Prisma schema syntax is correct

### Settings Not Saving
If settings don't save:
1. Check browser console for errors
2. Verify server actions are working
3. Check database permissions
4. Verify student ID is correct

### Default Settings Not Created
If defaults aren't created:
1. Check `getStudentSettings` function
2. Verify database write permissions
3. Check server logs for errors

## Future Enhancements

Potential improvements:
- Implement actual theme switching (currently just saves preference)
- Add language translation support
- Add more notification granularity
- Add data export functionality
- Add account deletion option
- Add two-factor authentication settings
