/**
 * Cached Query Examples
 * Demonstrates how to implement caching for common queries
 */

import { db } from "@/lib/db";
import { cachedQuery, CACHE_CONFIG, CACHE_DURATION, CACHE_TAGS } from "./cache";
import { USER_SELECT_MINIMAL, CLASS_SELECT_MINIMAL, SUBJECT_SELECT_MINIMAL } from "./query-optimization";

/**
 * Cached query for getting active users (for dropdowns)
 * Cache for 10 minutes since user list doesn't change frequently
 */
export const getActiveUsersForDropdown = cachedQuery(
  async (role?: string) => {
    return await db.user.findMany({
      where: {
        active: true,
        ...(role && { role: role as any }),
      },
      select: USER_SELECT_MINIMAL,
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
      take: 200, // Limit for performance
    });
  },
  {
    name: "active-users-dropdown",
    tags: [CACHE_TAGS.USERS],
    revalidate: CACHE_DURATION.DROPDOWN_DATA,
  }
);

/**
 * Cached query for getting all classes (for dropdowns)
 * Cache for 30 minutes since classes rarely change
 */
export const getClassesForDropdown = cachedQuery(
  async () => {
    return await db.class.findMany({
      select: CLASS_SELECT_MINIMAL,
      orderBy: {
        name: "asc",
      },
    });
  },
  {
    name: "classes-dropdown",
    tags: [CACHE_TAGS.CLASSES],
    revalidate: CACHE_DURATION.LONG,
  }
);

/**
 * Cached query for getting all subjects (for dropdowns)
 * Cache for 30 minutes since subjects rarely change
 */
export const getSubjectsForDropdown = cachedQuery(
  async () => {
    return await db.subject.findMany({
      select: SUBJECT_SELECT_MINIMAL,
      orderBy: {
        name: "asc",
      },
    });
  },
  {
    name: "subjects-dropdown",
    tags: [CACHE_TAGS.SUBJECTS],
    revalidate: CACHE_DURATION.LONG,
  }
);

/**
 * Cached query for getting active announcements
 * Cache for 5 minutes since announcements change occasionally
 */
export const getActiveAnnouncements = cachedQuery(
  async (targetAudience: string) => {
    const today = new Date();

    return await db.announcement.findMany({
      where: {
        isActive: true,
        startDate: {
          lte: today,
        },
        OR: [
          {
            endDate: null,
          },
          {
            endDate: {
              gte: today,
            },
          },
        ],
        targetAudience: {
          has: targetAudience as any,
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        startDate: true,
        endDate: true,
        attachments: true,
        createdAt: true,
        publisher: {
          select: {
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
      orderBy: {
        startDate: "desc",
      },
      take: 10,
    });
  },
  {
    name: "active-announcements",
    tags: [CACHE_TAGS.ANNOUNCEMENTS],
    revalidate: CACHE_DURATION.ANNOUNCEMENTS,
  }
);

/**
 * Cached query for getting school settings
 * Cache for 1 hour since settings rarely change
 * 
 * @param schoolId - Required school ID. Must be resolved outside the cache scope.
 */
export const getSchoolSettings = cachedQuery(
  async (schoolId: string) => {
    return await db.schoolSettings.findUnique({
      where: { schoolId },
    });
  },
  {
    name: "school-settings",
    tags: [CACHE_TAGS.SETTINGS],
    revalidate: CACHE_DURATION.SETTINGS,
  }
);

// Backward compatibility alias
export const getSystemSettings = getSchoolSettings;

/**
 * Cached query for getting teacher's classes
 * Cache for 30 minutes since class assignments don't change frequently
 */
export const getTeacherClasses = cachedQuery(
  async (teacherId: string) => {
    return await db.class.findMany({
      where: {
        teachers: {
          some: {
            teacherId: teacherId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        sections: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  },
  {
    name: "teacher-classes",
    tags: [CACHE_TAGS.CLASSES, CACHE_TAGS.TEACHERS],
    revalidate: CACHE_DURATION.LONG,
  }
);

/**
 * Cached query for getting student's enrolled classes
 * Cache for 30 minutes since enrollments don't change frequently
 */
export const getStudentClasses = cachedQuery(
  async (studentId: string) => {
    return await db.classEnrollment.findMany({
      where: {
        studentId: studentId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        class: {
          select: CLASS_SELECT_MINIMAL,
        },
        section: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },
  {
    name: "student-classes",
    tags: [CACHE_TAGS.CLASSES, CACHE_TAGS.STUDENTS],
    revalidate: CACHE_DURATION.LONG,
  }
);

/**
 * Cached query for getting active academic year
 * Cache for 1 hour since academic year rarely changes
 */
export const getActiveAcademicYear = cachedQuery(
  async () => {
    return await db.academicYear.findFirst({
      where: {
        isCurrent: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });
  },
  {
    name: "active-academic-year",
    tags: [CACHE_TAGS.ACADEMIC_YEARS],
    revalidate: CACHE_DURATION.ACADEMIC_YEARS,
  }
);

/**
 * Cached query for getting all academic years
 * Cache for 1 hour since academic years rarely change
 */
export const getAllAcademicYears = cachedQuery(
  async () => {
    return await db.academicYear.findMany({
      orderBy: {
        startDate: "desc",
      },
    });
  },
  {
    name: "all-academic-years",
    tags: [CACHE_TAGS.ACADEMIC_YEARS],
    revalidate: CACHE_DURATION.ACADEMIC_YEARS,
  }
);

/**
 * Cached query for getting terms for an academic year
 * Cache for 1 hour since terms rarely change
 */
export const getTermsByAcademicYear = cachedQuery(
  async (academicYearId: string) => {
    return await db.term.findMany({
      where: {
        academicYearId: academicYearId,
      },
      orderBy: {
        startDate: "asc",
      },
    });
  },
  {
    name: "terms-by-academic-year",
    tags: [CACHE_TAGS.TERMS],
    revalidate: CACHE_DURATION.TERMS,
  }
);

/**
 * Cached query for getting active term
 * Cache for 1 hour since active term rarely changes
 */
export const getActiveTerm = cachedQuery(
  async () => {
    const today = new Date();
    return await db.term.findFirst({
      where: {
        startDate: {
          lte: today,
        },
        endDate: {
          gte: today,
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });
  },
  {
    name: "active-term",
    tags: [CACHE_TAGS.TERMS],
    revalidate: CACHE_DURATION.TERMS,
  }
);

/**
 * Cached query for getting timetable
 * Cache for 30 minutes since timetables don't change frequently
 */
export const getActiveTimetable = cachedQuery(
  async (classId: string, sectionId?: string) => {
    return await db.timetable.findFirst({
      where: {
        isActive: true,
        slots: {
          some: {
            classId: classId,
            ...(sectionId && { sectionId }),
          },
        },
      },
      include: {
        slots: {
          where: {
            classId: classId,
            ...(sectionId && { sectionId }),
          },
          include: {
            subjectTeacher: {
              include: {
                subject: {
                  select: SUBJECT_SELECT_MINIMAL,
                },
                teacher: {
                  select: {
                    id: true,
                    user: {
                      select: USER_SELECT_MINIMAL,
                    },
                  },
                },
              },
            },
            room: {
              select: {
                id: true,
                name: true,
                capacity: true,
              },
            },
          },
          orderBy: {
            startTime: "asc",
          },
        },
      },
    });
  },
  {
    name: "active-timetable",
    tags: [CACHE_TAGS.TIMETABLE],
    revalidate: CACHE_DURATION.TIMETABLE,
  }
);

/**
 * Cached query for getting exam types
 * Cache for 1 hour since exam types rarely change
 */
export const getExamTypes = cachedQuery(
  async () => {
    return await db.examType.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        weight: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },
  {
    name: "exam-types",
    tags: [CACHE_TAGS.EXAMS],
    revalidate: CACHE_DURATION.STATIC,
  }
);

/**
 * Cached query for getting fee types
 * Cache for 1 hour since fee types rarely change
 */
export const getFeeTypes = cachedQuery(
  async () => {
    return await db.feeType.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },
  {
    name: "fee-types",
    tags: [CACHE_TAGS.FEE_PAYMENTS],
    revalidate: CACHE_DURATION.STATIC,
  }
);

/**
 * Cached query for getting sections by class
 * Cache for 30 minutes since sections rarely change
 */
export const getSectionsByClass = cachedQuery(
  async (classId: string) => {
    return await db.classSection.findMany({
      where: {
        classId: classId,
      },
      orderBy: {
        name: "asc",
      },
    });
  },
  {
    name: "sections-by-class",
    tags: [CACHE_TAGS.SECTIONS],
    revalidate: CACHE_DURATION.LONG,
  }
);

/**
 * Cached query for getting all departments
 * Cache for 1 hour since departments rarely change
 */
export const getAllDepartments = cachedQuery(
  async () => {
    return await db.department.findMany({
      orderBy: {
        name: "asc",
      },
    });
  },
  {
    name: "all-departments",
    tags: [CACHE_TAGS.DEPARTMENTS],
    revalidate: CACHE_DURATION.STATIC,
  }
);

/**
 * Cached query for getting all rooms
 * Cache for 1 hour since rooms rarely change
 */
export const getAllRooms = cachedQuery(
  async () => {
    return await db.classRoom.findMany({
      orderBy: {
        name: "asc",
      },
    });
  },
  {
    name: "all-rooms",
    tags: [CACHE_TAGS.ROOMS],
    revalidate: CACHE_DURATION.STATIC,
  }
);

/**
 * Cached query for getting students by class
 * Cache for 5 minutes since student enrollments can change
 */
export const getStudentsByClass = cachedQuery(
  async (classId: string, sectionId?: string) => {
    return await db.student.findMany({
      where: {
        enrollments: {
          some: {
            classId: classId,
            ...(sectionId && { sectionId }),
            status: "ACTIVE",
          },
        },
      },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        rollNumber: true,
      },
      orderBy: {
        rollNumber: "asc",
      },
    });
  },
  {
    name: "students-by-class",
    tags: [CACHE_TAGS.STUDENTS, CACHE_TAGS.CLASSES],
    revalidate: CACHE_DURATION.MEDIUM,
  }
);

/**
 * Cached query for getting teachers by department
 * Cache for 30 minutes since teacher assignments rarely change
 */
export const getTeachersByDepartment = cachedQuery(
  async (departmentId: string) => {
    return await db.teacher.findMany({
      where: {
        departments: {
          some: {
            id: departmentId,
          },
        },
      },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        employeeId: true,
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });
  },
  {
    name: "teachers-by-department",
    tags: [CACHE_TAGS.TEACHERS, CACHE_TAGS.DEPARTMENTS],
    revalidate: CACHE_DURATION.LONG,
  }
);

/**
 * Example: Using cached queries in server components
 * 
 * // In a server component:
 * export default async function ClassesPage() {
 *   const classes = await getClassesForDropdown();
 *   
 *   return (
 *     <div>
 *       {classes.map(cls => (
 *         <div key={cls.id}>{cls.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * // The query will be cached for 30 minutes
 * // Subsequent requests will use cached data
 */

/**
 * Example: Invalidating cache after mutations
 * 
 * // In a server action:
 * export async function createClass(data: ClassData) {
 *   const newClass = await db.class.create({ data });
 *   
 *   // Invalidate classes cache
 *   await invalidateCache([CACHE_TAGS.CLASSES]);
 *   
 *   return { success: true, data: newClass };
 * }
 */
