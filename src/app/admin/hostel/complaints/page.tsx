"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  createHostelComplaint,
  updateComplaintStatus,
  getHostelComplaints,
  getHostels,
} from "@/lib/actions/hostelActions";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Form state
  const [hostelId, setHostelId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  useEffect(() => {
    loadHostels();
    loadComplaints();
  }, [statusFilter]);

  const loadHostels = async () => {
    try {
      const result = await getHostels();
      if (result.success && result.data) {
        setHostels(result.data);
      }
    } catch (error) {
      console.error("Error loading hostels:", error);
    }
  };

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const status = statusFilter === "all" ? undefined : statusFilter;
      const result = await getHostelComplaints(undefined, status as any);
      if (result.success && result.data) {
        setComplaints(result.data);
      } else {
        toast.error("Failed to load complaints");
      }
    } catch (error) {
      console.error("Error loading complaints:", error);
      toast.error("An error occurred while loading complaints");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setHostelId("");
    setStudentId("");
    setCategory("");
    setSubject("");
    setDescription("");
    setPriority("MEDIUM");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hostelId || !studentId || !category || !subject || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createHostelComplaint({
        hostelId,
        studentId,
        category: category as any,
        subject,
        description,
        priority: priority as any,
      });

      if (result.success) {
        toast.success("Complaint created successfully");
        setDialogOpen(false);
        resetForm();
        loadComplaints();
      } else {
        toast.error(result.error || "Failed to create complaint");
      }
    } catch (error) {
      console.error("Error creating complaint:", error);
      toast.error("An error occurred while creating complaint");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: string) => {
    try {
      const result = await updateComplaintStatus(complaintId, {
        status: newStatus as any,
      });

      if (result.success) {
        toast.success("Status updated successfully");
        loadComplaints();
        if (selectedComplaint?.id === complaintId) {
          setDetailDialogOpen(false);
          setSelectedComplaint(null);
        }
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("An error occurred while updating status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-gray-100 text-gray-800";
      case "MEDIUM":
        return "bg-blue-100 text-blue-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hostel Complaints</h1>
          <p className="text-muted-foreground">Manage and resolve hostel complaints</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Complaint
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Complaint</DialogTitle>
                <DialogDescription>Submit a new hostel complaint</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="hostelId">
                    Hostel <span className="text-red-500">*</span>
                  </Label>
                  <Select value={hostelId} onValueChange={setHostelId}>
                    <SelectTrigger id="hostelId">
                      <SelectValue placeholder="Select hostel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hostels.map((hostel) => (
                        <SelectItem key={hostel.id} value={hostel.id}>
                          {hostel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROOM_MAINTENANCE">Room Maintenance</SelectItem>
                        <SelectItem value="MESS_FOOD">Mess Food</SelectItem>
                        <SelectItem value="CLEANLINESS">Cleanliness</SelectItem>
                        <SelectItem value="ELECTRICITY">Electricity</SelectItem>
                        <SelectItem value="WATER">Water</SelectItem>
                        <SelectItem value="SECURITY">Security</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed description of the complaint"
                    rows={4}
                    required
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
                  {submitting ? "Submitting..." : "Submit Complaint"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
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
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Complaints ({complaints.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No complaints found</p>
              <p className="text-sm">All complaints will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{complaint.subject}</h3>
                      <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                      <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                      <Badge variant="outline">{complaint.category.replace("_", " ")}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <strong>Student:</strong> {complaint.student.user.firstName}{" "}
                        {complaint.student.user.lastName}
                      </p>
                      <p>
                        <strong>Hostel:</strong> {complaint.hostel.name}
                      </p>
                      <p>
                        <strong>Submitted:</strong> {format(new Date(complaint.createdAt), "PPp")}
                      </p>
                      <p className="line-clamp-2">{complaint.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setDetailDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedComplaint && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedComplaint.subject}</DialogTitle>
                <DialogDescription>Complaint Details</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getStatusColor(selectedComplaint.status)}>
                    {selectedComplaint.status}
                  </Badge>
                  <Badge className={getPriorityColor(selectedComplaint.priority)}>
                    {selectedComplaint.priority}
                  </Badge>
                  <Badge variant="outline">{selectedComplaint.category.replace("_", " ")}</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <strong>Student:</strong> {selectedComplaint.student.user.firstName}{" "}
                      {selectedComplaint.student.user.lastName}
                    </div>
                    <div>
                      <strong>Hostel:</strong> {selectedComplaint.hostel.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedComplaint.student.user.email}
                    </div>
                    <div>
                      <strong>Phone:</strong> {selectedComplaint.student.user.phone || "N/A"}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <strong>Submitted:</strong> {format(new Date(selectedComplaint.createdAt), "PPpp")}
                  </div>

                  {selectedComplaint.resolvedAt && (
                    <div>
                      <strong>Resolved:</strong>{" "}
                      {format(new Date(selectedComplaint.resolvedAt), "PPpp")}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <div className="p-3 bg-muted rounded-md text-sm">{selectedComplaint.description}</div>
                </div>

                {selectedComplaint.resolution && (
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                      {selectedComplaint.resolution}
                    </div>
                  </div>
                )}

                {selectedComplaint.status !== "CLOSED" && selectedComplaint.status !== "RESOLVED" && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label>Update Status</Label>
                    <div className="flex gap-2">
                      {selectedComplaint.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(selectedComplaint.id, "IN_PROGRESS")}
                        >
                          Mark In Progress
                        </Button>
                      )}
                      {(selectedComplaint.status === "PENDING" ||
                        selectedComplaint.status === "IN_PROGRESS") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50"
                          onClick={() => handleUpdateStatus(selectedComplaint.id, "RESOLVED")}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    setSelectedComplaint(null);
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
