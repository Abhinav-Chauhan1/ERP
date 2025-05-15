"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Building, CircleUser, EyeOff, ListFilter,
  Search, SlidersHorizontal, ChevronDown,
  MoreVertical, Check, MapPin, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import * as z from "zod";

// Mock data - replace with actual API calls
const roomsData = [
  {
    id: "1",
    name: "Science Block - 101",
    building: "Science Block",
    floor: "1st Floor",
    type: "Classroom",
    capacity: 40,
    hasProjector: true,
    hasSmartBoard: true,
    hasAC: true,
    currentClass: "Grade 10 Science - Section A",
    description: "Classroom equipped with laboratory setup for science experiments",
    status: "In Use"
  },
  {
    id: "2",
    name: "Science Block - 102",
    building: "Science Block",
    floor: "1st Floor",
    type: "Classroom",
    capacity: 40,
    hasProjector: true,
    hasSmartBoard: true,
    hasAC: true,
    currentClass: "Grade 10 Science - Section B",
    description: "Classroom equipped with laboratory setup for science experiments",
    status: "In Use"
  },
  {
    id: "3",
    name: "Science Block - 201",
    building: "Science Block",
    floor: "2nd Floor",
    type: "Classroom",
    capacity: 30,
    hasProjector: true,
    hasSmartBoard: false,
    hasAC: true,
    currentClass: "Grade 11 Science - Section A",
    description: "Regular classroom for theory classes",
    status: "In Use"
  },
  {
    id: "4",
    name: "Science Lab",
    building: "Science Block",
    floor: "Ground Floor",
    type: "Laboratory",
    capacity: 30,
    hasProjector: true,
    hasSmartBoard: true,
    hasAC: true,
    currentClass: null,
    description: "Fully equipped science laboratory for physics, chemistry and biology experiments",
    status: "Available"
  },
  {
    id: "5",
    name: "Commerce Block - 201",
    building: "Commerce Block",
    floor: "2nd Floor",
    type: "Classroom",
    capacity: 35,
    hasProjector: true,
    hasSmartBoard: false,
    hasAC: true,
    currentClass: "Grade 10 Commerce - Section A",
    description: "Regular classroom for theory classes",
    status: "In Use"
  },
  {
    id: "6",
    name: "Main Block - 101",
    building: "Main Block",
    floor: "1st Floor",
    type: "Classroom",
    capacity: 40,
    hasProjector: true,
    hasSmartBoard: false,
    hasAC: false,
    currentClass: "Grade 9 - Section A",
    description: "Standard classroom",
    status: "In Use"
  },
  {
    id: "7",
    name: "Main Block - 102",
    building: "Main Block",
    floor: "1st Floor",
    type: "Classroom",
    capacity: 40,
    hasProjector: true,
    hasSmartBoard: false,
    hasAC: false,
    currentClass: "Grade 9 - Section B",
    description: "Standard classroom",
    status: "In Use"
  },
  {
    id: "8",
    name: "Computer Lab",
    building: "Main Block",
    floor: "Ground Floor",
    type: "Laboratory",
    capacity: 30,
    hasProjector: true,
    hasSmartBoard: true,
    hasAC: true,
    currentClass: null,
    description: "Equipped with 30 desktop computers and high-speed internet",
    status: "Available"
  },
  {
    id: "9",
    name: "Library",
    building: "Main Block",
    floor: "2nd Floor",
    type: "Library",
    capacity: 60,
    hasProjector: false,
    hasSmartBoard: false,
    hasAC: true,
    currentClass: null,
    description: "Central library with study area and extensive book collection",
    status: "Available"
  },
  {
    id: "10",
    name: "Arts Block - 301",
    building: "Arts Block",
    floor: "3rd Floor",
    type: "Classroom",
    capacity: 30,
    hasProjector: true,
    hasSmartBoard: false,
    hasAC: true,
    currentClass: "Grade 11 Arts - Section A",
    description: "Classroom for humanities and arts subjects",
    status: "In Use"
  },
  {
    id: "11",
    name: "Junior Block - 201",
    building: "Junior Block",
    floor: "2nd Floor",
    type: "Classroom",
    capacity: 35,
    hasProjector: true,
    hasSmartBoard: false,
    hasAC: false,
    currentClass: "Grade 8 - Section A",
    description: "Standard classroom for junior grades",
    status: "In Use"
  },
  {
    id: "12",
    name: "Auditorium",
    building: "Main Block",
    floor: "Ground Floor",
    type: "Auditorium",
    capacity: 200,
    hasProjector: true,
    hasSmartBoard: false,
    hasAC: true,
    currentClass: null,
    description: "Large auditorium for school events and assemblies",
    status: "Available"
  },
];

// Building options
const buildings = [
  "Science Block",
  "Commerce Block",
  "Arts Block",
  "Main Block",
  "Junior Block"
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

// Form schema
const roomFormSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters"),
  building: z.string({
    required_error: "Please select a building",
  }),
  floor: z.string({
    required_error: "Please select a floor",
  }),
  type: z.string({
    required_error: "Please select a room type",
  }),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").max(300, "Capacity should not exceed 300"),
  hasProjector: z.boolean().default(false),
  hasSmartBoard: z.boolean().default(false),
  hasAC: z.boolean().default(false),
  description: z.string().optional(),
});

export default function ClassroomsPage() {
  const [rooms, setRooms] = useState(roomsData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
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

  const form = useForm<z.infer<typeof roomFormSchema>>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      hasProjector: false,
      hasSmartBoard: false,
      hasAC: false,
      capacity: 40,
    },
  });

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

  function onSubmit(values: z.infer<typeof roomFormSchema>) {
    console.log("Form submitted:", values);
    
    const roomData = {
      id: selectedRoomId || String(rooms.length + 1),
      name: values.name,
      building: values.building,
      floor: values.floor,
      type: values.type,
      capacity: values.capacity,
      hasProjector: values.hasProjector,
      hasSmartBoard: values.hasSmartBoard,
      hasAC: values.hasAC,
      description: values.description || "",
      currentClass: selectedRoomId ? rooms.find(r => r.id === selectedRoomId)?.currentClass || null : null,
      status: selectedRoomId ? rooms.find(r => r.id === selectedRoomId)?.status || "Available" : "Available"
    };
    
    if (selectedRoomId) {
      // Update existing room
      setRooms(rooms.map(room => 
        room.id === selectedRoomId ? roomData : room
      ));
    } else {
      // Add new room
      setRooms([...rooms, roomData]);
    }
    
    setDialogOpen(false);
    form.reset();
    setSelectedRoomId(null);
  }

  function handleEditRoom(id: string) {
    const roomToEdit = rooms.find(room => room.id === id);
    if (roomToEdit) {
      form.reset({
        name: roomToEdit.name,
        building: roomToEdit.building,
        floor: roomToEdit.floor,
        type: roomToEdit.type,
        capacity: roomToEdit.capacity,
        hasProjector: roomToEdit.hasProjector,
        hasSmartBoard: roomToEdit.hasSmartBoard,
        hasAC: roomToEdit.hasAC,
        description: roomToEdit.description,
      });
      
      setSelectedRoomId(id);
      setDialogOpen(true);
    }
  }

  function handleDeleteRoom(id: string) {
    setSelectedRoomId(id);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (selectedRoomId) {
      setRooms(rooms.filter(room => room.id !== selectedRoomId));
      setDeleteDialogOpen(false);
      setSelectedRoomId(null);
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
            <Button>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            max={300} 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>Features</FormLabel>
                  <div className="flex flex-wrap gap-6">
                    <FormField
                      control={form.control}
                      name="hasProjector"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            Projector
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hasSmartBoard"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            Smart Board
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hasAC"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            Air Conditioning
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
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

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Classrooms and Teaching Spaces</CardTitle>
          <CardDescription>
            Manage all your classrooms, labs, and other teaching areas
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          
          {filteredRooms.length === 0 && (
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
                  <strong>Warning:</strong> This classroom is currently assigned to a class. Deleting it will remove the assignment.
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
