"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Eye } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";

// Budget categories (mirrored from page)
export const budgetCategories = [
    { id: "salaries", name: "Staff Salaries", color: "bg-primary/10 text-primary" },
    { id: "infrastructure", name: "Infrastructure", color: "bg-purple-100 text-purple-800" },
    { id: "utilities", name: "Utilities", color: "bg-green-100 text-green-800" },
    { id: "supplies", name: "Educational Supplies", color: "bg-amber-100 text-amber-800" },
    { id: "events", name: "School Events", color: "bg-pink-100 text-pink-800" },
    { id: "maintenance", name: "Maintenance", color: "bg-indigo-100 text-indigo-800" },
    { id: "technology", name: "Technology", color: "bg-red-100 text-red-800" },
    { id: "miscellaneous", name: "Miscellaneous", color: "bg-muted text-gray-800" },
];

export function getCategoryLabel(categoryId: string) {
    return budgetCategories.find(cat => cat.id === categoryId)?.name || categoryId;
}

export function getCategoryColor(categoryId: string) {
    return budgetCategories.find(cat => cat.id === categoryId)?.color || "bg-muted text-gray-800";
}

export function getPercentUsed(budget: { allocatedAmount: number; usedAmount: number }) {
    if (budget.allocatedAmount === 0) return 0;
    return Math.round((budget.usedAmount / budget.allocatedAmount) * 100);
}

interface Budget {
    id: string;
    title: string;
    category: string;
    academicYear: string;
    allocatedAmount: number;
    usedAmount: number;
    remainingAmount: number;
    status?: string;
    description?: string;
    startDate?: string | Date;
    endDate?: string | Date;
}

interface BudgetsTableProps {
    budgets: Budget[];
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    emptyMessage?: string;
}

export function BudgetsTable({ budgets, onView, onEdit, emptyMessage }: BudgetsTableProps) {
    const getProgressColor = (percent: number) => {
        if (percent > 90) return "rgb(239, 68, 68)";
        if (percent > 70) return "rgb(245, 158, 11)";
        return "rgb(34, 197, 94)";
    };

    const columns = [
        {
            key: "title",
            label: "Budget",
            isHeader: true,
            render: (budget: Budget) => (
                <div>
                    <div className="font-medium">{budget.title}</div>
                    <div className="text-xs text-muted-foreground">{budget.academicYear}</div>
                </div>
            ),
            mobileRender: (budget: Budget) => (
                <div>
                    <div className="font-medium text-sm">{budget.title}</div>
                    <div className="text-xs text-muted-foreground">{budget.academicYear}</div>
                </div>
            ),
        },
        {
            key: "category",
            label: "Category",
            render: (budget: Budget) => (
                <Badge className={getCategoryColor(budget.category)}>
                    {getCategoryLabel(budget.category)}
                </Badge>
            ),
            mobileRender: (budget: Budget) => (
                <Badge className={`${getCategoryColor(budget.category)} text-[10px] px-1.5`}>
                    {getCategoryLabel(budget.category)}
                </Badge>
            ),
        },
        {
            key: "amount",
            label: "Amount",
            render: (budget: Budget) => `$${budget.allocatedAmount.toLocaleString()}`,
            mobileRender: (budget: Budget) => (
                <span className="font-semibold text-sm">$ {budget.allocatedAmount.toLocaleString()}</span>
            ),
        },
        {
            key: "used",
            label: "Used",
            mobilePriority: "low" as const,
            render: (budget: Budget) => `$${budget.usedAmount.toLocaleString()}`,
        },
        {
            key: "remaining",
            label: "Remaining",
            mobilePriority: "low" as const,
            render: (budget: Budget) => `$${budget.remainingAmount.toLocaleString()}`,
        },
        {
            key: "usage",
            label: "Usage",
            render: (budget: Budget) => {
                const percent = getPercentUsed(budget);
                return (
                    <div className="flex items-center gap-2">
                        <Progress
                            value={percent}
                            className="h-2 w-24"
                            style={{
                                "--progress-foreground": getProgressColor(percent)
                            } as React.CSSProperties}
                        />
                        <span className="text-xs font-medium">{percent}%</span>
                    </div>
                );
            },
            mobileRender: (budget: Budget) => {
                const percent = getPercentUsed(budget);
                return (
                    <div className="flex items-center gap-2 w-full max-w-[120px]">
                        <Progress
                            value={percent}
                            className="h-1.5 flex-1"
                            style={{
                                "--progress-foreground": getProgressColor(percent)
                            } as React.CSSProperties}
                        />
                        <span className="text-[10px] font-medium w-8 text-right">{percent}%</span>
                    </div>
                );
            },
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (budget: Budget) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(budget.id)}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(budget.id)}
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                </div>
            ),
            mobileRender: (budget: Budget) => (
                <div className="flex gap-2 mt-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onView(budget.id)}>
                        View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onEdit(budget.id)}>
                        Edit
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <ResponsiveTable
            data={budgets}
            columns={columns}
            keyExtractor={(budget) => budget.id}
            emptyState={
                <div className="py-6 text-center text-muted-foreground">
                    {emptyMessage || "No budgets found"}
                </div>
            }
        />
    );
}
