"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, PlusCircle, Search, Inbox, Send, Archive,
  Trash2, Reply, Forward, Loader2, Mail, MailOpen
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useRef } from "react";
import { Paperclip, X } from "lucide-react";

// Import server actions
import {
  getMessages,
  sendMessage,
  replyToMessage,
  forwardMessage,
  deleteMessage,
  markAsRead,
  getContacts,
  getMessageStats,
} from "@/lib/actions/messageActions";

// Import validation schema
import {
  messageSchema,
  MessageFormValues,
} from "@/lib/schemaValidation/messageSchemaValidation";

export default function MessagesPage() {
  // State management
  const [messages, setMessages] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFolder, setActiveFolder] = useState<"inbox" | "sent" | "archive">("inbox");
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      recipientId: "",
      subject: "",
      content: "",
      attachments: "",
    },
  });

  const replyForm = useForm({
    defaultValues: {
      content: "",
    },
  });

  const forwardForm = useForm({
    defaultValues: {
      recipientId: "",
    },
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, [activeFolder]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [messagesResult, contactsResult, statsResult] = await Promise.all([
        getMessages(activeFolder),
        getContacts(),
        getMessageStats(),
      ]);

      if (messagesResult.success) setMessages(messagesResult.data || []);
      if (contactsResult.success) setContacts(contactsResult.data || []);
      if (statsResult.success) setStats(statsResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // Filter messages
  const filteredMessages = messages.filter((message) => {
    const searchLower = searchTerm.toLowerCase();
    const senderName = `${message.sender?.firstName} ${message.sender?.lastName}`.toLowerCase();
    const recipientName = `${message.recipient?.firstName} ${message.recipient?.lastName}`.toLowerCase();
    const subject = message.subject?.toLowerCase() || "";
    const content = message.content?.toLowerCase() || "";

    return (
      senderName.includes(searchLower) ||
      recipientName.includes(searchLower) ||
      subject.includes(searchLower) ||
      content.includes(searchLower)
    );
  });

  // Handle compose message
  function handleComposeMessage() {
    form.reset({
      recipientId: "",
      subject: "",
      content: "",
      attachments: "",
    });
    setRecipientSearch("");
    setShowRecipientDropdown(false);
    setAttachments([]);
    setComposeDialogOpen(true);
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_FILE_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} exceeds 10MB limit`);
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name} is not a supported file type`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      toast.error(errors.join(", "));
    }

    setAttachments((prev) => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle remove attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Upload attachments to Cloudinary
  const uploadAttachments = async (): Promise<string> => {
    const uploadedUrls: string[] = [];

    for (const file of attachments) {
      try {
        const { uploadToCloudinary } = await import("@/lib/cloudinary");
        const result = await uploadToCloudinary(file, {
          folder: "messages/attachments",
          resource_type: "auto",
        });
        uploadedUrls.push(result.secure_url);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}`);
      }
    }

    return JSON.stringify(uploadedUrls);
  };

  // Handle view message
  async function handleViewMessage(message: any) {
    setSelectedMessage(message);
    setViewDialogOpen(true);

    // Mark as read if it's in inbox and unread
    if (activeFolder === "inbox" && !message.isRead) {
      await markAsRead(message.id);
      fetchAllData();
    }
  }

  // Handle reply
  function handleReply(message: any) {
    setSelectedMessage(message);
    replyForm.reset({ content: "" });
    setReplyDialogOpen(true);
  }

  // Handle forward
  function handleForward(message: any) {
    setSelectedMessage(message);
    forwardForm.reset({ recipientId: "" });
    setForwardDialogOpen(true);
  }

  // Handle delete
  function handleDelete(id: string) {
    setSelectedMessageId(id);
    setDeleteDialogOpen(true);
  }

  // Submit compose message
  async function onSubmitMessage(values: MessageFormValues) {
    try {
      setUploadingAttachments(true);

      // Upload attachments if any
      let attachmentUrls = "";
      if (attachments.length > 0) {
        try {
          attachmentUrls = await uploadAttachments();
        } catch (error) {
          toast.error("Failed to upload attachments");
          setUploadingAttachments(false);
          return;
        }
      }

      const result = await sendMessage({
        ...values,
        attachments: attachmentUrls || undefined,
      });

      if (result.success) {
        toast.success("Message sent successfully");
        setComposeDialogOpen(false);
        form.reset();
        setAttachments([]);
        fetchAllData();
      } else {
        toast.error(result.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setUploadingAttachments(false);
    }
  }

  // Submit reply
  async function onSubmitReply(values: any) {
    if (!selectedMessage) return;

    try {
      const result = await replyToMessage(selectedMessage.id, values.content);

      if (result.success) {
        toast.success("Reply sent successfully");
        setReplyDialogOpen(false);
        setViewDialogOpen(false);
        replyForm.reset();
        fetchAllData();
      } else {
        toast.error(result.error || "Failed to send reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Submit forward
  async function onSubmitForward(values: any) {
    if (!selectedMessage) return;

    try {
      const result = await forwardMessage(selectedMessage.id, values.recipientId);

      if (result.success) {
        toast.success("Message forwarded successfully");
        setForwardDialogOpen(false);
        setViewDialogOpen(false);
        forwardForm.reset();
        fetchAllData();
      } else {
        toast.error(result.error || "Failed to forward message");
      }
    } catch (error) {
      console.error("Error forwarding message:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Confirm delete
  async function confirmDelete() {
    if (!selectedMessageId) return;

    try {
      const result = await deleteMessage(selectedMessageId);

      if (result.success) {
        toast.success("Message deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedMessageId(null);
        fetchAllData();
      } else {
        toast.error(result.error || "Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("An unexpected error occurred");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/communication">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Communication
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        </div>
        <Button onClick={handleComposeMessage}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Compose Message
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inbox</p>
                  <p className="text-2xl font-bold">{stats.totalReceived}</p>
                </div>
                <Inbox className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold">{stats.unreadCount}</p>
                </div>
                <Mail className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sent</p>
                  <p className="text-2xl font-bold">{stats.totalSent}</p>
                </div>
                <Send className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Your Messages</CardTitle>
              <CardDescription>
                Send and receive messages with other users
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Tabs */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search messages..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs value={activeFolder} onValueChange={(v) => setActiveFolder(v as any)} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="inbox">
                  <Inbox className="h-4 w-4 mr-1" />
                  Inbox
                </TabsTrigger>
                <TabsTrigger value="sent">
                  <Send className="h-4 w-4 mr-1" />
                  Sent
                </TabsTrigger>
                <TabsTrigger value="archive">
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Messages List */}
          {filteredMessages.length === 0 ? (
            <div className="text-center py-10">
              <Mail className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No messages found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search"
                  : activeFolder === "inbox"
                  ? "Your inbox is empty"
                  : activeFolder === "sent"
                  ? "You haven't sent any messages yet"
                  : "No archived messages"}
              </p>
              {activeFolder === "inbox" && (
                <Button onClick={handleComposeMessage}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Compose Message
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${
                    !message.isRead && activeFolder === "inbox" ? "bg-primary/10 border-primary/30" : ""
                  }`}
                  onClick={() => handleViewMessage(message)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {activeFolder === "inbox"
                        ? `${message.sender?.firstName?.[0]}${message.sender?.lastName?.[0]}`
                        : `${message.recipient?.firstName?.[0]}${message.recipient?.lastName?.[0]}`}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-medium ${!message.isRead && activeFolder === "inbox" ? "font-bold" : ""}`}>
                        {activeFolder === "inbox"
                          ? `${message.sender?.firstName} ${message.sender?.lastName}`
                          : `${message.recipient?.firstName} ${message.recipient?.lastName}`}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.createdAt), "MMM dd, h:mm a")}
                      </span>
                    </div>
                    {message.subject && (
                      <p className={`text-sm mb-1 ${!message.isRead && activeFolder === "inbox" ? "font-semibold" : ""}`}>
                        {message.subject}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {message.content}
                    </p>
                  </div>
                  {!message.isRead && activeFolder === "inbox" && (
                    <Badge variant="default" className="ml-2">New</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compose Message Dialog */}
      <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogDescription>Send a message to another user</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmitMessage)} 
              className="space-y-4"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest('.recipient-search-container')) {
                  setShowRecipientDropdown(false);
                }
              }}
            >
              <FormField
                control={form.control}
                name="recipientId"
                render={({ field }) => {
                  const selectedContact = contacts.find(c => c.id === field.value);
                  const filteredContacts = contacts.filter(contact =>
                    `${contact.firstName} ${contact.lastName} ${contact.role}`
                      .toLowerCase()
                      .includes(recipientSearch.toLowerCase())
                  );

                  return (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <div className="relative recipient-search-container">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search for a recipient..."
                            className="pl-9"
                            value={selectedContact ? `${selectedContact.firstName} ${selectedContact.lastName} (${selectedContact.role})` : recipientSearch}
                            onChange={(e) => {
                              setRecipientSearch(e.target.value);
                              setShowRecipientDropdown(true);
                              if (field.value) {
                                field.onChange("");
                              }
                            }}
                            onFocus={() => setShowRecipientDropdown(true)}
                          />
                          {showRecipientDropdown && filteredContacts.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredContacts.map((contact) => (
                                <div
                                  key={contact.id}
                                  className="px-3 py-2 hover:bg-muted cursor-pointer"
                                  onClick={() => {
                                    field.onChange(contact.id);
                                    setRecipientSearch("");
                                    setShowRecipientDropdown(false);
                                  }}
                                >
                                  <div className="font-medium">
                                    {contact.firstName} {contact.lastName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{contact.role}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Message subject" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type your message here..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Attachments */}
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAttachments}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach Files
                  </Button>
                  <p className="text-xs text-gray-500">
                    Maximum file size: 10MB. Supported formats: Images, PDF, Word, Excel
                  </p>

                  {/* Attachment List */}
                  {attachments.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {attachments.map((file, index) => {
                        const isImage = file.type.startsWith("image/");
                        const previewUrl = isImage ? URL.createObjectURL(file) : null;

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isImage && previewUrl ? (
                                <img
                                  src={previewUrl}
                                  alt={file.name}
                                  className="h-10 w-10 object-cover rounded flex-shrink-0"
                                />
                              ) : (
                                <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAttachment(index)}
                              disabled={uploadingAttachments}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setComposeDialogOpen(false)}
                  disabled={uploadingAttachments}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadingAttachments}>
                  {uploadingAttachments ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Message Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject || "Message"}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {selectedMessage.sender?.firstName?.[0]}
                    {selectedMessage.sender?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedMessage.sender?.firstName} {selectedMessage.sender?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(selectedMessage.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>

              {/* Attachments */}
              {selectedMessage.attachments && (() => {
                try {
                  const attachmentUrls = JSON.parse(selectedMessage.attachments);
                  if (attachmentUrls && attachmentUrls.length > 0) {
                    return (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Attachments:</p>
                        <div className="space-y-2">
                          {attachmentUrls.map((url: string, index: number) => {
                            const fileName = url.split("/").pop() || `attachment-${index + 1}`;
                            const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                            
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50"
                              >
                                {isImage ? (
                                  <img
                                    src={url}
                                    alt={fileName}
                                    className="h-10 w-10 object-cover rounded flex-shrink-0"
                                  />
                                ) : (
                                  <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                )}
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex-1 truncate"
                                >
                                  {fileName}
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                } catch (error) {
                  console.error("Error parsing attachments:", error);
                }
                return null;
              })()}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {activeFolder === "inbox" && (
              <Button onClick={() => {
                setViewDialogOpen(false);
                handleReply(selectedMessage);
              }}>
                <Reply className="mr-2 h-4 w-4" />
                Reply
              </Button>
            )}
            <Button variant="outline" onClick={() => {
              setViewDialogOpen(false);
              handleForward(selectedMessage);
            }}>
              <Forward className="mr-2 h-4 w-4" />
              Forward
            </Button>
            <Button variant="destructive" onClick={() => {
              setViewDialogOpen(false);
              handleDelete(selectedMessage.id);
            }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
          </DialogHeader>
          <form onSubmit={replyForm.handleSubmit(onSubmitReply)} className="space-y-4">
            <Textarea
              placeholder="Type your reply..."
              className="min-h-[150px]"
              {...replyForm.register("content")}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Reply className="mr-2 h-4 w-4" />
                Send Reply
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forward Dialog */}
      <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward Message</DialogTitle>
          </DialogHeader>
          <form onSubmit={forwardForm.handleSubmit(onSubmitForward)} className="space-y-4">
            <Select {...forwardForm.register("recipientId")}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setForwardDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Forward className="mr-2 h-4 w-4" />
                Forward
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
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

