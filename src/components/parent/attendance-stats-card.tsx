import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface AttendanceStatsCardProps {
  child: any;
  attendanceData: any[];
}

export function AttendanceStatsCard({ child, attendanceData }: AttendanceStatsCardProps) {
  // Calculate attendance statistics
  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter(record => record.status === "PRESENT").length;
  const absentDays = attendanceData.filter(record => record.status === "ABSENT").length;
  const lateDays = attendanceData.filter(record => record.status === "LATE").length;
  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Attendance Summary</span>
          <span className="text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded-md">
            {child.enrollments[0]?.class?.name || 'No Class'} {child.enrollments[0]?.section?.name || ''}
          </span>
        </CardTitle>
        <CardDescription>
          {child.user.firstName} {child.user.lastName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Attendance</span>
              <span className="text-sm font-medium">
                {attendancePercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={attendancePercentage} 
              className="h-2" 
              color={
                attendancePercentage >= 90 ? "bg-green-600" :
                attendancePercentage >= 75 ? "bg-green-500" :
                attendancePercentage >= 60 ? "bg-yellow-500" :
                "bg-red-500"
              }
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 p-3 rounded-md flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Present</p>
                <p className="font-medium">{presentDays} days</p>
              </div>
            </div>
            
            <div className="bg-red-50 p-3 rounded-md flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs text-gray-500">Absent</p>
                <p className="font-medium">{absentDays} days</p>
              </div>
            </div>
            
            <div className="bg-amber-50 p-3 rounded-md flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-gray-500">Late</p>
                <p className="font-medium">{lateDays} days</p>
              </div>
            </div>
          </div>
          
          {totalDays === 0 && (
            <div className="bg-gray-50 p-3 rounded-md text-center text-gray-500 text-sm">
              No attendance records found for this month
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
