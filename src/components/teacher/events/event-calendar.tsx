'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EventCard } from './event-card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  category: string | null;
  status: string;
  userRSVP: string | null;
}

interface EventCalendarProps {
  events: Event[];
  month: number;
  year: number;
}

export function EventCalendar({ events, month, year }: EventCalendarProps) {
  const router = useRouter();
  const currentDate = new Date(year, month, 1);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.startDate), day)
    );
  };

  // Navigate to previous month
  const handlePreviousMonth = () => {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    router.push(`/teacher/events?month=${prevMonth}&year=${prevYear}`);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    router.push(`/teacher/events?month=${nextMonth}&year=${nextYear}`);
  };

  // Get day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Calculate starting day of week for the month
  const startingDayOfWeek = monthStart.getDay();
  
  // Create array of empty cells for days before month starts
  const emptyDays = Array(startingDayOfWeek).fill(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {/* Day names header */}
            {dayNames.map(day => (
              <div key={day} className="text-center font-medium text-sm text-muted-foreground p-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells before month starts */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="p-2 min-h-[80px]" />
            ))}
            
            {/* Days of the month */}
            {daysInMonth.map(day => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 min-h-[80px] border rounded-lg ${
                    isToday ? 'bg-primary/5 border-primary' : 'border-border'
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isToday ? 'text-primary' : 'text-foreground'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 truncate"
                        onClick={() => router.push(`/teacher/events/${event.id}`)}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* List view of events */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Events this month</h2>
        {events.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No events scheduled for this month
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
