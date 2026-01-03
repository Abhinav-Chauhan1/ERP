"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { CalendarEvent, CalendarEventCategory } from "@prisma/client";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";

interface CalendarEventWithCategory extends CalendarEvent {
  category: CalendarEventCategory;
}

interface CalendarWidgetProps {
  events: CalendarEventWithCategory[];
  userRole: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
  className?: string;
  maxEvents?: number;
}

/**
 * CalendarWidget Component
 * 
 * Displays upcoming calendar events in a compact widget format.
 * Clickable to navigate to the full calendar page.
 * 
 * Requirements: 3.4 - Chronological event sorting
 */
export function CalendarWidget({ 
  events, 
  userRole, 
  className,
  maxEvents = 5 
}: CalendarWidgetProps) {
  // Get calendar route based on user role
  const calendarRoute = `/${userRole.toLowerCase()}/calendar`;
  
  // Sort events chronologically and filter to upcoming events only
  const upcomingEvents = events
    .filter(event => new Date(event.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, maxEvents);

  /**
   * Get a human-readable date label for the event
   */
  const getDateLabel = (date: Date): string => {
    if (isToday(date)) {
      return "Today";
    }
    if (isTomorrow(date)) {
      return "Tomorrow";
    }
    if (isThisWeek(date)) {
      return format(date, "EEEE"); // Day name
    }
    return format(date, "MMM d"); // Month and day
  };

  /**
   * Get time label for the event
   */
  const getTimeLabel = (event: CalendarEventWithCategory): string => {
    if (event.isAllDay) {
      return "All day";
    }
    return format(new Date(event.startDate), "h:mm a");
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
          Upcoming Events
        </CardTitle>
        <Link href={calendarRoute}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs"
            aria-label="View full calendar"
          >
            View All
            <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
          </Button>
        </Link>
      </CardHeader>
      
      <CardContent className="flex-1">
        {upcomingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-3" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              No upcoming events
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Check back later for new events
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={calendarRoute}
                className="block group"
              >
                <div 
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors",
                    "hover:bg-accent cursor-pointer border border-transparent hover:border-border"
                  )}
                >
                  {/* Category color indicator */}
                  <div 
                    className="h-2 w-2 mt-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.category.color }}
                    aria-hidden="true"
                  />
                  
                  {/* Event details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {event.title}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">
                        {getDateLabel(new Date(event.startDate))}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {getTimeLabel(event)}
                      </span>
                    </div>
                    
                    {event.location && (
                      <p className="text-xs text-muted-foreground truncate">
                        📍 {event.location}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: `${event.category.color}20`,
                          color: event.category.color
                        }}
                      >
                        {event.category.name}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
      
      {upcomingEvents.length > 0 && (
        <CardFooter className="pt-0">
          <Link href={calendarRoute} className="w-full">
            <Button 
              variant="outline" 
              className="w-full"
              size="sm"
            >
              <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
              Open Full Calendar
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
