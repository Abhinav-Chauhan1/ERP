# School Isolation Fix Template

## Quick Fix Guide

For each action file that needs fixing, follow these steps:

### Step 1: Add School Context Import

At the top of the function that queries the database:

```typescript
// Get required school context
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();
```

### Step 2: Add schoolId to Where Clause

For `findMany`, `findFirst`, `findUnique` queries:

```typescript
// Before
const data = await db.model.findMany({
  where: {
    // other filters
  }
});

// After
const data = await db.model.findMany({
  where: {
    schoolId, // CRITICAL: Filter by current school
    // other filters
  }
});
```

### Step 3: Handle Related Entities

For queries with includes/relations:

```typescript
// If the main model doesn't have schoolId, filter through relation
const data = await db.examResult.findMany({
  where: {
    exam: {
      schoolId // Filter through exam relation
    }
  }
});
```

### Step 4: Handle Nested Queries

For nested where clauses:

```typescript
const data = await db.model.findMany({
  where: {
    AND: [
      { schoolId }, // Add schoolId filter
      { /* other conditions */ }
    ]
  }
});
```

### Step 5: Update Count Queries

```typescript
// Before
const count = await db.model.count({
  where: {
    // filters
  }
});

// After
const count = await db.model.count({
  where: {
    schoolId,
    // filters
  }
});
```

### Step 6: Update Aggregations

```typescript
// Before
const result = await db.model.groupBy({
  by: ['field'],
  where: {
    // filters
  }
});

// After
const result = await db.model.groupBy({
  by: ['field'],
  where: {
    schoolId,
    // filters
  }
});
```

## Common Patterns

### Pattern 1: Student Queries

```typescript
const students = await db.student.findMany({
  where: {
    schoolId, // Students have schoolId
    // other filters
  }
});
```

### Pattern 2: Exam/Result Queries

```typescript
const exams = await db.exam.findMany({
  where: {
    schoolId, // Exams have schoolId
    // other filters
  }
});

const results = await db.examResult.findMany({
  where: {
    exam: {
      schoolId // Filter through exam relation
    }
  }
});
```

### Pattern 3: Teacher Queries

```typescript
const teachers = await db.teacher.findMany({
  where: {
    schoolId, // Teachers have schoolId
    // other filters
  }
});
```

### Pattern 4: Class/Section Queries

```typescript
const classes = await db.class.findMany({
  where: {
    schoolId, // Classes have schoolId
    // other filters
  }
});
```

### Pattern 5: Attendance Queries

```typescript
const attendance = await db.studentAttendance.findMany({
  where: {
    student: {
      schoolId // Filter through student relation
    }
  }
});
```

## Special Cases

### Super-Admin Context

If the function should work for super-admins across all schools:

```typescript
const session = await auth();
const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

const where: any = {};

if (!isSuperAdmin) {
  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
  const schoolId = await getRequiredSchoolId();
  where.schoolId = schoolId;
}
```

### Optional School Context

If school context might not be available:

```typescript
try {
  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
  const schoolId = await getRequiredSchoolId();
  where.schoolId = schoolId;
} catch (error) {
  // Handle case where school context is not available
  // This might be legitimate for some global operations
}
```

## Testing Checklist

After fixing each file:

- [ ] Create test data for School A
- [ ] Create test data for School B
- [ ] Login as admin from School A
- [ ] Verify only School A's data is visible
- [ ] Login as admin from School B
- [ ] Verify only School B's data is visible
- [ ] Verify no cross-school data leakage
- [ ] Test all filters and search functionality
- [ ] Test pagination
- [ ] Test sorting

## Verification Query

Run this SQL to verify data isolation:

```sql
-- Check if query results are properly filtered
SELECT 
    'ModelName' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT "schoolId") as schools_in_results
FROM "ModelName"
WHERE "schoolId" = 'current-school-id';

-- Should return only 1 school in results
```

## Common Mistakes to Avoid

1. ❌ Forgetting to add schoolId to nested queries
2. ❌ Not handling relations properly
3. ❌ Missing schoolId in count/aggregate queries
4. ❌ Not testing with multiple schools
5. ❌ Assuming super-admin needs school filtering
6. ❌ Not updating all query types (findMany, count, groupBy, etc.)

## Documentation

After fixing, update:
1. Function comments to mention school isolation
2. API documentation
3. Test files
4. Related documentation

## Example: Complete Fix

**Before:**
```typescript
export async function getStudentAttendance(studentId: string) {
  const attendance = await db.studentAttendance.findMany({
    where: {
      studentId
    }
  });
  return attendance;
}
```

**After:**
```typescript
export async function getStudentAttendance(studentId: string) {
  // Get required school context
  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
  const schoolId = await getRequiredSchoolId();
  
  const attendance = await db.studentAttendance.findMany({
    where: {
      studentId,
      student: {
        schoolId // CRITICAL: Ensure student belongs to current school
      }
    }
  });
  return attendance;
}
```
