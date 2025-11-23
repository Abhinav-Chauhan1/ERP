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
import { Bed, Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getHostels,
  getHostelRooms,
  createHostelRoom,
  updateHostelRoom,
  deleteHostelRoom,
} from "@/lib/actions/hostelActions";
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

export default function HostelRoomsPage() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [roomType, setRoomType] = useState<"SINGLE" | "DOUBLE" | "SHARED">("SHARED");
  const [capacity, setCapacity] = useState("");
  const [amenities, setAmenities] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [status, setStatus] = useState("AVAILABLE");

  useEffect(() => {
    loadHostels();
  }, []);

  useEffect(() => {
    if (selectedHostel) {
      loadRooms();
    }
  }, [selectedHostel]);

  const loadHostels = async () => {
    try {
      const result = await getHostels();
      if (result.success && result.data) {
        setHostels(result.data);
        if (result.data.length > 0 && !selectedHostel) {
          setSelectedHostel(result.data[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading hostels:", error);
    }
  };

  const loadRooms = async () => {
    if (!selectedHostel) return;
    setLoading(true);
    try {
      const result = await getHostelRooms(selectedHostel);
      if (result.success && result.data) {
        setRooms(result.data);
      } else {
        toast.error("Failed to load rooms");
      }
    } catch (error) {
      console.error("Error loading rooms:", error);
      toast.error("An error occurred while loading rooms");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRoomNumber("");
    setFloor("");
    setRoomType("SHARED");
    setCapacity("");
    setAmenities("");
    setMonthlyFee("");
    setStatus("AVAILABLE");
    setEditingRoom(null);
  };

  const handleOpenDialog = (room?: any) => {
    if (room) {
      setEditingRoom(room);
      setRoomNumber(room.roomNumber);
      setFloor(room.floor?.toString() || "");
      setRoomType(room.roomType);
      setCapacity(room.capacity.toString());
      setAmenities(room.amenities || "");
      setMonthlyFee(room.monthlyFee.toString());
      setStatus(room.status);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomNumber || !capacity || !monthlyFee) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!selectedHostel) {
      toast.error("Please select a hostel");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        hostelId: selectedHostel,
        roomNumber,
        floor: floor ? parseInt(floor) : undefined,
        roomType,
        capacity: parseInt(capacity),
        amenities: amenities || undefined,
        monthlyFee: parseFloat(monthlyFee),
        status,
      };

      let result;
      if (editingRoom) {
        result = await updateHostelRoom(editingRoom.id, data);
      } else {
        result = await createHostelRoom(data);
      }

      if (result.success) {
        toast.success(editingRoom ? "Room updated successfully" : "Room created successfully");
        setDialogOpen(false);
        resetForm();
        loadRooms();
      } else {
        toast.error(result.error || "Failed to save room");
      }
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error("An error occurred while saving room");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!roomToDelete) return;

    try {
      const result = await deleteHostelRoom(roomToDelete);
      if (result.success) {
        toast.success("Room deleted successfully");
        loadRooms();
      } else {
        toast.error(result.error || "Failed to delete room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("An error occurred while deleting room");
    } finally {
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "OCCUPIED":
        return "bg-blue-100 text-blue-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";
      case "RESERVED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case "SINGLE":
        return "bg-indigo-100 text-indigo-800";
      case "DOUBLE":
        return "bg-cyan-100 text-cyan-800";
      case "SHARED":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const selectedHostelData = hostels.find((h) => h.id === selectedHostel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hostel Rooms</h1>
          <p className="text-muted-foreground">Manage rooms and allocations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={!selectedHostel}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
                <DialogDescription>
                  {editingRoom ? "Update room information" : "Create a new room"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">
                      Room Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="roomNumber"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g., 101"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="floor">Floor</Label>
                    <Input
                      id="floor"
                      type="number"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder="e.g., 1"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="roomType">
                      Room Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={roomType} onValueChange={(value: any) => setRoomType(value)}>
                      <SelectTrigger id="roomType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Single</SelectItem>
                        <SelectItem value="DOUBLE">Double</SelectItem>
                        <SelectItem value="SHARED">Shared</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">
                      Capacity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="e.g., 4"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyFee">
                    Monthly Fee (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="monthlyFee"
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    placeholder="e.g., 5000"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                  <Input
                    id="amenities"
                    value={amenities}
                    onChange={(e) => setAmenities(e.target.value)}
                    placeholder="e.g., AC, Attached Bathroom, WiFi"
                  />
                </div>

                {editingRoom && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="OCCUPIED">Occupied</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="RESERVED">Reserved</SelectItem>
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
                  {submitting ? "Saving..." : editingRoom ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hostel Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Hostel</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedHostel} onValueChange={setSelectedHostel}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a hostel" />
            </SelectTrigger>
            <SelectContent>
              {hostels.map((hostel) => (
                <SelectItem key={hostel.id} value={hostel.id}>
                  {hostel.name} ({hostel.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Rooms Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !selectedHostel ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bed className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hostel selected</p>
            <p className="text-sm text-muted-foreground">Please select a hostel to view rooms</p>
          </CardContent>
        </Card>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bed className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No rooms found</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add rooms to {selectedHostelData?.name}
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Bed className="h-5 w-5" />
                      Room {room.roomNumber}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getRoomTypeColor(room.roomType)}>{room.roomType}</Badge>
                      <Badge className={getStatusColor(room.status)}>{room.status}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {room.floor !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Floor:</span>
                    <span className="font-medium">{room.floor}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {room.currentOccupancy}/{room.capacity}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Fee:</span>
                  <span className="font-medium">₹{room.monthlyFee.toLocaleString()}</span>
                </div>

                {room.amenities && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Amenities:</p>
                    <p className="text-sm">{room.amenities}</p>
                  </div>
                )}

                {room.allocations && room.allocations.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Students:</p>
                    <div className="space-y-1">
                      {room.allocations.map((allocation: any) => (
                        <p key={allocation.id} className="text-sm">
                          {allocation.student.user.firstName} {allocation.student.user.lastName}
                          {allocation.bedNumber && ` (Bed ${allocation.bedNumber})`}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(room)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      setRoomToDelete(room.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the room. This action cannot be undone.
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
