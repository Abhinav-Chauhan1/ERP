"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ScopeType = "SUBJECT_WIDE" | "CLASS_WIDE" | "SECTION_SPECIFIC";

interface ScopeSelectorProps {
  scopeType: ScopeType;
  onScopeTypeChange: (value: ScopeType) => void;
  classId?: string;
  onClassChange: (value: string) => void;
  sectionId?: string;
  onSectionChange: (value: string) => void;
  classes: Array<{ id: string; name: string }>;
  sections: Array<{ id: string; name: string }>;
  disabled?: boolean;
}

export function ScopeSelector({
  scopeType,
  onScopeTypeChange,
  classId,
  onClassChange,
  sectionId,
  onSectionChange,
  classes,
  sections,
  disabled = false,
}: ScopeSelectorProps) {
  const showClassDropdown =
    scopeType === "CLASS_WIDE" || scopeType === "SECTION_SPECIFIC";
  const showSectionDropdown = scopeType === "SECTION_SPECIFIC";

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label htmlFor="scope-type">Scope Type</Label>
        <RadioGroup
          id="scope-type"
          value={scopeType}
          onValueChange={(value) => onScopeTypeChange(value as ScopeType)}
          disabled={disabled}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="SUBJECT_WIDE" id="subject-wide" />
            <Label
              htmlFor="subject-wide"
              className="font-normal cursor-pointer"
            >
              Subject-wide (applies to all classes and sections)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="CLASS_WIDE" id="class-wide" />
            <Label htmlFor="class-wide" className="font-normal cursor-pointer">
              Class-wide (applies to all sections of a specific class)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="SECTION_SPECIFIC" id="section-specific" />
            <Label
              htmlFor="section-specific"
              className="font-normal cursor-pointer"
            >
              Section-specific (applies to a specific section only)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {showClassDropdown && (
        <div className="space-y-2">
          <Label htmlFor="class-select">
            Class <span className="text-destructive">*</span>
          </Label>
          <Select
            value={classId}
            onValueChange={onClassChange}
            disabled={disabled}
          >
            <SelectTrigger id="class-select">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No classes available
                </div>
              ) : (
                classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {showSectionDropdown && (
        <div className="space-y-2">
          <Label htmlFor="section-select">
            Section <span className="text-destructive">*</span>
          </Label>
          <Select
            value={sectionId}
            onValueChange={onSectionChange}
            disabled={disabled || !classId}
          >
            <SelectTrigger id="section-select">
              <SelectValue
                placeholder={
                  classId ? "Select a section" : "Select a class first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {sections.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {classId
                    ? "No sections available for this class"
                    : "Select a class first"}
                </div>
              ) : (
                sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
