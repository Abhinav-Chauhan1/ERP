"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'event' | 'meeting';
}

interface CalendarWidgetProps {
  events: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
}

export function CalendarWidget({ events, onEventClick }: CalendarWidgetProps) {
  const [currentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getDayEvents = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentMonth && 
             eventDate.getFullYear() === currentYear;
    });
  };

  const getEventIndicatorColor = (type: string) => {
    switch (type) {
      case "event":
        return "bg-primary";
      case "meeting":
        return "bg-purple-600 dark:bg-purple-500";
      default:
        return "bg-muted-foreground";
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 px-2 py-1"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getDayEvents(day);
      const isToday = isCurrentMonth && today.getDate() === day;
      
      days.push(
        <div 
          key={`day-${day}`} 
          className="h-9 px-2 py-1 text-center relative"
        >
          <div 
            className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center mx-auto text-sm",
              isToday 
                ? "bg-primary text-primary-foreground font-semibold" 
                : "hover:bg-accent cursor-pointer"
            )}
          >
            {day}
          </div>
          {dayEvents.length > 0 && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-0.5">
              {dayEvents.slice(0, 3).map((event, i) => (
                <div 
                  key={i} 
                  className={cn("h-1 w-1 rounded-full", getEventIndicatorColor(event.type))} 
                  title={event.title}
                />
              ))}
              {dayEvents.length > 3 && (
                <div className="h-1 w-1 rounded-full bg-muted-foreground" title={`${dayEvents.length - 3} more`} />
              )}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const upcomingEvents = events
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          Calendar
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => navigateMonth("prev")}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="text-sm font-medium min-w-[120px] text-center" aria-live="polite">
            {monthNames[currentMonth]} {currentYear}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => navigateMonth("next")}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar Grid */}
        <div>
          <div className="grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground mb-2 text-center" role="row">
            <div role="columnheader" aria-label="Sunday">Su</div>
            <div role="columnheader" aria-label="Monday">Mo</div>
            <div role="columnheader" aria-label="Tuesday">Tu</div>
            <div role="columnheader" aria-label="Wednesday">We</div>
            <div role="columnheader" aria-label="Thursday">Th</div>
            <div role="columnheader" aria-label="Friday">Fr</div>
            <div role="columnheader" aria-label="Saturday">Sa</div>
          </div>
          <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Calendar days">
            {renderCalendarDays()}
          </div>
        </div>
        
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Upcoming</h4>
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg transition-colors",
                    onEventClick && "hover:bg-accent cursor-pointer"
                  )}
                  onClick={() => onEventClick?.(event.id)}
                >
                  <div className={cn(
                    "h-2 w-2 mt-1.5 rounded-full flex-shrink-0",
                    getEventIndicatorColor(event.type)
                  )}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingEvents.length === 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center py-4">
              No upcoming events or meetings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
