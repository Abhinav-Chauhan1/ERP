"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar as CalendarIcon, Grid, List, Search, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import { EventCalendar } from "@/components/parent/events/event-calendar";
import { EventCard } from "@/components/parent/events/event-card";
import {
  getEvents,
  getEventDetails,
  getRegisteredEvents,
  getEventTypes,
  cancelEventRegistration,
} from "@/lib/actions/parent-event-actions";
import { EventStatus } from "@prisma/client";
import type { EventWithParticipantCount } from "@/types/events";

// Lazy load heavy modal components
const EventDetailModal = dynamic(
  () => import("@/components/parent/events/event-detail-modal").then(mod => ({ default: mod.EventDetailModal })),
  { loading: () => <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div> }
);

const EventRegistrationForm = dynamic(
  () => import("@/components/parent/events/event-registration-form").then(mod => ({ default: mod.EventRegistrationForm })),
  { loading: () => <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div> }
);

interface EventsPageClientProps {
  children: {
    id: string;
    userId: string;
    user: {
      firstName: string;
      lastName: string;
    };
    name: string;
    class: string;
    section: string;
    isPrimary: boolean;
  }[];
}

export function EventsPageClient({ children }: EventsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedChild, setSelectedChild] = useState(children[0]);
  const [events, setEvents] = useState<EventWithParticipantCount[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "calendar">("grid");

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRegistrationFormOpen, setIsRegistrationFormOpen] = useState(false);
  const [eventToRegister, setEventToRegister] = useState<EventWithParticipantCount | null>(null);

  // Load events and registered events
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load all events
      const eventsResult = await getEvents();
      if (eventsResult.success) {
        setEvents(eventsResult.data);
      }

      // Load registered events for selected child
      const registeredResult = await getRegisteredEvents(selectedChild.id);
      if (registeredResult.success && registeredResult.data && 'all' in registeredResult.data) {
        setRegisteredEvents(registeredResult.data.all || []);
      }

      // Load event types
      const typesResult = await getEventTypes();
      if (typesResult.success) {
        setEventTypes(typesResult.data);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, [selectedChild.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewDetails = async (eventId: string) => {
    try {
      const result = await getEventDetails(eventId, selectedChild.id);
      if (result.success && result.data) {
        setSelectedEvent(result.data);
        setIsDetailModalOpen(true);
      } else {
        toast.error("Failed to load event details");
      }
    } catch (error) {
      console.error("Failed to load event details:", error);
      toast.error("Failed to load event details");
    }
  };

  const handleRegister = (event: EventWithParticipantCount) => {
    setEventToRegister(event);
    setIsRegistrationFormOpen(true);
  };

  const handleRegisterFromModal = () => {
    if (selectedEvent?.event) {
      setIsDetailModalOpen(false);
      setEventToRegister(selectedEvent.event);
      setIsRegistrationFormOpen(true);
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    // Find the registration ID
    const registration = registeredEvents.find(r => r.event.id === eventId);
    if (!registration) {
      toast.error("Registration not found");
      return;
    }

    if (!confirm("Are you sure you want to cancel this registration?")) {
      return;
    }

    try {
      const result = await cancelEventRegistration(registration.id);
      if (result.success) {
        toast.success(result.message || "Registration cancelled successfully");
        loadData();
        setIsDetailModalOpen(false);
      } else {
        toast.error(result.message || "Failed to cancel registration");
      }
    } catch (error) {
      console.error("Failed to cancel registration:", error);
      toast.error("Failed to cancel registration");
    }
  };

  const handleRegistrationSuccess = () => {
    setIsRegistrationFormOpen(false);
    setEventToRegister(null);
    loadData();
  };

  // Check if an event is registered
  const isEventRegistered = (eventId: string) => {
    return registeredEvents.some(r => r.event.id === eventId);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        event.title.toLowerCase().includes(search) ||
        event.description?.toLowerCase().includes(search) ||
        event.location?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (selectedType !== "all" && event.type !== selectedType) {
      return false;
    }

    // Status filter
    if (selectedStatus !== "all" && event.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  // Categorize events
  const now = new Date();
  const upcomingEvents = filteredEvents.filter(e =>
    new Date(e.startDate) > now &&
    (e.status === EventStatus.UPCOMING || e.status === EventStatus.ONGOING)
  );
  const ongoingEvents = filteredEvents.filter(e =>
    new Date(e.startDate) <= now &&
    new Date(e.endDate) >= now &&
    e.status === EventStatus.ONGOING
  );
  const pastEvents = filteredEvents.filter(e =>
    new Date(e.endDate) < now ||
    e.status === EventStatus.COMPLETED
  );
  const myRegisteredEvents = registeredEvents
    .map(r => r.event)
    .filter(event => {
      // Apply same filters
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          event.title.toLowerCase().includes(search) ||
          event.description?.toLowerCase().includes(search) ||
          event.location?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      if (selectedType !== "all" && event.type !== selectedType) return false;
      if (selectedStatus !== "all" && event.status !== selectedStatus) return false;
      return true;
    });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">School Events</h1>
          <p className="text-gray-600">Browse and register for school events</p>
        </div>

        {/* Child Selector */}
        {children.length > 1 && (
          <Select
            value={selectedChild.id}
            onValueChange={(value) => {
              const child = children.find(c => c.id === value);
              if (child) setSelectedChild(child);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={EventStatus.UPCOMING}>Upcoming</SelectItem>
                <SelectItem value={EventStatus.ONGOING}>Ongoing</SelectItem>
                <SelectItem value={EventStatus.COMPLETED}>Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("calendar")}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Display */}
      {viewMode === "calendar" ? (
        <EventCalendar
          events={filteredEvents.map(e => ({
            id: e.id,
            title: e.title,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
            type: e.type,
            status: e.status,
          }))}
          onEventClick={handleViewDetails}
        />
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Events ({filteredEvents.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingEvents.length})</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing ({ongoingEvents.length})</TabsTrigger>
            <TabsTrigger value="registered">My Events ({myRegisteredEvents.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastEvents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No events found</p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={isEventRegistered(event.id)}
                    onViewDetails={handleViewDetails}
                    onRegister={() => handleRegister(event)}
                    onCancelRegistration={() => handleCancelRegistration(event.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No upcoming events</p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={isEventRegistered(event.id)}
                    onViewDetails={handleViewDetails}
                    onRegister={() => handleRegister(event)}
                    onCancelRegistration={() => handleCancelRegistration(event.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ongoing" className="space-y-4">
            {ongoingEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No ongoing events</p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                {ongoingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={isEventRegistered(event.id)}
                    onViewDetails={handleViewDetails}
                    onRegister={() => handleRegister(event)}
                    onCancelRegistration={() => handleCancelRegistration(event.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="registered" className="space-y-4">
            {myRegisteredEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No registered events</p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                {myRegisteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={true}
                    onViewDetails={handleViewDetails}
                    onCancelRegistration={() => handleCancelRegistration(event.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No past events</p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={isEventRegistered(event.id)}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent.event}
          isRegistered={selectedEvent.isRegistered}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedEvent(null);
          }}
          onRegister={handleRegisterFromModal}
          onCancelRegistration={() => handleCancelRegistration(selectedEvent.event.id)}
        />
      )}

      {/* Registration Form Modal */}
      {isRegistrationFormOpen && eventToRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <EventRegistrationForm
                eventId={eventToRegister.id}
                eventTitle={eventToRegister.title}
                children={children}
                onSuccess={handleRegistrationSuccess}
                onCancel={() => {
                  setIsRegistrationFormOpen(false);
                  setEventToRegister(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
