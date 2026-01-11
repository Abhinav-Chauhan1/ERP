"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type CurriculumType =
  | "GENERAL"
  | "ADVANCED"
  | "REMEDIAL"
  | "INTEGRATED"
  | "VOCATIONAL"
  | "SPECIAL_NEEDS";

interface CurriculumTypeSelectorProps {
  curriculumType: CurriculumType;
  onCurriculumTypeChange: (value: CurriculumType) => void;
  boardType?: string;
  onBoardTypeChange: (value: string) => void;
  disabled?: boolean;
}

const curriculumTypeLabels: Record<CurriculumType, string> = {
  GENERAL: "General",
  ADVANCED: "Advanced",
  REMEDIAL: "Remedial",
  INTEGRATED: "Integrated",
  VOCATIONAL: "Vocational",
  SPECIAL_NEEDS: "Special Needs",
};

const boardTypeOptions = [
  "CBSE",
  "ICSE",
  "State Board",
  "IB",
  "Cambridge",
  "Other",
];

export function CurriculumTypeSelector({
  curriculumType,
  onCurriculumTypeChange,
  boardType,
  onBoardTypeChange,
  disabled = false,
}: CurriculumTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="curriculum-type">
          Curriculum Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={curriculumType}
          onValueChange={(value) =>
            onCurriculumTypeChange(value as CurriculumType)
          }
          disabled={disabled}
        >
          <SelectTrigger id="curriculum-type">
            <SelectValue placeholder="Select curriculum type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(curriculumTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Select the type of curriculum this syllabus follows
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="board-type">Board Type (Optional)</Label>
        <Input
          id="board-type"
          type="text"
          placeholder="e.g., CBSE, ICSE, State Board"
          value={boardType || ""}
          onChange={(e) => onBoardTypeChange(e.target.value)}
          disabled={disabled}
          list="board-type-suggestions"
        />
        <datalist id="board-type-suggestions">
          {boardTypeOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <p className="text-sm text-muted-foreground">
          Specify the educational board if applicable (e.g., CBSE, ICSE, IB)
        </p>
      </div>
    </div>
  );
}
