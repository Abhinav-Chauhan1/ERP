"use client";

import * as React from "react";
import { Check, Percent, RotateCcw, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface ClassAmountInput {
  classId: string;
  amount: number;
}

export interface ClassOption {
  id: string;
  name: string;
  level?: number; // Optional level for graduated fees (e.g., Class 1 = 1, Class 2 = 2)
}

export interface FeeTypeClassAmountConfigProps {
  feeTypeId?: string;
  defaultAmount: number;
  classAmounts: ClassAmountInput[];
  onChange: (classAmounts: ClassAmountInput[]) => void;
  classes: ClassOption[];
  disabled?: boolean;
  error?: string;
}

/**
 * Improved Fee Type Class Amount Configuration Component
 * 
 * Features:
 * - Shows ALL classes in a table with checkboxes to enable/disable custom amounts
 * - Pre-fills with default amount when enabled
 * - Graduated fee feature (percentage increase per class level)
 * - Quick actions: Enable All, Clear All
 */
export function FeeTypeClassAmountConfig({
  feeTypeId,
  defaultAmount,
  classAmounts,
  onChange,
  classes,
  disabled = false,
  error,
}: FeeTypeClassAmountConfigProps) {
  const [graduatedPercent, setGraduatedPercent] = React.useState<number>(10);
  const [graduatedPopoverOpen, setGraduatedPopoverOpen] = React.useState(false);

  // Create a map for quick lookup of current class amounts
  const classAmountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    classAmounts.forEach((ca) => {
      map.set(ca.classId, ca.amount);
    });
    return map;
  }, [classAmounts]);

  // Sort classes by level or name for consistent display
  const sortedClasses = React.useMemo(() => {
    return [...classes].sort((a, b) => {
      // Try to extract numeric level from class name
      const levelA = a.level ?? extractClassLevel(a.name);
      const levelB = b.level ?? extractClassLevel(b.name);
      if (levelA !== null && levelB !== null) {
        return levelA - levelB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [classes]);

  // Check if a class has custom amount enabled
  const isCustomEnabled = (classId: string) => {
    return classAmountMap.has(classId);
  };

  // Get the amount for a class (custom or default)
  const getAmount = (classId: string) => {
    return classAmountMap.get(classId) ?? defaultAmount;
  };

  // Toggle custom amount for a class
  const toggleCustomAmount = (classId: string, enabled: boolean) => {
    if (enabled) {
      // Enable: add with default amount
      const newAmounts = [...classAmounts, { classId, amount: defaultAmount }];
      onChange(newAmounts);
    } else {
      // Disable: remove from list
      const newAmounts = classAmounts.filter((ca) => ca.classId !== classId);
      onChange(newAmounts);
    }
  };

  // Update amount for a class
  const updateAmount = (classId: string, amount: number) => {
    const exists = classAmounts.find((ca) => ca.classId === classId);
    if (exists) {
      const newAmounts = classAmounts.map((ca) =>
        ca.classId === classId ? { ...ca, amount } : ca
      );
      onChange(newAmounts);
    } else {
      // Auto-enable if updating amount
      onChange([...classAmounts, { classId, amount }]);
    }
  };

  // Enable all classes with default amount
  const enableAll = () => {
    const newAmounts = sortedClasses.map((cls) => ({
      classId: cls.id,
      amount: classAmountMap.get(cls.id) ?? defaultAmount,
    }));
    onChange(newAmounts);
  };

  // Clear all custom amounts
  const clearAll = () => {
    onChange([]);
  };

  // Apply graduated fee (percentage increase per class level)
  const applyGraduatedFee = () => {
    const newAmounts = sortedClasses.map((cls, index) => {
      const level = cls.level ?? extractClassLevel(cls.name) ?? index;
      // Base amount + (level - 1) * percentage increase
      const multiplier = 1 + ((level - 1) * graduatedPercent) / 100;
      const amount = Math.round(defaultAmount * multiplier);
      return { classId: cls.id, amount };
    });
    onChange(newAmounts);
    setGraduatedPopoverOpen(false);
  };

  // Count enabled custom amounts
  const customCount = classAmounts.length;

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Class-Specific Amounts</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Set different amounts for specific classes or use the default for all
          </p>
        </div>
        <Badge variant={customCount > 0 ? "default" : "secondary"}>
          {customCount} / {classes.length} classes configured
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={enableAll}
          disabled={disabled || customCount === classes.length}
        >
          <Check className="h-4 w-4 mr-1" />
          Enable All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearAll}
          disabled={disabled || customCount === 0}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Clear All
        </Button>

        {/* Graduated Fee Popover */}
        <Popover open={graduatedPopoverOpen} onOpenChange={setGraduatedPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
            >
              <Calculator className="h-4 w-4 mr-1" />
              Graduated Fee
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Graduated Fee Calculator</h4>
                <p className="text-xs text-muted-foreground">
                  Automatically increase the fee amount per class level
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="graduated-percent" className="text-sm">
                  Increase per class level
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="graduated-percent"
                    type="number"
                    min="0"
                    max="100"
                    value={graduatedPercent}
                    onChange={(e) => setGraduatedPercent(Number(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Example with {graduatedPercent}% increase:</p>
                <ul className="list-disc list-inside">
                  <li>Class 1: ₹{defaultAmount.toLocaleString()}</li>
                  <li>Class 2: ₹{Math.round(defaultAmount * (1 + graduatedPercent / 100)).toLocaleString()}</li>
                  <li>Class 3: ₹{Math.round(defaultAmount * (1 + (2 * graduatedPercent) / 100)).toLocaleString()}</li>
                </ul>
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={applyGraduatedFee}
              >
                Apply to All Classes
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator />

      {/* All Classes Table */}
      {classes.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8 border rounded-md">
          No classes available. Please create classes first.
        </div>
      ) : (
        <div className="border rounded-md max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[80px]">Custom</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="w-[150px]">Amount (₹)</TableHead>
                <TableHead className="w-[100px] text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedClasses.map((cls) => {
                const hasCustom = isCustomEnabled(cls.id);
                const amount = getAmount(cls.id);

                return (
                  <TableRow key={cls.id} className={hasCustom ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={hasCustom}
                        onCheckedChange={(checked) =>
                          toggleCustomAmount(cls.id, checked as boolean)
                        }
                        disabled={disabled}
                        aria-label={`Enable custom amount for ${cls.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>
                      {hasCustom ? (
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={amount}
                          onChange={(e) =>
                            updateAmount(cls.id, parseFloat(e.target.value) || 0)
                          }
                          disabled={disabled}
                          className={cn(
                            "h-8 w-full",
                            error && "border-destructive focus-visible:ring-destructive"
                          )}
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          ₹{defaultAmount.toLocaleString()} (default)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasCustom ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Custom
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Validation error display */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Summary */}
      {customCount > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          <strong>{customCount}</strong> class{customCount !== 1 ? "es" : ""} with custom amounts.{" "}
          <strong>{classes.length - customCount}</strong> class{classes.length - customCount !== 1 ? "es" : ""} using default amount of ₹{defaultAmount.toLocaleString()}.
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to extract numeric level from class name
 * e.g., "Class 1" -> 1, "Grade 12" -> 12, "Nursery" -> 0
 */
function extractClassLevel(name: string): number | null {
  // Common pre-school classes
  const preSchoolMap: Record<string, number> = {
    nursery: 0,
    lkg: 0,
    ukg: 0,
    "l.k.g": 0,
    "u.k.g": 0,
    "pre-nursery": -1,
    "pre nursery": -1,
    playgroup: -1,
    "play group": -1,
  };

  const lowerName = name.toLowerCase().trim();

  // Check for pre-school classes
  for (const [key, value] of Object.entries(preSchoolMap)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }

  // Try to extract number from name
  const match = lowerName.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
}
