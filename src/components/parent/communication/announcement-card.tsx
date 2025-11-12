"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Paperclip,
  Calendar,
  User,
  Circle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AnnouncementCardProps {
  announcement: {
    id: string;
    title: string;
    content: string;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    hasAttachments: boolean;
    publisher: {
      firstName: string;
      lastName: string;
      avatar?: string | null;
    };
    createdAt: Date;
  };
  isRead?: boolean;
  category?: string;
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
  }>;
  onMarkAsRead?: (announcementId: string) => void;
  onDownloadAttachment?: (url: string, fileName: string) => void;
  defaultExpanded?: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ACADEMIC: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  EVENT: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  HOLIDAY: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  URGENT: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  GENERAL: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
};

export function AnnouncementCard({
  announcement,
  isRead = false,
  category = "GENERAL",
  attachments = [],
  onMarkAsRead,
  onDownloadAttachment,
  defaultExpanded = false,
}: AnnouncementCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getCategoryBadge = (cat: string) => {
    const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.GENERAL;
    return (
      <Badge
        variant="outline"
        className={cn("text-xs", colors.bg, colors.text, colors.border)}
      >
        {cat.charAt(0) + cat.slice(1).toLowerCase()}
      </Badge>
    );
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const shouldTruncate = announcement.content.length > 200;
  const displayContent = !isExpanded && shouldTruncate
    ? announcement.content.substring(0, 200) + "..."
    : announcement.content;

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && !isRead && onMarkAsRead) {
      onMarkAsRead(announcement.id);
    }
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        !isRead && "border-l-4 border-l-blue-500"
      )}
    >
      <CardHeader className="space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {!isRead && (
                <Circle className="h-2 w-2 fill-blue-600 text-blue-600" />
              )}
              <h3 className={cn(
                "text-lg font-semibold",
                !isRead && "text-blue-900"
              )}>
                {announcement.title}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              {getCategoryBadge(category)}
              {!announcement.isActive && (
                <Badge variant="outline" className="text-xs bg-gray-100">
                  Expired
                </Badge>
              )}
            </div>
          </div>

          {/* Expand/Collapse Button */}
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className="flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Publisher and Date Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={announcement.publisher.avatar || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {getInitials(
                  announcement.publisher.firstName,
                  announcement.publisher.lastName
                )}
              </AvatarFallback>
            </Avatar>
            <span>
              {announcement.publisher.firstName} {announcement.publisher.lastName}
            </span>
          </div>

          <Separator orientation="vertical" className="h-4" />

          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(announcement.startDate), "MMM d, yyyy")}</span>
          </div>

          {announcement.endDate && (
            <>
              <span>-</span>
              <span>{format(new Date(announcement.endDate), "MMM d, yyyy")}</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content */}
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {displayContent}
          </p>
        </div>

        {/* Show More/Less Button for Long Content */}
        {shouldTruncate && (
          <Button
            variant="link"
            size="sm"
            onClick={handleToggleExpand}
            className="px-0 h-auto font-medium"
          >
            {isExpanded ? "Show less" : "Read more"}
          </Button>
        )}

        {/* Attachments */}
        {announcement.hasAttachments && attachments.length > 0 && (
          <div className="space-y-2 pt-2">
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments ({attachments.length})
              </h4>
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                        <Paperclip className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attachment.name}
                        </p>
                        {attachment.size && (
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.size)}
                          </p>
                        )}
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
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mark as Read Button */}
        {!isRead && onMarkAsRead && isExpanded && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkAsRead(announcement.id)}
            >
              Mark as Read
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
