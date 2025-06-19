"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Building, DollarSign } from "lucide-react";
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
import { toast } from "react-hot-toast";
import { makePayment } from "@/lib/actions/student-fee-actions";
import { PaymentMethod } from "@prisma/client";

// Form schema
const paymentSchema = z.object({
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a valid number greater than 0",
  }),
  paymentMethod: z.enum([
    "CASH", "CHEQUE", "CREDIT_CARD", "DEBIT_CARD", 
    "BANK_TRANSFER", "ONLINE_PAYMENT", "SCHOLARSHIP"
  ]),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
});

interface PaymentFormProps {
  feeItemId: string;
  amount: number;
  feeName: string;
  onSuccess?: () => void;
}

export function PaymentForm({ feeItemId, amount, feeName, onSuccess }: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: amount.toString(),
      paymentMethod: "CREDIT_CARD",
      transactionId: "",
      remarks: "",
    },
  });
  
  // Handle form submission
  async function onSubmit(values: z.infer<typeof paymentSchema>) {
    setIsSubmitting(true);
    
    try {
      // Convert amount to number
      const paymentData = {
        ...values,
        amount: Number(values.amount),
      };
      
      const result = await makePayment(feeItemId, paymentData);
      
      if (result.success) {
        toast.success(result.message);
        form.reset();
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to process payment");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Get icon for payment method
  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case "CASH":
        return <DollarSign className="h-4 w-4" />;
      case "CREDIT_CARD":
      case "DEBIT_CARD":
        return <CreditCard className="h-4 w-4" />;
      case "BANK_TRANSFER":
      case "ONLINE_PAYMENT":
        return <Building className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-md mb-4 text-center">
          <h3 className="text-lg font-medium text-blue-800">Payment for {feeName}</h3>
          <p className="text-sm text-blue-600">Fee Amount: ${amount.toFixed(2)}</p>
        </div>
        
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input {...field} className="pl-8" />
                </div>
              </FormControl>
              <FormDescription>
                Enter the amount you wish to pay
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CREDIT_CARD">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Credit Card
                    </div>
                  </SelectItem>
                  <SelectItem value="DEBIT_CARD">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Debit Card
                    </div>
                  </SelectItem>
                  <SelectItem value="BANK_TRANSFER">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                  <SelectItem value="ONLINE_PAYMENT">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Online Payment
                    </div>
                  </SelectItem>
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
              <FormLabel>Transaction ID</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Enter the transaction ID from your payment receipt
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
                  placeholder="Any additional information about this payment"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Processing Payment..." : "Make Payment"}
        </Button>
      </form>
    </Form>
  );
}
