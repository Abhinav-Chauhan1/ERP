"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole, LessonProgressStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Helper function to get current student and verify authentication
 */
async function getCurrentStudent() {
  const session = await auth();
  const clerkUser = session?.user;

  if (!clerkUser) {
    return null;
  }

  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id },
    include: {
      student: true
    }
  });

  if (!dbUser || dbUser.role !== UserRole.STUDENT || !dbUser.student) {
    return null;
  }

  return { user: dbUser, student: dbUser.student };
}

// Validation schemas
const courseIdSchema = z.string().min(1, "Course ID is required");
const lessonIdSchema = z.string().min(1, "Lesson ID is required");
const enrollmentIdSchema = z.string().min(1, "Enrollment ID is required");
const progressSchema = z.number().min(0).max(100);

/**
 * Get course by ID with enrollment status
 * Requirements: AC1
 */
export async function getCourseById(courseId: string) {
  try {
    // Validate input
    const validatedCourseId = courseIdSchema.parse(courseId);

    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { student } = studentData;

    // Fetch course with all related data
    const course = await db.course.findUnique({
      where: { id: validatedCourseId },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                duration: true,
                sequence: true
              },
              orderBy: { sequence: 'asc' }
            }
          },
          orderBy: { sequence: 'asc' }
        },
        enrollments: {
          where: { studentId: student.id },
          include: {
            lessonProgress: true
          }
        }
      }
    });

    if (!course) {
      return { success: false, message: "Course not found" };
    }

    // Extract enrollment data
    const enrollment = course.enrollments[0] || null;

    // Remove enrollments array from course object
    const { enrollments, ...courseData } = course;

    return {
      success: true,
      data: {
        course: courseData,
        enrollment
      }
    };
  } catch (error) {
    console.error("Error fetching course:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to fetch course" };
  }
}

/**
 * Enroll student in course
 * Requirements: AC4
 */
export async function enrollInCourse(courseId: string) {
  try {
    // Validate input
    const validatedCourseId = courseIdSchema.parse(courseId);

    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { student } = studentData;

    // Verify course exists and is published
    const course = await db.course.findUnique({
      where: { id: validatedCourseId },
      include: {
        modules: {
          include: {
            lessons: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return { success: false, message: "Course not found" };
    }

    if (!course.isPublished) {
      return { success: false, message: "Course is not available for enrollment" };
    }

    // Check if already enrolled
    const existingEnrollment = await db.courseEnrollment.findFirst({
      where: {
        studentId: student.id,
        courseId: validatedCourseId
      }
    });

    if (existingEnrollment) {
      return { success: false, message: "Already enrolled in this course" };
    }

    // Create enrollment and initialize lesson progress
    const enrollment = await db.courseEnrollment.create({
      data: {
        studentId: student.id,
        courseId: validatedCourseId,
        progress: 0,
        status: 'ACTIVE',
        lastAccessedAt: new Date()
      }
    });

    // Create lesson progress records for all lessons
    const allLessons = course.modules.flatMap(module => module.lessons);

    if (allLessons.length > 0) {
      await db.lessonProgress.createMany({
        data: allLessons.map(lesson => ({
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
          status: LessonProgressStatus.NOT_STARTED,
          progress: 0,
          timeSpent: 0
        }))
      });
    }

    // Revalidate course pages
    revalidatePath('/student/courses');
    revalidatePath(`/student/courses/${courseId}`);

    return {
      success: true,
      data: enrollment,
      message: "Successfully enrolled in course"
    };
  } catch (error) {
    console.error("Error enrolling in course:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to enroll in course" };
  }
}

/**
 * Unenroll student from course
 * Requirements: AC4
 */
export async function unenrollFromCourse(courseId: string) {
  try {
    // Validate input
    const validatedCourseId = courseIdSchema.parse(courseId);

    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { student } = studentData;

    // Find enrollment
    const enrollment = await db.courseEnrollment.findFirst({
      where: {
        studentId: student.id,
        courseId: validatedCourseId
      }
    });

    if (!enrollment) {
      return { success: false, message: "Not enrolled in this course" };
    }

    // Update enrollment status to DROPPED
    await db.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'DROPPED'
      }
    });

    // Revalidate course pages
    revalidatePath('/student/courses');
    revalidatePath(`/student/courses/${courseId}`);

    return {
      success: true,
      message: "Successfully unenrolled from course"
    };
  } catch (error) {
    console.error("Error unenrolling from course:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to unenroll from course" };
  }
}

/**
 * Get course modules with lessons
 * Requirements: AC9
 */
export async function getModulesByCourse(courseId: string) {
  try {
    // Validate input
    const validatedCourseId = courseIdSchema.parse(courseId);

    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { student } = studentData;

    // Get enrollment and Course Details to check for syllabus
    const enrollment = await db.courseEnrollment.findFirst({
      where: {
        studentId: student.id,
        courseId: validatedCourseId,
        status: 'ACTIVE'
      }
    });

    if (!enrollment) {
      return { success: false, message: "Not enrolled in this course" };
    }

    const course = await db.course.findUnique({
      where: { id: validatedCourseId },
      select: { subjectId: true }
    });

    // Check if there is a linked syllabus
    let syllabus = null;
    if (course?.subjectId) {
      syllabus = await db.syllabus.findFirst({
        where: { subjectId: course.subjectId },
        include: {
          modules: {
            include: {
              subModules: {
                include: {
                  studentProgress: {
                    where: { enrollmentId: enrollment.id }
                  }
                },
                orderBy: { order: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });
    }

    if (syllabus && syllabus.modules.length > 0) {
      // Transform Syllabus Modules to Course Modules format
      const transformedModules = syllabus.modules.map(module => ({
        id: module.id,
        title: module.title,
        description: module.description,
        sequence: module.order,
        lessons: module.subModules.map(subModule => {
          const progress = subModule.studentProgress[0] || { status: 'NOT_STARTED', progress: 0 };
          return {
            id: subModule.id,
            title: subModule.title,
            description: subModule.description,
            sequence: subModule.order,
            duration: 0, // Duration not currently in SubModule, default to 0
            isCompleted: progress.status === 'COMPLETED', // Helper for frontend
            progress: {
              status: progress.status,
              progress: progress.progress,
              completedAt: progress.completedAt
            }
          };
        })
      }));

      return {
        success: true,
        data: transformedModules
      };
    }

    // Fallback to legacy CourseModule approach if no syllabus or modules found
    const modules = await db.courseModule.findMany({
      where: { courseId: validatedCourseId },
      include: {
        lessons: {
          include: {
            progress: {
              where: { enrollmentId: enrollment.id },
              select: {
                status: true,
                progress: true,
                completedAt: true
              }
            }
          },
          orderBy: { sequence: 'asc' }
        }
      },
      orderBy: { sequence: 'asc' }
    });

    return {
      success: true,
      data: modules
    };
  } catch (error) {
    console.error("Error fetching modules:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to fetch modules" };
  }
}

/**
 * Get lesson by ID with progress
 * Requirements: AC2
 */
/**
 * Get lesson by ID with progress
 * Requirements: AC2
 */
export async function getLessonById(lessonId: string, courseId: string) {
  try {
    // Validate input
    const validatedLessonId = lessonIdSchema.parse(lessonId);
    const validatedCourseId = courseIdSchema.parse(courseId);

    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { student } = studentData;

    // Verify enrollment
    const enrollment = await db.courseEnrollment.findFirst({
      where: {
        studentId: student.id,
        courseId: validatedCourseId,
        status: 'ACTIVE'
      }
    });

    if (!enrollment) {
      return { success: false, message: "Not enrolled in this course" };
    }

    // Try finding as SubModule first (Unified System)
    const subModule = await db.subModule.findUnique({
      where: { id: validatedLessonId },
      include: {
        module: {
          include: {
            subModules: {
              orderBy: { order: 'asc' },
              select: { id: true, title: true, order: true }
            },
            syllabus: {
              select: { title: true } // Assuming Syllabus title is proxy for Course title in breadcrumb
            }
          }
        },
        documents: true,
        studentProgress: {
          where: { enrollmentId: enrollment.id }
        }
      }
    });

    if (subModule) {
      // Construct response in the shape expected by frontend, but using SubModule data
      const lessonProgress = subModule.studentProgress[0] || {
        status: LessonProgressStatus.NOT_STARTED,
        progress: 0,
        timeSpent: 0,
        completedAt: null
      };

      const moduleSubModules = subModule.module.subModules;
      const currentIndex = moduleSubModules.findIndex(sm => sm.id === validatedLessonId);
      const previousLesson = currentIndex > 0 ? moduleSubModules[currentIndex - 1] : null;
      const nextLesson = currentIndex < moduleSubModules.length - 1 ? moduleSubModules[currentIndex + 1] : null;

      // Update last accessed time
      await db.courseEnrollment.update({
        where: { id: enrollment.id },
        data: { lastAccessedAt: new Date() }
      });

      if (subModule.studentProgress[0]) {
        await db.lessonProgress.update({
          where: { id: subModule.studentProgress[0].id },
          data: { lastAccessedAt: new Date() }
        });
      }

      // Map SubModule to "Lesson" shape
      const contents = [];

      // Add description as TEXT content if available
      if (subModule.description) {
        contents.push({
          id: `desc-${subModule.id}`,
          contentType: "TEXT",
          title: "Overview",
          url: null,
          content: subModule.description,
          duration: 0,
          sequence: 0,
          isDownloadable: false
        });
      }

      // Map documents to contents
      if (subModule.documents && subModule.documents.length > 0) {
        subModule.documents.forEach((doc, index) => {
          // Simple mapping of MIME types or extensions if 'type' is not strict enum
          // Assuming 'doc.type' is somewhat reliable, else default to DOCUMENT
          let type = "DOCUMENT";
          const lowerType = doc.type.toLowerCase();
          if (lowerType.includes("video")) type = "VIDEO";
          else if (lowerType.includes("image")) type = "IMAGE";
          else if (lowerType.includes("pdf")) type = "PDF";
          else if (lowerType.includes("text")) type = "TEXT";

          contents.push({
            id: doc.id,
            contentType: type,
            title: doc.title,
            url: doc.url,
            content: null,
            duration: 0,
            sequence: index + 1,
            isDownloadable: true // Default to true for documents
          });
        });
      }

      return {
        success: true,
        data: {
          lesson: {
            id: subModule.id,
            title: subModule.title,
            description: subModule.description,
            lessonType: "TEXT", // Default for SubModule
            content: subModule.description, // Fallback for content
            resources: "", // Not direct mapping
            duration: 0,
            sequence: subModule.order,
            module: {
              course: {
                id: validatedCourseId, // Maintain context
                title: subModule.module.syllabus.title
              },
              lessons: moduleSubModules.map(sm => ({
                id: sm.id,
                title: sm.title,
                sequence: sm.order
              }))
            },
            contents: contents
          },
          progress: lessonProgress,
          navigation: {
            previousLesson,
            nextLesson
          }
        }
      };
    }

    // FALLBACK: Legacy CourseLesson Logic
    const lesson = await db.courseLesson.findUnique({
      where: { id: validatedLessonId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            },
            lessons: {
              select: {
                id: true,
                title: true,
                sequence: true
              },
              orderBy: { sequence: 'asc' }
            }
          }
        },
        contents: {
          orderBy: { sequence: 'asc' }
        },
        progress: {
          where: { enrollmentId: enrollment.id }
        }
      }
    });

    if (!lesson) {
      return { success: false, message: "Lesson not found" };
    }

    const lessonProgress = lesson.progress[0] || {
      status: LessonProgressStatus.NOT_STARTED,
      progress: 0,
      timeSpent: 0,
      completedAt: null
    };

    const currentSequence = lesson.sequence;
    const moduleLessons = lesson.module.lessons;

    const currentIndex = moduleLessons.findIndex(l => l.id === validatedLessonId);
    const previousLesson = currentIndex > 0 ? moduleLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < moduleLessons.length - 1 ? moduleLessons[currentIndex + 1] : null;

    await db.courseEnrollment.update({
      where: { id: enrollment.id },
      data: { lastAccessedAt: new Date() }
    });

    if (lesson.progress[0]) {
      await db.lessonProgress.update({
        where: { id: lesson.progress[0].id },
        data: { lastAccessedAt: new Date() }
      });
    }

    return {
      success: true,
      data: {
        lesson: {
          ...lesson,
          lessonType: "TEXT", // Default for legacy if not present in schema, or map if it is
          progress: undefined
        },
        progress: lessonProgress,
        navigation: {
          previousLesson,
          nextLesson
        }
      }
    };
  } catch (error) {
    console.error("Error fetching lesson:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to fetch lesson" };
  }
}

/**
 * Mark lesson as complete
 * Requirements: AC3
 */
export async function markLessonComplete(lessonId: string, enrollmentId: string) {
  try {
    // Validate input
    const validatedLessonId = lessonIdSchema.parse(lessonId);
    const validatedEnrollmentId = enrollmentIdSchema.parse(enrollmentId);

    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { student } = studentData;

    // Check if what kind of ID this is (SubModule or Lesson)
    // We can infer by checking which table it exists in
    const isSubModule = await db.subModule.findUnique({ where: { id: validatedLessonId } });

    // Find or create lesson progress
    // Need to handle both cases dynamically
    const query = {
      enrollmentId: validatedEnrollmentId,
      ...(isSubModule ? { subModuleId: validatedLessonId } : { lessonId: validatedLessonId })
    };

    let lessonProgress = await db.lessonProgress.findFirst({
      where: query
    });

    if (!lessonProgress) {
      lessonProgress = await db.lessonProgress.create({
        data: {
          enrollmentId: validatedEnrollmentId,
          // Conditionally set the ID field
          lessonId: isSubModule ? undefined : validatedLessonId,
          subModuleId: isSubModule ? validatedLessonId : undefined,
          status: LessonProgressStatus.COMPLETED,
          progress: 100,
          timeSpent: 0,
          startedAt: new Date(),
          completedAt: new Date()
        }
      });
    } else if (lessonProgress.status !== LessonProgressStatus.COMPLETED) {
      lessonProgress = await db.lessonProgress.update({
        where: { id: lessonProgress.id },
        data: {
          status: LessonProgressStatus.COMPLETED,
          progress: 100,
          completedAt: new Date()
        }
      });
    }

    // Recalculate course progress
    // This is complex because we need to know the total items.
    // Simplifying: If we are in Unified mode, we should really count SubModules in the Syllabus.
    // If we are in Legacy mode, we count CourseLessons.

    // Fetch Enrollment to get CourseId
    const enrollment = await db.courseEnrollment.findUnique({
      where: { id: validatedEnrollmentId },
      include: { course: true }
    });

    if (!enrollment) return { success: false, message: "Enrollment not found" };

    let totalItems = 0;

    // Determine system type based on Course having a subjectId (Unified) or not (Legacy primarily)
    if (enrollment.course.subjectId) {
      // Unified: Count SubModules
      const syllabus = await db.syllabus.findFirst({
        where: { subjectId: enrollment.course.subjectId },
        include: { modules: { include: { subModules: true } } }
      });

      if (syllabus) {
        totalItems = syllabus.modules.reduce((sum, m) => sum + m.subModules.length, 0);
      }
    }

    if (totalItems === 0) {
      // Fallback to legacy
      const course = await db.course.findUnique({
        where: { id: enrollment.courseId },
        include: { modules: { include: { lessons: true } } }
      });
      totalItems = course?.modules.reduce((sum, m) => sum + m.lessons.length, 0) || 0;
    }

    const completedLessons = await db.lessonProgress.count({
      where: {
        enrollmentId: validatedEnrollmentId,
        status: LessonProgressStatus.COMPLETED
      }
    });

    const courseProgress = totalItems > 0 ? (completedLessons / totalItems) * 100 : 0;

    // Update enrollment progress
    await db.courseEnrollment.update({
      where: { id: validatedEnrollmentId },
      data: {
        progress: courseProgress,
        completedAt: courseProgress >= 100 ? new Date() : null,
        status: courseProgress >= 100 ? 'COMPLETED' : 'ACTIVE'
      }
    });

    // Revalidate course pages
    revalidatePath(`/student/courses/${enrollment.courseId}`);

    return {
      success: true,
      data: {
        lessonProgress,
        courseProgress
      },
      message: "Lesson marked as complete"
    };
  } catch (error) {
    console.error("Error marking lesson complete:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to mark lesson complete" };
  }
}

/**
 * Update lesson progress
 * Requirements: AC3
 */
export async function updateLessonProgress(
  lessonId: string,
  enrollmentId: string,
  progress: number
) {
  try {
    // Validate input
    const validatedLessonId = lessonIdSchema.parse(lessonId);
    const validatedEnrollmentId = enrollmentIdSchema.parse(enrollmentId);
    const validatedProgress = progressSchema.parse(progress);

    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { student } = studentData;

    // Verify enrollment belongs to student
    const enrollment = await db.courseEnrollment.findUnique({
      where: { id: validatedEnrollmentId }
    });

    if (!enrollment || enrollment.studentId !== student.id) {
      return { success: false, message: "Unauthorized" };
    }

    const isSubModule = await db.subModule.findUnique({ where: { id: validatedLessonId } });
    const query = {
      enrollmentId: validatedEnrollmentId,
      ...(isSubModule ? { subModuleId: validatedLessonId } : { lessonId: validatedLessonId })
    };

    // Find or create lesson progress
    let lessonProgress = await db.lessonProgress.findFirst({
      where: query
    });

    const now = new Date();
    const status = validatedProgress >= 100
      ? LessonProgressStatus.COMPLETED
      : validatedProgress > 0
        ? LessonProgressStatus.IN_PROGRESS
        : LessonProgressStatus.NOT_STARTED;

    if (!lessonProgress) {
      lessonProgress = await db.lessonProgress.create({
        data: {
          enrollmentId: validatedEnrollmentId,
          lessonId: isSubModule ? undefined : validatedLessonId,
          subModuleId: isSubModule ? validatedLessonId : undefined,
          status,
          progress: validatedProgress,
          timeSpent: 0,
          startedAt: validatedProgress > 0 ? now : null,
          completedAt: validatedProgress >= 100 ? now : null
        }
      });
    } else {
      lessonProgress = await db.lessonProgress.update({
        where: { id: lessonProgress.id },
        data: {
          status,
          progress: validatedProgress,
          startedAt: lessonProgress.startedAt || (validatedProgress > 0 ? now : null),
          completedAt: validatedProgress >= 100 ? now : null
        }
      });
    }

    return {
      success: true,
      data: lessonProgress,
      message: "Progress updated"
    };
  } catch (error) {
    console.error("Error updating lesson progress:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to update progress" };
  }
}

/**
 * Get course progress summary
 * Requirements: AC3
 */
export async function getCourseProgress(courseId: string) {
  try {
    // Validate input
    const validatedCourseId = courseIdSchema.parse(courseId);

    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { student } = studentData;

    // Get enrollment with progress
    const enrollment = await db.courseEnrollment.findFirst({
      where: {
        studentId: student.id,
        courseId: validatedCourseId
      },
      include: {
        lessonProgress: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                moduleId: true
              }
            }
          }
        },
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!enrollment) {
      return { success: false, message: "Not enrolled in this course" };
    }

    // Calculate statistics
    const totalLessons = enrollment.course.modules.reduce(
      (sum, module) => sum + module.lessons.length,
      0
    );

    const completedLessons = enrollment.lessonProgress.filter(
      p => p.status === LessonProgressStatus.COMPLETED
    ).length;

    const inProgressLessons = enrollment.lessonProgress.filter(
      p => p.status === LessonProgressStatus.IN_PROGRESS
    ).length;

    const totalTimeSpent = enrollment.lessonProgress.reduce(
      (sum, p) => sum + p.timeSpent,
      0
    );

    return {
      success: true,
      data: {
        enrollmentId: enrollment.id,
        progress: enrollment.progress,
        totalLessons,
        completedLessons,
        inProgressLessons,
        notStartedLessons: totalLessons - completedLessons - inProgressLessons,
        totalTimeSpent,
        enrolledAt: enrollment.enrolledAt,
        lastAccessedAt: enrollment.lastAccessedAt,
        completedAt: enrollment.completedAt,
        status: enrollment.status
      }
    };
  } catch (error) {
    console.error("Error fetching course progress:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to fetch course progress" };
  }
}

/**
 * Get next lesson in sequence
 * Requirements: AC2
 */
export async function getNextLesson(currentLessonId: string, courseId: string) {
  try {
    // Validate input
    const validatedLessonId = lessonIdSchema.parse(currentLessonId);
    const validatedCourseId = courseIdSchema.parse(courseId);

    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }

    // Get current lesson
    // Try to find as CourseLesson first (legacy), then SubModule
    const currentLesson = await db.courseLesson.findUnique({
      where: { id: validatedLessonId },
      include: {
        module: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                sequence: true
              },
              orderBy: { sequence: 'asc' }
            }
          }
        }
      }
    });

    if (currentLesson) {
      // Legacy Logic
      const moduleLessons = currentLesson.module.lessons;
      const currentIndex = moduleLessons.findIndex(l => l.id === validatedLessonId);

      if (currentIndex < moduleLessons.length - 1) {
        return { success: true, data: moduleLessons[currentIndex + 1] };
      }
      // Check next module
      const nextModule = await db.courseModule.findFirst({
        where: {
          courseId: validatedCourseId,
          sequence: { gt: currentLesson.module.sequence }
        },
        orderBy: { sequence: 'asc' },
        include: {
          lessons: {
            orderBy: { sequence: 'asc' },
            take: 1
          }
        }
      });

      if (nextModule && nextModule.lessons.length > 0) {
        return { success: true, data: nextModule.lessons[0] };
      }
      return { success: true, data: null };
    }

    // New SubModule Logic
    const subModule = await db.subModule.findUnique({
      where: { id: validatedLessonId },
      include: {
        module: {
          include: {
            subModules: {
              orderBy: { order: 'asc' },
              select: { id: true, title: true, order: true }
            }
          }
        }
      }
    });

    if (!subModule) {
      return { success: false, message: "Lesson not found" };
    }

    const moduleSubModules = subModule.module.subModules;
    const currentIndex = moduleSubModules.findIndex(sm => sm.id === validatedLessonId);

    if (currentIndex < moduleSubModules.length - 1) {
      return { success: true, data: moduleSubModules[currentIndex + 1] };
    }

    // Check next module
    const nextModule = await db.module.findFirst({
      where: {
        syllabusId: subModule.module.syllabusId,
        order: { gt: subModule.module.order }
      },
      orderBy: { order: 'asc' },
      include: {
        subModules: {
          orderBy: { order: 'asc' },
          take: 1
        }
      }
    });

    if (nextModule && nextModule.subModules.length > 0) {
      return { success: true, data: nextModule.subModules[0] };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("Error fetching next lesson:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to fetch next lesson" };
  }
}

/**
 * Get previous lesson in sequence
 * Requirements: AC2
 */
export async function getPreviousLesson(currentLessonId: string, courseId: string) {
  try {
    // Validate input
    const validatedLessonId = lessonIdSchema.parse(currentLessonId);
    const validatedCourseId = courseIdSchema.parse(courseId);

    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }

    // Attempt to find as CourseLesson (Legacy)
    const currentLesson = await db.courseLesson.findUnique({
      where: { id: validatedLessonId },
      include: {
        module: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                sequence: true
              },
              orderBy: { sequence: 'asc' }
            }
          }
        }
      }
    });

    if (currentLesson) {
      // Legacy Logic
      const moduleLessons = currentLesson.module.lessons;
      const currentIndex = moduleLessons.findIndex(l => l.id === validatedLessonId);

      if (currentIndex > 0) {
        return { success: true, data: moduleLessons[currentIndex - 1] };
      }

      // If no previous lesson in current module, find last lesson of previous module
      const previousModule = await db.courseModule.findFirst({
        where: {
          courseId: validatedCourseId,
          sequence: { lt: currentLesson.module.sequence }
        },
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              sequence: true
            },
            orderBy: { sequence: 'desc' },
            take: 1
          }
        },
        orderBy: { sequence: 'desc' }
      });

      if (previousModule && previousModule.lessons.length > 0) {
        return { success: true, data: previousModule.lessons[0] };
      }
      return { success: true, data: null };
    }

    // Unified SubModule Logic
    const subModule = await db.subModule.findUnique({
      where: { id: validatedLessonId },
      include: {
        module: {
          include: {
            subModules: {
              orderBy: { order: 'asc' },
              select: { id: true, title: true, order: true }
            }
          }
        }
      }
    });

    if (!subModule) {
      return { success: false, message: "Lesson not found" };
    }

    const moduleSubModules = subModule.module.subModules;
    const currentIndex = moduleSubModules.findIndex(sm => sm.id === validatedLessonId);

    if (currentIndex > 0) {
      return { success: true, data: moduleSubModules[currentIndex - 1] };
    }

    // Check previous module
    const previousModule = await db.module.findFirst({
      where: {
        syllabusId: subModule.module.syllabusId,
        order: { lt: subModule.module.order }
      },
      orderBy: { order: 'desc' },
      include: {
        subModules: {
          orderBy: { order: 'desc' },
          take: 1
        }
      }
    });

    if (previousModule && previousModule.subModules.length > 0) {
      return { success: true, data: previousModule.subModules[0] };
    }

    return {
      success: true,
      data: null,
      message: "No previous lesson available"
    };
  } catch (error) {
    console.error("Error fetching previous lesson:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to fetch previous lesson" };
  }
}
