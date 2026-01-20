"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, LogOut, Calendar as CalendarIcon, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { logVisitorEntry, logVisitorExit, getVisitors } from "@/lib/actions/hostelActions";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [studentId, setStudentId] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorRelation, setVisitorRelation] = useState("");
  const [purpose, setPurpose] = useState("");
  const [idProofType, setIdProofType] = useState("");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [remarks, setRemarks] = useState("");

  const loadVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getVisitors(undefined, selectedDate);
      if (result.success && result.data) {
        setVisitors(result.data);
      } else {
        toast.error("Failed to load visitors");
      }
    } catch (error) {
      console.error("Error loading visitors:", error);
      toast.error("An error occurred while loading visitors");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadVisitors();
  }, [loadVisitors]);

  const resetForm = () => {
    setStudentId("");
    setVisitorName("");
    setVisitorPhone("");
    setVisitorRelation("");
    setPurpose("");
    setIdProofType("");
    setIdProofNumber("");
    setRemarks("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId || !visitorName) {
      toast.error("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const result = await logVisitorEntry({
        studentId,
        visitorName,
        visitorPhone: visitorPhone || undefined,
        visitorRelation: visitorRelation || undefined,
        purpose: purpose || undefined,
        idProofType: idProofType || undefined,
        idProofNumber: idProofNumber || undefined,
        remarks: remarks || undefined,
      });

      if (result.success) {
        toast.success("Visitor checked in successfully");
        setDialogOpen(false);
        resetForm();
        loadVisitors();
      } else {
        toast.error(result.error || "Failed to check in visitor");
      }
    } catch (error) {
      console.error("Error checking in visitor:", error);
      toast.error("An error occurred while checking in visitor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (visitorId: string) => {
    try {
      const result = await logVisitorExit(visitorId);
      if (result.success) {
        toast.success("Visitor checked out successfully");
        loadVisitors();
      } else {
        toast.error(result.error || "Failed to check out visitor");
      }
    } catch (error) {
      console.error("Error checking out visitor:", error);
      toast.error("An error occurred while checking out visitor");
    }
  };

  const filteredVisitors = visitors.filter((visitor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      visitor.visitorName.toLowerCase().includes(searchLower) ||
      visitor.student.user.firstName.toLowerCase().includes(searchLower) ||
      visitor.student.user.lastName.toLowerCase().includes(searchLower) ||
      (visitor.visitorPhone && visitor.visitorPhone.includes(searchTerm))
    );
  });

  const activeVisitors = filteredVisitors.filter((v) => !v.checkOutTime);
  const checkedOutVisitors = filteredVisitors.filter((v) => v.checkOutTime);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hostel Visitors</h1>
          <p className="text-muted-foreground">Manage visitor check-in and check-out</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Check In Visitor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Check In Visitor</DialogTitle>
                <DialogDescription>Log a new visitor entry</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">
                    Student ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="studentId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter student ID"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the ID of the student being visited
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitorName">
                    Visitor Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="visitorName"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Enter visitor name"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="visitorPhone">Phone Number</Label>
                    <Input
                      id="visitorPhone"
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visitorRelation">Relation</Label>
                    <Input
                      id="visitorRelation"
                      value={visitorRelation}
                      onChange={(e) => setVisitorRelation(e.target.value)}
                      placeholder="e.g., Father, Mother"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Visit</Label>
                  <Input
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Enter purpose"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="idProofType">ID Proof Type</Label>
                    <Input
                      id="idProofType"
                      value={idProofType}
                      onChange={(e) => setIdProofType(e.target.value)}
                      placeholder="e.g., Aadhaar, DL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idProofNumber">ID Proof Number</Label>
                    <Input
                      id="idProofNumber"
                      value={idProofNumber}
                      onChange={(e) => setIdProofNumber(e.target.value)}
                      placeholder="Enter ID number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any additional notes"
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Checking In..." : "Check In"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[240px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search visitors or students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Visitors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Visitors ({activeVisitors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : activeVisitors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active visitors at the moment
            </div>
          ) : (
            <div className="space-y-4">
              {activeVisitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{visitor.visitorName}</h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Active
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <strong>Visiting:</strong> {visitor.student.user.firstName}{" "}
                        {visitor.student.user.lastName}
                        {visitor.student.hostelRoomAllocations[0] && (
                          <span>
                            {" "}
                            - Room {visitor.student.hostelRoomAllocations[0].room.roomNumber} (
                            {visitor.student.hostelRoomAllocations[0].room.hostel.name})
                          </span>
                        )}
                      </p>
                      {visitor.visitorRelation && (
                        <p>
                          <strong>Relation:</strong> {visitor.visitorRelation}
                        </p>
                      )}
                      {visitor.visitorPhone && (
                        <p>
                          <strong>Phone:</strong> {visitor.visitorPhone}
                        </p>
                      )}
                      {visitor.purpose && (
                        <p>
                          <strong>Purpose:</strong> {visitor.purpose}
                        </p>
                      )}
                      <p>
                        <strong>Check-in:</strong> {format(new Date(visitor.checkInTime), "PPp")}
                      </p>
                      {visitor.idProofType && visitor.idProofNumber && (
                        <p>
                          <strong>ID:</strong> {visitor.idProofType} - {visitor.idProofNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCheckOut(visitor.id)}
                    className="ml-4"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Check Out
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checked Out Visitors */}
      {checkedOutVisitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Checked Out Today ({checkedOutVisitors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkedOutVisitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="flex items-start justify-between p-4 border rounded-lg bg-muted/50"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{visitor.visitorName}</h3>
                      <Badge variant="outline" className="bg-gray-50 text-gray-700">
                        Checked Out
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <strong>Visited:</strong> {visitor.student.user.firstName}{" "}
                        {visitor.student.user.lastName}
                      </p>
                      <p>
                        <strong>Check-in:</strong> {format(new Date(visitor.checkInTime), "p")}
                      </p>
                      <p>
                        <strong>Check-out:</strong> {format(new Date(visitor.checkOutTime), "p")}
                      </p>
                      <p>
                        <strong>Duration:</strong>{" "}
                        {Math.round(
                          (new Date(visitor.checkOutTime).getTime() -
                            new Date(visitor.checkInTime).getTime()) /
                          (1000 * 60)
                        )}{" "}
                        minutes
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
