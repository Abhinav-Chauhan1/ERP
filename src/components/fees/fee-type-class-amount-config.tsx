"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ClassAmountInput {
  classId: string;
  amount: number;
}

export interface ClassOption {
  id: string;
  name: string;
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

export function FeeTypeClassAmountConfig({
  feeTypeId,
  defaultAmount,
  classAmounts,
  onChange,
  classes,
  disabled = false,
  error,
}: FeeTypeClassAmountConfigProps) {
  // Get available classes (not already in classAmounts)
  const availableClasses = React.useMemo(() => {
    const usedClassIds = new Set(classAmounts.map((ca) => ca.classId));
    return classes.filter((cls) => !usedClassIds.has(cls.id));
  }, [classes, classAmounts]);

  // Add a new class amount row
  const addClassAmount = () => {
    if (availableClasses.length === 0) return;
    
    const newClassAmount: ClassAmountInput = {
      classId: availableClasses[0].id,
      amount: defaultAmount,
    };
    onChange([...classAmounts, newClassAmount]);
  };

  // Remove a class amount row
  const removeClassAmount = (index: number) => {
    const updated = classAmounts.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Update class selection for a row
  const updateClassId = (index: number, classId: string) => {
    const updated = [...classAmounts];
    updated[index] = { ...updated[index], classId };
    onChange(updated);
  };

  // Update amount for a row
  const updateAmount = (index: number, amount: number) => {
    const updated = [...classAmounts];
    updated[index] = { ...updated[index], amount };
    onChange(updated);
  };

  // Get class name by ID
  const getClassName = (classId: string) => {
    return classes.find((cls) => cls.id === classId)?.name || "Unknown";
  };

  return (
    <div className="space-y-4">
      {/* Default Amount Section */}
      <div className="space-y-2">
        <Label htmlFor="default-amount">
          Default Amount
          <span className="ml-1 text-xs text-muted-foreground">
            (Used when no class-specific amount is set)
          </span>
        </Label>
        <div className="text-sm text-muted-foreground">
          ₹{defaultAmount.toFixed(2)}
        </div>
      </div>

      {/* Class-Specific Amounts Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Class-Specific Amounts</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addClassAmount}
            disabled={disabled || availableClasses.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Class Amount
          </Button>
        </div>

        {classAmounts.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8 border rounded-md">
            No class-specific amounts configured. The default amount will be used for all classes.
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Class</TableHead>
                  <TableHead className="w-[40%]">Amount (₹)</TableHead>
                  <TableHead className="w-[20%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classAmounts.map((classAmount, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={classAmount.classId}
                        onValueChange={(value) => updateClassId(index, value)}
                        disabled={disabled}
                      >
                        <SelectTrigger
                          className={cn(
                            "w-full",
                            error && "border-destructive focus-visible:ring-destructive"
                          )}
                        >
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Current selected class */}
                          <SelectItem value={classAmount.classId}>
                            {getClassName(classAmount.classId)}
                          </SelectItem>
                          {/* Available classes */}
                          {availableClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={classAmount.amount}
                        onChange={(e) =>
                          updateAmount(index, parseFloat(e.target.value) || 0)
                        }
                        disabled={disabled}
                        className={cn(
                          error && "border-destructive focus-visible:ring-destructive"
                        )}
                        placeholder="Enter amount"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeClassAmount(index)}
                        disabled={disabled}
                        aria-label={`Remove ${getClassName(classAmount.classId)} amount`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

        {/* Helper text */}
        {classAmounts.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Classes not listed above will use the default amount of ₹{defaultAmount.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}
