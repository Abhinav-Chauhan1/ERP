"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import {
  assignStudentToRoute,
  getAvailableStudentsForRoute,
} from "@/lib/actions/routeActions";
import { studentRouteSchema } from "@/lib/schemas/route-schemas";

interface AssignStudentToRouteDialogProps {
  routeId: string;
  routeStops: Array<{ id: string; stopName: string; sequence: number }>;
  onSuccess?: () => void;
}

export function AssignStudentToRouteDialog({
  routeId,
  routeStops,
  onSuccess,
}: AssignStudentToRouteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const form = useForm<z.infer<typeof studentRouteSchema>>({
    resolver: zodResolver(studentRouteSchema),
    defaultValues: {
      routeId,
      studentId: "",
      pickupStop: "",
      dropStop: "",
    },
  });

  // Load available students when dialog opens
  useEffect(() => {
    if (open) {
      loadStudents();
    }
  }, [open]);

  // Search students with debounce
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      loadStudents(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, open]);

  const loadStudents = async (search?: string) => {
    try {
      setSearching(true);
      const availableStudents = await getAvailableStudentsForRoute(routeId, search);
      setStudents(availableStudents);
    } catch (error) {
      toast.error("Failed to load students");
    } finally {
      setSearching(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof studentRouteSchema>) => {
    try {
      setLoading(true);
      const result = await assignStudentToRoute(data);

      if (result.success) {
        toast.success("Student assigned to route successfully");
        setOpen(false);
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to assign student");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Assign Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Student to Route</DialogTitle>
          <DialogDescription>
            Select a student and their pickup and drop stops for this route.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Student Search and Select */}
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={searching}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {searching ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : students.length === 0 ? (
                          <div className="py-4 text-center text-sm text-muted-foreground">
                            No students available
                          </div>
                        ) : (
                          students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.user.firstName} {student.user.lastName}
                              {student.enrollments[0] && (
                                <span className="text-muted-foreground ml-2">
                                  ({student.enrollments[0].class.name}
                                  {student.enrollments[0].section &&
                                    ` - ${student.enrollments[0].section.name}`}
                                  )
                                </span>
                              )}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pickup Stop */}
            <FormField
              control={form.control}
              name="pickupStop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Stop</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pickup stop" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {routeStops.map((stop) => (
                        <SelectItem key={stop.id} value={stop.stopName}>
                          {stop.sequence}. {stop.stopName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Drop Stop */}
            <FormField
              control={form.control}
              name="dropStop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Drop Stop</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select drop stop" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {routeStops.map((stop) => (
                        <SelectItem key={stop.id} value={stop.stopName}>
                          {stop.sequence}. {stop.stopName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Student
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
