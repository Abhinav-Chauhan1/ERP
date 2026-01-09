"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EffectiveDateRangePickerProps {
  effectiveFrom?: Date;
  onEffectiveFromChange: (date: Date | undefined) => void;
  effectiveTo?: Date;
  onEffectiveToChange: (date: Date | undefined) => void;
  disabled?: boolean;
}

export function EffectiveDateRangePicker({
  effectiveFrom,
  onEffectiveFromChange,
  effectiveTo,
  onEffectiveToChange,
  disabled = false,
}: EffectiveDateRangePickerProps) {
  const [fromOpen, setFromOpen] = React.useState(false);
  const [toOpen, setToOpen] = React.useState(false);

  // Validation: effectiveTo must be after effectiveFrom
  const hasDateError =
    effectiveFrom &&
    effectiveTo &&
    effectiveTo.getTime() <= effectiveFrom.getTime();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="effective-from">Effective From (Optional)</Label>
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              id="effective-from"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !effectiveFrom && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {effectiveFrom ? (
                format(effectiveFrom, "PPP")
              ) : (
                <span>Pick a start date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={effectiveFrom}
              onSelect={(date) => {
                onEffectiveFromChange(date);
                setFromOpen(false);
              }}
              initialFocus
            />
            {effectiveFrom && (
              <div className="flex items-center justify-end p-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onEffectiveFromChange(undefined);
                    setFromOpen(false);
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <p className="text-sm text-muted-foreground">
          The date when this syllabus becomes active
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="effective-to">Effective To (Optional)</Label>
        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button
              id="effective-to"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !effectiveTo && "text-muted-foreground",
                hasDateError && "border-destructive"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {effectiveTo ? (
                format(effectiveTo, "PPP")
              ) : (
                <span>Pick an end date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={effectiveTo}
              onSelect={(date) => {
                onEffectiveToChange(date);
                setToOpen(false);
              }}
              disabled={(date) =>
                effectiveFrom ? date <= effectiveFrom : false
              }
              initialFocus
            />
            {effectiveTo && (
              <div className="flex items-center justify-end p-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onEffectiveToChange(undefined);
                    setToOpen(false);
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <p
          className={cn(
            "text-sm",
            hasDateError ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {hasDateError
            ? "End date must be after start date"
            : "The date when this syllabus expires"}
        </p>
      </div>

      {effectiveFrom && effectiveTo && !hasDateError && (
        <div className="rounded-md bg-muted p-3">
          <p className="text-sm text-muted-foreground">
            This syllabus will be active from{" "}
            <span className="font-medium text-foreground">
              {format(effectiveFrom, "PPP")}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {format(effectiveTo, "PPP")}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
