"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  GraduationCap,
  FileText,
  Mail,
  Megaphone,
  DollarSign,
  Calendar as CalendarIcon,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt: Date | null;
  link: string | null;
  createdAt: Date;
}

interface NotificationGroup {
  type: string;
  count: number;
  unreadCount: number;
  notifications: NotificationItem[];
}

interface NotificationListProps {
  notifications: NotificationItem[];
  groupedNotifications: NotificationGroup[];
  stats: {
    total: number;
    unread: number;
    byType: Record<string, { total: number; unread: number }>;
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onFilterChange?: (filters: {
    type?: string;
    isRead?: boolean;
    search?: string;
  }) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: (type?: string) => void;
}

export function NotificationList({
  notifications,
  groupedNotifications,
  stats,
  pagination,
  onPageChange,
  onFilterChange,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (onFilterChange) {
      onFilterChange({
        search: value,
        type: typeFilter === "all" ? undefined : typeFilter,
        isRead: readFilter === "all" ? undefined : readFilter === "read",
      });
    }
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    if (onFilterChange) {
      onFilterChange({
        search: searchQuery,
        type: value === "all" ? undefined : value,
        isRead: readFilter === "all" ? undefined : readFilter === "read",
      });
    }
  };

  const handleReadFilterChange = (value: string) => {
    setReadFilter(value);
    if (onFilterChange) {
      onFilterChange({
        search: searchQuery,
        type: typeFilter === "all" ? undefined : typeFilter,
        isRead: value === "all" ? undefined : value === "read",
      });
    }
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      const type = activeTab === "all" ? undefined : activeTab;
      onMarkAllAsRead(type);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ATTENDANCE":
        return <BookOpen className="h-5 w-5" />;
      case "GRADE":
        return <GraduationCap className="h-5 w-5" />;
      case "ASSIGNMENT":
        return <FileText className="h-5 w-5" />;
      case "MESSAGE":
        return <Mail className="h-5 w-5" />;
      case "ANNOUNCEMENT":
        return <Megaphone className="h-5 w-5" />;
      case "FEE":
        return <DollarSign className="h-5 w-5" />;
      case "EVENT":
        return <CalendarIcon className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "ATTENDANCE":
        return "text-blue-600 bg-blue-100";
      case "GRADE":
        return "text-green-600 bg-green-100";
      case "ASSIGNMENT":
        return "text-purple-600 bg-purple-100";
      case "MESSAGE":
        return "text-orange-600 bg-orange-100";
      case "ANNOUNCEMENT":
        return "text-red-600 bg-red-100";
      case "FEE":
        return "text-yellow-600 bg-yellow-100";
      case "EVENT":
        return "text-pink-600 bg-pink-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatNotificationType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  const displayNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(n => n.type === activeTab);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Notifications
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-md text-blue-600">
                <BellOff className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unread
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.unread}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-md text-green-600">
                <CheckCheck className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Read
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total - stats.unread}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All caught up
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg">Notifications</CardTitle>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={readFilter} onValueChange={handleReadFilterChange}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mark All as Read Button */}
          {stats.unread > 0 && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All as Read
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Tabs for Notification Types */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="all" className="text-xs">
                All
                {stats.unread > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {stats.unread}
                  </Badge>
                )}
              </TabsTrigger>
              {Object.entries(stats.byType).map(([type, counts]) => (
                <TabsTrigger key={type} value={type} className="text-xs">
                  {formatNotificationType(type)}
                  {counts.unread > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      {counts.unread}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab}>
              {/* Notification List */}
              {displayNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-6 mb-4">
                    <Bell className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    You're all caught up! No new notifications at this time.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {displayNotifications.map((notification) => {
                  const NotificationContent = (
                    <div
                      className={cn(
                        "p-4 hover:bg-accent transition-colors",
                        !notification.isRead && "bg-blue-50/50",
                        notification.link && "cursor-pointer"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            getNotificationColor(notification.type)
                          )}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={cn(
                              "text-sm font-semibold",
                              !notification.isRead && "text-foreground"
                            )}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2">
                            {!notification.isRead && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                Unread
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {formatNotificationType(notification.type)}
                            </Badge>
                            {!notification.isRead && onMarkAsRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onMarkAsRead(notification.id);
                                }}
                                className="h-6 text-xs"
                              >
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                    return notification.link ? (
                      <Link key={notification.id} href={notification.link}>
                        {NotificationContent}
                      </Link>
                    ) : (
                      <div key={notification.id}>
                        {NotificationContent}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} notifications
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
    </div>
  );
}
