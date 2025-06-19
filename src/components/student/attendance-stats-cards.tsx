import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, AlertCircle, CalendarCheck } from "lucide-react";

interface AttendanceStatsCardsProps {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  totalDays: number;
  attendancePercentage: number;
}

export function AttendanceStatsCards({ 
  presentDays, 
  absentDays, 
  lateDays, 
  leaveDays, 
  totalDays,
  attendancePercentage 
}: AttendanceStatsCardsProps) {
  // Get color class based on attendance percentage
  const getColorClass = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 65) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className="rounded-full bg-green-100 p-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-500">Present</p>
          <p className="text-2xl font-bold">{presentDays}</p>
          <p className="text-xs text-gray-500">days</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className="rounded-full bg-red-100 p-2 mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-sm text-gray-500">Absent</p>
          <p className="text-2xl font-bold">{absentDays}</p>
          <p className="text-xs text-gray-500">days</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className="rounded-full bg-amber-100 p-2 mb-2">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-sm text-gray-500">Late</p>
          <p className="text-2xl font-bold">{lateDays}</p>
          <p className="text-xs text-gray-500">days</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className="rounded-full bg-blue-100 p-2 mb-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-500">Leave</p>
          <p className="text-2xl font-bold">{leaveDays}</p>
          <p className="text-xs text-gray-500">days</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className="rounded-full bg-gray-100 p-2 mb-2">
            <CalendarCheck className="h-5 w-5 text-gray-600" />
          </div>
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{totalDays}</p>
          <p className="text-xs text-gray-500">school days</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className={`text-3xl font-bold ${getColorClass(attendancePercentage)}`}>
            {attendancePercentage}%
          </div>
          <p className="text-sm text-gray-500">Attendance</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="h-2.5 rounded-full" 
              style={{ 
                width: `${attendancePercentage}%`,
                backgroundColor: 
                  attendancePercentage >= 90 ? '#22c55e' : 
                  attendancePercentage >= 75 ? '#3b82f6' : 
                  attendancePercentage >= 65 ? '#f59e0b' : 
                  '#ef4444'
              }}
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
