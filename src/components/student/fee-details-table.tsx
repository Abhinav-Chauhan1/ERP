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
          badge: <Badge variant="destructive">Overdue</Badge>,
        };
      }
      return { status: "UNPAID", badge: <Badge variant="outline">Unpaid</Badge> };
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return {
        status: "PAID",
        badge: <Badge className="bg-green-100 text-green-800">Paid</Badge>,
        payment,
      };
    }

    if (payment.status === PaymentStatus.PARTIAL) {
      return {
        status: "PARTIAL",
        badge: <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>,
        payment,
      };
    }

    return {
      status: "PENDING",
      badge: <Badge className="bg-blue-100 text-blue-800">Pending</Badge>,
      payment,
    };
  };

  // Function to display payment button or status
  const renderActionButton = (feeItem: FeeItem) => {
    const { status, badge, payment } = getPaymentStatus(feeItem);

    if (status === "PAID") {
      return (
        <div className="flex items-center justify-center">
          {badge}
          <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
        </div>
      );
    }

    if (status === "PARTIAL") {
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center">
            {badge}
            <span className="ml-2 text-xs">${payment?.paidAmount.toFixed(2)} paid</span>
          </div>
          <Button size="sm" variant="outline" className="w-full mt-1">
            Pay Balance
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-1">
        {badge}
        <Button size="sm" className="w-full mt-1">
          Pay Now
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          className="px-9 py-2 w-full border rounded-md"
          placeholder="Search fee items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fee Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Due Date</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.feeType.name}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ${item.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.dueDate ? (
                      <div className="flex items-center justify-center text-sm">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        {format(new Date(item.dueDate), "MMM dd, yyyy")}
                      </div>
                    ) : (
                      <span className="text-gray-500">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {renderActionButton(item)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
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
