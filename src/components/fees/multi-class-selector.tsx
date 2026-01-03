"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface ClassOption {
  id: string;
  name: string;
  academicYearId?: string;
}

interface MultiClassSelectorProps {
  selectedClassIds: string[];
  onChange: (classIds: string[]) => void;
  classes: ClassOption[];
  academicYearId?: string;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

export function MultiClassSelector({
  selectedClassIds,
  onChange,
  classes,
  academicYearId,
  disabled = false,
  error,
  placeholder,
}: MultiClassSelectorProps) {
  const [open, setOpen] = useState(false);

  // Filter classes by academic year if provided
  const filteredClasses = useMemo(() => {
    if (!academicYearId) return classes;
    return classes.filter((c: any) => c.academicYearId === academicYearId);
  }, [classes, academicYearId]);

  // Get selected class objects
  const selectedClasses = useMemo(() => {
    return filteredClasses.filter((c) => selectedClassIds.includes(c.id));
  }, [filteredClasses, selectedClassIds]);

  // Handle class selection toggle
  const handleToggleClass = (classId: string) => {
    if (selectedClassIds.includes(classId)) {
      onChange(selectedClassIds.filter((id) => id !== classId));
    } else {
      onChange([...selectedClassIds, classId]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    onChange(filteredClasses.map((c) => c.id));
  };

  // Handle deselect all
  const handleDeselectAll = () => {
    onChange([]);
  };

  // Remove a specific class
  const handleRemoveClass = (classId: string) => {
    onChange(selectedClassIds.filter((id) => id !== classId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              error && "border-red-500",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <span className="truncate">
              {selectedClassIds.length === 0
                ? (placeholder || "Select classes...")
                : `${selectedClassIds.length} class${selectedClassIds.length > 1 ? "es" : ""
                } selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={placeholder || "Search classes..."} />
            <CommandEmpty>No classes found.</CommandEmpty>
            <CommandGroup>
              <div className="flex gap-2 p-2 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={handleDeselectAll}
                >
                  Deselect All
                </Button>
              </div>
              {filteredClasses.map((classItem) => (
                <CommandItem
                  key={classItem.id}
                  value={classItem.name}
                  onSelect={() => handleToggleClass(classItem.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedClassIds.includes(classItem.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {classItem.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Display selected classes as badges */}
      {selectedClasses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedClasses.map((classItem) => (
            <Badge
              key={classItem.id}
              variant="secondary"
              className="pl-2 pr-1 py-1"
            >
              {classItem.name}
              <button
                type="button"
                className="ml-1 rounded-full hover:bg-muted"
                onClick={() => handleRemoveClass(classItem.id)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
