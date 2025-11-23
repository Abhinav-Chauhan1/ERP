export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TransportAttendanceManager } from "@/components/admin/transport/transport-attendance-manager";

export const metadata = {
  title: "Transport Attendance | Admin Dashboard",
  description: "Record and manage transport attendance for students",
};

export default function TransportAttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transport Attendance</h1>
        <p className="text-muted-foreground">
          Record student boarding and alighting at each stop
        </p>
      </div>

      <Suspense fallback={<TransportAttendanceSkeleton />}>
        <TransportAttendanceManager />
      </Suspense>
    </div>
  );
}

function TransportAttendanceSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
