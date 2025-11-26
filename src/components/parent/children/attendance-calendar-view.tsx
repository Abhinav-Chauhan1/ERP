"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  date: Date;
  status: string;
  remarks?: string | null;
}

interface AttendanceCalendarViewProps {
  attendanceRecords: AttendanceRecord[];
  statistics: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    percentage: number;
  };
}

export function AttendanceCalendarView({ attendanceRecords, statistics }: AttendanceCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = monthStart.getDay();

  // Create array of empty cells for days before month starts
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const getAttendanceForDate = (date: Date) => {
    return attendanceRecords.find(record => 
      isSameDay(new Date(record.date), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-500 hover:bg-green-600";
      case "ABSENT":
        return "bg-red-500 hover:bg-red-600";
      case "LATE":
        return "bg-amber-500 hover:bg-amber-600";
      case "LEAVE":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-muted hover:bg-muted/80";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "default";
      case "ABSENT":
        return "destructive";
      case "LATE":
        return "secondary";
      case "LEAVE":
        return "outline";
      default:
        return "outline";
    }
  };

  const selectedAttendance = selectedDate ? getAttendanceForDate(selectedDate) : null;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Attendance Rate</p>
              <p className="text-3xl font-bold text-primary">{statistics.percentage.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Present Days</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-500">{statistics.presentDays}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Absent Days</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-500">{statistics.absentDays}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Late Days</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">{statistics.lateDays}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Attendance Calendar
              </CardTitle>
              <CardDescription>
                {format(currentMonth, "MMMM yyyy")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Empty cells before month starts */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Days of the month */}
            {daysInMonth.map(day => {
              const attendance = getAttendanceForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-square rounded-lg border-2 transition-all relative",
                    "flex items-center justify-center text-sm font-medium",
                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent",
                    isToday && !isSelected && "border-primary/50",
                    attendance ? getStatusColor(attendance.status) + " text-white" : "bg-muted hover:bg-muted/80",
                    !isSameMonth(day, currentMonth) && "opacity-50"
                  )}
                >
                  {format(day, "d")}
                  {isToday && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span className="text-sm">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-sm">Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted border-2 border-primary/50" />
              <span className="text-sm">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedAttendance && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Details</CardTitle>
            <CardDescription>
              {format(selectedDate!, "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={getStatusBadgeVariant(selectedAttendance.status)}>
                  {selectedAttendance.status}
                </Badge>
              </div>
              {selectedAttendance.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                  <p className="text-sm">{selectedAttendance.remarks}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
