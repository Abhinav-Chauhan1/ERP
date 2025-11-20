"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentForm } from "@/components/parent/fees/payment-form";
import { PaymentGatewayModal } from "@/components/parent/fees/payment-gateway-modal";
import { getFeeOverview, createPayment, verifyPayment } from "@/lib/actions/parent-fee-actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface FeeItem {
  id: string;
  name: string;
  amount: number;
  dueDate: Date | null;
  status: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
  paidAmount: number;
  balance: number;
}

interface Child {
  id: string;
  name: string;
  class: string;
}

export default function MakePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get("childId");
  
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [feeStructureId, setFeeStructureId] = useState<string>("");
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Payment gateway modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);
  
  // Fetch children on mount
  useEffect(() => {
    fetchChildren();
  }, []);
  
  // Fetch fee overview when child changes
  useEffect(() => {
    if (selectedChildId) {
      fetchFeeOverview();
    }
  }, [selectedChildId]);
  
  const fetchChildren = async () => {
    try {
      const response = await fetch("/api/parent/children");
      if (response.ok) {
        const data = await response.json();
        
        // Map API response to expected format
        const mappedChildren = (data.children || []).map((child: any) => ({
          id: child.id,
          name: `${child.user.firstName} ${child.user.lastName}`,
          class: child.enrollments?.[0]?.class?.name || "N/A",
        }));
        
        setChildren(mappedChildren);
        
        // Set selected child
        if (childId && mappedChildren.find((c: Child) => c.id === childId)) {
          setSelectedChildId(childId);
        } else if (mappedChildren.length > 0) {
          setSelectedChildId(mappedChildren[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching children:", error);
      toast.error("Failed to load children");
    }
  };
  
  const fetchFeeOverview = async () => {
    if (!selectedChildId) return;
    
    setIsLoading(true);
    try {
      const result = await getFeeOverview({ childId: selectedChildId });
      
      if (result.success && result.data) {
        setFeeStructureId(result.data.feeStructureId || "");
        setFeeItems(result.data.feeItems);
      } else {
        toast.error(result.message || "Failed to load fee information");
      }
    } catch (error) {
      console.error("Error fetching fee overview:", error);
      toast.error("Failed to load fee information");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChildChange = (newChildId: string) => {
    setSelectedChildId(newChildId);
    router.push(`/parent/fees/payment?childId=${newChildId}`);
  };
  
  const handlePaymentSubmit = async (data: {
    feeTypeIds: string[];
    amount: number;
    paymentMethod: string;
    remarks?: string;
  }) => {
    if (!selectedChildId || !feeStructureId) {
      toast.error("Missing required information");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // If online payment, create payment order first
      if (data.paymentMethod === "ONLINE_PAYMENT") {
        // Create payment order via API
        const orderResponse = await fetch("/api/payments/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            childId: selectedChildId,
            feeStructureId,
            amount: data.amount,
            currency: "INR",
            feeTypeIds: data.feeTypeIds,
          }),
        });
        
        if (!orderResponse.ok) {
          throw new Error("Failed to create payment order");
        }
        
        const orderData = await orderResponse.json();
        
        if (!orderData.success || !orderData.orderId) {
          throw new Error(orderData.message || "Failed to create payment order");
        }
        
        // Store payment data for later verification
        setPendingPaymentData({
          ...data,
          childId: selectedChildId,
          feeStructureId,
        });
        
        // Show payment gateway modal
        setPaymentOrderId(orderData.orderId);
        setPaymentAmount(data.amount);
        setShowPaymentModal(true);
      } else {
        // For other payment methods, create payment directly
        const result = await createPayment({
          childId: selectedChildId,
          feeStructureId,
          amount: data.amount,
          paymentMethod: data.paymentMethod as any,
          feeTypeIds: data.feeTypeIds,
          remarks: data.remarks,
        });
        
        if (result.success) {
          toast.success("Payment recorded successfully");
          router.push(`/parent/fees/payment/success?receiptNumber=${result.data?.receiptNumber}`);
        } else {
          toast.error(result.message || "Failed to process payment");
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePaymentSuccess = async (paymentData: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) => {
    if (!pendingPaymentData) {
      toast.error("Payment data not found");
      return;
    }
    
    try {
      // Verify payment
      const result = await verifyPayment({
        orderId: paymentData.orderId,
        paymentId: paymentData.paymentId,
        signature: paymentData.signature,
        childId: pendingPaymentData.childId,
        feeStructureId: pendingPaymentData.feeStructureId,
        amount: pendingPaymentData.amount,
        feeTypeIds: pendingPaymentData.feeTypeIds,
      });
      
      if (result.success) {
        toast.success("Payment completed successfully");
        router.push(`/parent/fees/payment/success?receiptNumber=${result.data?.receiptNumber}`);
      } else {
        toast.error(result.message || "Payment verification failed");
        router.push("/parent/fees/payment/failed");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast.error("Payment verification failed");
      router.push("/parent/fees/payment/failed");
    }
  };
  
  const handlePaymentFailure = (error: string) => {
    toast.error(error || "Payment failed");
    setShowPaymentModal(false);
    router.push("/parent/fees/payment/failed");
  };
  
  const selectedChild = children.find(c => c.id === selectedChildId);
  
  if (isLoading) {
    return (
      <div className="h-full p-6 space-y-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  
  if (!selectedChild) {
    return (
      <div className="h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Make Payment</h1>
        <p className="text-gray-700">No children found in your account.</p>
      </div>
    );
  }
  
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link href="/parent/fees/overview">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Make Payment</h1>
          <p className="text-gray-600 mt-1">Pay pending fees securely</p>
        </div>
        
        {/* Child Selector */}
        {children.length > 1 && (
          <Select value={selectedChildId} onValueChange={handleChildChange}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name} - {child.class}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Payment Form */}
      <div className="max-w-3xl">
        <PaymentForm
          student={{
            id: selectedChild.id,
            name: selectedChild.name,
            class: selectedChild.class,
          }}
          feeStructureId={feeStructureId}
          feeItems={feeItems}
          onSubmit={handlePaymentSubmit}
          isLoading={isSubmitting}
        />
      </div>
      
      {/* Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderId={paymentOrderId}
        amount={paymentAmount}
        currency="INR"
        studentName={selectedChild.name}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
      />
    </div>
  );
}
