"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Calendar, Clock, BookOpen, User,
  Building, ArrowLeft, ArrowRight, MoreVertical,
  Copy, Download, Printer, RefreshCw, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";

// Mock data - replace with actual API calls
const classes = [
  { id: "c1", name: "Grade 10 - Science A" },
  { id: "c2", name: "Grade 10 - Science B" },
  { id: "c3", name: "Grade 10 - Commerce" },
  { id: "c4", name: "Grade 11 - Science" },
  { id: "c5", name: "Grade 11 - Arts" },
  { id: "c6", name: "Grade 9 - A" },
  { id: "c7", name: "Grade 9 - B" },
];

const subjects = [
  { id: "s1", name: "Physics", code: "PHY101" },
  { id: "s2", name: "Chemistry", code: "CHEM101" },
  { id: "s3", name: "Biology", code: "BIO101" },
  { id: "s4", name: "Mathematics", code: "MATH101" },
  { id: "s5", name: "English", code: "ENG101" },
  { id: "s6", name: "History", code: "HIST101" },
  { id: "s7", name: "Geography", code: "GEO101" },
  { id: "s8", name: "Computer Science", code: "CS101" },
];

const teachers = [
  { id: "t1", name: "John Smith" },
  { id: "t2", name: "Emily Johnson" },
  { id: "t3", name: "Robert Brown" },
  { id: "t4", name: "Sarah Thompson" },
  { id: "t5", name: "Michael Davis" },
  { id: "t6", name: "Jennifer Wilson" },
];

const rooms = [
  { id: "r1", name: "Science Block - 101" },
  { id: "r2", name: "Science Block - 102" },
  { id: "r3", name: "Science Lab" },
  { id: "r4", name: "Main Block - 201" },
  { id: "r5", name: "Computer Lab" },
  { id: "r6", name: "Library" },
];

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const periods = [
  { id: "p1", time: "09:00 - 09:45" },
  { id: "p2", time: "09:50 - 10:35" },
  { id: "p3", time: "10:40 - 11:25" },
  { id: "p4", time: "11:45 - 12:30" },
  { id: "p5", time: "13:15 - 14:00" },
  { id: "p6", time: "14:05 - 14:50" },
  { id: "p7", time: "14:55 - 15:40" },
];

// Define types for our data structures
type Day = typeof days[number]; // This creates a union type of all possible days
type ClassId = string;
type EntryType = {
  id: string;
  period: string;
  subject: { id: string; name: string; code: string };
  teacher: { id: string; name: string };
  room: { id: string; name: string };
};

// Update timetable data type definition
const timetableData: Record<ClassId, Partial<Record<Day, EntryType[]>>> = {
  "c1": { // Grade 10 - Science A
    "Monday": [
      { id: "t1", period: "p1", subject: subjects[0], teacher: teachers[0], room: rooms[0] },
      { id: "t2", period: "p2", subject: subjects[1], teacher: teachers[1], room: rooms[0] },
      { id: "t3", period: "p3", subject: subjects[2], teacher: teachers[2], room: rooms[2] },
      { id: "t4", period: "p4", subject: subjects[3], teacher: teachers[3], room: rooms[0] },
      { id: "t5", period: "p5", subject: subjects[4], teacher: teachers[4], room: rooms[0] },
    ],
    "Tuesday": [
      { id: "t6", period: "p1", subject: subjects[1], teacher: teachers[1], room: rooms[0] },
      { id: "t7", period: "p2", subject: subjects[0], teacher: teachers[0], room: rooms[0] },
      { id: "t8", period: "p3", subject: subjects[3], teacher: teachers[3], room: rooms[0] },
      { id: "t9", period: "p4", subject: subjects[2], teacher: teachers[2], room: rooms[2] },
      { id: "t10", period: "p5", subject: subjects[4], teacher: teachers[4], room: rooms[0] },
    ],
    "Wednesday": [
      { id: "t11", period: "p1", subject: subjects[2], teacher: teachers[2], room: rooms[2] },
      { id: "t12", period: "p2", subject: subjects[2], teacher: teachers[2], room: rooms[2] },
      { id: "t13", period: "p3", subject: subjects[0], teacher: teachers[0], room: rooms[0] },
      { id: "t14", period: "p4", subject: subjects[3], teacher: teachers[3], room: rooms[0] },
      { id: "t15", period: "p5", subject: subjects[7], teacher: teachers[5], room: rooms[4] },
    ],
    "Thursday": [
      { id: "t16", period: "p1", subject: subjects[3], teacher: teachers[3], room: rooms[0] },
      { id: "t17", period: "p2", subject: subjects[3], teacher: teachers[3], room: rooms[0] },
      { id: "t18", period: "p3", subject: subjects[4], teacher: teachers[4], room: rooms[0] },
      { id: "t19", period: "p4", subject: subjects[1], teacher: teachers[1], room: rooms[0] },
      { id: "t20", period: "p5", subject: subjects[0], teacher: teachers[0], room: rooms[0] },
    ],
    "Friday": [
      { id: "t21", period: "p1", subject: subjects[4], teacher: teachers[4], room: rooms[0] },
      { id: "t22", period: "p2", subject: subjects[7], teacher: teachers[5], room: rooms[4] },
      { id: "t23", period: "p3", subject: subjects[7], teacher: teachers[5], room: rooms[4] },
      { id: "t24", period: "p4", subject: subjects[0], teacher: teachers[0], room: rooms[0] },
      { id: "t25", period: "p5", subject: subjects[1], teacher: teachers[1], room: rooms[0] },
    ],
    "Saturday": []
  },
  "c4": { // Grade 11 - Science
    "Monday": [
      { id: "t26", period: "p1", subject: subjects[3], teacher: teachers[3], room: rooms[1] },
      { id: "t27", period: "p2", subject: subjects[0], teacher: teachers[0], room: rooms[1] },
      { id: "t28", period: "p3", subject: subjects[1], teacher: teachers[1], room: rooms[3] },
      { id: "t29", period: "p4", subject: subjects[2], teacher: teachers[2], room: rooms[3] },
      { id: "t30", period: "p5", subject: subjects[4], teacher: teachers[4], room: rooms[1] },
    ],
    "Tuesday": [
      { id: "t31", period: "p1", subject: subjects[0], teacher: teachers[0], room: rooms[1] },
      { id: "t32", period: "p2", subject: subjects[3], teacher: teachers[3], room: rooms[1] },
      { id: "t33", period: "p3", subject: subjects[4], teacher: teachers[4], room: rooms[1] },
      { id: "t34", period: "p4", subject: subjects[1], teacher: teachers[1], room: rooms[3] },
      { id: "t35", period: "p5", subject: subjects[2], teacher: teachers[2], room: rooms[3] },
    ],
    "Wednesday": [
      { id: "t36", period: "p1", subject: subjects[1], teacher: teachers[1], room: rooms[3] },
      { id: "t37", period: "p2", subject: subjects[1], teacher: teachers[1], room: rooms[3] },
      { id: "t38", period: "p3", subject: subjects[2], teacher: teachers[2], room: rooms[3] },
      { id: "t39", period: "p4", subject: subjects[0], teacher: teachers[0], room: rooms[1] },
      { id: "t40", period: "p5", subject: subjects[7], teacher: teachers[5], room: rooms[4] },
    ],
    "Thursday": [],
    "Friday": [],
    "Saturday": []
  }
};

// Form schema for adding or editing a timetable entry
const entryFormSchema = z.object({
  classId: z.string({
    required_error: "Please select a class",
  }),
  day: z.string({
    required_error: "Please select a day",
  }),
  period: z.string({
    required_error: "Please select a period",
  }),
  subjectId: z.string({
    required_error: "Please select a subject",
  }),
  teacherId: z.string({
    required_error: "Please select a teacher",
  }),
  roomId: z.string({
    required_error: "Please select a room",
  }),
});

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState<string>("c1");
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherFilter, setTeacherFilter] = useState<string>("");
  const [roomFilter, setRoomFilter] = useState<string>("");
  
  const form = useForm<z.infer<typeof entryFormSchema>>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      classId: selectedClass,
      day: selectedDay,
    },
  });

  // Navigate to previous or next day
  const navigateDay = (direction: 'prev' | 'next') => {
    const currentIndex = days.indexOf(selectedDay);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedDay(days[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < days.length - 1) {
      setSelectedDay(days[currentIndex + 1]);
    }
  };

  function onSubmit(values: z.infer<typeof entryFormSchema>) {
    console.log("Form submitted:", values);
    
    // Here you would handle the API call to create or update the timetable entry
    // For now, we'll just close the dialog
    setDialogOpen(false);
    form.reset({
      classId: selectedClass,
      day: selectedDay,
    });
    setEditingEntry(null);
  }

  function handleEditEntry(entry: any) {
    const selectedSubject = subjects.find(s => s.id === entry.subject.id);
    const selectedTeacher = teachers.find(t => t.id === entry.teacher.id);
    const selectedRoom = rooms.find(r => r.id === entry.room.id);
    
    if (selectedSubject && selectedTeacher && selectedRoom) {
      form.reset({
        classId: selectedClass,
        day: selectedDay,
        period: entry.period,
        subjectId: entry.subject.id,
        teacherId: entry.teacher.id,
        roomId: entry.room.id,
      });
      
      setEditingEntry(entry);
      setDialogOpen(true);
    }
  }

  function handleAddEntry(period: string) {
    form.reset({
      classId: selectedClass,
      day: selectedDay,
      period: period,
    });
    
    setEditingEntry(null);
    setDialogOpen(true);
  }

  function handleDeleteEntry(entry: any) {
    setEditingEntry(entry);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    console.log("Deleting entry:", editingEntry);
    
    // Here you would handle the API call to delete the timetable entry
    // For now, we'll just close the dialog
    setDeleteDialogOpen(false);
    setEditingEntry(null);
  }

  // Get all schedules for a teacher
  const getTeacherSchedule = (teacherId: string) => {
    const schedule: (EntryType & { day: Day; class?: string })[] = [];
    
    Object.keys(timetableData).forEach(classId => {
      // Get the days for this class
      const daysForClass = Object.keys(timetableData[classId] || {}) as Day[];
      
      daysForClass.forEach(day => {
        // Safely access entries for this day
        const entries = timetableData[classId]?.[day] || [];
        
        entries.forEach((entry) => {
          if (entry.teacher.id === teacherId) {
            schedule.push({
              ...entry,
              day,
              class: classes.find(c => c.id === classId)?.name
            });
          }
        });
      });
    });
    
    return schedule;
  };

  // Get all schedules for a room
  const getRoomSchedule = (roomId: string) => {
    const schedule: (EntryType & { day: Day; class?: string })[] = [];
    
    Object.keys(timetableData).forEach(classId => {
      // Get the days for this class
      const daysForClass = Object.keys(timetableData[classId] || {}) as Day[];
      
      daysForClass.forEach(day => {
        // Safely access entries for this day
        const entries = timetableData[classId]?.[day] || [];
        
        entries.forEach((entry) => {
          if (entry.room.id === roomId) {
            schedule.push({
              ...entry,
              day,
              class: classes.find(c => c.id === classId)?.name
            });
          }
        });
      });
    });
    
    return schedule;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/teaching">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Timetable Management</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAddEntry("p1")}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Schedule
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Copy Schedule
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Export Timetable
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Printer className="h-4 w-4 mr-2" />
              Print Timetable
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="md:w-1/2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:w-1/2 flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigateDay('prev')}
            disabled={days.indexOf(selectedDay) === 0}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {days.map(day => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigateDay('next')}
            disabled={days.indexOf(selectedDay) === days.length - 1}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {classes.find(cls => cls.id === selectedClass)?.name} - {selectedDay} Schedule
              </CardTitle>
              <CardDescription>
                Manage class timetable for the selected day
              </CardDescription>
            </div>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              {timetableData[selectedClass]?.[selectedDay]?.length || 0} Periods
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {(timetableData[selectedClass]?.[selectedDay] || []).length > 0 ? (
            <div className="space-y-4">
              {periods.map(period => {
                const entry = timetableData[selectedClass]?.[selectedDay]?.find(
                  entry => entry.period === period.id
                );
                
                return (
                  <div key={period.id} className="border rounded-md">
                    <div className="flex items-center justify-between bg-gray-50 p-3 border-b">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{period.time}</span>
                      </div>
                      {!entry && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleAddEntry(period.id)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add Class
                        </Button>
                      )}
                    </div>
                    {entry ? (
                      <div className="p-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-full bg-blue-50 text-blue-600">
                                <BookOpen className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{entry.subject.name}</p>
                                <p className="text-xs text-gray-500">{entry.subject.code}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{entry.teacher.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{entry.room.name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 md:self-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditEntry(entry)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500"
                              onClick={() => handleDeleteEntry(entry)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 flex justify-center items-center text-gray-400 h-24">
                        <p className="text-sm">No class scheduled for this period</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No Classes Scheduled</h3>
              <p className="text-sm text-gray-500 max-w-sm mb-4">
                There are no classes scheduled for {classes.find(cls => cls.id === selectedClass)?.name} on {selectedDay}.
              </p>
              <Button onClick={() => handleAddEntry("p1")}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Schedule
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <div className="text-sm text-gray-500">
            <p>Last updated: Aug 30, 2023</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Tabs defaultValue="weekly" className="mt-2">
        <TabsList>
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          <TabsTrigger value="teachers">Teachers Timetable</TabsTrigger>
          <TabsTrigger value="rooms">Rooms Occupancy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Schedule Overview</CardTitle>
              <CardDescription>
                Complete weekly schedule for {classes.find(cls => cls.id === selectedClass)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-3 text-left">Time</th>
                      {days.map(day => (
                        <th key={day} className="border p-3 text-left">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(period => (
                      <tr key={period.id}>
                        <td className="border p-3 text-sm font-medium">{period.time}</td>
                        {days.map(day => {
                          const entry = timetableData[selectedClass]?.[day]?.find(
                            entry => entry.period === period.id
                          );
                          
                          return (
                            <td key={day} className="border p-3">
                              {entry ? (
                                <div className="text-xs">
                                  <div className="font-medium">{entry.subject.name}</div>
                                  <div className="text-gray-500 mt-1 flex flex-col gap-1">
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {entry.teacher.name}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Building className="h-3 w-3" />
                                      {entry.room.name}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400 text-center">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="teachers" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Teachers Timetable</CardTitle>
                  <CardDescription>
                    View schedules by teacher
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                    <SelectTrigger className="pl-9">
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Teachers</SelectItem>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {teacherFilter ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">
                      {teachers.find(t => t.id === teacherFilter)?.name}'s Schedule
                    </h3>
                  </div>
                  
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Day</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Time</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getTeacherSchedule(teacherFilter).map((entry, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-3 px-4">{entry.day}</td>
                            <td className="py-3 px-4">
                              {periods.find(p => p.id === entry.period)?.time}
                            </td>
                            <td className="py-3 px-4">{entry.class}</td>
                            <td className="py-3 px-4 font-medium">{entry.subject.name}</td>
                            <td className="py-3 px-4">{entry.room.name}</td>
                          </tr>
                        ))}
                        {getTeacherSchedule(teacherFilter).length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              No classes scheduled for this teacher
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {teachers.map(teacher => {
                    const schedule = getTeacherSchedule(teacher.id);
                    return (
                      <Card key={teacher.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{teacher.name}</CardTitle>
                            <Badge variant="outline">{schedule.length} Classes</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="p-4">
                            {schedule.length > 0 ? (
                              <div className="space-y-2">
                                {schedule.slice(0, 3).map((entry, idx) => (
                                  <div key={idx} className="text-sm flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div>
                                      <span className="font-medium">{entry.day}</span>
                                      <span className="text-gray-500 ml-2">
                                        {periods.find(p => p.id === entry.period)?.time}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-blue-600">{entry.subject.name}</span>
                                    </div>
                                  </div>
                                ))}
                                {schedule.length > 3 && (
                                  <div className="text-xs text-center text-gray-500 pt-2">
                                    + {schedule.length - 3} more classes
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-sm text-gray-500">
                                No classes scheduled
                              </div>
                            )}
                          </div>
                          <div className="border-t p-3 flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setTeacherFilter(teacher.id)}
                            >
                              View Schedule
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
            {teacherFilter && (
              <CardFooter className="flex justify-between border-t pt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTeacherFilter("")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to all teachers
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Schedule
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="rooms" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Room Occupancy</CardTitle>
                  <CardDescription>
                    View schedules by room
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Select value={roomFilter} onValueChange={setRoomFilter}>
                    <SelectTrigger className="pl-9">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Rooms</SelectItem>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {roomFilter ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Building className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium">
                      {rooms.find(r => r.id === roomFilter)?.name} Occupancy
                    </h3>
                  </div>
                  
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Day</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Time</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Teacher</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getRoomSchedule(roomFilter).map((entry, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-3 px-4">{entry.day}</td>
                            <td className="py-3 px-4">
                              {periods.find(p => p.id === entry.period)?.time}
                            </td>
                            <td className="py-3 px-4">{entry.class}</td>
                            <td className="py-3 px-4 font-medium">{entry.subject.name}</td>
                            <td className="py-3 px-4">{entry.teacher.name}</td>
                          </tr>
                        ))}
                        {getRoomSchedule(roomFilter).length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              No classes scheduled in this room
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {rooms.map(room => {
                    const schedule = getRoomSchedule(room.id);
                    const occupancyPercentage = Math.round((schedule.length / (periods.length * days.length)) * 100);
                    
                    return (
                      <Card key={room.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{room.name}</CardTitle>
                            <Badge 
                              variant="outline" 
                              className={
                                occupancyPercentage > 75 ? "bg-red-50 text-red-700" :
                                occupancyPercentage > 50 ? "bg-yellow-50 text-yellow-700" :
                                "bg-green-50 text-green-700"
                              }
                            >
                              {occupancyPercentage}% Occupied
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="p-4">
                            {schedule.length > 0 ? (
                              <div className="space-y-2">
                                {schedule.slice(0, 3).map((entry, idx) => (
                                  <div key={idx} className="text-sm flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div>
                                      <span className="font-medium">{entry.day}</span>
                                      <span className="text-gray-500 ml-2">
                                        {periods.find(p => p.id === entry.period)?.time}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-blue-600">{entry.class}</span>
                                    </div>
                                  </div>
                                ))}
                                {schedule.length > 3 && (
                                  <div className="text-xs text-center text-gray-500 pt-2">
                                    + {schedule.length - 3} more classes
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-sm text-gray-500">
                                No classes scheduled
                              </div>
                            )}
                          </div>
                          <div className="border-t p-3 flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setRoomFilter(room.id)}
                            >
                              View Schedule
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
            {roomFilter && (
              <CardFooter className="flex justify-between border-t pt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setRoomFilter("")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to all rooms
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Schedule
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Schedule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
            <DialogDescription>
              {editingEntry 
                ? "Update the details of this schedule entry" 
                : "Create a new schedule entry"
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {days.map(day => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {periods.map(period => (
                            <SelectItem key={period.id} value={period.id}>
                              {period.time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="roomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rooms.map(room => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEntry ? "Save Changes" : "Add Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
