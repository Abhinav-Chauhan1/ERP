# Design Document

## Overview

This design document outlines the implementation strategy for completing the Parent Dashboard in the School ERP system. The Parent Dashboard is currently ~75% complete with critical gaps in meeting management (0% complete), settings functionality (40% complete), and theme consistency issues. This design addresses these gaps and ensures the Parent Dashboard matches the quality, completeness, and visual consistency of the Admin, Teacher, and Student dashboards.

The implementation follows Next.js 14+ App Router patterns with React Server Components, Prisma ORM for database access, and shadcn/ui components for the interface. The design prioritizes server-side rendering, proper loading states, theme-aware styling with an orange/amber color scheme, and accessibility compliance.

## Architecture

### High-Level Architecture

The Parent Dashboard follows a Next.js App Router architecture with:

1. **Layout Layer**: Shared layout with sidebar and header components using parent-specific orange/amber theme
2. **Page Layer**: Individual route pages using server components for data fetching
3. **Component Layer**: Reusable UI components organized by feature (meetings, settings, dashboard, children)
4. **Data Layer**: Prisma ORM for database access with proper type safety and relations
5. **State Management**: React Server Components for data fetching, client components for interactivity
6. **Action Layer**: Next.js server actions for mutations and data operations

### Technology Stack

- **Framework**: Next.js 14+ with App Router
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (orange/amber parent theme)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **File Storage**: Cloudinary (for avatar uploads)
- **Type Safety**: TypeScript throughout
- **Testing**: Vitest with fast-check for property-based testing

### Architectural Patterns

1. **Server-First Rendering**: Use React Server Components by default for better performance
2. **Progressive Enhancement**: Add client-side interactivity only where needed
3. **Suspense Boundaries**: Wrap async components for better loading UX
4. **Modular Components**: Separate concerns into focused, reusable components
5. **Theme-Aware Styling**: Use CSS variables instead of hardcoded colors
6. **Optimistic Updates**: Implement optimistic UI updates for better perceived performance

## Components and Interfaces

### Database Models

#### ParentSettings Model (New)

```prisma
model ParentSettings {
  id                          String   @id @default(cuid())
  parentId                    String   @unique
  parent                      Parent   @relation(fields: [parentId], references: [id], onDelete: Cascade)
  
  // Notification preferences
  emailNotifications          Boolean  @default(true)
  smsNotifications            Boolean  @default(false)
  pushNotifications           Boolean  @default(true)
  feeReminders                Boolean  @default(true)
  attendanceAlerts            Boolean  @default(true)
  examResultNotifications     Boolean  @default(true)
  announcementNotifications   Boolean  @default(true)
  meetingReminders            Boolean  @default(true)
  
  // Communication preferences
  preferredContactMethod      String   @default("EMAIL")
  notificationFrequency       String   @default("IMMEDIATE")
  
  // Privacy settings
  profileVisibility           String   @default("PRIVATE")
  
  // Appearance settings
  theme                       String   @default("LIGHT")
  language                    String   @default("en")
  
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt
  
  @@index([parentId])
}
```


### Page Structure

#### Meeting Management Pages

```
/parent/meetings/
├── page.tsx                    # Redirect to upcoming meetings
├── schedule/
│   └── page.tsx               # Schedule new meeting form
├── upcoming/
│   └── page.tsx               # List of upcoming meetings
└── history/
    └── page.tsx               # Past meetings with notes
```

#### Settings Pages

```
/parent/settings/
└── page.tsx                    # Settings with tabs (profile, notifications, security, appearance)
```

#### Enhanced Dashboard

```
/parent/
└── page.tsx                    # Main dashboard with quick actions, performance summaries, calendar, activity feed
```

### UI Components

#### Meeting Components

**Location**: `src/components/parent/meetings/`

```typescript
// meeting-schedule-form.tsx
interface MeetingScheduleFormProps {
  teachers: Array<{
    id: string;
    user: { firstName: string; lastName: string; };
  }>;
  onSubmit: (data: MeetingData) => Promise<void>;
  onCancel: () => void;
}

// meeting-card.tsx
interface MeetingCardProps {
  meeting: {
    id: string;
    date: Date;
    mode: 'IN_PERSON' | 'ONLINE';
    status: string;
    teacher: { user: { firstName: string; lastName: string; }; };
    purpose: string | null;
  };
  onCancel?: () => Promise<void>;
  onReschedule?: () => void;
  onJoin?: () => void;
}

// teacher-availability-calendar.tsx
interface TeacherAvailabilityCalendarProps {
  teacherId: string;
  availability: Array<{
    date: Date;
    slots: Array<{ time: string; available: boolean; }>;
  }>;
  onSlotSelect: (date: Date, time: string) => void;
  selectedSlot: { date: Date; time: string; } | null;
}

// meeting-detail-modal.tsx
interface MeetingDetailModalProps {
  meeting: {
    id: string;
    date: Date;
    mode: string;
    status: string;
    teacher: { user: { firstName: string; lastName: string; }; };
    purpose: string | null;
    notes: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onReschedule: () => void;
  onCancel: () => Promise<void>;
}
```


#### Settings Components

**Location**: `src/components/parent/settings/`

```typescript
// profile-edit-form.tsx
interface ProfileEditFormProps {
  parent: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      avatar: string | null;
    };
  };
  onSubmit: (data: ProfileData) => Promise<void>;
}

// notification-preferences.tsx
interface NotificationPreferencesProps {
  settings: ParentSettings;
  onSave: (preferences: NotificationPreferences) => Promise<void>;
}

// security-settings.tsx
interface SecuritySettingsProps {
  onPasswordChange: (data: PasswordChangeData) => Promise<void>;
  onTwoFactorToggle: (enabled: boolean) => Promise<void>;
}

// avatar-upload.tsx
interface AvatarUploadProps {
  currentAvatar: string | null;
  onUpload: (file: File) => Promise<string>;
  onRemove: () => Promise<void>;
}
```

#### Dashboard Enhancement Components

**Location**: `src/components/parent/dashboard/`

```typescript
// quick-actions-panel.tsx
interface QuickActionsPanelProps {
  actions: Array<{
    label: string;
    icon: React.ComponentType;
    href: string;
    color: string;
  }>;
}

// performance-summary-cards.tsx
interface PerformanceSummaryCardsProps {
  children: Array<{
    id: string;
    user: { firstName: string; lastName: string; };
    latestExamResult: { score: number; maxScore: number; } | null;
    attendancePercentage: number;
    pendingAssignments: number;
    gradeTrend: 'up' | 'down' | 'stable';
  }>;
}

// calendar-widget.tsx
interface CalendarWidgetProps {
  events: Array<{
    id: string;
    title: string;
    date: Date;
    type: 'event' | 'meeting';
  }>;
  onEventClick: (eventId: string) => void;
}

// recent-activity-feed.tsx
interface RecentActivityFeedProps {
  activities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    childName: string;
  }>;
}
```


### Server Actions

#### Meeting Actions

**Location**: `src/lib/actions/parent-meeting-actions.ts`

```typescript
// Schedule a new meeting
export async function scheduleMeeting(data: {
  teacherId: string;
  date: Date;
  time: string;
  mode: 'IN_PERSON' | 'ONLINE';
  purpose: string;
}): Promise<ActionResult>

// Get upcoming meetings for parent
export async function getUpcomingMeetings(
  parentId: string
): Promise<ActionResult>

// Get meeting history with filters
export async function getMeetingHistory(
  parentId: string,
  filters?: { startDate?: Date; endDate?: Date; teacherId?: string; }
): Promise<ActionResult>

// Cancel a meeting
export async function cancelMeeting(
  meetingId: string
): Promise<ActionResult>

// Reschedule a meeting
export async function rescheduleMeeting(
  meetingId: string,
  newDate: Date,
  newTime: string
): Promise<ActionResult>

// Get teacher availability
export async function getTeacherAvailability(
  teacherId: string,
  startDate: Date,
  endDate: Date
): Promise<ActionResult>
```

#### Settings Actions

**Location**: `src/lib/actions/parent-settings-actions.ts`

```typescript
// Get parent settings
export async function getSettings(
  parentId: string
): Promise<ActionResult>

// Update profile information
export async function updateProfile(data: {
  firstName: string;
  lastName: string;
  phone: string;
}): Promise<ActionResult>

// Update notification preferences
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<ActionResult>

// Change password
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult>

// Upload avatar
export async function uploadAvatar(
  file: File
): Promise<ActionResult>

// Remove avatar
export async function removeAvatar(): Promise<ActionResult>
```


## Data Models

### Meeting Data Flow

```
Parent selects teacher and time slot
    ↓
scheduleMeeting() action called
    ↓
Verify teacher exists and slot is available
    ↓
Create ParentMeeting record
    ↓
Create Notification for teacher
    ↓
Add to both parent and teacher calendars
    ↓
Revalidate meeting pages
    ↓
Return success with meeting data
    ↓
UI updates to show scheduled meeting
```

### Settings Update Flow

```
Parent modifies settings
    ↓
updateNotificationPreferences() or updateProfile() called
    ↓
Validate input data
    ↓
Update ParentSettings or User record
    ↓
Update timestamp
    ↓
Revalidate settings page
    ↓
Return success
    ↓
UI shows success message
```

### Avatar Upload Flow

```
Parent selects image file
    ↓
Client-side validation (type, size)
    ↓
uploadAvatar() action called
    ↓
Server-side validation
    ↓
Upload to Cloudinary
    ↓
Update User.avatar field
    ↓
Revalidate profile pages
    ↓
Return Cloudinary URL
    ↓
UI displays new avatar
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Teacher Availability Accuracy

*For any* teacher and date range, when getTeacherAvailability is called, the returned time slots should only include slots that are not already booked by existing meetings.

**Validates: Requirements 1.2**

### Property 2: Meeting Creation Completeness

*For any* valid meeting data, when scheduleMeeting is called, the system should create a meeting record, create a notification for the teacher, and both records should be retrievable from the database.

**Validates: Requirements 1.3**

### Property 3: Meeting Display Completeness

*For any* set of upcoming meetings, when displayed, each meeting should include teacher name, date, time, mode, and action buttons (join/cancel).

**Validates: Requirements 1.4**

### Property 4: Meeting Cancellation Side Effects

*For any* scheduled meeting, after cancellation, the meeting status should be updated, a notification should be created for the teacher, and the time slot should become available again.

**Validates: Requirements 1.5**

### Property 5: Meeting Reschedule Persistence

*For any* meeting and new date/time, after rescheduling, querying the meeting should return the updated date/time and a notification should exist for the teacher.

**Validates: Requirements 1.6**

### Property 6: Meeting History Completeness

*For any* set of past meetings, when displayed in history, each meeting should include notes and outcomes fields.

**Validates: Requirements 1.8**

### Property 7: Profile Update Validation and Persistence

*For any* profile update, if the data is valid, it should persist to the database; if invalid, it should be rejected with validation errors.

**Validates: Requirements 2.2**

### Property 8: Notification Preferences Persistence

*For any* notification preference changes, after saving, querying the settings should return the updated preferences.

**Validates: Requirements 2.3**


### Property 9: Password Change Validation

*For any* password change attempt, the system should reject changes with incorrect current password, reject weak new passwords, and accept valid changes that meet strength requirements.

**Validates: Requirements 2.6**

### Property 10: Avatar Upload Validation

*For any* file upload, files with invalid types (not image/*) or sizes (> 5MB) should be rejected, and files meeting criteria should be accepted and uploaded.

**Validates: Requirements 2.7**

### Property 11: Settings Persistence Round Trip

*For any* valid settings data, after saving, querying the settings should return the same data that was submitted.

**Validates: Requirements 2.9**

### Property 12: Hardcoded Color Absence

*For any* component file in the parent dashboard, the code should not contain hardcoded color values (e.g., text-gray-500, bg-blue-100) and should instead use theme variables.

**Validates: Requirements 3.4**

### Property 12a: Layout Structure Consistency

*For any* parent dashboard page, the layout structure (sidebar width, header height, main content padding) should match the layout structure of admin, teacher, and student dashboards.

**Validates: Requirements 3.2**

### Property 12b: Component Pattern Consistency

*For any* UI component type (card, button, badge, table) in the parent dashboard, the component structure and CSS classes should match the corresponding component patterns in admin, teacher, and student dashboards.

**Validates: Requirements 3.3, 3.5**

### Property 13: Performance Summary Completeness

*For any* child, when performance summary is rendered, the output should contain latest exam results, attendance percentage, pending assignments count, and grade trend indicator.

**Validates: Requirements 4.2**

### Property 14: Calendar Widget Event Display

*For any* set of future events and meetings, when the calendar widget renders, all events should appear on their respective dates.

**Validates: Requirements 4.3**

### Property 15: Activity Feed Chronological Order

*For any* set of activities, when displayed in the activity feed, activities should be ordered by timestamp in descending order (most recent first).

**Validates: Requirements 4.4**

### Property 16: Multi-Child Data Aggregation

*For any* parent with multiple children, when dashboard data is aggregated, the totals and averages should accurately reflect all children's data combined.

**Validates: Requirements 4.7**

### Property 17: Child Profile Information Completeness

*For any* child profile view, the displayed information should include current grades, attendance records, assignments, and behavior records.

**Validates: Requirements 5.1**

### Property 18: Attendance History Display

*For any* child's attendance records, when displayed, the view should include calendar visualization and statistical summaries (percentage, total days, absences).

**Validates: Requirements 5.2**

### Property 19: Child Comparison Accuracy

*For any* set of children belonging to a parent, when comparison view is rendered, performance metrics should be displayed side-by-side with accurate values for each child.

**Validates: Requirements 5.3**

### Property 20: Document Filtering Accuracy

*For any* child and document collection, when filtering documents by child, the results should only include documents where the document's studentId matches the selected child's id.

**Validates: Requirements 5.5**

### Property 21: Performance Visualization Data Accuracy

*For any* child's performance data, when charts are generated, the data points in the chart should match the actual performance records from the database.

**Validates: Requirements 5.6**

### Property 22: Default Settings Creation

*For any* newly created parent account, a ParentSettings record should be automatically created with default values for all preference fields.

**Validates: Requirements 6.2**

### Property 23: Settings Update Timestamp

*For any* settings update, after saving, the updatedAt timestamp should be more recent than the previous updatedAt value.

**Validates: Requirements 6.3**

### Property 24: Settings Query Completeness

*For any* parent settings query, the returned object should include all preference fields (email notifications, SMS notifications, push notifications, fee reminders, attendance alerts, exam result notifications, announcement notifications, meeting reminders, preferred contact method, notification frequency, profile visibility, theme, language).

**Validates: Requirements 6.4**

### Property 25: Settings Cascade Deletion

*For any* parent account with associated settings, after deleting the parent account, querying for the ParentSettings record should return null (settings should be deleted).

**Validates: Requirements 6.5**


### Property 26: Meeting Schedule Success

*For any* valid meeting data (valid teacher ID, future date, available time slot), when scheduleMeeting is called, the operation should succeed and return the created meeting record.

**Validates: Requirements 7.2**

### Property 27: Teacher Availability Exclusion

*For any* teacher and date range, when getTeacherAvailability is called, the returned slots should exclude all time slots that have existing meetings with status 'SCHEDULED' or 'CONFIRMED'.

**Validates: Requirements 7.3**

### Property 28: Notification Preferences Validation

*For any* notification preferences update, invalid preference values should be rejected with validation errors, and valid values should be accepted and persisted.

**Validates: Requirements 7.5**

### Property 29: Password Change Security

*For any* password change attempt, the system should verify the current password matches the stored hash before allowing the change, and should reject attempts with incorrect current passwords.

**Validates: Requirements 7.6**

### Property 30: Server Action Error Messages

*For any* server action that encounters an error (database error, validation error, authentication error), the returned error message should be descriptive and user-friendly (not technical stack traces).

**Validates: Requirements 7.7**

### Property 31: ARIA Label Presence

*For any* interactive element (button, link, input) in the parent dashboard, the rendered HTML should include an aria-label, aria-labelledby, or associated label element.

**Validates: Requirements 8.3**

### Property 32: Color Contrast Compliance

*For any* text and background color combination used in the parent dashboard, the contrast ratio should meet WCAG AA requirements (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 8.4**

### Property 33: Image Alt Text Presence

*For any* image element in the parent dashboard, the img tag should include an alt attribute with descriptive text.

**Validates: Requirements 8.6**

### Property 34: Image Optimization

*For any* image rendered in the parent dashboard, the image should use Next.js Image component with lazy loading enabled or have loading="lazy" attribute.

**Validates: Requirements 9.6**

### Property 35: Error Message User-Friendliness

*For any* server operation failure, the error message displayed to the user should not contain technical details (stack traces, database errors, internal paths) and should provide actionable guidance.

**Validates: Requirements 10.2**

### Property 36: Required Field Validation

*For any* form with required fields, when submitted with empty required fields, the submission should be prevented and validation errors should be displayed for each missing field.

**Validates: Requirements 10.4**

### Property 37: File Upload Error Specificity

*For any* file upload failure, the error message should specifically indicate whether the issue is file type, file size, or other validation failure.

**Validates: Requirements 10.5**

### Property 38: Form State Preservation

*For any* form submission that results in validation errors, all user-entered values should be preserved in the form fields to allow correction without re-entering data.

**Validates: Requirements 10.6**


## Error Handling

### Client-Side Error Handling

1. **Form Validation Errors**
   - Display inline error messages next to invalid fields
   - Highlight invalid fields with red borders and error icons
   - Prevent form submission until all errors are resolved
   - Preserve user input during validation
   - Show field-specific error messages (e.g., "Email is required", "Password must be at least 8 characters")

2. **File Upload Errors**
   - Validate file type and size before upload
   - Display clear error messages for invalid files
   - Show upload progress with cancel option
   - Handle network errors with retry mechanism
   - Provide specific feedback (e.g., "File size exceeds 5MB limit", "Only image files are allowed")

3. **Network Errors**
   - Display toast notifications for API failures
   - Implement retry logic with exponential backoff
   - Show loading states during operations
   - Provide fallback UI for failed data fetches
   - Cache data locally when possible

4. **Authentication Errors**
   - Redirect to login for unauthenticated requests
   - Show clear messages for expired sessions
   - Preserve intended destination after login
   - Handle token refresh failures gracefully

### Server-Side Error Handling

1. **Database Errors**
   - Log errors with context for debugging
   - Return user-friendly error messages
   - Handle unique constraint violations gracefully
   - Implement transaction rollback for data integrity
   - Monitor error rates and patterns

2. **Validation Errors**
   - Use Zod schemas for type-safe validation
   - Return specific validation error messages
   - Validate all inputs on server even if validated on client
   - Sanitize user input to prevent XSS
   - Check business logic constraints

3. **Authorization Errors**
   - Verify user role and permissions
   - Return 403 for unauthorized access attempts
   - Log unauthorized access attempts
   - Validate parent-child relationships
   - Check resource ownership

4. **File Storage Errors**
   - Handle Cloudinary upload failures
   - Implement cleanup for partial uploads
   - Validate file integrity after upload
   - Provide fallback for storage service outages
   - Set appropriate file size limits

### Error Logging

- Use structured logging with context (user ID, action, timestamp, error details)
- Log to console in development
- Send to monitoring service in production (e.g., Sentry)
- Track error rates and patterns
- Set up alerts for critical errors
- Include request ID for tracing


## Testing Strategy

### Unit Testing

Unit tests will verify specific functionality of individual components and functions:

1. **Component Tests**
   - Meeting card rendering with various props
   - Settings form validation logic
   - Calendar widget date calculations
   - Activity feed sorting and filtering
   - Quick actions panel navigation

2. **Utility Function Tests**
   - Date formatting and parsing
   - Data aggregation for multiple children
   - Availability calculation logic
   - Validation functions
   - Theme color contrast calculations

3. **Server Action Tests**
   - Request validation
   - Response formatting
   - Error handling
   - Authentication checks
   - Database operations

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** (JavaScript/TypeScript property testing library).

Each property test will:
- Run a minimum of 100 iterations with random inputs
- Be tagged with the format: `**Feature: parent-dashboard-production, Property {number}: {property_text}**`
- Reference the specific correctness property from the design document
- Use smart generators that constrain inputs to valid ranges

**Testing Framework**: Vitest with fast-check integration

**Example Property Test Structure**:

```typescript
import { test, expect } from 'vitest';
import * as fc from 'fast-check';

test('Property 1: Teacher Availability Accuracy', () => {
  /**
   * Feature: parent-dashboard-production, Property 1: Teacher Availability Accuracy
   * Validates: Requirements 1.2
   */
  fc.assert(
    fc.property(
      teacherArbitrary(),
      dateRangeArbitrary(),
      meetingsArbitrary(),
      async (teacher, dateRange, existingMeetings) => {
        const availability = await getTeacherAvailability(
          teacher.id,
          dateRange.start,
          dateRange.end
        );
        
        // Verify no returned slots overlap with existing meetings
        const bookedSlots = existingMeetings.map(m => ({
          date: m.date,
          time: m.time
        }));
        
        availability.data.forEach(slot => {
          const isBooked = bookedSlots.some(
            booked => 
              booked.date.getTime() === slot.date.getTime() &&
              booked.time === slot.time
          );
          expect(isBooked).toBe(false);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Meeting Management Flow**
   - Schedule meeting → View in upcoming → Cancel → Verify removed
   - Schedule meeting → Reschedule → Verify updated
   - View teacher availability → Select slot → Schedule → Verify booked

2. **Settings Management Flow**
   - Update profile → Save → Verify persisted
   - Change notification preferences → Save → Verify applied
   - Upload avatar → Verify displayed → Remove → Verify removed
   - Change password → Verify old password invalid → Verify new password works

3. **Dashboard Flow**
   - Load dashboard → Verify all sections render
   - Click quick action → Verify navigation
   - Select child → Verify data updates
   - View calendar event → Verify details displayed

4. **Children Management Flow**
   - View child profile → Verify complete information
   - Compare children → Verify side-by-side metrics
   - Filter documents by child → Verify correct filtering
   - View performance charts → Verify data accuracy

### Accessibility Testing

1. **Automated Testing**
   - Run axe-core on all pages
   - Verify ARIA attributes present
   - Check color contrast ratios (WCAG AA)
   - Validate keyboard navigation
   - Test with automated accessibility scanners

2. **Manual Testing**
   - Screen reader testing (NVDA/JAWS/VoiceOver)
   - Keyboard-only navigation
   - Focus management verification
   - Mobile accessibility testing
   - Touch target size verification (minimum 44x44px)

### Visual Regression Testing

1. **Theme Consistency**
   - Verify no hardcoded colors remain
   - Test orange/amber theme application
   - Check light and dark mode rendering
   - Validate responsive layouts
   - Compare with Admin/Teacher/Student dashboards

2. **Component Consistency**
   - Verify card styling matches design system
   - Check button variants consistency
   - Validate typography hierarchy
   - Test icon sizing and colors
   - Verify spacing and padding


## Theme Design Specification

### Parent Dashboard Theme: Orange (Family-Friendly)

The parent dashboard uses the **exact same theme system and component structure** as Admin, Teacher, and Student dashboards. It applies the existing `theme-orange` class from globals.css to provide a warm, family-friendly color scheme that maintains visual consistency across the entire ERP system.

**Key Principle**: 
- Use identical sidebar, navbar, card components, button variants, and layout structure as other dashboards
- Apply existing `theme-orange` class to parent layout
- NO custom CSS needed - use existing theme system
- NO hardcoded colors - all components use CSS variables (--primary, --muted-foreground, --card, --background, etc.)
- Match the exact component patterns from admin, teacher, and student dashboards
- Ensure visual consistency across all four dashboard types (admin, teacher, student, parent)

#### Theme Application

The parent dashboard uses the existing `theme-orange` class already defined in `src/app/globals.css`:

```css
/* From globals.css - Already exists, no changes needed */
.theme-orange {
  --primary: 24.6 95% 53.1%;        /* Orange primary color */
  --primary-foreground: 60 9.1% 97.8%;
  --ring: 24.6 95% 53.1%;
}

.dark.theme-orange {
  --primary: 20.5 90.2% 48.2%;      /* Orange primary color (dark mode) */
  --primary-foreground: 60 9.1% 97.8%;
  --ring: 20.5 90.2% 48.2%;
}
```

**Dashboard Theme Comparison:**
- **Admin Dashboard**: Uses default theme (blue/slate)
- **Teacher Dashboard**: Uses theme-green class (green primary)
- **Student Dashboard**: Uses theme-blue class (blue primary)
- **Parent Dashboard**: Uses theme-orange class (orange primary)

All dashboards share the same:
- Layout structure (sidebar + header + main content)
- Component patterns (cards, buttons, badges, tables)
- Typography scale and spacing system
- Shadow and border radius system
- Responsive breakpoints and mobile behavior

#### Component Consistency

**Use Existing Components and Patterns:**
- ParentSidebar matches AdminSidebar/TeacherSidebar/StudentSidebar structure exactly
- ParentHeader matches AdminHeader/TeacherHeader/StudentHeader structure exactly
- All cards, buttons, forms, and UI elements use the same shadcn/ui components
- All components use CSS variables (--primary, --muted-foreground, --card, etc.)
- NO hardcoded colors anywhere (no text-gray-500, no bg-blue-100, etc.)

#### Reference Dashboard Implementations

**To ensure consistency, reference these existing implementations:**

1. **Admin Dashboard**:
   - Layout: `src/app/admin/layout.tsx`
   - Sidebar: `src/components/layout/admin-sidebar.tsx`
   - Header: `src/components/layout/admin-header.tsx`
   - Pages: `src/app/admin/page.tsx` and subdirectories

2. **Teacher Dashboard**:
   - Layout: `src/app/teacher/layout.tsx`
   - Sidebar: `src/components/layout/teacher-sidebar.tsx`
   - Header: `src/components/layout/teacher-header.tsx`
   - Pages: `src/app/teacher/page.tsx` and subdirectories

3. **Student Dashboard**:
   - Layout: `src/app/student/layout.tsx`
   - Sidebar: `src/components/layout/student-sidebar.tsx`
   - Header: `src/components/layout/student-header.tsx`
   - Pages: `src/app/student/page.tsx` and subdirectories

**Key Patterns to Match:**
- Sidebar width: `w-72`
- Header height: `h-16`
- Main content height: `h-[calc(100%-4rem)]`
- Page padding: `p-4 md:p-6`
- Card hover effect: `hover:shadow-md transition-shadow`
- Active menu item: `text-primary bg-primary/10 border-r-4 border-primary`
- Hover menu item: `hover:text-primary hover:bg-accent`
- Button minimum height: `min-h-[44px]` (accessibility)
- Icon size in buttons: `h-4 w-4` or `h-5 w-5`

#### Component Styling Patterns

**IMPORTANT**: These patterns are identical to Admin/Teacher/Student dashboards. The theme variables automatically apply the orange/amber colors.

**Sidebar Pattern** (Same as other dashboards):
```typescript
<div className="h-full border-r flex flex-col bg-card">
  <Link className={cn(
    "flex items-center py-3 px-6 transition-colors",
    isActive 
      ? "text-primary bg-primary/10 border-r-4 border-primary" 
      : "text-muted-foreground hover:text-primary hover:bg-accent"
  )}>
    <Icon className="h-5 w-5" />
    <span>Menu Item</span>
  </Link>
</div>
```

**Card Pattern** (Same as other dashboards):
```typescript
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      Card Title
    </CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">Content</p>
  </CardContent>
</Card>
```

**Button Pattern** (Same as other dashboards):
```typescript
<Button>Primary Action</Button>
<Button variant="outline">Secondary Action</Button>
<Button variant="ghost">Tertiary Action</Button>
<Button variant="destructive">Delete Action</Button>
```

**Typography Pattern** (Same as other dashboards):
```typescript
<h1 className="text-2xl font-bold tracking-tight">Welcome back, {name}!</h1>
<p className="text-muted-foreground">Monitor your children's progress</p>
<h2 className="text-xl font-semibold">Section Title</h2>
<h3 className="text-lg font-medium">Subsection Title</h3>
```

**Layout Structure** (Same as other dashboards):
```typescript
// src/app/parent/layout.tsx
<div className="theme-orange h-full relative">
  <nav className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50">
    <ParentSidebar />
  </nav>
  <div className="md:pl-72 h-full">
    <ParentHeader />
    <main className="h-[calc(100%-4rem)] overflow-y-auto bg-background p-4 md:p-6">
      {children}
    </main>
  </div>
</div>
```

**Note**: The `theme-orange` class applies the orange color scheme. All other styling uses CSS variables that automatically adapt to the theme.

#### Accessibility Compliance

All color combinations meet WCAG AA contrast requirements:
- Primary Orange (#FF6B35) on White: 3.2:1 (Large text only)
- Dark Text (#2D1B00) on White: 15.2:1 (Excellent)
- Muted Text (#8B7355) on White: 4.8:1 (Good)

Use dark text for body content, orange for accents and interactive elements only.


## Performance Considerations

### Data Fetching Optimization

1. **Server Components**
   - Use React Server Components for data fetching by default
   - Implement parallel data fetching where possible
   - Use Suspense boundaries to prevent waterfalls
   - Cache data with appropriate revalidation periods

2. **Database Queries**
   - Use Prisma select to fetch only needed fields
   - Implement pagination for large lists (meetings, activities)
   - Add database indexes for common queries
   - Use connection pooling
   - Optimize joins and relations

3. **Caching Strategy**
   - Cache dashboard data for 5 minutes
   - Cache settings for 10 minutes
   - Cache child data for 5 minutes
   - Invalidate cache on mutations
   - Use Next.js revalidation

### Bundle Size Optimization

1. **Code Splitting**
   - Lazy load calendar component
   - Lazy load chart components
   - Split by route automatically
   - Use dynamic imports for heavy components

2. **Dependency Optimization**
   - Use tree-shaking for unused code
   - Replace heavy libraries with lighter alternatives
   - Implement virtual scrolling for long lists
   - Optimize icon imports (use only needed icons)

### Image Optimization

1. **Next.js Image Component**
   - Use Next.js Image for all images
   - Implement lazy loading
   - Use appropriate sizes and formats
   - Optimize thumbnails and avatars

2. **Cloudinary Optimization**
   - Use Cloudinary transformations for resizing
   - Serve WebP format when supported
   - Implement responsive images
   - Use CDN for fast delivery

## Security Considerations

### Authentication and Authorization

1. **Route Protection**
   - Verify Clerk authentication on all parent routes
   - Check user role matches PARENT
   - Validate parent record exists
   - Implement middleware for route protection

2. **Data Access Control**
   - Parents can only access their own data
   - Parents can only view their own children's data
   - Verify parent-child relationships before data access
   - Implement row-level security checks

### Input Validation

1. **Client-Side Validation**
   - Validate form inputs before submission
   - Sanitize user input
   - Validate file types and sizes
   - Implement rate limiting on forms

2. **Server-Side Validation**
   - Re-validate all inputs on server
   - Use Zod schemas for type safety
   - Sanitize database queries
   - Validate file contents
   - Check business logic constraints

### File Upload Security

1. **File Validation**
   - Whitelist allowed file types (images only for avatars)
   - Verify file signatures (magic numbers)
   - Limit file sizes (5MB for avatars)
   - Scan for malicious content if applicable

2. **Storage Security**
   - Use signed URLs for file access
   - Implement access control on storage
   - Set appropriate CORS policies
   - Use HTTPS for all file transfers
   - Store files in secure Cloudinary folders

### Password Security

1. **Password Requirements**
   - Minimum 8 characters
   - Require mix of uppercase, lowercase, numbers
   - Check against common password lists
   - Implement password strength meter

2. **Password Storage**
   - Use Clerk's secure password hashing
   - Never store passwords in plain text
   - Implement secure password reset flow
   - Log password change attempts


## Implementation Notes

### Database Migration Strategy

1. **Add ParentSettings Model**
   ```bash
   # Create migration
   npx prisma migrate dev --name add_parent_settings
   
   # Update Prisma client
   npx prisma generate
   ```

2. **Create Default Settings for Existing Parents**
   ```typescript
   // Migration script to create default settings
   const parents = await db.parent.findMany();
   for (const parent of parents) {
     await db.parentSettings.create({
       data: {
         parentId: parent.id,
         // Default values will be applied from schema
       },
     });
   }
   ```

3. **Add Indexes**
   ```sql
   CREATE INDEX idx_parent_settings_parent ON "ParentSettings"("parentId");
   CREATE INDEX idx_parent_meeting_parent ON "ParentMeeting"("parentId");
   CREATE INDEX idx_parent_meeting_teacher ON "ParentMeeting"("teacherId");
   CREATE INDEX idx_parent_meeting_date ON "ParentMeeting"("date");
   ```

### Theme Migration Strategy

1. **Apply Existing Theme Class**
   ```typescript
   // src/app/parent/layout.tsx
   // Simply add theme-orange class to root div
   <div className="theme-orange h-full relative">
     {/* Layout content */}
   </div>
   ```

2. **Remove Hardcoded Colors**
   - Search for hardcoded colors: `text-gray-*`, `bg-blue-*`, `text-red-*`, etc.
   - Replace with CSS variables:
     - `text-gray-500` → `text-muted-foreground`
     - `bg-white` → `bg-card`
     - `text-blue-600` → `text-primary`
     - `bg-gray-100` → `bg-muted`
   - Update ParentSidebar to remove any hardcoded colors
   - Update ParentHeader to remove any hardcoded colors
   - Update all parent components to use CSS variables

3. **Verify Theme Consistency**
   - Test light mode with theme-orange
   - Test dark mode with theme-orange
   - Verify all components use CSS variables
   - Check that no hardcoded colors remain
   - Compare visually with Admin/Teacher/Student dashboards

### Component Development Order

1. **Phase 1: Database and Actions (Week 1)**
   - Add ParentSettings model
   - Create parent-meeting-actions.ts
   - Create parent-settings-actions.ts
   - Write unit tests for actions

2. **Phase 2: Meeting Management (Week 2)**
   - Create meeting page structure
   - Build MeetingScheduleForm component
   - Build TeacherAvailabilityCalendar component
   - Build MeetingCard component
   - Build MeetingDetailModal component
   - Integrate with actions
   - Test meeting flow

3. **Phase 3: Settings Page (Week 3)**
   - Create settings page structure
   - Build ProfileEditForm component
   - Build NotificationPreferences component
   - Build SecuritySettings component
   - Build AvatarUpload component
   - Integrate with actions
   - Test settings flow

4. **Phase 4: Theme Consistency (Week 4)**
   - Create parent theme CSS
   - Update ParentSidebar
   - Update ParentHeader
   - Update all existing components
   - Test theme across all pages
   - Verify accessibility

5. **Phase 5: Dashboard Enhancements (Week 5)**
   - Build QuickActionsPanel component
   - Build PerformanceSummaryCards component
   - Build CalendarWidget component
   - Build RecentActivityFeed component
   - Update dashboard page
   - Test dashboard sections

6. **Phase 6: Children Management (Week 6)**
   - Enhance child profile pages
   - Build comparison view
   - Improve child selector
   - Add performance visualizations
   - Test children features

7. **Phase 7: Testing and Polish (Week 7-8)**
   - Write property-based tests
   - Write integration tests
   - Perform accessibility audit
   - Performance optimization
   - Bug fixes
   - Documentation


## Deployment Considerations

### Environment Variables

```bash
# .env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
NEXT_PUBLIC_APP_URL="https://..."
```

### Build Configuration

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    serverActions: true,
  },
};
```

### Pre-Deployment Checklist

1. **Database**
   - [ ] Run migrations on staging
   - [ ] Verify ParentSettings model exists
   - [ ] Create default settings for existing parents
   - [ ] Verify indexes are created
   - [ ] Test database performance

2. **Environment**
   - [ ] Set all environment variables
   - [ ] Configure Cloudinary
   - [ ] Test file uploads
   - [ ] Verify Clerk configuration
   - [ ] Test authentication flow

3. **Testing**
   - [ ] Run all unit tests
   - [ ] Run all property-based tests
   - [ ] Run integration tests
   - [ ] Perform accessibility audit
   - [ ] Test on multiple browsers
   - [ ] Test on mobile devices

4. **Performance**
   - [ ] Run Lighthouse audit
   - [ ] Verify page load times < 3s
   - [ ] Check bundle size
   - [ ] Test with slow network
   - [ ] Verify caching works

5. **Security**
   - [ ] Verify authentication works
   - [ ] Test authorization checks
   - [ ] Verify input validation
   - [ ] Test file upload security
   - [ ] Check for XSS vulnerabilities

### Monitoring and Observability

1. **Metrics to Track**
   - Meeting scheduling success/failure rates
   - Settings update success rates
   - Avatar upload success rates
   - Page load times
   - Error rates by feature
   - User engagement metrics

2. **Logging**
   - Log all meeting operations
   - Log settings changes
   - Log authentication failures
   - Log file uploads
   - Log database errors
   - Log API response times

3. **Alerts**
   - Alert on high error rates
   - Alert on slow database queries
   - Alert on file upload failures
   - Alert on authentication issues
   - Alert on performance degradation

## Success Metrics

### Completion Criteria

- [ ] All critical features implemented (100%)
- [ ] Meeting management fully functional
- [ ] Settings page complete with all sections
- [ ] Theme consistency achieved across all pages
- [ ] Dashboard enhancements complete
- [ ] Children management enhanced
- [ ] All tests passing (unit, property-based, integration)
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Accessibility standards met (WCAG AA)

### Performance Targets

- Page load time: < 3 seconds
- Time to interactive: < 5 seconds
- First contentful paint: < 1.5 seconds
- Largest contentful paint: < 2.5 seconds
- Cumulative layout shift: < 0.1

### Quality Targets

- Test coverage: > 80%
- Bug density: < 1 bug per 1000 lines
- Code review approval: 100%
- Accessibility score: > 95
- Lighthouse score: > 90

### User Experience Targets

- Task completion rate: > 95%
- Error rate: < 1%
- User satisfaction score: > 4.5/5
- Support ticket reduction: > 30%

