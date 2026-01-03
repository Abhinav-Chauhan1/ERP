"use client";

import { Clock, CheckCircle, XCircle, Eye, HelpCircle, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReceiptStatus, PaymentMethod } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReceiptStatusCardProps {
  receipt: {
    id: string;
    referenceNumber: string;
    status: ReceiptStatus;
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    createdAt: Date;
    verifiedAt?: Date | null;
    verifiedBy?: string | null;
    rejectionReason?: string | null;
    feeStructure: {
      name: string;
      id: string;
    };
    student?: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
  onViewDetails: () => void;
  showStudentName?: boolean;
  uploadUrl?: string; // URL for re-upload page
}

export function ReceiptStatusCard({
  receipt,
  onViewDetails,
  showStudentName = false,
  uploadUrl,
}: ReceiptStatusCardProps) {
  // Get status badge configuration with descriptions
  const getStatusConfig = () => {
    switch (receipt.status) {
      case ReceiptStatus.PENDING_VERIFICATION:
        return {
          icon: Clock,
          label: "Pending Verification",
          variant: "outline" as const,
          className: "border-yellow-500 text-yellow-700 bg-yellow-50",
          description: "Your receipt is awaiting administrator review. This typically takes 1-3 business days.",
        };
      case ReceiptStatus.VERIFIED:
        return {
          icon: CheckCircle,
          label: "Verified",
          variant: "outline" as const,
          className: "border-green-500 text-green-700 bg-green-50",
          description: "Your payment has been approved and your fee balance has been updated.",
        };
      case ReceiptStatus.REJECTED:
        return {
          icon: XCircle,
          label: "Rejected",
          variant: "outline" as const,
          className: "border-red-500 text-red-700 bg-red-50",
          description: "Your receipt could not be verified. Please review the rejection reason and upload a new receipt if needed.",
        };
      default:
        return {
          icon: Clock,
          label: "Unknown",
          variant: "outline" as const,
          className: "",
          description: "Status unknown",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Format payment method
  const formatPaymentMethod = (method: PaymentMethod) => {
    switch (method) {
      case "CASH":
        return "Cash";
      case "CHEQUE":
        return "Cheque";
      case "BANK_TRANSFER":
        return "Bank Transfer";
      default:
        return method;
    }
  };

  return (
    <TooltipProvider>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header: Reference Number and Status */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Reference Number</p>
                <p className="text-lg font-bold text-gray-900">
                  {receipt.referenceNumber}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={statusConfig.variant} className={statusConfig.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-gray-400 hover:text-gray-600">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{statusConfig.description}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Student Name (if applicable) */}
            {showStudentName && receipt.student && (
              <div>
                <p className="text-xs text-gray-500">Student</p>
                <p className="text-sm font-medium text-gray-900">
                  {receipt.student.user.firstName} {receipt.student.user.lastName}
                </p>
              </div>
            )}

            {/* Fee Structure */}
            <div>
              <p className="text-xs text-gray-500">Fee Structure</p>
              <p className="text-sm font-medium text-gray-900">
                {receipt.feeStructure.name}
              </p>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="text-sm font-semibold text-gray-900">
                  ₹{receipt.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatPaymentMethod(receipt.paymentMethod)}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Payment Date</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(receipt.paymentDate), "MMM dd, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Submitted On</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(receipt.createdAt), "MMM dd, yyyy")}
                </p>
              </div>
            </div>

            {/* Verification Details (if verified) */}
            {receipt.status === ReceiptStatus.VERIFIED && receipt.verifiedAt && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-600 font-medium mb-1">
                  Verified
                </p>
                <p className="text-sm text-green-900">
                  Verified on {format(new Date(receipt.verifiedAt), "MMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
            )}

            {/* Rejection Details (if rejected) */}
            {receipt.status === ReceiptStatus.REJECTED && receipt.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-600 font-medium mb-1">
                  Rejection Reason
                </p>
                <p className="text-sm text-red-900">
                  {receipt.rejectionReason}
                </p>
                {receipt.verifiedAt && (
                  <p className="text-xs text-red-700 mt-2">
                    Rejected on {format(new Date(receipt.verifiedAt), "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onViewDetails}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
              
              {/* Re-upload button for rejected receipts */}
              {receipt.status === ReceiptStatus.REJECTED && uploadUrl && (
                <Button
                  asChild
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Link href={uploadUrl}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Receipt
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
