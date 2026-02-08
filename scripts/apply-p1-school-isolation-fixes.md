# P1 School Isolation Fixes - Application Guide

This guide provides the exact changes needed for each P1 file.

## Standard Fix Pattern

For EVERY exported async function in these files:

```typescript
export async function functionName(params) {
  try {
    // ADD THIS AT THE START
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Rest of function...
    const session = await auth();
    // ...

    // ADD schoolId to ALL database queries:
    const data = await db.model.findMany({
      where: {
        schoolId, // ADD THIS LINE
        // ... other filters
      }
    });
  }
}
```

## Files to Fix

### 1. teacherResultsActions.ts

**Functions**: 6 total

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to these queries:
- `db.teacher.findFirst` - Add `schoolId` to where clause
- `db.exam.findMany` - Add `schoolId` to where clause
- `db.exam.findUnique` - Add `schoolId` to where clause
- `db.assignment.findMany` - Add `schoolId` to where clause
- `db.assignment.findUnique` - Add `schoolId` to where clause
- `db.subject.findMany` - Add `schoolId` to where clause
- `db.class.findMany` - Add `schoolId` to where clause
- `db.student.findMany` - Add `schoolId` to where clause

### 2. teacherDashboardActions.ts

**Functions**: 7 total

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to these queries:
- `db.classEnrollment.count` - Add `schoolId` to where clause
- `db.assignment.findMany` - Add `schoolId` to where clause
- `db.exam.findMany` - Add `schoolId` to where clause
- `db.timetableSlot.findMany` - Add `schoolId` to where clause
- `db.announcement.findMany` - Add `schoolId` to where clause
- `db.teacher.findUnique` - Add `schoolId` to where clause
- `db.message.count` - Add `schoolId` verification
- `db.studentAttendance.findMany` - Add `schoolId` to where clause
- `db.lesson.findMany` - Add `schoolId` to where clause
- `db.class.findMany` - Add `schoolId` to where clause

### 3. teacherTimetableActions.ts

**Functions**: Estimate 5

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to ALL database queries.

### 4. parent-performance-actions.ts

**Functions**: Estimate 5

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to these queries:
- `db.parent.findFirst` - Add `schoolId` to where clause
- `db.student.findMany` - Add `schoolId` to where clause
- `db.examResult.findMany` - Add `schoolId` to where clause
- `db.assignment.findMany` - Add `schoolId` to where clause
- All child verification queries

### 5. parent-academic-actions.ts

**Functions**: Estimate 5

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to ALL database queries.

### 6. parent-attendance-actions.ts

**Functions**: Estimate 4

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to ALL database queries.

### 7. parent-document-actions.ts

**Functions**: Estimate 4

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to ALL database queries.

### 8. student-performance-actions.ts

**Functions**: Estimate 5

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to ALL database queries.

### 9. bulkMessagingActions.ts

**Functions**: Estimate 5

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to these queries:
- Recipient list queries
- Message template queries
- Message sending queries
- Analytics queries

### 10. messageAnalyticsActions.ts

**Functions**: Estimate 4

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to ALL database queries.

### 11. list-actions.ts

**Functions**: Estimate 8

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to ALL list queries:
- Student lists
- Teacher lists
- Parent lists
- Staff lists
- All filter queries

### 12. students-filters.ts

**Functions**: Estimate 4

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to ALL filter option queries.

### 13. teachers-filters.ts

**Functions**: Estimate 4

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to ALL filter option queries.

### 14. parents-filters.ts

**Functions**: Estimate 4

Add to ALL functions:
```typescript
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

Add `schoolId` to ALL filter option queries.

## Testing After Each Fix

```bash
# 1. TypeScript compilation
npm run build

# 2. Run tests
npm test

# 3. Manual testing
# - Login as School A
# - Test all features in the fixed file
# - Verify only School A data is shown
# - Login as School B
# - Verify only School B data is shown
# - Verify no cross-school data leakage
```

## Verification Checklist

For each file:
- [ ] All exported functions have `getRequiredSchoolId()`
- [ ] All database queries have `schoolId` filter
- [ ] TypeScript compiles without errors
- [ ] Tests pass
- [ ] Manual testing confirms data isolation
- [ ] No performance degradation

## Common Patterns

### Pattern 1: Teacher Lookup
```typescript
const teacher = await db.teacher.findFirst({
  where: {
    schoolId, // ADD THIS
    user: { id: userId }
  }
});
```

### Pattern 2: Student Lookup
```typescript
const students = await db.student.findMany({
  where: {
    schoolId, // ADD THIS
    // ... other filters
  }
});
```

### Pattern 3: Class Lookup
```typescript
const classes = await db.class.findMany({
  where: {
    schoolId, // ADD THIS
    // ... other filters
  }
});
```

### Pattern 4: Nested Relations
```typescript
const data = await db.model.findMany({
  where: {
    schoolId, // ADD THIS
    relatedModel: {
      schoolId, // ADD THIS TOO
      // ... other filters
    }
  }
});
```

## Priority Order

1. **Teacher files** (highest user impact)
2. **Parent files** (customer-facing)
3. **Student & Messaging** (communication)
4. **List/Filter files** (supporting)

---

**Remember**: EVERY database query MUST have `schoolId` filter!
