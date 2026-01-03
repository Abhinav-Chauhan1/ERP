"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, Edit, Trash2, BookOpen, Clock,
  FileText, CalendarDays, Bookmark, ExternalLink,
  AlertCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import toast from "react-hot-toast";

import { getLessonById, deleteLesson } from "@/lib/actions/lessonsActions";

export default function LessonDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchLesson() {
      setLoading(true);
      setError(null);

      try {
        const id = params.id as string;
        const result = await getLessonById(id);

        if (result.success) {
          setLesson(result.data);
        } else {
          setError(result.error || "An error occurred");
          toast.error(result.error || "An error occurred");
        }
      } catch (err) {
        setError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [params.id]);

  async function handleDelete() {
    try {
      const id = params.id as string;
      const result = await deleteLesson(id);

      if (result.success) {
        toast.success("Lesson deleted successfully");
        router.push('/admin/teaching/lessons');
      } else {
        toast.error(result.error || "Failed to delete lesson");
        setDeleteDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/teaching/lessons')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Lessons
        </Button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Lesson not found</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/teaching/lessons')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Lessons
        </Button>
      </div>
    );
  }

  // Parse resources from comma-separated string
  const resourcesList = lesson.resources ?
    lesson.resources.split(',').filter((r: string) => r.trim().length > 0).map((r: string) => r.trim()) :
    [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/teaching/lessons">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Lessons
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/teaching/lessons/${lesson.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Lesson
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{lesson.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-normal">
                  {lesson.subject.name} {lesson.subject.code && `(${lesson.subject.code})`}
                </Badge>
                <Badge variant="outline" className="font-normal">
                  {lesson.unit}
                </Badge>
              </CardDescription>
            </div>
            <Badge variant="secondary">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {lesson.duration} minutes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-foreground">{lesson.description || "No description provided."}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Applicable Classes</h3>
            <div className="flex flex-wrap gap-2">
              {lesson.grades.length > 0 ? (
                lesson.grades.map((grade: string) => (
                  <Badge key={grade} variant="secondary">
                    {grade}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No classes assigned</p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Lesson Content</h3>
            <div className="bg-accent p-4 rounded-md">
              {lesson.content ? (
                <div>
                  {lesson.content.startsWith('http') ? (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <a
                        href={lesson.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {lesson.content}
                      </a>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{lesson.content}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No content provided</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Resources</h3>
            {resourcesList.length > 0 ? (
              <div className="space-y-2">
                {resourcesList.map((resource: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-accent rounded-md">
                    <FileText className="h-4 w-4 text-primary" />
                    {resource.startsWith('http') ? (
                      <a
                        href={resource}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex-1 truncate"
                      >
                        {resource}
                      </a>
                    ) : (
                      <span className="text-sm flex-1 truncate">{resource}</span>
                    )}
                    <Button variant="ghost" size="sm" className="ml-auto" asChild>
                      <a
                        href={resource.startsWith('http') ? resource : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No resources available</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            <p>Created: {format(new Date(lesson.createdAt), 'MMMM d, yyyy')}</p>
            <p>Last Updated: {format(new Date(lesson.updatedAt), 'MMMM d, yyyy')}</p>
          </div>
          <Link href={`/admin/teaching/subjects/${lesson.subject.id}`}>
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              View Subject
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lesson? This action cannot be undone and will remove all associated resources and materials.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
