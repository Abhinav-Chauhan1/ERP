# School Isolation P1 High-Priority Fixes - Implementation Plan

**Date**: February 8, 2026  
**Priority**: P1 - HIGH (Fix Within 24 Hours)  
**Status**: IN PROGRESS

## Overview

This document outlines the plan to fix 15 P1 high-priority files where school isolation is missing. These files handle operational data that must be isolated by school.

## P1 Files to Fix (15 Total)

### Teacher-Related Files (4 files)

#### 1. teacherStudentsActions.ts ⚠️ IN PROGRESS
**Location**: `src/lib/actions/teacherStudentsActions.ts`  
**Issue**: Teachers can see students from other schools  
**Functions to Fix**: 5
- `getTeacherStudents` - Add schoolId to teacher and student queries
- `getStudentDetails` - Add schoolId to student and enrollment queries
- `getClassStudents` - Add schoolId to class and student queries
- `getTeacherStudentsPerformance` - Add schoolId to all aggregation queries
- All helper queries need schoolId filters

**Fix Pattern**:
```typescript
// At start of each function
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();

// Add to teacher query
const teacher = await db.teacher.findFirst({
  where: {
    schoolId, // Add this
    user: { id: userId }
  }
});

// Add to all student queries
const students = await db.student.findMany({
  where: {
    schoolId, // Add this
    enrollments: { /* ... */ }
  }
});

// Add to class queries
const classes = await db.class.findMany({
  where: {
    schoolId, // Add this
  }
});
```

#### 2. teacherResultsActions.ts
**Location**: `src/lib/actions/teacherResultsActions.ts`  
**Issue**: Teacher results view shows all schools  
**Functions to Fix**: 6
- `getTeacherResults` - Add schoolId to exam and assignment queries
- `getExamResultDetails` - Add schoolId to exam lookup
- `getAssignmentResultDetails` - Add schoolId to assignment lookup
- `updateExamResults` - Add schoolId verification
- `getStudentPerformanceData` - Add schoolId to all queries
- `getClassPerformanceData` - Add schoolId to class and student queries

#### 3. teacherDashboardActions.ts
**Location**: `src/lib/actions/teacherDashboardActions.ts`  
**Issue**: Dashboard shows data from all schools  
**Functions to Fix**: 7
- `getTotalStudents` - Add schoolId to enrollment count
- `getPendingAssignments` - Add schoolId to assignment queries
- `getUpcomingExams` - Add schoolId to exam queries
- `getTodaysClasses` - Add schoolId to timetable queries
- `getRecentAnnouncements` - Add schoolId to announcement queries
- `getUnreadMessagesCount` - Add schoolId verification
- `getTeacherDashboardData` - Add schoolId to all aggregated queries

#### 4. teacherTimetableActions.ts
**Location**: `src/lib/actions/teacherTimetableActions.ts`  
**Issue**: Timetable data not isolated  
**Functions to Fix**: Estimate 3-5
- All timetable queries need schoolId filters
- Class and section lookups need schoolId
- Teacher verification needs schoolId

### Parent-Related Files (4 files)

#### 5. parent-performance-actions.ts
**Location**: `src/lib/actions/parent-performance-actions.ts`  
**Issue**: Parents can see other schools' data  
**Functions to Fix**: Estimate 4-6
- All student performance queries need schoolId
- Child verification needs schoolId
- Exam and assignment queries need schoolId

#### 6. parent-academic-actions.ts
**Location**: `src/lib/actions/parent-academic-actions.ts`  
**Issue**: Academic records not isolated  
**Functions to Fix**: Estimate 4-6
- Subject data queries need schoolId
- Grade queries need schoolId
- Report card queries need schoolId

#### 7. parent-attendance-actions.ts
**Location**: `src/lib/actions/parent-attendance-actions.ts`  
**Issue**: Attendance data not isolated  
**Functions to Fix**: Estimate 3-5
- Attendance record queries need schoolId
- Child verification needs schoolId
- Summary queries need schoolId

#### 8. parent-document-actions.ts
**Location**: `src/lib/actions/parent-document-actions.ts`  
**Issue**: Documents not isolated by school  
**Functions to Fix**: Estimate 3-5
- Document queries need schoolId
- File access verification needs schoolId
- Upload/download needs schoolId check

### Student-Related Files (1 file)

#### 9. student-performance-actions.ts
**Location**: `src/lib/actions/student-performance-actions.ts`  
**Issue**: Student performance across schools  
**Functions to Fix**: Estimate 4-6
- Performance queries need schoolId
- Exam result queries need schoolId
- Assignment queries need schoolId
- Subject performance needs schoolId

### Messaging-Related Files (2 files)

#### 10. bulkMessagingActions.ts
**Location**: `src/lib/actions/bulkMessagingActions.ts`  
**Issue**: Messages can be sent across schools  
**Functions to Fix**: Estimate 4-6
- Recipient list queries need schoolId
- Message sending needs schoolId verification
- Template queries need schoolId
- Analytics queries need schoolId

#### 11. messageAnalyticsActions.ts
**Location**: `src/lib/actions/messageAnalyticsActions.ts`  
**Issue**: Message analytics show all schools  
**Functions to Fix**: Estimate 3-5
- All analytics queries need schoolId
- Message history needs schoolId
- Delivery stats need schoolId

### List/Filter Files (4 files)

#### 12. list-actions.ts
**Location**: `src/lib/actions/list-actions.ts`  
**Issue**: Student/teacher lists show all schools  
**Functions to Fix**: Estimate 5-10
- All list queries need schoolId
- Student lists need schoolId
- Teacher lists need schoolId
- Parent lists need schoolId
- Staff lists need schoolId

#### 13. students-filters.ts
**Location**: `src/lib/actions/students-filters.ts`  
**Issue**: Filter options show all schools  
**Functions to Fix**: Estimate 3-5
- Class filter options need schoolId
- Section filter options need schoolId
- Subject filter options need schoolId
- All dropdown data needs schoolId

#### 14. teachers-filters.ts
**Location**: `src/lib/actions/teachers-filters.ts`  
**Issue**: Filter options show all schools  
**Functions to Fix**: Estimate 3-5
- Department filter options need schoolId
- Subject filter options need schoolId
- Class filter options need schoolId
- All dropdown data needs schoolId

#### 15. parents-filters.ts
**Location**: `src/lib/actions/parents-filters.ts`  
**Issue**: Filter options show all schools  
**Functions to Fix**: Estimate 3-5
- Student filter options need schoolId
- Class filter options need schoolId
- All dropdown data needs schoolId

## Implementation Strategy

### Phase 1: Teacher Files (Priority 1)
**Timeline**: 4-6 hours  
**Files**: 1-4  
**Reason**: Teachers are primary users, high impact

1. Fix teacherStudentsActions.ts
2. Fix teacherResultsActions.ts
3. Fix teacherDashboardActions.ts
4. Fix teacherTimetableActions.ts

### Phase 2: Parent Files (Priority 2)
**Timeline**: 3-4 hours  
**Files**: 5-8  
**Reason**: Parent portal is customer-facing

1. Fix parent-performance-actions.ts
2. Fix parent-academic-actions.ts
3. Fix parent-attendance-actions.ts
4. Fix parent-document-actions.ts

### Phase 3: Student & Messaging (Priority 3)
**Timeline**: 3-4 hours  
**Files**: 9-11  
**Reason**: Student portal and communication

1. Fix student-performance-actions.ts
2. Fix bulkMessagingActions.ts
3. Fix messageAnalyticsActions.ts

### Phase 4: List/Filter Files (Priority 4)
**Timeline**: 2-3 hours  
**Files**: 12-15  
**Reason**: Supporting functionality

1. Fix list-actions.ts
2. Fix students-filters.ts
3. Fix teachers-filters.ts
4. Fix parents-filters.ts

## Standard Fix Pattern

For every function in these files:

```typescript
export async function functionName(params) {
  try {
    // STEP 1: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // STEP 2: Get user/session (if needed)
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // STEP 3: Add schoolId to ALL database queries
    const data = await db.model.findMany({
      where: {
        schoolId, // CRITICAL: Add this
        // ... other filters
      }
    });

    // STEP 4: Add schoolId to related queries
    const related = await db.relatedModel.findMany({
      where: {
        schoolId, // CRITICAL: Add this
        modelId: data.id
      }
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
```

## Testing Checklist

For each fixed file:

- [ ] TypeScript compilation passes
- [ ] All functions have schoolId filter
- [ ] Test with School A - only sees School A data
- [ ] Test with School B - only sees School B data
- [ ] No cross-school data leakage
- [ ] All features work correctly
- [ ] Performance is acceptable

## Estimated Total Time

- **Phase 1**: 4-6 hours (Teacher files)
- **Phase 2**: 3-4 hours (Parent files)
- **Phase 3**: 3-4 hours (Student & Messaging)
- **Phase 4**: 2-3 hours (List/Filter files)

**Total**: 12-17 hours (1.5-2 working days)

## Success Criteria

- [ ] All 15 P1 files fixed
- [ ] All functions have schoolId filters
- [ ] Tests passing for all files
- [ ] No cross-school data leakage
- [ ] Performance maintained
- [ ] Documentation updated

## Related Documentation

- `scripts/fix-school-isolation-template.md` - Fix pattern guide
- `docs/SCHOOL_ISOLATION_P0_FIXES_COMPLETE.md` - P0 fixes reference
- `URGENT_SECURITY_AUDIT_SUMMARY.md` - Overall audit summary

## Progress Tracking

| File | Status | Functions Fixed | Tested | Notes |
|------|--------|----------------|--------|-------|
| teacherStudentsActions.ts | ⚠️ In Progress | 1/5 | ❌ | Started |
| teacherResultsActions.ts | ⏳ Pending | 0/6 | ❌ | - |
| teacherDashboardActions.ts | ⏳ Pending | 0/7 | ❌ | - |
| teacherTimetableActions.ts | ⏳ Pending | 0/5 | ❌ | - |
| parent-performance-actions.ts | ⏳ Pending | 0/5 | ❌ | - |
| parent-academic-actions.ts | ⏳ Pending | 0/5 | ❌ | - |
| parent-attendance-actions.ts | ⏳ Pending | 0/4 | ❌ | - |
| parent-document-actions.ts | ⏳ Pending | 0/4 | ❌ | - |
| student-performance-actions.ts | ⏳ Pending | 0/5 | ❌ | - |
| bulkMessagingActions.ts | ⏳ Pending | 0/5 | ❌ | - |
| messageAnalyticsActions.ts | ⏳ Pending | 0/4 | ❌ | - |
| list-actions.ts | ⏳ Pending | 0/8 | ❌ | - |
| students-filters.ts | ⏳ Pending | 0/4 | ❌ | - |
| teachers-filters.ts | ⏳ Pending | 0/4 | ❌ | - |
| parents-filters.ts | ⏳ Pending | 0/4 | ❌ | - |

**Total Progress**: 1/~75 functions (1%)

---

**Next Action**: Continue fixing teacherStudentsActions.ts, then proceed with remaining teacher files.

**Last Updated**: February 8, 2026, 7:00 PM IST
