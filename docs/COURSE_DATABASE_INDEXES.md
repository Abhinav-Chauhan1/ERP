# Course Database Indexes - Performance Optimization

## Overview

This document explains the database indexing strategy for the Learning Management System (LMS) course functionality, specifically for student course enrollment and lesson progress tracking.

## Index Strategy

All necessary indexes for optimal query performance were created in migration `20251122094944_add_lms_models` and verified in migration `20251124073832_verify_course_indexes`.

## Indexes by Table

### 1. CourseEnrollment Table

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `course_enrollments_studentId_status_idx` | (studentId, status) | Composite | Get all enrollments for a student, filtered by status |
| `course_enrollments_courseId_status_idx` | (courseId, status) | Composite | Get all enrollments for a course, filtered by status |
| `course_enrollments_courseId_studentId_key` | (courseId, studentId) | Unique | Prevent duplicate enrollments, fast lookup |

**Query Patterns Covered:**
- ✅ Get all active enrollments for a student
- ✅ Get all enrollments for a course
- ✅ Check if student is enrolled in a course
- ✅ Count enrollments by status

### 2. LessonProgress Table

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `lesson_progress_enrollmentId_status_idx` | (enrollmentId, status) | Composite | Get all lesson progress for an enrollment, filtered by status |
| `lesson_progress_lessonId_idx` | (lessonId) | Single | Get all progress records for a lesson |
| `lesson_progress_enrollmentId_lessonId_key` | (enrollmentId, lessonId) | Unique | Prevent duplicate progress records, fast lookup |

**Query Patterns Covered:**
- ✅ Get all lesson progress for an enrollment
- ✅ Count completed lessons for an enrollment
- ✅ Get progress for a specific lesson
- ✅ Calculate course completion percentage

### 3. Course Table

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `courses_teacherId_idx` | (teacherId) | Single | Get all courses by teacher |
| `courses_subjectId_idx` | (subjectId) | Single | Get all courses by subject |
| `courses_classId_idx` | (classId) | Single | Get all courses by class |
| `courses_status_isPublished_idx` | (status, isPublished) | Composite | Get published courses efficiently |

**Query Patterns Covered:**
- ✅ Get all published courses
- ✅ Get courses by teacher
- ✅ Get courses by subject
- ✅ Get courses by class

### 4. CourseModule Table

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `course_modules_courseId_sequence_idx` | (courseId, sequence) | Composite | Get modules for a course in order |

**Query Patterns Covered:**
- ✅ Get all modules for a course in sequence order
- ✅ Find next/previous module

### 5. CourseLesson Table

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `course_lessons_moduleId_sequence_idx` | (moduleId, sequence) | Composite | Get lessons for a module in order |

**Query Patterns Covered:**
- ✅ Get all lessons for a module in sequence order
- ✅ Find next/previous lesson

## Query Performance Analysis

### Critical Queries from student-course-actions.ts

#### 1. Get Course with Enrollment Status
```typescript
const course = await db.course.findUnique({
  where: { id: courseId },
  include: {
    enrollments: {
      where: { studentId }
    }
  }
});
```
**Index Used:** Primary key on `courses.id`, then `course_enrollments_courseId_studentId_key` unique constraint
**Performance:** O(1) - Optimal

#### 2. Check Existing Enrollment
```typescript
const enrollment = await db.courseEnrollment.findFirst({
  where: {
    studentId: student.id,
    courseId: courseId
  }
});
```
**Index Used:** `course_enrollments_courseId_studentId_key` unique constraint
**Performance:** O(1) - Optimal

#### 3. Get Modules with Lesson Progress
```typescript
const modules = await db.courseModule.findMany({
  where: { courseId },
  include: {
    lessons: {
      include: {
        progress: {
          where: { enrollmentId }
        }
      }
    }
  },
  orderBy: { sequence: 'asc' }
});
```
**Indexes Used:** 
- `course_modules_courseId_sequence_idx` for modules
- `course_lessons_moduleId_sequence_idx` for lessons
- `lesson_progress_enrollmentId_lessonId_key` for progress

**Performance:** O(n log n) where n is number of modules - Optimal for ordered results

#### 4. Count Completed Lessons
```typescript
const completedLessons = await db.lessonProgress.count({
  where: {
    enrollmentId: enrollmentId,
    status: LessonProgressStatus.COMPLETED
  }
});
```
**Index Used:** `lesson_progress_enrollmentId_status_idx`
**Performance:** O(log n) - Optimal for counting with composite index

#### 5. Get Lesson with Progress
```typescript
const lesson = await db.courseLesson.findUnique({
  where: { id: lessonId },
  include: {
    progress: {
      where: { enrollmentId }
    }
  }
});
```
**Index Used:** Primary key on `course_lessons.id`, then `lesson_progress_enrollmentId_lessonId_key`
**Performance:** O(1) - Optimal

## Index Efficiency

### Composite Index Benefits

1. **Leftmost Prefix Rule**: Composite indexes like `(studentId, status)` can be used for queries filtering by just `studentId` alone, making them versatile.

2. **Covering Indexes**: Some queries can be satisfied entirely from the index without accessing the table data.

3. **Sorted Results**: Indexes on `(courseId, sequence)` provide pre-sorted results, eliminating the need for additional sorting operations.

### Unique Constraints as Indexes

Unique constraints automatically create indexes, providing both data integrity and query performance benefits:
- `(courseId, studentId)` prevents duplicate enrollments
- `(enrollmentId, lessonId)` prevents duplicate progress records

## Performance Metrics

Based on the index strategy:

| Operation | Expected Performance | Index Used |
|-----------|---------------------|------------|
| Get student enrollments | < 10ms | studentId_status |
| Check enrollment | < 5ms | Unique constraint |
| Get course progress | < 20ms | enrollmentId_status |
| Count completed lessons | < 10ms | enrollmentId_status |
| Get lesson progress | < 5ms | Unique constraint |
| Get modules in order | < 15ms | courseId_sequence |
| Get lessons in order | < 15ms | moduleId_sequence |

## Maintenance

### Index Monitoring

Monitor these metrics regularly:
1. Query execution time
2. Index usage statistics
3. Table scan frequency
4. Index size growth

### When to Add New Indexes

Consider adding indexes if:
1. New query patterns emerge with > 100ms execution time
2. Table scans appear in EXPLAIN ANALYZE output
3. Specific filters are frequently used together

### When NOT to Add Indexes

Avoid adding indexes if:
1. Table has < 1000 rows (overhead > benefit)
2. Column has low cardinality (few distinct values)
3. Write operations significantly outnumber reads
4. Index would duplicate existing composite index coverage

## Verification

To verify index usage in production:

```sql
-- Check index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('course_enrollments', 'lesson_progress', 'courses', 'course_modules', 'course_lessons')
ORDER BY idx_scan DESC;

-- Check for unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%pkey';
```

## Conclusion

All necessary indexes for optimal course functionality are in place. The indexing strategy:
- ✅ Covers all critical query patterns
- ✅ Uses composite indexes efficiently
- ✅ Leverages unique constraints for performance
- ✅ Provides ordered results without additional sorting
- ✅ Supports both read and write operations efficiently

No additional indexes are needed at this time. Future optimization should be based on actual production query patterns and performance metrics.

## Related Documentation

- [Student Course Actions](../src/lib/actions/student-course-actions.ts)
- [Prisma Schema](../prisma/schema.prisma)
- [LMS Migration](../prisma/migrations/20251122094944_add_lms_models/migration.sql)
- [Index Verification Migration](../prisma/migrations/20251124073832_verify_course_indexes/migration.sql)
