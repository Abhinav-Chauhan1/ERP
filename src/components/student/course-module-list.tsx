"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  duration: number | null;
  isCompleted: boolean;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CourseModuleListProps {
  modules: Module[];
  currentLessonId: string | null;
  onLessonClick: (lessonId: string) => void;
  className?: string;
}

export function CourseModuleList({
  modules,
  currentLessonId,
  onLessonClick,
  className,
}: CourseModuleListProps) {
  // Initialize with all modules open by default
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(
    modules.reduce((acc, module) => {
      acc[module.id] = true;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getModuleStats = (module: Module) => {
    const totalLessons = module.lessons.length;
    const completedLessons = module.lessons.filter((l) => l.isCompleted).length;
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    return { totalLessons, completedLessons, progress };
  };

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Course Content</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {modules.length} module{modules.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="p-2">
          {modules.map((module, index) => {
            const { totalLessons, completedLessons, progress } = getModuleStats(module);
            const isOpen = openModules[module.id];
            const isModuleComplete = progress === 100;

            return (
              <Collapsible
                key={module.id}
                open={isOpen}
                onOpenChange={() => toggleModule(module.id)}
                className="mb-2"
              >
                <div
                  className={cn(
                    "rounded-lg border transition-colors",
                    isModuleComplete
                      ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                      : "bg-background hover:bg-accent/50"
                  )}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-4 h-auto hover:bg-transparent"
                    >
                      <div className="flex items-start gap-3 w-full">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                        )}
                        
                        <div className="flex-1 text-left space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Module {index + 1}
                            </span>
                            {isModuleComplete && (
                              <Badge
                                variant="default"
                                className="h-5 px-1.5 bg-green-600 dark:bg-green-700"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-sm leading-tight">
                            {module.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              {completedLessons}/{totalLessons} lessons
                            </span>
                            {progress > 0 && progress < 100 && (
                              <span className="text-primary font-medium">
                                {Math.round(progress)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-4 pb-3 space-y-1">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const isCurrentLesson = lesson.id === currentLessonId;
                        const duration = formatDuration(lesson.duration);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => onLessonClick(lesson.id)}
                            className={cn(
                              "w-full text-left p-3 rounded-md transition-colors",
                              "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary",
                              isCurrentLesson &&
                                "bg-primary/10 border border-primary/20",
                              lesson.isCompleted && !isCurrentLesson && "opacity-75"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {lesson.isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {lessonIndex + 1}.
                                  </span>
                                  <h5
                                    className={cn(
                                      "text-sm font-medium truncate",
                                      isCurrentLesson && "text-primary"
                                    )}
                                  >
                                    {lesson.title}
                                  </h5>
                                </div>

                                {duration && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {duration}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {isCurrentLesson && (
                                <Badge
                                  variant="default"
                                  className="h-5 px-2 text-xs shrink-0"
                                >
                                  Current
                                </Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
