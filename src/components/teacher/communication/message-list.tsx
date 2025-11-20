"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Mail,
  MailOpen,
  Search,
  Trash2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  type: "inbox" | "sent" | "drafts";
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
  onBulkDelete?: (messageIds: string[]) => void;
  onBulkMarkAsRead?: (messageIds: string[]) => void;
}

export function MessageList({
  messages,
  type,
  pagination,
  onMessageClick,
  onPageChange,
  onFilterChange,
  onBulkDelete,
  onBulkMarkAsRead,
}: MessageListProps) {
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [readFilter, setReadFilter] = useState<string>("all");
  
  // Debounce search query with 300ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleSelectAll = () => {
    if (selectedMessages.size === messages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(messages.map((m) => m.id)));
    }
  };

  const handleSelectMessage = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

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

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedMessages.size > 0) {
      onBulkDelete(Array.from(selectedMessages));
      setSelectedMessages(new Set());
    }
  };

  const handleBulkMarkAsRead = () => {
    if (onBulkMarkAsRead && selectedMessages.size > 0) {
      onBulkMarkAsRead(Array.from(selectedMessages));
      setSelectedMessages(new Set());
    }
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
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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

        {/* Bulk Actions */}
        {selectedMessages.size > 0 && (
          <div className="flex items-center gap-2 pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedMessages.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkMarkAsRead}
              disabled={type !== "inbox"}
            >
              <MailOpen className="h-4 w-4 mr-2" />
              Mark as Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Message List */}
        <div className="space-y-2">
          {/* Select All */}
          {messages.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b">
              <Checkbox
                checked={selectedMessages.size === messages.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          )}

          {/* Messages */}
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No messages found</p>
            </div>
          ) : (
            messages.map((message) => {
              const displayUser = type === "sent" ? message.recipient : message.sender;
              const isSelected = selectedMessages.has(message.id);

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50",
                    !message.isRead && type === "inbox" && "bg-primary/10/50 border-blue-200",
                    isSelected && "bg-primary/10 border-blue-300"
                  )}
                  onClick={() => onMessageClick(message.id)}
                >
                  {/* Checkbox */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectMessage(message.id)}
                    />
                  </div>

                  {/* Read/Unread Icon */}
                  <div className="pt-1">
                    {message.isRead || type === "sent" ? (
                      <MailOpen className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Mail className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={displayUser.avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-blue-700">
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
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(message.createdAt), "MMM d")}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
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
            <p className="text-sm text-muted-foreground">
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
