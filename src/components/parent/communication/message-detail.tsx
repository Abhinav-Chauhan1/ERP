"use client";

import { format } from "date-fns";
import {
  ArrowLeft,
  Reply,
  Forward,
  Trash2,
  Download,
  Paperclip,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
    attachments?: string | null;
  };
  type: "inbox" | "sent";
  onBack: () => void;
  onReply?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onDownloadAttachment?: (attachmentUrl: string, fileName: string) => void;
  thread?: Array<{
    id: string;
    content: string;
    createdAt: Date;
    sender: {
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  }>;
}

export function MessageDetail({
  message,
  type,
  onBack,
  onReply,
  onForward,
  onDelete,
  onDownloadAttachment,
  thread,
}: MessageDetailProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      TEACHER: "bg-blue-100 text-blue-700 border-blue-200",
      ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
      PARENT: "bg-green-100 text-green-700 border-green-200",
    };

    return (
      <Badge
        variant="outline"
        className={cn("text-xs", roleColors[role] || "bg-gray-100 text-gray-700")}
      >
        {role.charAt(0) + role.slice(1).toLowerCase()}
      </Badge>
    );
  };

  const parseAttachments = (attachments: string | null): string[] => {
    if (!attachments) return [];
    try {
      return JSON.parse(attachments);
    } catch {
      return [];
    }
  };

  const getFileName = (url: string): string => {
    const parts = url.split("/");
    return parts[parts.length - 1] || "attachment";
  };

  const attachmentList = parseAttachments(message.attachments || null);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {type === "inbox" && onReply && (
              <Button variant="outline" size="sm" onClick={() => onReply(message.id)}>
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
            )}
            {onForward && (
              <Button variant="outline" size="sm" onClick={() => onForward(message.id)}>
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(message.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Subject */}
        <div>
          <h2 className="text-2xl font-semibold">
            {message.subject || "(No Subject)"}
          </h2>
        </div>

        <Separator />

        {/* Sender/Recipient Info */}
        <div className="space-y-3">
          {/* Sender */}
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={message.sender.avatar || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {getInitials(message.sender.firstName, message.sender.lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold">
                  {message.sender.firstName} {message.sender.lastName}
                </p>
                {getRoleBadge(message.sender.role)}
              </div>
              <p className="text-sm text-gray-600">{message.sender.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(message.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          {/* Recipient */}
          <div className="flex items-center gap-2 text-sm text-gray-600 pl-15">
            <span className="font-medium">To:</span>
            <span>
              {message.recipient.firstName} {message.recipient.lastName}
            </span>
            <span className="text-gray-400">({message.recipient.email})</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Message Content */}
        <div className="prose prose-sm max-w-none">
          <div
            className="whitespace-pre-wrap text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: message.content }}
          />
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
                {attachmentList.map((url, index) => {
                  const fileName = getFileName(url);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <Paperclip className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fileName}</p>
                          <p className="text-xs text-gray-500">Attachment</p>
                        </div>
                      </div>
                      {onDownloadAttachment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownloadAttachment(url, fileName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {thread && thread.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-3">Previous Messages</h3>
              <div className="space-y-4">
                {thread.map((msg) => (
                  <div key={msg.id} className="border-l-2 border-gray-200 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={msg.sender.avatar || undefined} />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                          {getInitials(msg.sender.firstName, msg.sender.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {msg.sender.firstName} {msg.sender.lastName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(msg.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
