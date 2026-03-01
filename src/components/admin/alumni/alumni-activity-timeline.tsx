"use client";

/**
 * Alumni Activity Timeline Component
 * 
 * Displays a timeline of updates and interactions with the alumni profile.
 * Includes filtering by activity type and chronological display.
 * 
 * Requirements: 5.6
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock,
  Edit,
  Mail,
  Phone,
  FileText,
  User,
  Award,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Filter
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export type ActivityType = 
  | "PROFILE_CREATED"
  | "PROFILE_UPDATED"
  | "CONTACT_UPDATED"
  | "EMPLOYMENT_UPDATED"
  | "EDUCATION_UPDATED"
  | "ACHIEVEMENT_ADDED"
  | "COMMUNICATION_SENT"
  | "COMMUNICATION_PREFERENCE_UPDATED"
  | "NOTE_ADDED";

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  timestamp: Date;
  description: string;
  performedBy?: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: Record<string, any>;
}

interface AlumniActivityTimelineProps {
  activities: ActivityRecord[];
  showFilter?: boolean;
}

export function AlumniActivityTimeline({
  activities,
  showFilter = true,
}: AlumniActivityTimelineProps) {
  const [filterType, setFilterType] = useState<ActivityType | "ALL">("ALL");

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "PROFILE_CREATED":
        return <User className="h-4 w-4" />;
      case "PROFILE_UPDATED":
        return <Edit className="h-4 w-4" />;
      case "CONTACT_UPDATED":
        return <Phone className="h-4 w-4" />;
      case "EMPLOYMENT_UPDATED":
        return <Briefcase className="h-4 w-4" />;
      case "EDUCATION_UPDATED":
        return <GraduationCap className="h-4 w-4" />;
      case "ACHIEVEMENT_ADDED":
        return <Award className="h-4 w-4" />;
      case "COMMUNICATION_SENT":
        return <Mail className="h-4 w-4" />;
      case "COMMUNICATION_PREFERENCE_UPDATED":
        return <MessageSquare className="h-4 w-4" />;
      case "NOTE_ADDED":
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case "PROFILE_CREATED":
        return "bg-green-500";
      case "PROFILE_UPDATED":
      case "CONTACT_UPDATED":
      case "EMPLOYMENT_UPDATED":
      case "EDUCATION_UPDATED":
        return "bg-blue-500";
      case "ACHIEVEMENT_ADDED":
        return "bg-yellow-500";
      case "COMMUNICATION_SENT":
      case "COMMUNICATION_PREFERENCE_UPDATED":
        return "bg-teal-500";
      case "NOTE_ADDED":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getActivityLabel = (type: ActivityType) => {
    switch (type) {
      case "PROFILE_CREATED":
        return "Profile Created";
      case "PROFILE_UPDATED":
        return "Profile Updated";
      case "CONTACT_UPDATED":
        return "Contact Updated";
      case "EMPLOYMENT_UPDATED":
        return "Employment Updated";
      case "EDUCATION_UPDATED":
        return "Education Updated";
      case "ACHIEVEMENT_ADDED":
        return "Achievement Added";
      case "COMMUNICATION_SENT":
        return "Communication Sent";
      case "COMMUNICATION_PREFERENCE_UPDATED":
        return "Preferences Updated";
      case "NOTE_ADDED":
        return "Note Added";
      default:
        return type;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes} minutes ago`;
      }
      return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return formatDate(date);
    }
  };

  const filteredActivities = filterType === "ALL"
    ? activities
    : activities.filter((activity) => activity.type === filterType);

  const activityTypes: Array<{ value: ActivityType | "ALL"; label: string }> = [
    { value: "ALL", label: "All Activities" },
    { value: "PROFILE_UPDATED", label: "Profile Updates" },
    { value: "CONTACT_UPDATED", label: "Contact Updates" },
    { value: "EMPLOYMENT_UPDATED", label: "Employment Updates" },
    { value: "EDUCATION_UPDATED", label: "Education Updates" },
    { value: "ACHIEVEMENT_ADDED", label: "Achievements" },
    { value: "COMMUNICATION_SENT", label: "Communications" },
    { value: "COMMUNICATION_PREFERENCE_UPDATED", label: "Preference Changes" },
    { value: "NOTE_ADDED", label: "Notes" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Activity Timeline</CardTitle>
          </div>
          {showFilter && (
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as ActivityType | "ALL")}
            >
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter activities" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <CardDescription>
          History of updates and interactions with this alumni profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No activities found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {filterType === "ALL"
                ? "No activities have been recorded yet"
                : "No activities of this type have been recorded"}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[21px] top-0 bottom-0 w-0.5 bg-border" />

            {/* Activity Items */}
            <div className="space-y-6">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id} className="relative flex gap-4">
                  {/* Timeline Dot */}
                  <div
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${getActivityColor(
                      activity.type
                    )} text-white flex-shrink-0`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 space-y-2 pb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {getActivityLabel(activity.type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{activity.description}</p>
                        {activity.performedBy && (
                          <p className="text-xs text-muted-foreground">
                            by {activity.performedBy.name} ({activity.performedBy.role})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata Display */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-md">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Details:
                        </p>
                        <div className="space-y-1">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-2 text-xs">
                              <span className="font-medium text-muted-foreground">
                                {key.replace(/([A-Z])/g, " $1").trim()}:
                              </span>
                              <span className="text-foreground">
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show More Button (if needed) */}
        {filteredActivities.length > 10 && (
          <div className="mt-6 text-center">
            <Button variant="outline" size="sm">
              Load More Activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
