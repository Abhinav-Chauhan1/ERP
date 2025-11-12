"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { EventStatus } from "@prisma/client";

interface EventCalendarProps {
  events: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    type: string | null;
    status: EventStatus;
  }[];
  onEventClick: (eventId: string) => void;
}

export function EventCalendar({ events, onEventClick }: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get events for the selected date
  const eventsOnSelectedDate = selectedDate
    ? events.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        return (
          isSameDay(selectedDate, eventStart) ||
          isSameDay(selectedDate, eventEnd) ||
          (selectedDate >= eventStart && selectedDate <= eventEnd)
        );
      })
    : [];

  // Get dates that have events
  const eventDates = events.map(event => new Date(event.startDate));

  const getStatusColor = (status: EventStatus) => {
    const colors: Record<EventStatus, string> = {
      UPCOMING: "bg-blue-500",
      ONGOING: "bg-green-500",
      COMPLETED: "bg-gray-400",
      CANCELLED: "bg-red-500",
      POSTPONED: "bg-yellow-500",
    };
    return colors[status];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Event Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              hasEvent: eventDates,
            }}
            modifiersStyles={{
              hasEvent: {
                fontWeight: "bold",
                textDecoration: "underline",
              },
            }}
          />
          
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Upcoming</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Ongoing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events on Selected Date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventsOnSelectedDate.length > 0 ? (
            <div className="space-y-3">
              {eventsOnSelectedDate.map(event => (
                <div
                  key={event.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onEventClick(event.id)}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getStatusColor(event.status)}`}></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{event.title}</h4>
                      {event.type && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {event.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">
                    {format(new Date(event.startDate), "h:mm a")} - {format(new Date(event.endDate), "h:mm a")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No events on this date
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
