import { CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
  // Determine attendance status color
  const getAttendanceStatusColor = () => {
    if (attendancePercentage >= 90) return "text-green-600";
    if (attendancePercentage >= 75) return "text-amber-600";
    return "text-red-600";
  };

  // Get progress indicator class based on percentage
  const getProgressClass = () => {
    if (attendancePercentage >= 90) return "bg-green-600";
    if (attendancePercentage >= 75) return "bg-amber-500";
    return "bg-red-500";
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
      <Card className="col-span-1 lg:col-span-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Overall Attendance</p>
              <div className="flex items-baseline">
                <h3 className={`text-3xl font-bold ${getAttendanceStatusColor()}`}>
                  {attendancePercentage.toFixed(1)}%
                </h3>
                <span className="ml-1 text-gray-500 text-sm">of classes attended</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {presentDays} present out of {totalDays} school days
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Calendar className="h-8 w-8 text-gray-500" />
            </div>
          </div>
          
          <div className="mt-4">
            <Progress 
              value={attendancePercentage} 
              className={`h-2 bg-gray-100 [&>div]:${getProgressClass()}`}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="mt-2 text-2xl font-bold">{presentDays}</h3>
            <p className="text-sm text-gray-500">Present Days</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-red-100 p-2 rounded-full">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="mt-2 text-2xl font-bold">{absentDays}</h3>
            <p className="text-sm text-gray-500">Absent Days</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-amber-100 p-2 rounded-full">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="mt-2 text-2xl font-bold">{lateDays}</h3>
            <p className="text-sm text-gray-500">Late Arrivals</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
