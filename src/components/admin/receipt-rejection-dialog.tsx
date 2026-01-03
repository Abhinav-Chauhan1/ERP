"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { rejectReceipt } from "@/lib/actions/receiptVerificationActions";
import toast from "react-hot-toast";

interface ReceiptData {
  id: string;
  referenceNumber: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  student: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  feeStructure: {
    name: string;
  };
}

interface ReceiptRejectionDialogProps {
  receipt: ReceiptData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRejected?: () => void;
}

const PREDEFINED_REASONS = [
  "Receipt image is unclear or unreadable",
  "Receipt does not match the payment details provided",
  "Receipt appears to be altered or tampered with",
  "Receipt is for a different student or fee structure",
  "Payment amount on receipt does not match the amount entered",
  "Receipt date is outside the acceptable range",
  "Receipt is a duplicate of a previously submitted payment",
  "Receipt is not from an authorized payment source",
  "Required information is missing from the receipt",
  "Other (please specify below)",
];

export function ReceiptRejectionDialog({
  receipt,
  open,
  onOpenChange,
  onRejected,
}: ReceiptRejectionDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!receipt) return null;

  const handleReject = async () => {
    // Validate rejection reason
    const finalReason =
      selectedReason === "Other (please specify below)"
        ? customReason.trim()
        : selectedReason;

    if (!finalReason) {
      setError("Please select or enter a rejection reason");
      return;
    }

    if (finalReason.length < 10) {
      setError("Rejection reason must be at least 10 characters long");
      return;
    }

    setIsRejecting(true);
    setError(null);

    try {
      const result = await rejectReceipt(receipt.id, finalReason);
      if (result.success) {
        toast.success("Receipt rejected successfully");
        onOpenChange(false);
        // Reset form
        setSelectedReason("");
        setCustomReason("");
        if (onRejected) {
          onRejected();
        }
      } else {
        setError(result.error || "Failed to reject receipt");
      }
    } catch (error) {
      console.error("Error rejecting receipt:", error);
      setError("An error occurred while rejecting the receipt");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCancel = () => {
    setSelectedReason("");
    setCustomReason("");
    setError(null);
    onOpenChange(false);
  };

  const isCustomReason = selectedReason === "Other (please specify below)";
  const canSubmit = isCustomReason
    ? customReason.trim().length >= 10
    : selectedReason.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-600" />
            Reject Payment Receipt
          </DialogTitle>
          <DialogDescription>
            Provide a clear reason for rejecting this receipt. The student will be
            notified with your reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Receipt Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">
              Receipt Summary
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Reference Number</p>
                <p className="font-mono font-medium">{receipt.referenceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Student</p>
                <p className="font-medium">
                  {receipt.student.user.firstName} {receipt.student.user.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-semibold">₹{receipt.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Date</p>
                <p className="font-medium">
                  {format(new Date(receipt.paymentDate), "MMM dd, yyyy")}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Fee Structure</p>
                <p className="font-medium">{receipt.feeStructure.name}</p>
              </div>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> The student will receive a notification with
              your rejection reason. Please ensure your reason is clear and
              professional.
            </AlertDescription>
          </Alert>

          {/* Predefined Reasons */}
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="rejection-reason">
                <SelectValue placeholder="Select a reason for rejection" />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the most appropriate reason from the list
            </p>
          </div>

          {/* Custom Reason Textarea */}
          {isCustomReason && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">
                Custom Rejection Reason *
                <span className="text-xs text-muted-foreground ml-2">
                  (minimum 10 characters)
                </span>
              </Label>
              <Textarea
                id="custom-reason"
                placeholder="Please provide a detailed reason for rejecting this receipt..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {customReason.length} / 10 characters minimum
              </p>
            </div>
          )}

          {/* Selected Reason Preview */}
          {selectedReason && !isCustomReason && (
            <div className="space-y-2">
              <Label>Reason that will be sent to student:</Label>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded-lg">
                <p className="text-sm">{selectedReason}</p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isRejecting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={!canSubmit || isRejecting}
            className="gap-2"
          >
            {isRejecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Confirm Rejection
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
