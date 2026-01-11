"use client";

/**
 * Alumni Filters Component
 * 
 * Provides filtering options for alumni directory including graduation year,
 * class, location, and occupation filters.
 * 
 * Requirements: 6.3
 */

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

export interface AlumniFiltersState {
  graduationYearFrom?: number;
  graduationYearTo?: number;
  finalClass?: string;
  currentCity?: string;
  currentOccupation?: string;
  collegeName?: string;
}

interface AlumniFiltersProps {
  filters: AlumniFiltersState;
  onFiltersChange: (filters: AlumniFiltersState) => void;
  availableClasses?: string[];
  availableCities?: string[];
  availableOccupations?: string[];
}

export function AlumniFilters({
  filters,
  onFiltersChange,
  availableClasses = [],
  availableCities = [],
  availableOccupations = [],
}: AlumniFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [graduationYearOpen, setGraduationYearOpen] = useState(true);
  const [classOpen, setClassOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [occupationOpen, setOccupationOpen] = useState(false);
  const [educationOpen, setEducationOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const handleFilterChange = (key: keyof AlumniFiltersState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== ""
  ).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Alumni</SheetTitle>
          <SheetDescription>
            Apply filters to narrow down the alumni directory
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="text-sm text-muted-foreground">
                {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8"
              >
                <X className="mr-1 h-3 w-3" />
                Clear all
              </Button>
            </div>
          )}

          {/* Graduation Year Filter */}
          <Collapsible open={graduationYearOpen} onOpenChange={setGraduationYearOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
              <span className="font-medium">Graduation Year</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  graduationYearOpen ? "transform rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label htmlFor="yearFrom">From Year</Label>
                <Select
                  value={filters.graduationYearFrom?.toString() || ""}
                  onValueChange={(value) =>
                    handleFilterChange("graduationYearFrom", value ? parseInt(value) : undefined)
                  }
                >
                  <SelectTrigger id="yearFrom">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any year</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearTo">To Year</Label>
                <Select
                  value={filters.graduationYearTo?.toString() || ""}
                  onValueChange={(value) =>
                    handleFilterChange("graduationYearTo", value ? parseInt(value) : undefined)
                  }
                >
                  <SelectTrigger id="yearTo">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any year</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Class Filter */}
          <Collapsible open={classOpen} onOpenChange={setClassOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-t pt-4">
              <span className="font-medium">Final Class</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  classOpen ? "transform rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label htmlFor="finalClass">Class</Label>
                <Select
                  value={filters.finalClass || ""}
                  onValueChange={(value) => handleFilterChange("finalClass", value)}
                >
                  <SelectTrigger id="finalClass">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All classes</SelectItem>
                    {availableClasses.length > 0 ? (
                      availableClasses.map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Grade 10">Grade 10</SelectItem>
                        <SelectItem value="Grade 11">Grade 11</SelectItem>
                        <SelectItem value="Grade 12">Grade 12</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Location Filter */}
          <Collapsible open={locationOpen} onOpenChange={setLocationOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-t pt-4">
              <span className="font-medium">Current Location</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  locationOpen ? "transform rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label htmlFor="currentCity">City</Label>
                {availableCities.length > 0 ? (
                  <Select
                    value={filters.currentCity || ""}
                    onValueChange={(value) => handleFilterChange("currentCity", value)}
                  >
                    <SelectTrigger id="currentCity">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All cities</SelectItem>
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="currentCity"
                    placeholder="Enter city name"
                    value={filters.currentCity || ""}
                    onChange={(e) => handleFilterChange("currentCity", e.target.value)}
                  />
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Occupation Filter */}
          <Collapsible open={occupationOpen} onOpenChange={setOccupationOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-t pt-4">
              <span className="font-medium">Current Occupation</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  occupationOpen ? "transform rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label htmlFor="currentOccupation">Occupation</Label>
                {availableOccupations.length > 0 ? (
                  <Select
                    value={filters.currentOccupation || ""}
                    onValueChange={(value) => handleFilterChange("currentOccupation", value)}
                  >
                    <SelectTrigger id="currentOccupation">
                      <SelectValue placeholder="Select occupation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All occupations</SelectItem>
                      {availableOccupations.map((occupation) => (
                        <SelectItem key={occupation} value={occupation}>
                          {occupation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="currentOccupation"
                    placeholder="Enter occupation"
                    value={filters.currentOccupation || ""}
                    onChange={(e) => handleFilterChange("currentOccupation", e.target.value)}
                  />
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Higher Education Filter */}
          <Collapsible open={educationOpen} onOpenChange={setEducationOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-t pt-4">
              <span className="font-medium">Higher Education</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  educationOpen ? "transform rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label htmlFor="collegeName">College/University</Label>
                <Input
                  id="collegeName"
                  placeholder="Enter college name"
                  value={filters.collegeName || ""}
                  onChange={(e) => handleFilterChange("collegeName", e.target.value)}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-6 pt-6 border-t flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
          <Button
            className="flex-1"
            onClick={() => setIsOpen(false)}
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
