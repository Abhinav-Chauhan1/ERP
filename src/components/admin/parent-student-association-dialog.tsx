"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckIcon, ChevronsUpDown, Loader2, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { associateStudentWithParent } from "@/lib/actions/parent-student-actions";

interface Student {
  id: string;
  admissionId: string;
  user: {
    firstName: string | null;
    lastName: string | null;
  };
  enrollments?: Array<{
    class: {
      name: string;
    };
  }>;
}

interface ParentStudentAssociationDialogProps {
  parentId: string;
  schoolId: string;
  students: Student[];
}

export function ParentStudentAssociationDialog({ parentId, schoolId, students }: ParentStudentAssociationDialogProps) {
  const [open, setOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('parentId', parentId);
    formData.append('studentId', selectedStudent.id);
    formData.append('isPrimary', isPrimary ? 'true' : 'false');

    try {
      const result = await associateStudentWithParent(formData, schoolId);
      
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setSelectedStudent(null);
        setIsPrimary(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred while associating the student");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Child
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Associate Student with Parent</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="student">Select Student</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="justify-between"
                >
                  {selectedStudent
                    ? `${selectedStudent.user.firstName || ''} ${selectedStudent.user.lastName || ''} (${selectedStudent.admissionId})`
                    : "Select student..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[400px]">
                <Command>
                  <CommandInput placeholder="Search students..." />
                  <CommandEmpty>No student found.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-y-auto">
                    {students.map((student) => (
                      <CommandItem
                        key={student.id}
                        value={student.id}
                        onSelect={() => {
                          setSelectedStudent(student);
                          setPopoverOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            {selectedStudent?.id === student.id && (
                              <CheckIcon className="mr-2 h-4 w-4" />
                            )}
                            <span className="font-medium">
                              {student.user.firstName || ''} {student.user.lastName || ''}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {student.admissionId} • 
                            {student.enrollments && student.enrollments[0] 
                              ? ` Class: ${student.enrollments[0].class.name}` 
                              : " Not enrolled"}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isPrimary" 
              checked={isPrimary} 
              onCheckedChange={(checked) => setIsPrimary(checked as boolean)} 
            />
            <Label htmlFor="isPrimary" className="cursor-pointer">
              Set as primary parent/guardian
            </Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !selectedStudent}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Associate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
