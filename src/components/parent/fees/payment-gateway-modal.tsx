"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertCircle, Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentSessionId: string;
  cfOrderId: string;
  amount: number;
  currency?: string;
  studentName: string;
  onFailure: (error: string) => void;
}

type PaymentStatus = "idle" | "redirecting" | "failed";

export function PaymentGatewayModal({
  isOpen,
  onClose,
  paymentSessionId,
  cfOrderId,
  amount,
  currency = "INR",
  studentName,
  onFailure,
}: PaymentGatewayModalProps) {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const initializePayment = useCallback(async () => {
    setStatus("redirecting");
    try {
      // Dynamic import of Cashfree JS SDK
      const { load } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await load({
        mode: (process.env.NEXT_PUBLIC_CASHFREE_ENV as "sandbox" | "production") || "sandbox",
      });
      cashfree.checkout({ paymentSessionId });
      // Cashfree redirects to returnUrl on completion — no inline callback needed
    } catch (error) {
      setStatus("failed");
      const msg = "Failed to initialize payment gateway. Please try again.";
      setErrorMessage(msg);
      onFailure(msg);
    }
  }, [paymentSessionId, onFailure]);

  useEffect(() => {
    if (isOpen && paymentSessionId && status === "idle") {
      initializePayment();
    }
  }, [isOpen, paymentSessionId, status, initializePayment]);

  const handleRetry = () => {
    setStatus("idle");
    setErrorMessage("");
    initializePayment();
  };

  const handleClose = () => {
    if (status !== "redirecting") {
      onClose();
      setTimeout(() => {
        setStatus("idle");
        setErrorMessage("");
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Gateway</DialogTitle>
          <DialogDescription>
            Complete your payment securely through Cashfree
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Redirecting State */}
          {status === "redirecting" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-sm text-gray-600">Redirecting to payment gateway...</p>
              <p className="text-xs text-gray-500 mt-2">Please do not close this window</p>
            </div>
          )}

          {/* Loading State */}
          {status === "idle" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-sm text-gray-600">Loading payment gateway...</p>
            </div>
          )}

          {/* Failed State */}
          {status === "failed" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Payment Failed</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={handleRetry} className="flex-1">
                  Retry Payment
                </Button>
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Payment Details */}
          {status !== "failed" && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Student:</span>
                <span className="font-medium">{studentName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-xs">{cfOrderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-lg">
                  {currency} {amount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Security Notice */}
          {status !== "failed" && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-900">
                <p className="font-medium mb-1">Secure Payment</p>
                <p className="text-blue-700">
                  Your payment is processed securely through Cashfree. We do not store your card details.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
