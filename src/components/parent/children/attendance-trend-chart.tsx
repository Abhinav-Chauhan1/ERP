"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

interface AttendanceRecord {
  id: string;
  date: Date;
  status: string;
}

interface AttendanceTrendChartProps {
  attendanceRecords: AttendanceRecord[];
  monthsToShow?: number;
}

export function AttendanceTrendChart({ 
  attendanceRecords, 
  monthsToShow = 6 
}: AttendanceTrendChartProps) {
  // Get the last N months
  const endDate = new Date();
  const startDate = subMonths(endDate, monthsToShow - 1);
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  // Calculate attendance for each month
  const monthlyData = months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const monthRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });

    const totalDays = monthRecords.length;
    const presentDays = monthRecords.filter(r => r.status === "PRESENT").length;
    const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      month: format(month, "MMM yyyy"),
      shortMonth: format(month, "MMM"),
      totalDays,
      presentDays,
      percentage
    };
  });

  // Calculate trend
  const validMonths = monthlyData.filter(m => m.totalDays > 0);
  if (validMonths.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Attendance Trend
          </CardTitle>
          <CardDescription>Not enough data to show trend</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Need at least 2 months of attendance data
          </p>
        </CardContent>
      </Card>
    );
  }

  const firstMonth = validMonths[0];
  const lastMonth = validMonths[validMonths.length - 1];
  const trend = lastMonth.percentage - firstMonth.percentage;
  const trendDirection = trend > 5 ? "up" : trend < -5 ? "down" : "stable";

  // Calculate overall average
  const overallAverage = validMonths.reduce((sum, m) => sum + m.percentage, 0) / validMonths.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Attendance Trend
              {trendDirection === "up" && <TrendingUp className="h-5 w-5 text-green-600" />}
              {trendDirection === "down" && <TrendingDown className="h-5 w-5 text-red-600" />}
              {trendDirection === "stable" && <Minus className="h-5 w-5 text-amber-600" />}
            </CardTitle>
            <CardDescription>Last {monthsToShow} months</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{overallAverage.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Average</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Bar Chart */}
          <div className="space-y-3">
            {monthlyData.map((month, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">
                    {month.shortMonth}
                  </span>
                  <span className="text-sm">
                    {month.totalDays > 0 ? (
                      <>
                        <span className="font-semibold">{month.percentage.toFixed(0)}%</span>
                        <span className="text-muted-foreground ml-2">
                          ({month.presentDays}/{month.totalDays})
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </span>
                </div>
                {month.totalDays > 0 && (
                  <div className="relative h-6 bg-muted rounded-lg overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-lg transition-all ${
                        month.percentage >= 90 ? "bg-green-500" :
                        month.percentage >= 75 ? "bg-primary" :
                        month.percentage >= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${month.percentage}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Trend Summary */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">First Month</p>
                <p className="text-lg font-semibold">{firstMonth.percentage.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Latest Month</p>
                <p className="text-lg font-semibold">{lastMonth.percentage.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Change</p>
                <p className={`text-lg font-semibold ${
                  trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-amber-600"
                }`}>
                  {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
