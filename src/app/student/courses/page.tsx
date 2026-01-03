export const dynamic = 'force-dynamic';

import { auth } from "@/auth";
import { redirect } from 'next/navigation';
import { db as prisma } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Award } from 'lucide-react';
import Image from "next/image";

export default async function StudentCoursesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/login');
  }

  // First find the user by Clerk ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    redirect('/login');
  }

  // Then find the student by user ID
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
  });

  if (!student) {
    redirect('/student');
  }

  // Get enrolled courses
  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      studentId: student.id,
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

  // Get available courses (published and not enrolled)
  const availableCourses = await prisma.course.findMany({
    where: {
      isPublished: true,
      status: 'PUBLISHED',
      enrollments: {
        none: {
          studentId: student.id,
        },
      },
    },
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
        },
      },
    },
    take: 6,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {/* My Courses Section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">My Courses</h1>
        <p className="text-muted-foreground mb-6">Continue your learning journey</p>

        {enrollments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-6 mb-4">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No enrolled courses</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-sm">
                Browse available courses below to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const course = enrollment.course;
              const totalLessons = course.modules.reduce(
                (sum, module) => sum + module.lessons.length,
                0
              );

              return (
                <Link key={enrollment.id} href={`/student/courses/${course.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {course.thumbnail && (
                      <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                          src={course.thumbnail}
                          alt={course.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline">{course.level}</Badge>
                        {enrollment.status === 'COMPLETED' && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <Award className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{Math.round(enrollment.progress)}%</span>
                          </div>
                          <Progress value={enrollment.progress} />
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {course.subject && (
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              <span>{course.subject.name}</span>
                            </div>
                          )}
                          {course.duration && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{course.duration} hours</span>
                            </div>
                          )}
                          <div className="text-xs">
                            {course.modules.length} modules • {totalLessons} lessons
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Courses Section */}
      {availableCourses.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Available Courses</h2>
          <p className="text-muted-foreground mb-6">Explore new courses to expand your knowledge</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course) => {
              const totalLessons = course.modules.reduce(
                (sum, module) => sum + module.lessons.length,
                0
              );

              return (
                <Link key={course.id} href={`/student/courses/${course.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {course.thumbnail && (
                      <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                          src={course.thumbnail}
                          alt={course.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline">{course.level}</Badge>
                        {course.subject && (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                            {course.subject.name}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        {course.duration && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration} hours</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{course.modules.length} modules • {totalLessons} lessons</span>
                        </div>
                        <div className="text-xs">
                          {course._count.enrollments} students enrolled
                        </div>
                      </div>
                      <Button className="w-full min-h-[44px]" size="sm">
                        Enroll Now
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
