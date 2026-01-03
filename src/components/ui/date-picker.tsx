"use client";

import * as React from "react";
import { format, addMonths } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DayPicker } from "react-day-picker";

interface DatePickerProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
  className?: string;
  startYear?: number;
  endYear?: number;
}

export function DatePicker({
  date,
  onSelect,
  disabled,
  placeholder = "Select date",
  className,
  startYear = 1900,
  endYear = new Date().getFullYear() + 20,
}: DatePickerProps) {
  // This state is used for the month/year navigation
  const [navMonth, setNavMonth] = React.useState<Date>(date || new Date());

  // Generate years array
  const years = React.useMemo(() => {
    const years = [];
    for (let i = startYear; i <= endYear; i++) {
      years.push(i);
    }
    // Return reversed so most recent years are at top if desired, or sort appropriately
    return years.sort((a, b) => b - a); // Descending order
  }, [startYear, endYear]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full pl-3 text-left font-normal flex justify-between",
            !date && "text-muted-foreground",
            className
          )}
        >
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex justify-center items-center pt-3 pb-2 px-2 w-full gap-1">
          <div className="flex items-center gap-1 rounded-md bg-accent/50 p-1">
            <button
              onClick={() => setNavMonth(addMonths(navMonth, -1))}
              className="p-1 rounded-md hover:bg-accent"
              aria-label="Previous month"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              <Select
                value={navMonth.getMonth().toString()}
                onValueChange={(value) => {
                  const newMonth = new Date(
                    navMonth.getFullYear(),
                    parseInt(value),
                    1
                  );
                  setNavMonth(newMonth);
                }}
              >
                <SelectTrigger className="h-8 w-[100px] px-2 py-0 text-sm">
                  <SelectValue placeholder={format(navMonth, "MMMM")} />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[200px]">
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {format(new Date(navMonth.getFullYear(), i, 1), "MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={navMonth.getFullYear().toString()}
                onValueChange={(value) => {
                  const newMonth = new Date(
                    parseInt(value),
                    navMonth.getMonth(),
                    1
                  );
                  setNavMonth(newMonth);
                }}
              >
                <SelectTrigger className="h-8 w-[80px] px-2 py-0 text-sm">
                  <SelectValue placeholder={navMonth.getFullYear().toString()} />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[200px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={() => setNavMonth(addMonths(navMonth, 1))}
              className="p-1 rounded-md hover:bg-accent"
              aria-label="Next month"
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Calendar
          mode="single"
          selected={date}
          onSelect={(selected) => {
            onSelect(selected);
            if (selected) {
              setNavMonth(selected); // Sync nav view with selection if needed, or keeping it independent is fine. But usually good UX.
            }
          }}
          month={navMonth}
          onMonthChange={setNavMonth}
          initialFocus
          disabled={disabled}
          className="rounded-md border shadow"
          classNames={{
            day_hidden: "invisible",
            caption: "hidden",
            nav: "hidden",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-xs",
            table: "w-full border-collapse space-y-1",
            cell: "text-center text-sm relative p-0 focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
