"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  createCoScholasticActivity,
  updateCoScholasticActivity,
  type CoScholasticActivityInput,
} from "@/lib/actions/coScholasticActions";
import { Loader2 } from "lucide-react";

interface CoScholasticActivityDialogProps {
  children: React.ReactNode;
  activity?: {
    id: string;
    name: string;
    assessmentType: string;
    maxMarks: number | null;
    isActive: boolean;
  };
}

export function CoScholasticActivityDialog({ children, activity }: CoScholasticActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CoScholasticActivityInput>({
    name: activity?.name || "",
    assessmentType: (activity?.assessmentType as "GRADE" | "MARKS") || "GRADE",
    maxMarks: activity?.maxMarks || undefined,
    isActive: activity?.isActive !== undefined ? activity.isActive : true,
  });

  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = activity
        ? await updateCoScholasticActivity(activity.id, formData)
        : await createCoScholasticActivity(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: activity
            ? "Activity updated successfully"
            : "Activity created successfully",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save activity",
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

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen && !activity) {
        // Reset form when closing for new activity
        setFormData({
          name: "",
          assessmentType: "GRADE",
          maxMarks: undefined,
          isActive: true,
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {activity ? "Edit Activity" : "Add Co-Scholastic Activity"}
            </DialogTitle>
            <DialogDescription>
              {activity
                ? "Update the co-scholastic activity details"
                : "Create a new co-scholastic activity for non-academic assessments"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Activity Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Sports, Art, Music, Discipline"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assessmentType">Assessment Type *</Label>
              <Select
                value={formData.assessmentType}
                onValueChange={(value: "GRADE" | "MARKS") => {
                  setFormData({
                    ...formData,
                    assessmentType: value,
                    maxMarks: value === "GRADE" ? undefined : formData.maxMarks,
                  });
                }}
                disabled={loading}
              >
                <SelectTrigger id="assessmentType">
                  <SelectValue placeholder="Select assessment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GRADE">Grade-based (A, B, C)</SelectItem>
                  <SelectItem value="MARKS">Marks-based</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.assessmentType === "GRADE"
                  ? "Students will be assigned letter grades (A, B, C, etc.)"
                  : "Students will be assigned numeric marks"}
              </p>
            </div>

            {formData.assessmentType === "MARKS" && (
              <div className="grid gap-2">
                <Label htmlFor="maxMarks">Maximum Marks *</Label>
                <Input
                  id="maxMarks"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g., 100"
                  value={formData.maxMarks || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxMarks: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  required={formData.assessmentType === "MARKS"}
                  disabled={loading}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {activity ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
