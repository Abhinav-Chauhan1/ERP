"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, ClipboardList, Plus, Trash2, Lightbulb } from "lucide-react";
import type { WizardData } from "../setup-wizard";
import { useToast } from "@/hooks/use-toast";
import { format, addMonths } from "date-fns";

interface TermsStepProps {
    data: WizardData;
    updateData: (updates: Partial<WizardData>) => void;
    onNext: () => void;
    onPrev: () => void;
}

const TERM_TEMPLATES = [
    {
        name: "Three Terms (CBSE)",
        terms: [
            { name: "Term 1 (April - July)", monthsFromStart: 0, duration: 4 },
            { name: "Term 2 (August - November)", monthsFromStart: 4, duration: 4 },
            { name: "Term 3 (December - March)", monthsFromStart: 8, duration: 4 },
        ],
    },
    {
        name: "Two Semesters",
        terms: [
            { name: "First Semester", monthsFromStart: 0, duration: 6 },
            { name: "Second Semester", monthsFromStart: 6, duration: 6 },
        ],
    },
    {
        name: "Quarterly",
        terms: [
            { name: "Quarter 1", monthsFromStart: 0, duration: 3 },
            { name: "Quarter 2", monthsFromStart: 3, duration: 3 },
            { name: "Quarter 3", monthsFromStart: 6, duration: 3 },
            { name: "Quarter 4", monthsFromStart: 9, duration: 3 },
        ],
    },
];

export function TermsStep({ data, updateData, onNext, onPrev }: TermsStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { toast } = useToast();

    const applyTemplate = (template: typeof TERM_TEMPLATES[0]) => {
        if (!data.academicYearStart) {
            toast({
                title: "Academic year not set",
                description: "Please set the academic year dates first",
                variant: "destructive",
            });
            return;
        }

        const newTerms = template.terms.map((t) => {
            const startDate = addMonths(data.academicYearStart!, t.monthsFromStart);
            const endDate = addMonths(startDate, t.duration);
            endDate.setDate(endDate.getDate() - 1);

            return {
                name: t.name,
                startDate,
                endDate,
            };
        });

        updateData({ terms: newTerms });
    };

    const addTerm = () => {
        const newTerm = { name: `Term ${data.terms.length + 1}`, startDate: null, endDate: null };
        updateData({ terms: [...data.terms, newTerm] });
    };

    const removeTerm = (index: number) => {
        if (data.terms.length <= 1) {
            toast({
                title: "Cannot remove",
                description: "At least one term is required",
                variant: "destructive",
            });
            return;
        }
        const newTerms = data.terms.filter((_, i) => i !== index);
        updateData({ terms: newTerms });
    };

    const updateTerm = (index: number, field: string, value: string | Date | null) => {
        const newTerms = [...data.terms];
        newTerms[index] = { ...newTerms[index], [field]: value };
        updateData({ terms: newTerms });
    };

    const validateAndNext = () => {
        const newErrors: Record<string, string> = {};

        data.terms.forEach((term, index) => {
            if (!term.name.trim()) {
                newErrors[`term${index}Name`] = "Term name is required";
            }
            if (!term.startDate) {
                newErrors[`term${index}Start`] = "Start date is required";
            }
            if (!term.endDate) {
                newErrors[`term${index}End`] = "End date is required";
            }
            if (term.startDate && term.endDate && term.endDate <= term.startDate) {
                newErrors[`term${index}End`] = "End date must be after start date";
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast({
                title: "Please fix the errors",
                description: "Some terms have missing or invalid dates",
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
                    <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                        <ClipboardList className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold">Terms / Semesters</h2>
                <p className="text-muted-foreground">
                    Define the academic periods for exams and grading
                </p>
            </div>

            {/* Quick Templates */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-sm text-amber-800 dark:text-amber-200">Quick Templates</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {TERM_TEMPLATES.map((template) => (
                        <Button
                            key={template.name}
                            variant="outline"
                            size="sm"
                            onClick={() => applyTemplate(template)}
                            className="text-xs"
                        >
                            {template.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Terms List */}
            <div className="space-y-4">
                {data.terms.map((term, index) => (
                    <div
                        key={index}
                        className="border rounded-lg p-4 space-y-3 bg-muted/30"
                    >
                        <div className="flex items-center justify-between">
                            <Label className="font-medium">Term {index + 1}</Label>
                            {data.terms.length > 1 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTerm(index)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor={`termName${index}`}>Name</Label>
                                <Input
                                    id={`termName${index}`}
                                    placeholder="e.g., Term 1"
                                    value={term.name}
                                    onChange={(e) => updateTerm(index, "name", e.target.value)}
                                    className={errors[`term${index}Name`] ? "border-red-500" : ""}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor={`termStart${index}`}>Start Date</Label>
                                    <Input
                                        id={`termStart${index}`}
                                        type="date"
                                        value={term.startDate ? format(term.startDate, "yyyy-MM-dd") : ""}
                                        onChange={(e) => updateTerm(
                                            index,
                                            "startDate",
                                            e.target.value ? new Date(e.target.value) : null
                                        )}
                                        className={errors[`term${index}Start`] ? "border-red-500" : ""}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`termEnd${index}`}>End Date</Label>
                                    <Input
                                        id={`termEnd${index}`}
                                        type="date"
                                        value={term.endDate ? format(term.endDate, "yyyy-MM-dd") : ""}
                                        onChange={(e) => updateTerm(
                                            index,
                                            "endDate",
                                            e.target.value ? new Date(e.target.value) : null
                                        )}
                                        className={errors[`term${index}End`] ? "border-red-500" : ""}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <Button
                    variant="outline"
                    onClick={addTerm}
                    className="w-full border-dashed"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Term
                </Button>
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
