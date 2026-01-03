"use client";

import { CalendarEvent, CalendarEventCategory } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: CalendarEvent & {
    category: CalendarEventCategory;
  };
  onClick?: () => void;
  className?: string;
}

/**
 * EventCard Component
 * 
 * Displays a summary of a calendar event with category color coding.
 * Used in calendar views and event lists.
 * 
 * Accessibility features:
 * - Minimum 44x44px touch target size
 * - Keyboard navigation support
 * - ARIA labels for screen readers
 * - High contrast mode support
 * 
 * Requirements: 2.4, 8.2
 */
export function EventCard({ event, onClick, className }: EventCardProps) {
  const hasAttachments = event.attachments && event.attachments.length > 0;
  
  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        "border-l-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      style={{
        borderLeftColor: event.category.color,
        minHeight: "44px", // Minimum touch target size for accessibility
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Event: ${event.title}, ${event.category.name}, ${format(
        event.startDate,
        "EEEE, MMMM d, yyyy"
      )}${!event.isAllDay ? ` at ${format(event.startDate, "p")}` : ", all day event"}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-2 flex-1">
            {event.title}
          </h3>
          <Badge
            variant="secondary"
            className="text-xs shrink-0"
            style={{
              backgroundColor: `${event.category.color}20`,
              color: event.category.color,
              borderColor: event.category.color,
            }}
            aria-label={`Category: ${event.category.name}`}
          >
            {event.category.name}
          </Badge>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <span>{format(event.startDate, "PPP")}</span>
          </div>

          {!event.isAllDay && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span>
                {format(event.startDate, "p")} - {format(event.endDate, "p")}
              </span>
            </div>
          )}

          {event.isAllDay && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span>All day event</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          {hasAttachments && (
            <div className="flex items-center gap-1.5">
              <Paperclip className="h-3 w-3" aria-hidden="true" />
              <span>
                {event.attachments.length}{" "}
                {event.attachments.length === 1 ? "attachment" : "attachments"}
              </span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
            {event.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
