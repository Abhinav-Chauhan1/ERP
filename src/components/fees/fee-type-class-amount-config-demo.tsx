"use client";

import * as React from "react";
import {
  FeeTypeClassAmountConfig,
  ClassAmountInput,
  ClassOption,
} from "./fee-type-class-amount-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Sample classes for demo
const sampleClasses: ClassOption[] = [
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
];

export function FeeTypeClassAmountConfigDemo() {
  const [classAmounts, setClassAmounts] = React.useState<ClassAmountInput[]>([
    { classId: "9", amount: 15000 },
    { classId: "10", amount: 18000 },
  ]);

  const defaultAmount = 12000;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Fee Type Class Amount Configuration Demo</CardTitle>
          <CardDescription>
            Configure class-specific amounts for a fee type. Classes without specific amounts will use the default amount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeeTypeClassAmountConfig
            defaultAmount={defaultAmount}
            classAmounts={classAmounts}
            onChange={setClassAmounts}
            classes={sampleClasses}
          />

          {/* Display current state for demo purposes */}
          <div className="mt-6 p-4 bg-muted rounded-md">
            <h3 className="font-semibold mb-2">Current Configuration:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({ defaultAmount, classAmounts }, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
