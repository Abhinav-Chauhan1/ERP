"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, Clock, Check, X, AlertTriangle, FileText, 
  Download, Plus, Edit, Trash2, Search, Filter, 
  Loader2, User, File, CalendarRange, 
  CalendarDays, Briefcase, Info, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { format, differenceInDays, addDays } from "date-fns";

import { 
  leaveApplicationSchema,
  LeaveApplicationFormValues,
  leaveApplicationUpdateSchema,
  LeaveApplicationUpdateFormValues,
  leaveApprovalSchema,
  LeaveApprovalFormValues
} from "@/lib/schemaValidation/leaveApplicationsSchemaValidation";

import {
  getLeaveApplications,
  getLeaveApplicationById,
  createLeaveApplication,
  updateLeaveApplication,
  processLeaveApplication,
  deleteLeaveApplication,
} from "@/lib/actions/leaveApplicationsActions";

import {
  getTeachersForDropdown,
  getStudentsForDropdown,
} from "@/lib/actions/attendanceActions";

export default function LeaveApplicationsPage() {
  const [leaveApplications, setLeaveApplications] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const leaveForm = useForm<LeaveApplicationFormValues>({
    resolver: zodResolver(leaveApplicationSchema),
    defaultValues: {
      applicantId: "",
      applicantType: "STUDENT",
      fromDate: new Date(),
      toDate: addDays(new Date(), 1),
      reason: "",
      status: "PENDING",
    },
  });

  const processForm = useForm<LeaveApprovalFormValues>({
    resolver: zodResolver(leaveApprovalSchema),
    defaultValues: {
      id: "",
      status: "APPROVED",
      approvedById: "",
      remarks: "",
    },
  });

  useEffect(() => {
    fetchLeaveApplications();
    fetchTeachers();
    fetchStudents();
  }, []);

  async function fetchLeaveApplications() {
    setLoading(true);
    try {
      const result = await getLeaveApplications(
        statusFilter !== "ALL" ? statusFilter : undefined,
        typeFilter !== "ALL" ? typeFilter : undefined,
        dateRange.from,
        dateRange.to
      );
      
      if (result.success) {
        setLeaveApplications(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch leave applications");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeachers() {
    try {
      const result = await getTeachersForDropdown();
      
      if (result.success) {
        setTeachers(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch teachers");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function fetchStudents() {
    try {
      const result = await getStudentsForDropdown();
      
      if (result.success) {
        setStudents(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch students");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleCreate() {
    leaveForm.reset({
      applicantId: "",
      applicantType: "STUDENT",
      fromDate: new Date(),
      toDate: addDays(new Date(), 1),
      reason: "",
      status: "PENDING",
    });
    setSelectedLeave(null);
    setDialogOpen(true);
  }

  async function handleView(id: string) {
    try {
      const result = await getLeaveApplicationById(id);
      
      if (result.success) {
        setSelectedLeave(result.data);
        setViewDialogOpen(true);
      } else {
        toast.error(result.error || "Failed to fetch leave application details");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEdit(leave: any) {
    leaveForm.reset({
      applicantId: leave.applicantId,
      applicantType: leave.applicantType,
      fromDate: new Date(leave.fromDate),
      toDate: new Date(leave.toDate),
      reason: leave.reason,
      status: leave.status,
      remarks: leave.remarks,
    });
    setSelectedLeave(leave);
    setDialogOpen(true);
  }

  function handleProcess(leave: any) {
    processForm.reset({
      id: leave.id,
      status: "APPROVED",
      approvedById: "", // TODO: Get from auth
      remarks: "",
    });
    setSelectedLeave(leave);
    setProcessDialogOpen(true);
  }

  function handleDelete(leave: any) {
    setSelectedLeave(leave);
    setDeleteDialogOpen(true);
  }

  async function onLeaveFormSubmit(values: LeaveApplicationFormValues) {
    try {
      let result;
      
      if (selectedLeave) {
        // Update
        result = await updateLeaveApplication({
          ...values,
          id: selectedLeave.id,
        });
      } else {
        // Create
        result = await createLeaveApplication(values);
      }
      
      if (result.success) {
        toast.success(`Leave application ${selectedLeave ? "updated" : "created"} successfully`);
        setDialogOpen(false);
        fetchLeaveApplications();
      } else {
        toast.error(result.error || "Failed to process leave application");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function onProcessFormSubmit(values: LeaveApprovalFormValues) {
    try {
      const result = await processLeaveApplication(values);
      
      if (result.success) {
        toast.success(`Leave application ${values.status === "APPROVED" ? "approved" : "rejected"} successfully`);
        setProcessDialogOpen(false);
        fetchLeaveApplications();
      } else {
        toast.error(result.error || "Failed to process leave application");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function confirmDelete() {
    if (selectedLeave) {
      try {
        const result = await deleteLeaveApplication(selectedLeave.id);
        
        if (result.success) {
          toast.success("Leave application deleted successfully");
          setDeleteDialogOpen(false);
          fetchLeaveApplications();
        } else {
          toast.error(result.error || "Failed to delete leave application");
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred");
      }
    }
  }

  function handleFilterChange() {
    fetchLeaveApplications();
  }

  // Helper function to filter leave applications
  const filteredLeaveApplications = leaveApplications.filter(leave => {
    const matchesSearch = 
      (leave.applicant?.name && leave.applicant.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (leave.applicant?.id && leave.applicant.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      false;
    
    return matchesSearch;
  });

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Leave Applications</h1>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Leave Applications</CardTitle>
            <CardDescription>Manage leave requests from students and teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 space-y-1">
                <label htmlFor="status-filter" className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setTimeout(handleFilterChange, 0);
                }}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1">
                <label htmlFor="type-filter" className="text-sm font-medium">Applicant Type</label>
                <Select value={typeFilter} onValueChange={(value) => {
                  setTypeFilter(value);
                  setTimeout(handleFilterChange, 0);
                }}>
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="STUDENT">Students</SelectItem>
                    <SelectItem value="TEACHER">Teachers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1">
                <label htmlFor="search-input" className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search-input"
                    type="search"
                    placeholder="Name or ID..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 flex items-end">
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Application
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredLeaveApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
                <File className="h-12 w-12 text-gray-300 mb-2" />
                <h3 className="text-lg font-medium mb-1">No Leave Applications</h3>
                <p className="max-w-md mb-4">
                  {searchTerm ? "No applications match your search criteria." : "There are no leave applications to display."}
                </p>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Application
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Applicant</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Type</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Date Range</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Duration</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                        <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeaveApplications.map((leave) => (
                        <tr key={leave.id} className="border-b">
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={leave.applicant?.avatar || ""} alt={leave.applicant?.name} />
                                <AvatarFallback className="text-xs">
                                  {leave.applicant?.name?.substring(0, 2).toUpperCase() || "N/A"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{leave.applicant?.name || "Unknown"}</div>
                                <div className="text-xs text-gray-500">{leave.applicant?.id || ""}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Badge variant="outline" className={leave.applicantType === "STUDENT" 
                              ? "bg-blue-50 text-blue-700 border-blue-200" 
                              : "bg-purple-50 text-purple-700 border-purple-200"}>
                              {leave.applicantType === "STUDENT" ? "Student" : "Teacher"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
                              <span>
                                {format(new Date(leave.fromDate), "MMM d, yyyy")} - {format(new Date(leave.toDate), "MMM d, yyyy")}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {leave.duration} {leave.duration === 1 ? "day" : "days"}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {getStatusBadge(leave.status)}
                          </td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleView(leave.id)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            {leave.status === "PENDING" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEdit(leave)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-green-600"
                                  onClick={() => handleProcess(leave)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500"
                                  onClick={() => handleDelete(leave)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Leave Application Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedLeave ? "Edit Leave Application" : "Create Leave Application"}</DialogTitle>
            <DialogDescription>
              {selectedLeave 
                ? "Update the details of the leave application" 
                : "Fill in the details to create a new leave application"}
            </DialogDescription>
          </DialogHeader>
          <Form {...leaveForm}>
            <form onSubmit={leaveForm.handleSubmit(onLeaveFormSubmit)} className="space-y-4">
              <FormField
                control={leaveForm.control}
                name="applicantType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicant Type</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={!!selectedLeave}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STUDENT">Student</SelectItem>
                        <SelectItem value="TEACHER">Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={leaveForm.control}
                name="applicantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicant</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={!!selectedLeave}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select applicant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveForm.watch("applicantType") === "STUDENT" ? (
                          students.map(student => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} ({student.rollNumber || "No Roll"})
                            </SelectItem>
                          ))
                        ) : (
                          teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name} ({teacher.employeeId || "No ID"})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={leaveForm.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onSelect={field.onChange}
                          placeholder="Select from date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={leaveForm.control}
                  name="toDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onSelect={field.onChange}
                          placeholder="Select to date"
                          disabled={(date) => {
                            const fromDate = leaveForm.getValues("fromDate");
                            return fromDate ? date < fromDate : false;
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={leaveForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Leave</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain reason for leave request"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">
                  {selectedLeave ? "Update Application" : "Submit Application"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Process Leave Application Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Leave Application</DialogTitle>
            <DialogDescription>
              Review and approve or reject this leave application
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={selectedLeave.applicant?.avatar || ""} alt={selectedLeave.applicant?.name} />
                  <AvatarFallback>
                    {selectedLeave.applicant?.name?.substring(0, 2).toUpperCase() || "N/A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedLeave.applicant?.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedLeave.applicantType === "STUDENT" ? "Student" : "Teacher"} • {selectedLeave.applicant?.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarRange className="h-4 w-4 text-gray-500" />
                <span>
                  {format(new Date(selectedLeave.fromDate), "MMM d, yyyy")} - {format(new Date(selectedLeave.toDate), "MMM d, yyyy")}
                </span>
                <Badge variant="outline" className="ml-2">
                  {selectedLeave.duration} {selectedLeave.duration === 1 ? "day" : "days"}
                </Badge>
              </div>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                <p className="font-medium mb-1">Reason:</p>
                <p>{selectedLeave.reason}</p>
              </div>
            </div>
          )}
          <Form {...processForm}>
            <form onSubmit={processForm.handleSubmit(onProcessFormSubmit)} className="space-y-4">
              <FormField
                control={processForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decision</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select decision" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="APPROVED">Approve</SelectItem>
                        <SelectItem value="REJECTED">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={processForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any comments or notes about this decision"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant={processForm.watch("status") === "APPROVED" ? "default" : "destructive"}
                >
                  {processForm.watch("status") === "APPROVED" ? "Approve" : "Reject"} Application
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Leave Application Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Leave Application Details</DialogTitle>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={selectedLeave.applicant?.avatar || ""} alt={selectedLeave.applicant?.name} />
                    <AvatarFallback>
                      {selectedLeave.applicant?.name?.substring(0, 2).toUpperCase() || "N/A"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedLeave.applicant?.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedLeave.applicant?.email}
                    </p>
                  </div>
                </div>
                {getStatusBadge(selectedLeave.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Applicant Type</p>
                  <p className="font-medium">{selectedLeave.applicantType === "STUDENT" ? "Student" : "Teacher"}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">ID</p>
                  <p className="font-medium">{selectedLeave.applicant?.id}</p>
                </div>
                {selectedLeave.applicant?.class && (
                  <>
                    <div>
                      <p className="text-gray-500 mb-1">Class</p>
                      <p className="font-medium">{selectedLeave.applicant.class}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Section</p>
                      <p className="font-medium">{selectedLeave.applicant.section}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-gray-500 mb-1">From Date</p>
                  <p className="font-medium">{format(new Date(selectedLeave.fromDate), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">To Date</p>
                  <p className="font-medium">{format(new Date(selectedLeave.toDate), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Duration</p>
                  <p className="font-medium">{selectedLeave.duration} {selectedLeave.duration === 1 ? "day" : "days"}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Application Date</p>
                  <p className="font-medium">{format(new Date(selectedLeave.createdAt), "MMMM d, yyyy")}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 mb-1">Reason</p>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p>{selectedLeave.reason}</p>
                </div>
              </div>

              {selectedLeave.status !== "PENDING" && (
                <div>
                  <p className="text-gray-500 mb-1">
                    {selectedLeave.status === "APPROVED" ? "Approved" : "Rejected"} By
                  </p>
                  {selectedLeave.approver ? (
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={selectedLeave.approver?.avatar || ""} alt={selectedLeave.approver?.name} />
                        <AvatarFallback>
                          {selectedLeave.approver?.name?.substring(0, 2).toUpperCase() || "N/A"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedLeave.approver.name}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Information not available</p>
                  )}
                </div>
              )}

              {selectedLeave.remarks && (
                <div>
                  <p className="text-gray-500 mb-1">Remarks</p>
                  <div className="p-3 bg-gray-50 rounded-md flex items-start">
                    <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                    <p>{selectedLeave.remarks}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedLeave && selectedLeave.status === "PENDING" && (
              <Button onClick={() => {
                setViewDialogOpen(false);
                setTimeout(() => handleProcess(selectedLeave), 100);
              }}>
                Process Application
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leave Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this leave application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
