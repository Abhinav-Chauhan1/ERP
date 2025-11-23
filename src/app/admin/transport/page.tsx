export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bus, Users, MapPin, Plus, Route as RouteIcon, UserCheck, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getVehicleStats } from "@/lib/actions/vehicleActions";
import { getRouteStats } from "@/lib/actions/routeActions";
import { getTodayTransportAttendanceSummary } from "@/lib/actions/transportAttendanceActions";
import { getDrivers } from "@/lib/actions/driverActions";

export const metadata = {
  title: "Transport Management | Admin Dashboard",
  description: "Manage school transport system",
};

export default async function TransportPage() {
  // Fetch all statistics in parallel
  const [vehicleStats, routeStats, todayAttendance, driversData] = await Promise.all([
    getVehicleStats(),
    getRouteStats(),
    getTodayTransportAttendanceSummary(),
    getDrivers({ limit: 1 }), // Just to get total count
  ]);

  // Calculate overall attendance statistics
  const totalStudentsOnRoutes = todayAttendance.reduce((sum, route) => sum + route.totalStudents, 0);
  const totalBoardingPresent = todayAttendance.reduce((sum, route) => sum + route.boardingPresent, 0);
  const totalAlightingPresent = todayAttendance.reduce((sum, route) => sum + route.alightingPresent, 0);
  const boardingPercentage = totalStudentsOnRoutes > 0 
    ? Math.round((totalBoardingPresent / totalStudentsOnRoutes) * 100) 
    : 0;
  const alightingPercentage = totalStudentsOnRoutes > 0 
    ? Math.round((totalAlightingPresent / totalStudentsOnRoutes) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transport Management</h1>
        <p className="text-muted-foreground">
          Manage vehicles, drivers, routes, and student transportation
        </p>
      </div>

      {/* Transport Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicleStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {vehicleStats.active} active, {vehicleStats.maintenance} in maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            <RouteIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routeStats.active}</div>
            <p className="text-xs text-muted-foreground">
              {routeStats.total} total routes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students on Routes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routeStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across all routes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driversData.total}</div>
            <p className="text-xs text-muted-foreground">
              Registered drivers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Attendance Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today&apos;s Attendance Summary
              </CardTitle>
              <CardDescription>
                Real-time attendance tracking for all active routes
              </CardDescription>
            </div>
            <Link href="/admin/transport/attendance">
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayAttendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active routes found</p>
              <Link href="/admin/transport/routes">
                <Button variant="link" className="mt-2">
                  Create a route
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Overall Statistics */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalStudentsOnRoutes}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Boarding Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalBoardingPresent}</div>
                    <p className="text-xs text-muted-foreground">
                      {boardingPercentage}% present
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Alighting Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalAlightingPresent}</div>
                    <p className="text-xs text-muted-foreground">
                      {alightingPercentage}% present
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Route-wise Attendance */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Route-wise Attendance</h3>
                <div className="space-y-2">
                  {todayAttendance.map((route) => {
                    const boardingPerc = route.totalStudents > 0 
                      ? Math.round((route.boardingPresent / route.totalStudents) * 100) 
                      : 0;
                    const alightingPerc = route.totalStudents > 0 
                      ? Math.round((route.alightingPresent / route.totalStudents) * 100) 
                      : 0;

                    return (
                      <div
                        key={route.routeId}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{route.routeName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {route.vehicleRegistration}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {route.totalStudents} students assigned
                          </p>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground mb-1">Boarding</p>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {route.boardingPresent}/{route.totalStudents}
                              </span>
                              <Badge 
                                variant={boardingPerc >= 80 ? "default" : boardingPerc >= 50 ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                {boardingPerc}%
                              </Badge>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground mb-1">Alighting</p>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {route.alightingPresent}/{route.totalStudents}
                              </span>
                              <Badge 
                                variant={alightingPerc >= 80 ? "default" : alightingPerc >= 50 ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                {alightingPerc}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Vehicles
            </CardTitle>
            <CardDescription>
              Manage your transport fleet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                <p className="text-muted-foreground">Active</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {vehicleStats.active}
                </p>
              </div>
              <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                <p className="text-muted-foreground">Maintenance</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {vehicleStats.maintenance}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/transport/vehicles" className="flex-1">
                <Button variant="outline" className="w-full">
                  View All
                </Button>
              </Link>
              <Link href="/admin/transport/vehicles/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5" />
              Routes
            </CardTitle>
            <CardDescription>
              Manage transport routes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                <p className="text-muted-foreground">Active</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {routeStats.active}
                </p>
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded">
                <p className="text-muted-foreground">Students</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {routeStats.totalStudents}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/transport/routes" className="flex-1">
                <Button variant="outline" className="w-full">
                  View All
                </Button>
              </Link>
              <Link href="/admin/transport/routes/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Attendance
            </CardTitle>
            <CardDescription>
              Track transport attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                <p className="text-muted-foreground">Boarding</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {boardingPercentage}%
                </p>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                <p className="text-muted-foreground">Alighting</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {alightingPercentage}%
                </p>
              </div>
            </div>
            <Link href="/admin/transport/attendance" className="block">
              <Button variant="outline" className="w-full">
                Manage Attendance
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
