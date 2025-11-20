"use client";

import { useState, useEffect } from "react";
import { NotificationList } from "@/components/student/communication";
import { 
  getNotifications, 
  markAsRead, 
  markAllNotificationsAsRead 
} from "@/lib/actions/student-communication-actions";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    byType: {},
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async (page: number = 1, newFilters: any = {}) => {
    setLoading(true);
    try {
      const result = await getNotifications({
        page,
        limit: 50,
        ...newFilters,
      });

      if (result.success && result.data) {
        setNotifications(result.data.notifications);
        setGroupedNotifications(result.data.groupedNotifications);
        setStats(result.data.stats);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message || "Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications(1, filters);
  }, []);

  const handlePageChange = (page: number) => {
    fetchNotifications(page, filters);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    fetchNotifications(1, newFilters);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markAsRead({ id: notificationId, type: "notification" });

      if (result.success) {
        toast.success("Notification marked as read");
        // Refresh notifications
        fetchNotifications(pagination.page, filters);
      } else {
        toast.error(result.message || "Failed to mark as read");
      }
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async (type?: string) => {
    try {
      const result = await markAllNotificationsAsRead(type);

      if (result.success) {
        toast.success(result.message || "All notifications marked as read");
        // Refresh notifications
        fetchNotifications(pagination.page, filters);
      } else {
        toast.error(result.message || "Failed to mark all as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : (
        <NotificationList
          notifications={notifications}
          groupedNotifications={groupedNotifications}
          stats={stats}
          pagination={pagination}
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      )}
    </div>
  );
}
