import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface AttendanceOverviewProps {
  attendancePercentage: number;
}

export function AttendanceOverview({ attendancePercentage }: AttendanceOverviewProps) {
  // Determine status and color based on attendance percentage
  let status = "Excellent";
  let statusColor = "text-green-600";
  let progressColor = "bg-green-600";
  
  if (attendancePercentage < 75) {
    status = "Poor";
    statusColor = "text-red-600";
    progressColor = "bg-red-600";
  } else if (attendancePercentage < 90) {
    status = "Good";
    statusColor = "text-amber-600";
    progressColor = "bg-amber-600";
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md font-medium flex items-center">
            <Clock className="h-5 w-5 mr-2" /> 
            Attendance Overview
          </CardTitle>
          <span className={`text-sm font-bold ${statusColor}`}>
            {status}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center py-2">
            <span className="text-3xl font-bold">{attendancePercentage}%</span>
            <p className="text-xs text-gray-500">Present this month</p>
          </div>
          
          <Progress value={attendancePercentage} className={`h-2 ${progressColor}`} />
          
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="bg-green-50 p-2 rounded-lg">
              <CheckCircle2 className="h-5 w-5 mx-auto text-green-600" />
              <p className="text-xs mt-1 font-medium">Present</p>
              <p className="text-sm font-bold">22</p>
            </div>
            <div className="bg-red-50 p-2 rounded-lg">
              <XCircle className="h-5 w-5 mx-auto text-red-600" />
              <p className="text-xs mt-1 font-medium">Absent</p>
              <p className="text-sm font-bold">3</p>
            </div>
            <div className="bg-amber-50 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 mx-auto text-amber-600" />
              <p className="text-xs mt-1 font-medium">Late</p>
              <p className="text-sm font-bold">1</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
