# Academic Year Manual Testing Guide

This document provides a comprehensive manual testing checklist for the academic year fixes implementation.

## Test Environment Setup

Before starting tests, ensure:
- [ ] Development server is running
- [ ] Database is accessible
- [ ] You have admin, student, and parent test accounts
- [ ] Browser developer tools are open for debugging

## Test Categories

### 1. CRUD Operations Testing

#### 1.1 Create Academic Year

**Test Case 1.1.1: Create valid academic year**
- [ ] Navigate to `/admin/academic/academic-years`
- [ ] Click "Add Academic Year" button
- [ ] Fill in form:
  - Name: "2024-2025"
  - Start Date: Select a future date
  - End Date: Select a date after start date
  - Is Current: Unchecked
- [ ] Click "Create"
- [ ] **Expected**: Success toast appears
- [ ] **Expected**: New academic year appears in the list
- [ ] **Expected**: Page refreshes with new data

**Test Case 1.1.2: Create academic year with invalid dates**
- [ ] Click "Add Academic Year"
- [ ] Fill in form:
  - Name: "Invalid Year"
  - Start Date: 2024-12-01
  - End Date: 2024-06-01 (before start date)
- [ ] Click "Create"
- [ ] **Expected**: Error message "End date must be after start date"
- [ ] **Expected**: Form does not submit

**Test Case 1.1.3: Create academic year with short name**
- [ ] Click "Add Academic Year"
- [ ] Fill in form:
  - Name: "2024" (less than 5 characters)
  - Start Date: Valid date
  - End Date: Valid date after start
- [ ] Click "Create"
- [ ] **Expected**: Validation error for name field
- [ ] **Expected**: Form does not submit

**Test Case 1.1.4: Create academic year as current**
- [ ] Create first academic year with "Is Current" checked
- [ ] **Expected**: Year is marked as current
- [ ] Create second academic year with "Is Current" checked
- [ ] **Expected**: First year is no longer current
- [ ] **Expected**: Only second year shows "Current" badge

#### 1.2 Read Academic Years

**Test Case 1.2.1: View academic years list**
- [ ] Navigate to `/admin/academic/academic-years`
- [ ] **Expected**: All academic years are displayed
- [ ] **Expected**: Table shows: Name, Start Date, End Date, Status, Terms, Classes
- [ ] **Expected**: Current year appears first in the list
- [ ] **Expected**: Status badges are correctly colored:
  - Current: Green
  - Past: Gray
  - Planned: Blue

**Test Case 1.2.2: View academic overview page**
- [ ] Navigate to `/admin/academic`
- [ ] **Expected**: Academic years table is displayed
- [ ] **Expected**: Summary cards show correct counts
- [ ] **Expected**: "Create Academic Year" button is visible

**Test Case 1.2.3: View academic year detail page**
- [ ] Click "View" on any academic year
- [ ] **Expected**: Navigate to `/admin/academic/academic-years/[id]`
- [ ] **Expected**: Year name and status badge displayed
- [ ] **Expected**: Duration card shows start and end dates
- [ ] **Expected**: Terms card shows count and list
- [ ] **Expected**: Classes card shows count and list with enrollment
- [ ] **Expected**: Edit and Delete buttons are visible

#### 1.3 Update Academic Year

**Test Case 1.3.1: Edit academic year details**
- [ ] Click "Edit" button on an academic year
- [ ] **Expected**: Dialog opens with pre-populated form
- [ ] Modify name to "2024-2025 Updated"
- [ ] Click "Update"
- [ ] **Expected**: Success toast appears
- [ ] **Expected**: Updated name is displayed
- [ ] **Expected**: Page refreshes

**Test Case 1.3.2: Change current academic year**
- [ ] Edit an academic year
- [ ] Check "Set as current academic year"
- [ ] Click "Update"
- [ ] **Expected**: This year becomes current
- [ ] **Expected**: Previous current year is no longer current
- [ ] **Expected**: Only one year has "Current" badge

**Test Case 1.3.3: Edit with invalid dates**
- [ ] Edit an academic year
- [ ] Set end date before start date
- [ ] Click "Update"
- [ ] **Expected**: Error message appears
- [ ] **Expected**: Changes are not saved

#### 1.4 Delete Academic Year

**Test Case 1.4.1: Delete academic year without dependencies**
- [ ] Create a new academic year with no terms or classes
- [ ] Click "Delete" button
- [ ] **Expected**: Confirmation dialog appears
- [ ] Click "Delete" in dialog
- [ ] **Expected**: Success toast appears
- [ ] **Expected**: Academic year is removed from list
- [ ] **Expected**: Page refreshes

**Test Case 1.4.2: Attempt to delete academic year with terms**
- [ ] Create an academic year
- [ ] Create a term associated with this year
- [ ] Try to delete the academic year
- [ ] Click "Delete" in confirmation dialog
- [ ] **Expected**: Error toast with message about associated terms
- [ ] **Expected**: Academic year is NOT deleted
- [ ] **Expected**: Year still appears in list

**Test Case 1.4.3: Attempt to delete academic year with classes**
- [ ] Create an academic year
- [ ] Create a class associated with this year
- [ ] Try to delete the academic year
- [ ] Click "Delete" in confirmation dialog
- [ ] **Expected**: Error toast with message about associated classes
- [ ] **Expected**: Academic year is NOT deleted

**Test Case 1.4.4: Delete from detail page**
- [ ] Navigate to academic year detail page
- [ ] Click "Delete" button
- [ ] **Expected**: Warning in dialog if dependencies exist
- [ ] If no dependencies, confirm deletion
- [ ] **Expected**: Redirect to academic years list
- [ ] **Expected**: Year is deleted

### 2. Filtering in Student Dashboard

**Test Case 2.1: Student report card filtering**
- [ ] Log in as a student user
- [ ] Navigate to `/student/assessments/report-cards`
- [ ] **Expected**: Filters card is displayed
- [ ] **Expected**: Academic Year dropdown shows "All Academic Years" option
- [ ] **Expected**: Current year is marked with "(Current)"

**Test Case 2.2: Filter by academic year**
- [ ] Select a specific academic year from dropdown
- [ ] **Expected**: Only report cards from that year are displayed
- [ ] **Expected**: Report cards from other years are hidden
- [ ] Select "All Academic Years"
- [ ] **Expected**: All report cards are displayed again

**Test Case 2.3: Filter by term**
- [ ] Select a specific term from dropdown
- [ ] **Expected**: Only report cards from that term are displayed
- [ ] Select "All Terms"
- [ ] **Expected**: All report cards are displayed

**Test Case 2.4: Combined filters**
- [ ] Select specific academic year
- [ ] Select specific term from that year
- [ ] **Expected**: Only report cards matching both filters are shown
- [ ] **Expected**: Filtering logic is correct (AND operation)

### 3. Filtering in Parent Dashboard

**Test Case 3.1: Parent report card filtering**
- [ ] Log in as a parent user
- [ ] Navigate to `/parent/performance/report-cards`
- [ ] **Expected**: Filters card is displayed with three dropdowns
- [ ] **Expected**: Child, Academic Year, and Term filters are available

**Test Case 3.2: Filter by child**
- [ ] Select a specific child from dropdown
- [ ] **Expected**: Only that child's report cards are displayed
- [ ] Select "All Children"
- [ ] **Expected**: Tabs appear for each child

**Test Case 3.3: Filter by academic year (parent)**
- [ ] Select a specific academic year
- [ ] **Expected**: Only report cards from that year are displayed
- [ ] **Expected**: Current year is marked with "(Current)"

**Test Case 3.4: Combined filters (parent)**
- [ ] Select specific child
- [ ] Select specific academic year
- [ ] Select specific term
- [ ] **Expected**: Only report cards matching all filters are shown

### 4. Error States and Edge Cases

**Test Case 4.1: Empty database state**
- [ ] Clear all academic years from database
- [ ] Navigate to `/admin/academic`
- [ ] **Expected**: Empty state message is displayed
- [ ] **Expected**: "Create Academic Year" call-to-action button is shown
- [ ] **Expected**: No error messages appear

**Test Case 4.2: Empty academic years list**
- [ ] Navigate to `/admin/academic/academic-years` with no data
- [ ] **Expected**: "No academic years found" message
- [ ] **Expected**: "Create First Academic Year" button is shown

**Test Case 4.3: Academic year not found**
- [ ] Navigate to `/admin/academic/academic-years/invalid-id`
- [ ] **Expected**: Error alert is displayed
- [ ] **Expected**: "Academic year not found" message
- [ ] **Expected**: Back button is functional

**Test Case 4.4: Network error handling**
- [ ] Disconnect network
- [ ] Try to create/update/delete academic year
- [ ] **Expected**: User-friendly error message
- [ ] **Expected**: No application crash
- [ ] Reconnect network
- [ ] **Expected**: Can retry operation

**Test Case 4.5: Database error handling**
- [ ] Simulate database connection failure
- [ ] Navigate to academic pages
- [ ] **Expected**: Error alert is displayed
- [ ] **Expected**: Error message is user-friendly
- [ ] **Expected**: No sensitive information is leaked

### 5. Loading States

**Test Case 5.1: Academic overview loading**
- [ ] Navigate to `/admin/academic`
- [ ] **Expected**: Loading state is briefly visible
- [ ] **Expected**: Skeleton loaders or loading indicators appear
- [ ] **Expected**: Smooth transition to loaded state

**Test Case 5.2: Academic years list loading**
- [ ] Navigate to `/admin/academic/academic-years`
- [ ] **Expected**: "Loading academic years..." message appears
- [ ] **Expected**: Smooth transition to data display

**Test Case 5.3: Form submission loading**
- [ ] Open create/edit dialog
- [ ] Fill in form and submit
- [ ] **Expected**: Button shows "Creating..." or "Updating..."
- [ ] **Expected**: Button is disabled during submission
- [ ] **Expected**: Form fields are disabled

**Test Case 5.4: Delete operation loading**
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] **Expected**: Button shows "Deleting..."
- [ ] **Expected**: All action buttons are disabled
- [ ] **Expected**: Cannot interact with UI during deletion

### 6. Accessibility Testing

**Test Case 6.1: Keyboard navigation - List page**
- [ ] Navigate to academic years list using only keyboard
- [ ] Press Tab to move through elements
- [ ] **Expected**: Focus indicators are visible
- [ ] **Expected**: Can reach all interactive elements
- [ ] **Expected**: Tab order is logical
- [ ] Press Enter on "Add Academic Year" button
- [ ] **Expected**: Dialog opens

**Test Case 6.2: Keyboard navigation - Forms**
- [ ] Open create/edit dialog
- [ ] Use Tab to navigate form fields
- [ ] **Expected**: Can reach all form inputs
- [ ] **Expected**: Can interact with date pickers using keyboard
- [ ] **Expected**: Can toggle checkbox with Space
- [ ] Press Escape
- [ ] **Expected**: Dialog closes

**Test Case 6.3: Keyboard navigation - Detail page**
- [ ] Navigate to detail page
- [ ] Use Tab to navigate
- [ ] **Expected**: Can reach Edit and Delete buttons
- [ ] **Expected**: Can navigate back using keyboard

**Test Case 6.4: Screen reader compatibility**
- [ ] Enable screen reader (NVDA/JAWS/VoiceOver)
- [ ] Navigate through academic years pages
- [ ] **Expected**: All labels are announced
- [ ] **Expected**: Status badges are announced correctly
- [ ] **Expected**: Error messages are announced
- [ ] **Expected**: Success toasts are announced

**Test Case 6.5: Form labels and ARIA**
- [ ] Inspect form elements
- [ ] **Expected**: All inputs have associated labels
- [ ] **Expected**: Required fields are marked
- [ ] **Expected**: Error messages are associated with fields
- [ ] **Expected**: ARIA labels are present on icon buttons

### 7. Cache Invalidation

**Test Case 7.1: Create invalidates cache**
- [ ] Open `/admin/academic` in one tab
- [ ] Open `/admin/academic/academic-years` in another tab
- [ ] Create a new academic year in second tab
- [ ] Refresh first tab
- [ ] **Expected**: New academic year appears in both tabs

**Test Case 7.2: Update invalidates cache**
- [ ] View academic year detail page
- [ ] Edit the academic year
- [ ] Navigate back to list
- [ ] **Expected**: Changes are reflected immediately
- [ ] Check overview page
- [ ] **Expected**: Changes are reflected there too

**Test Case 7.3: Delete invalidates cache**
- [ ] Delete an academic year
- [ ] **Expected**: Removed from list immediately
- [ ] Navigate to overview page
- [ ] **Expected**: Count is updated
- [ ] Navigate to student/parent dashboards
- [ ] **Expected**: Deleted year is removed from filters

### 8. Data Consistency

**Test Case 8.1: Single current year invariant**
- [ ] Create multiple academic years
- [ ] Set one as current
- [ ] **Expected**: Only one year has "Current" status
- [ ] Set another as current
- [ ] **Expected**: Previous current year becomes "Past" or "Planned"
- [ ] **Expected**: Only new year is "Current"

**Test Case 8.2: Status calculation accuracy**
- [ ] Create academic year with past dates
- [ ] **Expected**: Status is "Past" (gray badge)
- [ ] Create academic year with future dates
- [ ] **Expected**: Status is "Planned" (blue badge)
- [ ] Create academic year with current dates and isCurrent=true
- [ ] **Expected**: Status is "Current" (green badge)

**Test Case 8.3: Date ordering consistency**
- [ ] View academic years list
- [ ] **Expected**: Years are ordered by start date (descending)
- [ ] **Expected**: Current year appears first regardless of date

**Test Case 8.4: Counts accuracy**
- [ ] Create academic year
- [ ] Add 2 terms to it
- [ ] Add 3 classes to it
- [ ] View in list
- [ ] **Expected**: Terms count shows 2
- [ ] **Expected**: Classes count shows 3
- [ ] View detail page
- [ ] **Expected**: Counts match

### 9. Form Validation

**Test Case 9.1: Required fields**
- [ ] Open create dialog
- [ ] Try to submit without filling any fields
- [ ] **Expected**: Validation errors for all required fields
- [ ] **Expected**: Form does not submit

**Test Case 9.2: Name validation**
- [ ] Enter name with less than 5 characters
- [ ] **Expected**: Validation error appears
- [ ] Enter name with exactly 5 characters
- [ ] **Expected**: Validation passes

**Test Case 9.3: Date validation**
- [ ] Select start date
- [ ] Try to select end date before start date
- [ ] **Expected**: End date picker disables dates before start date
- [ ] Select valid end date
- [ ] **Expected**: Validation passes

**Test Case 9.4: Form pre-population on edit**
- [ ] Click edit on an academic year
- [ ] **Expected**: All fields are pre-populated with current values
- [ ] **Expected**: Dates are correctly formatted
- [ ] **Expected**: Checkbox reflects current state

### 10. UI/UX Testing

**Test Case 10.1: Responsive design**
- [ ] Test on desktop (1920x1080)
- [ ] **Expected**: Layout is optimal
- [ ] Test on tablet (768x1024)
- [ ] **Expected**: Layout adapts, no overflow
- [ ] Test on mobile (375x667)
- [ ] **Expected**: Tables are scrollable
- [ ] **Expected**: Dialogs fit screen

**Test Case 10.2: Badge styling**
- [ ] View academic years with different statuses
- [ ] **Expected**: Current badge is green
- [ ] **Expected**: Past badge is gray
- [ ] **Expected**: Planned badge is blue
- [ ] **Expected**: Badges are readable and consistent

**Test Case 10.3: Button states**
- [ ] Hover over buttons
- [ ] **Expected**: Hover effects are visible
- [ ] Click button
- [ ] **Expected**: Active state is visible
- [ ] During loading
- [ ] **Expected**: Buttons are disabled and show loading text

**Test Case 10.4: Toast notifications**
- [ ] Perform successful operation
- [ ] **Expected**: Success toast appears
- [ ] **Expected**: Toast auto-dismisses after a few seconds
- [ ] Perform failed operation
- [ ] **Expected**: Error toast appears with clear message
- [ ] **Expected**: Toast is dismissible

### 11. Integration Testing

**Test Case 11.1: Academic year in term creation**
- [ ] Navigate to term creation form
- [ ] **Expected**: Academic year dropdown is present
- [ ] **Expected**: Current year appears first
- [ ] **Expected**: Cannot submit without selecting academic year

**Test Case 11.2: Academic year in class creation**
- [ ] Navigate to class creation form
- [ ] **Expected**: Academic year dropdown is present
- [ ] **Expected**: Validation requires academic year selection

**Test Case 11.3: Academic year in fee structure**
- [ ] Navigate to fee structure form
- [ ] **Expected**: Academic year dropdown is present
- [ ] **Expected**: Can filter by academic year

## Test Execution Summary

### Pass/Fail Tracking

| Category | Total Tests | Passed | Failed | Notes |
|----------|-------------|--------|--------|-------|
| CRUD Operations | 14 | | | |
| Student Filtering | 4 | | | |
| Parent Filtering | 4 | | | |
| Error States | 5 | | | |
| Loading States | 4 | | | |
| Accessibility | 5 | | | |
| Cache Invalidation | 3 | | | |
| Data Consistency | 4 | | | |
| Form Validation | 4 | | | |
| UI/UX | 4 | | | |
| Integration | 3 | | | |
| **TOTAL** | **54** | | | |

## Issues Found

Document any issues found during testing:

| Issue # | Category | Severity | Description | Status |
|---------|----------|----------|-------------|--------|
| | | | | |

## Test Environment Details

- **Date**: _______________
- **Tester**: _______________
- **Browser**: _______________
- **OS**: _______________
- **Database**: _______________
- **Node Version**: _______________

## Sign-off

- [ ] All critical tests passed
- [ ] All issues documented
- [ ] Ready for production

**Tester Signature**: _______________
**Date**: _______________
