"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  X,
  Upload,
  Paperclip,
  Send,
  Save,
  AlertCircle,
  Users,
  UserPlus,
  ChevronsUpDown,
  Check,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Mock contact data
const contacts = [
  {
    id: "s1",
    name: "John Smith",
    role: "student",
    group: "Grade 10-A",
    avatar: "/assets/avatars/student1.jpg"
  },
  {
    id: "s2",
    name: "Emily Johnson",
    role: "student",
    group: "Grade 10-A",
    avatar: "/assets/avatars/student2.jpg"
  },
  {
    id: "s3",
    name: "Michael Brown",
    role: "student",
    group: "Grade 11-B",
    avatar: "/assets/avatars/student3.jpg"
  },
  {
    id: "p1",
    name: "Lisa Robinson",
    role: "parent",
    group: "Michael's Parent",
    avatar: "/assets/avatars/parent1.jpg"
  },
  {
    id: "p2",
    name: "Robert Johnson",
    role: "parent",
    group: "Emily's Parent",
    avatar: "/assets/avatars/parent2.jpg"
  },
  {
    id: "t1",
    name: "David Wilson",
    role: "teacher",
    group: "Mathematics",
    avatar: "/assets/avatars/teacher2.jpg"
  },
  {
    id: "a1",
    name: "Principal Adams",
    role: "admin",
    group: "Administration",
    avatar: "/assets/avatars/admin1.jpg"
  }
];

// Mock group data
const groups = [
  {
    id: "g1",
    name: "Grade 10-A Students",
    role: "group",
    count: 32
  },
  {
    id: "g2",
    name: "Grade 10-A Parents",
    role: "group",
    count: 45
  },
  {
    id: "g3",
    name: "Grade 11-B Students",
    role: "group",
    count: 29
  },
  {
    id: "g4",
    name: "Mathematics Department",
    role: "group",
    count: 8
  },
  {
    id: "g5",
    name: "All Staff",
    role: "group",
    count: 42
  }
];

export default function ComposeMessagePage() {
  const router = useRouter();
  const [to, setTo] = useState<string[]>([]);
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [openRecipient, setOpenRecipient] = useState(false);
  
  const handleAddRecipient = (id: string, name: string) => {
    if (!to.includes(id)) {
      setTo([...to, id]);
    }
    setOpenRecipient(false);
  };
  
  const handleRemoveRecipient = (id: string) => {
    setTo(to.filter(recipient => recipient !== id));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };
  
  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  
  const handleSendMessage = () => {
    console.log("Message sent!", { to, subject, message, files });
    // In a real app, this would call an API to send the message
    router.push("/teacher/communication/messages");
  };
  
  const handleSaveDraft = () => {
    console.log("Draft saved!", { to, subject, message, files });
    // In a real app, this would save the draft
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Compose Message</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={handleSendMessage}>
            <Send className="mr-2 h-4 w-4" /> Send Message
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="border-b">
          <CardTitle>New Message</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="recipients">To</Label>
            <div className="mt-1 flex flex-wrap gap-2 items-center p-2 border rounded-md">
              {to.map(id => {
                const contact = [...contacts, ...groups].find(c => c.id === id);
                return (
                  <Badge key={id} className="flex items-center gap-1 bg-blue-100 hover:bg-blue-100 text-blue-800">
                    {contact?.role === 'group' ? (
                      <Users className="h-3 w-3" />
                    ) : null}
                    {contact?.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveRecipient(id)} 
                    />
                  </Badge>
                );
              })}
              
              <Popover open={openRecipient} onOpenChange={setOpenRecipient}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    role="combobox" 
                    aria-expanded={openRecipient}
                    className="h-8 px-2 text-sm"
                  >
                    Add recipient...
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Tabs defaultValue="contacts">
                    <TabsList className="w-full">
                      <TabsTrigger value="contacts" className="flex-1">Contacts</TabsTrigger>
                      <TabsTrigger value="groups" className="flex-1">Groups</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="contacts" className="p-0">
                      <Command>
                        <CommandInput placeholder="Search contacts..." />
                        <CommandEmpty>No contacts found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                          {contacts.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              value={contact.id + contact.name}
                              onSelect={() => handleAddRecipient(contact.id, contact.name)}
                              className="flex items-center gap-2"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={contact.avatar} />
                                <AvatarFallback>
                                  {contact.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div>{contact.name}</div>
                                <div className="text-xs text-gray-500">
                                  {contact.role} • {contact.group}
                                </div>
                              </div>
                              {to.includes(contact.id) && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </TabsContent>
                    
                    <TabsContent value="groups" className="p-0">
                      <Command>
                        <CommandInput placeholder="Search groups..." />
                        <CommandEmpty>No groups found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                          {groups.map((group) => (
                            <CommandItem
                              key={group.id}
                              value={group.id + group.name}
                              onSelect={() => handleAddRecipient(group.id, group.name)}
                            >
                              <div className="flex items-center gap-2">
                                <div className="bg-amber-100 rounded-full p-1">
                                  <Users className="h-4 w-4 text-amber-800" />
                                </div>
                                <div>
                                  <div>{group.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {group.count} members
                                  </div>
                                </div>
                              </div>
                              {to.includes(group.id) && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input 
              id="subject" 
              placeholder="Enter message subject"
              className="mt-1"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea 
              id="message" 
              placeholder="Write your message here..."
              className="mt-1 min-h-[200px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Attachments</Label>
            <div className="mt-1 p-4 border border-dashed rounded-md">
              <div className="flex flex-col items-center gap-2">
                <Input 
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                />
                <Label htmlFor="fileUpload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="font-medium">Click to upload files</p>
                    <p className="text-xs text-gray-500">
                      Upload PDF, Word, Excel, or image files (Max 10MB)
                    </p>
                  </div>
                </Label>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Attached files:</div>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t flex justify-between">
          <Link href="/teacher/communication/messages">
            <Button variant="outline">Cancel</Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="mr-2 h-4 w-4" /> Save Draft
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={to.length === 0 || !subject || !message}
            >
              <Send className="mr-2 h-4 w-4" /> Send Message
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
