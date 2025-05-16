"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, XCircle, Clock, Eye, Edit, Download, FileText, Loader2, Check, GraduationCap, UserCheck, UserX, Trash2, Search, Filter, AlertTriangle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

const departments = [
  { id: "1", name: "Science" },
  { id: "2", name: "Mathematics" },
  { id: "3", name: "Languages" },
  { id: "4", name: "Social Studies" },
];

const recentAttendanceRecords = [
  { id: "1", date: "2023-11-28", total: 45, present: 42, absent: 3, percentage: 93.3 },
  { id: "2", date: "2023-11-27", total: 45, present: 43, absent: 2, percentage: 95.6 },
  { id: "3", date: "2023-11-26", total: 45, present: 40, absent: 5, percentage: 88.9 },
];

const leaveApplications = [
  { id: "1", teacherName: "Emily Walker", employeeId: "T001", department: "Science", type: "Sick Leave", fromDate: "2023-11-25", toDate: "2023-11-26", status: "Approved" },
  { id: "2", teacherName: "James Potter", employeeId: "T002", department: "Mathematics", type: "Family Emergency", fromDate: "2023-11-27", toDate: "2023-11-28", status: "Pending" },
  { id: "3", teacherName: "Sophia Martinez", employeeId: "T003", department: "Languages", type: "No Reason", fromDate: "2023-11-28", toDate: "2023-11-28", status: "Rejected" },
];

const teacherAttendanceData = {
  teachers: [
    { id: "1", status: "present", reason: "" },
    { id: "2", status: "absent", reason: "Sick Leave" },
    { id: "3", status: "late", reason: "Traffic" },
  ],
  takenBy: "Admin",
  timestamp: "9:00 AM",
};

const teachers = [
  { id: "1", name: "Emily Walker", employeeId: "T001", department: "Science" },
  { id: "2", name: "James Potter", employeeId: "T002", department: "Mathematics" },
  { id: "3", name: "Sophia Martinez", employeeId: "T003", department: "Languages" },
];

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const editForm = useForm({
    defaultValues: {
      status: "present",
      reason: "",
    },
  });

  const attendanceForm = useForm({
    defaultValues: {
      status: "PRESENT",
      reason: "",
    },
  });

  const reportForm = useForm({
    defaultValues: {
      startDate: null,
      endDate: null,
    },
  });

  const handleMarkAttendance = () => {
    console.log("Marking attendance for date:", selectedDate);
  };

  const handleViewAttendance = (recordId: string) => {
    setSelectedRecordId(recordId);
    setViewDialogOpen(true);
  };

  const handleEditAttendance = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setEditDialogOpen(true);
  };

  const onSubmitEdit = (values: any) => {
    console.log("Edited attendance:", values);
    setEditDialogOpen(false);
  };

  async function onAttendanceSubmit(values: any) {
    if (!user?.id) {
      console.error("User session not found");
      return;
    }

    try {
      console.log("Attendance updated:", values);
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  }

  const onReportSubmit = (values: any) => {
    console.log("Generating report:", values);
    setReportLoading(true);
    setTimeout(() => {
      setReportData({
        summary: {
          total: 100,
          present: 80,
          absent: 10,
          late: 5,
          leave: 5,
          presentPercentage: 80,
        },
        data: [
          {
            teacherId: "1",
            teacherName: "Emily Walker",
            employeeId: "T001",
            summary: {
              present: 20,
              absent: 2,
              late: 1,
              leave: 1,
              total: 24,
            },
          },
          {
            teacherId: "2",
            teacherName: "James Potter",
            employeeId: "T002",
            summary: {
              present: 18,
              absent: 3,
              late: 2,
              leave: 1,
              total: 24,
            },
          },
        ],
      });
      setReportLoading(false);
    }, 2000);
  };

  const confirmDeleteAttendance = () => {
    console.log("Deleting attendance record");
    setConfirmDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Teacher Attendance</h1>
        <div className="flex gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[180px]"
          />
          <Button onClick={handleMarkAttendance}>Mark Attendance</Button>
        </div>
      </div>

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Records</TabsTrigger>
          <TabsTrigger value="leaves">Leave Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance Records</CardTitle>
              <CardDescription>View and manage teacher attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Total</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Present</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Absent</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Percentage</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttendanceRecords.map((record) => (
                      <tr key={record.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                            <span>{new Date(record.date).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">{record.total}</td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span>{record.present}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-1.5">
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                            <span>{record.absent}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge
                            className={
                              record.percentage >= 95
                                ? "bg-green-100 text-green-800"
                                : record.percentage >= 85
                                ? "bg-blue-100 text-blue-800"
                                : record.percentage >= 75
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {record.percentage}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewAttendance(record.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves">
          <Card>
            <CardHeader>
              <CardTitle>Leave Applications</CardTitle>
              <CardDescription>
                Manage teacher leave requests and applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Teacher</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Department</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Type</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Duration</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveApplications.map((leave) => (
                      <tr key={leave.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">
                          {leave.teacherName}
                          <div className="text-xs text-gray-500">{leave.employeeId}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">{leave.department}</td>
                        <td className="py-3 px-4 align-middle">{leave.type}</td>
                        <td className="py-3 px-4 align-middle">
                          {new Date(leave.fromDate).toLocaleDateString()}
                          {leave.fromDate !== leave.toDate && (
                            <> - {new Date(leave.toDate).toLocaleDateString()}</>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge
                            className={
                              leave.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : leave.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }
                          >
                            {leave.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                          {leave.status === "Pending" && (
                            <>
                              <Button variant="ghost" size="sm" className="text-green-600">
                                Approve
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600">
                                Reject
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Attendance Analytics</CardTitle>
              <CardDescription>
                View teacher attendance trends and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-10 text-center">
                <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-lg mx-auto">
                  Track teacher attendance patterns, identify trends, and analyze department-wise attendance rates.
                </p>
                <Button>Generate Analytics</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Attendance Report</CardTitle>
              <CardDescription>Generate attendance reports for teachers</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...reportForm}>
                <form onSubmit={reportForm.handleSubmit(onReportSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={reportForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value}
                              onSelect={field.onChange}
                              placeholder="Select start date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={reportForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value}
                              onSelect={field.onChange}
                              placeholder="Select end date"
                              disabled={(date) => {
                                const startDate = reportForm.getValues("startDate");
                                return startDate ? date < startDate : false;
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={reportLoading}>
                      {reportLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Report...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
              
              {reportData && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      Teacher Attendance Report
                    </h3>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export to Excel
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mb-6">
                    <Card className="w-full md:w-auto p-4 border">
                      <div className="flex flex-col items-center">
                        <div className="text-4xl font-bold text-primary">{reportData.summary.total}</div>
                        <div className="text-sm text-gray-500">Total Records</div>
                      </div>
                    </Card>
                    <Card className="w-full md:w-auto p-4 border">
                      <div className="flex flex-col items-center">
                        <div className="text-4xl font-bold text-green-600">{reportData.summary.present}</div>
                        <div className="text-sm text-gray-500">Present</div>
                      </div>
                    </Card>
                    <Card className="w-full md:w-auto p-4 border">
                      <div className="flex flex-col items-center">
                        <div className="text-4xl font-bold text-red-600">{reportData.summary.absent}</div>
                        <div className="text-sm text-gray-500">Absent</div>
                      </div>
                    </Card>
                    <Card className="w-full md:w-auto p-4 border">
                      <div className="flex flex-col items-center">
                        <div className="text-4xl font-bold text-yellow-600">{reportData.summary.late}</div>
                        <div className="text-sm text-gray-500">Late</div>
                      </div>
                    </Card>
                    <Card className="w-full md:w-auto p-4 border">
                      <div className="flex flex-col items-center">
                        <div className="text-4xl font-bold text-blue-600">{reportData.summary.leave}</div>
                        <div className="text-sm text-gray-500">Leave</div>
                      </div>
                    </Card>
                    <Card className="w-full md:w-auto p-4 border">
                      <div className="flex flex-col items-center">
                        <div className="text-4xl font-bold text-primary">
                          {reportData.summary.presentPercentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Present %</div>
                      </div>
                    </Card>
                  </div>
                  
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Teacher</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Employee ID</th>
                            <th className="py-3 px-4 text-center font-medium text-gray-500">Present</th>
                            <th className="py-3 px-4 text-center font-medium text-gray-500">Absent</th>
                            <th className="py-3 px-4 text-center font-medium text-gray-500">Late</th>
                            <th className="py-3 px-4 text-center font-medium text-gray-500">Leave</th>
                            <th className="py-3 px-4 text-center font-medium text-gray-500">Present %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.data.map((entry: any) => (
                            <tr key={entry.teacherId} className="border-b">
                              <td className="py-3 px-4 align-middle font-medium">{entry.teacherName}</td>
                              <td className="py-3 px-4 align-middle">{entry.employeeId || "—"}</td>
                              <td className="py-3 px-4 align-middle text-center">{entry.summary.present}</td>
                              <td className="py-3 px-4 align-middle text-center">{entry.summary.absent}</td>
                              <td className="py-3 px-4 align-middle text-center">{entry.summary.late}</td>
                              <td className="py-3 px-4 align-middle text-center">{entry.summary.leave}</td>
                              <td className="py-3 px-4 align-middle text-center">
                                <div className="flex justify-center">
                                  <Badge variant={entry.summary.present / entry.summary.total > 0.75 ? "success" : 
                                        entry.summary.present / entry.summary.total > 0.5 ? "warning" : "destructive"}>
                                    {((entry.summary.present / entry.summary.total) * 100).toFixed(1)}%
                                  </Badge>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Single Teacher Attendance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update attendance for {selectedTeacher?.name} on {currentDate.toLocaleDateString()}
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
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            <span>Present</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ABSENT">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            <span>Absent</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="LATE">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                            <span>Late</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="HALF_DAY">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                            <span>Half Day</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="LEAVE">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                            <span>Leave</span>
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
                    <FormLabel>Reason (if absent/late/leave)</FormLabel>
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
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Attendance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAttendance}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
