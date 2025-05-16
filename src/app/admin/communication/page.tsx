"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Bell, Megaphone, Users, Calendar, FileText,
  PlusCircle, Search, ArrowRight, Send, Mail, UserRound, UserCheck,
  CalendarClock, Activity, CheckCircle, ArrowUp, ArrowDown, RefreshCcw, Eye,
  Download, Filter, AlertCircle, MailCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Chart } from "@/components/dashboard/chart";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

const communicationCategories = [
  {
    title: "Messages",
    icon: <MessageSquare className="h-5 w-5" />,
    description: "Private messaging system",
    href: "/admin/communications/messages",
    count: 12,
    color: "bg-blue-50 text-blue-700"
  },
  {
    title: "Announcements",
    icon: <Megaphone className="h-5 w-5" />,
    description: "School-wide announcements",
    href: "/admin/communications/announcements",
    count: 5,
    color: "bg-purple-50 text-purple-700"
  },
  {
    title: "Notifications",
    icon: <Bell className="h-5 w-5" />,
    description: "System alerts & notices",
    href: "/admin/communications/notifications",
    count: 28,
    color: "bg-amber-50 text-amber-700"
  },
  {
    title: "Parent Meetings",
    icon: <Users className="h-5 w-5" />,
    description: "Schedule parent conferences",
    href: "/admin/communications/parent-meetings",
    count: 7,
    color: "bg-green-50 text-green-700"
  },
  {
    title: "Email Templates",
    icon: <FileText className="h-5 w-5" />,
    description: "Standardized email formats",
    href: "/admin/communications/templates",
    count: 15,
    color: "bg-red-50 text-red-700"
  },
  {
    title: "SMS Alerts",
    icon: <Send className="h-5 w-5" />,
    description: "Text notification system",
    href: "/admin/communications/sms",
    count: 42,
    color: "bg-indigo-50 text-indigo-700"
  },
];

const recentCommunications = [
  {
    id: "c1",
    type: "message",
    sender: "Emily Johnson",
    title: "Question about homework submission",
    recipientType: "Teacher",
    recipientCount: 1,
    time: "10 mins ago",
    isRead: false,
  },
  {
    id: "c2",
    type: "announcement",
    sender: "Principal Stevens",
    title: "School closure due to weather conditions",
    recipientType: "All Users",
    recipientCount: 1500,
    time: "2 hours ago",
    isRead: true,
  },
  {
    id: "c3",
    type: "notification",
    sender: "System",
    title: "New grades posted for Math 101",
    recipientType: "Students",
    recipientCount: 32,
    time: "5 hours ago",
    isRead: true,
  },
  {
    id: "c4",
    type: "meeting",
    sender: "Robert Smith",
    title: "Parent-teacher conference scheduled",
    recipientType: "Teacher",
    recipientCount: 1,
    time: "Yesterday",
    isRead: true,
  },
  {
    id: "c5",
    type: "message",
    sender: "Sarah Williams",
    title: "Regarding the upcoming science fair",
    recipientType: "Admin",
    recipientCount: 3,
    time: "Yesterday",
    isRead: true,
  },
];

const messageAnalyticsData = [
  { date: 'Mon', sent: 28, received: 32 },
  { date: 'Tue', sent: 35, received: 41 },
  { date: 'Wed', sent: 42, received: 48 },
  { date: 'Thu', sent: 31, received: 39 },
  { date: 'Fri', sent: 38, received: 46 },
  { date: 'Sat', sent: 12, received: 18 },
  { date: 'Sun', sent: 8, received: 11 },
];

const userSegments = [
  { id: "all", name: "All Users" },
  { id: "students", name: "All Students" },
  { id: "teachers", name: "All Teachers" },
  { id: "parents", name: "All Parents" },
  { id: "staff", name: "Administrative Staff" },
  { id: "grade10", name: "Grade 10 Students" },
  { id: "grade11", name: "Grade 11 Students" },
  { id: "grade12", name: "Grade 12 Students" },
];

const upcomingMeetings = [
  {
    id: "m1",
    parentName: "David Wilson",
    studentName: "Emma Wilson",
    grade: "Grade 10-A",
    teacher: "Ms. Johnson",
    date: "Dec 15, 2023",
    time: "2:30 PM",
    status: "Confirmed",
  },
  {
    id: "m2",
    parentName: "Jennifer Brown",
    studentName: "Michael Brown",
    grade: "Grade 9-B",
    teacher: "Mr. Thompson",
    date: "Dec 16, 2023",
    time: "3:15 PM",
    status: "Pending",
  },
  {
    id: "m3",
    parentName: "Robert Martinez",
    studentName: "Sophia Martinez",
    grade: "Grade 11-C",
    teacher: "Ms. Clark",
    date: "Dec 18, 2023",
    time: "4:00 PM",
    status: "Confirmed",
  },
];

export default function CommunicationsPage() {
  const [composeDialog, setComposeDialog] = useState(false);
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(["all"]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Communications Hub</h1>
        <div className="flex gap-2">
          <Dialog open={composeDialog} onOpenChange={setComposeDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" /> Compose Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Compose New Message</DialogTitle>
                <DialogDescription>
                  Send a direct message to users in the system
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user1">John Smith (Teacher)</SelectItem>
                      <SelectItem value="user2">Emily Johnson (Student)</SelectItem>
                      <SelectItem value="user3">Robert Williams (Parent)</SelectItem>
                      <SelectItem value="user4">Sarah Davis (Admin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input placeholder="Enter message subject" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea 
                    placeholder="Type your message here" 
                    className="min-h-[150px]" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attachments</label>
                  <Input type="file" multiple />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setComposeDialog(false)}>
                  Cancel
                </Button>
                <Link href="/admin/communications/messages">
                  <Button onClick={() => setComposeDialog(false)}>
                    <Send className="mr-2 h-4 w-4" /> Send Message
                  </Button>
                </Link>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={announcementDialog} onOpenChange={setAnnouncementDialog}>
            <DialogTrigger asChild>
              <Button>
                <Megaphone className="mr-2 h-4 w-4" /> Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Send an announcement to a group of users
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input placeholder="Announcement title" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Audience</label>
                  <div className="grid grid-cols-2 gap-2">
                    {userSegments.map(segment => (
                      <div key={segment.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`segment-${segment.id}`}
                          checked={selectedRecipients.includes(segment.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRecipients([...selectedRecipients, segment.id]);
                            } else {
                              setSelectedRecipients(selectedRecipients.filter(id => id !== segment.id));
                            }
                          }}
                        />
                        <label 
                          htmlFor={`segment-${segment.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {segment.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea 
                    placeholder="Type your announcement message here" 
                    className="min-h-[150px]" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date (Optional)</label>
                    <Input type="date" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attachments</label>
                  <Input type="file" multiple />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="pin-announcement" />
                  <label 
                    htmlFor="pin-announcement"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Pin this announcement to the top
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAnnouncementDialog(false)}>
                  Cancel
                </Button>
                <Link href="/admin/communications/announcements">
                  <Button onClick={() => setAnnouncementDialog(false)}>
                    Publish Announcement
                  </Button>
                </Link>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mt-4">
            {communicationCategories.map((category) => (
              <Card key={category.title} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-md ${category.color}`}>
                      {category.icon}
                    </div>
                    <Badge variant="outline">{category.count}</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href={category.href}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Manage
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Communications</CardTitle>
                <CardDescription>
                  Messages, announcements, and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCommunications.map((comm) => (
                    <div key={comm.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                      <div className={`p-2 rounded-full ${
                        comm.type === 'message' ? 'bg-blue-100 text-blue-700' :
                        comm.type === 'announcement' ? 'bg-purple-100 text-purple-700' :
                        comm.type === 'notification' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {comm.type === 'message' ? <MessageSquare className="h-4 w-4" /> :
                         comm.type === 'announcement' ? <Megaphone className="h-4 w-4" /> :
                         comm.type === 'notification' ? <Bell className="h-4 w-4" /> :
                         <Users className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{comm.title}</p>
                          {!comm.isRead && <Badge className="bg-blue-100 text-blue-800">New</Badge>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          From: {comm.sender} • To: {comm.recipientType} {comm.recipientCount > 1 && `(${comm.recipientCount})`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{comm.time}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t flex justify-center pt-4">
                <Link href="/admin/communications/messages">
                  <Button variant="outline" size="sm">
                    View All Messages
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Communication Analytics</CardTitle>
                <CardDescription>
                  Message and notification volume
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <Chart
                  title=""
                  data={messageAnalyticsData}
                  type="bar"
                  xKey="date"
                  yKey="sent"
                  categories={["sent", "received"]}
                  colors={["#3b82f6", "#10b981"]}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Upcoming Parent Meetings</CardTitle>
                <CardDescription>
                  Scheduled conferences and consultations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                      <div className="p-2 rounded-full bg-green-100 text-green-700">
                        <CalendarClock className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{meeting.parentName}</p>
                          <Badge className={
                            meeting.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          }>
                            {meeting.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Student: {meeting.studentName} ({meeting.grade})
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {meeting.date} at {meeting.time} • Teacher: {meeting.teacher}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t flex justify-center pt-4">
                <Link href="/admin/communications/parent-meetings">
                  <Button variant="outline" size="sm">
                    Manage Meetings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
                <CardDescription>
                  Common communication tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/admin/communications/parent-meetings">
                    <Button variant="outline" className="w-full h-auto flex-col p-4 justify-start items-start gap-2">
                      <div className="p-2 rounded-full bg-blue-100 text-blue-700 mb-1">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">Schedule Meeting</p>
                        <p className="text-xs text-gray-500">With parents or staff</p>
                      </div>
                    </Button>
                  </Link>
                  
                  <Link href="/admin/communications/templates">
                    <Button variant="outline" className="w-full h-auto flex-col p-4 justify-start items-start gap-2">
                      <div className="p-2 rounded-full bg-purple-100 text-purple-700 mb-1">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">Use Template</p>
                        <p className="text-xs text-gray-500">For emails and messages</p>
                      </div>
                    </Button>
                  </Link>
                  
                  <Link href="/admin/communications/notifications">
                    <Button variant="outline" className="w-full h-auto flex-col p-4 justify-start items-start gap-2">
                      <div className="p-2 rounded-full bg-amber-100 text-amber-700 mb-1">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">Create Alert</p>
                        <p className="text-xs text-gray-500">Send system notifications</p>
                      </div>
                    </Button>
                  </Link>
                  
                  <Link href="/admin/communications/sms">
                    <Button variant="outline" className="w-full h-auto flex-col p-4 justify-start items-start gap-2">
                      <div className="p-2 rounded-full bg-green-100 text-green-700 mb-1">
                        <Send className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">SMS Alert</p>
                        <p className="text-xs text-gray-500">Send text messages</p>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Communication Stats</CardTitle>
                <CardDescription>
                  Current period overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-700">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">Messages Sent</p>
                        <p className="text-sm font-medium">245</p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-green-500">12%</span>
                        <span className="ml-1">vs last month</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-700">
                      <Megaphone className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">Announcements</p>
                        <p className="text-sm font-medium">16</p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-green-500">8%</span>
                        <span className="ml-1">vs last month</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100 text-green-700">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">Parent Meetings</p>
                        <p className="text-sm font-medium">32</p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                        <span className="text-red-500">5%</span>
                        <span className="ml-1">vs last month</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-amber-100 text-amber-700">
                      <Bell className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">SMS Notifications</p>
                        <p className="text-sm font-medium">568</p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-green-500">20%</span>
                        <span className="ml-1">vs last month</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="py-6 text-center">
            <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
            <p className="text-gray-500 mb-4">Detailed communication analytics will be available in a future update.</p>
            <Button variant="outline" onClick={() => setActiveTab("overview")}>Return to Overview</Button>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="py-6 text-center">
            <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
            <p className="text-gray-500 mb-4">Communication configuration settings will be available in a future update.</p>
            <Button variant="outline" onClick={() => setActiveTab("overview")}>Return to Overview</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
