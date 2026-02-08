# P1 School Isolation Testing Checklist

**Date**: February 8, 2026  
**Purpose**: Verify all P1 school isolation fixes work correctly

---

## 🎯 Testing Objective

Verify that each school can ONLY see their own data across all P1 features.

---

## 🔧 Test Setup

### Prerequisites
1. Two test schools in database:
   - School A (e.g., "Test School Alpha")
   - School B (e.g., "Test School Beta")

2. Test users for each school:
   - Admin user for School A
   - Admin user for School B
   - Teacher user for School A
   - Teacher user for School B
   - Parent user for School A
   - Parent user for School B
   - Student user for School A
   - Student user for School B

3. Test data for each school:
   - Students, teachers, parents
   - Classes, subjects, exams
   - Attendance records
   - Assignments, announcements

---

## ✅ Test Cases

### 1. Teacher Portal Tests

#### Test 1.1: Teacher Students List
- [ ] Login as School A teacher
- [ ] Navigate to students page
- [ ] Verify: Only School A students visible
- [ ] Login as School B teacher
- [ ] Navigate to students page
- [ ] Verify: Only School B students visible

#### Test 1.2: Teacher Dashboard
- [ ] Login as School A teacher
- [ ] Check dashboard stats
- [ ] Verify: Only School A data (students, assignments, exams)
- [ ] Login as School B teacher
- [ ] Check dashboard stats
- [ ] Verify: Only School B data

#### Test 1.3: Teacher Results
- [ ] Login as School A teacher
- [ ] View exam results
- [ ] Verify: Only School A students and exams
- [ ] Login as School B teacher
- [ ] View exam results
- [ ] Verify: Only School B students and exams

#### Test 1.4: Teacher Timetable
- [ ] Login as School A teacher
- [ ] View timetable
- [ ] Verify: Only School A classes and subjects
- [ ] Login as School B teacher
- [ ] View timetable
- [ ] Verify: Only School B classes and subjects

---

### 2. Parent Portal Tests

#### Test 2.1: Parent Performance
- [ ] Login as School A parent
- [ ] View child's exam results
- [ ] Verify: Only School A child's data
- [ ] Login as School B parent
- [ ] View child's exam results
- [ ] Verify: Only School B child's data

#### Test 2.2: Parent Academic
- [ ] Login as School A parent
- [ ] View child's homework/assignments
- [ ] Verify: Only School A assignments
- [ ] Login as School B parent
- [ ] View child's homework/assignments
- [ ] Verify: Only School B assignments

#### Test 2.3: Parent Attendance
- [ ] Login as School A parent
- [ ] View child's attendance
- [ ] Verify: Only School A attendance records
- [ ] Login as School B parent
- [ ] View child's attendance
- [ ] Verify: Only School B attendance records

#### Test 2.4: Parent Documents
- [ ] Login as School A parent
- [ ] View child's documents
- [ ] Verify: Only School A documents
- [ ] Login as School B parent
- [ ] View child's documents
- [ ] Verify: Only School B documents

---

### 3. Student Portal Tests

#### Test 3.1: Student Performance
- [ ] Login as School A student
- [ ] View performance summary
- [ ] Verify: Only School A data (exams, grades, rank)
- [ ] Login as School B student
- [ ] View performance summary
- [ ] Verify: Only School B data

#### Test 3.2: Student Subject Performance
- [ ] Login as School A student
- [ ] View subject-wise performance
- [ ] Verify: Only School A subjects and exams
- [ ] Login as School B student
- [ ] View subject-wise performance
- [ ] Verify: Only School B subjects and exams

#### Test 3.3: Student Trends
- [ ] Login as School A student
- [ ] View performance trends
- [ ] Verify: Only School A terms and exams
- [ ] Login as School B student
- [ ] View performance trends
- [ ] Verify: Only School B terms and exams

---

### 4. Admin Lists Tests

#### Test 4.1: Students List
- [ ] Login as School A admin
- [ ] Navigate to students list
- [ ] Verify: Only School A students
- [ ] Apply filters (class, section)
- [ ] Verify: Only School A options in filters
- [ ] Login as School B admin
- [ ] Navigate to students list
- [ ] Verify: Only School B students

#### Test 4.2: Teachers List
- [ ] Login as School A admin
- [ ] Navigate to teachers list
- [ ] Verify: Only School A teachers
- [ ] Apply filters (subject)
- [ ] Verify: Only School A subjects in filters
- [ ] Login as School B admin
- [ ] Navigate to teachers list
- [ ] Verify: Only School B teachers

#### Test 4.3: Parents List
- [ ] Login as School A admin
- [ ] Navigate to parents list
- [ ] Verify: Only School A parents
- [ ] Apply filters
- [ ] Verify: Only School A data in filters
- [ ] Login as School B admin
- [ ] Navigate to parents list
- [ ] Verify: Only School B parents

#### Test 4.4: Other Lists
- [ ] Test attendance list (School A vs B)
- [ ] Test fee payments list (School A vs B)
- [ ] Test exams list (School A vs B)
- [ ] Test assignments list (School A vs B)
- [ ] Test announcements list (School A vs B)
- [ ] Test events list (School A vs B)

---

### 5. Bulk Messaging Tests

#### Test 5.1: Bulk Message to Class
- [ ] Login as School A admin
- [ ] Navigate to bulk messaging
- [ ] Select "Send to Class"
- [ ] Verify: Only School A classes in dropdown
- [ ] Preview recipients
- [ ] Verify: Only School A parents
- [ ] Login as School B admin
- [ ] Repeat above steps
- [ ] Verify: Only School B data

#### Test 5.2: Bulk Message to All Parents
- [ ] Login as School A admin
- [ ] Select "Send to All Parents"
- [ ] Preview recipients
- [ ] Verify: Only School A parents
- [ ] Login as School B admin
- [ ] Repeat above steps
- [ ] Verify: Only School B parents

#### Test 5.3: Bulk Message Stats
- [ ] Login as School A admin
- [ ] View messaging stats
- [ ] Verify: Only School A user counts
- [ ] Login as School B admin
- [ ] View messaging stats
- [ ] Verify: Only School B user counts

---

### 6. Filter Options Tests

#### Test 6.1: Student Filters
- [ ] Login as School A admin
- [ ] Open student filter dropdown
- [ ] Verify: Only School A classes and sections
- [ ] Login as School B admin
- [ ] Open student filter dropdown
- [ ] Verify: Only School B classes and sections

#### Test 6.2: Teacher Filters
- [ ] Login as School A admin
- [ ] Open teacher filter dropdown
- [ ] Verify: Only School A subjects
- [ ] Login as School B admin
- [ ] Open teacher filter dropdown
- [ ] Verify: Only School B subjects

#### Test 6.3: Parent Filters
- [ ] Login as School A admin
- [ ] Open parent filter dropdown
- [ ] Verify: Only School A occupations
- [ ] Login as School B admin
- [ ] Open parent filter dropdown
- [ ] Verify: Only School B occupations

---

## 🚨 Critical Test Scenarios

### Scenario 1: Cross-School Data Leakage
- [ ] Login as School A admin
- [ ] Try to access School B student by direct URL manipulation
- [ ] Expected: Access denied or 404
- [ ] Verify: No School B data visible anywhere

### Scenario 2: Filter Bypass Attempt
- [ ] Login as School A admin
- [ ] Try to filter by School B class ID (if known)
- [ ] Expected: No results or error
- [ ] Verify: Cannot see School B data

### Scenario 3: Bulk Message Isolation
- [ ] Login as School A admin
- [ ] Send bulk message to "All Parents"
- [ ] Verify: Only School A parents receive message
- [ ] Check School B parents
- [ ] Verify: Did NOT receive message

---

## 📊 Test Results Template

### Test Summary
- **Date**: ___________
- **Tester**: ___________
- **Environment**: Development / Staging / Production

### Results
- Total Tests: 50+
- Passed: ___
- Failed: ___
- Blocked: ___

### Issues Found
1. Issue description
   - Severity: Critical / High / Medium / Low
   - Steps to reproduce
   - Expected vs Actual

### Sign-off
- [ ] All critical tests passed
- [ ] No cross-school data leakage detected
- [ ] Ready for production deployment

---

## 🎯 Success Criteria

✅ **PASS**: All tests pass with 100% data isolation  
❌ **FAIL**: Any cross-school data visible  
⚠️ **REVIEW**: Any unexpected behavior

---

## 📝 Notes

- Test each feature thoroughly
- Document any edge cases
- Report any issues immediately
- Retest after fixes

---

**Created**: February 8, 2026, 10:15 PM IST  
**Status**: Ready for Testing  
**Priority**: Critical
