"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CalendarEvent, CalendarEventCategory, UserRole } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CalendarView,
  EventDetailModal,
  EventFormModal,
  CalendarFilters,
} from "@/components/calendar";
import { CategoryManagementDialog } from "@/components/calendar/category-management-dialog";
import { ImportExportDialog } from "@/components/calendar/import-export-dialog";
import {
  Plus,
  Settings,
  Upload,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

type CalendarEventWithCategory = CalendarEvent & {
  category: CalendarEventCategory;
};

/**
 * Admin Calendar Dashboard Page
 * 
 * Main calendar management interface for administrators.
 * Provides full CRUD operations for calendar events and categories.
 * 
 * Features:
 * - Calendar view with multiple display modes
 * - Event creation, editing, and deletion
 * - Category management
 * - Import/export functionality
 * - Event filtering and search
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 8.1
 */
export default function AdminCalendarPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [events, setEvents] = useState<CalendarEventWithCategory[]>([]);
  const [categories, setCategories] = useState<CalendarEventCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventWithCategory | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventWithCategory | null>(null);

  // Track if categories have been loaded
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

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
      setCategoriesLoaded(true);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories");
      toast.error("Failed to load categories");
      setCategoriesLoaded(true); // Mark as loaded even on error to stop spinner
    }
  }, []);

  /**
   * Fetch calendar events with filters
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
      setEvents(data.events || []);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load calendar events");
      toast.error("Failed to load calendar events");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategories]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch events after categories are loaded
  useEffect(() => {
    if (categoriesLoaded) {
      fetchEvents();
    }
  }, [categoriesLoaded, selectedCategories, fetchEvents]);

  /**
   * Handle event click - show detail modal
   */
  const handleEventClick = (event: CalendarEvent) => {
    // Find the full event with category from our state
    const fullEvent = events.find(e => e.id === event.id);
    if (fullEvent) {
      setSelectedEvent(fullEvent);
      setIsDetailModalOpen(true);
    }
  };

  /**
   * Handle create event button
   */
  const handleCreateEvent = () => {
    setEditingEvent(null);
    setIsFormModalOpen(true);
  };

  /**
   * Handle edit event from detail modal
   */
  const handleEditEvent = (event: CalendarEvent) => {
    // Find the full event with category from our state
    const fullEvent = events.find(e => e.id === event.id);
    if (fullEvent) {
      setEditingEvent(fullEvent);
      setIsDetailModalOpen(false);
      setIsFormModalOpen(true);
    }
  };

  /**
   * Handle delete event
   */
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      toast.success("Event deleted successfully");
      setIsDetailModalOpen(false);
      fetchEvents();
    } catch (err) {
      console.error("Error deleting event:", err);
      toast.error("Failed to delete event");
    }
  };

  /**
   * Handle save event (create or update)
   */
  const handleSaveEvent = async (eventData: any) => {
    try {
      const url = editingEvent
        ? `/api/calendar/events/${editingEvent.id}`
        : "/api/calendar/events";

      const method = editingEvent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save event");
      }

      toast.success(editingEvent ? "Event updated successfully" : "Event created successfully");
      setIsFormModalOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      console.error("Error saving event:", err);
      throw err; // Re-throw to let the form modal handle it
    }
  };

  /**
   * Handle category toggle in filters
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
   * Handle category management success
   */
  const handleCategoryManagementSuccess = () => {
    fetchCategories();
    fetchEvents();
  };

  /**
   * Handle import success
   */
  const handleImportSuccess = () => {
    fetchEvents();
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Academic Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Manage school events, holidays, exams, and important dates
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportExportModalOpen(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import/Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsCategoryModalOpen(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Manage Categories
          </Button>
          <Button onClick={handleCreateEvent} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>
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
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-3xl">{events.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Events</CardDescription>
            <CardTitle className="text-3xl">
              {events.filter((e) => new Date(e.startDate) > new Date()).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl">
              {
                events.filter((e) => {
                  const eventDate = new Date(e.startDate);
                  const now = new Date();
                  return (
                    eventDate.getMonth() === now.getMonth() &&
                    eventDate.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Categories</CardDescription>
            <CardTitle className="text-3xl">{categories.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <CalendarFilters
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        onClearFilters={handleClearFilters}
      />

      {/* Calendar View */}
      <CalendarView
        events={events}
        userRole={UserRole.ADMIN}
        userId={userId || ""}
        defaultView="month"
        showFilters={false}
        showCreateButton={false}
        onEventClick={handleEventClick}
        onCreateEvent={handleCreateEvent}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        canEdit={true}
        canDelete={true}
      />

      {/* Event Form Modal */}
      <EventFormModal
        event={editingEvent}
        categories={categories}
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
      />

      {/* Category Management Dialog */}
      <CategoryManagementDialog
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={handleCategoryManagementSuccess}
      />

      {/* Import/Export Dialog */}
      <ImportExportDialog
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
