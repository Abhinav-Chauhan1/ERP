"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getTeacherAvailability } from "@/lib/actions/parent-meeting-actions";
import { cn } from "@/lib/utils";

interface TimeSlot {
  time: string;
  label: string;
}

interface AvailabilityData {
  teacherId: string;
  teacherName: string;
  date: string;
  availableSlots: TimeSlot[];
}

interface TeacherAvailabilityCalendarProps {
  teacherId: string;
  teacherName: string;
  onSlotSelect: (dateTime: string) => void;
  selectedSlot?: string;
}

export function TeacherAvailabilityCalendar({
  teacherId,
  teacherName,
  onSlotSelect,
  selectedSlot,
}: TeacherAvailabilityCalendarProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const loadAvailability = useCallback(async (date: Date) => {
    setIsLoadingSlots(true);
    startTransition(async () => {
      try {
        const result = await getTeacherAvailability(
          teacherId,
          format(date, "yyyy-MM-dd")
        );

        if (result.success && result.data) {
          setAvailability(result.data);
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to load availability",
            variant: "destructive",
          });
          setAvailability(null);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        setAvailability(null);
      } finally {
        setIsLoadingSlots(false);
      }
    });
  }, [teacherId, toast, startTransition]);

  // Load availability when date is selected
  useEffect(() => {
    if (selectedDate && teacherId) {
      loadAvailability(selectedDate);
    }
  }, [selectedDate, teacherId, loadAvailability]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
    setSelectedDate(null);
    setAvailability(null);
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
    setSelectedDate(null);
    setAvailability(null);
  };

  const handleDateSelect = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) {
      toast({
        title: "Invalid Date",
        description: "Cannot select a past date",
        variant: "destructive",
      });
      return;
    }
    setSelectedDate(date);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    onSlotSelect(slot.time);
  };

  const isDateSelected = (date: Date) => selectedDate && isSameDay(date, selectedDate);
  const isPastDate = (date: Date) => isBefore(date, startOfDay(new Date()));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Teacher Availability
        </CardTitle>
        <CardDescription>
          Select a date to view available time slots for {teacherName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousWeek}
            disabled={isPending}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm font-medium">
            {format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            disabled={isPending}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const isPast = isPastDate(day);
            const isSelected = isDateSelected(day);
            const isTodayDate = isToday(day);

            return (
              <button
                key={index}
                onClick={() => !isPast && handleDateSelect(day)}
                disabled={isPast || isPending}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg border transition-all min-h-[80px]",
                  "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  isPast && "opacity-40 cursor-not-allowed",
                  isSelected && "bg-primary text-primary-foreground border-primary",
                  !isSelected && !isPast && "bg-card hover:bg-accent",
                  isTodayDate && !isSelected && "border-primary border-2"
                )}
              >
                <span className="text-xs font-medium mb-1">
                  {format(day, "EEE")}
                </span>
                <span className={cn(
                  "text-2xl font-bold",
                  isSelected && "text-primary-foreground"
                )}>
                  {format(day, "d")}
                </span>
                {isTodayDate && !isSelected && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    Today
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Available Time Slots */}
        {selectedDate && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Available Times - {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </h4>
              {isLoadingSlots && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {isLoadingSlots ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-muted animate-pulse rounded-md"
                  />
                ))}
              </div>
            ) : availability && availability.availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {availability.availableSlots.map((slot, index) => {
                  const isSelected = selectedSlot === slot.time;

                  return (
                    <Button
                      key={index}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSlotSelect(slot)}
                      disabled={isPending}
                      className={cn(
                        "justify-center",
                        isSelected && "ring-2 ring-primary ring-offset-2"
                      )}
                    >
                      {slot.label}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted rounded-lg">
                <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No available time slots for this date
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please select a different date
                </p>
              </div>
            )}
          </div>
        )}

        {!selectedDate && (
          <div className="text-center py-8 bg-muted rounded-lg">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select a date above to view available time slots
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
