import { Card, CardContent } from "@/components/ui/card";
import { 
  Clock, 
  FileText, 
  GraduationCap, 
  BookOpen 
} from "lucide-react";

interface DashboardStatsProps {
  attendancePercentage: number;
  upcomingExamsCount: number;
  pendingAssignmentsCount: number;
  className: string;
}

export function DashboardStats({
  attendancePercentage,
  upcomingExamsCount,
  pendingAssignmentsCount,
  className
}: DashboardStatsProps) {
  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3">
              <GraduationCap className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Class</p>
              <h3 className="text-2xl font-bold">{className}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-100 p-3">
              <Clock className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Attendance</p>
              <h3 className="text-2xl font-bold">{attendancePercentage}%</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-amber-100 p-3">
              <FileText className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming Exams</p>
              <h3 className="text-2xl font-bold">{upcomingExamsCount}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-red-100 p-3">
              <BookOpen className="h-6 w-6 text-red-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Assignments</p>
              <h3 className="text-2xl font-bold">{pendingAssignmentsCount}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
