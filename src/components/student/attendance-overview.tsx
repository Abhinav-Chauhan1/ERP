import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AttendanceOverviewProps {
  attendancePercentage: number;
}

export function AttendanceOverview({ attendancePercentage }: AttendanceOverviewProps) {
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-500";
    if (percentage >= 75) return "text-amber-500";
    return "text-red-500";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 75) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Attendance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              This Semester
            </span>
            <span className={`text-2xl font-bold ${getAttendanceColor(attendancePercentage)}`}>
              {attendancePercentage}%
            </span>
          </div>
          
          <Progress 
            value={attendancePercentage} 
            className="h-2"
            style={{
              "--progress-color": getProgressColor(attendancePercentage)
            } as React.CSSProperties}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Poor Below 75%</span>
            <span>Average 75-90%</span>
            <span>Excellent 90%+</span>
          </div>
          
          <div className="pt-2 text-sm text-muted-foreground">
            {attendancePercentage >= 90 ? (
              <p>Excellent! Keep up the good attendance.</p>
            ) : attendancePercentage >= 75 ? (
              <p>Good attendance, but try to improve further.</p>
            ) : (
              <p className="text-destructive font-medium">
                Warning: Your attendance is below the required minimum of 75%.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
