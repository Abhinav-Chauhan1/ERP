"use client";

import { CalendarEventCategory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarFiltersProps {
  categories: CalendarEventCategory[];
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  onClearFilters: () => void;
  className?: string;
}

/**
 * CalendarFilters Component
 * 
 * Provides category filtering controls for the calendar.
 * Displays category checkboxes with color indicators.
 * 
 * Requirements: 7.2, 7.3
 */
export function CalendarFilters({
  categories,
  selectedCategories,
  onCategoryToggle,
  onClearFilters,
  className,
}: CalendarFiltersProps) {
  const allSelected = selectedCategories.length === categories.length;
  const noneSelected = selectedCategories.length === 0;

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      onClearFilters();
    } else {
      // Select all
      categories.forEach((category) => {
        if (!selectedCategories.includes(category.id)) {
          onCategoryToggle(category.id);
        }
      });
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filter by Category
          </CardTitle>
          {!noneSelected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2"
              aria-label="Clear all filters"
            >
              <X className="h-4 w-4 mr-1" aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            aria-label={allSelected ? "Deselect all categories" : "Select all categories"}
          />
          <Label
            htmlFor="select-all"
            className="text-sm font-medium cursor-pointer"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </Label>
        </div>

        <div
          className="space-y-2 max-h-[300px] overflow-y-auto"
          role="group"
          aria-label="Category filters"
        >
          {categories.map((category) => {
            const isChecked = selectedCategories.includes(category.id);
            return (
              <div
                key={category.id}
                className="flex items-center space-x-2 py-1"
              >
                <Checkbox
                  id={`category-${category.id}`}
                  checked={isChecked}
                  onCheckedChange={() => onCategoryToggle(category.id)}
                  aria-label={`${isChecked ? "Hide" : "Show"} ${category.name} events`}
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                    aria-hidden="true"
                  />
                  <span className="text-sm">{category.name}</span>
                </Label>
              </div>
            );
          })}
        </div>

        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No categories available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
