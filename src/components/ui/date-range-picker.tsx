"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value?: DateRange | undefined;
  onValueChange: (value: DateRange | undefined) => void;
  className?: string;
  align?: "start" | "center" | "end";
  calendarClassName?: string;
}

export function DateRangePicker({
  value,
  onValueChange,
  className,
  align = "end",
  calendarClassName,
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[270px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "MMM d, yyyy")} - {format(value.to, "MMM d, yyyy")}
                </>
              ) : (
                format(value.from, "MMM d, yyyy")
              )
            ) : (
              <span>Select date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onValueChange}
            numberOfMonths={2}
            className={cn("border-0", calendarClassName)}
          />
          <div className="flex items-center justify-between p-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Select a date range to filter
            </div>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onValueChange(undefined)}
              >
                Clear
              </Button>
              <Button 
                size="sm" 
                onClick={() => {
                  if (value?.from) {
                    const to = value.to || value.from;
                    onValueChange({ from: value.from, to });
                  }
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
