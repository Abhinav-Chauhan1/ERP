"use client";

import { CalendarEvent, CalendarEventCategory } from "@prisma/client";
import { EventCard } from "./event-card";
import { format, isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface EventListProps {
  events: (CalendarEvent & {
    category: CalendarEventCategory;
  })[];
  onEventClick: (event: CalendarEvent) => void;
  groupBy?: "date" | "category";
  className?: string;
}

/**
 * EventList Component (Agenda View)
 * 
 * Displays events in a chronological list format.
 * Supports grouping by date or category.
 * 
 * Requirements: 3.4
 */
export function EventList({
  events,
  onEventClick,
  groupBy = "date",
  className,
}: EventListProps) {
  if (events.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 text-center",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <p className="text-muted-foreground">No events found</p>
      </div>
    );
  }

  if (groupBy === "date") {
    // Group events by date
    const groupedByDate = events.reduce((acc, event) => {
      const dateKey = format(startOfDay(event.startDate), "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {} as Record<string, typeof events>);

    const sortedDates = Object.keys(groupedByDate).sort();

    return (
      <div className={cn("space-y-6", className)} role="list">
        {sortedDates.map((dateKey) => {
          const dateEvents = groupedByDate[dateKey];
          const date = new Date(dateKey);

          return (
            <div key={dateKey} role="listitem">
              <h3
                className="text-sm font-semibold mb-3 sticky top-0 bg-background py-2 z-10"
                id={`date-${dateKey}`}
              >
                {format(date, "EEEE, MMMM d, yyyy")}
              </h3>
              <div
                className="space-y-2"
                role="list"
                aria-labelledby={`date-${dateKey}`}
              >
                {dateEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick(event)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (groupBy === "category") {
    // Group events by category
    const groupedByCategory = events.reduce((acc, event) => {
      const categoryId = event.categoryId;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category: event.category,
          events: [],
        };
      }
      acc[categoryId].events.push(event);
      return acc;
    }, {} as Record<string, { category: CalendarEventCategory; events: typeof events }>);

    const sortedCategories = Object.values(groupedByCategory).sort((a, b) =>
      a.category.name.localeCompare(b.category.name)
    );

    return (
      <div className={cn("space-y-6", className)} role="list">
        {sortedCategories.map(({ category, events: categoryEvents }) => (
          <div key={category.id} role="listitem">
            <h3
              className="text-sm font-semibold mb-3 flex items-center gap-2"
              id={`category-${category.id}`}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
                aria-hidden="true"
              />
              {category.name}
            </h3>
            <div
              className="space-y-2"
              role="list"
              aria-labelledby={`category-${category.id}`}
            >
              {categoryEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick(event)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
