"use client";


import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, XCircle, Clock, Eye, Edit, Download, FileText, Loader2, AlertTriangle, Plus, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  getTeachersForDropdown,
  getTeacherAttendanceByDate,
  markTeacherAttendance,
  markBulkTeacherAttendance,
} from "@/lib/actions/attendanceActions";
import { AttendanceStatus } from "@prisma/client";

export default function TeacherAttendancePage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [teachers, setTeachers] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [bulkMarkingMode, setBulkMarkingMode] = useState(false);
  const [bulkAttendance, setBulkAttendance] = useState<Record<string, AttendanceStatus>>({});

  const attendanceForm = useForm({
    defaultValues: {
      status: "PRESENT" as AttendanceStatus,
      reason: "",
    },
  });

  const loadTeachers = useCallback(async () => {
    try {
      const result = await getTeachersForDropdown();
      if (result.success && result.data) {
        setTeachers(result.data);
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
      toast.error("Failed to load teachers");
    }
  }, []);

  const loadAttendanceForDate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTeacherAttendanceByDate(currentDate);
      if (result.success && result.data) {
        setAttendanceRecords(result.data);
      } else {
        setAttendanceRecords([]);
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // Load teachers on mount
  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  // Load attendance when date changes
  useEffect(() => {
    if (currentDate) {
      loadAttendanceForDate();
    }
  }, [currentDate, loadAttendanceForDate]);

  const handleEditAttendance = (teacher: any) => {
    const existingRecord = attendanceRecords.find(r => r.teacherId === teacher.id);
    setSelectedTeacher(teacher);
    attendanceForm.reset({
      status: existingRecord?.status || "PRESENT",
      reason: existingRecord?.reason || "",
    });
    setDialogOpen(true);
  };

  const onAttendanceSubmit = async (values: any) => {
    if (!selectedTeacher) return;

    try {
      const result = await markTeacherAttendance({
        teacherId: selectedTeacher.id,
        date: currentDate,
        status: values.status,
        reason: values.reason,
      });

      if (result.success) {
        toast.success("Attendance marked successfully");
        setDialogOpen(false);
        loadAttendanceForDate();
      } else {
        toast.error(result.error || "Failed to mark attendance");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
    }
  };

  const handleBulkMarkAll = async (status: AttendanceStatus) => {
    try {
      const records = teachers.map(teacher => ({
        teacherId: teacher.id,
        status,
        reason: status === AttendanceStatus.PRESENT ? "" : undefined,
      }));

      const result = await markBulkTeacherAttendance({
        date: currentDate,
        attendanceRecords: records,
      });

      if (result.success) {
        toast.success(`Marked all teachers as ${status.toLowerCase()}`);
        loadAttendanceForDate();
      } else {
        toast.error(result.error || "Failed to mark bulk attendance");
      }
    } catch (error) {
      console.error("Error marking bulk attendance:", error);
      toast.error("Failed to mark bulk attendance");
    }
  };

  const getAttendanceStats = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absent = attendanceRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const late = attendanceRecords.filter(r => r.status === AttendanceStatus.LATE).length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";

    return { total, present, absent, late, percentage };
  };

  const stats = getAttendanceStats();

  const getTeacherStatus = (teacherId: string) => {
    const record = attendanceRecords.find(r => r.teacherId === teacherId);
    return record?.status || null;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/attendance">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Attendance</h1>
        </div>
        <div className="flex gap-2">
          <DatePicker
            date={currentDate}
            onSelect={(date) => date && setCurrentDate(date)}
            placeholder="Select date"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Teachers</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Present</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.present}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Absent</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.absent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attendance Rate</CardDescription>
            <CardTitle className="text-3xl text-primary">{stats.percentage}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="mark">
        <TabsList>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="records">View Records</TabsTrigger>
        </TabsList>

        <TabsContent value="mark">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Mark Teacher Attendance</CardTitle>
                  <CardDescription>
                    Mark attendance for {currentDate.toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkMarkAll(AttendanceStatus.PRESENT)}
                  >
                    Mark All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkMarkAll(AttendanceStatus.ABSENT)}
                  >
                    Mark All Absent
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : teachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Teachers Found</h3>
                  <p className="text-muted-foreground">Add teachers to start marking attendance</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Teacher</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Employee ID</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Reason</th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((teacher) => {
                        const status = getTeacherStatus(teacher.id);
                        const record = attendanceRecords.find(r => r.teacherId === teacher.id);

                        return (
                          <tr key={teacher.id} className="border-b hover:bg-accent/50">
                            <td className="py-3 px-4 align-middle font-medium">{teacher.name}</td>
                            <td className="py-3 px-4 align-middle">{teacher.employeeId}</td>
                            <td className="py-3 px-4 align-middle">
                              {status ? (
                                <Badge
                                  className={
                                    status === AttendanceStatus.PRESENT
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : status === AttendanceStatus.ABSENT
                                        ? "bg-red-100 text-red-800 hover:bg-red-100"
                                        : status === AttendanceStatus.LATE
                                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                          : "bg-primary/10 text-primary hover:bg-primary/10"
                                  }
                                >
                                  {status}
                                </Badge>
                              ) : (
                                <Badge className="bg-muted text-gray-800 hover:bg-muted">
                                  Not Marked
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 align-middle">
                              {record?.reason || "—"}
                            </td>
                            <td className="py-3 px-4 align-middle text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAttendance(teacher)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {status ? "Edit" : "Mark"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                View attendance records for {currentDate.toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Records Found</h3>
                  <p className="text-muted-foreground mb-6">
                    No attendance has been marked for this date
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Mark Attendance
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Teacher</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Employee ID</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Reason</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-accent/50">
                          <td className="py-3 px-4 align-middle font-medium">{record.teacherName}</td>
                          <td className="py-3 px-4 align-middle">{record.employeeId}</td>
                          <td className="py-3 px-4 align-middle">
                            <Badge
                              className={
                                record.status === AttendanceStatus.PRESENT
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : record.status === AttendanceStatus.ABSENT
                                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                                    : record.status === AttendanceStatus.LATE
                                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                      : "bg-primary/10 text-primary hover:bg-primary/10"
                              }
                            >
                              {record.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle">{record.reason || "—"}</td>
                          <td className="py-3 px-4 align-middle">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Attendance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              {selectedTeacher && `Mark attendance for ${selectedTeacher.name} on ${currentDate.toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...attendanceForm}>
            <form onSubmit={attendanceForm.handleSubmit(onAttendanceSubmit)} className="space-y-4">
              <FormField
                control={attendanceForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attendance Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PRESENT">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Present</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ABSENT">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span>Absent</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="LATE">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span>Late</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={attendanceForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason (if absent/late)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Sick, Family event, etc."
                        disabled={attendanceForm.watch("status") === "PRESENT"}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

