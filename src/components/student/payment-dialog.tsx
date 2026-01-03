"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, DollarSign } from "lucide-react";
import { makePayment } from "@/lib/actions/student-fee-actions";
import toast from "react-hot-toast";

const paymentSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.enum([
    "CASH",
    "CHEQUE",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BANK_TRANSFER",
    "ONLINE_PAYMENT",
    "SCHOLARSHIP",
  ]),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  feeItems: any[];
  totalAmount: number;
  isPayAll: boolean;
  trigger: React.ReactNode;
}

export function PaymentDialog({
  feeItems,
  totalAmount,
  isPayAll,
  trigger,
}: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: totalAmount,
      paymentMethod: "CASH",
      transactionId: "",
      remarks: "",
    },
  });

  async function onSubmit(values: PaymentFormValues) {
    setLoading(true);
    try {
      // If paying all, we need to create multiple payment records
      if (isPayAll) {
        let successCount = 0;
        let failCount = 0;

        for (const feeItem of feeItems) {
          const result = await makePayment(feeItem.id, {
            amount: feeItem.amount,
            paymentMethod: values.paymentMethod,
            transactionId: values.transactionId,
            remarks: values.remarks,
          });

          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        }

        if (successCount > 0) {
          toast.success(
            `Successfully recorded ${successCount} payment(s)${
              failCount > 0 ? `. ${failCount} payment(s) failed.` : ""
            }`
          );
          setOpen(false);
          form.reset();
          router.refresh();
        } else {
          toast.error("Failed to record payments");
        }
      } else {
        // Single payment
        const result = await makePayment(feeItems[0].id, values);

        if (result.success) {
          toast.success(result.message || "Payment recorded successfully");
          setOpen(false);
          form.reset();
          router.refresh();
        } else {
          toast.error(result.message || "Failed to record payment");
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isPayAll ? "Pay All Fees" : "Make Payment"}
          </DialogTitle>
          <DialogDescription>
            {isPayAll
              ? `Record payment for ${feeItems.length} fee item(s)`
              : "Record your fee payment details"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Payment Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {isPayAll ? "Total Amount" : "Amount Due"}:
                </span>
                <span className="font-semibold">₹{totalAmount.toFixed(2)}</span>
              </div>
              {isPayAll && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee Items:</span>
                  <span className="font-semibold">{feeItems.length}</span>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    You can pay partial amount if needed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="ONLINE_PAYMENT">
                        Online Payment
                      </SelectItem>
                      <SelectItem value="SCHOLARSHIP">Scholarship</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ID (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter transaction/reference ID"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    For online payments, cheques, or bank transfers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Record Payment
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
