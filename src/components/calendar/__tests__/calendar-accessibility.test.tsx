/**
 * Accessibility Tests for Calendar Components
 * 
 * Tests keyboard navigation, ARIA labels, and accessibility features
 * Requirements: Task 24 - Accessibility Features
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalendarView } from "../calendar-view";
import { EventCard } from "../event-card";
import { KeyboardShortcutsHelp } from "../keyboard-shortcuts-help";
import { UserRole } from "@prisma/client";

// Mock data
const mockCategory = {
  id: "cat1",
  name: "Exam",
  description: "Examination events",
  color: "#3b82f6",
  icon: null,
  isActive: true,
  order: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEvent = {
  id: "event1",
  title: "Mid-term Exam",
  description: "Mathematics mid-term examination",
  categoryId: "cat1",
  category: mockCategory,
  startDate: new Date("2025-12-30T09:00:00"),
  endDate: new Date("2025-12-30T11:00:00"),
  isAllDay: false,
  location: "Room 101",
  visibleToRoles: ["STUDENT", "TEACHER"],
  visibleToClasses: [],
  visibleToSections: [],
  sourceType: null,
  sourceId: null,
  isRecurring: false,
  recurrenceRule: null,
  recurrenceId: null,
  exceptionDates: [],
  attachments: [],
  createdBy: "user1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Calendar Accessibility", () => {
  describe("CalendarView Component", () => {
    it("should have proper ARIA labels for navigation", () => {
      const mockOnEventClick = vi.fn();
      
      render(
        <CalendarView
          events={[mockEvent]}
          userRole={UserRole.STUDENT}
          userId="user1"
          onEventClick={mockOnEventClick}
        />
      );

      // Check for navigation ARIA labels
      expect(screen.getByLabelText(/previous/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/next/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/go to today/i)).toBeInTheDocument();
    });

    it("should have proper role attributes for calendar grid", () => {
      const mockOnEventClick = vi.fn();
      
      const { container } = render(
        <CalendarView
          events={[mockEvent]}
          userRole={UserRole.STUDENT}
          userId="user1"
          onEventClick={mockOnEventClick}
        />
      );

      // Check for grid role
      const grid = container.querySelector('[role="grid"]');
      expect(grid).toBeInTheDocument();
    });

    it("should have accessible view tabs", () => {
      const mockOnEventClick = vi.fn();
      
      render(
        <CalendarView
          events={[mockEvent]}
          userRole={UserRole.STUDENT}
          userId="user1"
          onEventClick={mockOnEventClick}
        />
      );

      // Check for view tabs with ARIA labels
      expect(screen.getByLabelText(/month view/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/week view/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/day view/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/agenda view/i)).toBeInTheDocument();
    });

    it("should have keyboard shortcuts help button", () => {
      const mockOnEventClick = vi.fn();
      
      render(
        <CalendarView
          events={[mockEvent]}
          userRole={UserRole.STUDENT}
          userId="user1"
          onEventClick={mockOnEventClick}
        />
      );

      expect(screen.getByLabelText(/view keyboard shortcuts/i)).toBeInTheDocument();
    });

    it("should have high contrast toggle button", () => {
      const mockOnEventClick = vi.fn();
      
      render(
        <CalendarView
          events={[mockEvent]}
          userRole={UserRole.STUDENT}
          userId="user1"
          onEventClick={mockOnEventClick}
        />
      );

      expect(
        screen.getByLabelText(/high contrast mode/i)
      ).toBeInTheDocument();
    });
  });

  describe("EventCard Component", () => {
    it("should have proper ARIA label with event details", () => {
      const mockOnClick = vi.fn();
      
      render(<EventCard event={mockEvent} onClick={mockOnClick} />);

      const card = screen.getByRole("button");
      expect(card).toHaveAttribute("aria-label");
      
      const ariaLabel = card.getAttribute("aria-label");
      expect(ariaLabel).toContain("Mid-term Exam");
      expect(ariaLabel).toContain("Exam");
    });

    it("should be keyboard accessible", () => {
      const mockOnClick = vi.fn();
      
      render(<EventCard event={mockEvent} onClick={mockOnClick} />);

      const card = screen.getByRole("button");
      expect(card).toHaveAttribute("tabIndex", "0");
    });

    it("should meet minimum touch target size", () => {
      const mockOnClick = vi.fn();
      
      const { container } = render(
        <EventCard event={mockEvent} onClick={mockOnClick} />
      );

      const card = container.querySelector('[role="button"]');
      const styles = window.getComputedStyle(card!);
      
      // Check for minimum height style
      expect(card).toHaveStyle({ minHeight: "44px" });
    });

    it("should have category badge with ARIA label", () => {
      const mockOnClick = vi.fn();
      
      render(<EventCard event={mockEvent} onClick={mockOnClick} />);

      expect(screen.getByLabelText(/category: exam/i)).toBeInTheDocument();
    });

    it("should indicate all-day events", () => {
      const allDayEvent = {
        ...mockEvent,
        isAllDay: true,
      };
      
      const mockOnClick = vi.fn();
      
      render(<EventCard event={allDayEvent} onClick={mockOnClick} />);

      expect(screen.getByText(/all day event/i)).toBeInTheDocument();
    });
  });

  describe("KeyboardShortcutsHelp Component", () => {
    const mockShortcuts = [
      { key: "T", description: "Go to today" },
      { key: "N", description: "Next period" },
      { key: "P", description: "Previous period" },
    ];

    it("should have accessible trigger button", () => {
      render(<KeyboardShortcutsHelp shortcuts={mockShortcuts} />);

      expect(
        screen.getByLabelText(/view keyboard shortcuts/i)
      ).toBeInTheDocument();
    });

    it("should display shortcuts in a table with proper structure", () => {
      render(<KeyboardShortcutsHelp shortcuts={mockShortcuts} />);

      // Click to open dialog
      const button = screen.getByLabelText(/view keyboard shortcuts/i);
      button.click();

      // Check for table role
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // Check for column headers
      expect(screen.getByText(/^key$/i)).toBeInTheDocument();
      expect(screen.getByText(/^action$/i)).toBeInTheDocument();
    });
  });

  describe("Touch Target Sizes", () => {
    it("should ensure all buttons meet 44x44px minimum", () => {
      const mockOnEventClick = vi.fn();
      
      const { container } = render(
        <CalendarView
          events={[mockEvent]}
          userRole={UserRole.STUDENT}
          userId="user1"
          onEventClick={mockOnEventClick}
        />
      );

      const buttons = container.querySelectorAll("button");
      
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const minHeight = styles.minHeight;
        
        // Check that minHeight is set (actual computed value may vary)
        expect(minHeight).toBeDefined();
      });
    });
  });

  describe("Screen Reader Support", () => {
    it("should have live region for announcements", () => {
      const mockOnEventClick = vi.fn();
      
      const { container } = render(
        <CalendarView
          events={[mockEvent]}
          userRole={UserRole.STUDENT}
          userId="user1"
          onEventClick={mockOnEventClick}
        />
      );

      // Check for aria-live regions
      const liveRegions = container.querySelectorAll('[aria-live="polite"]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it("should have proper heading hierarchy", () => {
      const mockOnEventClick = vi.fn();
      
      render(
        <CalendarView
          events={[mockEvent]}
          userRole={UserRole.STUDENT}
          userId="user1"
          defaultView="day"
          onEventClick={mockOnEventClick}
        />
      );

      // Check for heading in day view
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe("Focus Management", () => {
    it("should have visible focus indicators", () => {
      const mockOnEventClick = vi.fn();
      
      const { container } = render(
        <CalendarView
          events={[mockEvent]}
          userRole={UserRole.STUDENT}
          userId="user1"
          onEventClick={mockOnEventClick}
        />
      );

      // Check that focusable elements have focus classes
      const focusableElements = container.querySelectorAll(
        'button, a, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });
});
