"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateSyllabusUnitProgress } from "@/lib/actions/teacherSubjectsActions";
import { toast } from "react-hot-toast";

interface SyllabusUnit {
  id: string;
  title: string;
  order: number;
  totalTopics: number;
  completedTopics: number;
  status: "not-started" | "in-progress" | "completed";
  lastUpdated: string;
}

interface SyllabusUpdateDialogProps {
  unit: SyllabusUnit;
  subjectId: string;
  onSuccess?: () => Promise<void> | void;
}

export function SyllabusUpdateDialog({ unit, subjectId, onSuccess }: SyllabusUpdateDialogProps) {
  const [open, setOpen] = useState(false);
  const [completedTopics, setCompletedTopics] = useState(unit.completedTopics);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (completedTopics > unit.totalTopics) {
      toast.error("Completed topics cannot exceed total topics");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await updateSyllabusUnitProgress(unit.id, completedTopics);
      toast.success("Syllabus progress updated successfully");
      setOpen(false);
      
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Failed to update syllabus progress:", error);
      toast.error("Failed to update syllabus progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not-started":
        return <Badge variant="outline">Not Started</Badge>;
      case "in-progress":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Update Progress</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Syllabus Progress</DialogTitle>
          <DialogDescription>
            Track your progress through the syllabus unit
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">Unit {unit.order}: {unit.title}</h3>
                <div className="flex gap-1 items-center mt-1">
                  {getStatusBadge(unit.status)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Topics</p>
                <p className="font-medium">{unit.totalTopics}</p>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="completedTopics">Completed Topics</Label>
              <Input
                id="completedTopics"
                type="number"
                min={0}
                max={unit.totalTopics}
                value={completedTopics}
                onChange={(e) => setCompletedTopics(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className={`h-2.5 rounded-full ${
                  completedTopics === unit.totalTopics ? "bg-green-500" :
                  completedTopics > 0 ? "bg-amber-500" :
                  "bg-gray-400"
                }`}
                style={{ width: `${(completedTopics / unit.totalTopics) * 100}%` }}
              ></div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Save Progress"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
