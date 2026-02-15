/**
 * Cache Utilities Index
 * Central export point for all caching utilities
 */

// Core cache utilities
export {
  CACHE_TAGS,
  CACHE_DURATION,
  CACHE_CONFIG,
  createCachedFunction,
  cachedQuery,
  cachedFetch,
  memoryCache,
  memoize,
  invalidateCache,
  invalidatePath,
  invalidateCacheBatch,
  warmCache,
  staleWhileRevalidate,
} from "./cache";

// Pre-configured cached queries
export {
  getActiveUsersForDropdown,
  getClassesForDropdown,
  getSubjectsForDropdown,
  getActiveAnnouncements,
  getSchoolSettings,
  getSystemSettings, // Backward compatibility alias
  getTeacherClasses,
  getStudentClasses,
  getActiveAcademicYear,
  getAllAcademicYears,
  getTermsByAcademicYear,
  getActiveTerm,
  getActiveTimetable,
  getExamTypes,
  getFeeTypes,
  getSectionsByClass,
  getAllDepartments,
  getAllRooms,
  getStudentsByClass,
  getTeachersByDepartment,
} from "./cached-queries";

// Cache invalidation helpers
export {
  invalidateCacheTags,
  invalidateCachePath,
  invalidateUserCache,
  invalidateStudentCache,
  invalidateTeacherCache,
  invalidateParentCache,
  invalidateClassCache,
  invalidateSectionCache,
  invalidateSubjectCache,
  invalidateAcademicYearCache,
  invalidateTermCache,
  invalidateAttendanceCache,
  invalidateExamCache,
  invalidateAssignmentCache,
  invalidateFeePaymentCache,
  invalidateAnnouncementCache,
  invalidateEventCache,
  invalidateTimetableCache,
  invalidateDocumentCache,
  invalidateLibraryCache,
  invalidateTransportCache,
  invalidateSettingsCache,
  invalidateDashboardCache,
  invalidateAllCaches,
  invalidateEnrollmentCache,
  invalidateSubjectTeacherCache,
  invalidateGradeCache,
} from "./cache-invalidation";

/**
 * Quick Start Guide:
 * 
 * 1. Import cache utilities:
 *    import { CACHE_TAGS, CACHE_DURATION, cachedQuery } from '@/lib/utils/cache-index';
 * 
 * 2. Create a cached query:
 *    export const getMyData = cachedQuery(
 *      async () => await db.myTable.findMany(),
 *      {
 *        name: 'my-data',
 *        tags: [CACHE_TAGS.MY_TAG],
 *        revalidate: CACHE_DURATION.MEDIUM,
 *      }
 *    );
 * 
 * 3. Use in server component:
 *    const data = await getMyData();
 * 
 * 4. Invalidate after mutation:
 *    import { invalidateCacheTags } from '@/lib/utils/cache-index';
 *    await invalidateCacheTags([CACHE_TAGS.MY_TAG]);
 */
