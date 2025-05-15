import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeachingClassCard } from "@/components/academic/class-card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Mock data for teacher's classes
const teacherClasses = [
  {
    id: "1",
    name: "Grade 10",
    section: "A",
    subject: "Mathematics",
    studentCount: 30,
    scheduleDay: "Monday, Wednesday, Friday",
    scheduleTime: "09:00 AM - 10:00 AM",
    roomName: "Room 101",
    currentTopic: "Quadratic Equations",
    completionPercentage: 65,
  },
  {
    id: "2",
    name: "Grade 11",
    section: "B",
    subject: "Mathematics",
    studentCount: 28,
    scheduleDay: "Tuesday, Thursday",
    scheduleTime: "10:30 AM - 11:30 AM",
    roomName: "Room 203",
    currentTopic: "Calculus Introduction",
    completionPercentage: 45,
  },
  {
    id: "3",
    name: "Grade 9",
    section: "C",
    subject: "Mathematics",
    studentCount: 32,
    scheduleDay: "Monday, Wednesday",
    scheduleTime: "12:00 PM - 01:00 PM",
    roomName: "Room 105",
    currentTopic: "Linear Equations",
    completionPercentage: 78,
  },
  {
    id: "4",
    name: "Grade 10",
    section: "B",
    subject: "Mathematics",
    studentCount: 31,
    scheduleDay: "Tuesday, Thursday",
    scheduleTime: "02:30 PM - 03:30 PM",
    roomName: "Room 102",
    currentTopic: "Quadratic Equations",
    completionPercentage: 62,
  },
];

// Group classes by day for timetable view
const classesByDay = {
  Monday: [
    {
      id: "1",
      name: "Grade 10-A",
      subject: "Mathematics",
      time: "09:00 AM - 10:00 AM",
      room: "Room 101"
    },
    {
      id: "3",
      name: "Grade 9-C",
      subject: "Mathematics",
      time: "12:00 PM - 01:00 PM",
      room: "Room 105"
    }
  ],
  Tuesday: [
    {
      id: "2",
      name: "Grade 11-B",
      subject: "Mathematics",
      time: "10:30 AM - 11:30 AM",
      room: "Room 203"
    },
    {
      id: "4",
      name: "Grade 10-B",
      subject: "Mathematics",
      time: "02:30 PM - 03:30 PM",
      room: "Room 102"
    }
  ],
  Wednesday: [
    {
      id: "1",
      name: "Grade 10-A",
      subject: "Mathematics",
      time: "09:00 AM - 10:00 AM",
      room: "Room 101"
    },
    {
      id: "3",
      name: "Grade 9-C",
      subject: "Mathematics",
      time: "12:00 PM - 01:00 PM",
      room: "Room 105"
    }
  ],
  Thursday: [
    {
      id: "2",
      name: "Grade 11-B",
      subject: "Mathematics",
      time: "10:30 AM - 11:30 AM",
      room: "Room 203"
    },
    {
      id: "4",
      name: "Grade 10-B",
      subject: "Mathematics",
      time: "02:30 PM - 03:30 PM",
      room: "Room 102"
    }
  ],
  Friday: [
    {
      id: "1",
      name: "Grade 10-A",
      subject: "Mathematics",
      time: "09:00 AM - 10:00 AM",
      room: "Room 101"
    }
  ]
};

export default function TeacherClassesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Classes</h1>
        <div className="flex gap-2">
          <div className="relative w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search classes..."
              className="pl-9"
            />
          </div>
          <Link href="/teacher/teaching/timetable">
            <Button variant="outline">View Timetable</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="all-classes">
        <TabsList className="mb-4">
          <TabsTrigger value="all-classes">All Classes</TabsTrigger>
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-classes">
          <div className="grid gap-6 md:grid-cols-2">
            {teacherClasses.map(classInfo => (
              <TeachingClassCard
                key={classInfo.id}
                id={classInfo.id}
                name={classInfo.name}
                section={classInfo.section}
                studentCount={classInfo.studentCount}
                scheduleDay={classInfo.scheduleDay}
                scheduleTime={classInfo.scheduleTime}
                roomName={classInfo.roomName}
                subject={classInfo.subject}
                currentTopic={classInfo.currentTopic}
                completionPercentage={classInfo.completionPercentage}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="schedule">
          <div className="space-y-6">
            {Object.entries(classesByDay).map(([day, classes]) => (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="text-lg">{day}</CardTitle>
                  <CardDescription>{classes.length} Classes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {classes.map(cls => (
                      <Link href={`/teacher/teaching/classes/${cls.id}`} key={`${day}-${cls.id}`}>
                        <div className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                            <div className="flex gap-2 items-center">
                              <span className="font-medium">{cls.time}</span>
                              <span className="text-gray-400">•</span>
                              <span>{cls.name}</span>
                              <span className="text-gray-400">•</span>
                              <span>{cls.subject}</span>
                            </div>
                            <span className="text-gray-500 text-sm">{cls.room}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
