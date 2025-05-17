import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeachingClassCard } from "@/components/academic/class-card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getTeacherClasses } from "@/lib/actions/teacherClassesActions";

export default async function TeacherClassesPage() {
  const { classes } = await getTeacherClasses();
  
  // Group classes by day for timetable view
  const classesByDay: Record<string, any[]> = {};
  
  classes.forEach(cls => {
    const days = cls.scheduleDay.split(", ");
    days.forEach(day => {
      if (!classesByDay[day]) {
        classesByDay[day] = [];
      }
      
      classesByDay[day].push({
        id: cls.id,
        name: `${cls.name}-${cls.section}`,
        subject: cls.subject,
        time: cls.scheduleTime,
        room: cls.roomName
      });
    });
  });

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
            {classes.map(classInfo => (
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
