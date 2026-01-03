/**
 * Virtual Event List Component
 * 
 * Implements virtual scrolling for large event lists in agenda view.
 * Only renders visible items for optimal performance.
 * 
 * Performance Requirements: Task 23
 */

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CalendarEvent, CalendarEventCategory } from '@prisma/client';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventWithCategory extends CalendarEvent {
  category: CalendarEventCategory;
}

interface VirtualEventListProps {
  events: EventWithCategory[];
  onEventClick?: (event: EventWithCategory) => void;
  groupBy?: 'date' | 'category';
  itemHeight?: number; // Height of each item in pixels
  overscan?: number; // Number of items to render outside visible area
  className?: string;
}

/**
 * Virtual Event List with windowing for performance
 * Only renders visible items plus overscan buffer
 */
export function VirtualEventList({
  events,
  onEventClick,
  groupBy = 'date',
  itemHeight = 100,
  overscan = 5,
  className
}: VirtualEventListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Group events
  const groupedEvents = React.useMemo(() => {
    if (groupBy === 'date') {
      return groupEventsByDate(events);
    } else {
      return groupEventsByCategory(events);
    }
  }, [events, groupBy]);

  // Flatten grouped events for virtual scrolling
  const flatItems = React.useMemo(() => {
    const items: Array<{ type: 'header' | 'event'; data: any; key: string }> = [];
    
    groupedEvents.forEach((group) => {
      items.push({
        type: 'header',
        data: group.label,
        key: `header-${group.label}`
      });
      
      group.events.forEach((event) => {
        items.push({
          type: 'event',
          data: event,
          key: `event-${event.id}`
        });
      });
    });
    
    return items;
  }, [groupedEvents]);

  // Calculate visible range
  const visibleRange = React.useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      flatItems.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, overscan, flatItems.length]);

  // Get visible items
  const visibleItems = React.useMemo(() => {
    return flatItems.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [flatItems, visibleRange]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Update container height on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const totalHeight = flatItems.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto h-full', className)}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item) => (
            <div
              key={item.key}
              style={{ height: itemHeight }}
              className="px-4"
            >
              {item.type === 'header' ? (
                <EventGroupHeader label={item.data} />
              ) : (
                <EventCard
                  event={item.data}
                  onClick={() => onEventClick?.(item.data)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Event group header component
 */
function EventGroupHeader({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 border-b">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </h3>
    </div>
  );
}

/**
 * Event card component
 */
function EventCard({
  event,
  onClick
}: {
  event: EventWithCategory;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
        'hover:bg-accent hover:border-accent-foreground/20'
      )}
      onClick={onClick}
      style={{
        borderLeftColor: event.category.color,
        borderLeftWidth: '4px'
      }}
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{event.title}</h4>
        
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {event.isAllDay
                ? format(event.startDate, 'MMM d, yyyy')
                : format(event.startDate, 'MMM d, yyyy')}
            </span>
          </div>
          
          {!event.isAllDay && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {format(event.startDate, 'h:mm a')} - {format(event.endDate, 'h:mm a')}
              </span>
            </div>
          )}
          
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
        
        {event.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
      
      <div
        className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
        style={{ backgroundColor: event.category.color }}
        title={event.category.name}
      />
    </div>
  );
}

/**
 * Group events by date
 */
function groupEventsByDate(events: EventWithCategory[]) {
  const groups = new Map<string, EventWithCategory[]>();
  
  events.forEach((event) => {
    const dateKey = format(event.startDate, 'yyyy-MM-dd');
    const dateLabel = format(event.startDate, 'EEEE, MMMM d, yyyy');
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(event);
  });
  
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, events]) => ({
      label: format(new Date(key), 'EEEE, MMMM d, yyyy'),
      events: events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    }));
}

/**
 * Group events by category
 */
function groupEventsByCategory(events: EventWithCategory[]) {
  const groups = new Map<string, EventWithCategory[]>();
  
  events.forEach((event) => {
    const categoryId = event.category.id;
    const categoryName = event.category.name;
    
    if (!groups.has(categoryId)) {
      groups.set(categoryId, []);
    }
    groups.get(categoryId)!.push(event);
  });
  
  return Array.from(groups.entries())
    .sort(([, a], [, b]) => {
      // Sort by category name
      return a[0].category.name.localeCompare(b[0].category.name);
    })
    .map(([key, events]) => ({
      label: events[0].category.name,
      events: events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    }));
}
