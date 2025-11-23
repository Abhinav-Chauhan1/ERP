"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { generateHostelFee, getHostelFees } from "@/lib/actions/hostelActions";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function HostelFeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [allocationId, setAllocationId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [roomFee, setRoomFee] = useState("");
  const [messFee, setMessFee] = useState("");
  const [otherCharges, setOtherCharges] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    loadFees();
  }, [statusFilter]);

  const loadFees = async () => {
    setLoading(true);
    try {
      const status = statusFilter === "all" ? undefined : statusFilter;
      const result = await getHostelFees(undefined, status as any);
      if (result.success && result.data) {
        setFees(result.data);
      } else {
        toast.error("Failed to load fees");
      }
    } catch (error) {
      console.error("Error loading fees:", error);
      toast.error("An error occurred while loading fees");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMonthName = (monthNum: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[monthNum - 1];
  };

  const resetForm = () => {
    setAllocationId("");
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
    setRoomFee("");
    setMessFee("");
    setOtherCharges("");
    setDueDate(new Date());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allocationId || !roomFee || !messFee || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const result = await generateHostelFee({
        allocationId,
        month,
        year,
        roomFee: parseFloat(roomFee),
        messFee: parseFloat(messFee),
        otherCharges: otherCharges ? parseFloat(otherCharges) : undefined,
        dueDate,
      });

      if (result.success) {
        toast.success("Fee generated successfully");
        setDialogOpen(false);
        resetForm();
        loadFees();
      } else {
        toast.error(result.error || "Failed to generate fee");
      }
    } catch (error) {
      console.error("Error generating fee:", error);
      toast.error("An error occurred while generating fee");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hostel Fees</h1>
          <p className="text-muted-foreground">Manage hostel fee payments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Fee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Generate Hostel Fee</DialogTitle>
                <DialogDescription>Create a new fee record for a student</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="allocationId">
                    Allocation ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="allocationId"
                    value={allocationId}
                    onChange={(e) => setAllocationId(e.target.value)}
                    placeholder="Enter room allocation ID"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                      <SelectTrigger id="month">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <SelectItem key={m} value={m.toString()}>
                            {getMonthName(m)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="roomFee">
                      Room Fee (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="roomFee"
                      type="number"
                      value={roomFee}
                      onChange={(e) => setRoomFee(e.target.value)}
                      placeholder="0.00"
                      required
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messFee">
                      Mess Fee (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="messFee"
                      type="number"
                      value={messFee}
                      onChange={(e) => setMessFee(e.target.value)}
                      placeholder="0.00"
                      required
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherCharges">Other Charges (₹)</Label>
                  <Input
                    id="otherCharges"
                    type="number"
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Due Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                {roomFee && messFee && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">
                      Total Amount: ₹
                      {(
                        parseFloat(roomFee || "0") +
                        parseFloat(messFee || "0") +
                        parseFloat(otherCharges || "0")
                      ).toFixed(2)}
                    </p>
                  </div>
                )}
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
                  {submitting ? "Generating..." : "Generate Fee"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fee Records ({fees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : fees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No fee records found</p>
              <p className="text-sm">Generate fees for students to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fees.map((fee) => (
                <div
                  key={fee.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {fee.allocation.student.user.firstName} {fee.allocation.student.user.lastName}
                      </h3>
                      <Badge className={getStatusColor(fee.status)}>{fee.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <strong>Period:</strong> {getMonthName(fee.month)} {fee.year}
                      </p>
                      <p>
                        <strong>Room:</strong> {fee.allocation.room.roomNumber} (
                        {fee.allocation.room.hostel.name})
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <p>
                          <strong>Room Fee:</strong> ₹{fee.roomFee.toLocaleString()}
                        </p>
                        <p>
                          <strong>Mess Fee:</strong> ₹{fee.messFee.toLocaleString()}
                        </p>
                        {fee.otherCharges > 0 && (
                          <p>
                            <strong>Other Charges:</strong> ₹{fee.otherCharges.toLocaleString()}
                          </p>
                        )}
                        <p>
                          <strong>Total:</strong> ₹{fee.totalAmount.toLocaleString()}
                        </p>
                        <p>
                          <strong>Paid:</strong> ₹{fee.paidAmount.toLocaleString()}
                        </p>
                        <p className={fee.balance > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                          <strong>Balance:</strong> ₹{fee.balance.toLocaleString()}
                        </p>
                      </div>
                      <p>
                        <strong>Due Date:</strong> {format(new Date(fee.dueDate), "PPP")}
                      </p>
                      {fee.paymentDate && (
                        <p>
                          <strong>Last Payment:</strong> {format(new Date(fee.paymentDate), "PPP")} (
                          {fee.paymentMethod})
                        </p>
                      )}
                    </div>
                  </div>
                  {fee.balance > 0 && (
                    <Button variant="outline" size="sm" className="ml-4">
                      Record Payment
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
