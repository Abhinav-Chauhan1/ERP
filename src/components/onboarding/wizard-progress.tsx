"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface WizardProgressProps {
    steps: { id: number; name: string; description: string }[];
    currentStep: number;
    onStepClick?: (step: number) => void;
}

export function WizardProgress({ steps, currentStep, onStepClick }: WizardProgressProps) {
    return (
        <nav aria-label="Progress" className="w-full">
            <ol role="list" className="flex items-center justify-between">
                {steps.map((step, index) => (
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
                        <button
                            onClick={() => currentStep > index && onStepClick?.(index)}
                            disabled={currentStep < index}
                            className={cn(
                                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-200",
                                currentStep > index
                                    ? "bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90"
                                    : currentStep === index
                                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            )}
                        >
                            {currentStep > index ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <span>{index + 1}</span>
                            )}
                        </button>

                        {/* Step label */}
                        <div className="mt-2 text-center">
                            <span
                                className={cn(
                                    "text-xs font-medium",
                                    currentStep >= index ? "text-primary" : "text-gray-500"
                                )}
                            >
                                {step.name}
                            </span>
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
