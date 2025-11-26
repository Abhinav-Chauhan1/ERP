# Student Dashboard Completion - Implementation Tasks

## Phase 1: UI Updates (Week 1)

### Task 1.1: Update Student Sidebar Component
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Sidebar matches admin sidebar design exactly
- [ ] School logo displayed at top with "Student Portal" subtitle
- [ ] Collapsible menu sections with smooth animations
- [ ] Active state highlighting works correctly
- [ ] Icons match admin sidebar icons
- [ ] UserButton at bottom with "Student Account" label
- [ ] Responsive behavior on mobile (drawer)
- [ ] Keyboard navigation works
- [ ] ARIA labels present

**Implementation Steps:**
1. Open `src/components/layout/student-sidebar.tsx`
2. Update structure to match `admin-sidebar.tsx`
3. Replace SchoolLogo component usage
4. Update menu items with proper icons
5. Implement collapsible sections with state management
6. Add smooth transitions and animations
7. Test on mobile, tablet, and desktop
8. Verify accessibility with screen reader

**Files to Modify:**
- `src/components/layout/student-sidebar.tsx`

**Testing:**
- Visual comparison with admin sidebar
- Test all menu items and navigation
- Test expand/collapse functionality
- Test mobile drawer behavior
- Accessibility audit with axe DevTools

---

### Task 1.2: Update Student Header Component
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Header matches admin header design exactly
- [ ] Mobile hamburger menu button present
- [ ] Page title displays on desktop
- [ ] Global search bar visible on tablet and up
- [ ] Theme toggle button present
- [ ] Color theme toggle button present
- [ ] Notification center with badge
- [ ] UserButton for account management
- [ ] Responsive layout works on all screen sizes

**Implementation Steps:**
1. Open `src/components/layout/student-header.tsx`
2. Update structure to match `admin-header.tsx`
3. Add GlobalSearch component
4. Add ThemeToggle component
5. Add ColorThemeToggle component
6. Add NotificationCenter component
7. Implement page title logic based on pathname
8. Test responsive behavior
9. Verify all buttons work correctly

**Files to Modify:**
- `src/components/layout/student-header.tsx`

**Testing:**
- Visual comparison with admin header
- Test mobile menu
- Test all toggle buttons
- Test notification center
- Test on different screen sizes

---

### Task 1.3: Verify Layout Integration
**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** Task 1.1, Task 1.2

**Acceptance Criteria:**
- [ ] Sidebar and header work together correctly
- [ ] No layout shifts or overlaps
- [ ] Consistent spacing and padding
- [ ] Theme switching works across all components
- [ ] Mobile drawer opens/closes smoothly

**Implementation Steps:**
1. Test student layout on all pages
2. Verify sidebar and header integration
3. Check for any layout issues
4. Test theme switching
5. Test mobile responsiveness

**Files to Verify:**
- `src/app/student/layout.tsx`
- All student pages

**Testing:**
- Navigate through all student pages
- Test theme switching
- Test mobile drawer
- Check for console errors

---

## Phase 2: Course Backend (Week 2, Days 1-2)

### Task 2.1: Create Student Course Actions File
**Priority:** Critical  
**Estimated Time:** 6 hours  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] File created with all required functions
- [ ] Authentication verification in all functions
- [ ] Proper error handling
- [ ] Input validation with Zod
- [ ] Database queries optimized
- [ ] Revalidation paths configured
- [ ] TypeScript types defined
- [ ] JSDoc comments added

**Implementation Steps:**
1. Create `src/lib/actions/student-course-actions.ts`
2. Implement `getCurrentStudent()` helper
3. Implement `getCourseById()` function
4. Implement `enrollInCourse()` function
5. Implement `unenrollFromCourse()` function
6. Implement `getModulesByCourse()` function
7. Implement `getLessonById()` function
8. Implement `markLessonComplete()` function
9. Implement `updateLessonProgress()` function
10. Implement `getCourseProgress()` function
11. Implement `getNextLesson()` function
12. Implement `getPreviousLesson()` function
13. Add Zod validation schemas
14. Add error handling
15. Add revalidatePath calls

**Files to Create:**
- `src/lib/actions/student-course-actions.ts`

**Testing:**
- Test each function with valid inputs
- Test error cases
- Test authentication verification
- Test enrollment verification
- Test progress calculations

---

### Task 2.2: Add Database Indexes
**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Indexes added for course queries
- [ ] Indexes added for enrollment queries
- [ ] Indexes added for lesson progress queries
- [ ] Migration created and tested
- [ ] Query performance improved

**Implementation Steps:**
1. Create new Prisma migration
2. Add index on CourseEnrollment.studentId
3. Add index on CourseEnrollment.courseId
4. Add index on LessonProgress.enrollmentId
5. Add index on LessonProgress.lessonId
6. Run migration
7. Test query performance

**Files to Create:**
- New Prisma migration file

**Testing:**
- Run migration on development database
- Test query performance before/after
- Verify indexes created correctly

---

## Phase 3: Course Components (Week 2, Days 3-5)

### Task 3.1: Create CourseDetail Component
**Priority:** Critical  
**Estimated Time:** 6 hours  
**Dependencies:** Task 2.1

**Acceptance Criteria:**
- [ ] Component displays all course information
- [ ] Enrollment status shown correctly
- [ ] Progress bar displays if enrolled
- [ ] Enroll/Unenroll button works
- [ ] Module list is expandable
- [ ] Lesson links work correctly
- [ ] Responsive design
- [ ] Loading states implemented
- [ ] Error states handled

**Implementation Steps:**
1. Create `src/components/student/course-detail.tsx`
2. Define TypeScript interfaces
3. Create course header section
4. Create course info section
5. Create progress section (conditional)
6. Create enrollment button section
7. Create modules list section
8. Implement expand/collapse for modules
9. Add loading skeleton
10. Add error boundary
11. Style with Tailwind CSS
12. Test responsive behavior

**Files to Create:**
- `src/components/student/course-detail.tsx`

**Testing:**
- Test with enrolled course
- Test with non-enrolled course
- Test enrollment action
- Test unenrollment action
- Test module expansion
- Test on mobile/tablet/desktop

---

### Task 3.2: Create LessonViewer Component
**Priority:** Critical  
**Estimated Time:** 8 hours  
**Dependencies:** Task 2.1

**Acceptance Criteria:**
- [ ] Displays VIDEO content with player
- [ ] Displays TEXT content with formatting
- [ ] Displays PDF content with viewer
- [ ] Progress tracking works
- [ ] Mark complete button works
- [ ] Previous/Next navigation works
- [ ] Responsive design
- [ ] Loading states implemented
- [ ] Error states handled

**Implementation Steps:**
1. Create `src/components/student/lesson-viewer.tsx`
2. Define TypeScript interfaces
3. Create lesson header section
4. Implement VIDEO content handler
5. Implement TEXT content handler
6. Implement PDF content handler
7. Create progress indicator
8. Create mark complete button
9. Create navigation buttons
10. Add loading skeleton
11. Add error boundary
12. Style with Tailwind CSS
13. Test all content types

**Files to Create:**
- `src/components/student/lesson-viewer.tsx`

**Testing:**
- Test VIDEO lesson
- Test TEXT lesson
- Test PDF lesson
- Test progress updates
- Test mark complete
- Test navigation
- Test on mobile/tablet/desktop

---

### Task 3.3: Create CourseProgressTracker Component
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Displays progress percentage
- [ ] Shows completed/total lessons
- [ ] Visual progress bar
- [ ] Optional detailed view
- [ ] Responsive design

**Implementation Steps:**
1. Create `src/components/student/course-progress-tracker.tsx`
2. Define TypeScript interfaces
3. Create progress bar
4. Add percentage display
5. Add lesson count display
6. Add optional details section
7. Style with Tailwind CSS
8. Test with different progress values

**Files to Create:**
- `src/components/student/course-progress-tracker.tsx`

**Testing:**
- Test with 0% progress
- Test with 50% progress
- Test with 100% progress
- Test responsive behavior

---

### Task 3.4: Create CourseModuleList Component
**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Displays all modules in order
- [ ] Shows lesson count per module
- [ ] Expandable/collapsible modules
- [ ] Highlights current lesson
- [ ] Shows completion status
- [ ] Responsive design

**Implementation Steps:**
1. Create `src/components/student/course-module-list.tsx`
2. Define TypeScript interfaces
3. Create module list structure
4. Implement expand/collapse logic
5. Add lesson list per module
6. Add completion indicators
7. Add current lesson highlighting
8. Style with Tailwind CSS
9. Test navigation

**Files to Create:**
- `src/components/student/course-module-list.tsx`

**Testing:**
- Test module expansion
- Test lesson navigation
- Test completion indicators
- Test responsive behavior

---

## Phase 4: Course Pages (Week 2, Day 5 - Week 3, Day 1)

### Task 4.1: Create Course Detail Page
**Priority:** Critical  
**Estimated Time:** 4 hours  
**Dependencies:** Task 2.1, Task 3.1

**Acceptance Criteria:**
- [ ] Page fetches course data correctly
- [ ] Authentication verified
- [ ] Enrollment status checked
- [ ] CourseDetail component rendered
- [ ] Enrollment actions work
- [ ] Error handling implemented
- [ ] Loading state shown
- [ ] SEO metadata added

**Implementation Steps:**
1. Create `src/app/student/courses/[courseId]/page.tsx`
2. Implement authentication check
3. Fetch course data with enrollment
4. Handle not found case
5. Handle unauthorized case
6. Render CourseDetail component
7. Implement enrollment handlers
8. Add loading state
9. Add error boundary
10. Add metadata
11. Test all scenarios

**Files to Create:**
- `src/app/student/courses/[courseId]/page.tsx`

**Testing:**
- Test with valid course ID
- Test with invalid course ID
- Test enrollment flow
- Test unenrollment flow
- Test as unauthenticated user

---

### Task 4.2: Create Lesson Viewer Page
**Priority:** Critical  
**Estimated Time:** 5 hours  
**Dependencies:** Task 2.1, Task 3.2

**Acceptance Criteria:**
- [ ] Page fetches lesson data correctly
- [ ] Enrollment verification works
- [ ] Lesson progress fetched
- [ ] Navigation data fetched
- [ ] LessonViewer component rendered
- [ ] Progress updates work
- [ ] Mark complete works
- [ ] Navigation works
- [ ] Error handling implemented
- [ ] Loading state shown

**Implementation Steps:**
1. Create `src/app/student/courses/[courseId]/lessons/[lessonId]/page.tsx`
2. Implement authentication check
3. Verify enrollment in course
4. Fetch lesson data
5. Fetch lesson progress
6. Fetch previous/next lesson
7. Handle not found case
8. Handle unauthorized case
9. Render LessonViewer component
10. Implement progress handlers
11. Implement navigation handlers
12. Add loading state
13. Add error boundary
14. Add metadata
15. Test all scenarios

**Files to Create:**
- `src/app/student/courses/[courseId]/lessons/[lessonId]/page.tsx`

**Testing:**
- Test with valid lesson ID
- Test with invalid lesson ID
- Test enrollment verification
- Test progress updates
- Test mark complete
- Test navigation
- Test as unauthenticated user

---

## Phase 5: Message Composition (Week 3, Days 2-3)

### Task 5.1: Extend Message Actions
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] sendMessage() function implemented
- [ ] replyToMessage() function implemented
- [ ] deleteMessage() function implemented
- [ ] uploadMessageAttachment() function implemented
- [ ] Input validation with Zod
- [ ] XSS protection for content
- [ ] File validation
- [ ] Rate limiting implemented
- [ ] Error handling

**Implementation Steps:**
1. Open `src/lib/actions/student-communication-actions.ts`
2. Implement sendMessage() function
3. Implement replyToMessage() function
4. Implement deleteMessage() function
5. Implement uploadMessageAttachment() function
6. Add Zod validation schemas
7. Add content sanitization
8. Add file validation
9. Add rate limiting
10. Add error handling
11. Add revalidatePath calls
12. Test all functions

**Files to Modify:**
- `src/lib/actions/student-communication-actions.ts`

**Testing:**
- Test sending message
- Test replying to message
- Test deleting message
- Test file upload
- Test validation errors
- Test rate limiting

---

### Task 5.2: Create MessageCompose Component
**Priority:** High  
**Estimated Time:** 5 hours  
**Dependencies:** Task 5.1

**Acceptance Criteria:**
- [ ] Modal/dialog for composition
- [ ] Recipient selector (teachers/admins)
- [ ] Subject input field
- [ ] Rich text editor for content
- [ ] File attachment uploader
- [ ] Send button with loading state
- [ ] Cancel button
- [ ] Form validation
- [ ] Error handling
- [ ] Success feedback

**Implementation Steps:**
1. Create `src/components/student/communication/message-compose.tsx`
2. Define TypeScript interfaces
3. Create dialog/modal wrapper
4. Create recipient selector
5. Create subject input
6. Integrate rich text editor
7. Create file uploader
8. Implement form validation
9. Implement send handler
10. Add loading states
11. Add error handling
12. Add success toast
13. Style with Tailwind CSS
14. Test all scenarios

**Files to Create:**
- `src/components/student/communication/message-compose.tsx`

**Testing:**
- Test recipient selection
- Test form validation
- Test file upload
- Test sending message
- Test error cases
- Test cancel action

---

### Task 5.3: Create MessageReplyForm Component
**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Task 5.1

**Acceptance Criteria:**
- [ ] Reply form displays correctly
- [ ] Original message context shown
- [ ] Recipient pre-filled
- [ ] Subject pre-filled with "Re:"
- [ ] Content editor
- [ ] Send button with loading state
- [ ] Cancel button
- [ ] Form validation
- [ ] Error handling

**Implementation Steps:**
1. Create `src/components/student/communication/message-reply-form.tsx`
2. Define TypeScript interfaces
3. Create form structure
4. Display original message context
5. Pre-fill recipient and subject
6. Add content editor
7. Implement form validation
8. Implement reply handler
9. Add loading states
10. Add error handling
11. Style with Tailwind CSS
12. Test reply flow

**Files to Create:**
- `src/components/student/communication/message-reply-form.tsx`

**Testing:**
- Test reply form display
- Test pre-filled fields
- Test sending reply
- Test error cases
- Test cancel action

---

### Task 5.4: Integrate Message Composition
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 5.2, Task 5.3

**Acceptance Criteria:**
- [ ] Compose button added to messages page
- [ ] Reply button added to message detail
- [ ] Components integrated correctly
- [ ] Message list refreshes after send
- [ ] Success feedback shown
- [ ] Error handling works

**Implementation Steps:**
1. Open `src/app/student/communication/messages/page.tsx`
2. Add compose button to header
3. Integrate MessageCompose component
4. Add reply button to MessageDetail
5. Integrate MessageReplyForm component
6. Implement refresh logic
7. Test integration
8. Verify all flows work

**Files to Modify:**
- `src/app/student/communication/messages/page.tsx`
- `src/components/student/communication/message-detail.tsx`

**Testing:**
- Test compose flow
- Test reply flow
- Test message list refresh
- Test error handling

---

## Phase 6: Testing & Polish (Week 3, Days 4-5)

### Task 6.1: Write Unit Tests
**Priority:** High  
**Estimated Time:** 6 hours  
**Dependencies:** All previous tasks

**Acceptance Criteria:**
- [ ] Tests for all course actions
- [ ] Tests for all message actions
- [ ] Tests for key components
- [ ] Test coverage > 80%
- [ ] All tests passing

**Implementation Steps:**
1. Create test files for course actions
2. Create test files for message actions
3. Create test files for components
4. Write test cases for happy paths
5. Write test cases for error paths
6. Write test cases for edge cases
7. Run tests and fix failures
8. Check test coverage
9. Add missing tests

**Files to Create:**
- `src/lib/actions/__tests__/student-course-actions.test.ts`
- `src/lib/actions/__tests__/student-communication-actions.test.ts`
- `src/components/student/__tests__/course-detail.test.tsx`
- `src/components/student/__tests__/lesson-viewer.test.tsx`
- `src/components/student/communication/__tests__/message-compose.test.tsx`

**Testing:**
- Run all tests: `npm test`
- Check coverage: `npm run test:coverage`
- Fix failing tests
- Achieve >80% coverage

---

### Task 6.2: Accessibility Audit
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** All previous tasks

**Acceptance Criteria:**
- [ ] Lighthouse accessibility score > 95
- [ ] axe DevTools shows no violations
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets >= 44px

**Implementation Steps:**
1. Run Lighthouse audit on all pages
2. Run axe DevTools on all pages
3. Test keyboard navigation
4. Test with screen reader
5. Check color contrast
6. Check touch target sizes
7. Fix all violations
8. Re-run audits
9. Document results

**Testing:**
- Lighthouse audit
- axe DevTools scan
- Keyboard navigation test
- Screen reader test (NVDA/JAWS)
- Color contrast checker
- Touch target measurement

---

### Task 6.3: Performance Optimization
**Priority:** Medium  
**Estimated Time:** 4 hours  
**Dependencies:** All previous tasks

**Acceptance Criteria:**
- [ ] Lighthouse performance score > 90
- [ ] Page load time < 2 seconds
- [ ] Time to interactive < 3 seconds
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Caching configured

**Implementation Steps:**
1. Run Lighthouse performance audit
2. Optimize images with Next.js Image
3. Implement lazy loading
4. Add code splitting
5. Configure caching
6. Optimize database queries
7. Add loading skeletons
8. Re-run audit
9. Document improvements

**Testing:**
- Lighthouse performance audit
- Network throttling test
- Database query analysis
- Bundle size analysis

---

### Task 6.4: Bug Fixes & Polish
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** All previous tasks

**Acceptance Criteria:**
- [ ] All known bugs fixed
- [ ] UI polish completed
- [ ] Error messages improved
- [ ] Loading states consistent
- [ ] Animations smooth
- [ ] No console errors

**Implementation Steps:**
1. Review bug list
2. Fix critical bugs
3. Fix medium priority bugs
4. Polish UI details
5. Improve error messages
6. Standardize loading states
7. Smooth animations
8. Remove console logs
9. Test all fixes

**Testing:**
- Manual testing of all features
- Cross-browser testing
- Mobile device testing
- Console error check

---

### Task 6.5: Documentation
**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** All previous tasks

**Acceptance Criteria:**
- [ ] Code comments added
- [ ] README updated
- [ ] API documentation created
- [ ] User guide created
- [ ] Deployment guide updated

**Implementation Steps:**
1. Add JSDoc comments to functions
2. Update README with new features
3. Document API endpoints
4. Create user guide
5. Update deployment guide
6. Review all documentation
7. Fix any gaps

**Files to Create/Update:**
- README.md
- docs/API.md
- docs/USER_GUIDE.md
- docs/DEPLOYMENT.md

---

## Summary

**Total Estimated Time:** 80 hours (~2 weeks with one developer)

**Critical Path:**
1. UI Updates (Tasks 1.1, 1.2)
2. Course Backend (Task 2.1)
3. Course Components (Tasks 3.1, 3.2)
4. Course Pages (Tasks 4.1, 4.2)
5. Message Composition (Tasks 5.1, 5.2, 5.4)
6. Testing & Polish (Tasks 6.1, 6.2, 6.4)

**Parallel Work Opportunities:**
- Tasks 1.1 and 1.2 can be done in parallel
- Tasks 3.3 and 3.4 can be done in parallel with 3.1 and 3.2
- Task 2.2 can be done in parallel with Task 2.1
- Tasks 5.2 and 5.3 can be done in parallel
- Testing tasks can start as soon as features are complete

**Risk Mitigation:**
- Start with critical path tasks
- Test each task before moving to next
- Keep stakeholders updated on progress
- Have buffer time for unexpected issues


---

## Phase 7: Theme Implementation (Integrated with all phases)

### Task 7.1: Apply Theme to Dashboard Page
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 1.1, Task 1.2

**Acceptance Criteria:**
- [ ] Dashboard matches admin dashboard theme
- [ ] Stats cards use gradient backgrounds
- [ ] Proper spacing and grid layout
- [ ] Hover effects on cards
- [ ] Responsive design works
- [ ] Icons and colors consistent

**Implementation Steps:**
1. Open `src/app/student/page.tsx`
2. Apply theme classes from theme-design.md
3. Update stats cards with proper styling
4. Add gradient backgrounds
5. Implement hover effects
6. Test responsive behavior
7. Verify color consistency

**Files to Modify:**
- `src/app/student/page.tsx`
- `src/components/student/dashboard-stats.tsx`
- `src/components/student/attendance-overview.tsx`
- `src/components/student/upcoming-assessments.tsx`

**Testing:**
- Visual comparison with admin dashboard
- Test on mobile, tablet, desktop
- Verify light/dark mode
- Check hover effects

---

### Task 7.2: Apply Theme to Course Pages
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** Task 4.1, Task 4.2

**Acceptance Criteria:**
- [ ] Course list page matches theme
- [ ] Course cards have proper styling
- [ ] Course detail page matches theme
- [ ] Lesson viewer matches theme
- [ ] Progress bars styled correctly
- [ ] Module navigation styled correctly

**Implementation Steps:**
1. Apply theme to course list page
2. Style course cards with thumbnails
3. Add hover effects and shadows
4. Apply theme to course detail page
5. Style lesson viewer components
6. Add proper spacing and layout
7. Test responsive behavior

**Files to Modify:**
- `src/app/student/courses/page.tsx`
- `src/app/student/courses/[courseId]/page.tsx`
- `src/app/student/courses/[courseId]/lessons/[lessonId]/page.tsx`
- `src/components/student/course-detail.tsx`
- `src/components/student/lesson-viewer.tsx`

**Testing:**
- Visual comparison with theme spec
- Test all course card states
- Test lesson viewer with different content types
- Verify responsive design

---

### Task 7.3: Apply Theme to Academics Pages
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Academics overview matches theme
- [ ] Navigation cards styled correctly
- [ ] Schedule page matches theme
- [ ] Subjects page matches theme
- [ ] Consistent spacing and colors

**Implementation Steps:**
1. Apply theme to academics overview
2. Style navigation cards
3. Apply theme to schedule page
4. Apply theme to subjects page
5. Apply theme to curriculum page
6. Apply theme to materials page
7. Test responsive behavior

**Files to Modify:**
- `src/app/student/academics/page.tsx`
- `src/app/student/academics/schedule/page.tsx`
- `src/app/student/academics/subjects/page.tsx`
- `src/app/student/academics/curriculum/page.tsx`
- `src/app/student/academics/materials/page.tsx`

---

### Task 7.4: Apply Theme to Assessments Pages
**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Assessments overview matches theme
- [ ] Stats cards styled correctly
- [ ] Exams page matches theme
- [ ] Assignments page with tabs matches theme
- [ ] Results page matches theme
- [ ] Report cards page matches theme

**Implementation Steps:**
1. Apply theme to assessments overview
2. Style stats cards with icons
3. Apply theme to exams page
4. Style assignments page with tabs
5. Apply theme to results page
6. Apply theme to report cards page
7. Test all badge variants
8. Test responsive behavior

**Files to Modify:**
- `src/app/student/assessments/page.tsx`
- `src/app/student/assessments/exams/page.tsx`
- `src/app/student/assessments/assignments/page.tsx`
- `src/app/student/assessments/results/page.tsx`
- `src/app/student/assessments/report-cards/page.tsx`

---

### Task 7.5: Apply Theme to Performance Pages
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Performance overview matches theme
- [ ] Summary cards with gradients
- [ ] Subject performance table styled
- [ ] Charts styled correctly
- [ ] Trend indicators styled

**Implementation Steps:**
1. Apply theme to performance overview
2. Add gradient backgrounds to summary cards
3. Style subject performance table
4. Style performance charts
5. Add trend indicators with icons
6. Test responsive behavior

**Files to Modify:**
- `src/app/student/performance/overview/page.tsx`
- `src/app/student/performance/subjects/page.tsx`
- `src/app/student/performance/trends/page.tsx`
- `src/app/student/performance/rank/page.tsx`
- `src/components/student/performance-chart.tsx`
- `src/components/student/subject-performance-table.tsx`

---

### Task 7.6: Apply Theme to Attendance Pages
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Attendance report matches theme
- [ ] Summary card with gradient
- [ ] Stats cards styled correctly
- [ ] Calendar styled with proper colors
- [ ] Legend styled correctly
- [ ] Leave application page matches theme

**Implementation Steps:**
1. Apply theme to attendance report
2. Add gradient to summary card
3. Style stats cards with icons
4. Style attendance calendar
5. Add proper day state colors
6. Style calendar legend
7. Apply theme to leave application page
8. Test responsive behavior

**Files to Modify:**
- `src/app/student/attendance/report/page.tsx`
- `src/app/student/attendance/leave/page.tsx`
- `src/components/student/attendance-calendar.tsx`
- `src/components/student/attendance-stats-cards.tsx`

---

### Task 7.7: Apply Theme to Fees Pages
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Acceptance Criteria:**
- [x] Fee details page matches theme
- [x] Summary card with gradient
- [x] Fee breakdown table styled
- [x] Payment status badges styled
- [x] Alert for overdue styled correctly
- [x] Payment history page matches theme

**Implementation Steps:**
1. Apply theme to fee details page
2. Add gradient to summary card
3. Style fee breakdown table
4. Style payment status badges
5. Add overdue alert styling
6. Apply theme to payment history
7. Apply theme to due payments
8. Apply theme to scholarships page
9. Test responsive behavior

**Files to Modify:**
- `src/app/student/fees/details/page.tsx`
- `src/app/student/fees/payments/page.tsx`
- `src/app/student/fees/due/page.tsx`
- `src/app/student/fees/scholarships/page.tsx`
- `src/components/student/fee-details-table.tsx`
- `src/components/student/payment-dialog.tsx`

---

### Task 7.8: Apply Theme to Communication Pages
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 5.4

**Acceptance Criteria:**
- [ ] Messages page matches theme
- [ ] Message list styled correctly
- [ ] Unread messages highlighted
- [ ] Message detail styled correctly
- [ ] Announcements page matches theme
- [ ] Notifications page matches theme

**Implementation Steps:**
1. Apply theme to messages page
2. Style message list items
3. Add unread message highlighting
4. Style message detail view
5. Apply theme to announcements page
6. Apply theme to notifications page
7. Style notification groups
8. Test responsive behavior

**Files to Modify:**
- `src/app/student/communication/messages/page.tsx`
- `src/app/student/communication/announcements/page.tsx`
- `src/app/student/communication/notifications/page.tsx`
- `src/components/student/communication/message-list.tsx`
- `src/components/student/communication/message-detail.tsx`
- `src/components/student/communication/announcement-list.tsx`
- `src/components/student/communication/notification-list.tsx`

---

### Task 7.9: Apply Theme to Profile & Settings Pages
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Profile page matches theme
- [ ] Profile header with gradient
- [ ] Info cards styled correctly
- [ ] Settings page matches theme
- [ ] Settings tabs styled correctly
- [ ] Form inputs styled correctly

**Implementation Steps:**
1. Apply theme to profile page
2. Add gradient to profile header
3. Style profile info cards
4. Apply theme to settings page
5. Style settings tabs
6. Style form inputs and switches
7. Test responsive behavior

**Files to Modify:**
- `src/app/student/profile/page.tsx`
- `src/app/student/settings/page.tsx`
- `src/components/student/student-profile-info.tsx`
- `src/components/student/student-profile-edit.tsx`
- `src/components/student/settings/account-settings.tsx`
- `src/components/student/settings/notification-settings.tsx`
- `src/components/student/settings/privacy-settings.tsx`
- `src/components/student/settings/appearance-settings.tsx`

---

### Task 7.10: Apply Theme to Documents & Events Pages
**Priority:** Low  
**Estimated Time:** 1 hour  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Documents page matches theme
- [ ] Document list styled correctly
- [ ] Upload form styled correctly
- [ ] Events page matches theme
- [ ] Event cards styled correctly

**Implementation Steps:**
1. Apply theme to documents page
2. Style document list
3. Style upload form
4. Apply theme to events page
5. Style event cards
6. Test responsive behavior

**Files to Modify:**
- `src/app/student/documents/page.tsx`
- `src/app/student/events/page.tsx`
- `src/components/student/document-list.tsx`
- `src/components/student/event-card.tsx`

---

### Task 7.11: Apply Theme to Achievements Page
**Priority:** Low  
**Estimated Time:** 1 hour  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Achievements page matches theme
- [ ] Achievement cards styled correctly
- [ ] Tabs styled correctly
- [ ] Add achievement dialog styled

**Implementation Steps:**
1. Apply theme to achievements page
2. Style achievement cards
3. Style tabs
4. Style add achievement dialog
5. Test responsive behavior

**Files to Modify:**
- `src/app/student/achievements/page.tsx`
- `src/components/student/achievement-dialog-trigger.tsx`

---

### Task 7.12: Theme Consistency Audit
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** All theme tasks

**Acceptance Criteria:**
- [ ] All pages use consistent colors
- [ ] All pages use consistent spacing
- [ ] All pages use consistent typography
- [ ] All pages use consistent components
- [ ] Light mode works correctly
- [ ] Dark mode works correctly
- [ ] All hover effects work
- [ ] All focus states work

**Implementation Steps:**
1. Review all pages for color consistency
2. Review all pages for spacing consistency
3. Review all pages for typography consistency
4. Test light mode on all pages
5. Test dark mode on all pages
6. Test hover effects on all interactive elements
7. Test focus states for accessibility
8. Document any inconsistencies
9. Fix all inconsistencies
10. Re-test all pages

**Testing:**
- Visual comparison with admin dashboard
- Side-by-side comparison of similar pages
- Theme toggle test on all pages
- Accessibility audit
- Responsive design test

---

## Updated Summary

**Total Estimated Time with Theme:** 100 hours (~2.5 weeks with one developer)

**Theme Implementation Time:** 20 hours

**Critical Path with Theme:**
1. UI Updates with Theme (Tasks 1.1, 1.2, 7.1)
2. Course Backend (Task 2.1)
3. Course Components with Theme (Tasks 3.1, 3.2, 7.2)
4. Course Pages with Theme (Tasks 4.1, 4.2, 7.2)
5. Message Composition with Theme (Tasks 5.1, 5.2, 5.4, 7.8)
6. Testing & Polish (Tasks 6.1, 6.2, 6.4)
7. Theme Consistency Audit (Task 7.12)

**Parallel Work Opportunities:**
- Theme tasks can be done in parallel with feature implementation
- Multiple pages can be themed simultaneously
- Theme audit can start as soon as first few pages are complete

**Theme Implementation Priority:**
1. **High Priority:** Dashboard, Courses, Messages (most visible)
2. **Medium Priority:** Academics, Assessments, Performance, Attendance, Fees
3. **Low Priority:** Documents, Events, Achievements, Profile

**Success Criteria:**
- [ ] All pages match admin dashboard design
- [ ] Consistent theme across all pages
- [ ] Light and dark modes work perfectly
- [ ] Responsive design on all screen sizes
- [ ] Accessibility standards met
- [ ] User feedback positive on UI/UX
