export const dynamic = 'force-dynamic';

import { auth } from "@/auth";
import { redirect } from 'next/navigation';
import { db as prisma } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Users, MessageSquare } from 'lucide-react';
import Image from "next/image";

export default async function TeacherCoursesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/login');
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });

  if (!teacher) {
    redirect('/');
  }

  const courses = await prisma.course.findMany({
    where: {
      teacherId: teacher.id,
    },
    include: {
      subject: true,
      class: true,
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Manage your learning courses</p>
        </div>
        <Link href="/teacher/courses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-4">Create your first course to get started</p>
            <Link href="/teacher/courses/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const totalLessons = course.modules.reduce(
              (sum, module) => sum + module.lessons.length,
              0
            );

            return (
              <Link key={course.id} href={`/teacher/courses/${course.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                    {course.thumbnail ? (
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                      <Badge variant="outline">{course.level}</Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {course.subject && (
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{course.subject.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{course._count.enrollments} students enrolled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{course._count.discussions} discussions</span>
                      </div>
                      <div className="text-xs">
                        {course.modules.length} modules • {totalLessons} lessons
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
  );
}
