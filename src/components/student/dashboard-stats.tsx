import { Card, CardContent } from "@/components/ui/card";
import { 
  Clock, 
  FileText, 
  CalendarClock, 
  GraduationCap
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
      <StatCard 
        icon={Clock}
        label="Attendance"
        value={`${attendancePercentage}%`}
        description="This month"
        color="bg-blue-500"
      />
      <StatCard 
        icon={FileText}
        label="Assignments"
        value={pendingAssignmentsCount.toString()}
        description="Pending"
        color="bg-amber-500"
      />
      <StatCard 
        icon={CalendarClock}
        label="Exams"
        value={upcomingExamsCount.toString()}
        description="Upcoming"
        color="bg-red-500"
      />
      <StatCard 
        icon={GraduationCap}
        label="Class"
        value={className}
        description="Current"
        color="bg-emerald-500"
      />
    </>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, description, color }: StatCardProps) {
  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-6 flex items-start gap-4">
        <div className={`${color} p-3 rounded-full text-white`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
