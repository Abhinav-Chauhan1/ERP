# Calendar Components

Shared calendar UI components for the Academic Calendar System. These components provide a comprehensive calendar interface used across all user dashboards (Admin, Teacher, Student, Parent).

## Components

### CalendarView

Main calendar component with multiple view modes (month, week, day, agenda).

**Features:**
- Multiple view modes (month/week/day/agenda)
- Event filtering by category
- Date navigation (previous/next/today)
- Event click to show details
- Responsive design for mobile devices
- Keyboard navigation support
- ARIA labels for accessibility

**Props:**
```typescript
interface CalendarViewProps {
  events: (CalendarEvent & { category: CalendarEventCategory })[];
  userRole: UserRole;
  userId: string;
  defaultView?: "month" | "week" | "day" | "agenda";
  showFilters?: boolean;
  showCreateButton?: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent?: () => void;
  className?: string;
}
```

**Usage:**
```tsx
import { CalendarView } from "@/components/calendar";

<CalendarView
  events={events}
  userRole="STUDENT"
  userId={userId}
  defaultView="month"
  onEventClick={handleEventClick}
/>
```

**Requirements:** 2.4

---

### EventCard

Displays a summary of a calendar event with category color coding.

**Features:**
- Event title, date, time, location
- Category badge with color
- Attachment indicator
- Truncated description
- Click handler for details
- Keyboard navigation

**Props:**
```typescript
interface EventCardProps {
  event: CalendarEvent & { category: CalendarEventCategory };
  onClick?: () => void;
  className?: string;
}
```

**Usage:**
```tsx
import { EventCard } from "@/components/calendar";

<EventCard
  event={event}
  onClick={() => handleEventClick(event)}
/>
```

**Requirements:** 2.4, 8.2

---

### EventList

Displays events in a chronological list format (agenda view).

**Features:**
- Chronological event list
- Group by date or category
- Event cards with category colors
- Empty state handling
- Responsive design

**Props:**
```typescript
interface EventListProps {
  events: (CalendarEvent & { category: CalendarEventCategory })[];
  onEventClick: (event: CalendarEvent) => void;
  groupBy?: "date" | "category";
  className?: string;
}
```

**Usage:**
```tsx
import { EventList } from "@/components/calendar";

<EventList
  events={events}
  onEventClick={handleEventClick}
  groupBy="date"
/>
```

**Requirements:** 3.4

---

### EventDetailModal

Displays full details of a calendar event in a modal dialog.

**Features:**
- Full event information display
- Category with color coding
- Attachments list
- Notes display (for teachers)
- Edit/Delete actions (for admins)
- Responsive modal
- Accessibility support

**Props:**
```typescript
interface EventDetailModalProps {
  event: (CalendarEvent & {
    category: CalendarEventCategory;
    notes?: EventNote[];
  }) | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  canEdit: boolean;
  className?: string;
}
```

**Usage:**
```tsx
import { EventDetailModal } from "@/components/calendar";

<EventDetailModal
  event={selectedEvent}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onEdit={handleEdit}
  onDelete={handleDelete}
  canEdit={userRole === "ADMIN"}
/>
```

**Requirements:** 3.5

---

### EventFormModal

Form for creating and editing calendar events (admin only).

**Features:**
- Create/Edit event form
- Category selection with colors
- Date/Time pickers
- All-day event toggle
- Recurrence configuration
- Visibility settings (roles)
- Form validation
- Error handling
- Responsive design

**Props:**
```typescript
interface EventFormModalProps {
  event?: CalendarEvent | null;
  categories: CalendarEventCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  className?: string;
}
```

**Usage:**
```tsx
import { EventFormModal } from "@/components/calendar";

<EventFormModal
  event={editingEvent}
  categories={categories}
  isOpen={isFormOpen}
  onClose={() => setIsFormOpen(false)}
  onSave={handleSaveEvent}
/>
```

**Requirements:** 1.1

---

### CalendarFilters

Provides category filtering controls for the calendar.

**Features:**
- Category checkboxes with color indicators
- Select all/none functionality
- Clear filters button
- Scrollable category list
- Accessibility support

**Props:**
```typescript
interface CalendarFiltersProps {
  categories: CalendarEventCategory[];
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  onClearFilters: () => void;
  className?: string;
}
```

**Usage:**
```tsx
import { CalendarFilters } from "@/components/calendar";

<CalendarFilters
  categories={categories}
  selectedCategories={selectedCategories}
  onCategoryToggle={handleCategoryToggle}
  onClearFilters={handleClearFilters}
/>
```

**Requirements:** 7.2, 7.3

---

## Accessibility Features

All calendar components include:

1. **Keyboard Navigation:**
   - Tab through interactive elements
   - Enter/Space to activate buttons
   - Arrow keys for calendar navigation (in CalendarView)

2. **Screen Reader Support:**
   - ARIA labels on all interactive elements
   - ARIA roles for semantic structure
   - ARIA live regions for dynamic updates
   - Descriptive button labels

3. **Visual Accessibility:**
   - High contrast support
   - Color-blind friendly (not relying solely on color)
   - Minimum 4.5:1 contrast ratio
   - Focus indicators on all interactive elements
   - Scalable text (supports zoom)

4. **Touch Targets:**
   - Minimum 44x44px touch targets on mobile
   - Adequate spacing between interactive elements

## Responsive Design

All components are fully responsive:

- **Mobile (< 640px):** Single column layouts, stacked buttons
- **Tablet (640px - 1024px):** Optimized grid layouts
- **Desktop (> 1024px):** Full-featured layouts

## Integration Example

Complete example of integrating calendar components in a dashboard:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  CalendarView,
  EventDetailModal,
  EventFormModal,
  CalendarFilters,
} from "@/components/calendar";
import { CalendarEvent, CalendarEventCategory } from "@prisma/client";

export function CalendarDashboard({ userRole, userId }) {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Fetch events and categories
  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const fetchEvents = async () => {
    const response = await fetch("/api/calendar/events");
    const data = await response.json();
    setEvents(data);
  };

  const fetchCategories = async () => {
    const response = await fetch("/api/calendar/categories");
    const data = await response.json();
    setCategories(data);
    setSelectedCategories(data.map(c => c.id));
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleSaveEvent = async (eventData) => {
    // Save event logic
    await fetch("/api/calendar/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
    fetchEvents();
  };

  const filteredEvents = events.filter(event =>
    selectedCategories.includes(event.categoryId)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <CalendarFilters
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryToggle={(id) => {
            setSelectedCategories(prev =>
              prev.includes(id)
                ? prev.filter(c => c !== id)
                : [...prev, id]
            );
          }}
          onClearFilters={() => setSelectedCategories([])}
        />
      </div>

      <div className="lg:col-span-3">
        <CalendarView
          events={filteredEvents}
          userRole={userRole}
          userId={userId}
          onEventClick={handleEventClick}
          onCreateEvent={() => setIsFormOpen(true)}
          showCreateButton={userRole === "ADMIN"}
        />
      </div>

      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        canEdit={userRole === "ADMIN"}
      />

      <EventFormModal
        categories={categories}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveEvent}
      />
    </div>
  );
}
```

## Testing

All components should be tested for:

1. **Rendering:** Components render without errors
2. **Interactions:** Click handlers work correctly
3. **Keyboard Navigation:** All interactive elements are keyboard accessible
4. **Accessibility:** ARIA labels and roles are correct
5. **Responsive Design:** Components work on all screen sizes

## Dependencies

- `@prisma/client` - Database types
- `date-fns` - Date manipulation and formatting
- `react-hook-form` - Form handling
- `zod` - Form validation
- `@hookform/resolvers` - Form validation integration
- `lucide-react` - Icons
- `@radix-ui/*` - UI primitives (via shadcn/ui)

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)
