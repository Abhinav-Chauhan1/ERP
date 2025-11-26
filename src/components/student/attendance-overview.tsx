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
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Attendance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              This Semester
            </span>
            <span className={`text-3xl font-bold ${getAttendanceColor(attendancePercentage)}`}>
              {attendancePercentage}%
            </span>
          </div>
          
          <Progress 
            value={attendancePercentage} 
            className="h-3"
            style={{
              "--progress-color": getProgressColor(attendancePercentage)
            } as React.CSSProperties}
          />
          
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground text-center">
            <div>
              <div className="font-medium">Poor</div>
              <div>&lt;75%</div>
            </div>
            <div>
              <div className="font-medium">Average</div>
              <div>75-90%</div>
            </div>
            <div>
              <div className="font-medium">Excellent</div>
              <div>90%+</div>
            </div>
          </div>
          
          <div className="pt-2 text-sm">
            {attendancePercentage >= 90 ? (
              <p className="text-green-600 dark:text-green-400 font-medium">
                ✓ Excellent! Keep up the good attendance.
              </p>
            ) : attendancePercentage >= 75 ? (
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                Good attendance, but try to improve further.
              </p>
            ) : (
              <p className="text-destructive font-medium">
                ⚠ Warning: Your attendance is below the required minimum of 75%.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
