"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Copy, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScopeSelector } from "./scope-selector";
import { cloneSyllabus } from "@/lib/actions/syllabusActions";

// Schema for clone form
const cloneSyllabusSchema = z.object({
  scopeType: z.enum(["SUBJECT_WIDE", "CLASS_WIDE", "SECTION_SPECIFIC"]),
  academicYearId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  curriculumType: z.string().optional(),
});

type CloneSyllabusFormValues = z.infer<typeof cloneSyllabusSchema>;

interface CloneSyllabusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syllabus: any;
  academicYears: any[];
  classes: any[];
  sections: any[];
  onSectionsLoad: (classId: string) => Promise<void>;
  userId: string;
  onSuccess?: () => void;
}

export function CloneSyllabusDialog({
  open,
  onOpenChange,
  syllabus,
  academicYears,
  classes,
  sections,
  onSectionsLoad,
  userId,
  onSuccess,
}: CloneSyllabusDialogProps) {
  const router = useRouter();
  const [isCloning, setIsCloning] = useState(false);

  const form = useForm<CloneSyllabusFormValues>({
    resolver: zodResolver(cloneSyllabusSchema),
    defaultValues: {
      scopeType: "SUBJECT_WIDE",
      academicYearId: undefined,
      classId: undefined,
      sectionId: undefined,
      curriculumType: syllabus?.curriculumType || "GENERAL",
    },
  });

  // Watch classId to load sections
  const watchedClassId = form.watch("classId");
  useEffect(() => {
    if (watchedClassId) {
      onSectionsLoad(watchedClassId);
    }
  }, [watchedClassId, onSectionsLoad]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && syllabus) {
      form.reset({
        scopeType: "SUBJECT_WIDE",
        academicYearId: undefined,
        classId: undefined,
        sectionId: undefined,
        curriculumType: syllabus.curriculumType || "GENERAL",
      });
    }
  }, [open, syllabus, form]);

  async function onSubmit(values: CloneSyllabusFormValues) {
    if (!syllabus || !userId) {
      toast.error("Missing required information");
      return;
    }

    try {
      setIsCloning(true);

      // Prepare new scope based on form values
      const newScope: any = {
        curriculumType: values.curriculumType,
      };

      // Handle academicYearId
      if (values.academicYearId && values.academicYearId !== "none") {
        newScope.academicYearId = values.academicYearId;
      }

      // Handle scope fields based on scope type
      if (values.scopeType === "CLASS_WIDE" && values.classId) {
        newScope.classId = values.classId;
      } else if (values.scopeType === "SECTION_SPECIFIC" && values.classId && values.sectionId) {
        newScope.classId = values.classId;
        newScope.sectionId = values.sectionId;
      }

      const result = await cloneSyllabus(syllabus.id, newScope);

      if (result.success) {
        toast.success("Syllabus cloned successfully");
        onOpenChange(false);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
        // Redirect to edit page for the cloned syllabus
        if (result.data?.id) {
          // Refresh the page to show the new syllabus
          router.refresh();
        }
      } else {
        toast.error(result.error || "Failed to clone syllabus");
      }
    } catch (error) {
      console.error("Error cloning syllabus:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsCloning(false);
    }
  }

  if (!syllabus) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Clone Syllabus
          </DialogTitle>
          <DialogDescription>
            Create a copy of "{syllabus.title}" with a different scope or curriculum type.
            All units, lessons, and content will be copied to the new syllabus.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Source Syllabus Info */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="text-sm font-medium mb-2">Source Syllabus</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="font-medium">{syllabus.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="font-medium">
                    {syllabus.subject?.name} ({syllabus.subject?.code})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Scope:</span>
                  <span className="font-medium">
                    {syllabus.section
                      ? `Section: ${syllabus.section.name}`
                      : syllabus.class
                      ? `Class: ${syllabus.class.name}`
                      : "Subject-wide"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Curriculum:</span>
                  <span className="font-medium">{syllabus.curriculumType}</span>
                </div>
              </div>
            </div>

            {/* New Scope Selection */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">New Scope</h4>
              
              <FormField
                control={form.control}
                name="scopeType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ScopeSelector
                        scopeType={field.value}
                        onScopeTypeChange={(value) => {
                          field.onChange(value);
                          // Clear class and section when changing scope type
                          if (value === "SUBJECT_WIDE") {
                            form.setValue("classId", undefined);
                            form.setValue("sectionId", undefined);
                          } else if (value === "CLASS_WIDE") {
                            form.setValue("sectionId", undefined);
                          }
                        }}
                        classId={form.watch("classId")}
                        onClassChange={(value) => form.setValue("classId", value)}
                        sectionId={form.watch("sectionId")}
                        onSectionChange={(value) => form.setValue("sectionId", value)}
                        classes={classes}
                        sections={sections}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="academicYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None (All Years)</SelectItem>
                        {academicYears.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="curriculumType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Curriculum Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select curriculum type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GENERAL">General</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                        <SelectItem value="REMEDIAL">Remedial</SelectItem>
                        <SelectItem value="INTEGRATED">Integrated</SelectItem>
                        <SelectItem value="VOCATIONAL">Vocational</SelectItem>
                        <SelectItem value="SPECIAL_NEEDS">Special Needs</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCloning}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCloning}>
                {isCloning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cloning...
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Clone Syllabus
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
