"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2, Download } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { format } from "date-fns";

// --- Types ---

interface Payment {
    id: string;
    receiptNumber?: string;
    student: {
        admissionId: string;
        user: {
            firstName: string;
            lastName: string;
        };
        enrollments: Array<{
            class: {
                name: string;
            };
        }>;
    };
    paymentDate: Date | string;
    amount: number;
    paidAmount: number;
    balance: number;
    paymentMethod: string;
    status: string;
}

interface PendingFee {
    studentId: string;
    studentName: string;
    admissionId: string;
    class: string;
    section: string;
    feeStructureId: string;
    feeStructureName: string;
    totalAmount: number;
    totalPaid: number;
    balance: number;
}

// --- Helpers ---

const paymentMethodsMap: Record<string, string> = {
    "CASH": "Cash",
    "CHEQUE": "Cheque",
    "CREDIT_CARD": "Credit Card",
    "DEBIT_CARD": "Debit Card",
    "BANK_TRANSFER": "Bank Transfer",
    "ONLINE_PAYMENT": "Online Payment",
    "SCHOLARSHIP": "Scholarship",
};

// --- Components ---

interface PaymentsTableProps {
    payments: Payment[];
    onView: (payment: Payment) => void;
    onEdit: (payment: Payment) => void;
    onDelete: (id: string) => void;
    emptyMessage?: string;
}

export function PaymentsTable({ payments, onView, onEdit, onDelete, emptyMessage }: PaymentsTableProps) {
    const columns = [
        {
            key: "receipt",
            label: "Receipt No.",
            render: (payment: Payment) => <span className="font-mono text-xs">{payment.receiptNumber || "—"}</span>,
            mobileRender: (payment: Payment) => (
                <div className="flex justify-between items-center w-full">
                    <span className="font-mono text-xs text-muted-foreground">{payment.receiptNumber || "—"}</span>
                    <Badge
                        variant={
                            payment.status === "COMPLETED"
                                ? "default"
                                : payment.status === "PARTIAL"
                                    ? "secondary"
                                    : "destructive"
                        }
                        className="text-[10px] h-5 px-1.5"
                    >
                        {payment.status}
                    </Badge>
                </div>
            )
        },
        {
            key: "student",
            label: "Student",
            isHeader: true,
            render: (payment: Payment) => (
                <div>
                    <div className="font-medium">
                        {payment.student?.user?.firstName} {payment.student?.user?.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {payment.student?.admissionId}
                    </div>
                </div>
            ),
            mobileRender: (payment: Payment) => (
                <div>
                    <div className="font-medium text-sm">
                        {payment.student?.user?.firstName} {payment.student?.user?.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {payment.student?.enrollments?.[0]?.class?.name || "—"}
                    </div>
                </div>
            ),
        },
        {
            key: "class",
            label: "Class",
            mobilePriority: "low" as const,
            render: (payment: Payment) => payment.student?.enrollments?.[0]?.class?.name || "—",
        },
        {
            key: "date",
            label: "Date",
            render: (payment: Payment) => format(new Date(payment.paymentDate), "MMM dd, yyyy"),
            mobileRender: (payment: Payment) => <span className="text-xs text-muted-foreground">{format(new Date(payment.paymentDate), "MM/dd/yy")}</span>
        },
        {
            key: "amount",
            label: "Amount",
            render: (payment: Payment) => `₹${payment.amount.toLocaleString()}`,
        },
        {
            key: "paid",
            label: "Paid",
            mobilePriority: "low" as const,
            render: (payment: Payment) => `₹${payment.paidAmount.toLocaleString()}`,
        },
        {
            key: "balance",
            label: "Balance",
            render: (payment: Payment) => (
                <span
                    className={
                        payment.balance > 0
                            ? "text-orange-600 font-medium"
                            : "text-green-600"
                    }
                >
                    ₹{payment.balance.toLocaleString()}
                </span>
            ),
            mobileRender: (payment: Payment) => (
                <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">₹{payment.paidAmount.toLocaleString()}</span>
                    {payment.balance > 0 && <span className="text-xs text-orange-600">Bal: ₹{payment.balance.toLocaleString()}</span>}
                </div>
            )
        },
        {
            key: "method",
            label: "Method",
            mobilePriority: "low" as const,
            render: (payment: Payment) => (
                <Badge variant="outline">
                    {paymentMethodsMap[payment.paymentMethod] || payment.paymentMethod}
                </Badge>
            ),
        },
        {
            key: "status",
            label: "Status",
            mobilePriority: "low" as const, // Already shown in mobile header
            render: (payment: Payment) => (
                <Badge
                    variant={
                        payment.status === "COMPLETED"
                            ? "default"
                            : payment.status === "PARTIAL"
                                ? "secondary"
                                : "destructive"
                    }
                >
                    {payment.status}
                </Badge>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (payment: Payment) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(payment)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(payment)}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(payment.id)}
                    >
                        {/* Using Download icon as in original code, but maybe should be Trash2? 
                 Original code had Download icon but handleDeletePayment. 
                 I'll use Trash2 to be safe for a delete action.
              */}
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
            mobileRender: (payment: Payment) => (
                <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onView(payment)}>View</Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onEdit(payment)}>Edit</Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-red-600 border-red-200" onClick={() => onDelete(payment.id)}>Delete</Button>
                </div>
            )
        },
    ];

    return (
        <ResponsiveTable
            data={payments}
            columns={columns}
            keyExtractor={(item) => item.id}
            emptyState={
                <div className="text-center py-10">
                    <div className="text-muted-foreground mb-2">{emptyMessage || "No payments found"}</div>
                </div>
            }
        />
    );
}

interface PendingFeesTableProps {
    fees: PendingFee[];
    onCollect: (fee: PendingFee) => void;
    emptyMessage?: string;
}

export function PendingFeesTable({ fees, onCollect, emptyMessage }: PendingFeesTableProps) {
    const columns = [
        {
            key: "student",
            label: "Student",
            isHeader: true,
            render: (fee: PendingFee) => (
                <div>
                    <div className="font-medium">{fee.studentName}</div>
                    <div className="text-xs text-muted-foreground">{fee.admissionId}</div>
                </div>
            ),
            mobileRender: (fee: PendingFee) => (
                <div className="flex justify-between items-start w-full">
                    <div>
                        <div className="font-medium text-sm">{fee.studentName}</div>
                        <div className="text-xs text-muted-foreground">{fee.class} - {fee.section}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-medium text-orange-600">₹{fee.balance.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">Due</div>
                    </div>
                </div>
            ),
        },
        {
            key: "admissionId",
            label: "Admission ID",
            mobilePriority: "low" as const,
            render: (fee: PendingFee) => fee.admissionId,
        },
        {
            key: "class",
            label: "Class",
            mobilePriority: "low" as const,
            render: (fee: PendingFee) => `${fee.class} - ${fee.section}`,
        },
        {
            key: "structure",
            label: "Fee Structure",
            render: (fee: PendingFee) => fee.feeStructureName,
            mobileRender: (fee: PendingFee) => (
                <div className="text-xs text-muted-foreground mt-1">{fee.feeStructureName}</div>
            ),
        },
        {
            key: "total",
            label: "Total Amount",
            mobilePriority: "low" as const,
            render: (fee: PendingFee) => `₹${fee.totalAmount.toLocaleString()}`,
        },
        {
            key: "paid",
            label: "Paid",
            mobilePriority: "low" as const,
            render: (fee: PendingFee) => `₹${fee.totalPaid.toLocaleString()}`,
        },
        {
            key: "balance",
            label: "Balance",
            mobilePriority: "low" as const, // Shown in mobile header
            render: (fee: PendingFee) => (
                <span className="text-orange-600 font-medium">
                    ₹{fee.balance.toLocaleString()}
                </span>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (fee: PendingFee) => (
                <Button
                    size="sm"
                    onClick={() => onCollect(fee)}
                >
                    Collect Payment
                </Button>
            ),
            mobileRender: (fee: PendingFee) => (
                <Button
                    size="sm"
                    className="w-full h-8 text-xs mt-3"
                    onClick={() => onCollect(fee)}
                >
                    Collect Payment
                </Button>
            )
        },
    ];

    return (
        <ResponsiveTable
            data={fees}
            columns={columns}
            keyExtractor={(item) => `${item.studentId}-${item.feeStructureId}`}
            emptyState={
                <div className="text-center py-10">
                    <div className="text-muted-foreground mb-2">{emptyMessage || "No pending fees found"}</div>
                </div>
            }
        />
    );
}
