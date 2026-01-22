"use client";

import * as React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker.css";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  onDateChange?: (date: Date | undefined) => void;
  disabled?: boolean | ((date: Date) => boolean);
  placeholder?: string;
  className?: string;
  startYear?: number;
  endYear?: number;
}

export function DatePicker({
  date,
  onSelect,
  onDateChange,
  disabled,
  placeholder = "Select date",
  className,
  startYear = 1900,
  endYear = new Date().getFullYear() + 100,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState(date || new Date());
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const handleChange = (selectedDate: Date | null) => {
    const dateValue = selectedDate || undefined;
    onSelect(dateValue);
    if (onDateChange) {
      onDateChange(dateValue);
    }
    setIsPopoverOpen(false);
  };

  const isInputDisabled = typeof disabled === 'boolean' ? disabled : false;
  const isDateDisabled = typeof disabled === 'function' ? disabled : undefined;

  const filterDate = isDateDisabled ? (date: Date) => !isDateDisabled(date) : undefined;

  const years = React.useMemo(() => {
    const arr = [];
    for (let i = endYear; i >= startYear; i--) {
      arr.push(i);
    }
    return arr;
  }, [startYear, endYear]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(parseInt(month));
    setCurrentMonth(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(parseInt(year));
    setCurrentMonth(newDate);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={isInputDisabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0 bg-transparent shadow-none" align="start">
        <div className="rounded-md border border-border bg-background shadow-lg overflow-hidden">
          {/* Custom Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 bg-background sticky top-0 z-10">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-accent"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Select
                value={currentMonth.getMonth().toString()}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="h-8 w-[120px] border-0 bg-transparent hover:bg-accent focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={currentMonth.getFullYear().toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="h-8 w-[90px] border-0 bg-transparent hover:bg-accent focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-accent"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar */}
          <ReactDatePicker
            selected={date}
            onChange={handleChange}
            filterDate={filterDate}
            inline
            openToDate={currentMonth}
            onMonthChange={setCurrentMonth}
            renderCustomHeader={() => <></>}
            calendarClassName="!border-0 !m-0"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
