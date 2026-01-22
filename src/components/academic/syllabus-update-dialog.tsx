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
  subModules: { id: string; title: string; isCompleted: boolean }[];
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
  const [updates, setUpdates] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize updates state from props
  const [pendingSubModules, setPendingSubModules] = useState(unit.subModules);

  const handleToggle = (subModuleId: string, currentStatus: boolean) => {
    setUpdates(prev => ({
      ...prev,
      [subModuleId]: !currentStatus
    }));

    // Optimistic update for UI
    setPendingSubModules(prev => prev.map(m =>
      m.id === subModuleId ? { ...m, isCompleted: !currentStatus } : m
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Process all updates
      // Import the new action (we initially imported the old one)
      // We will need to dynamic import or assume it's available in the file scope if we update imports
      const { updateSubModuleProgress } = await import("@/lib/actions/teacherSubjectsActions");

      const updatePromises = Object.entries(updates).map(([id, status]) =>
        updateSubModuleProgress(id, status)
      );

      await Promise.all(updatePromises);

      toast.success("Progress updated successfully");
      setOpen(false);
      setUpdates({});

      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
      toast.error("Failed to update progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = pendingSubModules.filter(m => m.isCompleted).length;
  const progressPercent = unit.totalTopics > 0 ? (completedCount / unit.totalTopics) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Update Progress</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Module Progress</DialogTitle>
          <DialogDescription>
            Mark topics as completed
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{unit.title}</h3>
                <p className="text-xs text-gray-500">Module {unit.order}</p>
              </div>
              <div className="text-right">
                <span className="font-medium text-sm">{completedCount}/{unit.totalTopics} Topics</span>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className={`h-2.5 rounded-full ${completedCount === unit.totalTopics ? "bg-green-500" :
                    completedCount > 0 ? "bg-amber-500" :
                      "bg-gray-400"
                  }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-2">
              {pendingSubModules.map((subModule) => (
                <div key={subModule.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    id={subModule.id}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={subModule.isCompleted}
                    onChange={() => handleToggle(subModule.id, subModule.isCompleted)}
                  />
                  <Label htmlFor={subModule.id} className="flex-1 cursor-pointer font-normal">
                    {subModule.title}
                  </Label>
                </div>
              ))}
              {pendingSubModules.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No topics in this module</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || Object.keys(updates).length === 0}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
