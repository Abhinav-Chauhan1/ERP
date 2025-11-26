"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Mail,
  MailOpen,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface MessageListItem {
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
    avatar: string | null;
    role: string;
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    role: string;
  };
  attachments: string | null;
}

interface MessageListProps {
  messages: MessageListItem[];
  type: "inbox" | "sent";
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  onMessageClick: (messageId: string) => void;
  onPageChange: (page: number) => void;
  onFilterChange?: (filters: {
    isRead?: boolean;
    search?: string;
  }) => void;
}

export function MessageList({
  messages,
  type,
  pagination,
  onMessageClick,
  onPageChange,
  onFilterChange,
}: MessageListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [readFilter, setReadFilter] = useState<string>("all");
  
  // Debounce search query with 300ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };
  
  // Trigger filter change when debounced search changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        search: debouncedSearchQuery,
        isRead: readFilter === "all" ? undefined : readFilter === "read",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, readFilter]);

  const handleReadFilterChange = (value: string) => {
    setReadFilter(value);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const hasAttachments = (attachments: string | null) => {
    return attachments !== null && attachments.length > 0;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg capitalize">{type}</CardTitle>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {type === "inbox" && (
              <Select value={readFilter} onValueChange={handleReadFilterChange}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Message List */}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Mail className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No messages</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              You don't have any messages yet. Start a conversation with your teachers.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message) => {
              const displayUser = type === "sent" ? message.recipient : message.sender;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "p-4 hover:bg-accent cursor-pointer transition-colors",
                    !message.isRead && type === "inbox" && "bg-blue-50/50"
                  )}
                  onClick={() => onMessageClick(message.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        !message.isRead && type === "inbox" ? "bg-primary/10" : "bg-muted"
                      )}>
                        {message.isRead || type === "sent" ? (
                          <MailOpen className={cn(
                            "h-5 w-5",
                            !message.isRead && type === "inbox" ? "text-primary" : "text-muted-foreground"
                          )} />
                        ) : (
                          <Mail className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={cn(
                          "text-sm",
                          !message.isRead && type === "inbox" ? "font-semibold" : "font-medium text-muted-foreground"
                        )}>
                          {displayUser.firstName} {displayUser.lastName}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), "MMM d")}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm mb-1",
                        !message.isRead && type === "inbox" ? "font-medium" : "text-muted-foreground"
                      )}>
                        {message.subject || "(No Subject)"}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {truncateContent(message.content)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {!message.isRead && type === "inbox" && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            Unread
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {displayUser.role === "TEACHER" ? "Teacher" : displayUser.role === "ADMIN" ? "Admin" : "Student"}
                        </Badge>
                        {hasAttachments(message.attachments) && (
                          <Badge variant="outline" className="text-xs">
                            📎 Attachment
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && messages.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
              {pagination.totalCount} messages
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
