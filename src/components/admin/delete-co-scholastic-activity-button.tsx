"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteCoScholasticActivity } from "@/lib/actions/coScholasticActions";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteCoScholasticActivityButtonProps {
  activityId: string;
  activityName: string;
  gradeCount: number;
}

export function DeleteCoScholasticActivityButton({
  activityId,
  activityName,
  gradeCount,
}: DeleteCoScholasticActivityButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await deleteCoScholasticActivity(activityId);

      if (result.success) {
        toast({
          title: "Success",
          description: "Activity deleted successfully",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete activity",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't allow deletion if there are grades
  if (gradeCount > 0) {
    return (
      <Button variant="outline" size="sm" disabled title="Cannot delete activity with existing grades">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Activity</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the activity &quot;{activityName}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
