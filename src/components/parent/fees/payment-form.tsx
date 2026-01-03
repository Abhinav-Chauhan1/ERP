"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AlertCircle, CheckCircle, CreditCard, DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface FeeItem {
  id: string;
  name: string;
  amount: number;
  dueDate: Date | null;
  status: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
  paidAmount: number;
  balance: number;
}

interface PaymentFormProps {
  student: {
    id: string;
    name: string;
    class: string;
  };
  feeStructureId: string;
  feeItems: FeeItem[];
  onSubmit: (data: {
    feeTypeIds: string[];
    amount: number;
    paymentMethod: string;
    remarks?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function PaymentForm({
  student,
  feeStructureId,
  feeItems,
  onSubmit,
  isLoading = false,
}: PaymentFormProps) {
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter out paid items
  const unpaidFeeItems = feeItems.filter(
    (item) => item.status !== "PAID" && item.balance > 0
  );

  // Calculate total amount based on selected fees
  const calculateTotalAmount = () => {
    if (customAmount) {
      return parseFloat(customAmount) || 0;
    }
    
    return selectedFeeIds.reduce((total, feeId) => {
      const feeItem = unpaidFeeItems.find((item) => item.id === feeId);
      return total + (feeItem?.balance || 0);
    }, 0);
  };

  const totalAmount = calculateTotalAmount();

  const handleFeeSelection = (feeId: string, checked: boolean) => {
    if (checked) {
      setSelectedFeeIds([...selectedFeeIds, feeId]);
    } else {
      setSelectedFeeIds(selectedFeeIds.filter((id) => id !== feeId));
    }
    // Clear custom amount when selecting fees
    setCustomAmount("");
    setErrors({});
  };

  const handleSelectAll = () => {
    if (selectedFeeIds.length === unpaidFeeItems.length) {
      setSelectedFeeIds([]);
    } else {
      setSelectedFeeIds(unpaidFeeItems.map((item) => item.id));
    }
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    // Clear fee selections when entering custom amount
    if (value) {
      setSelectedFeeIds([]);
    }
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (selectedFeeIds.length === 0 && !customAmount) {
      newErrors.fees = "Please select at least one fee item or enter a custom amount";
    }

    if (customAmount && parseFloat(customAmount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = "Please select a payment method";
    }

    if (totalAmount <= 0) {
      newErrors.amount = "Payment amount must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        feeTypeIds: selectedFeeIds.length > 0 ? selectedFeeIds : unpaidFeeItems.map(item => item.id),
        amount: totalAmount,
        paymentMethod,
        remarks: remarks || undefined,
      });
    } catch (error) {
      console.error("Payment submission error:", error);
    }
  };

  const getStatusBadge = (status: FeeItem["status"]) => {
    switch (status) {
      case "OVERDUE":
        return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
      case "PARTIAL":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">Partial</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Make Payment</CardTitle>
        <p className="text-sm text-muted-foreground">
          {student.name} • {student.class}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fee Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Select Fee Items</Label>
              {unpaidFeeItems.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedFeeIds.length === unpaidFeeItems.length ? "Deselect All" : "Select All"}
                </Button>
              )}
            </div>

            {unpaidFeeItems.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All fees have been paid. No pending payments.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 border rounded-lg p-3">
                {unpaidFeeItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50"
                  >
                    <Checkbox
                      id={item.id}
                      checked={selectedFeeIds.includes(item.id)}
                      onCheckedChange={(checked) =>
                        handleFeeSelection(item.id, checked as boolean)
                      }
                      disabled={!!customAmount}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={item.id}
                          className="font-medium cursor-pointer"
                        >
                          {item.name}
                        </Label>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>Balance: ₹{item.balance.toFixed(2)}</span>
                        {item.paidAmount > 0 && (
                          <span className="text-green-600">
                            Paid: ₹{item.paidAmount.toFixed(2)}
                          </span>
                        )}
                        {item.dueDate && (
                          <span>Due: {format(item.dueDate, "MMM d, yyyy")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errors.fees && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.fees}
              </p>
            )}
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="customAmount">Or Enter Custom Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="customAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="pl-9"
                disabled={selectedFeeIds.length > 0}
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter a custom amount if you want to make a partial payment
            </p>
            {errors.amount && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONLINE_PAYMENT">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Online Payment (Razorpay)
                  </div>
                </SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.paymentMethod}
              </p>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Input
              id="remarks"
              placeholder="Add any notes about this payment..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {remarks.length}/500 characters
            </p>
          </div>

          {/* Total Amount Display */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Total Payment Amount</span>
              <span className="text-2xl font-bold text-blue-900">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || unpaidFeeItems.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Payment
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
