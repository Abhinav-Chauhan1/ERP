# Checkpoint 12: UI Features Testing Guide

## Overview

This document provides a comprehensive manual testing guide for all UI features implemented in the Enhanced Syllabus Scope System. Since these features involve UI interactions and Next.js server actions that require a browser context, manual testing is the most effective approach.

## Test Environment Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the syllabus management page:**
   ```
   http://localhost:3000/admin/academic/syllabus
   ```

3. **Ensure you have test data:**
   - At least one subject
   - At least one academic year
   - At least one class with sections

---

## Test 1: Creating Syllabi with Different Scopes

### Test 1.1: Create Subject-Wide Syllabus

**Steps:**
1. Click "Create Syllabus" button
2. Fill in basic information:
   - Title: "Mathematics - Subject Wide"
   - Description: "Applies to all classes and sections"
   - Subject: Select any subject
   - Version: "1.0"
3. In the Scope section:
   - Select "Subject-Wide" radio button
   - Verify that Class and Section dropdowns are hidden/disabled
   - Academic Year: Leave as "None (All Years)" or select one
4. In Curriculum Details:
   - Curriculum Type: "General"
   - Board Type: Leave empty or enter "CBSE"
5. In Metadata:
   - Tags: Add "test", "subject-wide"
   - Difficulty Level: "Intermediate"
   - Estimated Hours: 100
6. Click "Create"

**Expected Results:**
- ✅ Syllabus is created successfully
- ✅ Toast notification shows success message
- ✅ New syllabus appears in the list
- ✅ Scope badges show only subject name (no class/section)
- ✅ Status badge shows "DRAFT"

### Test 1.2: Create Class-Wide Syllabus

**Steps:**
1. Click "Create Syllabus" button
2. Fill in basic information:
   - Title: "Mathematics - Grade 10"
   - Description: "Applies to all sections of Grade 10"
   - Subject: Select same subject as Test 1.1
   - Version: "1.0"
3. In the Scope section:
   - Select "Class-Wide" radio button
   - Verify that Class dropdown appears
   - Select a class (e.g., "Grade 10")
   - Verify that Section dropdown remains hidden
   - Academic Year: Select an academic year
4. In Curriculum Details:
   - Curriculum Type: "General"
5. In Metadata:
   - Tags: Add "test", "class-wide"
6. Click "Create"

**Expected Results:**
- ✅ Syllabus is created successfully
- ✅ New syllabus appears in the list
- ✅ Scope badges show subject, academic year, and class
- ✅ No section badge is shown
- ✅ Status badge shows "DRAFT"

### Test 1.3: Create Section-Specific Syllabus

**Steps:**
1. Click "Create Syllabus" button
2. Fill in basic information:
   - Title: "Mathematics - Grade 10 Section A"
   - Description: "Specific to Section A only"
   - Subject: Select same subject
   - Version: "1.0"
3. In the Scope section:
   - Select "Section-Specific" radio button
   - Select a class (e.g., "Grade 10")
   - Verify that Section dropdown appears
   - Select a section (e.g., "Section A")
   - Academic Year: Select same academic year
4. In Curriculum Details:
   - Curriculum Type: "General"
5. In Metadata:
   - Tags: Add "test", "section-specific"
6. Click "Create"

**Expected Results:**
- ✅ Syllabus is created successfully
- ✅ New syllabus appears in the list
- ✅ Scope badges show subject, academic year, class, AND section
- ✅ Status badge shows "DRAFT"

### Test 1.4: Create Syllabus with Different Curriculum Type

**Steps:**
1. Click "Create Syllabus" button
2. Fill in basic information:
   - Title: "Mathematics - Advanced"
   - Subject: Select same subject
3. In the Scope section:
   - Select "Class-Wide"
   - Select same class as Test 1.2
   - Academic Year: Select same academic year
4. In Curriculum Details:
   - Curriculum Type: "Advanced"
   - Board Type: "CBSE"
5. In Metadata:
   - Tags: Add "test", "advanced"
   - Difficulty Level: "Advanced"
   - Estimated Hours: 150
   - Prerequisites: "Strong foundation in algebra"
6. Click "Create"

**Expected Results:**
- ✅ Syllabus is created successfully
- ✅ Curriculum type badge shows "ADVANCED"
- ✅ Board type badge shows "CBSE"
- ✅ Multiple syllabi exist for the same subject (no unique constraint violation)

### Test 1.5: Test Duplicate Prevention

**Steps:**
1. Try to create another syllabus with:
   - Same subject
   - Same academic year
   - Same class
   - Same section (or both null for subject-wide)
   - Same curriculum type

**Expected Results:**
- ❌ Creation should fail
- ❌ Error message: "A syllabus already exists for this combination"

---

## Test 2: Filtering and Searching

### Test 2.1: Filter by Subject

**Steps:**
1. In the Filters section, select a subject from the Subject dropdown
2. Observe the syllabus list

**Expected Results:**
- ✅ Only syllabi for the selected subject are shown
- ✅ Count matches the number of syllabi created for that subject

### Test 2.2: Filter by Academic Year

**Steps:**
1. Select an academic year from the Academic Year dropdown
2. Observe the syllabus list

**Expected Results:**
- ✅ Only syllabi for the selected academic year are shown
- ✅ Subject-wide syllabi with no academic year are also shown (they apply to all years)

### Test 2.3: Filter by Class

**Steps:**
1. Select a class from the Class dropdown
2. Observe the syllabus list

**Expected Results:**
- ✅ Only syllabi for the selected class are shown
- ✅ Subject-wide syllabi are also shown (they apply to all classes)
- ✅ Section dropdown becomes enabled

### Test 2.4: Filter by Section

**Steps:**
1. With a class selected, select a section from the Section dropdown
2. Observe the syllabus list

**Expected Results:**
- ✅ Only section-specific syllabi for that section are shown
- ✅ Class-wide syllabi for that class are also shown
- ✅ Subject-wide syllabi are also shown

### Test 2.5: Filter by Curriculum Type

**Steps:**
1. Select "Advanced" from the Curriculum Type dropdown
2. Observe the syllabus list

**Expected Results:**
- ✅ Only syllabi with curriculum type "Advanced" are shown

### Test 2.6: Filter by Status

**Steps:**
1. Select "Draft" from the Status dropdown
2. Observe the syllabus list

**Expected Results:**
- ✅ Only syllabi with status "Draft" are shown

### Test 2.7: Combined Filters

**Steps:**
1. Select:
   - Subject: Mathematics
   - Class: Grade 10
   - Curriculum Type: General
2. Observe the syllabus list

**Expected Results:**
- ✅ Only syllabi matching ALL criteria are shown
- ✅ Fallback logic applies (subject-wide and class-wide syllabi are included)

### Test 2.8: Clear Filters

**Steps:**
1. Apply multiple filters
2. Click "Clear Filters" button

**Expected Results:**
- ✅ All filters are reset to default values
- ✅ All syllabi are shown again

---

## Test 3: Cloning Syllabi

### Test 3.1: Clone with Same Scope, Different Curriculum Type

**Steps:**
1. Find a syllabus in the list
2. Click the "Clone" button
3. In the clone dialog:
   - Keep the same scope settings
   - Change Curriculum Type to "Remedial"
4. Click "Clone"

**Expected Results:**
- ✅ New syllabus is created
- ✅ Status is "DRAFT"
- ✅ Title is the same as original
- ✅ Description is the same as original
- ✅ Curriculum type is "Remedial"
- ✅ All other fields match the original
- ✅ Toast notification shows success

### Test 3.2: Clone to Different Scope

**Steps:**
1. Find a subject-wide syllabus
2. Click "Clone"
3. In the clone dialog:
   - Change scope to "Class-Wide"
   - Select a class
   - Keep curriculum type as "General"
4. Click "Clone"

**Expected Results:**
- ✅ New syllabus is created with class-wide scope
- ✅ Status is "DRAFT"
- ✅ All content is copied from original

### Test 3.3: Clone with Duplicate Scope

**Steps:**
1. Find a syllabus
2. Click "Clone"
3. Try to clone with exact same scope and curriculum type

**Expected Results:**
- ❌ Cloning should fail
- ❌ Error message about duplicate combination

### Test 3.4: Verify Cloned Data

**Steps:**
1. After cloning, click "Edit" on the cloned syllabus
2. Verify all fields

**Expected Results:**
- ✅ Title matches original
- ✅ Description matches original
- ✅ Tags are copied
- ✅ Metadata (difficulty, estimated hours, prerequisites) is copied
- ✅ Version is copied
- ✅ Document URL is copied (if present)

---

## Test 4: Status Changes

### Test 4.1: Change Status to Pending Review

**Steps:**
1. Find a syllabus with status "DRAFT"
2. Click the status dropdown (three dots or status badge)
3. Select "Pending Review"
4. Confirm the change

**Expected Results:**
- ✅ Status badge changes to "PENDING_REVIEW"
- ✅ Status badge color changes
- ✅ Toast notification shows success

### Test 4.2: Change Status to Approved

**Steps:**
1. Find a syllabus with status "PENDING_REVIEW"
2. Click the status dropdown
3. Select "Approved"
4. Confirm the change

**Expected Results:**
- ✅ Status badge changes to "APPROVED"
- ✅ approvedBy field is set to current user
- ✅ approvedAt timestamp is set

### Test 4.3: Change Status to Published

**Steps:**
1. Find a syllabus with status "APPROVED"
2. Click the status dropdown
3. Select "Published"
4. Confirm the change

**Expected Results:**
- ✅ Status badge changes to "PUBLISHED"
- ✅ isActive is set to true
- ✅ Syllabus becomes visible to teachers and students

### Test 4.4: Change Status to Archived

**Steps:**
1. Find a published syllabus
2. Click the status dropdown
3. Select "Archived"
4. Confirm the change

**Expected Results:**
- ✅ Status badge changes to "ARCHIVED"
- ✅ Syllabus is hidden from active listings (may need to refresh)

### Test 4.5: Status Filtering After Changes

**Steps:**
1. Change several syllabi to different statuses
2. Use the Status filter to view only "Published" syllabi

**Expected Results:**
- ✅ Only published syllabi are shown
- ✅ Archived and draft syllabi are hidden

---

## Test 5: UI Components

### Test 5.1: Scope Selector Component

**Steps:**
1. Open create/edit syllabus dialog
2. Test scope type radio buttons

**Expected Results:**
- ✅ Selecting "Subject-Wide" hides class and section dropdowns
- ✅ Selecting "Class-Wide" shows class dropdown, hides section dropdown
- ✅ Selecting "Section-Specific" shows both class and section dropdowns
- ✅ Changing scope type clears previously selected class/section

### Test 5.2: Curriculum Type Selector Component

**Steps:**
1. Open create/edit syllabus dialog
2. Test curriculum type dropdown

**Expected Results:**
- ✅ All curriculum types are available (General, Advanced, Remedial, etc.)
- ✅ Board type input is optional
- ✅ Values are saved correctly

### Test 5.3: Metadata Inputs Component

**Steps:**
1. Open create/edit syllabus dialog
2. Test metadata fields

**Expected Results:**
- ✅ Tags can be added and removed
- ✅ Difficulty level dropdown works
- ✅ Estimated hours accepts numbers only
- ✅ Prerequisites textarea works

### Test 5.4: Date Range Picker Component

**Steps:**
1. Open create/edit syllabus dialog
2. Test effective date range picker

**Expected Results:**
- ✅ Can select start date
- ✅ Can select end date
- ✅ Validation prevents end date before start date
- ✅ Dates are optional

### Test 5.5: Status Badge Component

**Steps:**
1. View syllabi list with different statuses

**Expected Results:**
- ✅ Each status has a distinct color
- ✅ Badge text is readable
- ✅ Badge is visually prominent

### Test 5.6: Status Change Dropdown Component

**Steps:**
1. Click status dropdown on a syllabus

**Expected Results:**
- ✅ Dropdown shows available status transitions
- ✅ Current status is indicated
- ✅ Confirmation dialog appears for status changes

---

## Test 6: Scope Information Display

### Test 6.1: Subject-Wide Syllabus Display

**Steps:**
1. View a subject-wide syllabus in the list

**Expected Results:**
- ✅ Shows subject badge
- ✅ Shows curriculum type badge
- ✅ No class or section badges
- ✅ Academic year badge only if specified

### Test 6.2: Class-Wide Syllabus Display

**Steps:**
1. View a class-wide syllabus in the list

**Expected Results:**
- ✅ Shows subject badge
- ✅ Shows academic year badge
- ✅ Shows class badge
- ✅ Shows curriculum type badge
- ✅ No section badge

### Test 6.3: Section-Specific Syllabus Display

**Steps:**
1. View a section-specific syllabus in the list

**Expected Results:**
- ✅ Shows subject badge
- ✅ Shows academic year badge
- ✅ Shows class badge
- ✅ Shows section badge
- ✅ Shows curriculum type badge
- ✅ Shows board type badge (if specified)

---

## Test 7: Edit Functionality

### Test 7.1: Edit Syllabus Scope

**Steps:**
1. Click "Edit" on a syllabus
2. Try to change the scope type

**Expected Results:**
- ✅ Can change scope type
- ✅ Can change class/section selection
- ✅ Changes are saved correctly
- ✅ Unique constraint is still enforced

### Test 7.2: Edit Syllabus Metadata

**Steps:**
1. Click "Edit" on a syllabus
2. Modify tags, difficulty level, estimated hours

**Expected Results:**
- ✅ Changes are saved correctly
- ✅ Updated values appear in the list

### Test 7.3: Edit Syllabus Curriculum Details

**Steps:**
1. Click "Edit" on a syllabus
2. Change curriculum type and board type

**Expected Results:**
- ✅ Changes are saved correctly
- ✅ Badges update to reflect new values

---

## Test 8: Delete Functionality

### Test 8.1: Delete Syllabus

**Steps:**
1. Click "Delete" on a syllabus
2. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Syllabus is deleted after confirmation
- ✅ Syllabus is removed from the list
- ✅ Toast notification shows success

### Test 8.2: Cancel Delete

**Steps:**
1. Click "Delete" on a syllabus
2. Click "Cancel" in the confirmation dialog

**Expected Results:**
- ✅ Dialog closes
- ✅ Syllabus is NOT deleted
- ✅ Syllabus remains in the list

---

## Test 9: Responsive Design

### Test 9.1: Mobile View

**Steps:**
1. Resize browser to mobile width (< 768px)
2. Test all features

**Expected Results:**
- ✅ Filters stack vertically
- ✅ Syllabus cards are readable
- ✅ Buttons are accessible
- ✅ Dialogs fit on screen

### Test 9.2: Tablet View

**Steps:**
1. Resize browser to tablet width (768px - 1024px)
2. Test all features

**Expected Results:**
- ✅ Layout adapts appropriately
- ✅ All features remain functional

---

## Test 10: Error Handling

### Test 10.1: Invalid Form Submission

**Steps:**
1. Open create syllabus dialog
2. Leave required fields empty
3. Try to submit

**Expected Results:**
- ❌ Form validation prevents submission
- ❌ Error messages appear for required fields

### Test 10.2: Network Error Handling

**Steps:**
1. Disconnect network
2. Try to create/edit a syllabus

**Expected Results:**
- ❌ Error toast appears
- ❌ User-friendly error message is shown

---

## Test Summary Checklist

After completing all tests, verify:

- [ ] ✅ Can create syllabi with all three scope types
- [ ] ✅ Can create multiple syllabi for the same subject with different scopes
- [ ] ✅ Unique constraint prevents duplicate combinations
- [ ] ✅ All filters work correctly (subject, academic year, class, section, curriculum type, status)
- [ ] ✅ Combined filters work correctly
- [ ] ✅ Can clone syllabi with different scopes and curriculum types
- [ ] ✅ Cloned syllabi have status "DRAFT"
- [ ] ✅ Can change syllabus status through all transitions
- [ ] ✅ Status changes update approvedBy and approvedAt fields
- [ ] ✅ Scope information displays correctly with appropriate badges
- [ ] ✅ All UI components work as expected
- [ ] ✅ Can edit syllabi and changes are saved
- [ ] ✅ Can delete syllabi with confirmation
- [ ] ✅ Responsive design works on different screen sizes
- [ ] ✅ Error handling works correctly

---

## Notes for Testers

1. **Test Data**: Create diverse test data to thoroughly test filtering and fallback logic
2. **Browser Testing**: Test in multiple browsers (Chrome, Firefox, Safari, Edge)
3. **Performance**: Note any slow operations or UI lag
4. **Accessibility**: Test keyboard navigation and screen reader compatibility
5. **Edge Cases**: Try unusual combinations and edge cases
6. **Documentation**: Report any bugs or unexpected behavior

---

## Automated Test Results

The automated test script (`scripts/test-checkpoint-12-ui-features.ts`) successfully verified:

✅ **Helper Actions**: All dropdown data retrieval functions work correctly
✅ **Filtering Logic**: All filter combinations return correct results
✅ **Scope Filtering**: Subject, class, section, curriculum type, and tag filtering work correctly
✅ **Combined Filters**: Multiple filters can be applied simultaneously

**Note**: Server action tests (create, clone, status change) require a Next.js request context and should be tested manually in the browser.

---

## Conclusion

This comprehensive testing guide ensures that all UI features of the Enhanced Syllabus Scope System are working correctly. Manual testing is essential for UI components and user interactions, while automated tests verify the underlying business logic and data filtering.
