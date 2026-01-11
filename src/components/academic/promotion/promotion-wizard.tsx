"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Step definitions
const PROMOTION_STEPS = [
  { id: 1, name: "Select", description: "Select students for promotion" },
  { id: 2, name: "Preview", description: "Review promotion details" },
  { id: 3, name: "Execute", description: "Execute promotion" },
];

export interface PromotionWizardData {
  // Source details
  sourceClassId: string;
  sourceSectionId?: string;
  sourceClassName?: string;
  sourceSectionName?: string;
  
  // Target details
  targetAcademicYearId: string;
  targetClassId: string;
  targetSectionId?: string;
  targetAcademicYearName?: string;
  targetClassName?: string;
  targetSectionName?: string;
  
  // Selected students
  selectedStudentIds: string[];
  
  // Exclusions
  excludedStudents: Array<{
    studentId: string;
    reason: string;
  }>;
  
  // Roll number strategy
  rollNumberStrategy: "auto" | "manual" | "preserve";
  rollNumberMapping?: Record<string, string>;
  
  // Notification settings
  sendNotifications: boolean;
}

interface PromotionWizardProps {
  onComplete: (data: PromotionWizardData) => void;
  onCancel: () => void;
  children: (props: {
    currentStep: number;
    data: PromotionWizardData;
    updateData: (updates: Partial<PromotionWizardData>) => void;
    nextStep: () => void;
    prevStep: () => void;
    canGoNext: boolean;
    canGoPrev: boolean;
  }) => React.ReactNode;
}

const initialData: PromotionWizardData = {
  sourceClassId: "",
  sourceSectionId: undefined,
  sourceClassName: undefined,
  sourceSectionName: undefined,
  targetAcademicYearId: "",
  targetClassId: "",
  targetSectionId: undefined,
  targetAcademicYearName: undefined,
  targetClassName: undefined,
  targetSectionName: undefined,
  selectedStudentIds: [],
  excludedStudents: [],
  rollNumberStrategy: "auto",
  rollNumberMapping: undefined,
  sendNotifications: true,
};

export function PromotionWizard({ onComplete, onCancel, children }: PromotionWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<PromotionWizardData>(initialData);

  const updateData = (updates: Partial<PromotionWizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < PROMOTION_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step - complete the wizard
      onComplete(data);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0: // Select step
        return (
          data.sourceClassId !== "" &&
          data.targetAcademicYearId !== "" &&
          data.targetClassId !== "" &&
          data.selectedStudentIds.length > 0
        );
      case 1: // Preview step
        return true;
      case 2: // Execute step
        return false; // Execution is handled separately
      default:
        return false;
    }
  };

  const canGoPrev = () => {
    return currentStep > 0 && currentStep < 2; // Can't go back during execution
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Student Promotion</CardTitle>
          <CardDescription>
            Promote students to the next academic year in three simple steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <nav aria-label="Progress" className="w-full">
            <ol role="list" className="flex items-center justify-between">
              {PROMOTION_STEPS.map((step, index) => (
                <li key={step.id} className="relative flex-1 flex flex-col items-center">
                  {/* Connector line */}
                  {index !== 0 && (
                    <div
                      className={cn(
                        "absolute top-4 -left-1/2 w-full h-0.5",
                        currentStep > index ? "bg-primary" : "bg-gray-200"
                      )}
                      aria-hidden="true"
                    />
                  )}

                  {/* Step indicator */}
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-200",
                      currentStep > index
                        ? "bg-primary text-primary-foreground"
                        : currentStep === index
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {currentStep > index ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Step label */}
                  <div className="mt-2 text-center">
                    <span
                      className={cn(
                        "text-sm font-medium block",
                        currentStep >= index ? "text-primary" : "text-gray-500"
                      )}
                    >
                      {step.name}
                    </span>
                    <span
                      className={cn(
                        "text-xs block mt-1",
                        currentStep >= index ? "text-muted-foreground" : "text-gray-400"
                      )}
                    >
                      {step.description}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {children({
          currentStep,
          data,
          updateData,
          nextStep,
          prevStep,
          canGoNext: canGoNext(),
          canGoPrev: canGoPrev(),
        })}
      </div>

      {/* Navigation Buttons */}
      {currentStep < 2 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={canGoPrev() ? prevStep : onCancel}
                disabled={false}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {canGoPrev() ? "Previous" : "Cancel"}
              </Button>
              <Button
                onClick={nextStep}
                disabled={!canGoNext()}
              >
                {currentStep === PROMOTION_STEPS.length - 2 ? "Review & Execute" : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
