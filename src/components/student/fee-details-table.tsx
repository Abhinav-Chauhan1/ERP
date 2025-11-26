"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { PaymentStatus } from "@prisma/client";

// Define types for props
interface FeeType {
  id: string;
  name: string;
}

interface FeeItem {
  id: string;
  amount: number;
  dueDate?: Date | string | null;
  feeType: FeeType;
}

interface FeePayment {
  id: string;
  amount: number;
  paidAmount: number;
  status: string;
}

interface FeeDetailsTableProps {
  feeItems: FeeItem[];
  payments: FeePayment[];
}

export function FeeDetailsTable({ feeItems, payments }: FeeDetailsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter fee items based on search
  const filteredItems = feeItems.filter((item) =>
    item.feeType.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check payment status
  const getPaymentStatus = (feeItem: FeeItem) => {
    const payment = payments.find((p) => p.amount === feeItem.amount);

    if (!payment) {
      // Check if due date has passed
      if (feeItem.dueDate && new Date(feeItem.dueDate) < new Date()) {
        return {
          status: "OVERDUE",
          badge: <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>,
        };
      }
      return { status: "UNPAID", badge: <Badge variant="outline">Unpaid</Badge> };
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return {
        status: "PAID",
        badge: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>,
        payment,
      };
    }

    if (payment.status === PaymentStatus.PARTIAL) {
      return {
        status: "PARTIAL",
        badge: <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Partial</Badge>,
        payment,
      };
    }

    return {
      status: "PENDING",
      badge: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending</Badge>,
      payment,
    };
  };

  // Function to display payment button or status
  const renderActionButton = (feeItem: FeeItem) => {
    const { status, badge, payment } = getPaymentStatus(feeItem);

    if (status === "PAID") {
      return (
        <div className="flex items-center justify-center gap-2">
          {badge}
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
      );
    }

    if (status === "PARTIAL") {
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            {badge}
            <span className="text-xs text-muted-foreground">${payment?.paidAmount.toFixed(2)} paid</span>
          </div>
          <Button size="sm" variant="outline" className="w-full min-h-[36px]">
            Pay Balance
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-2">
        {badge}
        <Button size="sm" className="w-full min-h-[36px]">
          Pay Now
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="px-9 py-2 w-full border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search fee items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent">
              <TableHead className="font-medium text-muted-foreground">Fee Type</TableHead>
              <TableHead className="text-right font-medium text-muted-foreground">Amount</TableHead>
              <TableHead className="text-center font-medium text-muted-foreground">Due Date</TableHead>
              <TableHead className="text-center font-medium text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-accent/50">
                  <TableCell className="font-medium align-middle">{item.feeType.name}</TableCell>
                  <TableCell className="text-right font-semibold align-middle">
                    ${item.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center align-middle">
                    {item.dueDate ? (
                      <div className="flex items-center justify-center text-sm">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        {format(new Date(item.dueDate), "MMM dd, yyyy")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center align-middle">
                    {renderActionButton(item)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No fee items match your search
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
