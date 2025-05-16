"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, PlusCircle, Search, Inbox, Send, Archive, 
  Star, Trash2, MoreHorizontal, MessageSquare, Clock, 
  User, Paperclip, Reply, Forward, Edit, RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Mock data for messages
const messages = [
  {
    id: "m1",
    subject: "Question about homework assignment",
    sender: "Emily Johnson",
    senderRole: "Student",
    senderAvatar: "EJ",
    recipients: ["John Smith"],
    content: "Hello,\n\nI have a question about the math homework assigned yesterday. For problem #5, I'm not sure if we're supposed to use the quadratic formula or factoring. Could you please clarify?\n\nThank you,\nEmily",
    attachments: [],
    time: "10:30 AM",
    date: "Dec 5, 2023",
    isRead: false,
    isStarred: false,
    folder: "inbox"
  },
  {
    id: "m2",
    subject: "Regarding the upcoming science project",
    sender: "Michael Brown",
    senderRole: "Student",
    senderAvatar: "MB",
    recipients: ["John Smith"],
    content: "Dear Teacher,\n\nI wanted to discuss my idea for the upcoming science project. I'm thinking of doing a demonstration on renewable energy sources, specifically solar power. Would this be an appropriate topic?\n\nBest regards,\nMichael",
    attachments: ["project_outline.pdf"],
    time: "Yesterday",
    date: "Dec 4, 2023",
    isRead: true,
    isStarred: true,
    folder: "inbox"
  },
  {
    id: "m3",
    subject: "Absence notification",
    sender: "Sophia Martinez",
    senderRole: "Parent",
    senderAvatar: "SM",
    recipients: ["John Smith"],
    content: "Hello Mr. Smith,\n\nI wanted to inform you that my daughter, Sophia, will be absent tomorrow as we have a doctor's appointment scheduled. She will make up any missed work upon her return.\n\nThank you for your understanding.\n\nRegards,\nMrs. Martinez",
    attachments: ["doctors_note.pdf"],
    time: "Yesterday",
    date: "Dec 4, 2023",
    isRead: true,
    isStarred: false,
    folder: "inbox"
  },
  {
    id: "m4",
    subject: "Request for parent-teacher meeting",
    sender: "Robert Wilson",
    senderRole: "Parent",
    senderAvatar: "RW",
    recipients: ["John Smith"],
    content: "Dear Mr. Smith,\n\nI would like to schedule a meeting to discuss my son's progress in your class. I am available any day next week after 4:00 PM. Please let me know what works for you.\n\nBest regards,\nRobert Wilson",
    attachments: [],
    time: "Dec 3",
    date: "Dec 3, 2023",
    isRead: true,
    isStarred: false,
    folder: "inbox"
  },
  {
    id: "m5",
    subject: "Re: Grading policy question",
    sender: "Principal Stevens",
    senderRole: "Admin",
    senderAvatar: "PS",
    recipients: ["Jane Doe", "John Smith"],
    content: "John,\n\nThank you for your inquiry about the grading policy. As discussed in our last staff meeting, we are maintaining the same policy as last semester. If you have any specific concerns, feel free to stop by my office.\n\nBest,\nPrincipal Stevens",
    attachments: ["grading_policy.pdf"],
    time: "Dec 2",
    date: "Dec 2, 2023",
    isRead: true,
    isStarred: true,
    folder: "inbox"
  },
  {
    id: "s1",
    subject: "Classroom supplies request",
    sender: "John Smith",
    senderRole: "Teacher",
    senderAvatar: "JS",
    recipients: ["Sarah Thompson"],
    content: "Dear Ms. Thompson,\n\nI would like to request additional supplies for my classroom. We are running low on whiteboard markers and construction paper. Could these be provided by the end of the week?\n\nThank you,\nJohn Smith",
    attachments: [],
    time: "9:15 AM",
    date: "Dec 5, 2023",
    isRead: true,
    isStarred: false,
    folder: "sent"
  },
  {
    id: "s2",
    subject: "Field trip permission forms",
    sender: "John Smith",
    senderRole: "Teacher",
    senderAvatar: "JS",
    recipients: ["All Grade 10 Parents"],
    content: "Dear Parents,\n\nThis is a reminder that permission forms for the upcoming science museum field trip are due this Friday. Please ensure your child returns the signed form to me by then.\n\nBest regards,\nJohn Smith",
    attachments: ["permission_form.pdf"],
    time: "Yesterday",
    date: "Dec 4, 2023",
    isRead: true,
    isStarred: false,
    folder: "sent"
  },
];

// Mock data for users/contacts
const contacts = [
  { id: "u1", name: "Emily Johnson", role: "Student", avatar: "EJ" },
  { id: "u2", name: "Michael Brown", role: "Student", avatar: "MB" },
  { id: "u3", name: "Sophia Martinez", role: "Student", avatar: "SM" },
  { id: "u4", name: "Robert Wilson", role: "Parent", avatar: "RW" },
  { id: "u5", name: "Principal Stevens", role: "Admin", avatar: "PS" },
  { id: "u6", name: "Sarah Thompson", role: "Admin", avatar: "ST" },
  { id: "u7", name: "David Clark", role: "Teacher", avatar: "DC" },
  { id: "u8", name: "Jennifer Adams", role: "Teacher", avatar: "JA" },
];

// Message folder types with counts
const messageFolders = [
  { id: "inbox", name: "Inbox", icon: <Inbox className="h-4 w-4" />, count: 5, badge: 2 },
  { id: "sent", name: "Sent", icon: <Send className="h-4 w-4" />, count: 2 },
  { id: "starred", name: "Starred", icon: <Star className="h-4 w-4" />, count: 2 },
  { id: "archived", name: "Archived", icon: <Archive className="h-4 w-4" />, count: 0 },
  { id: "trash", name: "Trash", icon: <Trash2 className="h-4 w-4" />, count: 0 },
];

export default function MessagesPage() {
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [composeDialog, setComposeDialog] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Filter messages based on active folder and search term
  const filteredMessages = messages.filter(message => {
    const matchesFolder = message.folder === activeFolder || 
                         (activeFolder === "starred" && message.isStarred);
    
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFolder && matchesSearch;
  });

  // Get currently selected message details
  const currentMessage = messages.find(m => m.id === selectedMessage);

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
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        </div>
        <Dialog open={composeDialog} onOpenChange={setComposeDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Compose New Message</DialogTitle>
              <DialogDescription>
                Send a direct message to users in the system
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <Select value={recipient} onValueChange={setRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name} ({contact.role})
                      </SelectItem>
                    ))}
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
                  className="min-h-[200px]" 
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
              <Button onClick={() => setComposeDialog(false)}>
                <Send className="mr-2 h-4 w-4" /> Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-10rem)]">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3 flex flex-col">
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Folders</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {messageFolders.map(folder => (
                  <Button
                    key={folder.id}
                    variant={activeFolder === folder.id ? "secondary" : "ghost"}
                    className="justify-start w-full"
                    onClick={() => setActiveFolder(folder.id)}
                  >
                    <div className="flex items-center w-full">
                      <div className="mr-2">{folder.icon}</div>
                      <span>{folder.name}</span>
                      <div className="ml-auto flex items-center">
                        {folder.badge && folder.badge > 0 && (
                          <Badge variant="destructive" className="rounded-full px-1 min-w-[20px] h-5 flex justify-center items-center">
                            {folder.badge}
                          </Badge>
                        )}
                        {!folder.badge && folder.count > 0 && (
                          <span className="text-xs text-gray-500">{folder.count}</span>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
              
              <div className="mt-6">
                <p className="text-sm font-medium mb-2">Labels</p>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">Students</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Parents</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-sm">Administration</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-sm">Teachers</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message list */}
        <div className="col-span-12 md:col-span-9 lg:col-span-3 flex flex-col">
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{
                    activeFolder.charAt(0).toUpperCase() + activeFolder.slice(1)
                  }</CardTitle>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search messages..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100vh-15rem)] overflow-y-auto pb-6">
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm font-medium">No messages found</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {searchTerm ? "Try a different search term" : `Your ${activeFolder} is empty`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMessages.map((message) => (
                    <div 
                      key={message.id}
                      className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMessage === message.id ? 'bg-gray-50 border-blue-200' : ''
                      } ${!message.isRead && activeFolder === "inbox" ? 'border-l-4 border-l-blue-500' : ''}`}
                      onClick={() => setSelectedMessage(message.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{message.senderAvatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={`font-medium text-sm ${!message.isRead && activeFolder === "inbox" ? 'text-black' : ''}`}>
                              {message.sender}
                            </p>
                            <p className={`text-sm truncate ${!message.isRead && activeFolder === "inbox" ? 'font-medium' : ''}`}>
                              {message.subject}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-500">{message.time}</span>
                          <div className="flex items-center mt-1">
                            {message.attachments.length > 0 && (
                              <Paperclip className="h-3 w-3 text-gray-400 mr-1" />
                            )}
                            {message.isStarred && (
                              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {message.content.split('\n')[0]}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message detail */}
        <div className="col-span-12 lg:col-span-6 flex flex-col">
          <Card className="flex-1">
            {currentMessage ? (
              <>
                <CardHeader className="pb-2 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{currentMessage.subject}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" /> {currentMessage.date} at {currentMessage.time}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Reply className="h-4 w-4 mr-2" /> Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Forward className="h-4 w-4 mr-2" /> Forward
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" /> {currentMessage.isStarred ? 'Unstar' : 'Star'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 h-[calc(100vh-15rem)] overflow-y-auto pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{currentMessage.senderAvatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{currentMessage.sender}</p>
                        <Badge variant="outline">{currentMessage.senderRole}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        To: {currentMessage.recipients.join(", ")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 whitespace-pre-line">
                    {currentMessage.content}
                  </div>
                  
                  {currentMessage.attachments.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-medium mb-2">Attachments:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentMessage.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center p-2 border rounded-lg">
                            <Paperclip className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm">{attachment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-8 pt-4 border-t">
                    <div className="flex gap-2">
                      <Button>
                        <Reply className="h-4 w-4 mr-2" /> Reply
                      </Button>
                      <Button variant="outline">
                        <Forward className="h-4 w-4 mr-2" /> Forward
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="h-16 w-16 text-gray-200 mb-4" />
                <h3 className="text-xl font-medium mb-2">No message selected</h3>
                <p className="text-gray-500 mb-4 max-w-md">
                  Select a message from the list to view its contents, or create a new message.
                </p>
                <Button onClick={() => setComposeDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" /> Compose New Message
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
