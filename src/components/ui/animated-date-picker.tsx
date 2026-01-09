"use client"

import * as React from "react"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import "@/styles/datepicker.css"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AnimatedDatePickerProps {
    date: Date | undefined
    onSelect: (date: Date | undefined) => void
    disabled?: (date: Date) => boolean
    placeholder?: string
    className?: string
    startYear?: number
    endYear?: number
}

type ViewMode = "calendar" | "years" | "months"

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
    const [view, setView] = React.useState<ViewMode>("calendar")

    const handleChange = (selectedDate: Date | null) => {
        onSelect(selectedDate || undefined)
        setIsOpen(false)
    }

    const filterDate = disabled ? (date: Date) => !disabled(date) : undefined

    const years = React.useMemo(() => {
        const arr = []
        for (let i = endYear; i >= startYear; i--) {
            arr.push(i)
        }
        return arr
    }, [startYear, endYear])

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

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

    const handleYearSelect = (year: number) => {
        const newDate = new Date(currentMonth)
        newDate.setFullYear(year)
        setCurrentMonth(newDate)
        setView("months")
    }

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = new Date(currentMonth)
        newDate.setMonth(monthIndex)
        setCurrentMonth(newDate)
        setView("calendar")
    }

    return (
        <div className="relative">
            <Button
                type="button"
                variant="outline"
                className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                    className
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>{placeholder}</span>}
            </Button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-50 mt-2 rounded-md border border-border bg-background shadow-lg overflow-hidden">
                        {/* Custom Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-accent"
                                onClick={goToPreviousMonth}
                                disabled={view !== "calendar"}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-8 px-3 text-sm font-semibold hover:bg-accent"
                                    onClick={() => setView(view === "months" ? "calendar" : "months")}
                                >
                                    {format(currentMonth, "MMMM")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-8 px-3 text-sm font-semibold hover:bg-accent"
                                    onClick={() => setView(view === "years" ? "calendar" : "years")}
                                >
                                    {currentMonth.getFullYear()}
                                </Button>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-accent"
                                onClick={goToNextMonth}
                                disabled={view !== "calendar"}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="w-[280px]">
                            {view === "calendar" && (
                                <ReactDatePicker
                                    selected={date}
                                    onChange={handleChange}
                                    filterDate={filterDate}
                                    inline
                                    openToDate={currentMonth}
                                    onMonthChange={setCurrentMonth}
                                    renderCustomHeader={() => <></>}
                                    calendarClassName="!border-0"
                                />
                            )}

                            {view === "months" && (
                                <div className="p-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        {months.map((month, index) => (
                                            <Button
                                                key={month}
                                                type="button"
                                                variant={currentMonth.getMonth() === index ? "default" : "ghost"}
                                                className="h-12 text-sm"
                                                onClick={() => handleMonthSelect(index)}
                                            >
                                                {month.slice(0, 3)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {view === "years" && (
                                <ScrollArea className="h-[280px]">
                                    <div className="grid grid-cols-4 gap-2 p-3">
                                        {years.map((year) => (
                                            <Button
                                                key={year}
                                                type="button"
                                                variant={currentMonth.getFullYear() === year ? "default" : "ghost"}
                                                className="h-10 text-sm"
                                                onClick={() => handleYearSelect(year)}
                                            >
                                                {year}
                                            </Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
