"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ArrowLeft, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPaymentConfig } from "@/lib/actions/paymentConfigActions";
import { PaymentConfigurationForm } from "@/components/admin/settings/payment-configuration-form";
import toast from "react-hot-toast";

export default function PaymentConfigurationPage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);

  const loadConfig = useCallback(async () => {
    try {
      const result = await getPaymentConfig();
      if (result.success && result.data) {
        setConfig(result.data);
      } else {
        toast.error(result.error || "Failed to load payment configuration");
      }
    } catch (error) {
      console.error("Error loading payment configuration:", error);
      toast.error("Failed to load payment configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load payment configuration</p>
        </div>
        <Link href="/admin/settings">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/admin/settings" className="hover:text-gray-900">
          Settings
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Payment Configuration</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin/settings">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                <h1 className="text-2xl font-bold tracking-tight">Payment Configuration</h1>
              </div>
              <p className="text-muted-foreground mt-1">
                Configure payment methods and receipt verification settings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <PaymentConfigurationForm initialData={config} />
    </div>
  );
}
