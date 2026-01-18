"use client";

import * as React from "react";
import { Check, ChevronRight, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

// Types
interface ClassOption {
    id: string;
    name: string;
}

interface FeeTypeOption {
    id: string;
    name: string;
    amount: number; // Default amount
    frequency: string;
    isOptional: boolean;
    classAmounts?: Array<{
        classId: string;
        amount: number;
        class?: { name: string };
    }>;
}

interface AcademicYearOption {
    id: string;
    name: string;
}

interface FeeStructurePreview {
    className: string;
    classId: string;
    structureName: string;
    items: Array<{
        feeTypeName: string;
        feeTypeId: string;
        amount: number;
        isClassSpecific: boolean;
    }>;
    totalAmount: number;
}

interface QuickCreateFeeStructuresProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classes: ClassOption[];
    feeTypes: FeeTypeOption[];
    academicYears: AcademicYearOption[];
    onCreateStructures: (
        academicYearId: string,
        structures: Array<{
            name: string;
            classIds: string[];
            items: Array<{ feeTypeId: string; amount: number }>;
        }>
    ) => Promise<{ success: boolean; error?: string; count?: number }>;
}

const frequencyLabels: Record<string, string> = {
    ONE_TIME: "One Time",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    SEMI_ANNUAL: "Semi-Annual",
    ANNUAL: "Annual",
};

export function QuickCreateFeeStructures({
    open,
    onOpenChange,
    classes,
    feeTypes,
    academicYears,
    onCreateStructures,
}: QuickCreateFeeStructuresProps) {
    const [step, setStep] = React.useState(1);
    const [selectedAcademicYearId, setSelectedAcademicYearId] = React.useState<string>("");
    const [selectedClassIds, setSelectedClassIds] = React.useState<string[]>([]);
    const [selectedFeeTypeIds, setSelectedFeeTypeIds] = React.useState<string[]>([]);
    const [isCreating, setIsCreating] = React.useState(false);

    // Reset state when dialog opens/closes
    React.useEffect(() => {
        if (!open) {
            setStep(1);
            setSelectedAcademicYearId("");
            setSelectedClassIds([]);
            setSelectedFeeTypeIds([]);
            setIsCreating(false);
        }
    }, [open]);

    // Sort classes by level/name
    const sortedClasses = React.useMemo(() => {
        return [...classes].sort((a, b) => {
            const levelA = extractClassLevel(a.name);
            const levelB = extractClassLevel(b.name);
            if (levelA !== null && levelB !== null) {
                return levelA - levelB;
            }
            return a.name.localeCompare(b.name);
        });
    }, [classes]);

    // Get amount for a specific class from a fee type
    const getAmountForClass = (feeType: FeeTypeOption, classId: string): number => {
        const classAmount = feeType.classAmounts?.find((ca) => ca.classId === classId);
        return classAmount?.amount ?? feeType.amount;
    };

    // Check if fee type has class-specific amount for a class
    const hasClassSpecificAmount = (feeType: FeeTypeOption, classId: string): boolean => {
        return feeType.classAmounts?.some((ca) => ca.classId === classId) ?? false;
    };

    // Generate preview of fee structures
    const structurePreviews: FeeStructurePreview[] = React.useMemo(() => {
        const academicYear = academicYears.find((y) => y.id === selectedAcademicYearId);
        const yearSuffix = academicYear?.name || "Fees";

        return selectedClassIds.map((classId) => {
            const classObj = classes.find((c) => c.id === classId);
            const className = classObj?.name || "Unknown";

            const items = selectedFeeTypeIds.map((feeTypeId) => {
                const feeType = feeTypes.find((ft) => ft.id === feeTypeId);
                if (!feeType) return null;

                const amount = getAmountForClass(feeType, classId);
                const isClassSpecific = hasClassSpecificAmount(feeType, classId);

                return {
                    feeTypeName: feeType.name,
                    feeTypeId: feeType.id,
                    amount,
                    isClassSpecific,
                };
            }).filter(Boolean) as FeeStructurePreview["items"];

            const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

            return {
                className,
                classId,
                structureName: `${className} ${yearSuffix}`,
                items,
                totalAmount,
            };
        });
    }, [selectedClassIds, selectedFeeTypeIds, classes, feeTypes, academicYears, selectedAcademicYearId]);

    // Toggle class selection
    const toggleClass = (classId: string) => {
        setSelectedClassIds((prev) =>
            prev.includes(classId)
                ? prev.filter((id) => id !== classId)
                : [...prev, classId]
        );
    };

    // Toggle fee type selection
    const toggleFeeType = (feeTypeId: string) => {
        setSelectedFeeTypeIds((prev) =>
            prev.includes(feeTypeId)
                ? prev.filter((id) => id !== feeTypeId)
                : [...prev, feeTypeId]
        );
    };

    // Select/deselect all classes
    const selectAllClasses = () => setSelectedClassIds(sortedClasses.map((c) => c.id));
    const deselectAllClasses = () => setSelectedClassIds([]);

    // Select/deselect all fee types
    const selectAllFeeTypes = () => setSelectedFeeTypeIds(feeTypes.map((ft) => ft.id));
    const deselectAllFeeTypes = () => setSelectedFeeTypeIds([]);

    // Handle create
    const handleCreate = async () => {
        if (structurePreviews.length === 0) return;

        setIsCreating(true);
        try {
            const structures = structurePreviews.map((preview) => ({
                name: preview.structureName,
                classIds: [preview.classId],
                items: preview.items.map((item) => ({
                    feeTypeId: item.feeTypeId,
                    amount: item.amount,
                })),
            }));

            const result = await onCreateStructures(selectedAcademicYearId, structures);

            if (result.success) {
                onOpenChange(false);
            }
        } finally {
            setIsCreating(false);
        }
    };

    // Step validation
    const canProceedStep1 = selectedAcademicYearId && selectedClassIds.length > 0;
    const canProceedStep2 = selectedFeeTypeIds.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Quick Create Fee Structures by Class
                    </DialogTitle>
                    <DialogDescription>
                        Create separate fee structures for each class with class-specific amounts automatically applied.
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 py-4">
                    {[1, 2, 3].map((s) => (
                        <React.Fragment key={s}>
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                    step === s
                                        ? "bg-primary text-primary-foreground"
                                        : step > s
                                            ? "bg-primary/20 text-primary"
                                            : "bg-muted text-muted-foreground"
                                )}
                            >
                                {step > s ? <Check className="h-4 w-4" /> : s}
                            </div>
                            {s < 3 && (
                                <div
                                    className={cn(
                                        "w-12 h-1 rounded",
                                        step > s ? "bg-primary/40" : "bg-muted"
                                    )}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex justify-center gap-8 text-xs text-muted-foreground mb-4">
                    <span className={step >= 1 ? "text-foreground" : ""}>Select Classes</span>
                    <span className={step >= 2 ? "text-foreground" : ""}>Select Fee Types</span>
                    <span className={step >= 3 ? "text-foreground" : ""}>Review & Create</span>
                </div>

                <Separator />

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto py-4 min-h-[300px]">
                    {/* Step 1: Select Classes */}
                    {step === 1 && (
                        <div className="space-y-4">
                            {/* Academic Year Selection */}
                            <div className="space-y-2">
                                <Label>Academic Year</Label>
                                <Select
                                    value={selectedAcademicYearId}
                                    onValueChange={setSelectedAcademicYearId}
                                >
                                    <SelectTrigger className="w-full md:w-[300px]">
                                        <SelectValue placeholder="Select academic year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {academicYears.map((year) => (
                                            <SelectItem key={year.id} value={year.id}>
                                                {year.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            {/* Class Selection */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Select Classes ({selectedClassIds.length} selected)</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={selectAllClasses}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={deselectAllClasses}
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[250px] overflow-y-auto p-2 border rounded-md">
                                    {sortedClasses.map((cls) => (
                                        <div
                                            key={cls.id}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                                                selectedClassIds.includes(cls.id) && "bg-primary/10 border border-primary/30"
                                            )}
                                            onClick={() => toggleClass(cls.id)}
                                        >
                                            <Checkbox
                                                checked={selectedClassIds.includes(cls.id)}
                                                onCheckedChange={() => toggleClass(cls.id)}
                                            />
                                            <span className="text-sm">{cls.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Fee Types */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Select Fee Types to Include ({selectedFeeTypeIds.length} selected)</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={selectAllFeeTypes}
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={deselectAllFeeTypes}
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>

                            <div className="border rounded-md max-h-[350px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead className="w-[50px]">Include</TableHead>
                                            <TableHead>Fee Type</TableHead>
                                            <TableHead>Default Amount</TableHead>
                                            <TableHead>Frequency</TableHead>
                                            <TableHead>Class-Specific</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {feeTypes.map((feeType) => {
                                            const hasClassAmounts = (feeType.classAmounts?.length ?? 0) > 0;
                                            const isSelected = selectedFeeTypeIds.includes(feeType.id);

                                            return (
                                                <TableRow
                                                    key={feeType.id}
                                                    className={cn(
                                                        "cursor-pointer hover:bg-muted/50",
                                                        isSelected && "bg-primary/5"
                                                    )}
                                                    onClick={() => toggleFeeType(feeType.id)}
                                                >
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleFeeType(feeType.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{feeType.name}</TableCell>
                                                    <TableCell>₹{feeType.amount.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {frequencyLabels[feeType.frequency] || feeType.frequency}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {hasClassAmounts ? (
                                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                                                {feeType.classAmounts?.length} classes
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">—</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Fee types with class-specific amounts will automatically use the correct amount per class.
                            </p>
                        </div>
                    )}

                    {/* Step 3: Review & Create */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold">
                                        {structurePreviews.length} Fee Structure{structurePreviews.length !== 1 ? "s" : ""} will be created
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Review the details below before creating
                                    </p>
                                </div>
                            </div>

                            <div className="border rounded-md max-h-[350px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead>Structure Name</TableHead>
                                            <TableHead>Fee Items</TableHead>
                                            <TableHead className="text-right">Total Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {structurePreviews.map((preview) => (
                                            <TableRow key={preview.classId}>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <span>{preview.structureName}</span>
                                                        <Badge variant="outline" className="ml-2 text-xs">
                                                            {preview.className}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {preview.items.map((item, idx) => (
                                                            <Badge
                                                                key={idx}
                                                                variant={item.isClassSpecific ? "default" : "secondary"}
                                                                className={cn(
                                                                    "text-xs",
                                                                    item.isClassSpecific && "bg-blue-600"
                                                                )}
                                                            >
                                                                {item.feeTypeName}: ₹{item.amount.toLocaleString()}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-primary">
                                                    ₹{preview.totalAmount.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Badge variant="default" className="bg-blue-600 text-xs">Example</Badge>
                                    <span className="text-muted-foreground">= Class-specific amount</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">Example</Badge>
                                    <span className="text-muted-foreground">= Default amount</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <Separator />

                <DialogFooter className="flex-row justify-between sm:justify-between">
                    <div>
                        {step > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep(step - 1)}
                                disabled={isCreating}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Back
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        {step < 3 ? (
                            <Button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                disabled={
                                    (step === 1 && !canProceedStep1) ||
                                    (step === 2 && !canProceedStep2)
                                }
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleCreate}
                                disabled={isCreating || structurePreviews.length === 0}
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Create {structurePreviews.length} Fee Structure{structurePreviews.length !== 1 ? "s" : ""}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Helper function to extract numeric level from class name
 */
function extractClassLevel(name: string): number | null {
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

    for (const [key, value] of Object.entries(preSchoolMap)) {
        if (lowerName.includes(key)) {
            return value;
        }
    }

    const match = lowerName.match(/(\d+)/);
    if (match) {
        return parseInt(match[1], 10);
    }

    return null;
}
