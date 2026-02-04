"use client";

import { useState, useEffect, useCallback } from "react";
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
import { CalendarIcon, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getRoutes } from "@/lib/actions/routeActions";
import {
  getTransportAttendanceByRouteAndDate,
  recordBulkTransportAttendance,
} from "@/lib/actions/transportAttendanceActions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type Route = Awaited<ReturnType<typeof getRoutes>>["routes"][0];

interface RouteWithAttendance {
  id: string;
  name: string;
  status: string;
  vehicleId: string;
  fee: number;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
  stops: Array<{
    id: string;
    stopName: string;
    sequence: number;
    routeId: string;
    schoolId: string;
    createdAt: Date;
    updatedAt: Date;
    arrivalTime: string;
  }>;
  students: Array<{
    id: string;
    pickupStop?: string;
    dropStop?: string;
    student: {
      admissionId?: string;
      user: {
        firstName: string | null;
        lastName: string | null;
      };
      enrollments: Array<{
        class: { name: string };
        section: { name: string };
      }>;
    };
    attendance: Array<{
      attendanceType: string;
      stopName?: string;
      status: string;
      remarks?: string;
    }>;
  }>;
}

export function TransportAttendanceManager() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceType, setAttendanceType] = useState<"BOARDING" | "ALIGHTING">("BOARDING");
  const [selectedStop, setSelectedStop] = useState<string>("");
  const [routeData, setRouteData] = useState<RouteWithAttendance | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, { status: "PRESENT" | "ABSENT" | "LATE"; remarks?: string }>
  >({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadRoutes = async () => {
    try {
      const result = await getRoutes({ status: "ACTIVE" });
      setRoutes(result.routes);
    } catch (error) {
      toast.error("Failed to load routes");
      console.error(error);
    }
  };

  // Load routes on mount
  useEffect(() => {
    loadRoutes();
  }, []);

  const loadAttendanceData = useCallback(async () => {
    if (!selectedRoute) return;

    setLoading(true);
    try {
      const data = await getTransportAttendanceByRouteAndDate(
        selectedRoute,
        selectedDate,
        attendanceType,
        selectedStop || undefined
      );
      setRouteData(data as RouteWithAttendance);

      // Initialize attendance records from existing data
      const records: Record<string, { status: "PRESENT" | "ABSENT" | "LATE"; remarks?: string }> =
        {};
      (data as RouteWithAttendance).students.forEach((studentRoute: {
        id: string;
        attendance: Array<{
          attendanceType: string;
          stopName?: string;
          status: string;
          remarks?: string;
        }>;
      }) => {
        const existingAttendance = studentRoute.attendance.find(
          (a: { attendanceType: string; stopName?: string }) =>
            a.attendanceType === attendanceType &&
            (!selectedStop || a.stopName === selectedStop)
        );
        if (existingAttendance) {
          records[studentRoute.id] = {
            status: existingAttendance.status as "PRESENT" | "ABSENT" | "LATE",
            remarks: existingAttendance.remarks || undefined,
          };
        } else {
          // Default to PRESENT for new records
          records[studentRoute.id] = { status: "PRESENT" };
        }
      });
      setAttendanceRecords(records);
    } catch (error) {
      toast.error("Failed to load attendance data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedRoute, selectedDate, attendanceType, selectedStop]);

  // Load attendance data when route, date, or type changes
  useEffect(() => {
    if (selectedRoute && selectedDate) {
      loadAttendanceData();
    }
  }, [selectedRoute, selectedDate, attendanceType, selectedStop, loadAttendanceData]);

  const handleStatusChange = (studentRouteId: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentRouteId]: {
        ...prev[studentRouteId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentRouteId: string, remarks: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentRouteId]: {
        ...prev[studentRouteId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: "PRESENT" | "ABSENT" | "LATE") => {
    if (!routeData) return;

    const newRecords: Record<string, { status: "PRESENT" | "ABSENT" | "LATE"; remarks?: string }> =
      {};
    routeData.students.forEach((studentRoute: { id: string }) => {
      newRecords[studentRoute.id] = {
        status,
        remarks: attendanceRecords[studentRoute.id]?.remarks,
      };
    });
    setAttendanceRecords(newRecords);
  };

  const handleSubmit = async () => {
    if (!selectedRoute || !selectedStop) {
      toast.error("Please select a route and stop");
      return;
    }

    if (!routeData || routeData.students.length === 0) {
      toast.error("No students found for this route");
      return;
    }

    setSubmitting(true);
    try {
      const result = await recordBulkTransportAttendance({
        routeId: selectedRoute,
        date: selectedDate,
        stopName: selectedStop,
        attendanceType,
        attendanceRecords: Object.entries(attendanceRecords).map(([studentRouteId, record]) => ({
          studentRouteId,
          status: record.status,
          remarks: record.remarks,
        })),
      });

      if (result.success) {
        toast.success(`Attendance recorded for ${result.count} students`);
        loadAttendanceData(); // Reload to show updated data
      } else {
        toast.error(result.error || "Failed to record attendance");
      }
    } catch (error) {
      toast.error("Failed to record attendance");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRouteData = routes.find((r) => r.id === selectedRoute);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Select Route and Date</CardTitle>
          <CardDescription>Choose the route, date, and stop to record attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Attendance Type */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={attendanceType}
                onValueChange={(value) => setAttendanceType(value as "BOARDING" | "ALIGHTING")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOARDING">Boarding</SelectItem>
                  <SelectItem value="ALIGHTING">Alighting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stop Selection */}
            <div className="space-y-2">
              <Label>Stop</Label>
              <Select value={selectedStop} onValueChange={setSelectedStop}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stop" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRouteData?.stops.map((stop) => (
                    <SelectItem key={stop.id} value={stop.stopName}>
                      {stop.stopName} ({stop.arrivalTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Recording */}
      {selectedRoute && selectedStop && routeData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Record Attendance</CardTitle>
                <CardDescription>
                  {attendanceType === "BOARDING" ? "Boarding" : "Alighting"} at {selectedStop} on{" "}
                  {format(selectedDate, "PPP")}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll("PRESENT")}
                  disabled={loading || submitting}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll("ABSENT")}
                  disabled={loading || submitting}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark All Absent
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading students...</div>
            ) : routeData.students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students assigned to this route
              </div>
            ) : (
              <div className="space-y-4">
                {/* Student List */}
                <div className="space-y-3">
                  {routeData.students.map((studentRoute: {
                    id: string;
                    pickupStop?: string;
                    dropStop?: string;
                    student: {
                      admissionId?: string;
                      user: { firstName: string | null; lastName: string | null };
                      enrollments: Array<{
                        class: { name: string };
                        section: { name: string };
                      }>;
                    };
                  }) => {
                    const student = studentRoute.student;
                    const enrollment = student.enrollments[0];
                    const record = attendanceRecords[studentRoute.id];

                    return (
                      <div
                        key={studentRoute.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {student.user.firstName} {student.user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {student.admissionId}
                            {enrollment && (
                              <span className="ml-2">
                                {enrollment.class.name} - {enrollment.section.name}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Pickup: {studentRoute.pickupStop} | Drop: {studentRoute.dropStop}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant={record?.status === "PRESENT" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStatusChange(studentRoute.id, "PRESENT")}
                            disabled={submitting}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Present
                          </Button>
                          <Button
                            variant={record?.status === "ABSENT" ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleStatusChange(studentRoute.id, "ABSENT")}
                            disabled={submitting}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Absent
                          </Button>
                          <Button
                            variant={record?.status === "LATE" ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => handleStatusChange(studentRoute.id, "LATE")}
                            disabled={submitting}
                          >
                            <Clock className="mr-1 h-4 w-4" />
                            Late
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSubmit} disabled={submitting} size="lg">
                    {submitting ? "Recording..." : "Record Attendance"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedRoute && selectedStop && routeData && routeData.students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Students</div>
                <div className="text-2xl font-bold">{routeData.students.length}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Present</div>
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(attendanceRecords).filter((r) => r.status === "PRESENT").length}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Absent</div>
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(attendanceRecords).filter((r) => r.status === "ABSENT").length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
