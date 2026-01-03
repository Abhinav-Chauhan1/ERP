"use client";

/**
 * Student Calendar Widget Section
 * 
 * Client component that fetches calendar events for student dashboard
 * Requirements: 3.1, 3.4
 */

import { useEffect, useState } from "react";
import { CalendarWidget } from "@/components/calendar/calendar-widget";
import { CalendarEvent, CalendarEventCategory } from "@prisma/client";

interface CalendarEventWithCategory extends CalendarEvent {
  category: CalendarEventCategory;
}

export function StudentCalendarWidgetSection() {
  const [events, setEvents] = useState<CalendarEventWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/calendar/student-events?limit=5");
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (error) {
        console.error("Error fetching calendar events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-6 border rounded-lg">
        <div className="h-4 bg-muted rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return <CalendarWidget events={events} userRole="STUDENT" />;
}
