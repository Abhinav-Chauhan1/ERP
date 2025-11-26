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
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-100 rounded-md text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Present Days
            </p>
          </div>
          <div className="text-3xl font-bold">{presentDays}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-100 rounded-md text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Absent Days
            </p>
          </div>
          <div className="text-3xl font-bold">{absentDays}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-100 rounded-md text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Late Arrivals
            </p>
          </div>
          <div className="text-3xl font-bold">{lateDays}</div>
        </CardContent>
      </Card>
    </div>
  );
}
