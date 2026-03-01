"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  MessageSquare, 
  CheckCircle,
  AlertCircle,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  childName: string;
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'assignment':
      return BookOpen;
    case 'exam':
      return FileText;
    case 'announcement':
      return Bell;
    case 'meeting':
      return Calendar;
    case 'message':
      return MessageSquare;
    case 'attendance':
      return CheckCircle;
    case 'alert':
      return AlertCircle;
    default:
      return Bell;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'assignment':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500';
    case 'exam':
      return 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-500';
    case 'announcement':
      return 'bg-primary/10 text-primary';
    case 'meeting':
      return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500';
    case 'message':
      return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-500';
    case 'attendance':
      return 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-500';
    case 'alert':
      return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  const [displayCount, setDisplayCount] = useState(5);

  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const displayedActivities = sortedActivities.slice(0, displayCount);
  const hasMore = sortedActivities.length > displayCount;

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + 5, sortedActivities.length));
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activities to display
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Timeline */}
          <div className="relative space-y-4">
            {displayedActivities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const isLast = index === displayedActivities.length - 1;

              return (
                <div key={activity.id} className="relative flex gap-3">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                  )}

                  {/* Icon */}
                  <div className={cn(
                    "relative z-10 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                    getActivityColor(activity.type)
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-0.5 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.childName}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {activity.description}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                className="w-full"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
