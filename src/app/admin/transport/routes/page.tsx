export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import Link from "next/link";
import { Plus, Bus, MapPin, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRoutes, getRouteStats } from "@/lib/actions/routeActions";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Routes | Transport Management",
  description: "Manage school transport routes",
};

export default async function RoutesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href="/admin/transport">
            <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Transport
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Traffic Routes</h1>
            <p className="text-muted-foreground mt-1">
              Manage school transport routes and schedules
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/transport/routes/new">
              <Plus className="mr-2 h-4 w-4" />
              New Route
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <RouteStats />
      </Suspense>

      <Suspense fallback={<RouteListSkeleton />}>
        <RouteList />
      </Suspense>
    </div>
  );
}

async function RouteStats() {
  const stats = await getRouteStats();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
          <Bus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
          <Bus className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive Routes</CardTitle>
          <Bus className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inactive}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalStudents}</div>
        </CardContent>
      </Card>
    </div>
  );
}

async function RouteList() {
  const { routes } = await getRoutes();

  if (routes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bus className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No routes found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by creating your first route
          </p>
          <Link href="/admin/transport/routes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Route
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {routes.map((route) => (
        <Link key={route.id} href={`/admin/transport/routes/${route.id}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{route.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {route.vehicle.registrationNo} - {route.vehicle.vehicleType}
                  </p>
                </div>
                <Badge variant={route.status === "ACTIVE" ? "default" : "secondary"}>
                  {route.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{route.stops.length} stops</span>
                </div>
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{route._count.students} students</span>
                </div>
                {route.vehicle.driver && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Driver: </span>
                    <span className="font-medium">{route.vehicle.driver.name}</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-muted-foreground">Fee: </span>
                  <span className="font-semibold">₹{route.fee.toLocaleString()}</span>
                </div>
                {route.stops.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Route Stops:</p>
                    <div className="space-y-1">
                      {route.stops.slice(0, 3).map((stop) => (
                        <div key={stop.id} className="flex items-center justify-between text-xs">
                          <span className="truncate flex-1">
                            {stop.sequence}. {stop.stopName}
                          </span>
                          <span className="text-muted-foreground ml-2">{stop.arrivalTime}</span>
                        </div>
                      ))}
                      {route.stops.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{route.stops.length - 3} more stops
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RouteListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
