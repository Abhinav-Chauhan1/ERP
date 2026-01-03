"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Plus, Trash2, Search, Check, X, AlertCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

import {
  getSubjectById,
  getTeachersForAssignment,
  assignTeacherToSubject,
  removeTeacherFromSubject
} from "@/lib/actions/subjectTeacherActions";

export default function AssignTeacherToSubjectPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<any>(null);
  const [assignedTeachers, setAssignedTeachers] = useState<any[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get subject details with assigned teachers
      const subjectResult = await getSubjectById(subjectId);

      if (subjectResult.success && subjectResult.data) {
        setSubject(subjectResult.data);

        if (subjectResult.data.teachers) {
          setAssignedTeachers(subjectResult.data.teachers);
        }
      } else {
        setError(subjectResult.error || "Failed to fetch subject details");
        toast.error(subjectResult.error || "Failed to fetch subject details");
        return;
      }

      // Get available teachers for assignment
      const teachersResult = await getTeachersForAssignment(subjectId);

      if (teachersResult.success) {
        setAvailableTeachers(teachersResult.data || []);
      } else {
        toast.error(teachersResult.error || "Failed to fetch available teachers");
      }

    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAssignTeacher(teacherId: string) {
    try {
      const result = await assignTeacherToSubject(subjectId, teacherId);

      if (result.success) {
        toast.success("Teacher assigned successfully");
        fetchData(); // Refresh data
        setAssignDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to assign teacher");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function handleRemoveTeacher() {
    if (!selectedTeacherId) return;

    try {
      const result = await removeTeacherFromSubject(subjectId, selectedTeacherId);

      if (result.success) {
        toast.success("Teacher removed successfully");
        fetchData(); // Refresh data
        setRemoveDialogOpen(false);
        setSelectedTeacherId(null);
      } else {
        toast.error(result.error || "Failed to remove teacher");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  // Filter available teachers based on search term
  const filteredTeachers = availableTeachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/admin/teaching/subjects/${subjectId}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Subject
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Assign Teachers</h1>
        </div>
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign Teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Teachers to {subject?.name}</DialogTitle>
              <DialogDescription>
                Select a teacher to assign to this subject
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="border rounded-md h-64 overflow-y-auto p-1">
                {filteredTeachers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>No available teachers found</p>
                  </div>
                ) : (
                  filteredTeachers.map(teacher => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md cursor-pointer"
                      onClick={() => handleAssignTeacher(teacher.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={teacher.avatar} />
                          <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{teacher.name}</p>
                          {teacher.department && (
                            <p className="text-xs text-muted-foreground">{teacher.department}</p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="h-7" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {subject?.name} {subject?.code && `(${subject.code})`}
              </CardTitle>
              <CardDescription>
                {subject?.department
                  ? `Department: ${subject.department}`
                  : "Manage teacher assignments for this subject"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="text-sm font-medium mb-4">Assigned Teachers ({assignedTeachers.length})</h3>

              {assignedTeachers.length === 0 ? (
                <div className="text-center py-8 border rounded-md text-muted-foreground">
                  <p className="mb-2">No teachers assigned to this subject yet</p>
                  <Button variant="outline" onClick={() => setAssignDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign First Teacher
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedTeachers.map(teacher => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={teacher.avatar} />
                          <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{teacher.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {teacher.employeeId}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {teacher.department}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => {
                          setSelectedTeacherId(teacher.id);
                          setRemoveDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Remove Teacher Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Teacher</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this teacher from the subject? This will affect all classes where this teacher teaches this subject.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveTeacher}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
