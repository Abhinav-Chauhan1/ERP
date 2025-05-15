"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, CalendarDays, ArrowLeft, ArrowRight, Download } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

type TimetableEvent = {
  id: string;
  day: string;
  class: string;
  subject: string;
  timeStart: string;
  timeEnd: string;
  room: string;
  type: "class" | "duty" | "meeting" | "break";
};

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const timetableEvents: TimetableEvent[] = [
  {
    id: "1",
    day: "Monday",
    class: "Grade 10-A",
    subject: "Mathematics",
    timeStart: "09:00 AM",
    timeEnd: "10:00 AM",
    room: "Room 101",
    type: "class"
  },
  {
    id: "2",
    day: "Monday",
    class: "Grade 9-C",
    subject: "Mathematics",
    timeStart: "12:00 PM",
    timeEnd: "01:00 PM",
    room: "Room 105",
    type: "class"
  },
  {
    id: "3",
    day: "Monday",
    class: "Staff",
    subject: "Department Meeting",
    timeStart: "03:00 PM",
    timeEnd: "04:00 PM",
    room: "Conference Room",
    type: "meeting"
  },
  {
    id: "4",
    day: "Tuesday",
    class: "Grade 11-B",
    subject: "Mathematics",
    timeStart: "10:30 AM",
    timeEnd: "11:30 AM",
    room: "Room 203",
    type: "class"
  },
  {
    id: "5",
    day: "Tuesday",
    class: "Grade 10-B",
    subject: "Mathematics",
    timeStart: "02:30 PM",
    timeEnd: "03:30 PM",
    room: "Room 102",
    type: "class"
  },
  {
    id: "6",
    day: "Wednesday",
    class: "Grade 10-A",
    subject: "Mathematics",
    timeStart: "09:00 AM",
    timeEnd: "10:00 AM",
    room: "Room 101",
    type: "class"
  },
  {
    id: "7",
    day: "Wednesday",
    class: "Grade 9-C",
    subject: "Mathematics", 
    timeStart: "12:00 PM",
    timeEnd: "01:00 PM",
    room: "Room 105",
    type: "class"
  },
  {
    id: "8",
    day: "Wednesday",
    class: "School",
    subject: "Lunch Duty",
    timeStart: "01:00 PM",
    timeEnd: "01:30 PM",
    room: "Cafeteria",
    type: "duty"
  },
  {
    id: "9",
    day: "Thursday",
    class: "Grade 11-B",
    subject: "Mathematics",
    timeStart: "10:30 AM",
    timeEnd: "11:30 AM",
    room: "Room 203",
    type: "class"
  },
  {
    id: "10",
    day: "Thursday",
    class: "Grade 10-B",
    subject: "Mathematics",
    timeStart: "02:30 PM",
    timeEnd: "03:30 PM",
    room: "Room 102",
    type: "class"
  },
  {
    id: "11",
    day: "Friday",
    class: "Grade 10-A",
    subject: "Mathematics",
    timeStart: "09:00 AM",
    timeEnd: "10:00 AM",
    room: "Room 101",
    type: "class"
  },
  {
    id: "12",
    day: "Friday",
    class: "Staff",
    subject: "Professional Development",
    timeStart: "03:00 PM",
    timeEnd: "04:30 PM",
    room: "Library",
    type: "meeting"
  }
];

const timeSlots = [
  "08:00 AM - 09:00 AM",
  "09:00 AM - 10:00 AM",
  "10:00 AM - 10:15 AM",
  "10:15 AM - 11:15 AM",
  "11:15 AM - 12:15 PM",
  "12:15 PM - 01:00 PM",
  "01:00 PM - 02:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM"
];

const breakTimes = ["10:00 AM - 10:15 AM", "12:15 PM - 01:00 PM"];

export default function TeacherTimetablePage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const startOfCurrentWeek = startOfWeek(currentWeek, { weekStartsOn: 1 });
  
  const getPeriodByTime = (day: string, timeSlot: string) => {
    const [startTime] = timeSlot.split(" - ");
    return timetableEvents.filter(
      event => event.day === day && event.timeStart === startTime
    );
  };
  
  const isBreakTime = (timeSlot: string) => {
    return breakTimes.includes(timeSlot);
  };
  
  const formatWeekRange = () => {
    const start = format(startOfCurrentWeek, 'MMM d');
    const end = format(addDays(startOfCurrentWeek, 5), 'MMM d, yyyy');
    return `${start} - ${end}`;
  };
  
  const handlePreviousWeek = () => {
    setCurrentWeek(prev => addDays(prev, -7));
  };
  
  const handleNextWeek = () => {
    setCurrentWeek(prev => addDays(prev, 7));
  };
  
  const isToday = (day: string) => {
    const today = new Date();
    const dayIndex = weekdays.indexOf(day);
    const weekdayDate = addDays(startOfCurrentWeek, dayIndex);
    return isSameDay(today, weekdayDate);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Teaching Timetable</h1>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>{formatWeekRange()}</span>
                </div>
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentWeek(new Date())}
              >
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="timetable">
            <TabsList className="mb-4">
              <TabsTrigger value="timetable">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timetable" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-50 w-[12%] text-left">Time</th>
                      {weekdays.map((day) => (
                        <th 
                          key={day} 
                          className={`border p-2 text-center w-[14.67%] ${
                            isToday(day) ? 'bg-emerald-50' : 'bg-gray-50'
                          }`}
                        >
                          {day}
                          {isToday(day) && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                              Today
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  <tbody>
                    {timeSlots.map((timeSlot) => (
                      <tr key={timeSlot}>
                        <td className="border p-2 text-sm font-medium">
                          <div className="flex items-center">
                            <Clock className="mr-2 h-3.5 w-3.5 text-gray-400" />
                            {timeSlot}
                          </div>
                        </td>
                        
                        {weekdays.map((day) => {
                          const periodEvents = getPeriodByTime(day, timeSlot);
                          const isBreak = isBreakTime(timeSlot);
                          
                          if (isBreak) {
                            return (
                              <td 
                                key={`${day}-${timeSlot}`} 
                                className="border p-2 bg-gray-50 text-center text-xs text-gray-500"
                              >
                                {timeSlot === "10:00 AM - 10:15 AM" ? "Morning Break" : "Lunch Break"}
                              </td>
                            );
                          }
                          
                          return (
                            <td 
                              key={`${day}-${timeSlot}`} 
                              className={`border p-0 ${
                                periodEvents.length > 0 ? 'relative' : ''
                              }`}
                            >
                              {periodEvents.length > 0 ? (
                                periodEvents.map((event) => (
                                  <div 
                                    key={event.id}
                                    className={`p-2 m-0.5 rounded h-full ${
                                      event.type === 'class' ? 'bg-blue-50 border-blue-200 border' :
                                      event.type === 'duty' ? 'bg-amber-50 border-amber-200 border' :
                                      event.type === 'meeting' ? 'bg-purple-50 border-purple-200 border' :
                                      'bg-gray-50'
                                    }`}
                                  >
                                    <p className="font-medium text-sm mb-1">{event.subject}</p>
                                    <div className="text-xs flex flex-col gap-1">
                                      <div className="flex items-center gap-1">
                                        <span>{event.class}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-gray-500">
                                        <span>{event.room}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="h-16"></div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                  <span className="text-sm">Classes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
                  <span className="text-sm">Meetings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div>
                  <span className="text-sm">Duties</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                  <span className="text-sm">Breaks</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="list">
              <div className="space-y-6">
                {weekdays.map((day) => {
                  const dayEvents = timetableEvents.filter(event => event.day === day);
                  
                  return (
                    <Card key={day} className="overflow-hidden">
                      <CardHeader className={`py-3 ${isToday(day) ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{day}</CardTitle>
                          {isToday(day) && (
                            <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                              Today
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-4">
                        {dayEvents.length > 0 ? (
                          <div className="space-y-3">
                            {dayEvents.map((event) => (
                              <div 
                                key={event.id}
                                className={`p-3 rounded-lg border ${
                                  event.type === 'class' ? 'bg-blue-50 border-blue-200' :
                                  event.type === 'duty' ? 'bg-amber-50 border-amber-200' :
                                  event.type === 'meeting' ? 'bg-purple-50 border-purple-200' :
                                  'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium">{event.subject}</h3>
                                    <p className="text-sm text-gray-600">{event.class}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium text-sm">
                                      {event.timeStart} - {event.timeEnd}
                                    </div>
                                    <p className="text-sm text-gray-500">{event.room}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            No scheduled activities for {day}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Teaching Summary</CardTitle>
          <CardDescription>Weekly teaching load and schedule statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Total Classes</p>
              <p className="text-2xl font-bold">10</p>
              <p className="text-xs text-gray-500">per week</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Teaching Hours</p>
              <p className="text-2xl font-bold">15</p>
              <p className="text-xs text-gray-500">hours per week</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Busiest Day</p>
              <p className="text-2xl font-bold">Monday</p>
              <p className="text-xs text-gray-500">3 classes</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Free Periods</p>
              <p className="text-2xl font-bold">7</p>
              <p className="text-xs text-gray-500">periods per week</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
