"use client";

import { format, isToday, parse } from "date-fns";
import { Clock, MapPin, User, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TimetableSlot {
  id: string;
  day: string;
  startTime: Date | string;
  endTime: Date | string;
  subjectTeacher: {
    subject: {
      id: string;
      name: string;
      code: string;
    };
    teacher: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
  room: {
    id: string;
    name: string;
  } | null;
}

interface TimetableGridProps {
  schedule: TimetableSlot[];
  studentName?: string;
  className?: string;
}

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Subject color mapping for visual distinction
const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-100 text-blue-700 border-blue-200",
  Science: "bg-green-100 text-green-700 border-green-200",
  English: "bg-purple-100 text-purple-700 border-purple-200",
  History: "bg-amber-100 text-amber-700 border-amber-200",
  Geography: "bg-teal-100 text-teal-700 border-teal-200",
  Physics: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Chemistry: "bg-pink-100 text-pink-700 border-pink-200",
  Biology: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Computer: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Physical: "bg-orange-100 text-orange-700 border-orange-200",
};

const getSubjectColor = (subjectName: string): string => {
  // Check for partial matches
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (subjectName.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  // Default color
  return "bg-gray-100 text-gray-700 border-gray-200";
};

export function TimetableGrid({ schedule, studentName, className }: TimetableGridProps) {
  // Group slots by day
  const slotsByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = schedule
      .filter((slot) => slot.day === day)
      .sort((a, b) => {
        const timeA = typeof a.startTime === "string" ? new Date(a.startTime) : a.startTime;
        const timeB = typeof b.startTime === "string" ? new Date(b.startTime) : b.startTime;
        return timeA.getTime() - timeB.getTime();
      });
    return acc;
  }, {} as Record<string, TimetableSlot[]>);

  // Get all unique time slots
  const allTimeSlots = schedule.map((slot) => {
    const start = typeof slot.startTime === "string" ? new Date(slot.startTime) : slot.startTime;
    const end = typeof slot.endTime === "string" ? new Date(slot.endTime) : slot.endTime;
    return {
      start: format(start, "HH:mm"),
      end: format(end, "HH:mm"),
      startTime: start,
    };
  });

  // Get unique time slots sorted
  const uniqueTimeSlots = Array.from(
    new Map(allTimeSlots.map((slot) => [slot.start, slot])).values()
  ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Check if a slot is currently active
  const isCurrentClass = (slot: TimetableSlot): boolean => {
    const now = new Date();
    const currentDay = now.toLocaleString("en-US", { weekday: "long" }).toUpperCase();
    
    if (slot.day !== currentDay) return false;

    const startTime = typeof slot.startTime === "string" ? new Date(slot.startTime) : slot.startTime;
    const endTime = typeof slot.endTime === "string" ? new Date(slot.endTime) : slot.endTime;

    // Create date objects with today's date but slot's time
    const slotStart = new Date();
    slotStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    
    const slotEnd = new Date();
    slotEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    return now >= slotStart && now <= slotEnd;
  };

  // Check if today is this day
  const isCurrentDay = (day: string): boolean => {
    const today = new Date().toLocaleString("en-US", { weekday: "long" }).toUpperCase();
    return day === today;
  };

  if (schedule.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Weekly Timetable</CardTitle>
          {studentName && (
            <p className="text-sm text-muted-foreground">{studentName}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No timetable available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Weekly Timetable</CardTitle>
            {studentName && (
              <p className="text-sm text-muted-foreground mt-1">{studentName}</p>
            )}
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {schedule.length} Classes
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Grid View */}
        <div className="hidden lg:block overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 gap-2">
              {/* Header Row */}
              <div className="font-medium text-sm text-gray-500 p-2">Time</div>
              {DAY_LABELS.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    "font-medium text-sm text-center p-2 rounded-t-lg",
                    isCurrentDay(DAYS_OF_WEEK[index])
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700"
                  )}
                >
                  {day}
                </div>
              ))}

              {/* Time Slots */}
              {uniqueTimeSlots.map((timeSlot, timeIndex) => (
                <div key={timeIndex} className="contents">
                  {/* Time Column */}
                  <div className="text-xs text-gray-500 p-2 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {timeSlot.start}
                  </div>

                  {/* Day Columns */}
                  {DAYS_OF_WEEK.map((day) => {
                    const slot = slotsByDay[day]?.find((s) => {
                      const start = typeof s.startTime === "string" ? new Date(s.startTime) : s.startTime;
                      return format(start, "HH:mm") === timeSlot.start;
                    });

                    if (!slot) {
                      return (
                        <div
                          key={`${day}-${timeIndex}`}
                          className="border border-gray-100 rounded-lg p-2 min-h-[80px]"
                        />
                      );
                    }

                    const startTime = typeof slot.startTime === "string" ? new Date(slot.startTime) : slot.startTime;
                    const endTime = typeof slot.endTime === "string" ? new Date(slot.endTime) : slot.endTime;
                    const teacherName = `${slot.subjectTeacher.teacher.user.firstName} ${slot.subjectTeacher.teacher.user.lastName}`;
                    const isCurrent = isCurrentClass(slot);

                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          "border rounded-lg p-2 min-h-[80px] transition-all",
                          getSubjectColor(slot.subjectTeacher.subject.name),
                          isCurrent && "ring-2 ring-blue-500 shadow-lg scale-105"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-xs leading-tight">
                              {slot.subjectTeacher.subject.name}
                            </p>
                            {isCurrent && (
                              <Badge variant="default" className="text-[10px] px-1 py-0 h-4">
                                Now
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] opacity-75">
                            {slot.subjectTeacher.subject.code}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] opacity-75">
                            <User className="h-2.5 w-2.5" />
                            <span className="truncate">{teacherName}</span>
                          </div>
                          {slot.room && (
                            <div className="flex items-center gap-1 text-[10px] opacity-75">
                              <MapPin className="h-2.5 w-2.5" />
                              <span>{slot.room.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] opacity-75">
                            <Clock className="h-2.5 w-2.5" />
                            <span>
                              {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile List View */}
        <div className="lg:hidden space-y-4">
          {DAY_LABELS.map((day, index) => {
            const daySlots = slotsByDay[DAYS_OF_WEEK[index]];
            
            if (!daySlots || daySlots.length === 0) return null;

            return (
              <div key={day} className="space-y-2">
                <h3
                  className={cn(
                    "font-medium text-sm p-2 rounded-lg",
                    isCurrentDay(DAYS_OF_WEEK[index])
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  {day}
                </h3>
                <div className="space-y-2">
                  {daySlots.map((slot) => {
                    const startTime = typeof slot.startTime === "string" ? new Date(slot.startTime) : slot.startTime;
                    const endTime = typeof slot.endTime === "string" ? new Date(slot.endTime) : slot.endTime;
                    const teacherName = `${slot.subjectTeacher.teacher.user.firstName} ${slot.subjectTeacher.teacher.user.lastName}`;
                    const isCurrent = isCurrentClass(slot);

                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          "border rounded-lg p-3 transition-all",
                          getSubjectColor(slot.subjectTeacher.subject.name),
                          isCurrent && "ring-2 ring-blue-500 shadow-lg"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              {slot.subjectTeacher.subject.name}
                            </p>
                            <p className="text-xs opacity-75">
                              {slot.subjectTeacher.subject.code}
                            </p>
                          </div>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">
                              Current Class
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-xs opacity-75">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>{teacherName}</span>
                          </div>
                          {slot.room && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <span>{slot.room.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-gray-500 mb-2">Legend:</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-gray-600">Current Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded ring-2 ring-blue-500"></div>
              <span className="text-gray-600">Current Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
              </div>
              <span className="text-gray-600">Subject Color Coding</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
