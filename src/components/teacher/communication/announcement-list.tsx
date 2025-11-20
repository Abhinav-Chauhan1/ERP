"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Paperclip,
  Calendar,
  Circle,
  Search,
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  attachments: string | null;
  createdAt: Date;
  publisher: {
    user: {
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  };
}

interface AnnouncementListProps {
  announcements: AnnouncementItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onFilterChange?: (filters: {
    isActive?: boolean;
    search?: string;
  }) => void;
  onDownloadAttachment?: (url: string, fileName: string) => void;
}

export function AnnouncementList({
  announcements,
  pagination,
  onPageChange,
  onFilterChange,
  onDownloadAttachment,
}: AnnouncementListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (onFilterChange) {
      onFilterChange({
        search: value,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      });
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (onFilterChange) {
      onFilterChange({
        search: searchQuery,
        isActive: value === "all" ? undefined : value === "active",
      });
    }
  };

  const parseAttachments = (attachments: string | null): Array<{ name: string; url: string }> => {
    if (!attachments) return [];
    try {
      const urls = JSON.parse(attachments);
      return urls.map((url: string) => ({
        name: url.split("/").pop() || "attachment",
        url,
      }));
    } catch {
      return [];
    }
  };

  const shouldTruncate = (content: string) => content.length > 200;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg">Announcements</CardTitle>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Announcement List */}
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No announcements found</p>
            </div>
          ) : (
            announcements.map((announcement) => {
              const isExpanded = expandedIds.has(announcement.id);
              const truncate = shouldTruncate(announcement.content);
              const displayContent = !isExpanded && truncate
                ? announcement.content.substring(0, 200) + "..."
                : announcement.content;
              const attachmentList = parseAttachments(announcement.attachments);

              return (
                <Card
                  key={announcement.id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    announcement.isActive && "border-l-4 border-l-primary"
                  )}
                >
                  <CardHeader className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {announcement.isActive && (
                            <Circle className="h-2 w-2 fill-primary text-primary" />
                          )}
                          <h3 className={cn(
                            "text-lg font-semibold",
                            announcement.isActive && "text-primary"
                          )}>
                            {announcement.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {announcement.isActive ? (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-gray-100">
                              Expired
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Expand/Collapse Button */}
                      {truncate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(announcement.id)}
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
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={announcement.publisher.user.avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(
                              announcement.publisher.user.firstName,
                              announcement.publisher.user.lastName
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {announcement.publisher.user.firstName} {announcement.publisher.user.lastName}
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
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                        {displayContent}
                      </p>
                    </div>

                    {/* Show More/Less Button for Long Content */}
                    {truncate && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleExpanded(announcement.id)}
                        className="px-0 h-auto font-medium"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </Button>
                    )}

                    {/* Attachments */}
                    {attachmentList.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <Separator />
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            Attachments ({attachmentList.length})
                          </h4>
                          <div className="space-y-2">
                            {attachmentList.map((attachment, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent transition-colors"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                                    <Paperclip className="h-4 w-4 text-primary" />
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
                                    <Download className="h-4 w-4" />
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
              {pagination.totalCount} announcements
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
