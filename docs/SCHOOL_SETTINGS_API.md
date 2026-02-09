# SchoolSettings API Reference

## Quick Start

```typescript
import { prisma } from '@/lib/prisma';

// Get all settings for a school
const settings = await prisma.schoolSettings.findUnique({
  where: { schoolId: 'school_id_here' }
});

// Update settings
await prisma.schoolSettings.update({
  where: { schoolId: 'school_id_here' },
  data: {
    emailEnabled: true,
    smsEnabled: false,
    twoFactorEnabled: true,
  }
});

// Create settings for new school
await prisma.schoolSettings.create({
  data: {
    schoolId: 'new_school_id',
    schoolName: 'New School',
    // Other fields use defaults
  }
});
```

## Settings Categories

### 1. Onboarding & Basic Info

```typescript
{
  onboardingCompleted: boolean;
  onboardingStep: number;
  schoolName: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolLogo?: string;
  schoolWebsite?: string;
  schoolFax?: string;
  affiliationNumber?: string;
  schoolCode?: string;
  board?: string; // Default: "CBSE"
  timezone: string; // Default: "UTC"
  tagline?: string;
}
```

### 2. Academic Settings

```typescript
{
  currentAcademicYear: string;
  currentTerm: string;
  defaultGradingScale: string; // Default: "PERCENTAGE"
  attendanceThreshold: number; // Default: 75
  lateArrivalMinutes: number; // Default: 15
  passingGrade: number; // Default: 50
  autoAttendance: boolean; // Default: false
}
```

### 3. Security Settings

#### Two-Factor Authentication
```typescript
{
  twoFactorEnabled: boolean; // Default: false
  twoFactorRequired: boolean; // Default: false
  twoFactorMethods: string[]; // Default: ["SMS", "EMAIL"]
}
```

#### Session Management
```typescript
{
  sessionTimeout: number; // Default: 480 minutes (8 hours)
  maxConcurrentSessions: number; // Default: 3
  forceLogoutOnPasswordChange: boolean; // Default: true
}
```

#### Password Policy
```typescript
{
  passwordMinLength: number; // Default: 8
  passwordRequireUppercase: boolean; // Default: true
  passwordRequireLowercase: boolean; // Default: true
  passwordRequireNumbers: boolean; // Default: true
  passwordRequireSpecialChars: boolean; // Default: false
  passwordExpiry: number; // Default: 90 days, 0 = never
}
```

#### IP Whitelisting
```typescript
{
  ipWhitelistEnabled: boolean; // Default: false
  allowedIPs: string[]; // Default: []
  blockUnknownIPs: boolean; // Default: false
}
```

#### Audit Logging
```typescript
{
  auditLoggingEnabled: boolean; // Default: true
  auditLogLevel: string; // Default: "INFO"
  auditLogRetention: number; // Default: 365 days
}
```

#### Data Encryption
```typescript
{
  encryptSensitiveData: boolean; // Default: true
  encryptionLevel: string; // Default: "AES-256"
}
```

#### API Security
```typescript
{
  rateLimitEnabled: boolean; // Default: true
  maxRequestsPerMinute: number; // Default: 100
  requireApiKey: boolean; // Default: false
}
```

### 4. Data Management Settings

#### Backup Settings
```typescript
{
  autoBackupEnabled: boolean; // Default: true
  backupFrequency: string; // Default: "DAILY" (HOURLY, DAILY, WEEKLY, MONTHLY)
  backupRetention: number; // Default: 30 days
  includeFiles: boolean; // Default: true
  encryptBackups: boolean; // Default: true
}
```

#### Export Settings
```typescript
{
  allowDataExport: boolean; // Default: true
  exportFormats: string[]; // Default: ["CSV", "JSON", "PDF"]
  requireApproval: boolean; // Default: true
}
```

#### Data Retention
```typescript
{
  studentDataRetention: number; // Default: 7 years
  messageRetention: number; // Default: 90 days
  autoCleanup: boolean; // Default: false
}
```

#### Storage Management
```typescript
{
  storageQuota: number; // Default: 1 GB
  compressionEnabled: boolean; // Default: true
  autoArchive: boolean; // Default: true
  archiveAfterDays: number; // Default: 365
}
```

### 5. Notification Settings

#### Email Notifications
```typescript
{
  emailEnabled: boolean; // Default: true
  emailAdmissionUpdates: boolean; // Default: true
  emailFeeReminders: boolean; // Default: true
  emailExamNotifications: boolean; // Default: true
  emailAttendanceAlerts: boolean; // Default: true
  emailSystemUpdates: boolean; // Default: true
}
```

#### SMS Notifications
```typescript
{
  smsEnabled: boolean; // Default: false
  smsAdmissionUpdates: boolean; // Default: false
  smsFeeReminders: boolean; // Default: true
  smsExamNotifications: boolean; // Default: true
  smsAttendanceAlerts: boolean; // Default: true
  smsEmergencyAlerts: boolean; // Default: true
}
```

#### WhatsApp Notifications
```typescript
{
  whatsappEnabled: boolean; // Default: false
  whatsappAdmissionUpdates: boolean; // Default: false
  whatsappFeeReminders: boolean; // Default: true
  whatsappExamNotifications: boolean; // Default: true
  whatsappAttendanceAlerts: boolean; // Default: false
  whatsappGeneralUpdates: boolean; // Default: false
}
```

#### Push Notifications
```typescript
{
  pushEnabled: boolean; // Default: true
  pushAdmissionUpdates: boolean; // Default: true
  pushFeeReminders: boolean; // Default: true
  pushExamNotifications: boolean; // Default: true
  pushAttendanceAlerts: boolean; // Default: true
  pushSystemMaintenance: boolean; // Default: true
}
```

#### Notification Timing & Delivery
```typescript
{
  quietHoursEnabled: boolean; // Default: true
  quietHoursStart: string; // Default: "22:00"
  quietHoursEnd: string; // Default: "08:00"
  weekendNotifications: boolean; // Default: false
  batchNotifications: boolean; // Default: true
  immediateEmergency: boolean; // Default: true
  digestFrequency: string; // Default: "DAILY" (IMMEDIATE, HOURLY, DAILY, WEEKLY)
}
```

#### Legacy Notification Channels (Backward Compatibility)
```typescript
{
  notifyEnrollment: boolean; // Default: true
  notifyPayment: boolean; // Default: true
  notifyAttendance: boolean; // Default: true
  notifyExamResults: boolean; // Default: true
  notifyLeaveApps: boolean; // Default: true
  enrollmentNotificationChannels: string[]; // Default: ["EMAIL", "IN_APP"]
  paymentNotificationChannels: string[]; // Default: ["EMAIL", "IN_APP"]
  attendanceNotificationChannels: string[]; // Default: ["SMS", "IN_APP"]
  examResultNotificationChannels: string[]; // Default: ["EMAIL", "IN_APP"]
  leaveAppNotificationChannels: string[]; // Default: ["EMAIL", "IN_APP"]
}
```

### 6. Branding & Theme

```typescript
{
  defaultTheme: string; // Default: "LIGHT"
  defaultColorTheme: string; // Default: "blue"
  primaryColor: string; // Default: "#3b82f6"
  secondaryColor: string; // Default: "#8b5cf6"
  accentColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  emailLogo?: string;
  emailFooter?: string;
  emailSignature?: string;
  letterheadLogo?: string;
  letterheadText?: string;
  documentFooter?: string;
}
```

### 7. Social Media

```typescript
{
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
}
```

### 8. Localization

```typescript
{
  language: string; // Default: "en"
  dateFormat: string; // Default: "mdy"
}
```

### 9. Payment Settings

```typescript
{
  enableOnlinePayment: boolean; // Default: false
  enableOfflineVerification: boolean; // Default: true
  onlinePaymentGateway?: string;
  maxReceiptSizeMB: number; // Default: 5
  allowedReceiptFormats: string; // Default: "jpg,jpeg,png,pdf"
  autoNotifyOnVerification: boolean; // Default: true
}
```

## Common Use Cases

### Check if Email Notifications are Enabled

```typescript
const settings = await prisma.schoolSettings.findUnique({
  where: { schoolId },
  select: { emailEnabled: true, emailFeeReminders: true }
});

if (settings?.emailEnabled && settings?.emailFeeReminders) {
  // Send email notification
}
```

### Get Security Settings

```typescript
const securitySettings = await prisma.schoolSettings.findUnique({
  where: { schoolId },
  select: {
    twoFactorEnabled: true,
    twoFactorRequired: true,
    sessionTimeout: true,
    passwordMinLength: true,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    passwordExpiry: true,
  }
});
```

### Update Notification Preferences

```typescript
await prisma.schoolSettings.update({
  where: { schoolId },
  data: {
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: false,
    pushEnabled: true,
    quietHoursEnabled: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  }
});
```

### Configure Backup Settings

```typescript
await prisma.schoolSettings.update({
  where: { schoolId },
  data: {
    autoBackupEnabled: true,
    backupFrequency: "DAILY",
    backupRetention: 30,
    includeFiles: true,
    encryptBackups: true,
  }
});
```

### Enable Two-Factor Authentication

```typescript
await prisma.schoolSettings.update({
  where: { schoolId },
  data: {
    twoFactorEnabled: true,
    twoFactorRequired: false, // Optional for users
    twoFactorMethods: ["SMS", "EMAIL", "TOTP"],
  }
});
```

### Update Branding

```typescript
await prisma.schoolSettings.update({
  where: { schoolId },
  data: {
    primaryColor: "#1e40af",
    secondaryColor: "#7c3aed",
    logoUrl: "https://cdn.example.com/logo.png",
    faviconUrl: "https://cdn.example.com/favicon.ico",
  }
});
```

## Helper Functions

### Get Settings with Defaults

```typescript
export async function getSchoolSettings(schoolId: string) {
  const settings = await prisma.schoolSettings.findUnique({
    where: { schoolId }
  });

  if (!settings) {
    // Create default settings if they don't exist
    return await prisma.schoolSettings.create({
      data: { schoolId }
    });
  }

  return settings;
}
```

### Check Feature Enabled

```typescript
export async function isFeatureEnabled(
  schoolId: string,
  feature: keyof SchoolSettings
): Promise<boolean> {
  const settings = await prisma.schoolSettings.findUnique({
    where: { schoolId },
    select: { [feature]: true }
  });

  return settings?.[feature] ?? false;
}

// Usage
const canSendSMS = await isFeatureEnabled(schoolId, 'smsEnabled');
```

### Validate Password Against Policy

```typescript
export async function validatePassword(
  schoolId: string,
  password: string
): Promise<{ valid: boolean; errors: string[] }> {
  const settings = await prisma.schoolSettings.findUnique({
    where: { schoolId },
    select: {
      passwordMinLength: true,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true,
    }
  });

  const errors: string[] = [];

  if (password.length < (settings?.passwordMinLength ?? 8)) {
    errors.push(`Password must be at least ${settings?.passwordMinLength} characters`);
  }

  if (settings?.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (settings?.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (settings?.passwordRequireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (settings?.passwordRequireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Migration from Old Models

If you're updating existing code:

**Old:**
```typescript
const systemSettings = await prisma.systemSettings.findUnique({ where: { schoolId } });
const securitySettings = await prisma.schoolSecuritySettings.findUnique({ where: { schoolId } });
const notificationSettings = await prisma.schoolNotificationSettings.findUnique({ where: { schoolId } });

const emailEnabled = systemSettings?.emailEnabled;
const twoFactorEnabled = securitySettings?.twoFactorEnabled;
const quietHoursStart = notificationSettings?.quietHoursStart;
```

**New:**
```typescript
const settings = await prisma.schoolSettings.findUnique({ where: { schoolId } });

const emailEnabled = settings?.emailEnabled;
const twoFactorEnabled = settings?.twoFactorEnabled;
const quietHoursStart = settings?.quietHoursStart;
```

## Best Practices

1. **Always use `findUnique` with `schoolId`** - It's indexed and unique
2. **Select only needed fields** - Don't fetch all 100+ fields if you only need a few
3. **Cache settings** - They don't change frequently, consider caching
4. **Validate before update** - Ensure values are valid before updating
5. **Use transactions** - When updating multiple related records
6. **Handle missing settings** - Always have fallback defaults

## Performance Tips

```typescript
// ❌ Bad: Fetches all fields
const settings = await prisma.schoolSettings.findUnique({
  where: { schoolId }
});

// ✅ Good: Only fetches needed fields
const settings = await prisma.schoolSettings.findUnique({
  where: { schoolId },
  select: {
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
  }
});
```

## Related Documentation

- [Migration Guide](./SCHOOL_SETTINGS_MIGRATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Security Guide](./SECURITY.md)
