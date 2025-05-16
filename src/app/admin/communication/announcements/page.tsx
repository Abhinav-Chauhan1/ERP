"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, PlusCircle, Search, Filter, Megaphone, Calendar,
  Eye, Edit, Trash2, Clock, ArrowUpRight, CheckCircle, XCircle,
  FileText, RefreshCw, MoreVertical, Filter as FilterIcon, ArrowDown,
  Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for announcements
const announcements = [
  {
    id: "a1",
    title: "School Closure Due to Weather Conditions",
    content: "Dear school community,\n\nDue to predicted severe weather conditions, all classes will be cancelled tomorrow, December 10, 2023. This decision has been made for the safety of our students and staff.\n\nRegular classes will resume on Monday, December 11, 2023, unless otherwise notified.\n\nPlease check the school website and your email for further updates.\n\nThank you for your understanding.",
    publisher: "Principal Stevens",
    publisherAvatar: "PS",
    publisherRole: "Administrator",
    targetAudience: ["All Users"],
    startDate: "2023-12-09",
    endDate: "2023-12-11",
    isActive: true,
    isPinned: true,
    createdAt: "2023-12-08T15:30:00",
    attachments: [],
  },
  {
    id: "a2",
    title: "Annual Science Fair Registration Now Open",
    content: "Dear Students and Parents,\n\nWe are excited to announce that registration for the Annual Science Fair is now open. The fair will be held on January 20, 2023.\n\nStudents from grades 8-12 are eligible to participate. Registration closes on December 20, 2023.\n\nPlease see the attached document for registration details and project guidelines.\n\nWe look forward to seeing your innovative projects!",
    publisher: "Dr. Rebecca Chen",
    publisherAvatar: "RC",
    publisherRole: "Science Department Head",
    targetAudience: ["Students", "Parents"],
    startDate: "2023-12-01",
    endDate: "2023-12-20",
    isActive: true,
    isPinned: false,
    createdAt: "2023-11-30T09:15:00",
    attachments: ["science_fair_guidelines.pdf"],
  },
  {
    id: "a3",
    title: "Parent-Teacher Conference Schedule",
    content: "Dear Parents,\n\nOur semester Parent-Teacher Conferences are scheduled for December 15-16, 2023.\n\nPlease use the attached link to schedule your 15-minute appointment with your child's teachers. Appointments can be scheduled online until December 13, 2023.\n\nIf you need assistance with scheduling, please contact the school office.\n\nWe look forward to meeting with you to discuss your child's progress.",
    publisher: "Vice Principal Johnson",
    publisherAvatar: "VJ",
    publisherRole: "Administrator",
    targetAudience: ["Parents"],
    startDate: "2023-12-05",
    endDate: "2023-12-16",
    isActive: true,
    isPinned: true,
    createdAt: "2023-12-04T11:20:00",
    attachments: ["conference_scheduling_instructions.pdf"],
  },
  {
    id: "a4",
    title: "Winter Break Reminder",
    content: "Dear School Community,\n\nThis is a reminder that Winter Break will begin on December 22, 2023. The last day of classes will be December 21, 2023.\n\nClasses will resume on January 8, 2024.\n\nThe school office will be closed from December 24, 2023, to January 2, 2024.\n\nWe wish everyone a safe and enjoyable holiday season!",
    publisher: "Principal Stevens",
    publisherAvatar: "PS",
    publisherRole: "Administrator",
    targetAudience: ["All Users"],
    startDate: "2023-12-15",
    endDate: "2023-12-22",
    isActive: true,
    isPinned: false,
    createdAt: "2023-12-14T10:00:00",
    attachments: [],
  },
  {
    id: "a5",
    title: "Fundraising Results",
    content: "Dear School Community,\n\nWe are pleased to announce that our recent fundraising drive was a tremendous success! Thanks to your generosity, we raised over $15,000 for library renovations.\n\nA special thank you to the Parent-Teacher Association for organizing this event and to all volunteers who contributed their time.\n\nThe renovation project will begin during the Winter Break and is expected to be completed by mid-February.",
    publisher: "Fundraising Committee",
    publisherAvatar: "FC",
    publisherRole: "Committee",
    targetAudience: ["All Users"],
    startDate: "2023-12-05",
    endDate: "2023-12-31",
    isActive: true,
    isPinned: false,
    createdAt: "2023-12-04T14:45:00",
    attachments: ["fundraising_report.pdf"],
  },
  {
    id: "a6",
    title: "Important Update to School Policy",
    content: "Dear Students and Parents,\n\nWe have updated our school's attendance policy. The new policy will be effective January 1, 2024.\n\nKey changes include:\n- Modified procedures for reporting absences\n- Updated tardiness consequences\n- New guidelines for extended absences\n\nPlease review the attached document carefully. If you have any questions, please contact the school office.",
    publisher: "Administration",
    publisherAvatar: "AD",
    publisherRole: "Administration",
    targetAudience: ["Students", "Parents"],
    startDate: "2023-12-10",
    endDate: "2024-01-15",
    isActive: true,
    isPinned: false,
    createdAt: "2023-12-09T13:30:00",
    attachments: ["new_attendance_policy.pdf"],
  },
];

// Mock data for user segments
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

export default function AnnouncementsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createAnnouncementDialog, setCreateAnnouncementDialog] = useState(false);
  const [viewAnnouncementDialog, setViewAnnouncementDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Filter announcements based on active tab, search term, and filters
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesTab = activeTab === "all" || 
                     (activeTab === "active" && announcement.isActive) || 
                     (activeTab === "pinned" && announcement.isPinned);
    
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.publisher.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAudience = audienceFilter === "all" || 
                          announcement.targetAudience.includes(
                            userSegments.find(seg => seg.id === audienceFilter)?.name || ""
                          );
    
    const matchesStatus = statusFilter === "all" || 
                        (statusFilter === "active" && announcement.isActive) ||
                        (statusFilter === "inactive" && !announcement.isActive);
    
    return matchesTab && matchesSearch && matchesAudience && matchesStatus;
  });

  const handleViewAnnouncement = (id: string) => {
    const announcement = announcements.find(a => a.id === id);
    if (announcement) {
      setSelectedAnnouncement(announcement);
      setViewAnnouncementDialog(true);
    }
  };

  const handleCreateAnnouncement = () => {
    setSelectedRecipients(["all"]);
    setCreateAnnouncementDialog(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

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
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
        </div>
        <Dialog open={createAnnouncementDialog} onOpenChange={setCreateAnnouncementDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateAnnouncement}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
              <DialogDescription>
                Create and publish an announcement to the school community
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input placeholder="Enter announcement title" />
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
                <label className="text-sm font-medium">Announcement Content</label>
                <Textarea 
                  placeholder="Type your announcement message here" 
                  className="min-h-[200px]" 
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
              <Button variant="outline" onClick={() => setCreateAnnouncementDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setCreateAnnouncementDialog(false)}>
                Publish Announcement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Manage Announcements</CardTitle>
              <CardDescription>
                Create, edit, and publish announcements to the school community
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search announcements..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Audience</p>
                    <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Audiences</SelectItem>
                        {userSegments.map(segment => (
                          <SelectItem key={segment.id} value={segment.id}>
                            {segment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Status</p>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pinned">Pinned</TabsTrigger>
            </TabsList>
            
            <div className="mt-4 space-y-4">
              {filteredAnnouncements.length > 0 ? (
                filteredAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className={`${announcement.isPinned ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>{announcement.publisherAvatar}</AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{announcement.title}</CardTitle>
                              {announcement.isPinned && (
                                <Badge className="bg-amber-100 text-amber-800">Pinned</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-gray-500">{announcement.publisher} ({announcement.publisherRole})</p>
                              <p className="text-xs text-gray-400">•</p>
                              <p className="text-sm text-gray-500">
                                {new Date(announcement.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewAnnouncement(announcement.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {announcement.isPinned ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Unpin
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Pin
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm line-clamp-2">{announcement.content}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {new Date(announcement.startDate).toLocaleDateString()} - 
                            {announcement.endDate ? 
                              new Date(announcement.endDate).toLocaleDateString() : 
                              "No end date"}
                          </span>
                        </div>
                        
                        <div className="flex-1"></div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs text-gray-500">To:</span>
                          {announcement.targetAudience.map((audience, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {audience}
                            </Badge>
                          ))}
                        </div>
                        
                        {announcement.attachments.length > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <FileText className="h-3 w-3" />
                            {announcement.attachments.length} {announcement.attachments.length === 1 ? "file" : "files"}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-auto"
                        onClick={() => handleViewAnnouncement(announcement.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Megaphone className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No announcements found</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                    {searchTerm || audienceFilter !== "all" || statusFilter !== "all" 
                      ? "No announcements match your search criteria. Try adjusting your filters."
                      : "There are no announcements yet. Create your first announcement to get started."}
                  </p>
                  <Button onClick={handleCreateAnnouncement}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Announcement
                  </Button>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Announcement Dialog */}
      <Dialog open={viewAnnouncementDialog} onOpenChange={setViewAnnouncementDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Announcement Details</DialogTitle>
            <DialogDescription>
              View complete announcement information
            </DialogDescription>
          </DialogHeader>
          
          {selectedAnnouncement && (
            <div className="space-y-4 py-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>{selectedAnnouncement.publisherAvatar}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <DialogTitle className="text-lg">{selectedAnnouncement.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-500">
                        {selectedAnnouncement.publisher} ({selectedAnnouncement.publisherRole})
                      </p>
                      <p className="text-xs text-gray-400">•</p>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedAnnouncement.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {selectedAnnouncement.isPinned && (
                    <Badge className="bg-amber-100 text-amber-800">Pinned</Badge>
                  )}
                  <Badge className={selectedAnnouncement.isActive 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                  }>
                    {selectedAnnouncement.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    {new Date(selectedAnnouncement.startDate).toLocaleDateString()} - 
                    {selectedAnnouncement.endDate ? 
                      new Date(selectedAnnouncement.endDate).toLocaleDateString() : 
                      "No end date"}
                  </span>
                </div>
                
                <div className="flex-1"></div>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-500">Target Audience:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAnnouncement.targetAudience.map((audience: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {audience}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="whitespace-pre-line text-sm py-4">
                {selectedAnnouncement.content}
              </div>
              
              {selectedAnnouncement.attachments.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Attachments</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAnnouncement.attachments.map((attachment: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{attachment}</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewAnnouncementDialog(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
