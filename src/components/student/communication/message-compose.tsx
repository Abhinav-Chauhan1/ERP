"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Paperclip, X, Send } from "lucide-react";
import {
  sendMessage,
  getAvailableRecipients,
  uploadMessageAttachment,
} from "@/lib/actions/student-communication-actions";

// Validation schema
const messageSchema = z.object({
  recipientId: z.string().min(1, "Please select a recipient"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters"),
  content: z
    .string()
    .min(1, "Message content is required")
    .max(10000, "Message content must be less than 10000 characters"),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  role: string;
  teacher?: {
    id: string;
    subjects: Array<{ subject: { name: string } }>;
  } | null;
}

interface MessageComposeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultRecipientId?: string;
}

export function MessageCompose({
  isOpen,
  onClose,
  onSuccess,
  defaultRecipientId,
}: MessageComposeProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [attachments, setAttachments] = useState<
    Array<{ url: string; fileName: string; fileSize: number }>
  >([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [recipientSearchOpen, setRecipientSearchOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      recipientId: defaultRecipientId || "",
      subject: "",
      content: "",
    },
  });

  const selectedRecipientId = watch("recipientId");

  // Load recipients when dialog opens using useEffect
  React.useEffect(() => {
    if (isOpen && recipients.length === 0) {
      setLoadingRecipients(true);
      getAvailableRecipients()
        .then((result) => {
          if (result.success && result.data) {
            console.log("Recipients loaded:", result.data.length);
            setRecipients(result.data);
          } else {
            console.error("Failed to load recipients:", result.message);
            toast({
              title: "Error",
              description: result.message || "Failed to load recipients",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          console.error("Error loading recipients:", error);
          toast({
            title: "Error",
            description: "An unexpected error occurred while loading recipients",
            variant: "destructive",
          });
        })
        .finally(() => {
          setLoadingRecipients(false);
        });
    }
  }, [isOpen, recipients.length, toast]);

  // Load recipients when dialog opens
  const handleOpenChange = async (open: boolean) => {
    if (open) {
      // Always load recipients when opening to ensure fresh data
      setLoadingRecipients(true);
      try {
        const result = await getAvailableRecipients();

        if (result.success && result.data) {
          console.log("Recipients loaded:", result.data.length);
          setRecipients(result.data);
        } else {
          console.error("Failed to load recipients:", result.message);
          toast({
            title: "Error",
            description: result.message || "Failed to load recipients",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading recipients:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading recipients",
          variant: "destructive",
        });
      } finally {
        setLoadingRecipients(false);
      }
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    reset();
    setAttachments([]);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingFile(true);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadMessageAttachment(formData);
    setUploadingFile(false);

    if (result.success && result.data) {
      setAttachments([
        ...attachments,
        {
          url: result.data.url,
          fileName: result.data.fileName,
          fileSize: result.data.fileSize,
        },
      ]);
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } else {
      toast({
        title: "Upload failed",
        description: result.message || "Failed to upload file",
        variant: "destructive",
      });
    }

    // Reset file input
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: MessageFormData) => {
    setIsLoading(true);

    const result = await sendMessage({
      recipientId: data.recipientId,
      subject: data.subject,
      content: data.content,
      attachments: attachments.map((a) => a.url),
    });

    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
      handleClose();
      onSuccess?.();
    } else {
      toast({
        title: "Failed to send message",
        description: result.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "TEACHER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const selectedRecipient = recipients.find((r) => r.id === selectedRecipientId);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Message</DialogTitle>
          <DialogDescription>
            Send a message to a teacher or administrator
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Recipient Selector */}
          <div className="space-y-2">
            <Label htmlFor="recipient">
              To <span className="text-red-500">*</span>
            </Label>
            {loadingRecipients ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">
                  Loading recipients...
                </span>
              </div>
            ) : (
              <>
                <Popover open={recipientSearchOpen} onOpenChange={setRecipientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={recipientSearchOpen}
                      className="w-full justify-between min-h-[44px]"
                    >
                      {selectedRecipientId
                        ? (() => {
                          const selected = recipients.find((r) => r.id === selectedRecipientId);
                          return selected ? (
                            <div className="flex items-center gap-2">
                              <span>{selected.firstName} {selected.lastName}</span>
                              <Badge variant="outline" className={getRoleBadgeColor(selected.role)}>
                                {selected.role}
                              </Badge>
                            </div>
                          ) : "Select a recipient";
                        })()
                        : "Select a recipient"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search recipients..." className="h-10" />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No recipient found.</CommandEmpty>
                        <CommandGroup>
                          {recipients.map((recipient) => (
                            <CommandItem
                              key={recipient.id}
                              value={`${recipient.firstName} ${recipient.lastName} ${recipient.email} ${recipient.role}`}
                              onSelect={() => {
                                setValue("recipientId", recipient.id);
                                setRecipientSearchOpen(false);
                              }}
                              className="flex items-center gap-2 py-3 cursor-pointer"
                            >
                              <Check
                                className={`h-4 w-4 shrink-0 ${selectedRecipientId === recipient.id
                                  ? "opacity-100"
                                  : "opacity-0"
                                  }`}
                              />
                              <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="font-medium truncate">
                                    {recipient.firstName} {recipient.lastName}
                                  </span>
                                  {recipient.teacher?.subjects &&
                                    recipient.teacher.subjects.length > 0 && (
                                      <span className="text-xs text-muted-foreground truncate">
                                        ({recipient.teacher.subjects[0].subject.name}
                                        {recipient.teacher.subjects.length > 1 &&
                                          ` +${recipient.teacher.subjects.length - 1}`}
                                        )
                                      </span>
                                    )}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`${getRoleBadgeColor(recipient.role)} shrink-0`}
                                >
                                  {recipient.role}
                                </Badge>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected Recipient Display */}
                {selectedRecipient && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedRecipient.avatar || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getInitials(
                          selectedRecipient.firstName,
                          selectedRecipient.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {selectedRecipient.firstName} {selectedRecipient.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {selectedRecipient.email}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={getRoleBadgeColor(selectedRecipient.role)}
                    >
                      {selectedRecipient.role}
                    </Badge>
                  </div>
                )}

                {errors.recipientId && (
                  <p className="text-sm text-red-500">
                    {errors.recipientId.message}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              placeholder="Enter message subject"
              className="min-h-[44px]"
              {...register("subject")}
            />
            {errors.subject && (
              <p className="text-sm text-red-500">{errors.subject.message}</p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Type your message here..."
              className="min-h-[200px] resize-none"
              {...register("content")}
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {watch("content")?.length || 0} / 10000 characters
              </span>
            </div>
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content.message}</p>
            )}
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>
            <div className="space-y-2">
              {/* File Upload Button */}
              <div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach File
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Max file size: 10MB. Allowed: PDF, Word, Excel, Text, Images
                </p>
              </div>

              {/* Attachment List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment, index) => {
                    // Check if it's an image URL for preview
                    const isImage = attachment.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                      attachment.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isImage ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={attachment.url}
                                alt={attachment.fileName}
                                className="h-10 w-10 object-cover rounded flex-shrink-0"
                              />
                            </>
                          ) : (
                            <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.fileSize)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
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
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
