"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, Clock, Check, X, AlertTriangle, FileText, 
  Download, Plus, Edit, Trash2, Search, Filter, 
  Loader2, User, UserCheck, UserX, CalendarDays
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { format, isSameDay } from "date-fns";

import { 
  studentAttendanceSchema, 
  StudentAttendanceFormValues,
  bulkStudentAttendanceSchema,
  BulkStudentAttendanceFormValues,
  attendanceReportSchema,
  AttendanceReportFormValues
} from "@/lib/schemaValidation/attendanceSchemaValidation";

import {
  getClassSectionsForDropdown,
  getStudentAttendanceByDate,
  markStudentAttendance,
  markBulkStudentAttendance,
  getStudentAttendanceReport,
  deleteStudentAttendance
} from "@/lib/actions/attendanceActions";

export default function StudentAttendancePage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [classSections, setClassSections] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Report state
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const attendanceForm = useForm<StudentAttendanceFormValues>({
    resolver: zodResolver(studentAttendanceSchema),
    defaultValues: {
      studentId: "",
      date: new Date(),
      sectionId: "",
      status: "PRESENT",
      reason: "",
    },
  });

  const bulkAttendanceForm = useForm<BulkStudentAttendanceFormValues>({
    resolver: zodResolver(bulkStudentAttendanceSchema),
    defaultValues: {
      date: new Date(),
      sectionId: "",
      attendanceRecords: [],
    },
  });

  const reportForm = useForm<AttendanceReportFormValues>({
    resolver: zodResolver(attendanceReportSchema),
    defaultValues: {
      entityType: "STUDENT",
      startDate: new Date(),
      endDate: new Date(),
      sectionId: "",
    },
  });

  useEffect(() => {
    fetchClassSections();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      fetchAttendance();
    }
  }, [currentDate, selectedSection]);

  useEffect(() => {
    // Set up bulk form with current records whenever they change
    if (attendanceRecords.length > 0) {
      bulkAttendanceForm.setValue("date", currentDate);
      bulkAttendanceForm.setValue("sectionId", selectedSection);
      bulkAttendanceForm.setValue("attendanceRecords", attendanceRecords.map(student => ({
        studentId: student.id,
        status: student.status,
        reason: student.reason || ""
      })));
    }
  }, [attendanceRecords]);

  async function fetchClassSections() {
    try {
      const result = await getClassSectionsForDropdown();
      
      if (result.success) {
        setClassSections(result.data || []);
        
        // If no section is selected yet, select the first one
        if (result.data && result.data.length > 0 && result.data[0].sections.length > 0 && !selectedSection) {
          setSelectedSection(result.data[0].sections[0].id);
        }
      } else {
        toast.error(result.error || "Failed to fetch class sections");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function fetchAttendance() {
    if (!selectedSection) return;
    
    setLoading(true);
    try {
      const sectionId = selectedSection === "all" ? undefined : selectedSection;
      const result = await getStudentAttendanceByDate(currentDate, sectionId);
      
      if (result.success) {
        setAttendanceRecords(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch attendance records");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleEditAttendance(student: any) {
    setSelectedStudent(student);
    
    attendanceForm.reset({
      studentId: student.id,
      date: currentDate,
      sectionId: selectedSection,
      status: student.status,
      reason: student.reason || "",
    });
    
    setDialogOpen(true);
  }

  function handleDeleteAttendance(attendanceId: string) {
    if (!attendanceId) return;
    
    setAttendanceToDelete(attendanceId);
    setConfirmDialogOpen(true);
  }

  async function confirmDeleteAttendance() {
    if (!attendanceToDelete) return;
    
    try {
      const result = await deleteStudentAttendance(attendanceToDelete);
      
      if (result.success) {
        toast.success("Attendance record deleted successfully");
        fetchAttendance();
      } else {
        toast.error(result.error || "Failed to delete attendance record");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setConfirmDialogOpen(false);
      setAttendanceToDelete(null);
    }
  }

  async function onAttendanceSubmit(values: StudentAttendanceFormValues) {
    try {
      const result = await markStudentAttendance(values);
      
      if (result.success) {
        toast.success("Attendance marked successfully");
        setDialogOpen(false);
        fetchAttendance();
      } else {
        toast.error(result.error || "Failed to mark attendance");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function onBulkAttendanceSubmit(values: BulkStudentAttendanceFormValues) {
    try {
      const result = await markBulkStudentAttendance(values);
      
      if (result.success) {
        toast.success("Bulk attendance marked successfully");
        fetchAttendance();
      } else {
        toast.error(result.error || "Failed to mark bulk attendance");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function onReportSubmit(values: AttendanceReportFormValues) {
    setReportLoading(true);
    try {
      if (!values.entityId) {
        toast.error("Please select a student");
        return;
      }
      
      const result = await getStudentAttendanceReport(
        values.entityId,
        values.startDate,
        values.endDate
      );
      
      if (result.success) {
        setReportData(result);
        toast.success("Report generated successfully");
      } else {
        toast.error(result.error || "Failed to generate report");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setReportLoading(false);
    }
  }

  // Helper function to filter attendance records
  const filteredAttendanceRecords = attendanceRecords.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (student.rollNumber && student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "ALL" || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Helper function to get statistics
  const getAttendanceStats = () => {
    if (!attendanceRecords.length) return { total: 0, present: 0, absent: 0, late: 0, leave: 0, presentPercentage: 0 };
    
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === "PRESENT").length;
    const absent = attendanceRecords.filter(r => r.status === "ABSENT").length;
    const late = attendanceRecords.filter(r => r.status === "LATE").length;
    const leave = attendanceRecords.filter(r => r.status === "LEAVE").length;
    const halfDay = attendanceRecords.filter(r => r.status === "HALF_DAY").length;
    
    const presentPercentage = ((present + late + (halfDay * 0.5)) / total) * 100;
    
    return { total, present, absent, late, leave, halfDay, presentPercentage };
  };

  const stats = getAttendanceStats();

  // Get current section name
  const currentSectionName = classSections
    .flatMap(cls => cls.sections)
    .find(section => section.id === selectedSection)?.fullName || "";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Student Attendance</h1>

      <Tabs defaultValue="mark" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="report">Attendance Report</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mark">
          <Card>
            <CardHeader>
              <CardTitle>Mark Student Attendance</CardTitle>
              <CardDescription>Record daily attendance for students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label htmlFor="date-picker" className="text-sm font-medium block mb-1">Date</label>
                  <DatePicker 
                    date={currentDate} 
                    onSelect={(date) => date && setCurrentDate(date)} 
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="section-select" className="text-sm font-medium block mb-1">Class Section</label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger id="section-select">
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {classSections.map((cls: any) => (
                        <div key={cls.id}>
                          <div className="px-2 py-1.5 text-sm font-semibold">{cls.name}</div>
                          {cls.sections.map((section: any) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.fullName}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedSection && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">
                        {currentSectionName} - {format(currentDate, 'EEEE, MMMM d, yyyy')}
                      </h3>
                      {attendanceRecords.length > 0 && (
                        <div className="text-sm text-gray-500">
                          {stats.total} students, {stats.present} present ({Math.round(stats.presentPercentage)}%)
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type="search"
                          placeholder="Search by name or roll..."
                          className="pl-9 w-[200px]"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Status</SelectItem>
                          <SelectItem value="PRESENT">Present</SelectItem>
                          <SelectItem value="ABSENT">Absent</SelectItem>
                          <SelectItem value="LATE">Late</SelectItem>
                          <SelectItem value="HALF_DAY">Half Day</SelectItem>
                          <SelectItem value="LEAVE">Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
                      <UserX className="h-12 w-12 text-gray-300 mb-2" />
                      <h3 className="text-lg font-medium mb-1">No Students</h3>
                      <p className="max-w-md mb-4">
                        There are no students enrolled in this class section or the section does not exist.
                      </p>
                    </div>
                  ) : filteredAttendanceRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
                      <Search className="h-12 w-12 text-gray-300 mb-2" />
                      <h3 className="text-lg font-medium mb-1">No Results</h3>
                      <p>No students match your search criteria.</p>
                    </div>
                  ) : (
                    <>
                      <Form {...bulkAttendanceForm}>
                        <form onSubmit={bulkAttendanceForm.handleSubmit(onBulkAttendanceSubmit)}>
                          <div className="border rounded-md">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-50 border-b">
                                    <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-500">Roll Number</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-500">Reason</th>
                                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredAttendanceRecords.map((student, index) => (
                                    <tr key={student.id} className="border-b">
                                      <td className="py-3 px-4 align-middle">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={student.avatar || ""} alt={student.name} />
                                            <AvatarFallback className="text-xs">{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                          </Avatar>
                                          <span className="font-medium">{student.name}</span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 align-middle">{student.rollNumber || "—"}</td>
                                      <td className="py-3 px-4 align-middle">
                                        <FormField
                                          control={bulkAttendanceForm.control}
                                          name={`attendanceRecords.${index}.status`}
                                          render={({ field }) => (
                                            <Select
                                              value={field.value}
                                              onValueChange={field.onChange}
                                            >
                                              <SelectTrigger className="w-32 h-8">
                                                <SelectValue>
                                                  {field.value === "PRESENT" && (
                                                    <div className="flex items-center gap-2">
                                                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                      <span>Present</span>
                                                    </div>
                                                  )}
                                                  {field.value === "ABSENT" && (
                                                    <div className="flex items-center gap-2">
                                                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                                      <span>Absent</span>
                                                    </div>
                                                  )}
                                                  {field.value === "LATE" && (
                                                    <div className="flex items-center gap-2">
                                                      <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                                      <span>Late</span>
                                                    </div>
                                                  )}
                                                  {field.value === "HALF_DAY" && (
                                                    <div className="flex items-center gap-2">
                                                      <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                                                      <span>Half Day</span>
                                                    </div>
                                                  )}
                                                  {field.value === "LEAVE" && (
                                                    <div className="flex items-center gap-2">
                                                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                                      <span>Leave</span>
                                                    </div>
                                                  )}
                                                </SelectValue>
                                              </SelectTrigger>
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
                                          )}
                                        />
                                      </td>
                                      <td className="py-3 px-4 align-middle">
                                        <FormField
                                          control={bulkAttendanceForm.control}
                                          name={`attendanceRecords.${index}.reason`}
                                          render={({ field }) => (
                                            <Input 
                                              className="h-8" 
                                              placeholder="Reason (if absent/late/leave)" 
                                              value={field.value || ""}
                                              onChange={field.onChange}
                                              disabled={["PRESENT"].includes(bulkAttendanceForm.watch(`attendanceRecords.${index}.status`))}
                                            />
                                          )}
                                        />
                                      </td>
                                      <td className="py-3 px-4 align-middle text-right">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-8 w-8 p-0" 
                                          onClick={() => handleEditAttendance(student)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        {student.attendanceId && (
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 text-red-500" 
                                            onClick={() => handleDeleteAttendance(student.attendanceId)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-end">
                            <Button type="submit">
                              <Check className="mr-2 h-4 w-4" />
                              Save All Changes
                            </Button>
                          </div>
                        </form>
                      </Form>
                      
                      <div className="p-4 bg-gray-50 rounded-lg mt-6">
                        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-green-500"></span>
                            <span className="text-sm">Present: {stats.present}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-red-500"></span>
                            <span className="text-sm">Absent: {stats.absent}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                            <span className="text-sm">Late: {stats.late}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-orange-500"></span>
                            <span className="text-sm">Half Day: {stats.halfDay}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                            <span className="text-sm">Leave: {stats.leave}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Student Attendance Report</CardTitle>
              <CardDescription>Generate attendance reports for students</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...reportForm}>
                <form onSubmit={reportForm.handleSubmit(onReportSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={reportForm.control}
                      name="sectionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Section (Optional)</FormLabel>
                          <Select 
                            value={field.value || ""} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="All sections" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">All Sections</SelectItem>
                              {classSections.map((cls: any) => (
                                <div key={cls.id}>
                                  <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">{cls.name}</div>
                                  {cls.sections.map((section: any) => (
                                    <SelectItem key={section.id} value={section.id}>
                                      {cls.name} - {section.name}
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                      Attendance Report {reportForm.getValues("sectionId") ? 
                        `for ${classSections.flatMap(c => c.sections).find(s => s.id === reportForm.getValues("sectionId"))?.fullName}` : 
                        "for All Sections"}
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
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Roll Number</th>
                            <th className="py-3 px-4 text-center font-medium text-gray-500">Present</th>
                            <th className="py-3 px-4 text-center font-medium text-gray-500">Absent</th>
                            <th className="py-3 px-4 text-center font-medium text-gray-500">Late</th>
                            <th className="py-3 px-4 text-center font-medium text-gray-500">Leave</th>
                            <th className="py-3 px-4 text-center font-medium text-gray-500">Present %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.data.map((entry: any) => (
                            <tr key={entry.studentId} className="border-b">
                              <td className="py-3 px-4 align-middle font-medium">{entry.studentName}</td>
                              <td className="py-3 px-4 align-middle">{entry.rollNumber || "—"}</td>
                              <td className="py-3 px-4 align-middle text-center">{entry.summary.present}</td>
                              <td className="py-3 px-4 align-middle text-center">{entry.summary.absent}</td>
                              <td className="py-3 px-4 align-middle text-center">{entry.summary.late}</td>
                              <td className="py-3 px-4 align-middle text-center">{entry.summary.leave}</td>
                              <td className="py-3 px-4 align-middle text-center">
                                <div className="flex justify-center">
                                  <Badge variant={entry.summary.present / entry.summary.total > 0.5 ? "default" : "destructive"}>
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

      {/* Single Student Attendance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update attendance for {selectedStudent?.name} on {format(currentDate, 'MMMM d, yyyy')}
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
