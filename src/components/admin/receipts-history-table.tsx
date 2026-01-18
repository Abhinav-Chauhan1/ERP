"use client";

import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { format } from "date-fns";

interface Receipt {
    id: string;
    referenceNumber: string;
    amount: number;
    paymentDate: Date;
    status: string;
    verifiedAt?: Date | null;
    rejectionReason?: string | null;
    student: {
        user: {
            firstName: string;
            lastName: string;
        };
        enrollments: Array<{
            class: {
                name: string;
            };
            section: {
                name: string;
            };
        }>;
    };
    feeStructure: {
        name: string;
    };
}

interface ReceiptsHistoryTableProps {
    data: Receipt[];
    type: "verified" | "rejected";
    onView: (id: string) => void;
}

export function ReceiptsHistoryTable({ data, type, onView }: ReceiptsHistoryTableProps) {
    const columns = [
        {
            key: "reference",
            label: "Reference",
            className: "w-[120px]",
            render: (receipt: Receipt) => (
                <span className="font-mono text-xs">{receipt.referenceNumber}</span>
            ),
            mobilePriority: "low" as const
        },
        {
            key: "student",
            label: "Student",
            isHeader: true,
            render: (receipt: Receipt) => (
                <div className="flex flex-col">
                    <span className="font-medium">
                        {receipt.student.user.firstName} {receipt.student.user.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {receipt.feeStructure.name}
                    </span>
                </div>
            ),
            mobileRender: (receipt: Receipt) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">
                        {receipt.student.user.firstName} {receipt.student.user.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {receipt.referenceNumber}
                    </span>
                </div>
            )
        },
        {
            key: "class",
            label: "Class",
            mobilePriority: "low" as const,
            render: (receipt: Receipt) => receipt.student.enrollments[0] ? (
                <div className="flex flex-col">
                    <span>{receipt.student.enrollments[0].class.name}</span>
                    <span className="text-xs text-muted-foreground">
                        {receipt.student.enrollments[0].section.name}
                    </span>
                </div>
            ) : "N/A"
        },
        {
            key: "amount",
            label: "Amount",
            render: (receipt: Receipt) => <span className="font-semibold">₹{receipt.amount.toFixed(2)}</span>
        },
        {
            key: "paymentDate",
            label: "Payment Date",
            mobilePriority: "low" as const,
            render: (receipt: Receipt) => format(new Date(receipt.paymentDate), "MMM dd, yyyy")
        },
        {
            key: "date",
            label: type === "verified" ? "Verified On" : "Rejected On",
            render: (receipt: Receipt) => {
                const date = receipt.verifiedAt;
                return date ? format(new Date(date), "MMM dd, yyyy") : "N/A";
            }
        },
        ...(type === "rejected" ? [{
            key: "reason",
            label: "Reason",
            render: (receipt: Receipt) => (
                <p className="text-sm text-muted-foreground truncate max-w-xs" title={receipt.rejectionReason || ""}>
                    {receipt.rejectionReason || "No reason provided"}
                </p>
            ),
            mobileRender: (receipt: Receipt) => (
                <p className="text-xs text-muted-foreground truncate">
                    <span className="font-medium">Reason:</span> {receipt.rejectionReason || "No reason provided"}
                </p>
            )
        }] : []),
        {
            key: "actions",
            label: "Actions",
            isAction: true,
            className: "text-right",
            render: (receipt: Receipt) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(receipt.id)}
                >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                </Button>
            )
        }
    ];

    return <ResponsiveTable data={data} columns={columns} keyExtractor={(r) => r.id} />;
}
