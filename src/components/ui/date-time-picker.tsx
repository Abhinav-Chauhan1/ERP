"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

interface DateTimePickerProps {
  date: Date
  setDate: (date: Date | undefined) => void
  disabled?: boolean
}

export function DateTimePicker({ date, setDate, disabled }: DateTimePickerProps) {
  const [selectedTime, setSelectedTime] = React.useState<string>(
    format(date, "HH:mm")
  )

  const handleTimeChange = React.useCallback((time: string) => {
    setSelectedTime(time)
    
    const [hours, minutes] = time.split(':').map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    
    setDate(newDate)
  }, [date, setDate])

  // Update selected time when date changes (in case the time portion changes)
  React.useEffect(() => {
    setSelectedTime(format(date, "HH:mm"))
  }, [date])

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(day) => {
              if (day) {
                const newDate = new Date(day)
                // Preserve the current time
                const [hours, minutes] = selectedTime.split(':').map(Number)
                newDate.setHours(hours)
                newDate.setMinutes(minutes)
                setDate(newDate)
              }
            }}
            initialFocus
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center">
        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
        <Input
          type="time"
          value={selectedTime}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="w-[120px]"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
