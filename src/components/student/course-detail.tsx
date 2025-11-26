"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Clock,
  User,
  GraduationCap,
  CheckCircle2,
  PlayCircle,
  FileText,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface CourseDetailProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    level: string;
    duration: number | null;
    subject: { id: string; name: string; } | null;
    teacher: {
      id: string;
      user: { 
        id: string;
        firstName: string; 
        lastName: string; 
        avatar: string | null; 
      };
    };
    modules: Array<{
      id: string;
      title: string;
      description: string | null;
      sequence: number;
      lessons: Array<{ 
        id: string; 
        title: string;
        duration: number | null;
        sequence: number;
      }>;
    }>;
  };
  enrollment: {
    id: string;
    progress: number;
    status: string;
    enrolledAt: Date;
  } | null;
  onEnroll: () => Promise<void>;
  onUnenroll: () => Promise<void>;
}

export function CourseDetail({
  course,
  enrollment,
  onEnroll,
  onUnenroll,
}: CourseDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  const totalLessons = course.modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0
  );

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      await onEnroll();
      toast({
        title: "Success",
        description: "Successfully enrolled in course",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!confirm("Are you sure you want to unenroll from this course?")) {
      return;
    }

    setIsUnenrolling(true);
    try {
      await onUnenroll();
      toast({
        title: "Success",
        description: "Successfully unenrolled from course",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unenroll from course",
        variant: "destructive",
      });
    } finally {
      setIsUnenrolling(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case "BEGINNER":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "INTERMEDIATE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "ADVANCED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="relative">
        {/* Hero Image */}
        <div className="aspect-video w-full overflow-hidden rounded-lg mb-6">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-primary/40" />
            </div>
          )}
        </div>

        {/* Course Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{course.level}</Badge>
                {course.subject && (
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                    {course.subject.name}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              {course.description && (
                <p className="text-muted-foreground">{course.description}</p>
              )}
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{course.teacher.user.firstName} {course.teacher.user.lastName}</span>
            </div>
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
          </div>
        </div>
      </div>

      {/* Progress Section (if enrolled) */}
      {enrollment && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Your Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Keep up the great work!
                </p>
              </div>
              <div className="text-3xl font-bold text-primary">
                {Math.round(enrollment.progress)}%
              </div>
            </div>
            <Progress value={enrollment.progress} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex gap-4">
        {enrollment ? (
          <>
            <Button
              size="lg"
              className="flex-1 min-h-[48px]"
              onClick={() => {
                // Navigate to first lesson or continue where left off
                const firstModule = course.modules[0];
                const firstLesson = firstModule?.lessons[0];
                if (firstLesson) {
                  router.push(
                    `/student/courses/${course.id}/lessons/${firstLesson.id}`
                  );
                }
              }}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              {enrollment.progress > 0 ? "Continue Learning" : "Start Course"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="min-h-[48px]"
              onClick={handleUnenroll}
              disabled={isUnenrolling}
            >
              {isUnenrolling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Unenroll
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            className="flex-1 min-h-[48px]"
            onClick={handleEnroll}
            disabled={isEnrolling}
          >
            {isEnrolling && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <GraduationCap className="mr-2 h-4 w-4" />
            Enroll Now
          </Button>
        )}
      </div>

      {/* Course Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Course Content</CardTitle>
          <CardDescription>
            {course.modules.length} modules • {totalLessons} lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {course.modules.map((module, index) => (
              <div key={module.id} className="border rounded-lg">
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value={module.id} className="border-0">
                    <AccordionTrigger className="hover:no-underline p-4 hover:bg-accent transition-colors">
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 bg-primary/10 rounded-md flex-shrink-0">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{module.title}</h4>
                          {module.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {module.description}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {module.lessons.length} lessons
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border-t">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-4 hover:bg-accent transition-colors border-b last:border-b-0"
                        >
                          {enrollment ? (
                            <Link
                              href={`/student/courses/${course.id}/lessons/${lesson.id}`}
                              className="flex items-center gap-3 flex-1 hover:text-primary transition-colors"
                            >
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full border-2 border-muted flex items-center justify-center">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {lessonIndex + 1}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium">{lesson.title}</h5>
                                {lesson.duration && (
                                  <p className="text-sm text-muted-foreground">
                                    Video • {lesson.duration} min
                                  </p>
                                )}
                              </div>
                              <PlayCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            </Link>
                          ) : (
                            <>
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full border-2 border-muted flex items-center justify-center">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {lessonIndex + 1}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-muted-foreground">{lesson.title}</h5>
                                {lesson.duration && (
                                  <p className="text-sm text-muted-foreground">
                                    Video • {lesson.duration} min
                                  </p>
                                )}
                              </div>
                              <PlayCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            </>
                          )}
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
