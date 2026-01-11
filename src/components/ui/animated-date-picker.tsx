"use client"

import * as React from "react"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AnimatedDatePickerProps {
    date: Date | undefined
    onSelect: (date: Date | undefined) => void
    disabled?: (date: Date) => boolean
    placeholder?: string
    className?: string
    startYear?: number
    endYear?: number
}

export function AnimatedDatePicker({
    date,
    onSelect,
    disabled,
    placeholder = "Select date",
    className,
    startYear = 1900,
    endYear = new Date().getFullYear() + 10,
}: AnimatedDatePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [currentMonth, setCurrentMonth] = React.useState(date || new Date())

    const years = React.useMemo(() => {
        const arr = []
        for (let i = startYear; i <= endYear; i++) {
            arr.push(i)
        }
        return arr
    }, [startYear, endYear])

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const handleSelect = (selectedDate: Date | null) => {
        onSelect(selectedDate || undefined)
        setIsOpen(false)
    }

    const handleMonthChange = (newMonth: string) => {
        const newDate = new Date(currentMonth)
        newDate.setMonth(parseInt(newMonth))
        setCurrentMonth(newDate)
    }

    const handleYearChange = (newYear: string) => {
        const newDate = new Date(currentMonth)
        newDate.setFullYear(parseInt(newYear))
        setCurrentMonth(newDate)
    }

    const goToPreviousMonth = () => {
        const newDate = new Date(currentMonth)
        newDate.setMonth(newDate.getMonth() - 1)
        setCurrentMonth(newDate)
    }

    const goToNextMonth = () => {
        const newDate = new Date(currentMonth)
        newDate.setMonth(newDate.getMonth() + 1)
        setCurrentMonth(newDate)
    }

    const filterDate = disabled ? (date: Date) => !disabled(date) : undefined

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
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
            <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                <div className="flex flex-col">
                    {/* Header with navigation and dropdowns */}
                    <div className="flex items-center justify-between gap-2 px-3 py-3 border-b">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={goToPreviousMonth}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex gap-2">
                            <Select
                                value={currentMonth.getMonth().toString()}
                                onValueChange={handleMonthChange}
                            >
                                <SelectTrigger className="h-8 w-[110px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
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
                                <SelectTrigger className="h-8 w-[80px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
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
                            className="h-7 w-7"
                            onClick={goToNextMonth}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Calendar */}
                    <div className="p-3 flex justify-center">
                        <ReactDatePicker
                            selected={date}
                            onChange={handleSelect}
                            filterDate={filterDate}
                            inline
                            openToDate={currentMonth}
                            onMonthChange={setCurrentMonth}
                            renderCustomHeader={() => <></>}
                            calendarClassName="custom-calendar"
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
