/**
 * Cache Usage Examples
 * Demonstrates how to implement caching in server actions and components
 */

import { db } from "@/lib/db";
import { cachedQuery, CACHE_TAGS, CACHE_DURATION } from "./cache";
import {
  invalidateStudentCache,
  invalidateClassCache,
  invalidateAcademicYearCache,
  invalidateTermCache,
  invalidateAttendanceCache,
  invalidateExamCache,
  invalidateCacheBatch,
} from "./cache-invalidation";

/**
 * Example 1: Caching a simple query
 * Cache student list for 5 minutes
 */
export const getAllStudents = cachedQuery(
  async () => {
    return await db.student.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        rollNumber: "asc",
      },
    });
  },
  {
    name: "all-students",
    tags: [CACHE_TAGS.STUDENTS],
    revalidate: CACHE_DURATION.MEDIUM,
  }
);

/**
 * Example 2: Caching a query with parameters
 * Cache student by ID for 5 minutes
 */
export const getStudentById = cachedQuery(
  async (studentId: string) => {
    return await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        enrollments: {
          include: {
            class: true,
            section: true,
          },
        },
      },
    });
  },
  {
    name: "student-by-id",
    tags: [CACHE_TAGS.STUDENTS],
    revalidate: CACHE_DURATION.MEDIUM,
  }
);

/**
 * Example 3: Server action with cache invalidation
 * Create a student and invalidate related caches
 */
export async function createStudent(data: any) {
  "use server";
  
  try {
    const student = await db.student.create({
      data: {
        ...data,
        user: {
          create: data.user,
        },
      },
    });
    
    // Invalidate student caches
    await invalidateStudentCache();
    
    return { success: true, data: student };
  } catch (error) {
    console.error("Failed to create student:", error);
    return { success: false, error: "Failed to create student" };
  }
}

/**
 * Example 4: Server action with multiple cache invalidations
 * Update student enrollment and invalidate multiple caches
 */
export async function updateStudentEnrollment(
  studentId: string,
  classId: string,
  sectionId: string
) {
  "use server";
  
  try {
    const enrollment = await db.classEnrollment.create({
      data: {
        studentId,
        classId,
        sectionId,
        schoolId: "school-id", // Add required schoolId
        status: "ACTIVE",
        enrollDate: new Date(),
      },
    });
    
    // Invalidate multiple related caches
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
    
    return { success: true, data: enrollment };
  } catch (error) {
    console.error("Failed to update enrollment:", error);
    return { success: false, error: "Failed to update enrollment" };
  }
}

/**
 * Example 5: Caching academic year data (static data - 1 hour cache)
 */
export const getAcademicYearWithTerms = cachedQuery(
  async (academicYearId: string) => {
    return await db.academicYear.findUnique({
      where: { id: academicYearId },
      include: {
        terms: {
          orderBy: {
            startDate: "asc",
          },
        },
      },
    });
  },
  {
    name: "academic-year-with-terms",
    tags: [CACHE_TAGS.ACADEMIC_YEARS, CACHE_TAGS.TERMS],
    revalidate: CACHE_DURATION.ACADEMIC_YEARS, // 1 hour
  }
);

/**
 * Example 6: Server action for creating academic year
 * Invalidate academic year and term caches
 */
export async function createAcademicYear(data: any) {
  "use server";
  
  try {
    const academicYear = await db.academicYear.create({
      data,
    });
    
    // Invalidate academic year caches
    await invalidateAcademicYearCache();
    
    return { success: true, data: academicYear };
  } catch (error) {
    console.error("Failed to create academic year:", error);
    return { success: false, error: "Failed to create academic year" };
  }
}

/**
 * Example 7: Server action for creating term
 * Invalidate term caches
 */
export async function createTerm(data: any) {
  "use server";
  
  try {
    const term = await db.term.create({
      data,
    });
    
    // Invalidate term caches
    await invalidateTermCache();
    
    return { success: true, data: term };
  } catch (error) {
    console.error("Failed to create term:", error);
    return { success: false, error: "Failed to create term" };
  }
}

/**
 * Example 8: Caching attendance data (short cache - 1 minute)
 */
export const getAttendanceByDate = cachedQuery(
  async (date: Date, classId: string, sectionId?: string) => {
    return await db.studentAttendance.findMany({
      where: {
        date,
        student: {
          enrollments: {
            some: {
              classId,
              ...(sectionId && { sectionId }),
              status: "ACTIVE",
            },
          },
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  },
  {
    name: "attendance-by-date",
    tags: [CACHE_TAGS.ATTENDANCE],
    revalidate: CACHE_DURATION.SHORT, // 1 minute
  }
);

/**
 * Example 9: Server action for marking attendance
 * Invalidate attendance and dashboard caches
 */
export async function markAttendance(data: any[]) {
  "use server";
  
  try {
    const attendance = await db.studentAttendance.createMany({
      data,
    });
    
    // Invalidate attendance caches
    await invalidateAttendanceCache(data[0]?.date);
    
    return { success: true, data: attendance };
  } catch (error) {
    console.error("Failed to mark attendance:", error);
    return { success: false, error: "Failed to mark attendance" };
  }
}

/**
 * Example 10: Caching exam results (medium cache - 5 minutes)
 */
export const getExamResults = cachedQuery(
  async (examId: string) => {
    return await db.examResult.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        exam: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        marks: "desc",
      },
    });
  },
  {
    name: "exam-results",
    tags: [CACHE_TAGS.EXAMS, CACHE_TAGS.RESULTS],
    revalidate: CACHE_DURATION.MEDIUM,
  }
);

/**
 * Example 11: Server action for submitting exam results
 * Invalidate exam and result caches
 */
export async function submitExamResults(examId: string, results: any[]) {
  "use server";
  
  try {
    const examResults = await db.examResult.createMany({
      data: results,
    });
    
    // Invalidate exam caches
    await invalidateExamCache(examId);
    
    return { success: true, data: examResults };
  } catch (error) {
    console.error("Failed to submit exam results:", error);
    return { success: false, error: "Failed to submit exam results" };
  }
}

/**
 * Example 12: Using cached queries in a Server Component
 * 
 * Note: These are example components - to use them, create a .tsx file
 * 
 * export async function StudentListPage() {
 *   const students = await getAllStudents();
 *   
 *   return (
 *     <div>
 *       <h1>Students</h1>
 *       <ul>
 *         {students.map((student) => (
 *           <li key={student.id}>
 *             {student.user.firstName} {student.user.lastName}
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 */

/**
 * Example 13: Using cached queries with parameters in a Server Component
 * 
 * Note: These are example components - to use them, create a .tsx file
 * 
 * export async function StudentDetailPage({ params }: { params: { id: string } }) {
 *   const student = await getStudentById(params.id);
 *   
 *   if (!student) {
 *     return <div>Student not found</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>
 *         {student.user.firstName} {student.user.lastName}
 *       </h1>
 *       <p>Roll Number: {student.rollNumber}</p>
 *     </div>
 *   );
 * }
 */

/**
 * Example 14: Caching dashboard statistics
 */
export const getStudentDashboardStats = cachedQuery(
  async (studentId: string) => {
    const [attendanceCount, assignmentCount, examCount] = await Promise.all([
      db.studentAttendance.count({
        where: {
          studentId,
          status: "PRESENT",
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      db.assignmentSubmission.count({
        where: {
          studentId,
          status: "SUBMITTED",
        },
      }),
      db.examResult.count({
        where: {
          studentId,
        },
      }),
    ]);
    
    return {
      attendanceCount,
      assignmentCount,
      examCount,
    };
  },
  {
    name: "student-dashboard-stats",
    tags: [CACHE_TAGS.DASHBOARD, CACHE_TAGS.STUDENTS],
    revalidate: CACHE_DURATION.DASHBOARD_STATS, // 1 minute
  }
);

/**
 * Example 15: Caching class with students (for dropdown)
 */
export const getClassWithStudents = cachedQuery(
  async (classId: string) => {
    return await db.class.findUnique({
      where: { id: classId },
      include: {
        sections: {
          include: {
            enrollments: {
              where: {
                status: "ACTIVE",
              },
              include: {
                student: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  {
    name: "class-with-students",
    tags: [CACHE_TAGS.CLASSES, CACHE_TAGS.STUDENTS],
    revalidate: CACHE_DURATION.MEDIUM,
  }
);

/**
 * Example 16: Server action for updating class
 * Invalidate class caches
 */
export async function updateClass(classId: string, data: any) {
  "use server";
  
  try {
    const updatedClass = await db.class.update({
      where: { id: classId },
      data,
    });
    
    // Invalidate class caches
    await invalidateClassCache(classId);
    
    return { success: true, data: updatedClass };
  } catch (error) {
    console.error("Failed to update class:", error);
    return { success: false, error: "Failed to update class" };
  }
}

/**
 * Example 17: Caching with fallback
 */
export async function getStudentWithFallback(studentId: string) {
  try {
    return await getStudentById(studentId);
  } catch (error) {
    console.error("Failed to get student from cache:", error);
    // Fallback to direct database query
    return await db.student.findUnique({
      where: { id: studentId },
    });
  }
}

/**
 * Example 18: Conditional caching based on data freshness requirements
 */
export function getCachedQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    name: string;
    tags: string[];
    freshness: "static" | "semi-static" | "dynamic" | "realtime";
  }
) {
  const revalidateMap = {
    static: CACHE_DURATION.STATIC,
    "semi-static": CACHE_DURATION.LONG,
    dynamic: CACHE_DURATION.MEDIUM,
    realtime: CACHE_DURATION.REALTIME,
  };
  
  return cachedQuery(queryFn, {
    name: options.name,
    tags: options.tags,
    revalidate: revalidateMap[options.freshness],
  });
}

// Usage:
export const getRealtimeNotifications = getCachedQuery(
  async () => {
    return await db.notification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: "desc" },
    });
  },
  {
    name: "realtime-notifications",
    tags: [CACHE_TAGS.NOTIFICATIONS],
    freshness: "realtime", // No cache
  }
);
