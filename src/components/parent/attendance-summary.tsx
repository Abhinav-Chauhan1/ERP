import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card className="premium-card hover-lift overflow-hidden">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold tracking-tight">Attendance Summary</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pt-4 space-y-6">
        {attendanceStats.length > 0 ? (
          attendanceStats.map((stats) => {
            const child = children.find(c => c.id === stats.studentId);
            if (!child) return null;

            return (
              <div key={stats.studentId} className="space-y-4 p-5 rounded-2xl bg-muted/20 border border-muted transition-all hover:bg-muted/30">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">{child.user.firstName} {child.user.lastName}</h3>
                  <Badge variant={stats.attendancePercentage >= 90 ? "secondary" : "outline"} className={stats.attendancePercentage >= 90 ? "bg-emerald-500/10 text-emerald-600 border-none" : "text-amber-600 border-amber-500/20 bg-amber-500/5"}>
                    {stats.attendancePercentage.toFixed(1)}% Present
                  </Badge>
                </div>

                <div className="relative pt-1">
                  <Progress value={stats.attendancePercentage} className="h-2.5 bg-muted/50" />
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-bold uppercase tracking-wider">
                  <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-emerald-500/5 text-emerald-600 border border-emerald-500/10">
                    <CheckCircle className="h-4 w-4" />
                    <span>{stats.presentDays} Present</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-rose-500/5 text-rose-600 border border-rose-500/10">
                    <XCircle className="h-4 w-4" />
                    <span>{stats.absentDays} Absent</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-amber-500/5 text-amber-600 border border-amber-500/10">
                    <Clock className="h-4 w-4" />
                    <span>{stats.lateDays} Late</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border border-dashed rounded-2xl">
            <p className="text-muted-foreground font-medium">No attendance data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
