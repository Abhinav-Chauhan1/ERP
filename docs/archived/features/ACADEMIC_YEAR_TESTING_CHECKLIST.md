# Academic Year Testing Quick Checklist

This is a condensed checklist for quick manual testing verification.

## Pre-Testing Setup
- [ ] Development server running
- [ ] Database accessible
- [ ] Test accounts ready (admin, student, parent)
- [ ] Browser dev tools open

## Critical Path Testing (Must Pass)

### 1. CRUD Operations (15 min)
- [ ] Create academic year with valid data → Success
- [ ] Create with invalid dates (end before start) → Error shown
- [ ] Edit academic year → Changes saved
- [ ] Set year as current → Only one current year exists
- [ ] Delete year without dependencies → Deleted successfully
- [ ] Delete year with terms/classes → Error shown, not deleted

### 2. Data Display (5 min)
- [ ] Overview page shows all years correctly
- [ ] List page shows all years with correct counts
- [ ] Detail page shows year info, terms, and classes
- [ ] Status badges are correct colors (Current=green, Past=gray, Planned=blue)

### 3. Filtering - Student (5 min)
- [ ] Navigate to student report cards
- [ ] Filter by academic year → Only matching cards shown
- [ ] Filter by term → Only matching cards shown
- [ ] "All" option shows all cards

### 4. Filtering - Parent (5 min)
- [ ] Navigate to parent report cards
- [ ] Filter by child → Only that child's cards shown
- [ ] Filter by academic year → Only matching cards shown
- [ ] Combined filters work correctly

### 5. Error Handling (5 min)
- [ ] Empty database shows helpful message
- [ ] Invalid ID shows "not found" error
- [ ] Network errors show user-friendly messages
- [ ] No application crashes

### 6. Loading States (3 min)
- [ ] Loading indicators appear during data fetch
- [ ] Buttons show loading text during operations
- [ ] UI is disabled during operations

### 7. Accessibility (5 min)
- [ ] Tab through all pages → Focus visible
- [ ] Can operate forms with keyboard only
- [ ] Escape closes dialogs
- [ ] All buttons reachable by keyboard

### 8. Business Logic (5 min)
- [ ] Only one year can be current at a time
- [ ] End date must be after start date
- [ ] Cannot delete year with dependencies
- [ ] Counts (terms, classes) are accurate

## Quick Smoke Test (5 min)
If time is limited, run this minimal test:

1. [ ] Create academic year → Success
2. [ ] View in list → Appears correctly
3. [ ] Edit year → Changes saved
4. [ ] View detail page → All data shown
5. [ ] Delete year → Deleted successfully
6. [ ] Check student/parent filters → Academic year appears

## Automated Verification
Run the automated test script:
```bash
npx tsx scripts/test-academic-year-manual-verification.ts
```

Expected output: All tests pass ✓

## Sign-off
- [ ] All critical tests passed
- [ ] No blocking issues found
- [ ] Ready for production

**Tester**: ________________  
**Date**: ________________  
**Time Spent**: ________________
