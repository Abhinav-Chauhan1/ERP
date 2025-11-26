# Implementation Plan

This implementation plan converts the Parent Dashboard completion design into a series of discrete, actionable coding tasks. Each task builds incrementally on previous tasks, with all code integrated and no orphaned components. The plan focuses exclusively on tasks that involve writing, modifying, or testing code.

## Task List

- [x] 1. Database Schema and Migrations




- [x] 1.1 Add ParentSettings model to Prisma schema


  - Add ParentSettings model with all notification, communication, privacy, and appearance fields
  - Add relation to Parent model with cascade delete
  - Add index on parentId field
  - _Requirements: 6.1, 6.2, 6.5_


- [x] 1.2 Create and run database migration

  - Generate Prisma migration for ParentSettings model
  - Run migration on development database
  - Verify model exists and relations work
  - Update Prisma client
  - _Requirements: 6.1_


- [x] 1.3 Create seed script for default parent settings

  - Write script to create default ParentSettings for existing parents
  - Test script on development database
  - Verify all existing parents have settings records
  - _Requirements: 6.2_

- [ ]* 1.4 Write property test for default settings creation
  - **Property 22: Default Settings Creation**
  - **Validates: Requirements 6.2**
-

- [x] 2. Server Actions - Meeting Management





- [x] 2.1 Create parent-meeting-actions.ts file



  - Implement scheduleMeeting action with validation
  - Implement getUpcomingMeetings action
  - Implement getMeetingHistory action with filters
  - Implement cancelMeeting action
  - Implement rescheduleMeeting action
  - Implement getTeacherAvailability action
  - Add proper error handling and logging
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 2.2 Write property test for teacher availability accuracy
  - **Property 1: Teacher Availability Accuracy**
  - **Validates: Requirements 1.2**

- [ ]* 2.3 Write property test for meeting creation completeness
  - **Property 2: Meeting Creation Completeness**
  - **Validates: Requirements 1.3**

- [ ]* 2.4 Write property test for meeting cancellation side effects
  - **Property 4: Meeting Cancellation Side Effects**
  - **Validates: Requirements 1.5**

- [ ]* 2.5 Write property test for meeting reschedule persistence
  - **Property 5: Meeting Reschedule Persistence**
  - **Validates: Requirements 1.6**

- [x] 3. Server Actions - Settings Management




- [x] 3.1 Create parent-settings-actions.ts file


  - Implement getSettings action
  - Implement updateProfile action with validation
  - Implement updateNotificationPreferences action
  - Implement changePassword action with security checks
  - Implement uploadAvatar action with Cloudinary integration
  - Implement removeAvatar action
  - Add proper error handling and logging
  - _Requirements: 7.4, 7.5, 7.6_

- [ ]* 3.2 Write property test for profile update validation
  - **Property 7: Profile Update Validation and Persistence**
  - **Validates: Requirements 2.2**

- [ ]* 3.3 Write property test for notification preferences persistence
  - **Property 8: Notification Preferences Persistence**
  - **Validates: Requirements 2.3**

- [ ]* 3.4 Write property test for password change validation
  - **Property 9: Password Change Validation**
  - **Validates: Requirements 2.6**

- [ ]* 3.5 Write property test for avatar upload validation
  - **Property 10: Avatar Upload Validation**
  - **Validates: Requirements 2.7**
-

- [x] 4. Theme Consistency Implementation



- [x] 4.1 Apply theme-orange class to parent layout


  - Update src/app/parent/layout.tsx to add theme-orange class to root div
  - Ensure layout structure matches admin/teacher/student dashboards exactly (sidebar width: w-72, header height: h-16, main content: h-[calc(100%-4rem)])
  - Verify sidebar, header, and main content areas use same structure as other dashboards
  - Test theme application in light and dark modes
  - _Requirements: 3.1, 3.2_

- [x] 4.2 Update ParentSidebar to match other dashboard sidebars


  - Review AdminSidebar, TeacherSidebar, and StudentSidebar for structure reference
  - Replace all hardcoded colors with CSS variables (text-muted-foreground, text-primary, bg-accent, bg-primary/10, etc.)
  - Ensure sidebar uses same component structure: logo section, navigation items, collapsible sections, user section
  - Apply consistent active state styling: text-primary bg-primary/10 border-r-4 border-primary
  - Apply consistent hover state styling: hover:text-primary hover:bg-accent
  - Ensure minimum touch target sizes (min-h-[44px])
  - Test active states and hover effects
  - _Requirements: 3.4, 3.6, 3.10_

- [x] 4.3 Update ParentHeader to match other dashboard headers


  - Review AdminHeader, TeacherHeader, and StudentHeader for structure reference
  - Replace all hardcoded colors with CSS variables
  - Ensure header uses same height (h-16) and structure as other dashboards
  - Apply consistent border and background: border-b bg-card
  - Ensure mobile menu button, page title, search, and actions use same patterns
  - Test responsive behavior on mobile, tablet, and desktop
  - _Requirements: 3.4, 3.10_

- [x] 4.4 Audit and update all parent dashboard page layouts


  - Review all pages in src/app/parent/ directory
  - Ensure all pages use consistent padding (p-4 md:p-6)
  - Ensure all pages use consistent gap spacing (gap-4 or gap-6)
  - Ensure page headers follow pattern: text-2xl font-bold tracking-tight for h1, text-muted-foreground for description
  - Replace any hardcoded colors with CSS variables
  - _Requirements: 3.4, 3.7_

- [x] 4.5 Audit and update all parent components


  - Audit all components in src/components/parent/ directory
  - Replace hardcoded colors with CSS variables (text-gray-500 → text-muted-foreground, bg-white → bg-card, text-blue-600 → text-primary, etc.)
  - Update card components to use consistent styling matching other dashboards
  - Update button components to use standard shadcn/ui variants (default, outline, ghost, destructive)
  - Ensure all interactive elements have minimum touch targets (min-h-[44px])
  - Test all components with theme-orange class applied
  - _Requirements: 3.3, 3.4, 3.5, 3.8, 3.9_

- [ ]* 4.6 Write property test for hardcoded color absence
  - **Property 12: Hardcoded Color Absence**
  - **Validates: Requirements 3.4**

- [ ]* 4.7 Write property test for layout structure consistency
  - **Property 12a: Layout Structure Consistency**
  - **Validates: Requirements 3.2**

- [ ]* 4.8 Write property test for component pattern consistency
  - **Property 12b: Component Pattern Consistency**
  - **Validates: Requirements 3.3, 3.5**

- [x] 5. Meeting Management UI Components




- [x] 5.1 Create MeetingScheduleForm component


  - Build form with teacher selector, date picker, time picker, mode selector, purpose input
  - Implement form validation
  - Integrate with scheduleMeeting action
  - Add loading states and error handling
  - _Requirements: 1.2, 1.3_

- [x] 5.2 Create TeacherAvailabilityCalendar component


  - Build calendar view showing available time slots
  - Integrate with getTeacherAvailability action
  - Implement slot selection
  - Show booked slots as unavailable
  - _Requirements: 1.2_

- [x] 5.3 Create MeetingCard component


  - Display meeting information (teacher, date, time, mode, status)
  - Add action buttons (join, cancel, reschedule)
  - Implement responsive design
  - _Requirements: 1.4_

- [ ]* 5.4 Write property test for meeting display completeness
  - **Property 3: Meeting Display Completeness**
  - **Validates: Requirements 1.4**

- [x] 5.5 Create MeetingDetailModal component


  - Display full meeting details
  - Show meeting notes and outcomes
  - Add reschedule and cancel options
  - Implement modal open/close logic
  - _Requirements: 1.8_

- [ ]* 5.6 Write property test for meeting history completeness
  - **Property 6: Meeting History Completeness**
  - **Validates: Requirements 1.8**

- [x] 6. Meeting Management Pages




- [x] 6.1 Create meetings page structure


  - Create /parent/meetings/page.tsx (redirect to upcoming)
  - Create /parent/meetings/schedule/page.tsx
  - Create /parent/meetings/upcoming/page.tsx
  - Create /parent/meetings/history/page.tsx
  - Add proper loading states with Suspense
  - _Requirements: 1.1_

- [x] 6.2 Implement schedule meeting page


  - Integrate MeetingScheduleForm component
  - Integrate TeacherAvailabilityCalendar component
  - Handle form submission and navigation
  - Add success/error feedback
  - _Requirements: 1.2, 1.3_

- [x] 6.3 Implement upcoming meetings page


  - Fetch and display upcoming meetings
  - Integrate MeetingCard components
  - Add filtering and sorting options
  - Implement cancel and reschedule actions
  - _Requirements: 1.4, 1.5, 1.6_

- [x] 6.4 Implement meeting history page


  - Fetch and display past meetings
  - Show meeting notes and outcomes
  - Add date range filtering
  - Implement pagination
  - _Requirements: 1.8_

- [x] 6.5 Update ParentSidebar with meetings navigation


  - Add "Meetings" menu item with icon
  - Add submenu for Schedule, Upcoming, History
  - Test navigation and active states
  - _Requirements: 1.1_
-

- [ ] 7. Settings UI Components

- [x] 7.1 Create ProfileEditForm component


  - Build form with firstName, lastName, phone fields
  - Implement form validation
  - Integrate with updateProfile action
  - Add loading states and error handling
  - _Requirements: 2.2_

- [x] 7.2 Create NotificationPreferences component


  - Build toggles for all notification types
  - Add contact method selector
  - Add notification frequency selector
  - Integrate with updateNotificationPreferences action
  - _Requirements: 2.3_

- [ ]* 7.3 Write property test for settings persistence round trip
  - **Property 11: Settings Persistence Round Trip**
  - **Validates: Requirements 2.9**

- [x] 7.4 Create SecuritySettings component


  - Build password change form
  - Implement current password verification
  - Add password strength indicator
  - Integrate with changePassword action
  - _Requirements: 2.6_

- [x] 7.5 Create AvatarUpload component



  - Build file input with drag-and-drop
  - Implement image preview
  - Add file validation (type, size)
  - Integrate with uploadAvatar action
  - Add remove avatar functionality
  - _Requirements: 2.7_
-

- [ ] 8. Settings Page Implementation

- [x] 8.1 Create settings page with tabs

  - Create /parent/settings/page.tsx
  - Implement tabbed interface (Profile, Notifications, Security, Appearance)
  - Integrate all settings components
  - Add proper loading states
  - _Requirements: 2.1_

- [x] 8.2 Implement profile tab

  - Integrate ProfileEditForm component
  - Integrate AvatarUpload component
  - Handle form submission
  - Add success/error feedback
  - _Requirements: 2.2, 2.7_

- [x] 8.3 Implement notifications tab

  - Integrate NotificationPreferences component
  - Handle preference updates
  - Add success/error feedback
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 8.4 Implement security tab

  - Integrate SecuritySettings component
  - Handle password changes
  - Add two-factor authentication toggle (if applicable)
  - Add success/error feedback
  - _Requirements: 2.6_

- [x] 8.5 Implement appearance tab


  - Add theme selector (light/dark)
  - Add language selector
  - Handle preference updates
  - _Requirements: 2.8_

- [x] 9. Dashboard Enhancement Components







- [x] 9.1 Create QuickActionsPanel component


  - Build grid of action cards (Pay Fees, Send Message, Schedule Meeting, View Reports)
  - Add icons and colors for each action
  - Implement navigation on click
  - Make responsive
  - _Requirements: 4.1_

- [x] 9.2 Create PerformanceSummaryCards component


  - Fetch and display latest exam results for each child
  - Show attendance percentage
  - Show pending assignments count
  - Show grade trend indicators
  - Support multiple children
  - _Requirements: 4.2_

- [ ]* 9.3 Write property test for performance summary completeness
  - **Property 13: Performance Summary Completeness**
  - **Validates: Requirements 4.2**

- [x] 9.4 Create CalendarWidget component


  - Build mini calendar view
  - Fetch and display upcoming events and meetings
  - Add event markers on dates
  - Implement click to view details
  - Add month navigation
  - _Requirements: 4.3_

- [ ]* 9.5 Write property test for calendar widget event display
  - **Property 14: Calendar Widget Event Display**
  - **Validates: Requirements 4.3**

- [x] 9.6 Create RecentActivityFeed component


  - Fetch recent activities (assignments, exams, announcements, etc.)
  - Display in timeline format with icons
  - Show timestamps
  - Make items clickable
  - Implement load more functionality
  - _Requirements: 4.4_

- [ ]* 9.7 Write property test for activity feed chronological order
  - **Property 15: Activity Feed Chronological Order**
  - **Validates: Requirements 4.4**

- [x]  
- [x] 10.1 Update dashboard page structure

  - Refactor /parent/page.tsx to include new sections
  - Add QuickActionsPanel section
  - Add PerformanceSummaryCards section
  - Add CalendarWidget section
  - Add RecentActivityFeed section
  - Implement proper grid layout
  - Add Suspense boundaries for each section
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 10.2 Create dashboard skeleton loaders


  - Create skeleton for QuickActionsPanel
  - Create skeleton for PerformanceSummaryCards
  - Create skeleton for CalendarWidget
  - Create skeleton for RecentActivityFeed
  - _Requirements: 9.1_

- [ ]* 10.3 Write property test for multi-child data aggregation
  - **Property 16: Multi-Child Data Aggregation**
  - **Validates: Requirements 4.7**
- [x] 11. Children Management Enhancements




- [ ] 11. Children Management Enhancements

- [x] 11.1 Enhance child profile pages


  - Update /parent/children/[id]/page.tsx
  - Add comprehensive academic information section
  - Add current grades display
  - Add attendance records section
  - Add assignments section
  - Add behavior records section
  - _Requirements: 5.1_

- [ ]* 11.2 Write property test for child profile information completeness
  - **Property 17: Child Profile Information Completeness**
  - **Validates: Requirements 5.1**

- [x] 11.3 Create detailed attendance view


  - Build calendar visualization for attendance
  - Add attendance statistics (percentage, total days, absences)
  - Add filtering by date range
  - _Requirements: 5.2_

- [ ]* 11.4 Write property test for attendance history display
  - **Property 18: Attendance History Display**
  - **Validates: Requirements 5.2**

- [x] 11.5 Create child comparison view


  - Build comparison page at /parent/children/compare
  - Display performance metrics side-by-side
  - Add charts for visual comparison
  - Support selecting which children to compare
  - _Requirements: 5.3_

- [ ]* 11.6 Write property test for child comparison accuracy
  - **Property 19: Child Comparison Accuracy**
  - **Validates: Requirements 5.3**

- [x] 11.7 Implement child-specific document filtering


  - Update document pages to filter by selected child
  - Add child selector to document pages
  - Verify filtering logic
  - _Requirements: 5.5_

- [ ]* 11.8 Write property test for document filtering accuracy
  - **Property 20: Document Filtering Accuracy**
  - **Validates: Requirements 5.5**

- [x] 11.9 Create performance visualization components


  - Build chart components for academic trends
  - Add grade trend charts
  - Add attendance trend charts
  - Add assignment completion charts
  - Integrate with child profile pages
  - _Requirements: 5.6_

- [ ]* 11.10 Write property test for performance visualization data accuracy
  - **Property 21: Performance Visualization Data Accuracy**
  - **Validates: Requirements 5.6**

- [x] 12. Accessibility Implementation





- [x] 12.1 Add ARIA labels to all interactive elements


  - Audit all parent dashboard components
  - Add aria-label or aria-labelledby to buttons, links, inputs
  - Add aria-expanded for expandable sections
  - Add aria-controls for related elements
  - Test with screen reader
  - _Requirements: 8.3_

- [ ]* 12.2 Write property test for ARIA label presence
  - **Property 31: ARIA Label Presence**
  - **Validates: Requirements 8.3**

- [x] 12.3 Verify color contrast compliance


  - Test all text/background combinations
  - Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
  - Fix any contrast issues
  - _Requirements: 8.4_

- [ ]* 12.4 Write property test for color contrast compliance
  - **Property 32: Color Contrast Compliance**
  - **Validates: Requirements 8.4**

- [x] 12.5 Add alt text to all images


  - Audit all image elements
  - Add descriptive alt text
  - Test with screen reader
  - _Requirements: 8.6_

- [ ]* 12.6 Write property test for image alt text presence
  - **Property 33: Image Alt Text Presence**
  - **Validates: Requirements 8.6**

- [x] 13. Performance Optimization




- [x] 13.1 Implement image optimization


  - Use Next.js Image component for all images
  - Add lazy loading to images
  - Optimize avatar images
  - Test image loading performance
  - _Requirements: 9.6_

- [ ]* 13.2 Write property test for image optimization
  - **Property 34: Image Optimization**
  - **Validates: Requirements 9.6**

- [x] 13.3 Add caching to server actions


  - Implement caching for dashboard data (5 minutes)
  - Implement caching for settings data (10 minutes)
  - Implement caching for child data (5 minutes)
  - Add cache invalidation on mutations
  - _Requirements: 9.5_

- [x] 13.4 Implement pagination for large lists


  - Add pagination to meeting history
  - Add pagination to activity feed
  - Add pagination to document lists
  - Test with large datasets
  - _Requirements: 9.5_

- [-] 14. Error Handling and Validation


- [x] 14.1 Implement comprehensive form validation


  - Add validation to all forms
  - Display inline error messages
  - Prevent submission with invalid data
  - Preserve user input on errors
  - _Requirements: 10.1, 10.4, 10.6_

- [ ]* 14.2 Write property test for required field validation
  - **Property 36: Required Field Validation**
  - **Validates: Requirements 10.4**

- [ ]* 14.3 Write property test for form state preservation
  - **Property 38: Form State Preservation**
  - **Validates: Requirements 10.6**

- [x] 14.4 Improve error messages



  - Ensure all error messages are user-friendly
  - Remove technical details from user-facing errors
  - Add specific error messages for file uploads
  - Test error scenarios
  - _Requirements: 10.2, 10.5_

- [ ]* 14.5 Write property test for error message user-friendliness
  - **Property 35: Error Message User-Friendliness**
  - **Validates: Requirements 10.2**

- [ ]* 14.6 Write property test for file upload error specificity
  - **Property 37: File Upload Error Specificity**
  - **Validates: Requirements 10.5**

- [ ] 15. Additional Property Tests
- [ ]* 15.1 Write property test for settings update timestamp
  - **Property 23: Settings Update Timestamp**
  - **Validates: Requirements 6.3**

- [ ]* 15.2 Write property test for settings query completeness
  - **Property 24: Settings Query Completeness**
  - **Validates: Requirements 6.4**

- [ ]* 15.3 Write property test for settings cascade deletion
  - **Property 25: Settings Cascade Deletion**
  - **Validates: Requirements 6.5**

- [ ]* 15.4 Write property test for meeting schedule success
  - **Property 26: Meeting Schedule Success**
  - **Validates: Requirements 7.2**

- [ ]* 15.5 Write property test for teacher availability exclusion
  - **Property 27: Teacher Availability Exclusion**
  - **Validates: Requirements 7.3**

- [ ]* 15.6 Write property test for notification preferences validation
  - **Property 28: Notification Preferences Validation**
  - **Validates: Requirements 7.5**

- [ ]* 15.7 Write property test for password change security
  - **Property 29: Password Change Security**
  - **Validates: Requirements 7.6**

- [ ]* 15.8 Write property test for server action error messages
  - **Property 30: Server Action Error Messages**
  - **Validates: Requirements 7.7**

- [ ] 16. Final Testing and Polish
- [ ] 16.1 Run all tests and fix failures
  - Run all unit tests
  - Run all property-based tests
  - Fix any failing tests
  - Ensure test coverage > 80%
  - _Requirements: All_

- [ ] 16.2 Perform accessibility audit
  - Run axe-core on all pages
  - Test with screen reader (NVDA/JAWS/VoiceOver)
  - Test keyboard navigation
  - Fix any accessibility issues
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 16.3 Performance testing
  - Run Lighthouse audit on all pages
  - Verify page load times < 3 seconds
  - Check bundle size
  - Optimize if needed
  - _Requirements: 9.5_

- [ ] 16.4 Cross-browser testing
  - Test on Chrome, Firefox, Safari, Edge
  - Test on mobile devices (iOS, Android)
  - Fix any browser-specific issues
  - _Requirements: 8.1_

- [ ] 16.5 Visual regression testing
  - Compare parent dashboard with other dashboards
  - Verify theme consistency
  - Check responsive layouts
  - Fix any visual inconsistencies
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

