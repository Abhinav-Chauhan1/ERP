"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Calendar, Lightbulb } from "lucide-react";
import type { WizardData } from "../setup-wizard";
import { useToast } from "@/hooks/use-toast";
import { format, addMonths, startOfMonth } from "date-fns";

interface AcademicYearStepProps {
    data: WizardData;
    updateData: (updates: Partial<WizardData>) => void;
    onNext: () => void;
    onPrev: () => void;
}

const PRESETS = [
    {
        name: "April - March (Indian Standard)",
        startMonth: 3, // April (0-indexed)
        duration: 12,
    },
    {
        name: "June - April",
        startMonth: 5, // June
        duration: 11,
    },
    {
        name: "July - May",
        startMonth: 6, // July
        duration: 11,
    },
];

export function AcademicYearStep({ data, updateData, onNext, onPrev }: AcademicYearStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { toast } = useToast();

    const applyPreset = (preset: typeof PRESETS[0]) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Determine if we're past the start month for this year
        let startYear = currentYear;
        if (currentMonth < preset.startMonth) {
            startYear = currentYear - 1;
        }

        const startDate = startOfMonth(new Date(startYear, preset.startMonth, 1));
        const endDate = addMonths(startDate, preset.duration);
        endDate.setDate(endDate.getDate() - 1); // Last day of previous month

        const yearName = `${startYear}-${startYear + 1}`;

        updateData({
            academicYearName: yearName,
            academicYearStart: startDate,
            academicYearEnd: endDate,
        });
    };

    const validateAndNext = () => {
        const newErrors: Record<string, string> = {};

        if (!data.academicYearName.trim()) {
            newErrors.yearName = "Academic year name is required";
        }

        if (!data.academicYearStart) {
            newErrors.startDate = "Start date is required";
        }

        if (!data.academicYearEnd) {
            newErrors.endDate = "End date is required";
        }

        if (data.academicYearStart && data.academicYearEnd) {
            if (data.academicYearEnd <= data.academicYearStart) {
                newErrors.endDate = "End date must be after start date";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast({
                title: "Please fix the errors",
                description: "Some required fields are missing or invalid",
                variant: "destructive",
            });
            return;
        }

        setErrors({});
        onNext();
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-teal-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold">Academic Year</h2>
                <p className="text-muted-foreground">
                    Configure the current academic session
                </p>
            </div>

            {/* Quick Presets */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-sm text-amber-800">Quick Setup</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => (
                        <Button
                            key={preset.name}
                            variant="outline"
                            size="sm"
                            onClick={() => applyPreset(preset)}
                            className="text-xs"
                        >
                            {preset.name}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {/* Year Name */}
                <div className="space-y-2">
                    <Label htmlFor="yearName">
                        Academic Year Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="yearName"
                        placeholder="e.g., 2025-2026"
                        value={data.academicYearName}
                        onChange={(e) => updateData({ academicYearName: e.target.value })}
                        className={errors.yearName ? "border-red-500" : ""}
                    />
                    {errors.yearName && (
                        <p className="text-sm text-red-500">{errors.yearName}</p>
                    )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">
                            Start Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={data.academicYearStart ? format(data.academicYearStart, "yyyy-MM-dd") : ""}
                            onChange={(e) => updateData({
                                academicYearStart: e.target.value ? new Date(e.target.value) : null
                            })}
                            className={errors.startDate ? "border-red-500" : ""}
                        />
                        {errors.startDate && (
                            <p className="text-sm text-red-500">{errors.startDate}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="endDate">
                            End Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={data.academicYearEnd ? format(data.academicYearEnd, "yyyy-MM-dd") : ""}
                            onChange={(e) => updateData({
                                academicYearEnd: e.target.value ? new Date(e.target.value) : null
                            })}
                            className={errors.endDate ? "border-red-500" : ""}
                        />
                        {errors.endDate && (
                            <p className="text-sm text-red-500">{errors.endDate}</p>
                        )}
                    </div>
                </div>

                {/* Summary */}
                {data.academicYearStart && data.academicYearEnd && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                        <p className="text-green-800">
                            <strong>{data.academicYearName || "Academic Year"}</strong>: {" "}
                            {format(data.academicYearStart, "MMMM d, yyyy")} to {" "}
                            {format(data.academicYearEnd, "MMMM d, yyyy")}
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onPrev}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={validateAndNext}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
