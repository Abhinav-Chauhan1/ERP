import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Building2,
  CreditCard,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface RecentActivityProps {
  activities: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userName: string;
    userEmail: string;
    createdAt: Date;
    metadata?: any;
  }>;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getActivityIcon = (action: string, entityType: string) => {
  if (action.includes("CREATE") || action.includes("ADD")) {
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  }
  if (action.includes("DELETE") || action.includes("REMOVE")) {
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  }
  if (action.includes("UPDATE") || action.includes("MODIFY")) {
    return <Settings className="h-4 w-4 text-blue-600" />;
  }
  if (entityType === "SCHOOL") {
    return <Building2 className="h-4 w-4 text-teal-600" />;
  }
  if (entityType === "USER") {
    return <User className="h-4 w-4 text-indigo-600" />;
  }
  if (entityType === "SUBSCRIPTION" || entityType === "PAYMENT") {
    return <CreditCard className="h-4 w-4 text-emerald-600" />;
  }
  return <Shield className="h-4 w-4 text-slate-600" />;
};

const getActivityColor = (action: string) => {
  if (action.includes("CREATE") || action.includes("ADD")) {
    return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
  }
  if (action.includes("DELETE") || action.includes("REMOVE")) {
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
  }
  if (action.includes("UPDATE") || action.includes("MODIFY")) {
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
  }
  return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800";
};

const formatActionText = (action: string, entityType: string, metadata?: any) => {
  const actionMap: Record<string, string> = {
    "CREATE_SCHOOL": "created a new school",
    "UPDATE_SCHOOL_STATUS": "updated school status",
    "DELETE_SCHOOL": "deleted a school",
    "BULK_UPDATE_SCHOOL_STATUS": "bulk updated school status",
    "BULK_DELETE_SCHOOLS": "bulk deleted schools",
    "CREATE_USER": "created a new user",
    "UPDATE_USER": "updated user details",
    "DELETE_USER": "deleted a user",
    "CREATE_SUBSCRIPTION": "created a subscription",
    "UPDATE_SUBSCRIPTION": "updated subscription",
    "CANCEL_SUBSCRIPTION": "cancelled subscription",
    "LOGIN": "logged in",
    "LOGOUT": "logged out",
    "SYSTEM_CONFIG_UPDATE": "updated system configuration",
  };

  let baseText = actionMap[action] || action.toLowerCase().replace(/_/g, " ");

  if (metadata) {
    if (action === "UPDATE_SCHOOL_STATUS" && metadata.newStatus) {
      baseText += ` to ${metadata.newStatus}`;
    }
    if (action === "BULK_UPDATE_SCHOOL_STATUS" && metadata.schoolCount) {
      baseText += ` for ${metadata.schoolCount} schools`;
    }
    if (action === "BULK_DELETE_SCHOOLS" && metadata.schoolCount) {
      baseText += ` (${metadata.schoolCount} schools)`;
    }
  }

  return baseText;
};

export function RecentActivity({ activities }: RecentActivityProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Clock className="h-5 w-5 mr-2" />
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start space-x-4 p-4 rounded-lg bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))]"
        >
          <div className="flex-shrink-0 p-2 rounded-full bg-[hsl(var(--muted))]">
            {getActivityIcon(activity.action, activity.entityType)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(activity.userName || "System")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {activity.userName || "System"}
                </span>
              </div>
              <Badge variant="outline" className={getActivityColor(activity.action)}>
                {activity.entityType}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              {formatActionText(activity.action, activity.entityType, activity.metadata)}
            </p>

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </span>
              {activity.entityId && (
                <span className="text-xs font-mono text-muted-foreground">
                  ID: {activity.entityId.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}