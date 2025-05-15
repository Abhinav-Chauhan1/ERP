import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CalendarDays, BookOpen } from "lucide-react";

interface ClassCardProps {
  id: string;
  name: string;
  section: string;
  studentCount: number;
  scheduleDay: string;
  scheduleTime: string;
  roomName: string;
  subject: string;
  currentTopic?: string;
  completionPercentage?: number;
  className?: string;
}

export function TeachingClassCard({
  id,
  name,
  section,
  studentCount,
  scheduleDay,
  scheduleTime,
  roomName,
  subject,
  currentTopic,
  completionPercentage = 0,
  className,
}: ClassCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{name} - Section {section}</CardTitle>
          <Badge variant="outline">{subject}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{studentCount} Students</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{scheduleDay}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{scheduleTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{roomName}</span>
          </div>
        </div>

        {currentTopic && (
          <div>
            <div className="text-sm font-medium">Current Topic:</div>
            <div className="text-sm text-gray-600">{currentTopic}</div>
          </div>
        )}

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Syllabus Progress</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                completionPercentage > 75 ? 'bg-emerald-500' : 
                completionPercentage > 40 ? 'bg-amber-500' : 
                'bg-blue-500'
              }`} 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-between">
        <Link href={`/teacher/teaching/classes/${id}`}>
          <Button variant="outline">Class Details</Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/teacher/attendance/mark?classId=${id}`}>
            <Button size="sm" variant="secondary">Attendance</Button>
          </Link>
          <Link href={`/teacher/assessments/assignments/create?classId=${id}`}>
            <Button size="sm">Assignment</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
