"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CalendarEvent, CalendarEventCategory, UserRole } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarView,
  EventDetailModal,
  CalendarFilters,
} from "@/components/calendar";
import {
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  Users,
  CalendarCheck,
  BookOpen,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { format, differenceInDays, isFuture } from "date-fns";

type CalendarEventWithCategory = CalendarEvent & {
  category: CalendarEventCategory;
};

interface Child {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
  enrollments: Array<{
    class: {
      name: string;
    };
    section: {
      name: string;
    };
  }>;
}

/**
 * Parent Calendar Dashboard Page
 * 
 * Calendar interface for parents with:
 * - View all relevant events for their children
 * - Child selector for multi-child filtering
 * - Parent-teacher meeting highlights
 * - Combined view for all children's events
 * - School-wide events (holidays, school events)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export default function ParentCalendarPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [events, setEvents] = useState<CalendarEventWithCategory[]>([]);
  const [categories, setCategories] = useState<CalendarEventCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventWithCategory | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  /**
   * Fetch parent's children
   * Requirement 4.2: Provide filter to view events for specific children
   */
  const fetchChildren = useCallback(async () => {
    setIsLoadingChildren(true);
    try {
      const response = await fetch("/api/parent/children");
      if (!response.ok) {
        throw new Error("Failed to fetch children");
      }
      const data = await response.json();
      setChildren(data.children || []);
    } catch (err) {
      console.error("Error fetching children:", err);
      setError("Failed to load children information");
      toast.error("Failed to load children information");
    } finally {
      setIsLoadingChildren(false);
    }
  }, []);

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
   * Fetch calendar events with parent-specific filtering
   * Requirements: 4.1, 4.2, 4.3, 4.4
   * - Shows all school-wide events
   * - Shows events for all children (or specific child if filtered)
   * - Shows parent-teacher meetings
   * - Shows exams for children's subjects
   * - Shows assignments for children's classes
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

      // Add child filter if specific child selected
      if (selectedChildId !== "all") {
        params.append("childId", selectedChildId);
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
  }, [selectedCategories, selectedChildId]);

  // Fetch children on mount
  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch events when categories or selected child changes
  useEffect(() => {
    if (categories.length > 0 && children.length > 0) {
      fetchEvents();
    }
  }, [categories, children, fetchEvents]);

  /**
   * Handle event click - show detail modal
   * Requirement 4.5: Display full event details
   */
  const handleEventClick = (event: CalendarEvent) => {
    // Events from our array already have category included
    setSelectedEvent(event as CalendarEventWithCategory);
    setIsDetailModalOpen(true);
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
   * Handle child selection change
   * Requirement 4.2: Filter to view events for specific children
   */
  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
  };

  /**
   * Get parent-teacher meetings
   * Requirement 4.3: Highlight meetings scheduled for their children
   */
  const parentTeacherMeetings = events.filter(e => {
    const meetingCategory = categories.find(c => c.name.toLowerCase() === "meeting");
    return e.categoryId === meetingCategory?.id && isFuture(new Date(e.startDate));
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 3);

  /**
   * Get upcoming exams for children
   * Requirement 4.4: Display exams for all subjects of their children
   */
  const upcomingExams = events.filter(e => {
    const examCategory = categories.find(c => c.name.toLowerCase() === "exam");
    return e.categoryId === examCategory?.id && isFuture(new Date(e.startDate));
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 3);

  /**
   * Get upcoming assignments for children
   */
  const upcomingAssignments = events.filter(e => {
    const assignmentCategory = categories.find(c => c.name.toLowerCase() === "assignment");
    return e.categoryId === assignmentCategory?.id && isFuture(new Date(e.startDate));
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 3);

  /**
   * Get school holidays
   * Requirement 4.5: Show all school holidays and breaks
   */
  const upcomingHolidays = events.filter(e => {
    const holidayCategory = categories.find(c => c.name.toLowerCase() === "holiday");
    return e.categoryId === holidayCategory?.id && isFuture(new Date(e.startDate));
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 3);

  /**
   * Get time until event
   */
  const getTimeUntilEvent = (eventDate: Date) => {
    const now = new Date();
    const days = differenceInDays(eventDate, now);

    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  if (isLoadingChildren) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No children found. Please contact the school administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View schedules, events, and important dates for your children
          </p>
        </div>

        {/* Child Selector - Requirement 4.2 */}
        <div className="w-full sm:w-auto">
          <Select value={selectedChildId} onValueChange={handleChildChange}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  All Children
                </div>
              </SelectItem>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  <div className="flex flex-col">
                    <span>{child.user.firstName} {child.user.lastName}</span>
                    {child.enrollments[0] && (
                      <span className="text-xs text-muted-foreground">
                        {child.enrollments[0].class.name} - {child.enrollments[0].section.name}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <CalendarCheck className="h-4 w-4" />
              Meetings
            </CardDescription>
            <CardTitle className="text-3xl">{parentTeacherMeetings.length}</CardTitle>
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
              Assignments
            </CardDescription>
            <CardTitle className="text-3xl">{upcomingAssignments.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Widgets Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Parent-Teacher Meetings Widget - Requirement 4.3 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Parent-Teacher Meetings
            </CardTitle>
            <CardDescription>Scheduled meetings</CardDescription>
          </CardHeader>
          <CardContent>
            {parentTeacherMeetings.length > 0 ? (
              <div className="space-y-3">
                {parentTeacherMeetings.map((meeting) => {
                  const meetingDate = new Date(meeting.startDate);
                  const timeUntil = getTimeUntilEvent(meetingDate);

                  return (
                    <button
                      key={meeting.id}
                      onClick={() => handleEventClick(meeting)}
                      className="w-full text-left p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(meetingDate, "MMM d, yyyy")}
                            {!meeting.isAllDay && ` • ${format(meetingDate, "h:mm a")}`}
                          </p>
                          {meeting.location && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📍 {meeting.location}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {timeUntil}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming meetings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Exams Widget - Requirement 4.4 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Upcoming Exams
            </CardTitle>
            <CardDescription>Children's examinations</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingExams.length > 0 ? (
              <div className="space-y-3">
                {upcomingExams.map((exam) => {
                  const examDate = new Date(exam.startDate);
                  const timeUntil = getTimeUntilEvent(examDate);

                  return (
                    <button
                      key={exam.id}
                      onClick={() => handleEventClick(exam)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{exam.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(examDate, "EEEE, MMM d")}
                            {!exam.isAllDay && ` at ${format(examDate, "h:mm a")}`}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {timeUntil}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming exams</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* School Holidays Widget - Requirement 4.5 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5 text-primary" />
              School Holidays
            </CardTitle>
            <CardDescription>Upcoming breaks</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingHolidays.length > 0 ? (
              <div className="space-y-3">
                {upcomingHolidays.map((holiday) => {
                  const holidayDate = new Date(holiday.startDate);
                  const timeUntil = getTimeUntilEvent(holidayDate);

                  return (
                    <button
                      key={holiday.id}
                      onClick={() => handleEventClick(holiday)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{holiday.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(holidayDate, "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {timeUntil}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming holidays</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <CalendarFilters
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        onClearFilters={handleClearFilters}
      />

      {/* Calendar View - Requirements 4.1, 4.2, 4.4 */}
      {isLoading && events.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <CalendarView
          events={events}
          userRole={UserRole.PARENT}
          userId={userId || ""}
          defaultView="month"
          showFilters={false}
          showCreateButton={false}
          onEventClick={handleEventClick}
        />
      )}

      {/* Event Detail Modal - Requirement 4.5 */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        onEdit={undefined} // Parents cannot edit events
        onDelete={undefined} // Parents cannot delete events
        canEdit={false}
        canDelete={false}
        canManageNotes={false}
      />
    </div>
  );
}
