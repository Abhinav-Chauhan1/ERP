"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle, Eye, Wallet, Edit } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";

interface PayrollTableProps {
    payments: any[];
    onViewPayslip: (payment: any) => void;
    onMakePayment: (payment: any) => void;
    onEdit: (payment: any) => void;
    months: { value: number; label: string }[];
}

export function PayrollTable({ payments, onViewPayslip, onMakePayment, onEdit, months }: PayrollTableProps) {
    const getMonthName = (monthNumber: number) => {
        return months.find(m => m.value === monthNumber)?.label || "Unknown";
    };

    const columns = [
        {
            key: "staff",
            label: "Staff",
            isHeader: true,
            render: (payment: any) => (
                <div>
                    <div className="font-medium">{payment.staffName || `${payment.teacher?.user?.firstName} ${payment.teacher?.user?.lastName}`}</div>
                    <div className="text-xs text-muted-foreground">{payment.employeeId}</div>
                </div>
            ),
            mobileRender: (payment: any) => (
                <div>
                    <div className="font-medium text-sm">{payment.staffName || `${payment.teacher?.user?.firstName} ${payment.teacher?.user?.lastName}`}</div>
                    <div className="text-xs text-muted-foreground">{payment.employeeId}</div>
                </div>
            )
        },
        {
            key: "department",
            label: "Department",
            mobilePriority: "low" as const,
            render: (payment: any) => payment.department,
        },
        {
            key: "month",
            label: "Month",
            mobilePriority: "low" as const,
            render: (payment: any) => (
                <span>{getMonthName(payment.month)} {payment.year}</span>
            ),
        },
        {
            key: "amount",
            label: "Amount",
            render: (payment: any) => (
                <span className="font-medium">₹{payment.netSalary.toLocaleString()}</span>
            ),
            mobileRender: (payment: any) => (
                <span className="font-semibold text-sm">₹{payment.netSalary.toLocaleString()}</span>
            )
        },
        {
            key: "status",
            label: "Status",
            render: (payment: any) => (
                <Badge className={
                    payment.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                        payment.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                }>
                    {payment.status === "COMPLETED" ? (
                        <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                        </>
                    ) : payment.status === "PENDING" ? (
                        <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                        </>
                    ) : (
                        <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                        </>
                    )}
                </Badge>
            ),
            mobileRender: (payment: any) => (
                <div className="text-right">
                    <Badge className={`text-[10px] h-5 px-1.5 ${payment.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                            payment.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                                "bg-red-100 text-red-800"
                        }`}>
                        {payment.status}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground mt-1">
                        {getMonthName(payment.month).substring(0, 3)} {payment.year}
                    </div>
                </div>
            )
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (payment: any) => (
                <div className="flex justify-end gap-1">
                    {payment.status === "COMPLETED" ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewPayslip(payment)}
                        >
                            <Eye className="h-4 w-4 mr-1" />
                            Payslip
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMakePayment(payment)}
                        >
                            <Wallet className="h-4 w-4 mr-1" />
                            Pay
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onEdit(payment)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                </div>
            ),
            mobileRender: (payment: any) => (
                <div className="flex gap-2 mt-2 w-full">
                    {payment.status === "COMPLETED" ? (
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onViewPayslip(payment)}>
                            View Payslip
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs bg-primary/5 text-primary border-primary/20" onClick={() => onMakePayment(payment)}>
                            Pay Now
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onEdit(payment)}>
                        Edit
                    </Button>
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
                    <div className="text-muted-foreground mb-2">No payroll records found</div>
                </div>
            }
        />
    );
}
