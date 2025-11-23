"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getRoutes } from "@/lib/actions/routeActions";
import { getRouteAttendanceStats } from "@/lib/actions/transportAttendanceActions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Route = Awaited<ReturnType<typeof getRoutes>>["routes"][0];
type AttendanceStats = Awaited<ReturnType<typeof getRouteAttendanceStats>>;

export function TransportAttendanceHistory() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Load routes on mount
  useEffect(() => {
    loadRoutes();
  }, []);

  // Load stats when filters change
  useEffect(() => {
    if (selectedRoute && startDate && endDate) {
      loadStats();
    }
  }, [selectedRoute, startDate, endDate]);

  const loadRoutes = async () => {
    try {
      const result = await getRoutes({ status: "ACTIVE" });
      setRoutes(result.routes);
    } catch (error) {
      toast.error("Failed to load routes");
      console.error(error);
    }
  };

  const loadStats = async () => {
    if (!selectedRoute) return;

    setLoading(true);
    try {
      const data = await getRouteAttendanceStats(selectedRoute, startDate, endDate);
      setStats(data);
    } catch (error) {
      toast.error("Failed to load attendance statistics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>View transport attendance statistics and history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Route Selection */}
            <div className="space-y-2">
              <Label>Route</Label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name} - {route.vehicle.registrationNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {selectedRoute && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecords}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.presentCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.presentPercentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absentCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.absentPercentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.lateCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.latePercentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Boarding vs Alighting */}
      {selectedRoute && stats && (
        <Card>
          <CardHeader>
            <CardTitle>Boarding vs Alighting</CardTitle>
            <CardDescription>Comparison of boarding and alighting records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">Boarding Records</div>
                <div className="text-3xl font-bold">{stats.boardingCount}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Alighting Records</div>
                <div className="text-3xl font-bold">{stats.alightingCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
