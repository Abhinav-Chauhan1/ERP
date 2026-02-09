# Settings Page Documentation

## Overview
The Settings page (`/admin/settings`) is a production-ready, database-connected configuration interface for managing all system-wide settings in the School ERP system.

## Features

### 1. General Settings
- **School Information**: Name, email, phone, address, website, fax
- **Timezone Configuration**: Select from major US timezones
- **Real-time Validation**: Email format validation
- **Database Persistence**: All changes saved to PostgreSQL

### 2. Academic Settings
- **Academic Year Management**: Configure current academic year
- **Term Selection**: Set active term (1, 2, or 3)
- **Grading System**: Choose between percentage, GPA, or letter grades
- **Passing Grade**: Set minimum passing threshold (0-100)
- **Attendance Automation**: 
  - Auto-mark absent students
  - Configure late arrival threshold (0-60 minutes)

### 3. Notification Settings
- **Channel Configuration**:
  - Email notifications
  - SMS notifications
  - Push notifications
- **Event Types**:
  - Student enrollment alerts
  - Fee payment notifications
  - Attendance alerts
  - Exam results publication
  - Leave application notifications

### 4. Security Settings
- **Authentication**:
  - Two-factor authentication toggle
  - Session timeout (5-1440 minutes)
  - Password expiry policy (30-365 days)
- **Data Protection**:
  - Automatic backup scheduling
  - Backup frequency (hourly/daily/weekly)
  - Manual backup trigger

### 5. Appearance Settings
- **Theme Selection**: Light, dark, or system
- **Primary Color**: 
  - Preset colors (blue, green, purple, orange, red)
  - Custom color picker
- **Localization**:
  - Language selection (English, Spanish, French, German)
  - Date format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- **Branding**: Logo and favicon upload (UI ready)

## Technical Implementation

### Database Schema
```prisma
model SystemSettings {
  id                    String   @id @default(cuid())
  
  // School Information
  schoolName            String
  schoolEmail           String?
  schoolPhone           String?
  schoolAddress         String?
  schoolWebsite         String?
  schoolFax             String?
  timezone              String
  
  // Academic Settings
  currentAcademicYear   String?
  currentTerm           String?
  gradingSystem         String
  passingGrade          Int
  autoAttendance        Boolean
  lateArrivalThreshold  Int
  
  // Notification Settings
  emailNotifications    Boolean
  smsNotifications      Boolean
  pushNotifications     Boolean
  notifyEnrollment      Boolean
  notifyPayment         Boolean
  notifyAttendance      Boolean
  notifyExamResults     Boolean
  notifyLeaveApps       Boolean
  
  // Security Settings
  twoFactorAuth         Boolean
  sessionTimeout        Int
  passwordExpiry        Int
  autoBackup            Boolean
  backupFrequency       String
  
  // Appearance Settings
  theme                 String
  primaryColor          String
  language              String
  dateFormat            String
  logoUrl               String?
  faviconUrl            String?
  
  createdAt             DateTime
  updatedAt             DateTime
}
```

### Server Actions
Located in `src/lib/actions/settingsActions.ts`:

- `getSystemSettings()`: Fetch current settings (creates defaults if none exist)
- `updateGeneralSettings()`: Update school information
- `updateAcademicSettings()`: Update academic configuration
- `updateNotificationSettings()`: Update notification preferences
- `updateSecuritySettings()`: Update security policies
- `updateAppearanceSettings()`: Update theme and localization
- `triggerBackup()`: Manually trigger database backup

### Validation Rules

#### General Settings
- School name: Required, non-empty
- Email: Valid email format (if provided)

#### Academic Settings
- Passing grade: 0-100
- Late arrival threshold: 0-60 minutes

#### Security Settings
- Session timeout: 5-1440 minutes
- Password expiry: 30-365 days

## User Experience

### Loading States
- Initial page load shows spinner
- Save buttons show "Saving..." during operations
- Buttons disabled during save operations

### Error Handling
- Toast notifications for all operations
- Success messages on save
- Error messages with details
- Console logging for debugging

### Data Persistence
- Settings loaded on component mount
- Auto-creates default settings if none exist
- Path revalidation after updates
- Optimistic UI updates

## Usage

### Accessing the Page
Navigate to `/admin/settings` in the admin dashboard.

### Making Changes
1. Select the appropriate tab (General, Academic, etc.)
2. Modify the desired settings
3. Click "Save Changes" button
4. Wait for success confirmation

### Testing
Run the test script to verify database connectivity:
```bash
npx tsx scripts/test-settings.ts
```

## Future Enhancements

### Planned Features
- [ ] Logo and favicon upload functionality
- [ ] Backup history viewer
- [ ] Settings export/import
- [ ] Audit log for settings changes
- [ ] Role-based settings access control
- [ ] Settings versioning
- [ ] Bulk settings reset
- [ ] Settings search functionality

### Integration Points
- Theme settings can be integrated with a global theme provider
- Notification settings can control email/SMS services
- Security settings can enforce authentication policies
- Academic settings can be used across grading modules

## Troubleshooting

### Settings Not Saving
1. Check database connection in `.env`
2. Verify Prisma schema is synced: `npx prisma db push`
3. Check browser console for errors
4. Verify server actions are working

### Default Settings Not Created
- Run: `npx tsx scripts/test-settings.ts`
- Check database permissions
- Verify Prisma Client is generated

### Validation Errors
- Review validation rules in this document
- Check input values are within allowed ranges
- Ensure required fields are filled

## Security Considerations

- All settings require admin authentication
- Server-side validation on all updates
- SQL injection protection via Prisma ORM
- XSS protection via React's built-in escaping
- CSRF protection via Next.js server actions

## Performance

- Settings cached on client after initial load
- Optimistic updates for better UX
- Minimal re-renders with React state management
- Database queries optimized with Prisma
- Path revalidation only on successful updates
