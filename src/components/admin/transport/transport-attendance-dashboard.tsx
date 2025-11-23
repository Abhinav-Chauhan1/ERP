"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTodayTransportAttendanceSummary } from "@/lib/actions/transportAttendanceActions";
import { toast } from "sonner";
import { Bus, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type AttendanceSummary = Awaited<ReturnType<typeof getTodayTransportAttendanceSummary>>;

export function TransportAttendanceDashboard() {
  const [summary, setSummary] = useState<AttendanceSummary>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
    // Refresh every 5 minutes
    const interval = setInterval(loadSummary, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSummary = async () => {
    try {
      const data = await getTodayTransportAttendanceSummary();
      setSummary(data);
    } catch (error) {
      toast.error("Failed to load attendance summary");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (summary.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Transport Attendance</CardTitle>
          <CardDescription>No active routes found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Transport Attendance</CardTitle>
        <CardDescription>Real-time attendance tracking for all routes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {summary.map((route) => {
            const boardingPercentage =
              route.totalStudents > 0
                ? (route.boardingPresent / route.totalStudents) * 100
                : 0;
            const alightingPercentage =
              route.totalStudents > 0
                ? (route.alightingPresent / route.totalStudents) * 100
                : 0;

            return (
              <div key={route.routeId} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Bus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{route.routeName}</div>
                      <div className="text-sm text-muted-foreground">
                        {route.vehicleRegistration}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{route.totalStudents} Students</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Boarding */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Boarding</span>
                      <span className="font-medium">
                        {route.boardingPresent}/{route.totalStudents}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${boardingPercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      {route.boardingRecorded} recorded
                    </div>
                  </div>

                  {/* Alighting */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Alighting</span>
                      <span className="font-medium">
                        {route.alightingPresent}/{route.totalStudents}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${alightingPercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      {route.alightingRecorded} recorded
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
