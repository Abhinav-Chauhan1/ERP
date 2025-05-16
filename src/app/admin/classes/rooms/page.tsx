"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Building, CircleUser, EyeOff, ListFilter,
  Search, SlidersHorizontal, ChevronDown,
  MoreVertical, Check, MapPin, X, Loader2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

// Import schema validation and actions
import { roomSchema, RoomFormValues } from "@/lib/schemaValidation/roomsSchemaValidation";
import { getRooms, createRoom, updateRoom, deleteRoom, getRoomUsageStats } from "@/lib/actions/roomsActions";

// Building options
const buildings = [
  "Science Block",
  "Commerce Block",
  "Arts Block",
  "Main Block",
  "Junior Block",
  "Computer Block",
  "Administration Block"
];

// Floor options
const floors = [
  "Ground Floor",
  "1st Floor",
  "2nd Floor",
  "3rd Floor",
  "4th Floor",
  "Basement"
];

// Room type options
const roomTypes = [
  "Classroom",
  "Laboratory",
  "Auditorium",
  "Library",
  "Staff Room",
  "Conference Room",
  "Activity Room"
];

// Features options
const features = [
  "Projector",
  "Smart Board",
  "AC",
  "Computer",
  "Audio System",
  "Internet",
  "Lab Equipment"
];

export default function ClassroomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    building: [] as string[],
    roomType: [] as string[],
    availability: [] as string[],
    hasProjector: false,
    hasSmartBoard: false,
    hasAC: false,
  });

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "",
      building: "",
      floor: "",
      type: "",
      capacity: 40,
      features: [],
      description: "",
    },
  });

  useEffect(() => {
    fetchRooms();
    fetchRoomStats();
  }, []);

  async function fetchRooms() {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getRooms();
      
      if (result.success) {
        setRooms(result.data || []);
      } else {
        setError(result.error || "An error occurred");
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoomStats() {
    try {
      const result = await getRoomUsageStats();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function onSubmit(values: RoomFormValues) {
    try {
      let result;
      
      if (selectedRoomId) {
        // Update existing room
        result = await updateRoom({ ...values, id: selectedRoomId });
      } else {
        // Create new room
        result = await createRoom(values);
      }
      
      if (result.success) {
        toast.success(`Classroom ${selectedRoomId ? "updated" : "created"} successfully`);
        setDialogOpen(false);
        form.reset();
        setSelectedRoomId(null);
        fetchRooms();
        fetchRoomStats();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEditRoom(id: string) {
    const roomToEdit = rooms.find(room => room.id === id);
    if (roomToEdit) {
      // Extract features from room data
      const roomFeatures = [];
      if (roomToEdit.hasProjector) roomFeatures.push("Projector");
      if (roomToEdit.hasSmartBoard) roomFeatures.push("Smart Board");
      if (roomToEdit.hasAC) roomFeatures.push("AC");
      
      form.reset({
        name: roomToEdit.name,
        building: roomToEdit.building,
        floor: roomToEdit.floor,
        type: roomToEdit.type,
        capacity: roomToEdit.capacity,
        features: roomFeatures,
        description: roomToEdit.description,
      });
      
      setSelectedRoomId(id);
      setDialogOpen(true);
    }
  }

  async function handleDeleteRoom(id: string) {
    setSelectedRoomId(id);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (selectedRoomId) {
      try {
        const result = await deleteRoom(selectedRoomId);
        
        if (result.success) {
          toast.success("Classroom deleted successfully");
          setDeleteDialogOpen(false);
          setSelectedRoomId(null);
          fetchRooms();
          fetchRoomStats();
        } else {
          toast.error(result.error || "Failed to delete classroom");
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred");
      }
    }
  }

  function toggleBuildingFilter(building: string) {
    setFilters(prev => {
      const currentBuildings = [...prev.building];
      if (currentBuildings.includes(building)) {
        return { ...prev, building: currentBuildings.filter(b => b !== building) };
      } else {
        return { ...prev, building: [...currentBuildings, building] };
      }
    });
  }

  function toggleRoomTypeFilter(type: string) {
    setFilters(prev => {
      const currentTypes = [...prev.roomType];
      if (currentTypes.includes(type)) {
        return { ...prev, roomType: currentTypes.filter(t => t !== type) };
      } else {
        return { ...prev, roomType: [...currentTypes, type] };
      }
    });
  }

  function toggleAvailabilityFilter(availability: string) {
    setFilters(prev => {
      const currentAvailability = [...prev.availability];
      if (currentAvailability.includes(availability)) {
        return { ...prev, availability: currentAvailability.filter(a => a !== availability) };
      } else {
        return { ...prev, availability: [...currentAvailability, availability] };
      }
    });
  }

  function resetFilters() {
    setFilters({
      building: [],
      roomType: [],
      availability: [],
      hasProjector: false,
      hasSmartBoard: false,
      hasAC: false,
    });
    setSearchTerm("");
  }

  function getActiveFilterCount() {
    let count = 0;
    count += filters.building.length;
    count += filters.roomType.length;
    count += filters.availability.length;
    if (filters.hasProjector) count++;
    if (filters.hasSmartBoard) count++;
    if (filters.hasAC) count++;
    return count;
  }

  // Apply filters and search term
  const filteredRooms = rooms.filter(room => {
    // Check search term
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        room.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        false;
    
    // Check building filter
    const matchesBuilding = filters.building.length === 0 || 
                           filters.building.includes(room.building);
    
    // Check room type filter
    const matchesRoomType = filters.roomType.length === 0 || 
                           filters.roomType.includes(room.type);
    
    // Check availability filter
    const matchesAvailability = filters.availability.length === 0 || 
                              (filters.availability.includes('Available') && room.status === 'Available') ||
                              (filters.availability.includes('In Use') && room.status === 'In Use');
    
    // Check features
    const matchesProjector = !filters.hasProjector || room.hasProjector;
    const matchesSmartBoard = !filters.hasSmartBoard || room.hasSmartBoard;
    const matchesAC = !filters.hasAC || room.hasAC;
    
    return matchesSearch && matchesBuilding && matchesRoomType && 
           matchesAvailability && matchesProjector && matchesSmartBoard && matchesAC;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/classes">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Classes
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Classroom Management</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              form.reset({
                name: "",
                building: "",
                floor: "",
                type: "",
                capacity: 40,
                features: [],
                description: "",
              });
              setSelectedRoomId(null);
              setDialogOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Classroom
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{selectedRoomId ? "Edit Classroom" : "Add New Classroom"}</DialogTitle>
              <DialogDescription>
                {selectedRoomId 
                  ? "Update the details of the existing classroom." 
                  : "Add a new classroom or teaching space to your school."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Science Block - 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="building"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select building" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buildings.map((building) => (
                              <SelectItem key={building} value={building}>
                                {building}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select floor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {floors.map((floor) => (
                              <SelectItem key={floor} value={floor}>
                                {floor}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roomTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={500} 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel>Features</FormLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {features.map((feature) => (
                          <FormItem key={feature} className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={form.watch("features")?.includes(feature)}
                                onCheckedChange={(checked) => {
                                  const currentFeatures = form.watch("features") || [];
                                  if (checked) {
                                    form.setValue("features", [...currentFeatures, feature]);
                                  } else {
                                    form.setValue(
                                      "features",
                                      currentFeatures.filter(f => f !== feature)
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {feature}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the room and its features" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    {selectedRoomId ? "Save Changes" : "Add Classroom"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Classrooms and Teaching Spaces</CardTitle>
          <CardDescription>
            Manage all your classrooms, labs, and other teaching areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 flex flex-row items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rooms</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Building className="h-8 w-8 text-blue-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-row items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold">{stats.available}</p>
                  </div>
                  <Check className="h-8 w-8 text-green-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-row items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Use</p>
                    <p className="text-2xl font-bold">{stats.inUse}</p>
                  </div>
                  <Users className="h-8 w-8 text-indigo-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-row items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Utilization</p>
                    <p className="text-2xl font-bold">{stats.utilizationRate.toFixed(1)}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-500" />
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search by name, building, or description..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {getActiveFilterCount() > 0 && (
                      <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                        {getActiveFilterCount()}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Building</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {buildings.map((building) => (
                          <div key={building} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`filter-building-${building}`} 
                              checked={filters.building.includes(building)}
                              onCheckedChange={() => toggleBuildingFilter(building)}
                            />
                            <label 
                              htmlFor={`filter-building-${building}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {building}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Room Type</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roomTypes.slice(0, 6).map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`filter-type-${type}`} 
                              checked={filters.roomType.includes(type)}
                              onCheckedChange={() => toggleRoomTypeFilter(type)}
                            />
                            <label 
                              htmlFor={`filter-type-${type}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Availability</h4>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="filter-available" 
                            checked={filters.availability.includes('Available')}
                            onCheckedChange={() => toggleAvailabilityFilter('Available')}
                          />
                          <label 
                            htmlFor="filter-available"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Available
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="filter-in-use" 
                            checked={filters.availability.includes('In Use')}
                            onCheckedChange={() => toggleAvailabilityFilter('In Use')}
                          />
                          <label 
                            htmlFor="filter-in-use"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            In Use
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Features</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="filter-projector" 
                            checked={filters.hasProjector}
                            onCheckedChange={() => setFilters(prev => ({ ...prev, hasProjector: !prev.hasProjector }))}
                          />
                          <label 
                            htmlFor="filter-projector"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Projector
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="filter-smartboard" 
                            checked={filters.hasSmartBoard}
                            onCheckedChange={() => setFilters(prev => ({ ...prev, hasSmartBoard: !prev.hasSmartBoard }))}
                          />
                          <label 
                            htmlFor="filter-smartboard"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Smart Board
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="filter-ac" 
                            checked={filters.hasAC}
                            onCheckedChange={() => setFilters(prev => ({ ...prev, hasAC: !prev.hasAC }))}
                          />
                          <label 
                            htmlFor="filter-ac"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Air Conditioning
                          </label>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" onClick={resetFilters} className="mt-2">
                      Reset Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Display active filters */}
          {getActiveFilterCount() > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.building.map(building => (
                <Badge key={building} variant="outline" className="flex items-center gap-1">
                  {building}
                  <button 
                    onClick={() => toggleBuildingFilter(building)}
                    className="ml-1 rounded-full hover:bg-gray-100 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.roomType.map(type => (
                <Badge key={type} variant="outline" className="flex items-center gap-1">
                  {type}
                  <button 
                    onClick={() => toggleRoomTypeFilter(type)}
                    className="ml-1 rounded-full hover:bg-gray-100 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.availability.map(status => (
                <Badge key={status} variant="outline" className="flex items-center gap-1">
                  {status}
                  <button 
                    onClick={() => toggleAvailabilityFilter(status)}
                    className="ml-1 rounded-full hover:bg-gray-100 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.hasProjector && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Projector
                  <button 
                    onClick={() => setFilters(prev => ({ ...prev, hasProjector: false }))}
                    className="ml-1 rounded-full hover:bg-gray-100 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.hasSmartBoard && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Smart Board
                  <button 
                    onClick={() => setFilters(prev => ({ ...prev, hasSmartBoard: false }))}
                    className="ml-1 rounded-full hover:bg-gray-100 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.hasAC && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Air Conditioning
                  <button 
                    onClick={() => setFilters(prev => ({ ...prev, hasAC: false }))}
                    className="ml-1 rounded-full hover:bg-gray-100 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 px-2 text-xs">
                Clear All
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredRooms.map((room) => (
                <Card key={room.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="h-5 w-5 text-blue-500" />
                        {room.name}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Room Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditRoom(room.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Room
                          </DropdownMenuItem>
                          {room.status === "In Use" ? (
                            <DropdownMenuItem>
                              <CircleUser className="h-4 w-4 mr-2" />
                              View Assigned Class
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem>
                              <Check className="h-4 w-4 mr-2" />
                              Assign to Class
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Room
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="h-3 w-3" />
                        {room.building}, {room.floor}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center text-sm">
                        <span>Type:</span>
                        <span className="font-medium">{room.type}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Capacity:</span>
                        <span className="font-medium">{room.capacity} students</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Status:</span>
                        <Badge className={`${
                          room.status === 'Available' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                          'bg-blue-100 text-blue-800 hover:bg-blue-100'
                        }`}>
                          {room.status}
                        </Badge>
                      </div>
                      {room.currentClass && (
                        <div className="flex justify-between items-center text-sm">
                          <span>Current Class:</span>
                          <span className="font-medium">{room.currentClass}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {room.hasProjector && (
                        <Badge variant="outline" className="text-xs bg-gray-50">Projector</Badge>
                      )}
                      {room.hasSmartBoard && (
                        <Badge variant="outline" className="text-xs bg-gray-50">Smart Board</Badge>
                      )}
                      {room.hasAC && (
                        <Badge variant="outline" className="text-xs bg-gray-50">AC</Badge>
                      )}
                    </div>
                    
                    {room.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-2">{room.description}</p>
                    )}

                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => handleEditRoom(room.id)}>
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      {room.status === "Available" ? (
                        <Button variant="outline" size="sm">
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Assign
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                          Unassign
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredRooms.length === 0 && (
            <div className="text-center py-10">
              <Building className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No classrooms found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {getActiveFilterCount() > 0 
                  ? "Try adjusting your filters or search terms" 
                  : "No classrooms have been added yet"}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Classroom
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Classroom</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this classroom? This action cannot be undone.
              {rooms.find(r => r.id === selectedRoomId)?.status === 'In Use' && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                  <strong>Warning:</strong> This classroom is currently assigned to a class. Please unassign it before deleting.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Missing component for Activity icon
function Activity({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

// Missing component for Users icon
function Users({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
