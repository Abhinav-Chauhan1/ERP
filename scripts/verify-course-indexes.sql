-- Verification script for course-related database indexes
-- Run this to verify all necessary indexes are in place

-- Check CourseEnrollment indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'course_enrollments'
ORDER BY indexname;

-- Check LessonProgress indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'lesson_progress'
ORDER BY indexname;

-- Check Course indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'courses'
ORDER BY indexname;

-- Check CourseModule indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'course_modules'
ORDER BY indexname;

-- Check CourseLesson indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'course_lessons'
ORDER BY indexname;

-- Summary of all course-related indexes
SELECT 
    t.tablename,
    COUNT(i.indexname) as index_count,
    STRING_AGG(i.indexname, ', ' ORDER BY i.indexname) as indexes
FROM pg_tables t
LEFT JOIN pg_indexes i ON t.tablename = i.tablename AND i.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN ('courses', 'course_modules', 'course_lessons', 'course_enrollments', 'lesson_progress')
GROUP BY t.tablename
ORDER BY t.tablename;
