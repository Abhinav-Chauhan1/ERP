# Pagination Implementation Guide

## Overview

This document describes the comprehensive pagination system implemented across all list views in the School ERP system. The implementation follows the requirement to display a maximum of 50 records per page for optimal performance.

## Architecture

### Components

1. **Pagination Component** (`src/components/shared/pagination.tsx`)
   - Reusable UI component for pagination controls
   - Supports mobile-responsive design
   - Includes items-per-page selector
   - Shows current page, total pages, and item counts

2. **Pagination Utilities** (`src/lib/utils/pagination.ts`)
   - `ITEMS_PER_PAGE`: Default constant set to 50
   - `getPaginationParams()`: Calculates skip/take values for Prisma
   - `createPaginationResult()`: Creates standardized pagination response

3. **Pagination Hook** (`src/hooks/use-pagination.ts`)
   - Client-side state management for pagination
   - URL parameter synchronization
   - Page navigation helpers

4. **List Actions** (`src/lib/actions/list-actions.ts`)
   - Server actions for paginated data fetching
   - Supports filtering and searching
   - Consistent API across all list types

## Usage

### Server-Side (Server Actions)

```typescript
import { getStudentsList } from "@/lib/actions/list-actions";

// Fetch paginated students
const result = await getStudentsList({
  page: 1,
  limit: 50,
  search: "john",
  classId: "class-123",
});

// Result structure:
// {
//   data: [...],
//   pagination: {
//     page: 1,
//     limit: 50,
//     total: 150,
//     totalPages: 3,
//     hasMore: true
//   }
// }
```

### Client-Side (React Components)

```typescript
"use client";

import { useState, useEffect } from "react";
import { Pagination } from "@/components/shared/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { getStudentsList } from "@/lib/actions/list-actions";

export default function StudentsPage() {
  const { page, limit, setPage, setLimit } = usePagination();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getStudentsList({ page, limit });
      setData(result);
      setLoading(false);
    }
    fetchData();
  }, [page, limit]);

  return (
    <div>
      {/* Render your list items */}
      {data?.data.map(item => <div key={item.id}>{item.name}</div>)}
      
      {/* Pagination controls */}
      <Pagination
        currentPage={data?.pagination.page}
        totalPages={data?.pagination.totalPages}
        totalItems={data?.pagination.total}
        itemsPerPage={data?.pagination.limit}
        onPageChange={setPage}
        onItemsPerPageChange={setLimit}
        showItemsPerPage
      />
    </div>
  );
}
```

## Available List Actions

### User Lists
- `getStudentsList()` - Paginated students with enrollment info
- `getTeachersList()` - Paginated teachers with subjects
- `getParentsList()` - Paginated parents with children

### Academic Lists
- `getAttendanceList()` - Paginated attendance records
- `getExamsList()` - Paginated exams with filters
- `getAssignmentsList()` - Paginated assignments

### Financial Lists
- `getFeePaymentsList()` - Paginated fee payments

### Communication Lists
- `getAnnouncementsList()` - Paginated announcements
- `getEventsList()` - Paginated events

## Features

### 1. Search and Filtering
All list actions support search and filtering:

```typescript
const result = await getStudentsList({
  page: 1,
  limit: 50,
  search: "john doe",
  classId: "class-123",
  status: "ACTIVE"
});
```

### 2. URL Parameter Synchronization
The `usePagination` hook automatically syncs with URL parameters:

```typescript
// URL: /students?page=2&limit=25
const { page, limit } = usePagination(); // page=2, limit=25
```

### 3. Mobile Responsive
The pagination component adapts to mobile screens:
- Hides page numbers on small screens
- Shows only prev/next buttons
- Maintains full functionality

### 4. Items Per Page Selection
Users can change the number of items displayed:

```typescript
<Pagination
  showItemsPerPage
  itemsPerPageOptions={[10, 25, 50, 100]}
  onItemsPerPageChange={setLimit}
/>
```

### 5. Performance Optimized
- Maximum 100 items per page enforced
- Database queries use skip/take for efficiency
- Composite indexes on frequently queried fields

## Database Optimization

### Indexes Added
The following composite indexes optimize pagination queries:

```prisma
model StudentAttendance {
  @@index([studentId, date])
  @@index([sectionId, date, status])
}

model ExamResult {
  @@index([studentId, examId])
  @@index([examId, marks])
}

model FeePayment {
  @@index([studentId, status, paymentDate])
}
```

## Example Pages

Example implementations are available at:
- `/admin/users/students` - Students list
- `/admin/users/teachers` - Teachers list
- `/admin/users/parents` - Parents list
- `/admin/attendance/list` - Attendance records
- `/admin/finance/fees/list` - Fee payments
- `/admin/assessment/exams/list` - Exams list

## Best Practices

### 1. Always Use Pagination for Lists
```typescript
// ❌ Bad: Fetching all records
const students = await db.student.findMany();

// ✅ Good: Using pagination
const result = await getStudentsList({ page: 1, limit: 50 });
```

### 2. Include Total Count
Always return total count for accurate pagination:

```typescript
const total = await db.student.count({ where });
const students = await db.student.findMany({ where, skip, take });
return createPaginationResult(students, total, page, limit);
```

### 3. Use Debounced Search
Prevent excessive queries when searching:

```typescript
import { useDebounce } from "@/hooks/use-debounce";

const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  fetchData(debouncedSearch);
}, [debouncedSearch]);
```

### 4. Show Loading States
Provide feedback during data fetching:

```typescript
{loading ? (
  <Skeleton />
) : (
  <DataList data={data} />
)}
```

### 5. Handle Empty States
Display helpful messages when no data exists:

```typescript
{data?.data.length === 0 ? (
  <div>No records found</div>
) : (
  <DataList data={data.data} />
)}
```

## Performance Metrics

With pagination implemented:
- Page load time: < 2 seconds (Requirement 1.1)
- Query execution: < 500ms (Requirement 1.2)
- Maximum records per page: 50 (Requirement 1.5)
- Concurrent user support: 100+ users (Requirement 1.4)

## Testing

### Unit Tests
Test pagination utilities:

```typescript
import { getPaginationParams, createPaginationResult } from "@/lib/utils/pagination";

test("getPaginationParams calculates correct skip/take", () => {
  const { skip, take } = getPaginationParams(2, 50);
  expect(skip).toBe(50);
  expect(take).toBe(50);
});
```

### Integration Tests
Test list actions with pagination:

```typescript
test("getStudentsList returns paginated results", async () => {
  const result = await getStudentsList({ page: 1, limit: 10 });
  expect(result.data.length).toBeLessThanOrEqual(10);
  expect(result.pagination.page).toBe(1);
  expect(result.pagination.limit).toBe(10);
});
```

## Migration Guide

### Updating Existing List Pages

1. **Import pagination utilities:**
```typescript
import { Pagination } from "@/components/shared/pagination";
import { usePagination } from "@/hooks/use-pagination";
```

2. **Add pagination state:**
```typescript
const { page, limit, setPage, setLimit } = usePagination();
```

3. **Update data fetching:**
```typescript
const result = await getStudentsList({ page, limit });
```

4. **Add pagination component:**
```typescript
<Pagination
  currentPage={data.pagination.page}
  totalPages={data.pagination.totalPages}
  onPageChange={setPage}
/>
```

## Troubleshooting

### Issue: Pagination not working
**Solution:** Ensure URL parameters are being read correctly. Check that `useUrlParams` is set to `true` in `usePagination()`.

### Issue: Slow queries
**Solution:** Verify database indexes are created. Run `npx prisma db push` to apply schema changes.

### Issue: Incorrect page count
**Solution:** Ensure total count query uses the same `where` clause as the data query.

## Future Enhancements

- [ ] Cursor-based pagination for very large datasets
- [ ] Virtual scrolling for infinite lists
- [ ] Pagination state persistence in localStorage
- [ ] Export paginated data to CSV/Excel
- [ ] Advanced filtering UI components

## Related Documentation

- [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION_COMPLETE.md)
- [Database Optimization](./DATABASE_OPTIMIZATION.md)
- [Query Optimization Guide](../src/lib/utils/query-optimization-guide.md)

## Support

For questions or issues with pagination:
1. Check this documentation
2. Review example implementations
3. Consult the development team
