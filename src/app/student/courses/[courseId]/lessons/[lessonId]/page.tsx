export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { LessonViewer, LessonViewerSkeleton } from '@/components/student/lesson-viewer';
import {
  getLessonById,
  markLessonComplete,
  updateLessonProgress,
} from '@/lib/actions/student-course-actions';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';

interface LessonViewerPageProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

export async function generateMetadata({ params }: LessonViewerPageProps): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await db.courseLesson.findUnique({
    where: { id: lessonId },
    select: {
      title: true,
      description: true,
      module: {
        select: {
          course: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    return {
      title: 'Lesson Not Found',
    };
  }

  return {
    title: `${lesson.title} | ${lesson.module.course.title} | Student Portal`,
    description: lesson.description || `Learn ${lesson.title}`,
  };
}

export default async function LessonViewerPage({ params }: LessonViewerPageProps) {
  const { courseId, lessonId } = await params;
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

  // Verify enrollment in course
  const enrollment = await db.courseEnrollment.findFirst({
    where: {
      studentId: student.id,
      courseId: courseId,
      status: 'ACTIVE',
    },
  });

  if (!enrollment) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You must be enrolled in this course to view lessons.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch lesson data with progress
  const result = await getLessonById(lessonId, courseId);

  if (!result.success || !result.data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Lesson Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {result.message || "The lesson you're looking for doesn't exist or has been removed."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { lesson, progress, navigation } = result.data;

  // Server actions for lesson interactions
  async function handleComplete() {
    'use server';
    if (!enrollment) return;
    const result = await markLessonComplete(lessonId, enrollment.id);
    if (!result.success) {
      throw new Error(result.message);
    }
  }

  async function handleProgressUpdate(progressValue: number) {
    'use server';
    if (!enrollment) return;
    const result = await updateLessonProgress(lessonId, enrollment.id, progressValue);
    if (!result.success) {
      throw new Error(result.message);
    }
  }

  // Get course title for breadcrumb
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      {course && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/student/courses" className="hover:text-primary transition-colors">
            Courses
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link 
            href={`/student/courses/${courseId}`} 
            className="hover:text-primary transition-colors"
          >
            {course.title}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{lesson.title}</span>
        </div>
      )}

      <Suspense fallback={<LessonViewerSkeleton />}>
        <LessonViewer
          lesson={lesson as any}
          progress={progress as any}
          navigation={navigation}
          courseId={courseId}
          onComplete={handleComplete}
          onProgressUpdate={handleProgressUpdate}
        />
      </Suspense>
    </div>
  );
}
