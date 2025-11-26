"use client";

import { useState, useRef } from "react";
import { X, Paperclip, Send, Save, Loader2, AlertCircle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecipientOption {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

interface ComposeMessageProps {
  open: boolean;
  onClose: () => void;
  recipients: RecipientOption[];
  onSend: (data: {
    recipientId: string;
    subject: string;
    content: string;
    attachments?: string[];
  }) => Promise<{ success: boolean; message?: string }>;
  onSaveDraft?: (data: {
    recipientId: string | null;
    subject: string;
    content: string;
    attachments?: string[];
  }) => Promise<{ success: boolean; message?: string }>;
  defaultRecipientId?: string;
  defaultSubject?: string;
  defaultContent?: string;
}

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

export function ComposeMessage({
  open,
  onClose,
  recipients,
  onSend,
  onSaveDraft,
  defaultRecipientId,
  defaultSubject,
  defaultContent,
}: ComposeMessageProps) {
  const [recipientId, setRecipientId] = useState(defaultRecipientId || "");
  const [subject, setSubject] = useState(defaultSubject || "");
  const [content, setContent] = useState(defaultContent || "");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientSearchOpen, setRecipientSearchOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} exceeds 10MB limit`);
        return;
      }

      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name} is not a supported file type`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(", "));
    } else {
      setError(null);
    }

    setAttachments((prev) => [...prev, ...validFiles]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const uploadAttachments = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of attachments) {
      try {
        // Upload to Cloudinary
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

    return uploadedUrls;
  };

  const handleSend = async () => {
    // Validation
    if (!recipientId) {
      setError("Please select a recipient");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    if (!content.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload attachments if any
      let attachmentUrls: string[] = [];
      if (attachments.length > 0) {
        attachmentUrls = await uploadAttachments();
      }

      // Send message
      const result = await onSend({
        recipientId,
        subject,
        content,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      });

      if (result.success) {
        // Reset form
        setRecipientId("");
        setSubject("");
        setContent("");
        setAttachments([]);
        onClose();
      } else {
        setError(result.message || "Failed to send message");
      }
    } catch (err) {
      setError("An error occurred while sending the message");
      console.error("Send message error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;

    setIsSavingDraft(true);
    setError(null);

    try {
      // Upload attachments if any
      let attachmentUrls: string[] = [];
      if (attachments.length > 0) {
        attachmentUrls = await uploadAttachments();
      }

      // Save draft
      const result = await onSaveDraft({
        recipientId: recipientId || null,
        subject,
        content,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      });

      if (result.success) {
        // Reset form
        setRecipientId("");
        setSubject("");
        setContent("");
        setAttachments([]);
        onClose();
      } else {
        setError(result.message || "Failed to save draft");
      }
    } catch (err) {
      setError("An error occurred while saving the draft");
      console.error("Save draft error:", err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isSavingDraft) {
      // Clean up object URLs to prevent memory leaks
      attachments.forEach(file => {
        if (file.type.startsWith('image/')) {
          URL.revokeObjectURL(URL.createObjectURL(file));
        }
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Message</DialogTitle>
          <DialogDescription>
            Send a message to a teacher or administrator
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Recipient */}
          <div className="space-y-2">
            <Label htmlFor="recipient">To *</Label>
            <Popover open={recipientSearchOpen} onOpenChange={setRecipientSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={recipientSearchOpen}
                  className="w-full justify-between min-h-[44px]"
                >
                  {recipientId
                    ? (() => {
                        const selected = recipients.find((r) => r.id === recipientId);
                        return selected ? (
                          <div className="flex items-center gap-2">
                            <span>{selected.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {selected.role}
                            </Badge>
                          </div>
                        ) : "Select recipient";
                      })()
                    : "Select recipient"}
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
                          value={`${recipient.name} ${recipient.email} ${recipient.role}`}
                          onSelect={() => {
                            setRecipientId(recipient.id);
                            setRecipientSearchOpen(false);
                          }}
                          className="flex items-center gap-2 py-3 cursor-pointer"
                        >
                          <Check
                            className={`h-4 w-4 shrink-0 ${
                              recipientId === recipient.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
                            <span className="font-medium truncate">{recipient.name}</span>
                            <Badge variant="outline" className="text-xs shrink-0">
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
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting || isSavingDraft}
            />
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message *</Label>
            <Textarea
              id="content"
              placeholder="Type your message here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting || isSavingDraft}
              rows={10}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {content.length} characters
            </p>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="space-y-2">
              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_FILE_TYPES.join(",")}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || isSavingDraft}
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
                    const isImage = file.type.startsWith('image/');
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
                          disabled={isSubmitting || isSavingDraft}
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
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || isSavingDraft}
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {onSaveDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSubmitting || isSavingDraft}
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
            )}

            <Button
              type="button"
              onClick={handleSend}
              disabled={isSubmitting || isSavingDraft}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
