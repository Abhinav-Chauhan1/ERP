# Production Testing Checklist

**Status:** Ready for testing
**Environment:** Production
**Date:** February 15, 2026

---

## 🎯 Testing Strategy

This checklist ensures all critical fixes work correctly in production.

### Test Categories

- 🔴 **Critical** - Must pass before launch
- 🟠 **High** - Test within first hour
- 🟡 **Medium** - Test within 24 hours
- 🟢 **Low** - Test within first week

---

## 🔴 Critical Tests (Pre-Launch)

### 1. R2 Security - Authentication

**What was fixed:** Authentication was completely disabled

**Test Cases:**

#### Test 1.1: Authenticated File Upload ✅
```
1. Login as any user (Admin/Teacher/Student)
2. Navigate to a page with file upload
3. Upload a test file
4. Verify upload succeeds
5. Verify file appears in list

Expected: ✅ Upload successful with authentication
Actual: _____
Status: [ ] Pass [ ] Fail
```

#### Test 1.2: Unauthenticated File Access ❌
```
1. Logout or open incognito window
2. Get a direct file URL from R2
3. Try to access the file directly
4. Should see 401 Unauthorized

Expected: ❌ Access denied (401)
Actual: _____
Status: [ ] Pass [ ] Fail
```

#### Test 1.3: Cross-School File Access ❌
```
1. Login as School A user
2. Get file URL from School B
3. Try to access School B's file
4. Should see 403 Forbidden

Expected: ❌ Access denied (403)
Actual: _____
Status: [ ] Pass [ ] Fail
```

#### Test 1.4: File Download with Auth ✅
```
1. Login as file owner
2. Click download on a file
3. File should download successfully

Expected: ✅ Download works
Actual: _____
Status: [ ] Pass [ ] Fail
```

**Priority:** 🔴 **CRITICAL**
**Risk:** Authentication bypass
**Pass Criteria:** All 4 tests pass

---

### 2. Payment Webhook - SchoolId

**What was fixed:** Hardcoded `schoolId: "school-id"` → dynamic

**Test Cases:**

#### Test 2.1: Razorpay Payment Success ✅
```
1. Create a test payment order via Razorpay
2. Include schoolId in payment notes
3. Complete payment in Razorpay test mode
4. Webhook should process payment
5. Check database: feePayment record created
6. Verify schoolId matches the school from notes

Expected: ✅ Payment recorded with correct schoolId
Actual: _____
SchoolId: _____
Status: [ ] Pass [ ] Fail
```

#### Test 2.2: Payment Without SchoolId in Notes
```
1. Create payment order without schoolId in notes
2. Complete payment
3. Webhook should fetch schoolId from student record
4. Check database: feePayment record created
5. Verify schoolId from student record used

Expected: ✅ Fallback to student.schoolId works
Actual: _____
Warning logged: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

#### Test 2.3: Payment Update (Existing Payment) ✅
```
1. Create payment order (don't complete)
2. Payment record created as PENDING
3. Complete payment via Razorpay
4. Webhook should UPDATE existing record
5. Status should change to COMPLETED

Expected: ✅ Existing payment updated
Actual: _____
Status: [ ] Pass [ ] Fail
```

#### Test 2.4: Multi-School Payment Isolation
```
1. Create payments for School A student
2. Create payments for School B student
3. Login as School A admin
4. View payment reports
5. Should only see School A payments

Expected: ✅ Payments properly isolated
Actual: _____
Status: [ ] Pass [ ] Fail
```

**Priority:** 🔴 **CRITICAL**
**Risk:** Data integrity, wrong school charged
**Pass Criteria:** All 4 tests pass

---

### 3. Student-Parent Association - Validation

**What was fixed:** Added school validation, dynamic schoolId

**Test Cases:**

#### Test 3.1: Same School Association ✅
```
1. Login as admin of School A
2. Create parent account in School A
3. Create student account in School A
4. Associate parent with student
5. Should succeed

Expected: ✅ Association created
Actual: _____
Status: [ ] Pass [ ] Fail
```

#### Test 3.2: Cross-School Association ❌
```
1. Get parent ID from School A
2. Get student ID from School B
3. Try to associate via API:
   POST /api/students/associate-parent
   Body: { studentId: schoolBStudent, parentId: schoolAParent }
4. Should fail with 400 error

Expected: ❌ Error: "Parent and student must belong to the same school"
Actual: _____
Status: [ ] Pass [ ] Fail
```

#### Test 3.3: Non-Existent Student ❌
```
1. Try to associate with fake student ID
2. Should get 404 error

Expected: ❌ 404 "Student not found"
Actual: _____
Status: [ ] Pass [ ] Fail
```

#### Test 3.4: Primary Parent Update ✅
```
1. Associate parent as primary
2. Associate second parent as primary
3. First parent should no longer be primary
4. Only one primary parent allowed

Expected: ✅ Primary flag moved to new parent
Actual: _____
Status: [ ] Pass [ ] Fail
```

**Priority:** 🔴 **CRITICAL**
**Risk:** Cross-school data leakage
**Pass Criteria:** All 4 tests pass

---

### 4. Student Class Display - Dynamic Data

**What was fixed:** Hardcoded "Class 6" → fetch from enrollment

**Test Cases:**

#### Test 4.1: Student with Active Enrollment ✅
```
1. Login as student with active enrollment
2. Check student portal navigation
3. Should show actual class (e.g., "Class 10 A")

Expected: ✅ Shows actual class from enrollment
Actual: _____
Class displayed: _____
Status: [ ] Pass [ ] Fail
```

#### Test 4.2: Student without Enrollment
```
1. Create new student (no enrollment yet)
2. Login as that student
3. Should show "Student" as fallback

Expected: ✅ Shows "Student" (graceful fallback)
Actual: _____
Status: [ ] Pass [ ] Fail
```

#### Test 4.3: Multiple Enrollments (Edge Case)
```
1. Student with multiple enrollments (old + new)
2. Should show ACTIVE enrollment only
3. Check class display matches active enrollment

Expected: ✅ Shows current/active class only
Actual: _____
Status: [ ] Pass [ ] Fail
```

**Priority:** 🔴 **CRITICAL**
**Risk:** User confusion, wrong data displayed
**Pass Criteria:** All 3 tests pass

---

## 🟠 High Priority Tests (First Hour)

### 5. Error Monitoring - Sentry Integration

**Test Cases:**

#### Test 5.1: Error Logging (If Sentry Configured)
```
1. If NEXT_PUBLIC_SENTRY_DSN is set:
2. Trigger a test error (throw new Error('Test'))
3. Check Sentry dashboard
4. Error should appear with full context

Expected: ✅ Error logged to Sentry
Actual: _____
Sentry Link: _____
Status: [ ] Pass [ ] Fail [ ] N/A (Sentry not configured)
```

#### Test 5.2: Console Logging (Without Sentry)
```
1. If Sentry not configured:
2. Trigger an error
3. Check browser console
4. Error should be logged with context

Expected: ✅ Error logged to console
Actual: _____
Status: [ ] Pass [ ] Fail
```

**Priority:** 🟠 **HIGH**
**Pass Criteria:** At least one method working

---

### 6. Build and Deployment

**Test Cases:**

#### Test 6.1: TypeScript Compilation ✅
```bash
npm run build

Expected: ✓ Compiled successfully
Actual: _____
Status: [ ] Pass [ ] Fail
```

#### Test 6.2: No Runtime Errors
```
1. Navigate through all major pages:
   - /login
   - /admin/dashboard
   - /teacher/dashboard
   - /student/dashboard
   - /parent/dashboard
2. Check browser console for errors

Expected: ✅ No errors in console
Actual: _____
Errors found: _____
Status: [ ] Pass [ ] Fail
```

**Priority:** 🟠 **HIGH**
**Pass Criteria:** Both tests pass

---

## 🟡 Medium Priority Tests (First 24 Hours)

### 7. Multi-Tenancy - Data Isolation

**Test Cases:**

#### Test 7.1: Admin Can Only See Own School
```
1. Login as School A admin
2. Navigate to:
   - Students list
   - Teachers list
   - Fee reports
   - Attendance
3. Verify all data is from School A only

Expected: ✅ No cross-school data visible
Actual: _____
Status: [ ] Pass [ ] Fail
```

#### Test 7.2: Database Queries Have SchoolId
```
1. Enable database query logging
2. Perform CRUD operations
3. Check logs for WHERE clauses
4. All queries should filter by schoolId

Expected: ✅ All queries scoped by schoolId
Actual: _____
Status: [ ] Pass [ ] Fail
```

**Priority:** 🟡 **MEDIUM**
**Pass Criteria:** Both tests pass

---

### 8. Type Safety - No Runtime Type Errors

**Test Cases:**

#### Test 8.1: Settings Service Returns Correct Types
```
1. Fetch school settings
2. Access data management fields
3. Access notification fields
4. No undefined errors

Expected: ✅ All fields accessible
Actual: _____
Status: [ ] Pass [ ] Fail
```

**Priority:** 🟡 **MEDIUM**
**Pass Criteria:** Test passes

---

## 🟢 Low Priority Tests (First Week)

### 9. Performance Monitoring

**Test Cases:**

#### Test 9.1: Page Load Times
```
1. Measure page load times:
   - Dashboard: _____ ms
   - Student list: _____ ms
   - Fee reports: _____ ms
2. Should be < 3 seconds

Expected: ✅ All pages load in < 3s
Actual: _____
Status: [ ] Pass [ ] Fail
```

#### Test 9.2: API Response Times
```
1. Measure API response times:
   - GET /api/students: _____ ms
   - POST /api/students/associate-parent: _____ ms
2. Should be < 500ms

Expected: ✅ APIs respond in < 500ms
Actual: _____
Status: [ ] Pass [ ] Fail
```

**Priority:** 🟢 **LOW**
**Pass Criteria:** Acceptable performance

---

## 🔍 Regression Testing

### General Functionality

```
Test each major feature:

[ ] Login/Authentication
[ ] Student enrollment
[ ] Fee management
[ ] Attendance tracking
[ ] Exam management
[ ] Report cards
[ ] Communication (messages)
[ ] Parent portal
[ ] Teacher portal
[ ] Admin dashboard
[ ] File uploads/downloads
[ ] Profile management
[ ] Settings management
```

**Priority:** 🟡 **MEDIUM**
**Timeline:** First 24-48 hours

---

## 📊 Test Results Summary

### Critical Tests (Must Pass)

| Test | Status | Notes |
|------|--------|-------|
| R2 Authentication | [ ] Pass [ ] Fail | ____ |
| Payment Webhook | [ ] Pass [ ] Fail | ____ |
| Student Association | [ ] Pass [ ] Fail | ____ |
| Class Display | [ ] Pass [ ] Fail | ____ |

### High Priority Tests

| Test | Status | Notes |
|------|--------|-------|
| Error Monitoring | [ ] Pass [ ] Fail | ____ |
| Build & Deploy | [ ] Pass [ ] Fail | ____ |

### Overall Status

- Critical Tests Passed: _____ / 4
- High Priority Passed: _____ / 2
- Medium Priority Passed: _____ / 3
- Low Priority Passed: _____ / 2

**Ready for Production:** [ ] YES [ ] NO

---

## 🚨 Issue Tracking

### Issues Found

| # | Severity | Description | Status | Resolution |
|---|----------|-------------|--------|------------|
| 1 | | | [ ] Open [ ] Fixed | |
| 2 | | | [ ] Open [ ] Fixed | |
| 3 | | | [ ] Open [ ] Fixed | |

---

## 🎯 Sign-Off

### Testing Completed By

- **Tester Name:** _________________
- **Date:** _________________
- **Environment:** [ ] Staging [ ] Production
- **Version:** 348b5a3

### Approval

- **Developer:** _________________ (Date: ______)
- **QA Lead:** _________________ (Date: ______)
- **Product Owner:** _________________ (Date: ______)

**Production Deployment Approved:** [ ] YES [ ] NO

---

## 📞 Support

### If Tests Fail

1. **Document the failure** in Issues Found section
2. **Check logs** (browser console, server logs, Sentry)
3. **Review documentation** in PRODUCTION_READY_CHANGES.md
4. **Rollback if critical** using DEPLOY_NOW.md instructions

### Resources

- All changes: `PRODUCTION_READY_CHANGES.md`
- Deployment guide: `DEPLOY_NOW.md`
- Project review: `PROJECT_COMPREHENSIVE_REVIEW.md`

---

**Last Updated:** February 15, 2026
**Version:** 1.0
**Status:** Ready for testing
