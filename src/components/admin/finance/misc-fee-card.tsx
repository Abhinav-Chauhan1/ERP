"use client";

import { useCallback, useEffect, useState } from "react";
import type { DiscountType, MiscFeeCategory, PaymentMethod } from "@prisma/client";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCurrentStudentAcademicYear,
  getMiscFee,
  upsertMiscFee,
  recordMiscFeePayment,
} from "@/lib/actions/miscFeeActions";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CHEQUE: "Cheque",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  BANK_TRANSFER: "Bank Transfer",
  ONLINE_PAYMENT: "Online Payment",
  SCHOLARSHIP: "Scholarship",
};

interface MiscFeeRow {
  id: string;
  amount: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  balance: number;
}

function EditMiscFeeDialog({
  studentId,
  academicYearId,
  category,
  title,
  current,
  onSuccess,
}: {
  studentId: string;
  academicYearId: string;
  category: MiscFeeCategory;
  title: string;
  current: MiscFeeRow | null;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(current ? String(current.amount) : "");
  const [discountType, setDiscountType] = useState<DiscountType>(current?.discountType || "FLAT_AMOUNT");
  const [discountValue, setDiscountValue] = useState(current?.discountValue ? String(current.discountValue) : "");
  const [applyDiscount, setApplyDiscount] = useState(!!current?.discountType);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(current ? String(current.amount) : "");
      setDiscountType(current?.discountType || "FLAT_AMOUNT");
      setDiscountValue(current?.discountValue ? String(current.discountValue) : "");
      setApplyDiscount(!!current?.discountType);
    }
  }, [open, current]);

  async function handleSubmit() {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      toast.error("Enter a valid amount");
      return;
    }

    let numericDiscount: number | null = null;
    if (applyDiscount) {
      numericDiscount = parseFloat(discountValue);
      if (isNaN(numericDiscount) || numericDiscount < 0) {
        toast.error("Enter a valid discount value");
        return;
      }
      if (discountType === "PERCENTAGE" && numericDiscount > 100) {
        toast.error("Percentage discount cannot exceed 100");
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await upsertMiscFee({
        studentId,
        academicYearId,
        category,
        amount: numericAmount,
        discountType: applyDiscount ? discountType : null,
        discountValue: applyDiscount ? numericDiscount : null,
      });

      if (result.success) {
        toast.success(`${title} saved`);
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error || `Failed to save ${title}`);
      }
    } catch (error) {
      console.error(`Error saving ${title}:`, error);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {current ? `Edit ${title}` : `Set ${title}`}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{current ? `Edit ${title}` : `Set ${title}`}</DialogTitle>
          <DialogDescription>Set the amount and an optional discount for this student.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount (₹)</label>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 3000"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`apply-discount-${category}`}
              checked={applyDiscount}
              onChange={(e) => setApplyDiscount(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor={`apply-discount-${category}`} className="text-sm font-medium">
              Apply a discount
            </label>
          </div>

          {applyDiscount && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Type</label>
                <RadioGroup
                  value={discountType}
                  onValueChange={(val) => setDiscountType(val as DiscountType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FLAT_AMOUNT" id={`flat-${category}`} />
                    <label htmlFor={`flat-${category}`} className="text-sm">Flat Amount (₹)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PERCENTAGE" id={`pct-${category}`} />
                    <label htmlFor={`pct-${category}`} className="text-sm">Percentage (%)</label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {discountType === "PERCENTAGE" ? "Percentage" : "Amount (₹)"}
                </label>
                <Input
                  type="number"
                  min={0}
                  max={discountType === "PERCENTAGE" ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 500"}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecordMiscFeePaymentDialog({
  feeId,
  balance,
  title,
  onSuccess,
}: {
  feeId: string;
  balance: number;
  title: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [transactionId, setTransactionId] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const numericAmount = parseFloat(paidAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    setSubmitting(true);
    try {
      const result = await recordMiscFeePayment(feeId, {
        paidAmount: numericAmount,
        paymentDate: new Date(),
        paymentMethod,
        transactionId: transactionId || undefined,
        receiptNumber: receiptNumber || undefined,
      });

      if (result.success) {
        toast.success("Payment recorded");
        setOpen(false);
        setPaidAmount("");
        setTransactionId("");
        setReceiptNumber("");
        onSuccess();
      } else {
        toast.error(result.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={balance <= 0}>
          <Wallet className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record {title} Payment</DialogTitle>
          <DialogDescription>Outstanding balance: ₹{balance.toFixed(2)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount Paid (₹)</label>
            <Input
              type="number"
              min={0}
              max={balance}
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={`Up to ${balance.toFixed(2)}`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Transaction ID (optional)</label>
            <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Receipt Number (optional)</label>
            <Input value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MiscFeeCard({
  studentId,
  category,
  title,
}: {
  studentId: string;
  category: MiscFeeCategory;
  title: string;
}) {
  const [academicYear, setAcademicYear] = useState<{ id: string; name: string } | null>(null);
  const [fee, setFee] = useState<MiscFeeRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFee = useCallback(async (academicYearId: string) => {
    setLoading(true);
    try {
      const result = await getMiscFee(studentId, academicYearId, category);
      if (result.success) {
        setFee((result.data as MiscFeeRow | null) || null);
      } else {
        toast.error(result.error || `Failed to load ${title}`);
      }
    } catch (error) {
      console.error(`Error fetching ${title}:`, error);
      toast.error(`Failed to load ${title}`);
    } finally {
      setLoading(false);
    }
  }, [studentId, category, title]);

  const resolveAcademicYear = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCurrentStudentAcademicYear(studentId);
      if (result.success && result.data) {
        setAcademicYear(result.data);
        fetchFee(result.data.id);
      } else {
        if (!result.success) toast.error(result.error || `Failed to load ${title}`);
        setLoading(false);
      }
    } catch (error) {
      console.error(`Error resolving academic year for ${title}:`, error);
      toast.error(`Failed to load ${title}`);
      setLoading(false);
    }
  }, [studentId, title, fetchFee]);

  useEffect(() => {
    resolveAcademicYear();
  }, [resolveAcademicYear]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!academicYear) {
    return null;
  }

  const hasDiscount = !!fee && fee.discountAmount > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{academicYear.name}</CardDescription>
        </div>
        {fee && <Badge variant={hasDiscount ? "default" : "outline"}>{hasDiscount ? "Discount Active" : "No Discount"}</Badge>}
      </CardHeader>
      <CardContent className="space-y-4">
        {fee ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-semibold">₹{fee.amount.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Discount</p>
              <p className="font-semibold text-green-700">-₹{fee.discountAmount.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Net Payable</p>
              <p className="font-semibold">₹{fee.netAmount.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="font-semibold">₹{fee.paidAmount.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={`font-semibold ${fee.balance > 0 ? "text-red-600" : ""}`}>₹{fee.balance.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No {title.toLowerCase()} set for this student yet.</p>
        )}

        <div className="flex items-center gap-2">
          <EditMiscFeeDialog
            studentId={studentId}
            academicYearId={academicYear.id}
            category={category}
            title={title}
            current={fee}
            onSuccess={() => fetchFee(academicYear.id)}
          />
          {fee && (
            <RecordMiscFeePaymentDialog
              feeId={fee.id}
              balance={fee.balance}
              title={title}
              onSuccess={() => fetchFee(academicYear.id)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
