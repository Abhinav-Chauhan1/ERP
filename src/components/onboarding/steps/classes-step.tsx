"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, GraduationCap, Plus, X, Lightbulb } from "lucide-react";
import type { WizardData } from "../setup-wizard";
import { useToast } from "@/hooks/use-toast";

interface ClassesStepProps {
    data: WizardData;
    updateData: (updates: Partial<WizardData>) => void;
    onNext: () => void;
    onPrev: () => void;
}

const CLASS_TEMPLATES = {
    "Pre-Primary (India)": ["Nursery", "LKG", "UKG"],
    "Primary (India)": ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"],
    "Middle School (India)": ["Class 6", "Class 7", "Class 8"],
    "Secondary (India)": ["Class 9", "Class 10"],
    "Higher Secondary (India)": ["Class 11", "Class 12"],
    "Complete K-12": [
        "Nursery", "LKG", "UKG",
        "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
        "Class 6", "Class 7", "Class 8",
        "Class 9", "Class 10",
        "Class 11", "Class 12",
    ],
};

const DEFAULT_SECTIONS = ["A", "B", "C", "D"];

export function ClassesStep({ data, updateData, onNext, onPrev }: ClassesStepProps) {
    const [newSection, setNewSection] = useState("");
    const { toast } = useToast();

    const toggleClass = (className: string) => {
        const currentClasses = data.selectedClasses;
        if (currentClasses.includes(className)) {
            updateData({
                selectedClasses: currentClasses.filter((c) => c !== className)
            });
        } else {
            updateData({
                selectedClasses: [...currentClasses, className]
            });
        }
    };

    const applyTemplate = (templateName: keyof typeof CLASS_TEMPLATES) => {
        const templateClasses = CLASS_TEMPLATES[templateName];
        const currentClasses = new Set(data.selectedClasses);
        templateClasses.forEach((c) => currentClasses.add(c));
        updateData({ selectedClasses: Array.from(currentClasses) });
    };

    const selectAll = (templateName: keyof typeof CLASS_TEMPLATES) => {
        applyTemplate(templateName);
    };

    const clearAll = () => {
        updateData({ selectedClasses: [] });
    };

    const addSection = () => {
        if (!newSection.trim()) return;
        if (data.sections.includes(newSection.trim().toUpperCase())) {
            toast({
                title: "Section exists",
                description: "This section already exists",
                variant: "destructive",
            });
            return;
        }
        updateData({
            sections: [...data.sections, newSection.trim().toUpperCase()]
        });
        setNewSection("");
    };

    const removeSection = (section: string) => {
        if (data.sections.length <= 1) {
            toast({
                title: "Cannot remove",
                description: "At least one section is required",
                variant: "destructive",
            });
            return;
        }
        updateData({
            sections: data.sections.filter((s) => s !== section)
        });
    };

    const validateAndNext = () => {
        // Classes are optional - can be configured later
        onNext();
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-indigo-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold">Classes & Sections</h2>
                <p className="text-muted-foreground">
                    Select the grade levels for your school
                </p>
            </div>

            {/* Skip Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <strong>Optional:</strong> You can skip this step and configure classes later in Settings.
            </div>

            {/* Quick Templates */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-sm text-amber-800">Quick Select</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {Object.keys(CLASS_TEMPLATES).map((template) => (
                        <Button
                            key={template}
                            variant="outline"
                            size="sm"
                            onClick={() => selectAll(template as keyof typeof CLASS_TEMPLATES)}
                            className="text-xs"
                        >
                            {template}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAll}
                        className="text-xs text-red-600 hover:text-red-700"
                    >
                        Clear All
                    </Button>
                </div>
            </div>

            {/* Class Selection */}
            <div className="space-y-4">
                <Label>Select Classes</Label>

                {Object.entries(CLASS_TEMPLATES).map(([category, classes]) => (
                    category !== "Complete K-12" && (
                        <div key={category} className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">{category}</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {classes.map((className) => (
                                    <div
                                        key={className}
                                        className="flex items-center space-x-2"
                                    >
                                        <Checkbox
                                            id={className}
                                            checked={data.selectedClasses.includes(className)}
                                            onCheckedChange={() => toggleClass(className)}
                                        />
                                        <label
                                            htmlFor={className}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {className}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}

                {/* Selected Count */}
                {data.selectedClasses.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                        Selected: <strong>{data.selectedClasses.length}</strong> classes
                    </div>
                )}
            </div>

            {/* Sections Configuration */}
            <div className="space-y-3 pt-4 border-t">
                <Label>Default Sections</Label>
                <p className="text-sm text-muted-foreground">
                    These sections will be applied to all selected classes
                </p>

                <div className="flex flex-wrap gap-2">
                    {data.sections.map((section) => (
                        <Badge
                            key={section}
                            variant="secondary"
                            className="px-3 py-1 text-sm"
                        >
                            {section}
                            <button
                                onClick={() => removeSection(section)}
                                className="ml-2 hover:text-red-500"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>

                <div className="flex gap-2">
                    <Input
                        placeholder="Add section (e.g., D)"
                        value={newSection}
                        onChange={(e) => setNewSection(e.target.value.toUpperCase())}
                        className="max-w-[150px]"
                        maxLength={2}
                        onKeyDown={(e) => e.key === "Enter" && addSection()}
                    />
                    <Button variant="outline" size="sm" onClick={addSection}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onPrev}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onNext}>
                        Skip
                    </Button>
                    <Button onClick={validateAndNext}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
