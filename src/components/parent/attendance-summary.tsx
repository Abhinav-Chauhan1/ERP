import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AttendanceSummaryProps {
  attendanceStats: {
    studentId: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendancePercentage: number;
  }[];
  children: any[];
}

export function AttendanceSummary({ attendanceStats, children }: AttendanceSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Attendance Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {attendanceStats.length > 0 ? (
          attendanceStats.map((stats) => {
            const child = children.find(c => c.id === stats.studentId);
            if (!child) return null;
            
            return (
              <div key={stats.studentId} className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{child.user.firstName} {child.user.lastName}</h3>
                  <span className="text-sm font-medium">
                    {stats.attendancePercentage.toFixed(1)}% Present
                  </span>
                </div>
                
                <Progress value={stats.attendancePercentage} className="h-2" />
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">{stats.presentDays} Present</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-gray-600">{stats.absentDays} Absent</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-gray-600">{stats.lateDays} Late</span>
                  </div>
                </div>
                
                {stats.studentId !== attendanceStats[attendanceStats.length - 1].studentId && (
                  <hr className="my-2" />
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No attendance data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
