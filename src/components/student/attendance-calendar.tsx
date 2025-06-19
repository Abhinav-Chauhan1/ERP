"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWeekend } from "date-fns";
import { CheckCircle2, XCircle, Clock, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AttendanceData {
  date: string;
  status: string;
}

interface AttendanceCalendarProps {
  attendanceData: AttendanceData[];
}

export function AttendanceCalendar({ attendanceData }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Determine week rows
  const startDay = monthStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Get status icon for a date
  const getStatusIcon = (day: Date) => {
    if (!isSameMonth(day, currentMonth)) return null;
    
    const attendance = attendanceData.find(
      (record) => isSameDay(new Date(record.date), day)
    );
    
    if (!attendance) {
      // Return null for future dates, show a "no record" icon for past dates
      return day > new Date() ? null : (
        <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-xs">-</span>
        </div>
      );
    }
    
    switch (attendance.status) {
      case "PRESENT":
        return (
          <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
        );
      case "ABSENT":
        return (
          <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-4 w-4 text-red-600" />
          </div>
        );
      case "LATE":
        return (
          <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
        );
      case "LEAVE":
        return (
          <Badge className="h-7 w-7 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 hover:bg-blue-100">
            L
          </Badge>
        );
      case "HALF_DAY":
        return (
          <Badge className="h-7 w-7 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 hover:bg-purple-100">
            H
          </Badge>
        );
      default:
        return (
          <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-xs">?</span>
          </div>
        );
    }
  };
  
  // Go to previous month
  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  // Go to next month
  const nextMonth = () => {
    const nextDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    // Only allow going to next month if it's not in the future
    if (nextDate <= new Date()) {
      setCurrentMonth(nextDate);
    }
  };
  
  // Go to current month
  const currentMonthHandler = () => {
    setCurrentMonth(new Date());
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            &lt;
          </button>
          <button
            onClick={currentMonthHandler}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-md hover:bg-gray-100"
            disabled={new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) > new Date()}
          >
            &gt;
          </button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
          <div key={i} className="h-10 flex items-center justify-center font-medium text-sm">
            {day}
          </div>
        ))}
        
        {/* Empty spaces for days before the first of the month */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-14 border rounded-md bg-gray-50"></div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const isWeekendDay = isWeekend(day);
          
          return (
            <div 
              key={i}
              className={cn(
                "h-14 border rounded-md flex flex-col items-center justify-center relative",
                isToday && "border-blue-500 border-2",
                isWeekendDay && "bg-gray-50"
              )}
            >
              <span className={cn(
                "text-sm absolute top-1 right-2",
                isToday && "font-bold text-blue-600"
              )}>
                {format(day, 'd')}
              </span>
              <div className="mt-2">
                {getStatusIcon(day)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
