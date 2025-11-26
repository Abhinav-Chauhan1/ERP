"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Achievement = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  date: Date;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
};

type AchievementCardProps = {
  achievement: Achievement;
};

const CATEGORY_COLORS = {
  AWARD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  CERTIFICATION: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PROFESSIONAL_DEVELOPMENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  PUBLICATION: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  RECOGNITION: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const CATEGORY_LABELS = {
  AWARD: "Award",
  CERTIFICATION: "Certification",
  PROFESSIONAL_DEVELOPMENT: "Professional Development",
  PUBLICATION: "Publication",
  RECOGNITION: "Recognition",
  OTHER: "Other",
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/teacher/achievements/${achievement.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete achievement");
      }

      toast({
        title: "Success",
        description: "Achievement deleted successfully",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete achievement",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg">{achievement.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3" />
                {format(new Date(achievement.date), "MMMM d, yyyy")}
              </CardDescription>
            </div>
            <Badge 
              className={CATEGORY_COLORS[achievement.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.OTHER}
              variant="secondary"
            >
              {CATEGORY_LABELS[achievement.category as keyof typeof CATEGORY_LABELS] || achievement.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {achievement.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {achievement.description}
            </p>
          )}

          {achievement.documents.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{achievement.documents.length} document{achievement.documents.length !== 1 ? 's' : ''} attached</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              aria-label={`Delete achievement: ${achievement.title}`}
            >
              <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Achievement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this achievement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
