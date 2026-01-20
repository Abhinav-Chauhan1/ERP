"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast"; // Replace useToast with react-hot-toast
import {
  ChevronLeft, Calendar, Clock, MapPin, Users, User,
  Edit, Trash2, Share2, Download, Tag, Globe, Lock,
  CheckCircle2, XCircle, Clock4, AlertCircle, MoreVertical,
  Plus, UserPlus, Mail, MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  eventParticipantSchema,
  eventSchemaWithRefinement,
  type EventFormDataWithRefinement,
  type EventParticipantData
} from "@/lib/schemaValidation/eventSchemaValidation";
import {
  getEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  addParticipant,
  removeParticipant,
  markAttendance,
  getEventParticipants
} from "@/lib/actions/eventActions";
import { getUsersForDropdown } from "@/lib/actions/userActions";
import * as z from "zod";

// Utility function to format dates
const formatDate = (date: Date | string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Utility function to format time
const formatTime = (date: Date | string) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Form schema for adding a participant
const addParticipantSchema = z.object({
  userId: z.string({
    required_error: "User ID is required",
  }),
  role: z.string().default("ATTENDEE"),
});

export default function EventDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addParticipantDialogOpen, setAddParticipantDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const eventId = params.id;

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

  // Initialize add participant form
  const participantForm = useForm<z.infer<typeof addParticipantSchema>>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: {
      role: "ATTENDEE",
    },
  });

  // Fetch event data
  useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      setLoading(true);
      try {
        const result = await getEvent(eventId);

        if (result.success && result.data) { // Add check for result.data
          setEvent(result.data);

          // Initialize edit form with event data
          editForm.reset({
            title: result.data.title,
            description: result.data.description || "",
            startDate: new Date(result.data.startDate),
            endDate: new Date(result.data.endDate),
            location: result.data.location || "",
            organizer: result.data.organizer || "",
            type: result.data.type && ['ACADEMIC', 'CULTURAL', 'SPORTS', 'ADMINISTRATIVE', 'HOLIDAY', 'OTHER'].includes(result.data.type)
              ? result.data.type as "ACADEMIC" | "CULTURAL" | "SPORTS" | "ADMINISTRATIVE" | "HOLIDAY" | "OTHER"
              : undefined,
            status: result.data.status,
            maxParticipants: result.data.maxParticipants || undefined,
            registrationDeadline: result.data.registrationDeadline ? new Date(result.data.registrationDeadline) : undefined,
            isPublic: result.data.isPublic,
            thumbnail: result.data.thumbnail || "",
          });

          // Also fetch participants if successful
          fetchParticipants(eventId);
        } else {
          toast.error(result.error || "Failed to fetch event");
          router.push("/admin/events");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        toast.error("An unexpected error occurred");
        router.push("/admin/events");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, router, editForm]);

  // Fetch participants
  const fetchParticipants = async (eventId: string) => {
    try {
      const result = await getEventParticipants(eventId);

      if (result.success && result.data) { // Add check for result.data
        setParticipants(result.data);
      } else {
        toast.error(result.error || "Failed to fetch participants");
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to fetch participants");
    }
  };

  // Fetch users for participant selection
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const result = await getUsersForDropdown();

      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        toast.error(result.error || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (addParticipantDialogOpen && users.length === 0) {
      fetchUsers();
    }
  }, [addParticipantDialogOpen, users.length]);

  // Handle event update
  const handleUpdateEvent = async (data: EventFormDataWithRefinement) => {
    try {
      const result = await updateEvent(eventId, data);

      if (result.success && result.data) { // Add check for result.data
        toast.success("Event updated successfully");
        setEditDialogOpen(false);

        // Update the local state
        setEvent(result.data);
      } else {
        toast.error(result.error || "Failed to update event");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async () => {
    try {
      const result = await deleteEvent(eventId);

      if (result.success) {
        toast.success("Event deleted successfully");
        router.push("/admin/events");
      } else {
        toast.error(result.error || "Failed to delete event");
        setDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("An unexpected error occurred");
      setDeleteDialogOpen(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const result = await updateEventStatus(eventId, newStatus as any);

      if (result.success && result.data) { // Add check for result.data
        toast.success(`Event status updated to ${newStatus}`);

        // Update the local state
        setEvent({ ...event, status: newStatus });
      } else {
        toast.error(result.error || "Failed to update event status");
      }
    } catch (error) {
      console.error("Error updating event status:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Handle add participant
  const handleAddParticipant = async (data: z.infer<typeof addParticipantSchema>) => {
    try {
      const participantData: EventParticipantData = {
        eventId: eventId,
        userId: data.userId,
        role: data.role,
        attended: false,
      };

      const result = await addParticipant(participantData);

      if (result.success && result.data) { // Add check for result.data
        toast.success("Participant added successfully");
        setAddParticipantDialogOpen(false);
        participantForm.reset();

        // Refresh participants list
        fetchParticipants(eventId);
      } else {
        toast.error(result.error || "Failed to add participant");
      }
    } catch (error) {
      console.error("Error adding participant:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Handle remove participant
  const handleRemoveParticipant = async (userId: string) => {
    try {
      const result = await removeParticipant(eventId, userId);

      if (result.success) {
        toast.success("Participant removed successfully");

        // Refresh participants list
        fetchParticipants(eventId);
      } else {
        toast.error(result.error || "Failed to remove participant");
      }
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Handle mark attendance
  const handleMarkAttendance = async (userId: string, attended: boolean) => {
    try {
      const result = await markAttendance(eventId, userId, attended);

      if (result.success && result.data) { // Add check for result.data
        toast.success("Attendance recorded successfully");

        // Refresh participants list
        fetchParticipants(eventId);
      } else {
        toast.error(result.error || "Failed to record attendance");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Handle share event
  const handleShareEvent = () => {
    try {
      if (navigator.share) {
        navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Event link copied to clipboard");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-primary/10 text-primary";
      case "ONGOING":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "POSTPONED":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return <Calendar className="h-4 w-4 mr-1" />;
      case "ONGOING":
        return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 mr-1" />;
      case "POSTPONED":
        return <Clock4 className="h-4 w-4 mr-1" />;
      default:
        return <AlertCircle className="h-4 w-4 mr-1" />;
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

  // Mock users for participant selection
  // In a real app, you would fetch these from the database
  const mockUsers = [
    { id: "user1", name: "John Smith", role: "Teacher" },
    { id: "user2", name: "Emily Johnson", role: "Student" },
    { id: "user3", name: "Robert Williams", role: "Admin" },
    { id: "user4", name: "Sarah Davis", role: "Parent" },
    { id: "user5", name: "Michael Brown", role: "Student" },
    { id: "user6", name: "Jessica Miller", role: "Teacher" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Event Not Found</h2>
        <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist or has been removed.</p>
        <Link href="/admin/events">
          <Button>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Events
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate event progress (for ongoing events)
  const calculateProgress = () => {
    if (!event || event.status !== "ONGOING") return 0;

    const start = new Date(event.startDate).getTime();
    const end = new Date(event.endDate).getTime();
    const now = new Date().getTime();

    if (now <= start) return 0;
    if (now >= end) return 100;

    return Math.round(((now - start) / (end - start)) * 100);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/events">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
          <Badge className={getStatusBadgeColor(event.status)}>
            {getStatusIcon(event.status)}
            {event.status}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            </DialogTrigger>
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
                          <p className="text-sm text-muted-foreground">
                            Make this event visible to everyone
                          </p>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShareEvent}>
                <Share2 className="h-4 w-4 mr-2" />
                <span>Share</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAddParticipantDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                <span>Add Participant</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-2" />
                <span>Print / Export</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Delete Event</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Event thumbnail */}
      {event.thumbnail && (
        <div className="h-48 sm:h-64 md:h-80 w-full relative rounded-lg overflow-hidden mb-2">
          <OptimizedImage
            src={event.thumbnail}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            className="object-cover"
            qualityPreset="high"
            aboveFold
          />
        </div>
      )}

      {/* Progress bar for ongoing events */}
      {event.status === "ONGOING" && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Event Progress</span>
            <span>{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="w-full" />
        </div>
      )}

      <Tabs defaultValue="details" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="participants">
            Participants {event._count?.participants > 0 && `(${event._count.participants})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date and Time */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Date and Time</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(event.startDate)} {formatDate(event.startDate) !== formatDate(event.endDate) && `- ${formatDate(event.endDate)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(event.startDate)} - {formatTime(event.endDate)}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-emerald-50">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
                    </div>
                  </div>
                )}

                {/* Organizer */}
                {event.organizer && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-purple-50">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Organizer</h3>
                      <p className="text-sm text-muted-foreground mt-1">{event.organizer}</p>
                    </div>
                  </div>
                )}

                {/* Participants */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-amber-50">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Participants</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event._count?.participants || 0} {event.maxParticipants
                        ? `/ ${event.maxParticipants} (${Math.round((event._count?.participants || 0) / event.maxParticipants * 100)}% filled)`
                        : "registered"}
                    </p>
                    {event.registrationDeadline && (
                      <p className="text-sm text-muted-foreground">
                        Registration Deadline: {formatDate(event.registrationDeadline)} {formatTime(event.registrationDeadline)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Event Type */}
                {event.type && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-indigo-50">
                      <Tag className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Event Type</h3>
                      <div className="mt-1">
                        <Badge className={getTypeBadgeColor(event.type)}>
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Public/Private */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-accent">
                    {event.isPublic
                      ? <Globe className="h-5 w-5 text-muted-foreground" />
                      : <Lock className="h-5 w-5 text-muted-foreground" />
                    }
                  </div>
                  <div>
                    <h3 className="font-medium">Visibility</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.isPublic ? "Public - Anyone can view this event" : "Private - Only invited participants can view this event"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                {event.description ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description provided.</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Select
                  value={event.status}
                  onValueChange={handleStatusUpdate}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPCOMING">Upcoming</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="POSTPONED">Postponed</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between gap-2">
              <div>
                <CardTitle>Participants</CardTitle>
                <CardDescription>
                  People attending this event
                </CardDescription>
              </div>
              <Button onClick={() => setAddParticipantDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Participant
              </Button>
            </CardHeader>
            <CardContent>
              {participants.length > 0 ? (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-accent border-b">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">User</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Role</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Registration Date</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Attended</th>
                          <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((participant) => (
                          <tr key={participant.userId} className="border-b">
                            <td className="py-3 px-4 align-middle">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={participant.user?.image || participant.user?.avatar || ""} />
                                  <AvatarFallback>
                                    {participant.user?.firstName?.substring(0, 1) || "U"}
                                    {participant.user?.lastName?.substring(0, 1) || ""}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {participant.user
                                      ? `${participant.user.firstName} ${participant.user.lastName}`
                                      : "Unknown User"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {participant.user?.role || ""}
                                  </p>
                                  {participant.user?.role === "STUDENT" && participant.user.student?.enrollments?.[0] && (
                                    <p className="text-xs text-muted-foreground">
                                      {participant.user.student.enrollments[0].class.name} -{" "}
                                      {participant.user.student.enrollments[0].section.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 align-middle">{participant.role}</td>
                            <td className="py-3 px-4 align-middle">
                              {formatDate(participant.registrationDate)} {formatTime(participant.registrationDate)}
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <Checkbox
                                checked={participant.attended}
                                onCheckedChange={(checked) => {
                                  handleMarkAttendance(participant.userId, !!checked);
                                }}
                              />
                            </td>
                            <td className="py-3 px-4 align-middle text-right">
                              {/* Actions remain same */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  router.push(`/admin/communication/messages?recipientId=${participant.userId}`);
                                }}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveParticipant(participant.userId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Participants Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This event doesn't have any participants yet.
                  </p>
                  <Button onClick={() => setAddParticipantDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Participant
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Participant Dialog */}
      <Dialog open={addParticipantDialogOpen} onOpenChange={setAddParticipantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Participant</DialogTitle>
            <DialogDescription>
              Add a new participant to this event.
            </DialogDescription>
          </DialogHeader>
          <Form {...participantForm}>
            <form onSubmit={participantForm.handleSubmit(handleAddParticipant)} className="space-y-4">
              <FormField
                control={participantForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select User</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || `${user.firstName} ${user.lastName}`} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={participantForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ATTENDEE">Attendee</SelectItem>
                        <SelectItem value="ORGANIZER">Organizer</SelectItem>
                        <SelectItem value="SPEAKER">Speaker</SelectItem>
                        <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddParticipantDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Participant</Button>
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
            <div className="border rounded-md p-4">
              <h3 className="font-medium">{event.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(event.startDate)} at {formatTime(event.startDate)}
              </p>
              {event._count && event._count.participants > 0 && (
                <div className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  This event has {event._count.participants} registered participants who will be notified.
                </div>
              )}
            </div>
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
