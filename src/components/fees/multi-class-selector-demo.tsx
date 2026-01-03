"use client";

import * as React from "react";
import { MultiClassSelector, ClassOption } from "./multi-class-selector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Demo component to test MultiClassSelector
export function MultiClassSelectorDemo() {
  const [selectedClassIds, setSelectedClassIds] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string>("");

  // Mock classes data
  const mockClasses: ClassOption[] = [
    { id: "1", name: "Grade 1" },
    { id: "2", name: "Grade 2" },
    { id: "3", name: "Grade 3" },
    { id: "4", name: "Grade 4" },
    { id: "5", name: "Grade 5" },
    { id: "6", name: "Grade 6" },
    { id: "7", name: "Grade 7" },
    { id: "8", name: "Grade 8" },
    { id: "9", name: "Grade 9" },
    { id: "10", name: "Grade 10" },
    { id: "11", name: "Grade 11" },
    { id: "12", name: "Grade 12" },
  ];

  const handleChange = (classIds: string[]) => {
    setSelectedClassIds(classIds);
    // Clear error when user selects classes
    if (classIds.length > 0) {
      setError("");
    }
  };

  const handleValidate = () => {
    if (selectedClassIds.length === 0) {
      setError("At least one class must be selected");
    } else {
      setError("");
      alert(`Selected ${selectedClassIds.length} classes: ${selectedClassIds.join(", ")}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Multi-Class Selector Demo</CardTitle>
        <CardDescription>
          Test the multi-class selector component with search, select all/deselect all, and badge display.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Select Classes
          </label>
          <MultiClassSelector
            selectedClassIds={selectedClassIds}
            onChange={handleChange}
            classes={mockClasses}
            error={error}
            placeholder="Choose one or more classes..."
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleValidate}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Validate Selection
          </button>
          <button
            onClick={() => setSelectedClassIds([])}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Clear Selection
          </button>
        </div>

        <div className="p-4 bg-muted rounded-md">
          <p className="text-sm font-medium mb-2">Selected Class IDs:</p>
          <code className="text-xs">
            {selectedClassIds.length > 0 ? JSON.stringify(selectedClassIds, null, 2) : "[]"}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
