export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { CourseDetail } from '@/components/student/course-detail';
import { enrollInCourse, unenrollFromCourse } from '@/lib/actions/student-course-actions';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Metadata } from 'next';

interface CourseDetailPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      description: true,
    },
  });

  if (!course) {
    return {
      title: 'Course Not Found',
    };
  }

  return {
    title: `${course.title} | Student Portal`,
    description: course.description || `Learn ${course.title}`,
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  const session = await auth();
const userId = session?.user?.id;

  if (!userId) {
    redirect('/login');
  }

  // Get current student
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    include: { student: true },
  });

  if (!dbUser || !dbUser.student) {
    redirect('/');
  }

  const student = dbUser.student;

  // Fetch course with all related data
  const rawCourse = await db.course.findUnique({
    where: { id: courseId },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
        },
      },
      teacher: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
      modules: {
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              duration: true,
              sequence: true,
            },
            orderBy: { sequence: 'asc' },
          },
        },
        orderBy: { sequence: 'asc' },
      },
      enrollments: {
        where: { studentId: student.id },
      },
    },
  });

  // Handle course not found
  if (!rawCourse) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The course you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform course to ensure firstName and lastName are strings
  const course = {
    ...rawCourse,
    teacher: {
      ...rawCourse.teacher,
      user: {
        ...rawCourse.teacher.user,
        firstName: rawCourse.teacher.user.firstName || '',
        lastName: rawCourse.teacher.user.lastName || '',
      }
    }
  };

  // Handle unpublished course
  if (!course.isPublished) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Course Not Available</h2>
            <p className="text-muted-foreground mb-4">
              This course is not currently available for enrollment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract enrollment data
  const enrollment = course.enrollments[0] || null;

  // Server actions for enrollment
  async function handleEnroll() {
    'use server';
    const result = await enrollInCourse(courseId);
    if (!result.success) {
      throw new Error(result.message);
    }
  }

  async function handleUnenroll() {
    'use server';
    const result = await unenrollFromCourse(courseId);
    if (!result.success) {
      throw new Error(result.message);
    }
  }

  // Remove enrollments array from course object for component
  const { enrollments, ...courseData } = course;

  return (
    <div className="p-6">
      <CourseDetail
        course={courseData}
        enrollment={enrollment}
        onEnroll={handleEnroll}
        onUnenroll={handleUnenroll}
      />
    </div>
  );
}
