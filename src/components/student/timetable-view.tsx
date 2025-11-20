"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, BookOpen, MapPin } from "lucide-react";

interface TimetableSlot {
  id: string;
  subject: string;
  subjectCode: string;
  teacher: string;
  teacherId: string;
  room: string;
  startTime: string | Date;
  endTime: string | Date;
}

interface DaySchedule {
  day: string;
  slots: TimetableSlot[];
}

interface TimetableViewProps {
  days: DaySchedule[];
  timetable: any | null;
}

export function TimetableView({ days, timetable }: TimetableViewProps) {
  // Get current day for default tab
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const [activeDay, setActiveDay] = useState(
    days.find(day => day.day === currentDay && day.slots.length > 0) 
      ? currentDay 
      : days.find(day => day.slots.length > 0)?.day || "MONDAY"
  );

  if (!timetable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Class Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-center">
            <div>
              <p className="text-muted-foreground mb-2">No active timetable found</p>
              <p className="text-sm text-muted-foreground">
                The class schedule has not been published yet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format times for display
  const formatTime = (time: Date | string) => {
    return format(new Date(time), "h:mm a");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Class Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue={activeDay} 
          onValueChange={setActiveDay}
          value={activeDay}
        >
          <TabsList className="grid grid-cols-7 mb-4">
            {days.map((day) => (
              <TabsTrigger 
                key={day.day} 
                value={day.day}
                disabled={day.slots.length === 0}
              >
                {day.day.slice(0, 3)}
                {day.slots.length === 0 && 
                  <span className="sr-only"> (No classes)</span>
                }
              </TabsTrigger>
            ))}
          </TabsList>
          
          {days.map((day) => (
            <TabsContent key={day.day} value={day.day} className="mt-0">
              {day.slots.length > 0 ? (
                <div className="space-y-3">
                  {day.slots
                    .sort((a, b) => 
                      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                    )
                    .map((slot) => (
                      <div 
                        key={slot.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-md border"
                      >
                        <div className="flex items-start gap-3 mb-2 sm:mb-0">
                          <div className="rounded-md bg-primary/10 p-2 flex-shrink-0">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium">{slot.subject}</h3>
                              <Badge variant="outline" className="text-xs font-mono">
                                {slot.subjectCode}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:items-end gap-1 ml-8 sm:ml-0">
                          <div className="flex items-center text-sm">
                            <BookOpen className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            {slot.teacher}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            {slot.room}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-center">
                  <div>
                    <p className="text-muted-foreground mb-2">No Classes</p>
                    <p className="text-sm text-muted-foreground">
                      There are no classes scheduled for this day.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
