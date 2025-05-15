"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  date: string;
  status: string;
}

interface AttendanceCalendarProps {
  attendanceData: AttendanceRecord[];
}

export function AttendanceCalendar({ attendanceData }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get status for a specific day
  const getDayStatus = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const record = attendanceData.find(d => d.date === formattedDate);
    
    if (!record) return null;
    
    return record.status;
  };
  
  // Get status icon and color based on attendance status
  const getStatusIndicator = (status: string | null) => {
    if (!status) return null;
    
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "ABSENT":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "LATE":
        return <Clock className="h-5 w-5 text-amber-600" />;
      case "LEAVE":
        return <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">L</div>;
      default:
        return null;
    }
  };
  
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  return (
    <div className="calendar w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">{format(currentMonth, "MMMM yyyy")}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date())}>
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <div key={day} className="text-center font-medium text-sm py-2">
            {day}
          </div>
        ))}
        
        {daysInMonth.map((day, i) => {
          const status = getDayStatus(day);
          const statusIndicator = getStatusIndicator(status);
          
          return (
            <div
              key={i}
              className={cn(
                "h-24 p-2 border rounded-lg flex flex-col",
                !isSameMonth(day, currentMonth) && "bg-gray-50 opacity-50",
                isToday(day) && "border-blue-500",
                status === "PRESENT" && "bg-green-50",
                status === "ABSENT" && "bg-red-50",
                status === "LATE" && "bg-amber-50",
                status === "LEAVE" && "bg-blue-50",
              )}
            >
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-sm font-medium",
                  isToday(day) && "bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                )}>
                  {format(day, "d")}
                </span>
                {statusIndicator}
              </div>
              
              {status && (
                <div className="mt-auto">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded",
                    status === "PRESENT" && "bg-green-100 text-green-800",
                    status === "ABSENT" && "bg-red-100 text-red-800",
                    status === "LATE" && "bg-amber-100 text-amber-800",
                    status === "LEAVE" && "bg-blue-100 text-blue-800"
                  )}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
