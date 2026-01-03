"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertCircle, CheckCircle, Loader2, XCircle } from "lucide-react";
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
  orderId: string;
  amount: number;
  currency?: string;
  studentName: string;
  onSuccess: (paymentData: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) => Promise<void>;
  onFailure: (error: string) => void;
}

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

type PaymentStatus = "idle" | "processing" | "success" | "failed";

export function PaymentGatewayModal({
  isOpen,
  onClose,
  orderId,
  amount,
  currency = "INR",
  studentName,
  onSuccess,
  onFailure,
}: PaymentGatewayModalProps) {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      setStatus("failed");
      setErrorMessage("Failed to load payment gateway. Please try again.");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializePayment = useCallback(() => {
    if (!window.Razorpay) {
      setStatus("failed");
      setErrorMessage("Payment gateway not available. Please refresh and try again.");
      return;
    }

    setStatus("processing");

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount * 100, // Convert to paise
      currency: currency,
      name: "School Management System",
      description: `Fee payment for ${studentName}`,
      order_id: orderId,
      handler: async function (response: any) {
        try {
          setStatus("processing");
          await onSuccess({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          setStatus("success");
        } catch (error) {
          setStatus("failed");
          setErrorMessage("Payment verification failed. Please contact support.");
          onFailure("Payment verification failed");
        }
      },
      prefill: {
        name: studentName,
      },
      theme: {
        color: "#3b82f6",
      },
      modal: {
        ondismiss: function () {
          setStatus("failed");
          setErrorMessage("Payment cancelled by user");
          onFailure("Payment cancelled");
        },
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        setStatus("failed");
        setErrorMessage(
          response.error.description || "Payment failed. Please try again."
        );
        onFailure(response.error.description);
      });
      razorpay.open();
    } catch (error) {
      setStatus("failed");
      setErrorMessage("Failed to initialize payment. Please try again.");
      onFailure("Payment initialization failed");
    }
  }, [amount, currency, studentName, orderId, onSuccess, onFailure]);

  // Initialize Razorpay when modal opens
  useEffect(() => {
    if (isOpen && isScriptLoaded && orderId && status === "idle") {
      initializePayment();
    }
  }, [isOpen, isScriptLoaded, orderId, status, initializePayment]);

  const handleRetry = () => {
    setStatus("idle");
    setErrorMessage("");
    initializePayment();
  };

  const handleClose = () => {
    if (status !== "processing") {
      onClose();
      // Reset state after modal closes
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
            Complete your payment securely through Razorpay
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading State */}
          {status === "idle" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-sm text-gray-600">Loading payment gateway...</p>
            </div>
          )}

          {/* Processing State */}
          {status === "processing" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-sm text-gray-600">Processing your payment...</p>
              <p className="text-xs text-gray-500 mt-2">Please do not close this window</p>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Payment Successful!</AlertTitle>
              <AlertDescription className="text-green-800">
                Your payment has been processed successfully. You will receive a confirmation email shortly.
              </AlertDescription>
            </Alert>
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
          {(status === "idle" || status === "processing") && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Student:</span>
                <span className="font-medium">{studentName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-xs">{orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-lg">
                  {currency} {amount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Success Actions */}
          {status === "success" && (
            <div className="flex gap-2">
              <Button onClick={handleClose} className="flex-1">
                Close
              </Button>
            </div>
          )}

          {/* Security Notice */}
          {(status === "idle" || status === "processing") && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-900">
                <p className="font-medium mb-1">Secure Payment</p>
                <p className="text-blue-700">
                  Your payment is processed securely through Razorpay. We do not store your card details.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
