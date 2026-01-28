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
      <Card className="premium-card hover-lift hover-glow overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600 border border-blue-500/10 group-hover:scale-110 transition-transform duration-500">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Current Class</p>
              <h3 className="text-2xl font-black tracking-tight">{className}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="premium-card hover-lift hover-glow overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 border border-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
              <Clock className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Attendance</p>
              <h3 className="text-2xl font-black tracking-tight">{attendancePercentage}%</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="premium-card hover-lift hover-glow overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 border border-amber-500/10 group-hover:scale-110 transition-transform duration-500">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Upcoming Exams</p>
              <h3 className="text-2xl font-black tracking-tight">{upcomingExamsCount}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="premium-card hover-lift hover-glow overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-600 border border-rose-500/10 group-hover:scale-110 transition-transform duration-500">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Pending Assignments</p>
              <h3 className="text-2xl font-black tracking-tight">{pendingAssignmentsCount}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
