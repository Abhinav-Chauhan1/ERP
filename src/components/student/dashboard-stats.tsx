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
            <div className="rounded-full bg-primary/10 p-3">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Class</p>
              <h3 className="text-2xl font-bold">{className}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
              <Clock className="h-6 w-6 text-green-700 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Attendance</p>
              <h3 className="text-2xl font-bold">{attendancePercentage}%</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3">
              <FileText className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Exams</p>
              <h3 className="text-2xl font-bold">{upcomingExamsCount}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
              <BookOpen className="h-6 w-6 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Assignments</p>
              <h3 className="text-2xl font-bold">{pendingAssignmentsCount}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
