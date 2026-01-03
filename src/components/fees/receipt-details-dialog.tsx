"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  ZoomIn,
  ZoomOut,
  Clock,
  CheckCircle,
  XCircle,
  User,
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
} from "lucide-react";
import { ReceiptStatus, PaymentMethod } from "@prisma/client";
import { format } from "date-fns";
import { getCloudinaryThumb } from "@/lib/cloudinary";

interface ReceiptDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: {
    id: string;
    referenceNumber: string;
    status: ReceiptStatus;
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    transactionRef?: string | null;
    remarks?: string | null;
    receiptImageUrl: string;
    createdAt: Date;
    verifiedAt?: Date | null;
    verifiedBy?: string | null;
    rejectionReason?: string | null;
    student: {
      admissionId: string;
      user: {
        firstName: string;
        lastName: string;
        email: string;
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
      amount?: number | null;
      academicYear: {
        name: string;
      };
    };
    feePayment?: {
      id: string;
      status: string;
      paidAmount: number;
    } | null;
  };
}

export function ReceiptDetailsDialog({
  open,
  onOpenChange,
  receipt,
}: ReceiptDetailsDialogProps) {
  const [imageZoom, setImageZoom] = useState(100);

  // Get status badge configuration
  const getStatusConfig = () => {
    switch (receipt.status) {
      case ReceiptStatus.PENDING_VERIFICATION:
        return {
          icon: Clock,
          label: "Pending Verification",
          className: "border-yellow-500 text-yellow-700 bg-yellow-50",
        };
      case ReceiptStatus.VERIFIED:
        return {
          icon: CheckCircle,
          label: "Verified",
          className: "border-green-500 text-green-700 bg-green-50",
        };
      case ReceiptStatus.REJECTED:
        return {
          icon: XCircle,
          label: "Rejected",
          className: "border-red-500 text-red-700 bg-red-50",
        };
      default:
        return {
          icon: Clock,
          label: "Unknown",
          className: "",
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

  // Handle image download
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = receipt.receiptImageUrl;
    link.download = `receipt-${receipt.referenceNumber}.jpg`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle zoom
  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 25, 50));
  };

  const enrollment = receipt.student.enrollments[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">Receipt Details</DialogTitle>
              <DialogDescription className="mt-1">
                Reference: {receipt.referenceNumber}
              </DialogDescription>
            </div>
            <Badge variant="outline" className={statusConfig.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Receipt Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Receipt Image
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={imageZoom <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                  {imageZoom}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={imageZoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <div className="border rounded-lg overflow-auto max-h-96 bg-gray-50 flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receipt.receiptImageUrl}
                alt="Payment Receipt"
                className="transition-all duration-200"
                style={{ width: `${imageZoom}%` }}
                loading="lazy"
              />
            </div>
          </div>

          {/* Student Information */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Student Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {receipt.student.user.firstName} {receipt.student.user.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Admission ID</p>
                <p className="text-sm font-medium text-gray-900">
                  {receipt.student.admissionId}
                </p>
              </div>
              {enrollment && (
                <>
                  <div>
                    <p className="text-xs text-gray-500">Class</p>
                    <p className="text-sm font-medium text-gray-900">
                      {enrollment.class.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Section</p>
                    <p className="text-sm font-medium text-gray-900">
                      {enrollment.section.name}
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">
                  {receipt.student.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Structure and Balance */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Fee Structure
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Fee Structure</p>
                <p className="text-sm font-medium text-gray-900">
                  {receipt.feeStructure.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Academic Year</p>
                <p className="text-sm font-medium text-gray-900">
                  {receipt.feeStructure.academicYear.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Fee Amount</p>
                <p className="text-sm font-semibold text-gray-900">
                  ₹{(receipt.feeStructure.amount || 0).toFixed(2)}
                </p>
              </div>
              {receipt.feePayment && (
                <div>
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <Badge variant="outline" className="mt-1">
                    {receipt.feePayment.status}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Amount Paid</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{receipt.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatPaymentMethod(receipt.paymentMethod)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(receipt.paymentDate), "MMMM dd, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Submitted On</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(receipt.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
              {receipt.transactionRef && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Transaction Reference</p>
                  <p className="text-sm font-medium text-gray-900">
                    {receipt.transactionRef}
                  </p>
                </div>
              )}
              {receipt.remarks && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Remarks</p>
                  <p className="text-sm text-gray-900">{receipt.remarks}</p>
                </div>
              )}
            </div>
          </div>

          {/* Verification/Rejection Details */}
          {receipt.status === ReceiptStatus.VERIFIED && receipt.verifiedAt && (
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Verification Details
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-green-600">Verified On</p>
                  <p className="text-sm font-medium text-green-900">
                    {format(new Date(receipt.verifiedAt), "MMMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
                {receipt.feePayment && (
                  <div>
                    <p className="text-xs text-green-600">Payment Record Created</p>
                    <p className="text-sm font-medium text-green-900">
                      Payment ID: {receipt.feePayment.id.slice(0, 8)}...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {receipt.status === ReceiptStatus.REJECTED && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                Rejection Details
              </h3>
              <div className="space-y-2">
                {receipt.verifiedAt && (
                  <div>
                    <p className="text-xs text-red-600">Rejected On</p>
                    <p className="text-sm font-medium text-red-900">
                      {format(new Date(receipt.verifiedAt), "MMMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                )}
                {receipt.rejectionReason && (
                  <div>
                    <p className="text-xs text-red-600">Reason</p>
                    <p className="text-sm text-red-900">{receipt.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {receipt.status === ReceiptStatus.PENDING_VERIFICATION && (
            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Pending Verification
              </h3>
              <p className="text-sm text-yellow-800">
                Your receipt is currently being reviewed by the administration. You will
                be notified once it has been verified or if any issues are found.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
