"use client";

import { useEffect, useCallback } from "react";
import { addDays, addMonths, addWeeks } from "date-fns";

interface UseCalendarKeyboardNavigationProps {
  currentDate: Date;
  view: "month" | "week" | "day" | "agenda";
  onDateChange: (date: Date) => void;
  onViewChange: (view: "month" | "week" | "day" | "agenda") => void;
  onToday: () => void;
  onCreateEvent?: () => void;
  enabled?: boolean;
}

/**
 * Custom hook for calendar keyboard navigation
 * 
 * Keyboard shortcuts:
 * - T: Go to today
 * - N: Next period (month/week/day)
 * - P: Previous period
 * - M: Month view
 * - W: Week view
 * - D: Day view
 * - A: Agenda view
 * - C: Create event (if enabled)
 * - Arrow keys: Navigate dates
 * - Escape: Clear focus
 * 
 * Requirements: Accessibility - Keyboard Navigation
 */
export function useCalendarKeyboardNavigation({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onToday,
  onCreateEvent,
  enabled = true,
}: UseCalendarKeyboardNavigationProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle keyboard shortcuts if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Don't handle if modifiers are pressed (except Shift for some shortcuts)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case "t":
          // Go to today
          event.preventDefault();
          onToday();
          break;

        case "n":
          // Next period
          event.preventDefault();
          if (view === "month") {
            onDateChange(addMonths(currentDate, 1));
          } else if (view === "week") {
            onDateChange(addWeeks(currentDate, 1));
          } else if (view === "day") {
            onDateChange(addDays(currentDate, 1));
          }
          break;

        case "p":
          // Previous period
          event.preventDefault();
          if (view === "month") {
            onDateChange(addMonths(currentDate, -1));
          } else if (view === "week") {
            onDateChange(addWeeks(currentDate, -1));
          } else if (view === "day") {
            onDateChange(addDays(currentDate, -1));
          }
          break;

        case "m":
          // Month view
          event.preventDefault();
          onViewChange("month");
          break;

        case "w":
          // Week view
          event.preventDefault();
          onViewChange("week");
          break;

        case "d":
          // Day view
          event.preventDefault();
          onViewChange("day");
          break;

        case "a":
          // Agenda view
          event.preventDefault();
          onViewChange("agenda");
          break;

        case "c":
          // Create event
          if (onCreateEvent) {
            event.preventDefault();
            onCreateEvent();
          }
          break;

        case "arrowleft":
          // Navigate left (previous day in day view, previous week in week view)
          if (view === "day") {
            event.preventDefault();
            onDateChange(addDays(currentDate, -1));
          } else if (view === "week") {
            event.preventDefault();
            onDateChange(addWeeks(currentDate, -1));
          }
          break;

        case "arrowright":
          // Navigate right (next day in day view, next week in week view)
          if (view === "day") {
            event.preventDefault();
            onDateChange(addDays(currentDate, 1));
          } else if (view === "week") {
            event.preventDefault();
            onDateChange(addWeeks(currentDate, 1));
          }
          break;

        case "arrowup":
          // Navigate up (previous week in month view, previous day in day view)
          if (view === "month") {
            event.preventDefault();
            onDateChange(addDays(currentDate, -7));
          } else if (view === "day") {
            event.preventDefault();
            onDateChange(addDays(currentDate, -1));
          }
          break;

        case "arrowdown":
          // Navigate down (next week in month view, next day in day view)
          if (view === "month") {
            event.preventDefault();
            onDateChange(addDays(currentDate, 7));
          } else if (view === "day") {
            event.preventDefault();
            onDateChange(addDays(currentDate, 1));
          }
          break;

        case "escape":
          // Clear focus from current element
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          break;

        default:
          break;
      }
    },
    [currentDate, view, onDateChange, onViewChange, onToday, onCreateEvent]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    // Return keyboard shortcut info for help display
    shortcuts: [
      { key: "T", description: "Go to today" },
      { key: "N", description: "Next period" },
      { key: "P", description: "Previous period" },
      { key: "M", description: "Month view" },
      { key: "W", description: "Week view" },
      { key: "D", description: "Day view" },
      { key: "A", description: "Agenda view" },
      ...(onCreateEvent ? [{ key: "C", description: "Create event" }] : []),
      { key: "Arrow keys", description: "Navigate dates" },
      { key: "Escape", description: "Clear focus" },
    ],
  };
}
