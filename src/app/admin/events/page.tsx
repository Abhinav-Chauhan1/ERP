"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast"; // Replace useToast with react-hot-toast
import { 
  PlusCircle, Calendar, Search, Filter, 
  Tag, Users, MapPin, Clock, 
  ChevronRight, CheckCircle, XCircle, AlertCircle, 
  Calendar as CalendarIcon, ArrowUpRight, Eye, Edit, Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { 
  eventSchemaWithRefinement, 
  EventTypeEnum,
  EventStatusEnum,
  type EventFormDataWithRefinement,
  type EventFilterData,
} from "@/lib/schemaValidation/eventSchemaValidation";

import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  updateEventStatus
} from "@/lib/actions/eventActions";

// Utility function to format dates
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Utility function to format time
const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EventsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [events, setEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  // Initialize create form
  const createForm = useForm<EventFormDataWithRefinement>({
    resolver: zodResolver(eventSchemaWithRefinement),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(new Date().setHours(new Date().getHours() + 2)), // 2 hours later
      isPublic: true,
      status: "UPCOMING",
    },
  });

  // Initialize edit form
  const editForm = useForm<EventFormDataWithRefinement>({
    resolver: zodResolver(eventSchemaWithRefinement),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      isPublic: true,
      status: "UPCOMING",
    },
  });

  // Load events on initial render and when filters change
  useEffect(() => {
    fetchEvents();
    fetchUpcomingEvents();
  }, [typeFilter, statusFilter, activeTab]);
  
  // Function to fetch events with the current filters
  const fetchEvents = async () => {
    setIsLoading(true);
    
    const filter: EventFilterData = {};
    
    if (searchTerm) {
      filter.searchTerm = searchTerm;
    }
    
    if (typeFilter) {
      filter.type = typeFilter;
    }
    
    if (statusFilter) {
      filter.status = statusFilter;
    }
    
    // If viewing upcoming tab, filter for upcoming events
    if (activeTab === "upcoming") {
      filter.status = "UPCOMING";
      filter.startDate = new Date();
    }
    
    // If viewing past tab, filter for past events
    if (activeTab === "past") {
      filter.endDate = new Date();
    }
    
    const result = await getEvents(filter);
    
    if (result.success && result.data) { // Add check for result.data
      setEvents(result.data);
    } else {
      toast.error(result.error || "Failed to fetch events");
    }
    
    setIsLoading(false);
  };
  
  // Function to fetch upcoming events for the dashboard
  const fetchUpcomingEvents = async () => {
    const result = await getUpcomingEvents(3);
    
    if (result.success && result.data) { // Add check for result.data
      setUpcomingEvents(result.data);
    } else {
      toast.error(result.error || "Failed to fetch upcoming events");
    }
  };
  
  // Handle search input
  const handleSearch = () => {
    fetchEvents();
  };
  
  // Handle event creation
  const handleCreateEvent = async (data: EventFormDataWithRefinement) => {
    const result = await createEvent(data);
    
    if (result.success && result.data) { // Add check for result.data
      toast.success("Event created successfully");
      setCreateDialogOpen(false);
      createForm.reset();
      fetchEvents();
      fetchUpcomingEvents();
    } else {
      toast.error(result.error || "Failed to create event");
    }
  };
  
  // Handle event update
  const handleUpdateEvent = async (data: EventFormDataWithRefinement) => {
    if (!selectedEvent) return;
    
    const result = await updateEvent(selectedEvent.id, data);
    
    if (result.success && result.data) { // Add check for result.data
      toast.success("Event updated successfully");
      setEditDialogOpen(false);
      setSelectedEvent(null);
      fetchEvents();
      fetchUpcomingEvents();
    } else {
      toast.error(result.error || "Failed to update event");
    }
  };
  
  // Handle event deletion
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    const result = await deleteEvent(selectedEvent.id);
    
    if (result.success) {
      toast.success("Event deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
      fetchEvents();
      fetchUpcomingEvents();
    } else {
      toast.error(result.error || "Failed to delete event");
    }
  };
  
  // Handle status update
  const handleStatusUpdate = async (eventId: string, newStatus: any) => {
    const result = await updateEventStatus(eventId, newStatus);
    
    if (result.success && result.data) { // Add check for result.data
      toast.success(`Event status updated to ${newStatus}`);
      fetchEvents();
      fetchUpcomingEvents();
    } else {
      toast.error(result.error || "Failed to update event status");
    }
  };
  
  // Set up edit dialog with selected event data
  const setupEditDialog = (event: any) => {
    setSelectedEvent(event);
    
    editForm.reset({
      title: event.title,
      description: event.description || "",
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      location: event.location || "",
      organizer: event.organizer || "",
      type: event.type || undefined,
      status: event.status,
      maxParticipants: event.maxParticipants || undefined,
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : undefined,
      isPublic: event.isPublic,
      thumbnail: event.thumbnail || "",
    });
    
    setEditDialogOpen(true);
  };
  
  // Set up delete dialog
  const setupDeleteDialog = (event: any) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-100 text-blue-800";
      case "ONGOING":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "POSTPONED":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Get type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "ACADEMIC":
        return "bg-indigo-100 text-indigo-800";
      case "CULTURAL":
        return "bg-pink-100 text-pink-800";
      case "SPORTS":
        return "bg-emerald-100 text-emerald-800";
      case "ADMINISTRATIVE":
        return "bg-slate-100 text-slate-800";
      case "HOLIDAY":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Event Management</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Create a new event for your organization.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateEvent)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter event title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACADEMIC">Academic</SelectItem>
                            <SelectItem value="CULTURAL">Cultural</SelectItem>
                            <SelectItem value="SPORTS">Sports</SelectItem>
                            <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                            <SelectItem value="HOLIDAY">Holiday</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter event description" 
                          className="min-h-20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date and Time*</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field}
                            value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date and Time*</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field}
                            value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Event location" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="organizer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organizer</FormLabel>
                        <FormControl>
                          <Input placeholder="Event organizer" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Participants</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Leave empty for unlimited" 
                            {...field}
                            value={field.value || ""}
                            onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="registrationDeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Deadline</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field}
                            value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="thumbnail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Image URL for event thumbnail" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Public Event
                          </FormLabel>
                          <FormDescription>
                            Make this event visible to everyone
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit">Create Event</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
            <CardDescription>Next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {events.filter(event => 
                event.status === "UPCOMING" && 
                new Date(event.startDate) > new Date() && 
                new Date(event.startDate) < new Date(new Date().setDate(new Date().getDate() + 30))
              ).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Events</CardTitle>
            <CardDescription>Currently ongoing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {events.filter(event => event.status === "ONGOING").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Events</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className={getTypeBadgeColor(event.type || "OTHER")}>
                    {event.type || "Other"}
                  </Badge>
                  <Badge className={getStatusBadgeColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2">{event.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {event.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{formatDate(event.startDate)}</span>
                    {formatDate(event.startDate) !== formatDate(event.endDate) && 
                      <> - {formatDate(event.endDate)}</>
                    }
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {event._count.participants} 
                      {event.maxParticipants ? ` / ${event.maxParticipants}` : ""} participants
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <Link href={`/admin/events/${event.id}`}>
                  <Button variant="ghost" size="sm">
                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setupEditDialog(event)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setupDeleteDialog(event)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">No Upcoming Events</CardTitle>
              <CardDescription>
                Create a new event to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setCreateDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Create Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-xl">Event Management</CardTitle>
              <CardDescription>
                Create, edit, and manage events
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search events..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="flex gap-2">
                <Select 
                  value={typeFilter || "ALL"} 
                  onValueChange={(value) => setTypeFilter(value === "ALL" ? undefined : value)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="ACADEMIC">Academic</SelectItem>
                    <SelectItem value="CULTURAL">Cultural</SelectItem>
                    <SelectItem value="SPORTS">Sports</SelectItem>
                    <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                    <SelectItem value="HOLIDAY">Holiday</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={statusFilter || "ALL"} 
                  onValueChange={(value) => setStatusFilter(value === "ALL" ? undefined : value)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="UPCOMING">Upcoming</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="POSTPONED">Postponed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={handleSearch}>
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Events</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <svg
                  className="animate-spin h-8 w-8 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : events.length > 0 ? (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Event</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Type</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Participants</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(event => (
                      <tr key={event.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">
                          <div>{event.title}</div>
                          {event.location && (
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={getTypeBadgeColor(event.type || "OTHER")}>
                            {event.type || "Other"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div>{formatDate(event.startDate)}</div>
                          <div className="text-xs text-gray-500">
                            {formatTime(event.startDate)} - {formatTime(event.endDate)}
                          </div>
                          {formatDate(event.startDate) !== formatDate(event.endDate) && (
                            <div className="text-xs text-gray-500">
                              to {formatDate(event.endDate)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Select 
                            value={event.status}
                            onValueChange={(val) => handleStatusUpdate(event.id, val)}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue>
                                <Badge className={getStatusBadgeColor(event.status)}>
                                  {event.status}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UPCOMING">Upcoming</SelectItem>
                              <SelectItem value="ONGOING">Ongoing</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                              <SelectItem value="POSTPONED">Postponed</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {event._count.participants}
                          {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Link href={`/admin/events/${event.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setupEditDialog(event)}
                          >
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setupDeleteDialog(event)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10">
                <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <h3 className="text-lg font-medium mb-1">No events found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm || typeFilter || statusFilter
                    ? "Try adjusting your filters to find what you're looking for"
                    : "Get started by creating your first event"
                  }
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Event
                </Button>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the details of your event.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateEvent)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACADEMIC">Academic</SelectItem>
                          <SelectItem value="CULTURAL">Cultural</SelectItem>
                          <SelectItem value="SPORTS">Sports</SelectItem>
                          <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                          <SelectItem value="HOLIDAY">Holiday</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter event description" 
                        className="min-h-20" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date and Time*</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field}
                          value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date and Time*</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field}
                          value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Event location" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="organizer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizer</FormLabel>
                      <FormControl>
                        <Input placeholder="Event organizer" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Participants</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Leave empty for unlimited" 
                          {...field}
                          value={field.value || ""}
                          onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="registrationDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Deadline</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field}
                          value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UPCOMING">Upcoming</SelectItem>
                          <SelectItem value="ONGOING">Ongoing</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          <SelectItem value="POSTPONED">Postponed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="thumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Image URL for event thumbnail" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Public Event
                      </FormLabel>
                      <FormDescription>
                        Make this event visible to everyone
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Event</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedEvent && (
              <div className="border rounded-md p-4">
                <h3 className="font-medium">{selectedEvent.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(selectedEvent.startDate)} at {formatTime(selectedEvent.startDate)}
                </p>
                {selectedEvent._count && selectedEvent._count.participants > 0 && (
                  <div className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    This event has {selectedEvent._count.participants} registered participants who will be notified.
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEvent}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
