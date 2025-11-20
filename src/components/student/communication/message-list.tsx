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
  }, [debouncedSearchQuery, readFilter, onFilterChange]);

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

      <CardContent>
        {/* Message List */}
        <div className="space-y-2">
          {/* Messages */}
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No messages found</p>
            </div>
          ) : (
            messages.map((message) => {
              const displayUser = type === "sent" ? message.recipient : message.sender;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50",
                    !message.isRead && type === "inbox" && "bg-blue-50/50 border-blue-200"
                  )}
                  onClick={() => onMessageClick(message.id)}
                >
                  {/* Read/Unread Icon */}
                  <div className="pt-1">
                    {message.isRead || type === "sent" ? (
                      <MailOpen className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Mail className="h-5 w-5 text-blue-600" />
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={displayUser.avatar || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(displayUser.firstName, displayUser.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm truncate",
                          !message.isRead && type === "inbox" ? "font-semibold" : "font-medium"
                        )}>
                          {displayUser.firstName} {displayUser.lastName}
                        </p>
                        <p className={cn(
                          "text-sm truncate",
                          !message.isRead && type === "inbox" ? "font-semibold text-gray-900" : "text-gray-700"
                        )}>
                          {message.subject || "(No Subject)"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {hasAttachments(message.attachments) && (
                          <Badge variant="outline" className="text-xs">
                            📎
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {format(new Date(message.createdAt), "MMM d")}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {truncateContent(message.content)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
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
