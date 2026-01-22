"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    disabled?: boolean;
    className?: string;
}

export function TimePicker({ date, setDate, disabled, className }: TimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10...

    const handleTimeChange = (type: "hour" | "minute", value: number) => {
        if (!date) {
            // If no date is selected, create a new one (today) with the selected time
            const newDate = new Date();
            newDate.setSeconds(0);
            newDate.setMilliseconds(0);

            if (type === "hour") {
                newDate.setHours(value);
                newDate.setMinutes(0);
            } else {
                newDate.setHours(0); // Default to 0 hours
                newDate.setMinutes(value);
            }
            setDate(newDate);
            return;
        }

        const newDate = new Date(date);
        if (type === "hour") {
            newDate.setHours(value);
        } else if (type === "minute") {
            newDate.setMinutes(value);
        }
        setDate(newDate);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {date ? (
                        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                    ) : (
                        <span>Pick a time</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex h-64 sm:h-[300px] divide-x border border-border bg-background rounded-md shadow-lg">
                    <ScrollArea className="w-16 sm:w-20 p-2">
                        <div className="flex flex-col gap-1">
                            <div className="text-xs font-semibold text-center mb-2 text-muted-foreground">Hour</div>
                            {hours.map((hour) => (
                                <Button
                                    key={hour}
                                    size="sm"
                                    variant={date && date.getHours() === hour ? "default" : "ghost"}
                                    className="w-full shrink-0 aspect-square"
                                    onClick={() => handleTimeChange("hour", hour)}
                                >
                                    {hour.toString().padStart(2, "0")}
                                </Button>
                            ))}
                        </div>
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                    <ScrollArea className="w-16 sm:w-20 p-2">
                        <div className="flex flex-col gap-1">
                            <div className="text-xs font-semibold text-center mb-2 text-muted-foreground">Min</div>
                            {minutes.map((minute) => (
                                <Button
                                    key={minute}
                                    size="sm"
                                    variant={date && date.getMinutes() === minute ? "default" : "ghost"}
                                    className="w-full shrink-0 aspect-square"
                                    onClick={() => handleTimeChange("minute", minute)}
                                >
                                    {minute.toString().padStart(2, "0")}
                                </Button>
                            ))}
                        </div>
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
}
