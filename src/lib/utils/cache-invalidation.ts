/**
 * Cache Invalidation Helpers
 * Provides convenient functions for invalidating cache after data mutations
 */

import { revalidateTag, revalidatePath } from "next/cache";
import { CACHE_TAGS } from "./cache";

/**
 * Invalidate cache by tags
 * Use this after mutations to ensure fresh data is fetched
 */
export async function invalidateCacheTags(tags: string | string[]) {
  const tagArray = Array.isArray(tags) ? tags : [tags];
  
  for (const tag of tagArray) {
    revalidateTag(tag, "default");
  }
}

/**
 * Invalidate cache by path
 * Use this to revalidate specific pages or layouts
 */
export async function invalidateCachePath(path: string, type?: "page" | "layout") {
  revalidatePath(path, type);
}

/**
 * Batch cache invalidation
 * Invalidate multiple tags and paths at once
 */
export async function invalidateCacheBatch(options: {
  tags?: string[];
  paths?: Array<{ path: string; type?: "page" | "layout" }>;
}) {
  const { tags = [], paths = [] } = options;
  
  // Invalidate tags
  for (const tag of tags) {
    revalidateTag(tag, "default");
  }
  
  // Invalidate paths
  for (const { path, type } of paths) {
    revalidatePath(path, type);
  }
}

/**
 * Invalidate user-related caches
 */
export async function invalidateUserCache(userId?: string) {
  await invalidateCacheTags([CACHE_TAGS.USERS]);
  
  if (userId) {
    await invalidateCachePath(`/users/${userId}`);
  }
}

/**
 * Invalidate student-related caches
 */
export async function invalidateStudentCache(studentId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.STUDENTS,
    CACHE_TAGS.USERS,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  if (studentId) {
    await invalidateCachePath(`/student/${studentId}`);
  }
}

/**
 * Invalidate teacher-related caches
 */
export async function invalidateTeacherCache(teacherId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.TEACHERS,
    CACHE_TAGS.USERS,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  if (teacherId) {
    await invalidateCachePath(`/teacher/${teacherId}`);
  }
}

/**
 * Invalidate parent-related caches
 */
export async function invalidateParentCache(parentId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.PARENTS,
    CACHE_TAGS.USERS,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  if (parentId) {
    await invalidateCachePath(`/parent/${parentId}`);
  }
}

/**
 * Invalidate class-related caches
 */
export async function invalidateClassCache(classId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.CLASSES,
    CACHE_TAGS.SECTIONS,
    CACHE_TAGS.TIMETABLE,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  if (classId) {
    await invalidateCachePath(`/admin/classes/${classId}`);
  }
}

/**
 * Invalidate section-related caches
 */
export async function invalidateSectionCache(sectionId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.SECTIONS,
    CACHE_TAGS.CLASSES,
    CACHE_TAGS.TIMETABLE,
  ]);
}

/**
 * Invalidate subject-related caches
 */
export async function invalidateSubjectCache(subjectId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.SUBJECTS,
    CACHE_TAGS.TIMETABLE,
  ]);
  
  if (subjectId) {
    await invalidateCachePath(`/admin/subjects/${subjectId}`);
  }
}

/**
 * Invalidate academic year caches
 */
export async function invalidateAcademicYearCache() {
  await invalidateCacheTags([
    CACHE_TAGS.ACADEMIC_YEARS,
    CACHE_TAGS.TERMS,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  await invalidateCachePath("/admin/academic");
}

/**
 * Invalidate term caches
 */
export async function invalidateTermCache() {
  await invalidateCacheTags([
    CACHE_TAGS.TERMS,
    CACHE_TAGS.DASHBOARD,
  ]);
}

/**
 * Invalidate attendance caches
 */
export async function invalidateAttendanceCache(date?: Date) {
  await invalidateCacheTags([
    CACHE_TAGS.ATTENDANCE,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  if (date) {
    const dateStr = date.toISOString().split("T")[0];
    await invalidateCachePath(`/admin/attendance/${dateStr}`);
  }
}

/**
 * Invalidate exam-related caches
 */
export async function invalidateExamCache(examId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.EXAMS,
    CACHE_TAGS.RESULTS,
    CACHE_TAGS.GRADES,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  if (examId) {
    await invalidateCachePath(`/admin/exams/${examId}`);
  }
}

/**
 * Invalidate assignment caches
 */
export async function invalidateAssignmentCache(assignmentId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.ASSIGNMENTS,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  if (assignmentId) {
    await invalidateCachePath(`/teacher/assignments/${assignmentId}`);
  }
}

/**
 * Invalidate fee payment caches
 */
export async function invalidateFeePaymentCache(studentId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.FEE_PAYMENTS,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  if (studentId) {
    await invalidateCachePath(`/admin/finance/students/${studentId}`);
  }
}

/**
 * Invalidate announcement caches
 */
export async function invalidateAnnouncementCache() {
  await invalidateCacheTags([
    CACHE_TAGS.ANNOUNCEMENTS,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  await invalidateCachePath("/admin/communication/announcements");
}

/**
 * Invalidate event caches
 */
export async function invalidateEventCache(eventId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.EVENTS,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  if (eventId) {
    await invalidateCachePath(`/admin/events/${eventId}`);
  }
}

/**
 * Invalidate timetable caches
 */
export async function invalidateTimetableCache() {
  await invalidateCacheTags([
    CACHE_TAGS.TIMETABLE,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  await invalidateCachePath("/admin/academic/timetable");
}

/**
 * Invalidate document caches
 */
export async function invalidateDocumentCache() {
  await invalidateCacheTags([
    CACHE_TAGS.DOCUMENTS,
  ]);
}

/**
 * Invalidate library caches
 */
export async function invalidateLibraryCache(bookId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.LIBRARY,
  ]);
  
  if (bookId) {
    await invalidateCachePath(`/admin/library/books/${bookId}`);
  }
}

/**
 * Invalidate transport caches
 */
export async function invalidateTransportCache(routeId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.TRANSPORT,
  ]);
  
  if (routeId) {
    await invalidateCachePath(`/admin/transport/routes/${routeId}`);
  }
}

/**
 * Invalidate settings caches
 */
export async function invalidateSettingsCache() {
  await invalidateCacheTags([
    CACHE_TAGS.SETTINGS,
  ]);
  
  await invalidateCachePath("/admin/settings");
}

/**
 * Invalidate dashboard caches
 * Use this when any data that affects dashboard statistics changes
 */
export async function invalidateDashboardCache(role?: string) {
  await invalidateCacheTags([CACHE_TAGS.DASHBOARD]);
  
  if (role) {
    await invalidateCachePath(`/${role.toLowerCase()}`);
  }
}

/**
 * Invalidate all caches
 * Use with caution - only for major system updates
 */
export async function invalidateAllCaches() {
  const allTags = Object.values(CACHE_TAGS);
  
  for (const tag of allTags) {
    revalidateTag(tag, "default");
  }
  
  // Invalidate common paths
  await invalidateCachePath("/", "layout");
}

/**
 * Helper to invalidate related caches after enrollment changes
 */
export async function invalidateEnrollmentCache(studentId: string, classId: string) {
  await invalidateCacheBatch({
    tags: [
      CACHE_TAGS.STUDENTS,
      CACHE_TAGS.CLASSES,
      CACHE_TAGS.SECTIONS,
      CACHE_TAGS.DASHBOARD,
    ],
    paths: [
      { path: `/student/${studentId}` },
      { path: `/admin/classes/${classId}` },
    ],
  });
}

/**
 * Helper to invalidate related caches after subject teacher assignment
 */
export async function invalidateSubjectTeacherCache(teacherId: string, subjectId: string) {
  await invalidateCacheBatch({
    tags: [
      CACHE_TAGS.TEACHERS,
      CACHE_TAGS.SUBJECTS,
      CACHE_TAGS.TIMETABLE,
    ],
    paths: [
      { path: `/teacher/${teacherId}` },
      { path: `/admin/subjects/${subjectId}` },
    ],
  });
}

/**
 * Invalidate grade cache
 * Helper to invalidate related caches after grade/result entry
 */
export async function invalidateGradeCache(studentId: string, examId: string) {
  await invalidateCacheBatch({
    tags: [
      CACHE_TAGS.GRADES,
      CACHE_TAGS.RESULTS,
      CACHE_TAGS.EXAMS,
      CACHE_TAGS.DASHBOARD,
    ],
    paths: [
      { path: `/student/${studentId}/performance` },
      { path: `/admin/exams/${examId}/results` },
    ],
  });
}

/**
 * Invalidate syllabus-related caches
 */
export async function invalidateSyllabusCache(syllabusId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.SYLLABUS,
    CACHE_TAGS.MODULES,
    CACHE_TAGS.SUB_MODULES,
    CACHE_TAGS.SYLLABUS_DOCUMENTS,
  ]);
  
  if (syllabusId) {
    await invalidateCachePath(`/admin/academic/syllabus/${syllabusId}`);
    await invalidateCachePath(`/teacher/syllabus/${syllabusId}`);
    await invalidateCachePath(`/student/syllabus/${syllabusId}`);
  }
  
  // Invalidate common syllabus pages
  await invalidateCachePath("/admin/academic/syllabus");
  await invalidateCachePath("/teacher");
  await invalidateCachePath("/student");
}

/**
 * Invalidate module-related caches
 */
export async function invalidateModuleCache(moduleId?: string, syllabusId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.MODULES,
    CACHE_TAGS.SUB_MODULES,
    CACHE_TAGS.SYLLABUS_DOCUMENTS,
    CACHE_TAGS.SYLLABUS,
  ]);
  
  if (syllabusId) {
    await invalidateSyllabusCache(syllabusId);
  }
}

/**
 * Invalidate sub-module-related caches
 */
export async function invalidateSubModuleCache(subModuleId?: string, moduleId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.SUB_MODULES,
    CACHE_TAGS.MODULES,
    CACHE_TAGS.SYLLABUS_DOCUMENTS,
    CACHE_TAGS.SYLLABUS_PROGRESS,
  ]);
  
  // Invalidate common paths
  await invalidateCachePath("/admin/academic/syllabus");
  await invalidateCachePath("/teacher");
  await invalidateCachePath("/student");
}

/**
 * Invalidate syllabus document caches
 */
export async function invalidateSyllabusDocumentCache(documentId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.SYLLABUS_DOCUMENTS,
    CACHE_TAGS.DOCUMENTS,
  ]);
  
  // Invalidate common paths
  await invalidateCachePath("/admin/academic/syllabus");
  await invalidateCachePath("/teacher");
  await invalidateCachePath("/student");
}

/**
 * Invalidate syllabus progress caches
 */
export async function invalidateSyllabusProgressCache(teacherId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.SYLLABUS_PROGRESS,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  if (teacherId) {
    await invalidateCachePath(`/teacher/${teacherId}`);
  }
  
  await invalidateCachePath("/teacher");
}

/**
 * Invalidate calendar event caches
 */
export async function invalidateCalendarEventCache(eventId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.CALENDAR_EVENTS,
    CACHE_TAGS.EVENTS,
    CACHE_TAGS.DASHBOARD,
  ]);
  
  // Invalidate all calendar pages
  await invalidateCachePath("/admin/calendar");
  await invalidateCachePath("/teacher/calendar");
  await invalidateCachePath("/student/calendar");
  await invalidateCachePath("/parent/calendar");
  
  if (eventId) {
    await invalidateCachePath(`/api/calendar/events/${eventId}`);
  }
}

/**
 * Invalidate calendar category caches
 */
export async function invalidateCalendarCategoryCache(categoryId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.CALENDAR_CATEGORIES,
    CACHE_TAGS.CALENDAR_EVENTS,
  ]);
  
  await invalidateCachePath("/admin/calendar");
  
  if (categoryId) {
    await invalidateCachePath(`/api/calendar/categories/${categoryId}`);
  }
}

/**
 * Invalidate calendar preference caches
 */
export async function invalidateCalendarPreferenceCache(userId?: string) {
  await invalidateCacheTags([
    CACHE_TAGS.CALENDAR_PREFERENCES,
  ]);
  
  if (userId) {
    await invalidateCachePath(`/api/calendar/preferences/${userId}`);
  }
}

