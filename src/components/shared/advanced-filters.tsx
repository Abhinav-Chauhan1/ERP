"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, X, Save, Trash2 } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface FilterConfig {
  id: string;
  label: string;
  type: "select" | "text" | "date-range" | "multi-select";
  options?: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export interface FilterValue {
  [key: string]: string | string[] | DateRange | undefined;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterValue;
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  value: FilterValue;
  onChange: (filters: FilterValue) => void;
  onClear: () => void;
  presets?: FilterPreset[];
  onSavePreset?: (name: string, filters: FilterValue) => void;
  onDeletePreset?: (id: string) => void;
  onLoadPreset?: (preset: FilterPreset) => void;
}

export function AdvancedFilters({
  filters,
  value,
  onChange,
  onClear,
  presets = [],
  onSavePreset,
  onDeletePreset,
  onLoadPreset,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterValue>(value);

  useEffect(() => {
    setActiveFilters(value);
  }, [value]);

  const handleFilterChange = (filterId: string, filterValue: any) => {
    const newFilters = { ...activeFilters, [filterId]: filterValue };
    setActiveFilters(newFilters);
    onChange(newFilters);
  };

  const handleClear = () => {
    setActiveFilters({});
    onClear();
  };

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName, activeFilters);
      setPresetName("");
      setIsSaveDialogOpen(false);
    }
  };

  const activeFilterCount = Object.values(activeFilters).filter(
    (v) => v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-[500px] overflow-y-auto">
          <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="p-4 space-y-4">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-2">
                <Label htmlFor={filter.id}>{filter.label}</Label>
                {filter.type === "select" && (
                  <Select
                    value={activeFilters[filter.id] as string}
                    onValueChange={(val) => handleFilterChange(filter.id, val)}
                  >
                    <SelectTrigger id={filter.id}>
                      <SelectValue placeholder={filter.placeholder || "Select..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {filter.type === "text" && (
                  <Input
                    id={filter.id}
                    value={(activeFilters[filter.id] as string) || ""}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    placeholder={filter.placeholder}
                  />
                )}
                {filter.type === "date-range" && (
                  <DateRangePicker
                    value={activeFilters[filter.id] as DateRange}
                    onChange={(range) => handleFilterChange(filter.id, range)}
                  />
                )}
              </div>
            ))}
          </div>

          <DropdownMenuSeparator />

          {presets && presets.length > 0 && (
            <>
              <DropdownMenuLabel>Saved Presets</DropdownMenuLabel>
              <div className="p-2 space-y-1">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md"
                  >
                    <button
                      onClick={() => {
                        onLoadPreset?.(preset);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left text-sm"
                    >
                      {preset.name}
                    </button>
                    {onDeletePreset && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeletePreset(preset.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          <div className="p-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Clear All
            </Button>
            {onSavePreset && (
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Save Preset
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Filter Preset</DialogTitle>
                    <DialogDescription>
                      Give your filter combination a name to save it for later use.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="preset-name">Preset Name</Label>
                      <Input
                        id="preset-name"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="e.g., Active Grade 10 Students"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsSaveDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSavePreset}>Save Preset</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
