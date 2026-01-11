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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type DifficultyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

interface MetadataInputsProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  difficultyLevel: DifficultyLevel;
  onDifficultyLevelChange: (level: DifficultyLevel) => void;
  estimatedHours?: number;
  onEstimatedHoursChange: (hours: number | undefined) => void;
  prerequisites?: string;
  onPrerequisitesChange: (prerequisites: string) => void;
  disabled?: boolean;
}

const difficultyLevelLabels: Record<DifficultyLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};

export function MetadataInputs({
  tags,
  onTagsChange,
  difficultyLevel,
  onDifficultyLevelChange,
  estimatedHours,
  onEstimatedHoursChange,
  prerequisites,
  onPrerequisitesChange,
  disabled = false,
}: MetadataInputsProps) {
  const [tagInput, setTagInput] = React.useState("");

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="space-y-2">
          <Input
            id="tags"
            type="text"
            placeholder="Type a tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            disabled={disabled}
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={disabled}
                    className="ml-1 hover:text-destructive disabled:opacity-50"
                    aria-label={`Remove ${tag} tag`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Add tags to categorize and organize syllabi (press Enter to add)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="difficulty-level">
          Difficulty Level <span className="text-destructive">*</span>
        </Label>
        <Select
          value={difficultyLevel}
          onValueChange={(value) =>
            onDifficultyLevelChange(value as DifficultyLevel)
          }
          disabled={disabled}
        >
          <SelectTrigger id="difficulty-level">
            <SelectValue placeholder="Select difficulty level" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(difficultyLevelLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Indicate the complexity level of this syllabus
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimated-hours">Estimated Hours (Optional)</Label>
        <Input
          id="estimated-hours"
          type="number"
          min="1"
          placeholder="e.g., 120"
          value={estimatedHours || ""}
          onChange={(e) => {
            const value = e.target.value;
            onEstimatedHoursChange(value ? parseInt(value, 10) : undefined);
          }}
          disabled={disabled}
        />
        <p className="text-sm text-muted-foreground">
          Approximate number of hours required to complete this syllabus
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prerequisites">Prerequisites (Optional)</Label>
        <Textarea
          id="prerequisites"
          placeholder="List any prerequisites or prior knowledge required..."
          value={prerequisites || ""}
          onChange={(e) => onPrerequisitesChange(e.target.value)}
          disabled={disabled}
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          Describe any prerequisites or prior knowledge students should have
        </p>
      </div>
    </div>
  );
}
