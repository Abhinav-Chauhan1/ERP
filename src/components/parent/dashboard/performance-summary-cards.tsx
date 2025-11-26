import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BookOpen, CheckCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChildPerformance {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  latestExamResult: {
    score: number;
    maxScore: number;
  } | null;
  attendancePercentage: number;
  pendingAssignments: number;
  gradeTrend: 'up' | 'down' | 'stable';
}

interface PerformanceSummaryCardsProps {
  children: ChildPerformance[];
}

export function PerformanceSummaryCards({ children }: PerformanceSummaryCardsProps) {
  if (children.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No children data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {children.map((child) => {
        const fullName = `${child.user.firstName} ${child.user.lastName}`;
        const examPercentage = child.latestExamResult
          ? Math.round((child.latestExamResult.score / child.latestExamResult.maxScore) * 100)
          : null;

        const TrendIcon = 
          child.gradeTrend === 'up' ? TrendingUp :
          child.gradeTrend === 'down' ? TrendingDown :
          Minus;

        const trendColor = 
          child.gradeTrend === 'up' ? 'text-green-600' :
          child.gradeTrend === 'down' ? 'text-red-600' :
          'text-muted-foreground';

        return (
          <Card key={child.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center justify-between">
                <span className="truncate">{fullName}</span>
                <TrendIcon className={cn("h-4 w-4", trendColor)} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Latest Exam Result */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-muted-foreground">Latest Exam</span>
                </div>
                <span className="text-sm font-semibold">
                  {examPercentage !== null ? `${examPercentage}%` : 'N/A'}
                </span>
              </div>

              {/* Attendance Percentage */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-muted-foreground">Attendance</span>
                </div>
                <span className="text-sm font-semibold">
                  {Math.round(child.attendancePercentage)}%
                </span>
              </div>

              {/* Pending Assignments */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-full",
                    child.pendingAssignments > 0
                      ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-500"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500"
                  )}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <span className={cn(
                  "text-sm font-semibold",
                  child.pendingAssignments > 0 ? "text-orange-600 dark:text-orange-500" : ""
                )}>
                  {child.pendingAssignments}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
