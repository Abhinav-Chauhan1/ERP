"use client";


import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Settings, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationList } from "@/components/parent/communication/notification-list";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/actions/parent-communication-actions";
import { toast } from "react-hot-toast";

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

interface GroupedNotifications {
  type: string;
  count: number;
  unreadCount: number;
  notifications: NotificationData[];
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<GroupedNotifications[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    byType: {} as Record<string, { total: number; unread: number }>,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  });

  // Load notifications
  const loadNotifications = useCallback(async (
    page: number = 1,
    type?: string
  ) => {
    setIsLoading(true);
    try {
      const filters: any = {
        page,
        limit: pagination.limit,
      };

      if (type && type !== "all") {
        filters.type = type;
      }

      const result = await getNotifications(filters);

      if (result.success && result.data) {
        setNotifications(result.data.notifications as NotificationData[]);
        setGroupedNotifications(result.data.groupedNotifications as GroupedNotifications[]);
        setStats(result.data.stats);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message || "Failed to load notifications");
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("An error occurred while loading notifications");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    loadNotifications(1, typeFilter);
  }, [typeFilter, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead({ notificationId });
      if (result.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );

        // Update grouped notifications
        setGroupedNotifications((prev) =>
          prev.map((group) => ({
            ...group,
            unreadCount: group.notifications.filter(
              (n) => n.id === notificationId ? false : !n.isRead
            ).length,
            notifications: group.notifications.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
          }))
        );

        // Update stats
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
        }));

        toast.success("Notification marked as read");
      } else {
        toast.error(result.message || "Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("An error occurred");
    }
  };

  const handleMarkAllAsRead = async (type?: string) => {
    try {
      const result = await markAllNotificationsAsRead(type ? { type: type as "EVENT" | "GENERAL" | "ATTENDANCE" | "FEE" | "GRADE" | "MESSAGE" | "ANNOUNCEMENT" | "MEETING" } : undefined);
      if (result.success) {
        toast.success(result.message || "All notifications marked as read");
        // Reload notifications
        loadNotifications(pagination.page, typeFilter);
      } else {
        toast.error(result.message || "Failed to mark notifications as read");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("An error occurred");
    }
  };

  const handleViewDetails = (link: string) => {
    if (link) {
      router.push(link);
    }
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleNavigateToSettings = () => {
    router.push("/parent/settings");
  };

  return (
    <div className="h-full p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-gray-600 mt-1">
              Stay informed about important updates
            </p>
          </div>
          <Button variant="outline" onClick={handleNavigateToSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ATTENDANCE">Attendance</SelectItem>
                <SelectItem value="FEE">Fees</SelectItem>
                <SelectItem value="GRADE">Grades</SelectItem>
                <SelectItem value="MESSAGE">Messages</SelectItem>
                <SelectItem value="ANNOUNCEMENT">Announcements</SelectItem>
                <SelectItem value="MEETING">Meetings</SelectItem>
                <SelectItem value="EVENT">Events</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
              </SelectContent>
            </Select>

            {typeFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTypeFilter("all")}
              >
                Clear filter
              </Button>
            )}
          </div>

          {stats.unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarkAllAsRead()}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Clear All ({stats.unread})
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <NotificationList
            groupedNotifications={groupedNotifications}
            stats={stats}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onViewDetails={handleViewDetails}
          />
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
              {pagination.totalCount} notifications
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
                  loadNotifications(pagination.page - 1, typeFilter);
                }}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
                  loadNotifications(pagination.page + 1, typeFilter);
                }}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

