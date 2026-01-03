"use client";

import { useState, useMemo } from "react";
import { CalendarEvent, CalendarEventCategory, UserRole } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Plus,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  endOfDay,
  parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";
import { EventList } from "./event-list";
import { EventCard } from "./event-card";
import { useCalendarKeyboardNavigation } from "@/hooks/use-calendar-keyboard-navigation";
import { useHighContrastMode } from "@/hooks/use-high-contrast-mode";
import { KeyboardShortcutsHelp } from "./keyboard-shortcuts-help";
import { HighContrastToggle } from "./high-contrast-toggle";

interface CalendarViewProps {
  events: (CalendarEvent & {
    category: CalendarEventCategory;
  })[];
  userRole: UserRole;
  userId: string;
  defaultView?: "month" | "week" | "day" | "agenda";
  showFilters?: boolean;
  showCreateButton?: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent?: () => void;
  className?: string;
}

/**
 * CalendarView Component
 * 
 * Main calendar component with multiple view modes:
 * - Month view: Traditional calendar grid
 * - Week view: 7-day week view
 * - Day view: Single day detailed view
 * - Agenda view: Chronological list of events
 * 
 * Features:
 * - Multiple view modes
 * - Event filtering by category
 * - Date navigation
 * - Event click to show details
 * - Responsive design
 * - Keyboard navigation
 * 
 * Requirements: 2.4
 */
export function CalendarView({
  events,
  userRole,
  userId,
  defaultView = "month",
  showFilters = true,
  showCreateButton = false,
  onEventClick,
  onCreateEvent,
  className,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">(defaultView);

  // High contrast mode support
  const {
    isHighContrast,
    getHighContrastStyles,
    getHighContrastBorderWidth,
    getHighContrastFocusRing,
  } = useHighContrastMode();

  // Navigation handlers - defined before keyboard navigation hook
  const goToPrevious = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, -1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, -1));
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, -1));
    }
    
    // Announce navigation to screen readers
    announceToScreenReader(`Navigated to ${getNavigationLabel()}`);
  };

  const goToNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, 1));
    }
    
    // Announce navigation to screen readers
    announceToScreenReader(`Navigated to ${getNavigationLabel()}`);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    announceToScreenReader("Navigated to today");
  };

  // Helper function to announce to screen readers
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  // Get navigation label for screen reader announcements
  const getNavigationLabel = () => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy");
    } else if (view === "week") {
      return `Week of ${format(startOfWeek(currentDate), "MMMM d, yyyy")}`;
    } else if (view === "day") {
      return format(currentDate, "MMMM d, yyyy");
    }
    return "All events";
  };

  // Keyboard navigation - now goToToday is defined
  const { shortcuts } = useCalendarKeyboardNavigation({
    currentDate,
    view,
    onDateChange: setCurrentDate,
    onViewChange: setView,
    onToday: goToToday,
    onCreateEvent,
    enabled: true,
  });

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = startOfDay(event.startDate);
      const eventEnd = endOfDay(event.endDate);
      const checkDate = startOfDay(date);
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  // Month view calendar grid
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  // Week view days
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [currentDate]);

  // Render month view
  const renderMonthView = () => {
    const weeks = [];
    for (let i = 0; i < monthDays.length; i += 7) {
      weeks.push(monthDays.slice(i, i + 7));
    }

    return (
      <div className="space-y-2" role="grid" aria-label="Calendar month view">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2" role="row">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => (
            <div
              key={day}
              role="columnheader"
              className="text-center text-sm font-medium text-muted-foreground py-2"
              aria-label={day}
            >
              <span aria-hidden="true">{day.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1" role="row">
              {week.map((day) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                const borderWidth = getHighContrastBorderWidth(isTodayDate ? 2 : 1);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setCurrentDate(day);
                      setView("day");
                      announceToScreenReader(
                        `Selected ${format(day, "MMMM d, yyyy")}, ${dayEvents.length} events`
                      );
                    }}
                    className={cn(
                      "min-h-[80px] md:min-h-[100px] p-2 border rounded-md text-left hover:bg-accent transition-colors",
                      getHighContrastFocusRing(),
                      !isCurrentMonth && "text-muted-foreground bg-muted/50",
                      isTodayDate && "border-primary"
                    )}
                    style={{
                      borderWidth: `${borderWidth}px`,
                      minHeight: "44px", // Minimum touch target size
                    }}
                    role="gridcell"
                    aria-label={`${format(day, "MMMM d, yyyy")}, ${dayEvents.length} ${
                      dayEvents.length === 1 ? "event" : "events"
                    }${isTodayDate ? ", today" : ""}`}
                    aria-current={isTodayDate ? "date" : undefined}
                    tabIndex={isSameDay(day, currentDate) ? 0 : -1}
                  >
                    <div
                      className={cn(
                        "text-sm font-medium mb-1",
                        isTodayDate && "text-primary font-bold"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded truncate"
                          style={{
                            backgroundColor: isHighContrast
                              ? getHighContrastStyles(event.category.color)
                              : `${event.category.color}20`,
                            color: isHighContrast
                              ? "#000000"
                              : event.category.color,
                            borderLeft: isHighContrast
                              ? `${getHighContrastBorderWidth(3)}px solid ${getHighContrastStyles(
                                  event.category.color
                                )}`
                              : undefined,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              onEventClick(event);
                            }
                          }}
                          aria-label={`Event: ${event.title}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground" aria-label={`${dayEvents.length - 2} more events`}>
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    return (
      <div className="space-y-2" role="grid" aria-label="Calendar week view">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2" role="row">
          {weekDays.map((day) => {
            const isTodayDate = isToday(day);
            return (
              <div
                key={day.toISOString()}
                role="columnheader"
                className={cn(
                  "text-center p-2 rounded-md",
                  isTodayDate && "bg-primary text-primary-foreground"
                )}
                aria-label={format(day, "EEEE, MMMM d, yyyy")}
                aria-current={isTodayDate ? "date" : undefined}
              >
                <div className="text-xs font-medium">{format(day, "EEE")}</div>
                <div className="text-lg font-bold">{format(day, "d")}</div>
              </div>
            );
          })}
        </div>

        {/* Events for each day */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDate(day);
            return (
              <div
                key={day.toISOString()}
                role="gridcell"
                className="border rounded-md p-2 min-h-[200px]"
                aria-label={`${format(day, "EEEE")}, ${dayEvents.length} events`}
              >
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity",
                        getHighContrastFocusRing()
                      )}
                      style={{
                        backgroundColor: isHighContrast
                          ? getHighContrastStyles(event.category.color)
                          : `${event.category.color}20`,
                        borderLeft: `${getHighContrastBorderWidth(3)}px solid ${
                          isHighContrast
                            ? getHighContrastStyles(event.category.color)
                            : event.category.color
                        }`,
                        minHeight: "44px", // Minimum touch target size
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                      onClick={() => onEventClick(event)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onEventClick(event);
                        }
                      }}
                      aria-label={`Event: ${event.title}${
                        !event.isAllDay ? ` at ${format(event.startDate, "p")}` : ""
                      }`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {!event.isAllDay && (
                        <div className="text-muted-foreground">
                          {format(event.startDate, "p")}
                        </div>
                      )}
                    </div>
                  ))}
                  {dayEvents.length === 0 && (
                    <div
                      className="text-xs text-muted-foreground text-center py-4"
                      role="status"
                    >
                      No events
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="space-y-4" role="region" aria-label="Day view">
        <div className="text-center">
          <h3 className="text-2xl font-bold" id="day-view-heading">
            {format(currentDate, "EEEE")}
          </h3>
          <p className="text-muted-foreground">{format(currentDate, "MMMM d, yyyy")}</p>
        </div>

        {dayEvents.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            No events scheduled for this day
          </div>
        ) : (
          <div
            className="space-y-2"
            role="list"
            aria-labelledby="day-view-heading"
            aria-label={`${dayEvents.length} events on ${format(currentDate, "MMMM d, yyyy")}`}
          >
            {dayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => onEventClick(event)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render agenda view
  const renderAgendaView = () => {
    // Sort events chronologically
    const sortedEvents = [...events].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );

    return (
      <EventList
        events={sortedEvents}
        onEventClick={onEventClick}
        groupBy="date"
      />
    );
  };

  return (
    <Card className={cn("", className)} role="region" aria-label="Academic calendar">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" aria-hidden="true" />
            Academic Calendar
          </CardTitle>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Keyboard shortcuts help */}
            <KeyboardShortcutsHelp shortcuts={shortcuts} />

            {/* High contrast toggle */}
            <HighContrastToggle />

            {showCreateButton && onCreateEvent && (
              <Button
                onClick={onCreateEvent}
                size="sm"
                className="min-h-[44px]" // Minimum touch target size
                aria-label="Create new event"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Create Event
              </Button>
            )}
          </div>
        </div>

        {/* Navigation and view controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2" role="group" aria-label="Calendar navigation">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className={cn("min-h-[44px] min-w-[44px]", getHighContrastFocusRing())}
              aria-label={`Previous ${view}`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              onClick={goToToday}
              className={cn("min-h-[44px]", getHighContrastFocusRing())}
              aria-label="Go to today"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className={cn("min-h-[44px] min-w-[44px]", getHighContrastFocusRing())}
              aria-label={`Next ${view}`}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div
            className="text-lg font-semibold"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {view === "month" && format(currentDate, "MMMM yyyy")}
            {view === "week" &&
              `${format(startOfWeek(currentDate), "MMM d")} - ${format(
                endOfWeek(currentDate),
                "MMM d, yyyy"
              )}`}
            {view === "day" && format(currentDate, "MMMM d, yyyy")}
            {view === "agenda" && "All Events"}
          </div>

          <Tabs
            value={view}
            onValueChange={(v) => {
              setView(v as any);
              announceToScreenReader(`Switched to ${v} view`);
            }}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-4" role="tablist" aria-label="Calendar view options">
              <TabsTrigger
                value="month"
                aria-label="Month view"
                className={cn("min-h-[44px]", getHighContrastFocusRing())}
              >
                Month
              </TabsTrigger>
              <TabsTrigger
                value="week"
                aria-label="Week view"
                className={cn("min-h-[44px]", getHighContrastFocusRing())}
              >
                Week
              </TabsTrigger>
              <TabsTrigger
                value="day"
                aria-label="Day view"
                className={cn("min-h-[44px]", getHighContrastFocusRing())}
              >
                Day
              </TabsTrigger>
              <TabsTrigger
                value="agenda"
                aria-label="Agenda view"
                className={cn("min-h-[44px]", getHighContrastFocusRing())}
              >
                <List className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Agenda</span>
                <span className="sm:hidden">List</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent>
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}
        {view === "agenda" && renderAgendaView()}
      </CardContent>
    </Card>
  );
}
