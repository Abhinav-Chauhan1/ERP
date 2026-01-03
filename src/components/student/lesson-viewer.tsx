"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  PlayCircle,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from "isomorphic-dompurify";

interface LessonContent {
  id: string;
  contentType: "VIDEO" | "AUDIO" | "PDF" | "DOCUMENT" | "TEXT" | "IMAGE" | "LINK" | "EMBED";
  title: string | null;
  url: string | null;
  content: string | null;
  duration: number | null;
  sequence: number;
  isDownloadable: boolean;
}

interface LessonViewerProps {
  lesson: {
    id: string;
    title: string;
    description: string | null;
    lessonType: "TEXT" | "VIDEO" | "AUDIO" | "DOCUMENT" | "PRESENTATION" | "INTERACTIVE" | "QUIZ";
    duration: number | null;
    sequence: number;
    contents: LessonContent[];
  };
  progress: {
    id: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    progress: number;
    timeSpent: number;
  } | null;
  navigation: {
    previousLesson: { id: string; title: string; } | null;
    nextLesson: { id: string; title: string; } | null;
  };
  courseId: string;
  onComplete: () => Promise<void>;
  onProgressUpdate: (progress: number) => Promise<void>;
}

export function LessonViewer({
  lesson,
  progress,
  navigation,
  courseId,
  onComplete,
  onProgressUpdate,
}: LessonViewerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress?.progress || 0);
  const [timeSpent, setTimeSpent] = useState(progress?.timeSpent || 0);
  const startTimeRef = useRef<number>(Date.now());
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isCompleted = progress?.status === "COMPLETED";

  // Track time spent
  useEffect(() => {
    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeSpent((prev) => prev + elapsed);
      startTimeRef.current = Date.now();
    }, 10000); // Update every 10 seconds

    // Copy ref value to a variable for cleanup
    const progressInterval = progressIntervalRef.current;

    return () => {
      clearInterval(interval);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [lesson.id]);

  // Auto-update progress for text content based on scroll
  useEffect(() => {
    if (isCompleted || lesson.lessonType !== "TEXT") return;

    const handleScroll = () => {
      const scrollPercentage =
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      const newProgress = Math.min(Math.max(scrollPercentage, localProgress), 100);

      if (newProgress > localProgress && newProgress - localProgress > 5) {
        setLocalProgress(newProgress);
        onProgressUpdate(newProgress).catch(console.error);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lesson.id, lesson.lessonType, localProgress, isCompleted, onProgressUpdate]);

  const handleMarkComplete = async () => {
    if (isCompleted) return;

    setIsCompleting(true);
    try {
      await onComplete();
      toast({
        title: "Lesson Completed",
        description: "Great job! You've completed this lesson.",
      });
      setLocalProgress(100);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark lesson as complete",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNavigation = (lessonId: string) => {
    router.push(`/student/courses/${courseId}/lessons/${lessonId}`);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimeSpent = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Sort contents by sequence
  const sortedContents = [...lesson.contents].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize">
                  {lesson.lessonType.toLowerCase()}
                </Badge>
                {isCompleted && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                )}
                {lesson.duration && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(lesson.duration)}
                  </span>
                )}
              </div>
              <CardTitle className="text-2xl">{lesson.title}</CardTitle>
              {lesson.description && (
                <CardDescription className="text-base">
                  {lesson.description}
                </CardDescription>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {!isCompleted && (
            <div className="space-y-2 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(localProgress)}%</span>
              </div>
              <Progress value={localProgress} className="h-2" />
              {timeSpent > 0 && (
                <p className="text-xs text-muted-foreground">
                  Time spent: {formatTimeSpent(timeSpent)}
                </p>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Lesson Content */}
      <div className="space-y-4">
        {sortedContents.map((content) => (
          <LessonContentRenderer key={content.id} content={content} />
        ))}
      </div>

      {/* Progress & Actions */}
      {!isCompleted && (
        <Card className="bg-accent/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Lesson Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Mark as complete when you're done
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">{Math.round(localProgress)}%</div>
            </div>
            <Progress value={localProgress} className="mb-4" />
            <div className="flex gap-3">
              <Button
                onClick={handleMarkComplete}
                disabled={isCompleting}
                className="flex-1 min-h-[44px]"
              >
                {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {navigation.previousLesson ? (
          <Button
            variant="outline"
            onClick={() => handleNavigation(navigation.previousLesson!.id)}
            className="flex-1 min-h-[44px]"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Lesson
          </Button>
        ) : (
          <Button variant="outline" disabled className="flex-1 min-h-[44px]">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Lesson
          </Button>
        )}

        {navigation.nextLesson ? (
          <Button
            onClick={() => handleNavigation(navigation.nextLesson!.id)}
            className="flex-1 min-h-[44px]"
          >
            Next Lesson
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button disabled className="flex-1 min-h-[44px]">
            Next Lesson
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Content Renderer Component
function LessonContentRenderer({ content }: { content: LessonContent }) {
  switch (content.contentType) {
    case "VIDEO":
      return <VideoContent content={content} />;
    case "TEXT":
      return <TextContent content={content} />;
    case "PDF":
    case "DOCUMENT":
      return <DocumentContent content={content} />;
    case "IMAGE":
      return <ImageContent content={content} />;
    case "LINK":
      return <LinkContent content={content} />;
    case "EMBED":
      return <EmbedContent content={content} />;
    default:
      return <DefaultContent content={content} />;
  }
}

// Video Content Component
function VideoContent({ content }: { content: LessonContent }) {
  if (!content.url) return null;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          <video
            src={content.url}
            controls
            className="w-full h-full"
            controlsList="nodownload"
          >
            Your browser does not support the video tag.
          </video>
        </div>
        {content.title && (
          <div className="p-4">
            <h3 className="font-medium flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              {content.title}
            </h3>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Text Content Component
function TextContent({ content }: { content: LessonContent }) {
  if (!content.content) return null;

  const sanitizedContent = DOMPurify.sanitize(content.content, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "a", "blockquote", "code", "pre", "img", "table",
      "thead", "tbody", "tr", "th", "td", "hr", "div", "span"
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class", "style"],
  });

  return (
    <Card>
      <CardContent className="p-6">
        {content.title && (
          <>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              {content.title}
            </h3>
            <Separator className="mb-4" />
          </>
        )}
        <div
          className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </CardContent>
    </Card>
  );
}

// Document/PDF Content Component
function DocumentContent({ content }: { content: LessonContent }) {
  if (!content.url) return null;

  return (
    <Card>
      <CardContent className="p-6">
        {content.title && (
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            {content.title}
          </h3>
        )}
        <div className="space-y-4">
          <div className="aspect-[8.5/11] w-full bg-muted rounded-lg overflow-hidden">
            <iframe
              src={content.url}
              className="w-full h-full"
              title={content.title || "Document"}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="flex-1">
              <a href={content.url} target="_blank" rel="noopener noreferrer">
                Open in New Tab
              </a>
            </Button>
            {content.isDownloadable && (
              <Button variant="outline" asChild className="flex-1">
                <a href={content.url} download>
                  Download
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Image Content Component
function ImageContent({ content }: { content: LessonContent }) {
  if (!content.url) return null;

  return (
    <Card>
      <CardContent className="p-6">
        {content.title && (
          <h3 className="text-lg font-semibold mb-4">{content.title}</h3>
        )}
        <div className="relative w-full rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.url}
            alt={content.title || "Lesson image"}
            className="w-full h-auto"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Link Content Component
function LinkContent({ content }: { content: LessonContent }) {
  if (!content.url) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{content.title || "External Resource"}</h3>
            <p className="text-sm text-muted-foreground mt-1">{content.url}</p>
          </div>
          <Button variant="outline" asChild>
            <a href={content.url} target="_blank" rel="noopener noreferrer">
              Open Link
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Embed Content Component
function EmbedContent({ content }: { content: LessonContent }) {
  if (!content.url && !content.content) return null;

  return (
    <Card>
      <CardContent className="p-6">
        {content.title && (
          <h3 className="text-lg font-semibold mb-4">{content.title}</h3>
        )}
        <div className="aspect-video w-full rounded-lg overflow-hidden">
          {content.url ? (
            <iframe
              src={content.url}
              className="w-full h-full"
              title={content.title || "Embedded content"}
              allowFullScreen
            />
          ) : content.content ? (
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.content) }} />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// Default Content Component
function DefaultContent({ content }: { content: LessonContent }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Content type not supported: {content.contentType}</p>
          {content.url && (
            <Button variant="link" asChild className="mt-2">
              <a href={content.url} target="_blank" rel="noopener noreferrer">
                Open in new tab
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
export function LessonViewerSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Skeleton className="aspect-video w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
