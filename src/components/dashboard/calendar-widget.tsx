"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "exam" | "holiday" | "event" | "meeting";
}

interface CalendarWidgetProps {
  events: CalendarEvent[];
  className?: string;
}

export function CalendarWidget({ events, className }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
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
      case "exam":
        return "bg-red-500";
      case "holiday":
        return "bg-green-500";
      case "event":
        return "bg-blue-500";
      case "meeting":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
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
      const events = getDayEvents(day);
      const isToday = isCurrentMonth && today.getDate() === day;
      
      days.push(
        <div 
          key={`day-${day}`} 
          className="h-9 px-2 py-1 text-center relative"
        >
          <div 
            className={`h-7 w-7 rounded-full flex items-center justify-center mx-auto ${
              isToday 
                ? "bg-blue-600 text-white" 
                : "hover:bg-gray-100 cursor-pointer"
            }`}
          >
            {day}
          </div>
          {events.length > 0 && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-0.5 mt-0.5">
              {events.slice(0, 3).map((event, i) => (
                <div 
                  key={i} 
                  className={`h-1 w-1 rounded-full ${getEventIndicatorColor(event.type)}`} 
                  title={event.title}
                />
              ))}
              {events.length > 3 && (
                <div className="h-1 w-1 rounded-full bg-gray-500" title={`${events.length - 3} more events`} />
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
    .slice(0, 3);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-base font-medium">Calendar</CardTitle>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 p-0" 
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            {monthNames[currentMonth]} {currentYear}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 p-0"
            onClick={() => navigateMonth("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-xs font-medium text-gray-500 mb-1 text-center">
          <div>Su</div>
          <div>Mo</div>
          <div>Tu</div>
          <div>We</div>
          <div>Th</div>
          <div>Fr</div>
          <div>Sa</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
        
        {upcomingEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Upcoming Events</h4>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-2">
                  <div className={`h-2 w-2 mt-1.5 rounded-full ${getEventIndicatorColor(event.type)}`}></div>
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-gray-500">
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
      </CardContent>
    </Card>
  );
}
