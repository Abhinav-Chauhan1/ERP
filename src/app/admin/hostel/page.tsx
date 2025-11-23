"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { Building2, Plus, Edit, Trash2, Users, Bed, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { createHostel, getHostels, updateHostel, deleteHostel } from "@/lib/actions/hostelActions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function HostelManagementPage() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hostelToDelete, setHostelToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("");
  const [wardenName, setWardenName] = useState("");
  const [wardenPhone, setWardenPhone] = useState("");
  const [type, setType] = useState<"BOYS" | "GIRLS" | "MIXED">("BOYS");
  const [status, setStatus] = useState("ACTIVE");

  useEffect(() => {
    loadHostels();
  }, []);

  const loadHostels = async () => {
    setLoading(true);
    try {
      const result = await getHostels();
      if (result.success && result.data) {
        setHostels(result.data);
      } else {
        toast.error("Failed to load hostels");
      }
    } catch (error) {
      console.error("Error loading hostels:", error);
      toast.error("An error occurred while loading hostels");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setAddress("");
    setCapacity("");
    setWardenName("");
    setWardenPhone("");
    setType("BOYS");
    setStatus("ACTIVE");
    setEditingHostel(null);
  };

  const handleOpenDialog = (hostel?: any) => {
    if (hostel) {
      setEditingHostel(hostel);
      setName(hostel.name);
      setAddress(hostel.address || "");
      setCapacity(hostel.capacity.toString());
      setWardenName(hostel.wardenName || "");
      setWardenPhone(hostel.wardenPhone || "");
      setType(hostel.type);
      setStatus(hostel.status);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !capacity) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name,
        address: address || undefined,
        capacity: parseInt(capacity),
        wardenName: wardenName || undefined,
        wardenPhone: wardenPhone || undefined,
        type,
        status,
      };

      let result;
      if (editingHostel) {
        result = await updateHostel(editingHostel.id, data);
      } else {
        result = await createHostel(data);
      }

      if (result.success) {
        toast.success(editingHostel ? "Hostel updated successfully" : "Hostel created successfully");
        setDialogOpen(false);
        resetForm();
        loadHostels();
      } else {
        toast.error(result.error || "Failed to save hostel");
      }
    } catch (error) {
      console.error("Error saving hostel:", error);
      toast.error("An error occurred while saving hostel");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!hostelToDelete) return;

    try {
      const result = await deleteHostel(hostelToDelete);
      if (result.success) {
        toast.success("Hostel deleted successfully");
        loadHostels();
      } else {
        toast.error(result.error || "Failed to delete hostel");
      }
    } catch (error) {
      console.error("Error deleting hostel:", error);
      toast.error("An error occurred while deleting hostel");
    } finally {
      setDeleteDialogOpen(false);
      setHostelToDelete(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "BOYS":
        return "bg-blue-100 text-blue-800";
      case "GIRLS":
        return "bg-pink-100 text-pink-800";
      case "MIXED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateOccupancy = (hostel: any) => {
    if (!hostel.rooms || hostel.rooms.length === 0) return 0;
    const totalOccupied = hostel.rooms.reduce((sum: number, room: any) => sum + room.currentOccupancy, 0);
    const totalCapacity = hostel.rooms.reduce((sum: number, room: any) => sum + room.capacity, 0);
    return totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hostel Management</h1>
          <p className="text-muted-foreground">Manage hostels, rooms, and allocations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Hostel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingHostel ? "Edit Hostel" : "Add New Hostel"}</DialogTitle>
                <DialogDescription>
                  {editingHostel ? "Update hostel information" : "Create a new hostel"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Hostel Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter hostel name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter hostel address"
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">
                      Total Capacity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="Enter capacity"
                      required
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">
                      Hostel Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={type} onValueChange={(value: any) => setType(value)}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOYS">Boys</SelectItem>
                        <SelectItem value="GIRLS">Girls</SelectItem>
                        <SelectItem value="MIXED">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wardenName">Warden Name</Label>
                  <Input
                    id="wardenName"
                    value={wardenName}
                    onChange={(e) => setWardenName(e.target.value)}
                    placeholder="Enter warden name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wardenPhone">Warden Phone</Label>
                  <Input
                    id="wardenPhone"
                    value={wardenPhone}
                    onChange={(e) => setWardenPhone(e.target.value)}
                    placeholder="Enter warden phone"
                  />
                </div>

                {editingHostel && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
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
                  {submitting ? "Saving..." : editingHostel ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hostels Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hostels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hostels found</p>
            <p className="text-sm text-muted-foreground mb-4">Get started by adding your first hostel</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Hostel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hostels.map((hostel) => {
            const occupancyRate = calculateOccupancy(hostel);
            const totalRooms = hostel._count.rooms;
            const activeComplaints = hostel._count.complaints;

            return (
              <Card key={hostel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {hostel.name}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getTypeColor(hostel.type)}>{hostel.type}</Badge>
                        <Badge className={getStatusColor(hostel.status)}>{hostel.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hostel.address && (
                    <p className="text-sm text-muted-foreground">{hostel.address}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="font-medium">{hostel.capacity} students</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rooms:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        {totalRooms}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Occupancy:</span>
                      <span className="font-medium">{occupancyRate}%</span>
                    </div>
                    {activeComplaints > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Complaints:</span>
                        <span className="font-medium flex items-center gap-1 text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          {activeComplaints}
                        </span>
                      </div>
                    )}
                  </div>

                  {hostel.wardenName && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium">Warden: {hostel.wardenName}</p>
                      {hostel.wardenPhone && (
                        <p className="text-sm text-muted-foreground">{hostel.wardenPhone}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDialog(hostel)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setHostelToDelete(hostel.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the hostel and all associated rooms. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
