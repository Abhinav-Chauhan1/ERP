"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/lib/auth-context";
import { CalendarEvent, CalendarEventCategory, EventNote, UserRole } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarView,
  EventDetailModal,
  CalendarFilters,
  type ExtendedCalendarEvent,
} from "@/components/calendar";
import { EventNoteDialog } from "@/components/calendar/event-note-dialog";
import {
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  List,
  StickyNote,
  BookOpen,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

// type CalendarEventWithCategory is replaced by ExtendedCalendarEvent from component


/**
 * Teacher Calendar Dashboard Page
 * 
 * Calendar interface for teachers with:
 * - View all relevant events (holidays, exams for their subjects, their assignments)
 * - Personal event highlighting
 * - Event note functionality
 * - View preference controls
 * - Teacher-specific filtering
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.1, 9.2, 9.3, 9.4
 */
export default function TeacherCalendarPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [events, setEvents] = useState<ExtendedCalendarEvent[]>([]);
  const [categories, setCategories] = useState<CalendarEventCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewPreference, setViewPreference] = useState<"month" | "week" | "day" | "agenda">("month");

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<ExtendedCalendarEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<EventNote | null>(null);

  /**
   * Fetch all event categories
   */
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/calendar/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories");
      toast.error("Failed to load categories");
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    loadViewPreference();
  }, [fetchCategories]);

  /**
   * Load saved view preference from localStorage
   * Requirement 2.5: Persist selected view for future sessions
   */
  const loadViewPreference = () => {
    try {
      const saved = localStorage.getItem("teacher-calendar-view");
      if (saved && ["month", "week", "day", "agenda"].includes(saved)) {
        setViewPreference(saved as "month" | "week" | "day" | "agenda");
      }
    } catch (err) {
      console.error("Error loading view preference:", err);
    }
  };

  /**
   * Save view preference to localStorage
   * Requirement 2.5: Persist selected view for future sessions
   */
  const saveViewPreference = (view: "month" | "week" | "day" | "agenda") => {
    try {
      localStorage.setItem("teacher-calendar-view", view);
      setViewPreference(view);
    } catch (err) {
      console.error("Error saving view preference:", err);
    }
  };

  /**
   * Fetch calendar events with teacher-specific filtering
   * Requirements: 2.1, 2.2, 2.3
   * - Shows all school-wide events
   * - Shows exams for subjects they teach
   * - Shows assignments they created
   * - Shows meetings they are invited to
   */
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Add category filter if any selected
      if (selectedCategories.length > 0) {
        params.append("categories", selectedCategories.join(","));
      }

      const response = await fetch(`/api/calendar/events?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();

      // Fetch notes for each event
      const eventsWithNotes = await Promise.all(
        (data.events || []).map(async (event: ExtendedCalendarEvent) => {
          try {
            const notesResponse = await fetch(`/api/calendar/events/${event.id}/notes`);
            if (notesResponse.ok) {
              const notes = await notesResponse.json();
              return { ...event, notes };
            }
          } catch (err) {
            console.error(`Error fetching notes for event ${event.id}:`, err);
          }
          return { ...event, notes: [] };
        })
      );

      setEvents(eventsWithNotes);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load calendar events");
      toast.error("Failed to load calendar events");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategories]);

  // Fetch events when categories change
  useEffect(() => {
    if (categories.length > 0) {
      fetchEvents();
    }
  }, [categories, fetchEvents]);

  /**
   * Handle event click - show detail modal
   */
  const handleEventClick = (event: CalendarEvent) => {
    const eventWithNotes = events.find(e => e.id === event.id);
    setSelectedEvent(eventWithNotes || null);
    setIsDetailModalOpen(true);
  };

  /**
   * Handle add note to event
   * Requirement 9.1: Teachers can add personal notes to events
   */
  const handleAddNote = (event: ExtendedCalendarEvent) => {
    setSelectedEvent(event);
    setEditingNote(null);
    setIsNoteDialogOpen(true);
  };

  /**
   * Handle edit note
   * Requirement 9.3: Teachers can edit their notes
   */
  const handleEditNote = (event: ExtendedCalendarEvent, note: EventNote) => {
    setSelectedEvent(event);
    setEditingNote(note);
    setIsNoteDialogOpen(true);
  };

  /**
   * Handle save note (create or update)
   * Requirements: 9.1, 9.2, 9.3
   */
  const handleSaveNote = async (content: string) => {
    if (!selectedEvent) return;

    try {
      if (editingNote) {
        // Update existing note
        const response = await fetch(
          `/api/calendar/events/${selectedEvent.id}/notes/${editingNote.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update note");
        }

        toast.success("Note updated successfully");
      } else {
        // Create new note
        const response = await fetch(
          `/api/calendar/events/${selectedEvent.id}/notes`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to create note");
        }

        toast.success("Note added successfully");
      }

      setIsNoteDialogOpen(false);
      setEditingNote(null);
      fetchEvents(); // Refresh to get updated notes
    } catch (err) {
      console.error("Error saving note:", err);
      toast.error("Failed to save note");
    }
  };

  /**
   * Handle delete note
   * Requirement 9.4: Teachers can delete their notes
   */
  const handleDeleteNote = async (eventId: string, noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/calendar/events/${eventId}/notes/${noteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      toast.success("Note deleted successfully");
      fetchEvents(); // Refresh to get updated notes
    } catch (err) {
      console.error("Error deleting note:", err);
      toast.error("Failed to delete note");
    }
  };

  /**
   * Handle category toggle in filters
   * Requirement 2.4: Filter calendar events by category
   */
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  /**
   * Handle clear filters
   */
  const handleClearFilters = () => {
    setSelectedCategories([]);
  };

  /**
   * Get count of events with personal notes
   */
  const eventsWithNotesCount = events.filter(e => e.notes && e.notes.length > 0).length;

  /**
   * Get count of upcoming events
   */
  const upcomingEventsCount = events.filter(
    e => new Date(e.startDate) > new Date()
  ).length;

  /**
   * Get count of events this week
   */
  const thisWeekEventsCount = events.filter(e => {
    const eventDate = new Date(e.startDate);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    return eventDate >= weekStart && eventDate <= weekEnd;
  }).length;

  if (isLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View your schedule, exams, assignments, and add personal notes
          </p>
        </div>

        {/* View Preference Controls - Requirement 2.5 */}
        <Tabs
          value={viewPreference}
          onValueChange={(value) => saveViewPreference(value as any)}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="month" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Month</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Week</span>
            </TabsTrigger>
            <TabsTrigger value="day" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Day</span>
            </TabsTrigger>
            <TabsTrigger value="agenda" className="gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Total Events
            </CardDescription>
            <CardTitle className="text-3xl">{events.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Upcoming
            </CardDescription>
            <CardTitle className="text-3xl">{upcomingEventsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              This Week
            </CardDescription>
            <CardTitle className="text-3xl">{thisWeekEventsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              With Notes
            </CardDescription>
            <CardTitle className="text-3xl">{eventsWithNotesCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters - Requirement 2.4 */}
      <CalendarFilters
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        onClearFilters={handleClearFilters}
      />

      {/* Calendar View - Requirements 2.1, 2.2, 2.3 */}
      <CalendarView
        events={events}
        userRole={UserRole.TEACHER}
        userId={userId || ""}
        defaultView={viewPreference}
        showFilters={false}
        showCreateButton={false}
        onEventClick={handleEventClick}
      />

      {/* Event Detail Modal with Notes */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        onEdit={undefined} // Teachers cannot edit events
        onDelete={undefined} // Teachers cannot delete events
        onAddNote={handleAddNote}
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
        canEdit={false}
        canDelete={false}
        canManageNotes={true}
      />

      {/* Event Note Dialog - Requirements 9.1, 9.2, 9.3, 9.4 */}
      {selectedEvent && (
        <EventNoteDialog
          isOpen={isNoteDialogOpen}
          onClose={() => {
            setIsNoteDialogOpen(false);
            setEditingNote(null);
          }}
          onSave={handleSaveNote}
          eventTitle={selectedEvent.title}
          initialContent={editingNote?.content}
          isEditing={!!editingNote}
        />
      )}
    </div>
  );
}
