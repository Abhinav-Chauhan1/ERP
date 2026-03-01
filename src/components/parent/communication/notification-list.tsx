"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  X,
  Eye,
  Calendar,
  DollarSign,
  GraduationCap,
  Mail,
  Megaphone,
  Users,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface NotificationItem {
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
  notifications: NotificationItem[];
}

interface NotificationListProps {
  groupedNotifications: GroupedNotifications[];
  stats: {
    total: number;
    unread: number;
    byType: Record<string, { total: number; unread: number }>;
  };
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: (type?: string) => void;
  onDismiss?: (notificationId: string) => void;
  onViewDetails?: (link: string) => void;
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  ATTENDANCE: Calendar,
  FEE: DollarSign,
  GRADE: GraduationCap,
  MESSAGE: Mail,
  ANNOUNCEMENT: Megaphone,
  MEETING: Users,
  EVENT: Calendar,
  GENERAL: Bell,
  RECEIPT_VERIFIED: CheckCheck,
  RECEIPT_REJECTED: AlertCircle,
};

const NOTIFICATION_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  ATTENDANCE: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-600" },
  FEE: { bg: "bg-green-50", text: "text-green-700", icon: "text-green-600" },
  GRADE: { bg: "bg-teal-50", text: "text-teal-700", icon: "text-teal-600" },
  MESSAGE: { bg: "bg-orange-50", text: "text-orange-700", icon: "text-orange-600" },
  ANNOUNCEMENT: { bg: "bg-yellow-50", text: "text-yellow-700", icon: "text-yellow-600" },
  MEETING: { bg: "bg-pink-50", text: "text-pink-700", icon: "text-pink-600" },
  EVENT: { bg: "bg-indigo-50", text: "text-indigo-700", icon: "text-indigo-600" },
  GENERAL: { bg: "bg-gray-50", text: "text-gray-700", icon: "text-gray-600" },
  RECEIPT_VERIFIED: { bg: "bg-green-50", text: "text-green-700", icon: "text-green-600" },
  RECEIPT_REJECTED: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-600" },
};

export function NotificationList({
  groupedNotifications,
  stats,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onViewDetails,
}: NotificationListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groupedNotifications.map((g) => g.type))
  );

  const toggleGroup = (type: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedGroups(newExpanded);
  };

  const getNotificationIcon = (type: string) => {
    const Icon = NOTIFICATION_ICONS[type] || Bell;
    const colors = NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.GENERAL;
    return <Icon className={cn("h-5 w-5", colors.icon)} />;
  };

  const getTypeLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } else if (diffInHours < 168) {
      // Less than a week
      return format(new Date(date), "EEEE 'at' h:mm a");
    } else {
      return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Notifications</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {stats.unread > 0 ? (
                <>
                  <span className="font-semibold text-blue-600">{stats.unread}</span> unread
                  {" "}of {stats.total} total
                </>
              ) : (
                <>All caught up! No unread notifications</>
              )}
            </p>
          </div>

          {stats.unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkAllAsRead()}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {groupedNotifications.length === 0 ? (
          <div className="text-center py-12">
            <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedNotifications.map((group) => {
              const isExpanded = expandedGroups.has(group.type);
              const colors = NOTIFICATION_COLORS[group.type] || NOTIFICATION_COLORS.GENERAL;

              return (
                <Collapsible
                  key={group.type}
                  open={isExpanded}
                  onOpenChange={() => toggleGroup(group.type)}
                >
                  <Card className="border-2">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", colors.bg)}>
                              {getNotificationIcon(group.type)}
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {getTypeLabel(group.type)}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {group.count} notification{group.count !== 1 ? "s" : ""}
                                {group.unreadCount > 0 && (
                                  <span className="ml-2 text-blue-600 font-medium">
                                    ({group.unreadCount} unread)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {group.unreadCount > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkAllAsRead(group.type);
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        <div className="space-y-2">
                          {group.notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                                !notification.isRead && "bg-blue-50/50 border-blue-200",
                                notification.isRead && "hover:bg-gray-50"
                              )}
                            >
                              {/* Read/Unread Indicator */}
                              <div className="pt-1">
                                {!notification.isRead && (
                                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                                )}
                              </div>

                              {/* Notification Content */}
                              <div className="flex-1 min-w-0">
                                <h4
                                  className={cn(
                                    "text-sm font-medium mb-1",
                                    !notification.isRead && "text-blue-900"
                                  )}
                                >
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-gray-700 mb-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatTimestamp(notification.createdAt)}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {notification.link && onViewDetails && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onViewDetails(notification.link!)}
                                    title="View details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}

                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onMarkAsRead(notification.id)}
                                    title="Mark as read"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}

                                {onDismiss && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDismiss(notification.id)}
                                    title="Dismiss"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
