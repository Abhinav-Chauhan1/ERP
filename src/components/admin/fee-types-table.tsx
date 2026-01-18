"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2 } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";

// Duplicate options to avoid circular deps or complex exports if not in shared constant
const frequencyMap: Record<string, string> = {
    "ONE_TIME": "One Time",
    "MONTHLY": "Monthly",
    "QUARTERLY": "Quarterly",
    "SEMI_ANNUAL": "Semi-Annual",
    "ANNUAL": "Annual"
};

interface FeeType {
    id: string;
    name: string;
    description?: string | null;
    amount: number;
    frequency: string;
    isOptional: boolean;
    classAmounts?: any[];
}

interface FeeTypesTableProps {
    feeTypes: FeeType[];
    onView: (feeType: FeeType) => void;
    onEdit: (feeType: FeeType) => void;
    onDelete: (id: string) => void;
}

export function FeeTypesTable({ feeTypes, onView, onEdit, onDelete }: FeeTypesTableProps) {
    const columns = [
        {
            key: "name",
            label: "Name",
            isHeader: true,
            render: (feeType: FeeType) => (
                <div>
                    <div className="font-medium">{feeType.name}</div>
                    <div className="text-sm text-muted-foreground">{feeType.description || "—"}</div>
                </div>
            ),
            mobileRender: (feeType: FeeType) => (
                <div>
                    <div className="font-medium text-sm">{feeType.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">{feeType.description || ""}</div>
                </div>
            ),
        },
        {
            key: "amount",
            label: "Default Amount",
            render: (feeType: FeeType) => (
                <span className="font-semibold">₹{feeType.amount.toLocaleString()}</span>
            ),
        },
        {
            key: "frequency",
            label: "Frequency",
            render: (feeType: FeeType) => (
                <Badge variant="outline">
                    {frequencyMap[feeType.frequency] || feeType.frequency}
                </Badge>
            ),
            mobileRender: (feeType: FeeType) => (
                <div className="flex gap-2 text-xs">
                    <span className="font-semibold">₹{feeType.amount.toLocaleString()}</span>
                    <span className="text-muted-foreground">/ {frequencyMap[feeType.frequency] || feeType.frequency}</span>
                </div>
            ),
        },
        {
            key: "optional",
            label: "Optional",
            mobilePriority: "low" as const,
            render: (feeType: FeeType) => (
                feeType.isOptional ? <Badge variant="secondary">Optional</Badge> : <Badge>Required</Badge>
            ),
        },
        {
            key: "classAmounts",
            label: "Class-Specific Amounts",
            mobilePriority: "low" as const,
            render: (feeType: FeeType) => (
                feeType.classAmounts && feeType.classAmounts.length > 0 ? (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {feeType.classAmounts.length} {feeType.classAmounts.length === 1 ? 'class' : 'classes'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            (custom amounts)
                        </span>
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">Default only</span>
                )
            ),
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (feeType: FeeType) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(feeType)}
                        title="View details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(feeType)}
                        title="Edit fee type"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => onDelete(feeType.id)}
                        title="Delete fee type"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
            mobileRender: (feeType: FeeType) => (
                <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onView(feeType)}>
                        View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onEdit(feeType)}>
                        Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-red-600 border-red-200" onClick={() => onDelete(feeType.id)}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <ResponsiveTable
            data={feeTypes}
            columns={columns}
            keyExtractor={(item) => item.id}
            emptyState={
                <div className="text-center py-10">
                    <div className="text-muted-foreground mb-2">No fee types found</div>
                </div>
            }
        />
    );
}
