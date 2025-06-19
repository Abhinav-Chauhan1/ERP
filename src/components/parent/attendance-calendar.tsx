"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { CheckCircle, XCircle, Clock, Calendar, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: Date | string;
  status: string;
  section?: {
    id: string;
    name: string;
  };
}

interface AttendanceCalendarProps {
  attendanceData: AttendanceRecord[];
}

export function AttendanceCalendar({ attendanceData }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  
  // Create array of all days in the current month
  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    setCalendarDays(eachDayOfInterval({ start, end }));
  }, [currentMonth]);
  
  // Get attendance record for a specific day
  const getAttendanceForDay = (day: Date) => {
    return attendanceData.find(record => 
      isSameDay(new Date(record.date), day)
    );
  };
  
  // Render status icon based on attendance status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "ABSENT":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "LATE":
        return <Clock className="h-5 w-5 text-amber-600" />;
      case "LEAVE":
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const attendance = getAttendanceForDay(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const isToday = isSameDay(day, new Date());
          
          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`
                      aspect-square flex flex-col items-center justify-center p-2 rounded-md text-sm
                      ${isToday ? 'bg-blue-50 border border-blue-200' : ''}
                      ${isWeekend && !attendance ? 'bg-gray-50 text-gray-400' : ''}
                      ${attendance ? 'cursor-pointer hover:bg-gray-50' : ''}
                    `}
                  >
                    <span className="text-xs">{format(day, 'd')}</span>
                    {attendance && (
                      <div className="mt-1">
                        {getStatusIcon(attendance.status)}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                {attendance && (
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-medium">Date: {format(new Date(attendance.date), 'dd MMM yyyy')}</p>
                      <p>Status: <Badge>{attendance.status}</Badge></p>
                      {attendance.section && (
                        <p>Section: {attendance.section.name}</p>
                      )}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}
