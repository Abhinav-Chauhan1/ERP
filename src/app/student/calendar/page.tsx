"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/lib/auth-context";
import { CalendarEvent, CalendarEventCategory, UserRole } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CalendarView,
  EventDetailModal,
  CalendarFilters,
  type ExtendedCalendarEvent,
} from "@/components/calendar";
import {
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { format, differenceInDays, differenceInHours, isPast, isFuture, isToday } from "date-fns";

// type CalendarEventWithCategory is replaced by ExtendedCalendarEvent from component


/**
 * Student Calendar Dashboard Page
 * 
 * Calendar interface for students with:
 * - View all relevant events (holidays, exams, assignments, school events)
 * - Upcoming events widget
 * - Exam countdown feature
 * - Assignment deadline alerts
 * - Student-specific filtering (class/section based)
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export default function StudentCalendarPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [events, setEvents] = useState<ExtendedCalendarEvent[]>([]);
  const [categories, setCategories] = useState<CalendarEventCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<ExtendedCalendarEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  /**
   * Fetch calendar events with student-specific filtering
   * Requirements: 3.1, 3.2, 3.3
   * - Shows events relevant to student's class and section
   * - Shows exams for enrolled subjects
   * - Shows assignments for their class
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

  // Fetch events when categories change
  useEffect(() => {
    if (categories.length > 0) {
      fetchEvents();
    }
  }, [categories, fetchEvents]);

  /**
   * Handle event click - show detail modal
   * Requirement 3.5: Display full event details
   */
  const handleEventClick = (event: CalendarEvent) => {
    // We need the full event object including category
    const fullEvent = events.find(e => e.id === event.id);
    if (fullEvent) {
      setSelectedEvent(fullEvent);
      setIsDetailModalOpen(true);
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
   * Get upcoming events (next 7 days)
   * Requirement 3.4: Sort events chronologically with nearest events first
   */
  const upcomingEvents = events
    .filter(e => {
      const eventDate = new Date(e.startDate);
      const now = new Date();
      const daysUntil = differenceInDays(eventDate, now);
      return daysUntil >= 0 && daysUntil <= 7;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  /**
   * Get upcoming exams
   * Requirement 3.2: Show only exams for enrolled subjects
   */
  const upcomingExams = events
    .filter(e => {
      const examCategory = categories.find(c => c.name.toLowerCase() === "exam");
      return e.categoryId === examCategory?.id && isFuture(new Date(e.startDate));
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  /**
   * Get upcoming assignment deadlines
   * Requirement 3.3: Show assignments assigned to their class
   */
  const upcomingAssignments = events
    .filter(e => {
      const assignmentCategory = categories.find(c => c.name.toLowerCase() === "assignment");
      return e.categoryId === assignmentCategory?.id && isFuture(new Date(e.startDate));
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  /**
   * Calculate time until event
   */
  const getTimeUntilEvent = (eventDate: Date) => {
    const now = new Date();
    const days = differenceInDays(eventDate, now);
    const hours = differenceInHours(eventDate, now);

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return 'Today';
    }
  };

  /**
   * Get urgency color based on days until event
   */
  const getUrgencyColor = (eventDate: Date) => {
    const days = differenceInDays(eventDate, now);
    if (days <= 1) return 'text-red-600 dark:text-red-400';
    if (days <= 3) return 'text-orange-600 dark:text-orange-400';
    if (days <= 7) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  /**
   * Get urgency badge variant
   */
  const getUrgencyBadge = (eventDate: Date) => {
    const days = differenceInDays(eventDate, now);
    if (days <= 1) return 'destructive';
    if (days <= 3) return 'default';
    return 'secondary';
  };

  const now = new Date();

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
            View your schedule, exams, assignments, and important dates
          </p>
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
              <Clock className="h-4 w-4" />
              Next 7 Days
            </CardDescription>
            <CardTitle className="text-3xl">{upcomingEvents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Upcoming Exams
            </CardDescription>
            <CardTitle className="text-3xl">{upcomingExams.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pending Assignments
            </CardDescription>
            <CardTitle className="text-3xl">{upcomingAssignments.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Widgets Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Upcoming Events Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const eventDate = new Date(event.startDate);
                  const timeUntil = getTimeUntilEvent(eventDate);

                  return (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(eventDate, "MMM d, yyyy")}
                            {!event.isAllDay && ` • ${format(eventDate, "h:mm a")}`}
                          </p>
                        </div>
                        <Badge
                          variant={getUrgencyBadge(eventDate)}
                          className="text-xs shrink-0"
                        >
                          {timeUntil}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: `${event.category.color}20`,
                            color: event.category.color,
                            borderColor: event.category.color,
                          }}
                        >
                          {event.category.name}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming events</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exam Countdown Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Exam Countdown
            </CardTitle>
            <CardDescription>Upcoming examinations</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingExams.length > 0 ? (
              <div className="space-y-4">
                {upcomingExams.map((exam) => {
                  const examDate = new Date(exam.startDate);
                  const daysUntil = differenceInDays(examDate, now);
                  const hoursUntil = differenceInHours(examDate, now);
                  const progress = Math.max(0, Math.min(100, ((7 - daysUntil) / 7) * 100));

                  return (
                    <button
                      key={exam.id}
                      onClick={() => handleEventClick(exam)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{exam.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(examDate, "EEEE, MMM d")}
                              {!exam.isAllDay && ` at ${format(examDate, "h:mm a")}`}
                            </p>
                          </div>
                          {daysUntil <= 3 && (
                            <AlertTriangle className={`h-4 w-4 ${getUrgencyColor(examDate)}`} />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-medium ${getUrgencyColor(examDate)}`}>
                              {daysUntil > 0 ? `${daysUntil} days` : hoursUntil > 0 ? `${hoursUntil} hours` : 'Today'}
                            </span>
                            <span className="text-muted-foreground">
                              {daysUntil <= 7 ? 'Soon' : 'Upcoming'}
                            </span>
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming exams</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Deadline Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Assignment Deadlines
            </CardTitle>
            <CardDescription>Pending submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => {
                  const dueDate = new Date(assignment.startDate);
                  const daysUntil = differenceInDays(dueDate, now);
                  const isUrgent = daysUntil <= 2;

                  return (
                    <button
                      key={assignment.id}
                      onClick={() => handleEventClick(assignment)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${isUrgent
                        ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30'
                        : 'hover:bg-accent'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {isUrgent && (
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {format(dueDate, "MMM d, yyyy")}
                            {!assignment.isAllDay && ` at ${format(dueDate, "h:mm a")}`}
                          </p>
                          <div className="mt-2">
                            <Badge
                              variant={isUrgent ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {daysUntil === 0 ? 'Due Today' : daysUntil === 1 ? 'Due Tomorrow' : `${daysUntil} days left`}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending assignments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters - Requirement 3.1 */}
      <CalendarFilters
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        onClearFilters={handleClearFilters}
      />

      {/* Calendar View - Requirements 3.1, 3.2, 3.3, 3.4 */}
      <CalendarView
        events={events}
        userRole={UserRole.STUDENT}
        userId={userId || ""}
        defaultView="month"
        showFilters={false}
        showCreateButton={false}
        onEventClick={handleEventClick}
      />

      {/* Event Detail Modal - Requirement 3.5 */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        onEdit={undefined} // Students cannot edit events
        onDelete={undefined} // Students cannot delete events
        canEdit={false}
        canDelete={false}
        canManageNotes={false}
      />
    </div>
  );
}
