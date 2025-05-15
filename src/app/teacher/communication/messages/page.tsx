"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  PlusSquare,
  Star,
  Users,
  Send,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Trash2,
  RefreshCcw,
  Mail,
  MailOpen,
  Paperclip,
  Reply,
  Forward,
  Download,
  Archive,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  recipient: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  subject: string;
  preview: string;
  content: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: {
    name: string;
    type: string;
    size: string;
  }[];
  folder: "inbox" | "sent" | "starred" | "trash" | "draft";
}

// Mock messages data
const messages: Message[] = [
  {
    id: "1",
    sender: {
      id: "s1",
      name: "John Smith",
      role: "student",
      avatar: "/assets/avatars/student1.jpg"
    },
    recipient: {
      id: "t1",
      name: "Sarah Johnson",
      role: "teacher"
    },
    subject: "Question about the homework",
    preview: "I'm having trouble with problem 3 in the homework assignment...",
    content: `<p>Dear Ms. Johnson,</p>
              <p>I'm having trouble with problem 3 in the homework assignment. The question about finding the roots of the quadratic equation is confusing me. Could you please provide some guidance on how to approach this?</p>
              <p>Thank you,<br>John Smith</p>`,
    date: new Date("2023-12-01T14:30:00"),
    isRead: false,
    isStarred: false,
    hasAttachments: false,
    folder: "inbox"
  },
  {
    id: "2",
    sender: {
      id: "p1",
      name: "Lisa Robinson",
      role: "parent",
      avatar: "/assets/avatars/parent1.jpg"
    },
    recipient: {
      id: "t1",
      name: "Sarah Johnson",
      role: "teacher"
    },
    subject: "Michael's absence next week",
    preview: "I wanted to inform you that Michael will be absent next week due to...",
    content: `<p>Hello Ms. Johnson,</p>
              <p>I wanted to inform you that Michael will be absent next week due to a family event. We will be out of town from Monday through Wednesday. Could you please provide any assignments or materials he might miss during this period?</p>
              <p>Best regards,<br>Lisa Robinson<br>Michael's mother</p>`,
    date: new Date("2023-12-01T10:15:00"),
    isRead: true,
    isStarred: true,
    hasAttachments: false,
    folder: "inbox"
  },
  {
    id: "3",
    sender: {
      id: "t1",
      name: "Sarah Johnson",
      role: "teacher"
    },
    recipient: {
      id: "a1",
      name: "Department Heads",
      role: "group"
    },
    subject: "Mathematics Department Meeting",
    preview: "The next department meeting is scheduled for December 5th at...",
    content: `<p>Dear Colleagues,</p>
              <p>The next department meeting is scheduled for December 5th at 3:30 PM in the conference room. Please prepare your updates on the curriculum development progress and any issues that need to be discussed.</p>
              <p>I've attached the agenda and the minutes from our last meeting for your reference.</p>
              <p>Regards,<br>Sarah Johnson<br>Mathematics Teacher</p>`,
    date: new Date("2023-11-30T09:45:00"),
    isRead: true,
    isStarred: false,
    hasAttachments: true,
    attachments: [
      {
        name: "Meeting_Agenda_Dec5.pdf",
        type: "PDF",
        size: "245 KB"
      },
      {
        name: "Minutes_Nov20.docx",
        type: "Word Document",
        size: "128 KB"
      }
    ],
    folder: "sent"
  },
  {
    id: "4",
    sender: {
      id: "a2",
      name: "Principal Adams",
      role: "admin",
      avatar: "/assets/avatars/admin1.jpg"
    },
    recipient: {
      id: "t1",
      name: "Sarah Johnson",
      role: "teacher"
    },
    subject: "Annual Teacher Evaluation",
    preview: "This is to inform you that your annual evaluation is scheduled...",
    content: `<p>Dear Ms. Johnson,</p>
              <p>This is to inform you that your annual teaching evaluation is scheduled for December 12th during your 3rd period class. Please have your lesson plans and materials ready for review.</p>
              <p>The evaluation will follow the standard protocol and focus on teaching methodology, classroom management, and student engagement.</p>
              <p>Let me know if you have any questions.</p>
              <p>Best regards,<br>Dr. Adams<br>Principal</p>`,
    date: new Date("2023-11-29T16:20:00"),
    isRead: true,
    isStarred: true,
    hasAttachments: false,
    folder: "inbox"
  },
  {
    id: "5",
    sender: {
      id: "t1",
      name: "Sarah Johnson",
      role: "teacher"
    },
    recipient: {
      id: "c1",
      name: "Grade 10-A Students",
      role: "group"
    },
    subject: "Upcoming Mid-term Examination",
    preview: "The mid-term examination for Mathematics is scheduled for...",
    content: `<p>Dear Students,</p>
              <p>The mid-term examination for Mathematics is scheduled for December 10th from 9:00 AM to 11:00 AM. The exam will cover all topics we've studied so far including:</p>
              <ul>
                <li>Algebraic Expressions</li>
                <li>Linear Equations</li>
                <li>Quadratic Equations</li>
                <li>Coordinate Geometry</li>
              </ul>
              <p>I've attached a review sheet with practice problems to help you prepare. Feel free to email me if you have any questions.</p>
              <p>Good luck with your preparations!</p>
              <p>Ms. Johnson<br>Mathematics Department</p>`,
    date: new Date("2023-11-28T13:10:00"),
    isRead: true,
    isStarred: false,
    hasAttachments: true,
    attachments: [
      {
        name: "Math_Midterm_Review.pdf",
        type: "PDF",
        size: "385 KB"
      }
    ],
    folder: "sent"
  }
];

export default function MessagesPage() {
  const [selectedFolder, setSelectedFolder] = useState<string>("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredMessages = messages.filter(message => 
    message.folder === selectedFolder &&
    (message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
     message.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     message.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     message.preview.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Count unread messages in inbox
  const unreadCount = messages.filter(msg => msg.folder === 'inbox' && !msg.isRead).length;
  
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    // Mark as read when viewed
    if (!message.isRead && message.folder === 'inbox') {
      // In a real app, this would update the message in the database
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const clearSelection = () => {
    setSelectedMessage(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <Link href="/teacher/communication/messages/compose">
          <Button>
            <PlusSquare className="mr-2 h-4 w-4" /> Compose Message
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="folders" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="folders">Folders</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="folders" className="mt-4 space-y-4">
                  <div 
                    className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${selectedFolder === 'inbox' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      setSelectedFolder('inbox');
                      setSelectedMessage(null);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4" />
                      <span>Inbox</span>
                    </div>
                    {unreadCount > 0 && (
                      <Badge className="bg-blue-500">{unreadCount}</Badge>
                    )}
                  </div>
                  
                  <div 
                    className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${selectedFolder === 'sent' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      setSelectedFolder('sent');
                      setSelectedMessage(null);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Send className="h-4 w-4" />
                      <span>Sent</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${selectedFolder === 'starred' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      setSelectedFolder('starred');
                      setSelectedMessage(null);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Star className="h-4 w-4" />
                      <span>Starred</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${selectedFolder === 'trash' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      setSelectedFolder('trash');
                      setSelectedMessage(null);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="h-4 w-4" />
                      <span>Trash</span>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="contacts" className="mt-4 space-y-1">
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="search"
                        placeholder="Search contacts..."
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-500 py-1">STUDENTS</div>
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-800">JS</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">John Smith</span>
                    </div>
                    
                    <div className="text-xs font-medium text-gray-500 py-1">PARENTS</div>
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-green-100 text-green-800">LR</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">Lisa Robinson</span>
                    </div>
                    
                    <div className="text-xs font-medium text-gray-500 py-1">STAFF</div>
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-purple-100 text-purple-800">PA</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">Principal Adams</span>
                    </div>
                    
                    <div className="text-xs font-medium text-gray-500 py-1">GROUPS</div>
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-amber-100 text-amber-800">
                          <Users className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">Grade 10-A Students</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="flex-grow">
          <Card className="h-full">
            {!selectedMessage ? (
              /* Messages list */
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg capitalize">
                        {selectedFolder}
                      </CardTitle>
                      <CardDescription>
                        {filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type="search"
                          placeholder="Search messages..."
                          className="pl-9 w-[200px]"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                      </div>
                      <Button variant="ghost" size="icon" title="Refresh">
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Mail className="h-12 w-12 text-gray-300 mb-3" />
                        <h3 className="font-medium text-lg">No messages</h3>
                        <p className="text-gray-500 max-w-md mt-1">
                          {selectedFolder === 'inbox' ? 
                            'Your inbox is empty. Messages sent to you will appear here.' :
                            `No messages in ${selectedFolder}.`}
                        </p>
                      </div>
                    ) : (
                      filteredMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 cursor-pointer ${!message.isRead && message.folder === 'inbox' ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                          onClick={() => handleSelectMessage(message)}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0">
                              <Avatar className="h-10 w-10">
                                {message.folder === 'sent' ? (
                                  message.recipient.role === 'group' ? (
                                    <AvatarFallback className="bg-amber-100 text-amber-800">
                                      <Users className="h-5 w-5" />
                                    </AvatarFallback>
                                  ) : (
                                    <AvatarFallback>
                                      {message.recipient.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  )
                                ) : (
                                  <AvatarImage src={message.sender.avatar} />
                                )}
                                {!message.sender.avatar && message.folder !== 'sent' && (
                                  <AvatarFallback>
                                    {message.sender.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            </div>
                            
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <div className="font-medium text-sm truncate">
                                  {message.folder === 'sent' ? `To: ${message.recipient.name}` : message.sender.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {format(message.date, "MMM d, h:mm a")}
                                </div>
                              </div>
                              
                              <div className="font-medium text-sm truncate mb-1">
                                {message.subject}
                              </div>
                              
                              <div className="text-sm text-gray-600 truncate">
                                {message.preview}
                              </div>
                              
                              <div className="flex gap-2 mt-2">
                                {message.isStarred && (
                                  <Star className="h-4 w-4 text-amber-500" />
                                )}
                                {message.hasAttachments && (
                                  <Paperclip className="h-4 w-4 text-gray-400" />
                                )}
                                {!message.isRead && message.folder === 'inbox' && (
                                  <Badge className="bg-blue-500 h-2 w-2 p-0 rounded-full" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </>
            ) : (
              /* Message detail view */
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex justify-between items-center">
                    <Button variant="ghost" onClick={clearSelection}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        {selectedMessage.isStarred ? (
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Reply className="h-4 w-4 mr-1" /> Reply
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Forward className="h-4 w-4 mr-1" /> Forward
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold">{selectedMessage.subject}</h2>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-3 items-center">
                        <Avatar className="h-10 w-10">
                          {selectedMessage.folder === 'sent' ? (
                            selectedMessage.recipient.role === 'group' ? (
                              <AvatarFallback className="bg-amber-100 text-amber-800">
                                <Users className="h-5 w-5" />
                              </AvatarFallback>
                            ) : (
                              <AvatarFallback>
                                {selectedMessage.recipient.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            )
                          ) : (
                            <AvatarImage src={selectedMessage.sender.avatar} />
                          )}
                          {!selectedMessage.sender.avatar && selectedMessage.folder !== 'sent' && (
                            <AvatarFallback>
                              {selectedMessage.sender.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        
                        <div>
                          <div className="font-medium">
                            {selectedMessage.folder === 'sent' ? 
                              `To: ${selectedMessage.recipient.name}` : 
                              selectedMessage.sender.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(selectedMessage.date, "MMMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6 pb-4">
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedMessage.content }} />
                  </div>
                  
                  {selectedMessage.hasAttachments && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">Attachments</h3>
                      <div className="space-y-2">
                        {selectedMessage.attachments?.map((attachment, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium">{attachment.name}</div>
                                <div className="text-xs text-gray-500">{attachment.type} • {attachment.size}</div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Button variant="ghost" size="sm">
                    <Archive className="h-4 w-4 mr-1" /> Archive
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      <Reply className="h-4 w-4 mr-1" /> Reply
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Forward className="h-4 w-4 mr-1" /> Forward
                    </Button>
                  </div>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
