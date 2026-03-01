"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Download,
  Paperclip,
  Calendar,
  Mail,
  Reply,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageReplyForm } from "./message-reply-form";

interface MessageDetailProps {
  message: {
    id: string;
    subject: string | null;
    content: string;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar: string | null;
      role: string;
    };
    recipient: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar: string | null;
      role: string;
    };
    attachments: string | null;
  };
  onBack: () => void;
  onDownloadAttachment?: (url: string, fileName: string) => void;
  onReplySuccess?: () => void;
}

export function MessageDetail({
  message,
  onBack,
  onDownloadAttachment,
  onReplySuccess,
}: MessageDetailProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    onReplySuccess?.();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "TEACHER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "STUDENT":
        return "bg-green-100 text-green-700 border-green-200";
      case "PARENT":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const parseAttachments = (attachments: string | null): Array<{ name: string; url: string }> => {
    if (!attachments) return [];
    try {
      // Assuming attachments is a JSON string array of URLs
      const urls = JSON.parse(attachments);
      return urls.map((url: string) => ({
        name: url.split("/").pop() || "attachment",
        url,
      }));
    } catch {
      return [];
    }
  };

  const attachmentList = parseAttachments(message.attachments);

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Messages
        </Button>
        {!showReplyForm && (
          <Button onClick={() => setShowReplyForm(true)} className="min-h-[44px]">
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
        )}
      </div>

      {/* Message Card */}
      <Card>
        <CardHeader className="space-y-4">
          {/* Subject */}
          <div>
            <h1 className="text-2xl font-bold">
              {message.subject || "(No Subject)"}
            </h1>
          </div>

          <Separator />

          {/* Sender Info */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={message.sender.avatar || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {getInitials(message.sender.firstName, message.sender.lastName)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {message.sender.firstName} {message.sender.lastName}
                  </p>
                  <Badge
                    variant="outline"
                    className={getRoleBadgeColor(message.sender.role)}
                  >
                    {message.sender.role}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{message.sender.email}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(message.createdAt), "PPP")}</span>
                  </div>
                  <span>{format(new Date(message.createdAt), "p")}</span>
                </div>
              </div>
            </div>

            {/* Read Status */}
            {message.isRead && message.readAt && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Read {format(new Date(message.readAt), "MMM d, h:mm a")}
              </Badge>
            )}
          </div>

          {/* Recipient Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <Mail className="h-4 w-4" />
            <span>To:</span>
            <span className="font-medium">
              {message.recipient.firstName} {message.recipient.lastName}
            </span>
            <span className="text-gray-400">({message.recipient.email})</span>
            <Badge
              variant="outline"
              className={getRoleBadgeColor(message.recipient.role)}
            >
              {message.recipient.role}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Message Content */}
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {message.content}
            </div>
          </div>

          {/* Attachments */}
          {attachmentList.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({attachmentList.length})
                </h3>
                <div className="space-y-2">
                  {attachmentList.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <Paperclip className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {attachment.name}
                          </p>
                        </div>
                      </div>
                      {onDownloadAttachment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onDownloadAttachment(attachment.url, attachment.name)
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Form */}
      {showReplyForm && (
        <MessageReplyForm
          originalMessage={{
            id: message.id,
            subject: message.subject,
            content: message.content,
            sender: message.sender,
          }}
          onReply={handleReplySuccess}
          onCancel={() => setShowReplyForm(false)}
        />
      )}
    </div>
  );
}
