'use server';

import { auth } from '@clerk/nextjs/server';
import { db as prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Course Management Actions

export async function createCourse(data: {
  title: string;
  description?: string;
  subjectId?: string;
  classId?: string;
  thumbnail?: string;
  duration?: number;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get teacher ID
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      return { success: false, error: 'Teacher not found' };
    }

    const course = await prisma.course.create({
      data: {
        ...data,
        teacherId: teacher.id,
        status: 'DRAFT',
        isPublished: false,
      },
      include: {
        subject: true,
        class: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    revalidatePath('/teacher/courses');
    return { success: true, data: course };
  } catch (error) {
    console.error('Error creating course:', error);
    return { success: false, error: 'Failed to create course' };
  }
}

export async function updateCourse(
  courseId: string,
  data: {
    title?: string;
    description?: string;
    subjectId?: string;
    classId?: string;
    thumbnail?: string;
    duration?: number;
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data,
      include: {
        subject: true,
        class: true,
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });

    revalidatePath('/teacher/courses');
    revalidatePath(`/teacher/courses/${courseId}`);
    return { success: true, data: course };
  } catch (error) {
    console.error('Error updating course:', error);
    return { success: false, error: 'Failed to update course' };
  }
}

export async function publishCourse(courseId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'PUBLISHED',
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    revalidatePath('/teacher/courses');
    revalidatePath(`/teacher/courses/${courseId}`);
    return { success: true, data: course };
  } catch (error) {
    console.error('Error publishing course:', error);
    return { success: false, error: 'Failed to publish course' };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    revalidatePath('/teacher/courses');
    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false, error: 'Failed to delete course' };
  }
}

export async function getCourses(filters?: {
  teacherId?: string;
  subjectId?: string;
  classId?: string;
  status?: string;
  isPublished?: boolean;
}) {
  try {
    const where: any = {};
    if (filters) {
      if (filters.teacherId) where.teacherId = filters.teacherId;
      if (filters.subjectId) where.subjectId = filters.subjectId;
      if (filters.classId) where.classId = filters.classId;
      if (filters.status) where.status = filters.status;
      if (filters.isPublished !== undefined) where.isPublished = filters.isPublished;
    }
    
    const courses = await prisma.course.findMany({
      where,
      include: {
        subject: true,
        class: true,
        teacher: {
          include: {
            user: true,
          },
        },
        modules: {
          include: {
            lessons: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            discussions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data: courses };
  } catch (error) {
    console.error('Error fetching courses:', error);
    return { success: false, error: 'Failed to fetch courses' };
  }
}

export async function getCourseById(courseId: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        subject: true,
        class: true,
        teacher: {
          include: {
            user: true,
          },
        },
        modules: {
          include: {
            lessons: {
              include: {
                contents: true,
                quizzes: true,
              },
            },
          },
          orderBy: {
            sequence: 'asc',
          },
        },
        _count: {
          select: {
            enrollments: true,
            discussions: true,
          },
        },
      },
    });

    if (!course) {
      return { success: false, error: 'Course not found' };
    }

    return { success: true, data: course };
  } catch (error) {
    console.error('Error fetching course:', error);
    return { success: false, error: 'Failed to fetch course' };
  }
}

// Module Management Actions

export async function createModule(data: {
  courseId: string;
  title: string;
  description?: string;
  sequence: number;
  duration?: number;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const module = await prisma.courseModule.create({
      data,
    });

    revalidatePath(`/teacher/courses/${data.courseId}`);
    return { success: true, data: module };
  } catch (error) {
    console.error('Error creating module:', error);
    return { success: false, error: 'Failed to create module' };
  }
}

export async function updateModule(
  moduleId: string,
  data: {
    title?: string;
    description?: string;
    sequence?: number;
    duration?: number;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const module = await prisma.courseModule.update({
      where: { id: moduleId },
      data,
    });

    revalidatePath(`/teacher/courses/${module.courseId}`);
    return { success: true, data: module };
  } catch (error) {
    console.error('Error updating module:', error);
    return { success: false, error: 'Failed to update module' };
  }
}

export async function deleteModule(moduleId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      return { success: false, error: 'Module not found' };
    }

    await prisma.courseModule.delete({
      where: { id: moduleId },
    });

    revalidatePath(`/teacher/courses/${module.courseId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting module:', error);
    return { success: false, error: 'Failed to delete module' };
  }
}

// Lesson Management Actions

export async function createLesson(data: {
  moduleId: string;
  title: string;
  description?: string;
  sequence: number;
  duration?: number;
  lessonType?: 'TEXT' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'PRESENTATION' | 'INTERACTIVE' | 'QUIZ';
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const lesson = await prisma.courseLesson.create({
      data,
    });

    const module = await prisma.courseModule.findUnique({
      where: { id: data.moduleId },
    });

    if (module) {
      revalidatePath(`/teacher/courses/${module.courseId}`);
    }

    return { success: true, data: lesson };
  } catch (error) {
    console.error('Error creating lesson:', error);
    return { success: false, error: 'Failed to create lesson' };
  }
}

export async function updateLesson(
  lessonId: string,
  data: {
    title?: string;
    description?: string;
    sequence?: number;
    duration?: number;
    lessonType?: 'TEXT' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'PRESENTATION' | 'INTERACTIVE' | 'QUIZ';
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const lesson = await prisma.courseLesson.update({
      where: { id: lessonId },
      data,
      include: {
        module: true,
      },
    });

    revalidatePath(`/teacher/courses/${lesson.module.courseId}`);
    return { success: true, data: lesson };
  } catch (error) {
    console.error('Error updating lesson:', error);
    return { success: false, error: 'Failed to update lesson' };
  }
}

export async function deleteLesson(lessonId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: {
        module: true,
      },
    });

    if (!lesson) {
      return { success: false, error: 'Lesson not found' };
    }

    await prisma.courseLesson.delete({
      where: { id: lessonId },
    });

    revalidatePath(`/teacher/courses/${lesson.module.courseId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return { success: false, error: 'Failed to delete lesson' };
  }
}

// Content Management Actions

export async function createContent(data: {
  lessonId: string;
  contentType: 'VIDEO' | 'AUDIO' | 'PDF' | 'DOCUMENT' | 'PRESENTATION' | 'IMAGE' | 'TEXT' | 'LINK' | 'EMBED';
  title?: string;
  url?: string;
  content?: string;
  duration?: number;
  fileSize?: number;
  sequence: number;
  isDownloadable?: boolean;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const courseContent = await prisma.courseContent.create({
      data,
    });

    return { success: true, data: courseContent };
  } catch (error) {
    console.error('Error creating content:', error);
    return { success: false, error: 'Failed to create content' };
  }
}

export async function updateContent(
  contentId: string,
  data: {
    title?: string;
    url?: string;
    content?: string;
    duration?: number;
    fileSize?: number;
    sequence?: number;
    isDownloadable?: boolean;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const courseContent = await prisma.courseContent.update({
      where: { id: contentId },
      data,
    });

    return { success: true, data: courseContent };
  } catch (error) {
    console.error('Error updating content:', error);
    return { success: false, error: 'Failed to update content' };
  }
}

export async function deleteContent(contentId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.courseContent.delete({
      where: { id: contentId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting content:', error);
    return { success: false, error: 'Failed to delete content' };
  }
}

// Enrollment Actions

export async function enrollInCourse(courseId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get student ID
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: student.id,
        },
      },
    });

    if (existingEnrollment) {
      return { success: false, error: 'Already enrolled in this course' };
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId,
        studentId: student.id,
        status: 'ACTIVE',
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    revalidatePath('/student/courses');
    revalidatePath(`/student/courses/${courseId}`);
    return { success: true, data: enrollment };
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return { success: false, error: 'Failed to enroll in course' };
  }
}

export async function getStudentEnrollments(studentId?: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    let targetStudentId = studentId;

    if (!targetStudentId) {
      const student = await prisma.student.findUnique({
        where: { userId },
      });

      if (!student) {
        return { success: false, error: 'Student not found' };
      }

      targetStudentId = student.id;
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId: targetStudentId,
      },
      include: {
        course: {
          include: {
            subject: true,
            class: true,
            teacher: {
              include: {
                user: true,
              },
            },
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
        lessonProgress: true,
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    return { success: true, data: enrollments };
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return { success: false, error: 'Failed to fetch enrollments' };
  }
}

// Progress Tracking Actions

export async function updateLessonProgress(data: {
  enrollmentId: string;
  lessonId: string;
  progress: number;
  timeSpent?: number;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const lessonProgress = await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: data.enrollmentId,
          lessonId: data.lessonId,
        },
      },
      update: {
        progress: data.progress,
        timeSpent: data.timeSpent ? { increment: data.timeSpent } : undefined,
        status: data.status,
        lastAccessedAt: new Date(),
        completedAt: data.status === 'COMPLETED' ? new Date() : undefined,
      },
      create: {
        enrollmentId: data.enrollmentId,
        lessonId: data.lessonId,
        progress: data.progress,
        timeSpent: data.timeSpent || 0,
        status: data.status || 'IN_PROGRESS',
        startedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    });

    // Update overall course progress
    await updateCourseProgress(data.enrollmentId);

    return { success: true, data: lessonProgress };
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return { success: false, error: 'Failed to update lesson progress' };
  }
}

async function updateCourseProgress(enrollmentId: string) {
  try {
    // Get all lesson progress for this enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
        lessonProgress: true,
      },
    });

    if (!enrollment) return;

    // Calculate total lessons
    const totalLessons = enrollment.course.modules.reduce(
      (sum, module) => sum + module.lessons.length,
      0
    );

    if (totalLessons === 0) return;

    // Calculate completed lessons
    const completedLessons = enrollment.lessonProgress.filter(
      (progress) => progress.status === 'COMPLETED'
    ).length;

    // Calculate overall progress percentage
    const overallProgress = (completedLessons / totalLessons) * 100;

    // Update enrollment
    await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        progress: overallProgress,
        lastAccessedAt: new Date(),
        completedAt: overallProgress === 100 ? new Date() : null,
        status: overallProgress === 100 ? 'COMPLETED' : 'ACTIVE',
      },
    });
  } catch (error) {
    console.error('Error updating course progress:', error);
  }
}

// Discussion Forum Actions

export async function createDiscussion(data: {
  courseId: string;
  title: string;
  content: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    const discussion = await prisma.courseDiscussion.create({
      data: {
        ...data,
        studentId: student.id,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    revalidatePath(`/student/courses/${data.courseId}/discussions`);
    return { success: true, data: discussion };
  } catch (error) {
    console.error('Error creating discussion:', error);
    return { success: false, error: 'Failed to create discussion' };
  }
}

export async function replyToDiscussion(data: {
  discussionId: string;
  content: string;
  userType: 'STUDENT' | 'TEACHER';
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const reply = await prisma.discussionReply.create({
      data: {
        ...data,
        userId,
      },
    });

    const discussion = await prisma.courseDiscussion.findUnique({
      where: { id: data.discussionId },
    });

    if (discussion) {
      revalidatePath(`/student/courses/${discussion.courseId}/discussions`);
    }

    return { success: true, data: reply };
  } catch (error) {
    console.error('Error replying to discussion:', error);
    return { success: false, error: 'Failed to reply to discussion' };
  }
}

export async function getDiscussions(courseId: string) {
  try {
    const discussions = await prisma.courseDiscussion.findMany({
      where: { courseId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        replies: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return { success: true, data: discussions };
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return { success: false, error: 'Failed to fetch discussions' };
  }
}

// Quiz Actions

export async function createQuiz(data: {
  lessonId: string;
  title: string;
  description?: string;
  questions: any[];
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  showCorrectAnswers?: boolean;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const quiz = await prisma.lessonQuiz.create({
      data: {
        ...data,
        questions: JSON.stringify(data.questions),
      },
    });

    return { success: true, data: quiz };
  } catch (error) {
    console.error('Error creating quiz:', error);
    return { success: false, error: 'Failed to create quiz' };
  }
}

export async function submitQuizAttempt(data: {
  quizId: string;
  answers: any[];
  timeSpent?: number;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    // Get quiz details
    const quiz = await prisma.lessonQuiz.findUnique({
      where: { id: data.quizId },
    });

    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    // Count existing attempts
    const attemptCount = await prisma.quizAttempt.count({
      where: {
        quizId: data.quizId,
        studentId: student.id,
      },
    });

    if (attemptCount >= quiz.maxAttempts) {
      return { success: false, error: 'Maximum attempts reached' };
    }

    // Calculate score
    const questions = JSON.parse(quiz.questions as string);
    let correctAnswers = 0;

    questions.forEach((question: any, index: number) => {
      if (data.answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / questions.length) * 100;
    const isPassed = score >= quiz.passingScore;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: data.quizId,
        studentId: student.id,
        answers: JSON.stringify(data.answers),
        score,
        isPassed,
        attemptNumber: attemptCount + 1,
        submittedAt: new Date(),
        timeSpent: data.timeSpent,
      },
    });

    return { success: true, data: attempt };
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    return { success: false, error: 'Failed to submit quiz attempt' };
  }
}

export async function getQuizAttempts(quizId: string, studentId?: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    let targetStudentId = studentId;

    if (!targetStudentId) {
      const student = await prisma.student.findUnique({
        where: { userId },
      });

      if (!student) {
        return { success: false, error: 'Student not found' };
      }

      targetStudentId = student.id;
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId,
        studentId: targetStudentId,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
    });

    return { success: true, data: attempts };
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return { success: false, error: 'Failed to fetch quiz attempts' };
  }
}
