"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft, PlusCircle, Search, Filter, Calendar,
  Clock, Users, User, ArrowRight, CheckCircle, XCircle,
  CalendarDays, CalendarClock, RefreshCw, MoreVertical,
  Trash2, Mail, Phone, MessageSquare, FileText, Send, Edit
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import toast from "react-hot-toast";
import {
  getParentMeetings,
  scheduleMeeting,
  updateMeeting,
  cancelMeeting,
  completeMeeting,
  deleteMeeting,
  getTeachersForMeetings,
  getParentsForMeetings,
  getMeetingStats,
} from "@/lib/actions/parentMeetingActions";

// Mock data for parent meetings (fallback)
const mockParentMeetings = [
  {
    id: "pm1",
    title: "Term Progress Discussion",
    parentName: "Robert Wilson",
    parentAvatar: "RW",
    parentEmail: "robert.wilson@example.com",
    parentPhone: "+1 (555) 123-4567",
    studentName: "Emma Wilson",
    studentGrade: "Grade 10-A",
    teacherName: "Emily Johnson",
    teacherAvatar: "EJ",
    teacherSubject: "Mathematics",
    scheduledDate: "2023-12-15T14:30:00",
    duration: 30,
    status: "SCHEDULED",
    location: "Room 105",
    notes: "Discussion about Emma's progress in Mathematics and areas for improvement.",
    createdAt: "2023-12-02T10:15:00",
  },
  {
    id: "pm2",
    title: "Behavior Concerns Discussion",
    parentName: "Jennifer Brown",
    parentAvatar: "JB",
    parentEmail: "jennifer.brown@example.com",
    parentPhone: "+1 (555) 234-5678",
    studentName: "Michael Brown",
    studentGrade: "Grade 9-B",
    teacherName: "David Thompson",
    teacherAvatar: "DT",
    teacherSubject: "Class Teacher",
    scheduledDate: "2023-12-16T15:15:00",
    duration: 30,
    status: "SCHEDULED",
    location: "Conference Room 2",
    notes: "Meeting to discuss Michael's classroom behavior and develop an improvement plan.",
    createdAt: "2023-12-03T09:30:00",
  },
  {
    id: "pm3",
    title: "Academic Performance Review",
    parentName: "Maria Martinez",
    parentAvatar: "MM",
    parentEmail: "maria.martinez@example.com",
    parentPhone: "+1 (555) 345-6789",
    studentName: "Sophia Martinez",
    studentGrade: "Grade 11-C",
    teacherName: "Sarah Clark",
    teacherAvatar: "SC",
    teacherSubject: "Science",
    scheduledDate: "2023-12-18T16:00:00",
    duration: 30,
    status: "SCHEDULED",
    location: "Science Lab",
    notes: "Review of Sophia's science project performance and upcoming assignments.",
    createdAt: "2023-12-04T14:45:00",
  },
  {
    id: "pm4",
    title: "College Counseling Session",
    parentName: "James Davis",
    parentAvatar: "JD",
    parentEmail: "james.davis@example.com",
    parentPhone: "+1 (555) 456-7890",
    studentName: "Oliver Davis",
    studentGrade: "Grade 12-A",
    teacherName: "Richard White",
    teacherAvatar: "RW",
    teacherSubject: "College Counselor",
    scheduledDate: "2023-12-19T15:30:00",
    duration: 45,
    status: "SCHEDULED",
    location: "Counseling Office",
    notes: "Discussion about Oliver's college applications and career plans.",
    createdAt: "2023-12-05T11:20:00",
  },
  {
    id: "pm5",
    title: "Learning Difficulties Discussion",
    parentName: "Patricia Anderson",
    parentAvatar: "PA",
    parentEmail: "patricia.anderson@example.com",
    parentPhone: "+1 (555) 567-8901",
    studentName: "Ethan Anderson",
    studentGrade: "Grade 8-B",
    teacherName: "Linda Miller",
    teacherAvatar: "LM",
    teacherSubject: "Special Education",
    scheduledDate: "2023-12-14T14:00:00",
    duration: 45,
    status: "COMPLETED",
    location: "Special Education Room",
    notes: "Follow-up meeting to discuss Ethan's progress with his individualized learning plan.",
    createdAt: "2023-12-01T10:00:00",
    summary: "Ethan has shown improvement in reading comprehension. New strategies were discussed for mathematical concepts. Follow-up assessment scheduled for January.",
  },
  {
    id: "pm6",
    title: "Attendance Issues",
    parentName: "Thomas Johnson",
    parentAvatar: "TJ",
    parentEmail: "thomas.johnson@example.com",
    parentPhone: "+1 (555) 678-9012",
    studentName: "Ava Johnson",
    studentGrade: "Grade 10-C",
    teacherName: "Mark Roberts",
    teacherAvatar: "MR",
    teacherSubject: "Class Teacher",
    scheduledDate: "2023-12-12T15:00:00",
    duration: 30,
    status: "CANCELLED",
    location: "Room 107",
    notes: "Discussion about Ava's frequent absences and its impact on her academic performance.",
    createdAt: "2023-11-30T13:15:00",
    cancellationReason: "Parent requested to reschedule due to work conflict.",
  },
];

// Mock data for teachers
const teachers = [
  { id: "t1", name: "Emily Johnson", subject: "Mathematics", avatar: "EJ" },
  { id: "t2", name: "David Thompson", subject: "Class Teacher (Grade 9-B)", avatar: "DT" },
  { id: "t3", name: "Sarah Clark", subject: "Science", avatar: "SC" },
  { id: "t4", name: "Richard White", subject: "College Counselor", avatar: "RW" },
  { id: "t5", name: "Linda Miller", subject: "Special Education", avatar: "LM" },
  { id: "t6", name: "Mark Roberts", subject: "Class Teacher (Grade 10-C)", avatar: "MR" },
];

// Mock data for parents
const parents = [
  { id: "p1", name: "Robert Wilson", studentName: "Emma Wilson", grade: "Grade 10-A", avatar: "RW" },
  { id: "p2", name: "Jennifer Brown", studentName: "Michael Brown", grade: "Grade 9-B", avatar: "JB" },
  { id: "p3", name: "Maria Martinez", studentName: "Sophia Martinez", grade: "Grade 11-C", avatar: "MM" },
  { id: "p4", name: "James Davis", studentName: "Oliver Davis", grade: "Grade 12-A", avatar: "JD" },
  { id: "p5", name: "Patricia Anderson", studentName: "Ethan Anderson", grade: "Grade 8-B", avatar: "PA" },
  { id: "p6", name: "Thomas Johnson", studentName: "Ava Johnson", grade: "Grade 10-C", avatar: "TJ" },
];

export default function ParentMeetingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("upcoming");
  const [scheduleMeetingDialog, setScheduleMeetingDialog] = useState(false);
  const [viewMeetingDialog, setViewMeetingDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedParent, setSelectedParent] = useState("");
  const [loading, setLoading] = useState(true);
  const [parentMeetings, setParentMeetings] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayMeetingsDialogOpen, setDayMeetingsDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    parentId: "",
    teacherId: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: "30",
    location: "",
    purpose: "",
  });

  // Load data on mount
  useEffect(() => {
    loadMeetings();
    loadTeachers();
    loadParents();
    loadStats();
  }, [statusFilter, timeFilter]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== "all") filters.status = statusFilter.toUpperCase();
      
      const result = await getParentMeetings(filters);
      if (result.success && result.data) {
        setParentMeetings(result.data);
      } else {
        toast.error(result.error || "Failed to load meetings");
      }
    } catch (error) {
      console.error("Error loading meetings:", error);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const result = await getTeachersForMeetings();
      if (result.success && result.data) {
        setTeachers(result.data);
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  const loadParents = async () => {
    try {
      const result = await getParentsForMeetings();
      if (result.success && result.data) {
        setParents(result.data);
      }
    } catch (error) {
      console.error("Error loading parents:", error);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getMeetingStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleScheduleMeeting = async () => {
    try {
      if (!formData.parentId || !formData.teacherId || !formData.scheduledDate || !formData.scheduledTime) {
        toast.error("Please fill in all required fields");
        return;
      }

      const scheduledAt = `${formData.scheduledDate}T${formData.scheduledTime}:00`;
      
      const result = await scheduleMeeting({
        parentId: formData.parentId,
        teacherId: formData.teacherId,
        scheduledAt,
        duration: parseInt(formData.duration),
        location: formData.location || null,
        purpose: formData.purpose || null,
      });

      if (result.success) {
        toast.success("Meeting scheduled successfully");
        setScheduleMeetingDialog(false);
        setFormData({
          title: "",
          parentId: "",
          teacherId: "",
          scheduledDate: "",
          scheduledTime: "",
          duration: "30",
          location: "",
          purpose: "",
        });
        loadMeetings();
        loadStats();
      } else {
        toast.error(result.error || "Failed to schedule meeting");
      }
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast.error("Failed to schedule meeting");
    }
  };

  const handleCompleteMeeting = async (id: string) => {
    try {
      const result = await completeMeeting(id);
      if (result.success) {
        toast.success("Meeting marked as completed");
        loadMeetings();
        loadStats();
      } else {
        toast.error(result.error || "Failed to complete meeting");
      }
    } catch (error) {
      console.error("Error completing meeting:", error);
      toast.error("Failed to complete meeting");
    }
  };

  const handleCancelMeeting = async (id: string) => {
    try {
      const result = await cancelMeeting(id);
      if (result.success) {
        toast.success("Meeting cancelled");
        loadMeetings();
        loadStats();
      } else {
        toast.error(result.error || "Failed to cancel meeting");
      }
    } catch (error) {
      console.error("Error cancelling meeting:", error);
      toast.error("Failed to cancel meeting");
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    try {
      const result = await deleteMeeting(id);
      if (result.success) {
        toast.success("Meeting deleted");
        loadMeetings();
        loadStats();
      } else {
        toast.error(result.error || "Failed to delete meeting");
      }
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast.error("Failed to delete meeting");
    }
  };

  // Filter meetings based on search term, status, and time
  const filteredMeetings = parentMeetings.filter(meeting => {
    const parentName = `${meeting.parent?.user?.firstName || ""} ${meeting.parent?.user?.lastName || ""}`;
    const teacherName = `${meeting.teacher?.user?.firstName || ""} ${meeting.teacher?.user?.lastName || ""}`;
    const studentName = meeting.parent?.children?.[0]?.student?.user 
      ? `${meeting.parent.children[0].student.user.firstName} ${meeting.parent.children[0].student.user.lastName}`
      : "";
    
    const matchesSearch = 
      parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.purpose && meeting.purpose.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || meeting.status === statusFilter.toUpperCase();
    
    const now = new Date();
    const meetingDate = new Date(meeting.scheduledAt);
    const matchesTime = 
      timeFilter === "all" ||
      (timeFilter === "upcoming" && meetingDate > now) ||
      (timeFilter === "past" && meetingDate < now);
    
    return matchesSearch && matchesStatus && matchesTime;
  });

  const handleViewMeeting = (meetingId: string) => {
    const meeting = parentMeetings.find(m => m.id === meetingId);
    if (meeting) {
      setSelectedMeeting(meeting);
      setViewMeetingDialog(true);
    }
  };

  function getStatusBadge(status: string) {
    switch(status) {
      case "SCHEDULED":
        return <Badge className="bg-primary/10 text-primary">Scheduled</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/communications">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Parent Meetings</h1>
        </div>
        <Dialog open={scheduleMeetingDialog} onOpenChange={setScheduleMeetingDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Schedule Parent-Teacher Meeting</DialogTitle>
              <DialogDescription>
                Schedule a meeting between a parent and teacher
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Parent</label>
                <Select 
                  value={formData.parentId} 
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map(parent => {
                      const studentInfo = parent.children?.[0]?.student;
                      const studentName = studentInfo?.user 
                        ? `${studentInfo.user.firstName} ${studentInfo.user.lastName}`
                        : "No student";
                      const grade = studentInfo?.enrollments?.[0]
                        ? `${studentInfo.enrollments[0].class.name}-${studentInfo.enrollments[0].section.name}`
                        : "";
                      
                      return (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.user.firstName} {parent.user.lastName} (Parent of {studentName}{grade ? `, ${grade}` : ""})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Teacher</label>
                <Select 
                  value={formData.teacherId} 
                  onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.user.firstName} {teacher.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input 
                    type="date" 
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Input 
                    type="time" 
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Select 
                    value={formData.duration} 
                    onValueChange={(value) => setFormData({ ...formData, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input 
                    placeholder="e.g., Room 101, Conference Room" 
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Purpose / Notes</label>
                <Textarea 
                  placeholder="Provide details about the purpose of the meeting"
                  className="h-24"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="notify-participants" />
                <label 
                  htmlFor="notify-participants"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Send notification to participants
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setScheduleMeetingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleMeeting}>
                Schedule Meeting
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Parent-Teacher Meetings</CardTitle>
              <CardDescription>
                Schedule and manage parent-teacher conferences
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search meetings..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="mt-2">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Participants</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Title</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Schedule</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Location</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMeetings.length > 0 ? (
                        filteredMeetings.map((meeting) => {
                          const parentName = `${meeting.parent?.user?.firstName || ""} ${meeting.parent?.user?.lastName || ""}`;
                          const parentInitials = `${meeting.parent?.user?.firstName?.[0] || ""}${meeting.parent?.user?.lastName?.[0] || ""}`;
                          const studentInfo = meeting.parent?.children?.[0]?.student;
                          const studentName = studentInfo?.user 
                            ? `${studentInfo.user.firstName} ${studentInfo.user.lastName}`
                            : "No student";
                          const grade = studentInfo?.enrollments?.[0]
                            ? `${studentInfo.enrollments[0].class.name}-${studentInfo.enrollments[0].section.name}`
                            : "";
                          
                          return (
                            <tr key={meeting.id} className="border-b">
                              <td className="py-3 px-4 align-middle">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>{parentInitials}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{parentName}</div>
                                    <div className="text-xs text-muted-foreground">{studentName}{grade ? `, ${grade}` : ""}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 align-middle font-medium">{meeting.purpose || "Meeting"}</td>
                              <td className="py-3 px-4 align-middle">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{new Date(meeting.scheduledAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>({meeting.duration} min)</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 align-middle">{meeting.location || "TBD"}</td>
                              <td className="py-3 px-4 align-middle">
                                {getStatusBadge(meeting.status)}
                              </td>
                            <td className="py-3 px-4 align-middle text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewMeeting(meeting.id)}
                              >
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Email Reminder
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <SendIcon className="h-4 w-4 mr-2" />
                                    Send SMS
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {meeting.status === "SCHEDULED" && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleCompleteMeeting(meeting.id)}>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark as Completed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleCancelMeeting(meeting.id)}>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel Meeting
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteMeeting(meeting.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-muted-foreground">
                            <CalendarX className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No meetings found matching your criteria</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                                setTimeFilter("upcoming");
                              }}
                            >
                              Clear Filters
                            </Button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </TabsContent>
            
            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Meeting Calendar</CardTitle>
                      <CardDescription>View scheduled meetings by date</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDate = new Date(currentCalendarDate);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setCurrentCalendarDate(newDate);
                        }}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentCalendarDate(new Date())}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDate = new Date(currentCalendarDate);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setCurrentCalendarDate(newDate);
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                  <div className="text-center text-lg font-semibold mt-2">
                    {currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center font-medium text-sm text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {(() => {
                      const year = currentCalendarDate.getFullYear();
                      const month = currentCalendarDate.getMonth();
                      const firstDay = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const days = [];
                      
                      // Empty cells for days before month starts
                      for (let i = 0; i < firstDay; i++) {
                        days.push(
                          <div key={`empty-${i}`} className="aspect-square p-2 border rounded-lg bg-accent" />
                        );
                      }
                      
                      // Days of the month
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayMeetings = filteredMeetings.filter(meeting => {
                          const meetingDate = new Date(meeting.scheduledDate);
                          return meetingDate.getFullYear() === year &&
                                 meetingDate.getMonth() === month &&
                                 meetingDate.getDate() === day;
                        });
                        
                        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                        
                        days.push(
                          <div
                            key={day}
                            className={`aspect-square p-2 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors ${
                              isToday ? 'border-blue-500 bg-primary/10' : ''
                            }`}
                            onClick={() => {
                              if (dayMeetings.length > 0) {
                                setSelectedDate(new Date(year, month, day));
                                setDayMeetingsDialogOpen(true);
                              }
                            }}
                          >
                            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                              {day}
                            </div>
                            {dayMeetings.length > 0 && (
                              <div className="space-y-1">
                                {dayMeetings.slice(0, 2).map((meeting) => (
                                  <div
                                    key={meeting.id}
                                    className={`text-xs p-1 rounded truncate ${
                                      meeting.status === 'SCHEDULED' ? 'bg-primary/10 text-primary' :
                                      meeting.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                      meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                      'bg-muted text-gray-700'
                                    }`}
                                  >
                                    {new Date(meeting.scheduledDate).toLocaleTimeString('en-US', { 
                                      hour: 'numeric', 
                                      minute: '2-digit',
                                      hour12: true 
                                    })}
                                  </div>
                                ))}
                                {dayMeetings.length > 2 && (
                                  <div className="text-xs text-muted-foreground text-center">
                                    +{dayMeetings.length - 2} more
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      return days;
                    })()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Meeting Dialog */}
      <Dialog open={viewMeetingDialog} onOpenChange={setViewMeetingDialog}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Meeting Details</DialogTitle>
            <DialogDescription>
              Complete information about the parent-teacher meeting
            </DialogDescription>
          </DialogHeader>
          
          {selectedMeeting && (() => {
            const parentName = `${selectedMeeting.parent?.user?.firstName || ""} ${selectedMeeting.parent?.user?.lastName || ""}`;
            const parentInitials = `${selectedMeeting.parent?.user?.firstName?.[0] || ""}${selectedMeeting.parent?.user?.lastName?.[0] || ""}`;
            const teacherName = `${selectedMeeting.teacher?.user?.firstName || ""} ${selectedMeeting.teacher?.user?.lastName || ""}`;
            const teacherInitials = `${selectedMeeting.teacher?.user?.firstName?.[0] || ""}${selectedMeeting.teacher?.user?.lastName?.[0] || ""}`;
            const studentInfo = selectedMeeting.parent?.children?.[0]?.student;
            const studentName = studentInfo?.user 
              ? `${studentInfo.user.firstName} ${studentInfo.user.lastName}`
              : "No student";
            const grade = studentInfo?.enrollments?.[0]
              ? `${studentInfo.enrollments[0].class.name}-${studentInfo.enrollments[0].section.name}`
              : "";
            
            return (
              <div className="space-y-4 py-2">
                <div className="flex flex-col space-y-2">
                  <h2 className="text-xl font-semibold">{selectedMeeting.purpose || "Parent-Teacher Meeting"}</h2>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(selectedMeeting.scheduledAt).toLocaleDateString()} • {new Date(selectedMeeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-sm text-muted-foreground">({selectedMeeting.duration} min)</span>
                    {getStatusBadge(selectedMeeting.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Parent Information</h3>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{parentInitials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{parentName}</p>
                        <p className="text-sm text-muted-foreground">Parent</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMeeting.parent?.user?.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMeeting.parent?.user?.phone || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{studentName}{grade ? ` (${grade})` : ""}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Teacher Information</h3>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{teacherInitials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{teacherName}</p>
                        <p className="text-sm text-muted-foreground">Teacher</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMeeting.teacher?.user?.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMeeting.teacher?.user?.phone || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Meeting Location</h3>
                  <p className="text-sm bg-accent p-2.5 rounded">{selectedMeeting.location || "TBD"}</p>
                </div>
                
                {selectedMeeting.notes && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Meeting Notes</h3>
                    <p className="text-sm bg-accent p-2.5 rounded whitespace-pre-line">{selectedMeeting.notes}</p>
                  </div>
                )}
              </div>
            );
          })()}
          
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setViewMeetingDialog(false)}>
              Close
            </Button>
            
            {selectedMeeting && selectedMeeting.status === "SCHEDULED" && (
              <>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline">
                  <SendIcon className="h-4 w-4 mr-2" />
                  Send Reminder
                </Button>
                <Button 
                  variant="default"
                  onClick={() => {
                    handleCompleteMeeting(selectedMeeting.id);
                    setViewMeetingDialog(false);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Meetings Dialog */}
      <Dialog open={dayMeetingsDialogOpen} onOpenChange={setDayMeetingsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Meetings on {selectedDate?.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </DialogTitle>
            <DialogDescription>
              All scheduled meetings for this day
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedDate && filteredMeetings
              .filter(meeting => {
                const meetingDate = new Date(meeting.scheduledDate);
                return meetingDate.toDateString() === selectedDate.toDateString();
              })
              .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
              .map((meeting) => (
                <div
                  key={meeting.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedMeeting(meeting);
                    setDayMeetingsDialogOpen(false);
                    setViewMeetingDialog(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{meeting.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(meeting.scheduledDate).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })} • {meeting.duration} min
                      </p>
                    </div>
                    <Badge
                      className={
                        meeting.status === 'SCHEDULED' ? 'bg-primary/10 text-primary' :
                        meeting.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-muted text-gray-700'
                      }
                    >
                      {meeting.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{meeting.parent?.user?.firstName} {meeting.parent?.user?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{meeting.teacher?.user?.firstName} {meeting.teacher?.user?.lastName}</span>
                    </div>
                  </div>
                  {meeting.location && (
                    <p className="text-sm text-muted-foreground mt-2">📍 {meeting.location}</p>
                  )}
                </div>
              ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDayMeetingsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SendIcon(props: any) {
  return <Send {...props} />;
}

function CalendarX(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="10" y1="14" x2="14" y2="18" />
      <line x1="14" y1="14" x2="10" y2="18" />
    </svg>
  );
}
