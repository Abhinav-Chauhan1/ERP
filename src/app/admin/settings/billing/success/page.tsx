"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ArrowRight, RefreshCw } from "lucide-react";

type PaymentState = "verifying" | "success" | "pending" | "failed";

async function checkPaymentStatus(cfOrderId: string): Promise<{ state: PaymentState; planName?: string }> {
  const res = await fetch(`/api/subscription/verify?cfOrderId=${encodeURIComponent(cfOrderId)}`);
  if (!res.ok) return { state: "failed" };
  const data = await res.json();
  return {
    state: data.state as PaymentState,
    planName: data.planName,
  };
}

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cfOrderId = searchParams.get("cfOrderId") || "";
  const [state, setState] = useState<PaymentState>("verifying");
  const [planName, setPlanName] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!cfOrderId) { setState("failed"); return; }
    let cancelled = false;

    const verify = async () => {
      const result = await checkPaymentStatus(cfOrderId);
      if (cancelled) return;
      if (result.state === "pending" && attempts < 8) {
        // Webhook may not have fired yet — retry up to 8 times (24s total)
        setAttempts(a => a + 1);
        setTimeout(verify, 3000);
      } else {
        setState(result.state);
        if (result.planName) setPlanName(result.planName);
      }
    };

    verify();
    return () => { cancelled = true; };
  }, [cfOrderId, attempts]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-5">
          {state === "verifying" && (
            <>
              <Loader2 className="h-14 w-14 text-violet-500 animate-spin" />
              <div>
                <h2 className="text-xl font-semibold">Verifying Payment</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Please wait while we confirm your payment...
                </p>
              </div>
            </>
          )}

          {state === "pending" && (
            <>
              <Loader2 className="h-14 w-14 text-amber-500 animate-spin" />
              <div>
                <h2 className="text-xl font-semibold">Processing Payment</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your payment is being processed. This may take a few moments.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setAttempts(0)}>
                <RefreshCw className="h-4 w-4 mr-2" /> Check Again
              </Button>
            </>
          )}

          {state === "success" && (
            <>
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-emerald-700">Payment Successful!</h2>
                {planName && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Your <strong>{planName}</strong> subscription is now active.
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  All features for your plan have been unlocked.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <Button className="flex-1" onClick={() => router.push("/admin/settings/billing")}>
                  View Billing
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => router.push("/admin")}>
                  Dashboard <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {state === "failed" && (
            <>
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-9 w-9 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-red-700">Payment Not Confirmed</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We couldn&apos;t confirm your payment. If you were charged, your subscription
                  will activate automatically once the payment clears.
                </p>
                {cfOrderId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Order ID: <code className="font-mono bg-muted px-1 rounded">{cfOrderId}</code>
                  </p>
                )}
              </div>
              <div className="flex gap-3 w-full pt-2">
                <Button variant="outline" className="flex-1" onClick={() => router.push("/admin/settings/plan")}>
                  Try Again
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push("/admin/settings/billing")}>
                  Back to Billing
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
