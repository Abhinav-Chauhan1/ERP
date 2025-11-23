"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Settings, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/actions/notificationActions";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt: Date | null;
  link: string | null;
  createdAt: Date;
}

interface GroupedNotifications {
  [key: string]: Notification[];
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await getUserNotifications();
      if (result.success && result.data) {
        setNotifications(result.data);
      } else {
        toast.error(result.error || "Failed to load notifications");
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, isRead: true, readAt: new Date() }
              : n
          )
        );
      } else {
        toast.error(result.error || "Failed to mark as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead();
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
        );
        toast.success("All notifications marked as read");
      } else {
        toast.error(result.error || "Failed to mark all as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const result = await deleteNotification(notificationId);
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast.success("Notification deleted");
      } else {
        toast.error(result.error || "Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      setOpen(false);
    }
  };

  // Group notifications by date
  const groupNotificationsByDate = (
    notifications: Notification[]
  ): GroupedNotifications => {
    const groups: GroupedNotifications = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      "This Month": [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    notifications.forEach((notification) => {
      const notificationDate = new Date(notification.createdAt);
      const notificationDay = new Date(
        notificationDate.getFullYear(),
        notificationDate.getMonth(),
        notificationDate.getDate()
      );

      if (notificationDay.getTime() === today.getTime()) {
        groups.Today.push(notification);
      } else if (notificationDay.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(notification);
      } else if (notificationDate >= weekAgo) {
        groups["This Week"].push(notification);
      } else if (notificationDate >= monthAgo) {
        groups["This Month"].push(notification);
      } else {
        groups.Older.push(notification);
      }
    });

    return groups;
  };

  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications.filter((n) => n.isRead);

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "INFO":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "WARNING":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
      case "ALERT":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "SUCCESS":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={`Notifications${
            unreadCount > 0 ? `, ${unreadCount} unread` : ""
          }`}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "No new notifications"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-8 text-xs"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
            <Link href="/admin/settings/notifications">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Notification settings</span>
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read" className="flex-1">
              Read
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">
                    Loading notifications...
                  </div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "unread"
                      ? "No unread notifications"
                      : activeTab === "read"
                      ? "No read notifications"
                      : "No notifications yet"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {Object.entries(groupedNotifications).map(
                    ([group, groupNotifications]) =>
                      groupNotifications.length > 0 && (
                        <div key={group}>
                          <div className="bg-muted px-4 py-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              {group}
                            </p>
                          </div>
                          {groupNotifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`group relative flex gap-3 p-4 transition-colors hover:bg-accent ${
                                !notification.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                              }`}
                            >
                              <div className="flex-1 space-y-1">
                                {notification.link ? (
                                  <Link
                                    href={notification.link}
                                    onClick={() =>
                                      handleNotificationClick(notification)
                                    }
                                    className="block"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <p
                                          className={`text-sm font-medium ${
                                            !notification.isRead
                                              ? "font-semibold"
                                              : ""
                                          }`}
                                        >
                                          {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {notification.message}
                                        </p>
                                      </div>
                                      {!notification.isRead && (
                                        <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                                      )}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                      <Badge
                                        variant="secondary"
                                        className={`text-xs ${getTypeColor(
                                          notification.type
                                        )}`}
                                      >
                                        {notification.type}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(
                                          new Date(notification.createdAt),
                                          { addSuffix: true }
                                        )}
                                      </span>
                                    </div>
                                  </Link>
                                ) : (
                                  <div
                                    onClick={() =>
                                      handleNotificationClick(notification)
                                    }
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <p
                                          className={`text-sm font-medium ${
                                            !notification.isRead
                                              ? "font-semibold"
                                              : ""
                                          }`}
                                        >
                                          {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {notification.message}
                                        </p>
                                      </div>
                                      {!notification.isRead && (
                                        <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                                      )}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                      <Badge
                                        variant="secondary"
                                        className={`text-xs ${getTypeColor(
                                          notification.type
                                        )}`}
                                      >
                                        {notification.type}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(
                                          new Date(notification.createdAt),
                                          { addSuffix: true }
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification.id);
                                    }}
                                    title="Mark as read"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(notification.id);
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {filteredNotifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Link href="/admin/communication/notifications">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-sm"
                  onClick={() => setOpen(false)}
                >
                  View all notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
