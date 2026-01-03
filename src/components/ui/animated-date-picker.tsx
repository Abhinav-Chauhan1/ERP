"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { format, addMonths, setYear, getYear, setMonth, getMonth, addYears, subYears, startOfYear, endOfYear, eachYearOfInterval } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
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

type ViewMode = "calendar" | "years"

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
    const [view, setView] = React.useState<ViewMode>("calendar")
    const [navDate, setNavDate] = React.useState<Date>(date || new Date())
    const [direction, setDirection] = React.useState(0)

    // Memoize years for the year picker
    const years = React.useMemo(() => {
        const y = []
        for (let i = endYear; i >= startYear; i--) {
            y.push(i)
        }
        return y
    }, [startYear, endYear])

    const handleMonthChange = (newMonth: Date) => {
        setDirection(newMonth > navDate ? 1 : -1)
        setNavDate(newMonth)
    }

    const handleYearSelect = (year: number) => {
        const newDate = setYear(navDate, year)
        setNavDate(newDate)
        setView("calendar")
    }

    // Variants for animations
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 100 : -100,
            opacity: 0,
        }),
    }

    // When opening, reset to calendar view and sync with selected date
    React.useEffect(() => {
        if (isOpen && date) {
            setNavDate(date)
        }
        if (!isOpen) {
            // Delay reset to avoid flicker during close animation
            const t = setTimeout(() => setView("calendar"), 300)
            return () => clearTimeout(t)
        }
    }, [isOpen, date])

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
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
            <PopoverContent className="w-auto p-0 overflow-hidden" align="start">
                <div className="p-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMonthChange(addMonths(navDate, -1))}
                            disabled={view === "years"}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            className="font-semibold text-sm hover:bg-accent transition-colors"
                            onClick={() => setView(view === "calendar" ? "years" : "calendar")}
                        >
                            <span className={cn(view === "years" ? "text-primary" : "")}>
                                {format(navDate, "MMMM yyyy")}
                            </span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMonthChange(addMonths(navDate, 1))}
                            disabled={view === "years"}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="relative h-[290px] w-[280px]">
                        <AnimatePresence initial={false} custom={direction}>
                            {view === "calendar" ? (
                                <motion.div
                                    key="calendar"
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="absolute inset-0"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(d) => {
                                            onSelect(d)
                                            if (d) {
                                                setIsOpen(false)
                                                setNavDate(d)
                                            }
                                        }}
                                        month={navDate}
                                        onMonthChange={setNavDate}
                                        disabled={disabled}
                                        initialFocus
                                        className="p-0 border-none shadow-none"
                                        classNames={{
                                            month: "space-y-4 w-full",
                                            caption: "hidden", // We use our own header
                                            nav: "hidden",     // We use our own header
                                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md transition-colors",
                                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md",
                                            day_today: "bg-accent/50 text-accent-foreground font-bold",
                                        }}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="years"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 bg-background z-10"
                                >
                                    <ScrollArea className="h-full w-full rounded-md border">
                                        <div className="grid grid-cols-4 gap-2 p-2">
                                            {years.map((year) => (
                                                <Button
                                                    key={year}
                                                    variant={getYear(navDate) === year ? "default" : "ghost"}
                                                    className={cn(
                                                        "h-9 w-full text-xs",
                                                        getYear(navDate) === year && "shadow-md"
                                                    )}
                                                    onClick={() => handleYearSelect(year)}
                                                >
                                                    {year}
                                                </Button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
