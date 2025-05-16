"use client";

import { useState } from "react";
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

// Mock data for parent meetings
const parentMeetings = [
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

  // Filter meetings based on search term, status, and time
  const filteredMeetings = parentMeetings.filter(meeting => {
    const matchesSearch = 
      meeting.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || meeting.status === statusFilter;
    
    const now = new Date();
    const meetingDate = new Date(meeting.scheduledDate);
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
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
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
                <label className="text-sm font-medium">Meeting Title</label>
                <Input placeholder="e.g., End of Term Progress Discussion" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Parent</label>
                <Select value={selectedParent} onValueChange={setSelectedParent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map(parent => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.name} (Parent of {parent.studentName}, {parent.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Teacher</label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.subject})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Input type="time" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Select defaultValue="30">
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
                  <Input placeholder="e.g., Room 101, Conference Room" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea 
                  placeholder="Provide details about the purpose of the meeting"
                  className="h-24"
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
              <Button onClick={() => setScheduleMeetingDialog(false)}>
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
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
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
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Participants</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Title</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Schedule</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Location</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                        <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMeetings.length > 0 ? (
                        filteredMeetings.map((meeting) => (
                          <tr key={meeting.id} className="border-b">
                            <td className="py-3 px-4 align-middle">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{meeting.parentAvatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{meeting.parentName}</div>
                                  <div className="text-xs text-gray-500">{meeting.studentName}, {meeting.studentGrade}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 align-middle font-medium">{meeting.title}</td>
                            <td className="py-3 px-4 align-middle">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                <span>{new Date(meeting.scheduledDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(meeting.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>({meeting.duration} min)</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 align-middle">{meeting.location}</td>
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
                                      <DropdownMenuItem>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark as Completed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel Meeting
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-gray-500">
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
            </TabsContent>
            
            <TabsContent value="calendar">
              <div className="p-8 text-center">
                <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Calendar View Coming Soon</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-4">
                  The calendar view for parent meetings is under development and will be available soon.
                </p>
                <Button variant="outline">Try List View</Button>
              </div>
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
          
          {selectedMeeting && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col space-y-2">
                <h2 className="text-xl font-semibold">{selectedMeeting.title}</h2>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {new Date(selectedMeeting.scheduledDate).toLocaleDateString()} • {new Date(selectedMeeting.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-sm text-gray-600">({selectedMeeting.duration} min)</span>
                  {getStatusBadge(selectedMeeting.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Parent Information</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{selectedMeeting.parentAvatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedMeeting.parentName}</p>
                      <p className="text-sm text-gray-500">Parent</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedMeeting.parentEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedMeeting.parentPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{selectedMeeting.studentName} ({selectedMeeting.studentGrade})</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Teacher Information</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{selectedMeeting.teacherAvatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedMeeting.teacherName}</p>
                      <p className="text-sm text-gray-500">{selectedMeeting.teacherSubject}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Meeting Location</h3>
                <p className="text-sm bg-gray-50 p-2.5 rounded">{selectedMeeting.location}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Meeting Notes</h3>
                <p className="text-sm bg-gray-50 p-2.5 rounded whitespace-pre-line">{selectedMeeting.notes}</p>
              </div>
              
              {selectedMeeting.status === "COMPLETED" && selectedMeeting.summary && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Meeting Summary</h3>
                  <div className="bg-green-50 border border-green-100 p-3 rounded-md text-sm text-green-800">
                    {selectedMeeting.summary}
                  </div>
                </div>
              )}
              
              {selectedMeeting.status === "CANCELLED" && selectedMeeting.cancellationReason && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Cancellation Reason</h3>
                  <div className="bg-red-50 border border-red-100 p-3 rounded-md text-sm text-red-800">
                    {selectedMeeting.cancellationReason}
                  </div>
                </div>
              )}
            </div>
          )}
          
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
                <Button variant="default">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed
                </Button>
              </>
            )}
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
