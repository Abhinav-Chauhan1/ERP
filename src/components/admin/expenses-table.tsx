"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Eye, Receipt } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { getExpenseCategoryLabel, getExpenseCategoryColor } from "@/lib/constants/expense-categories";

const getCategoryLabel = getExpenseCategoryLabel;
const getCategoryColor = getExpenseCategoryColor;

interface Expense {
    id: string;
    title: string;
    category: string;
    amount: number;
    date: string | Date;
    paymentStatus: string;
    receiptNumber?: string;
    description?: string;
    paidTo?: string;
}

interface ExpensesTableProps {
    expenses: Expense[];
    selectedItems: string[];
    onSelectAll: () => void;
    onSelectItem: (id: string) => void;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
}

export function ExpensesTable({
    expenses,
    selectedItems,
    onSelectAll,
    onSelectItem,
    onView,
    onEdit
}: ExpensesTableProps) {
    const columns = [
        {
            key: "select",
            label: (
                <Checkbox
                    checked={selectedItems.length === expenses.length && expenses.length > 0}
                    onCheckedChange={onSelectAll}
                    aria-label="Select all"
                />
            ),
            className: "w-[40px]",
            mobileLabel: "Select",
            render: (expense: Expense) => (
                <Checkbox
                    checked={selectedItems.includes(expense.id)}
                    onCheckedChange={() => onSelectItem(expense.id)}
                    aria-label={`Select ${expense.title}`}
                />
            ),
            mobileRender: (expense: Expense) => (
                <Checkbox
                    checked={selectedItems.includes(expense.id)}
                    onCheckedChange={() => onSelectItem(expense.id)}
                    className="mr-3"
                />
            )
        },
        {
            key: "title",
            label: "Title",
            isHeader: true,
            render: (expense: Expense) => (
                <div>
                    <div className="font-medium">{expense.title}</div>
                    <div className="text-xs text-muted-foreground">{expense.receiptNumber}</div>
                </div>
            ),
            mobileRender: (expense: Expense) => (
                <div>
                    <div className="font-medium text-sm">{expense.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Receipt className="h-3 w-3" />
                        {expense.receiptNumber || "No Receipt"}
                    </div>
                </div>
            )
        },
        {
            key: "category",
            label: "Category",
            mobilePriority: "low" as const,
            render: (expense: Expense) => (
                <Badge className={getCategoryColor(expense.category)}>
                    {getCategoryLabel(expense.category)}
                </Badge>
            ),
        },
        {
            key: "amount",
            label: "Amount",
            render: (expense: Expense) => `₹${expense.amount.toLocaleString()}`,
            mobileRender: (expense: Expense) => (
                <span className="font-semibold text-sm">₹{expense.amount.toLocaleString()}</span>
            )
        },
        {
            key: "date",
            label: "Date",
            mobilePriority: "low" as const,
            render: (expense: Expense) => new Date(expense.date).toLocaleDateString(),
        },
        {
            key: "status",
            label: "Status",
            render: (expense: Expense) => (
                <Badge className={
                    expense.paymentStatus === "COMPLETED" ? "bg-green-100 text-green-800" :
                        expense.paymentStatus === "PENDING" ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                }>
                    {expense.paymentStatus}
                </Badge>
            ),
            mobileRender: (expense: Expense) => (
                <div className="text-right">
                    <Badge className={`text-[10px] h-5 px-1.5 ${expense.paymentStatus === "COMPLETED" ? "bg-green-100 text-green-800" :
                        expense.paymentStatus === "PENDING" ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                        }`}>
                        {expense.paymentStatus}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(expense.date).toLocaleDateString()}
                    </div>
                </div>
            )
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (expense: Expense) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(expense.id)}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(expense.id)}
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                </div>
            ),
            mobileRender: (expense: Expense) => (
                <div className="flex gap-2 mt-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onView(expense.id)}>
                        View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onEdit(expense.id)}>
                        Edit
                    </Button>
                </div>
            )
        },
    ];

    return (
        <ResponsiveTable
            data={expenses}
            columns={columns}
            keyExtractor={(item) => item.id}
            emptyState={
                <div className="text-center py-10">
                    <div className="text-muted-foreground mb-2">No expenses found matching your criteria</div>
                </div>
            }
        />
    );
}
