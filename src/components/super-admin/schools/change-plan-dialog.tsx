"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PLAN_LIMITS, PLAN_FEATURES, calcMonthlyBill, type PlanType } from "@/lib/config/plan-features";
import { changeSchoolPlan } from "@/lib/actions/change-school-plan-action";

const PLANS: PlanType[] = ["STARTER", "GROWTH", "DOMINATE"];

const PLAN_COLORS: Record<PlanType, string> = {
  STARTER:  "border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10",
  GROWTH:   "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10",
  DOMINATE: "border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10",
};

const ACTIVE_COLORS: Record<PlanType, string> = {
  STARTER:  "border-blue-500 ring-2 ring-blue-500/30",
  GROWTH:   "border-emerald-500 ring-2 ring-emerald-500/30",
  DOMINATE: "border-purple-500 ring-2 ring-purple-500/30",
};

const FEATURE_LABELS: Record<string, string> = {
  library: "Library", transport: "Transport", admissions: "Admissions",
  bulk_messaging: "Bulk SMS", whatsapp: "WhatsApp", message_templates: "Msg Templates",
  payroll: "Payroll", budget: "Budget", finance_analytics: "Finance Analytics",
  advanced_reports: "Advanced Reports", id_cards: "ID Cards", certificates: "Certificates",
  hostel: "Hostel", alumni: "Alumni", audit_logs: "Audit Logs", lms: "LMS",
  study_tools: "Study Tools",
};

interface Props {
  schoolId: string;
  currentPlan: string;
  studentCount: number;
}

export function ChangePlanDialog({ schoolId, currentPlan, studentCount }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PlanType>(currentPlan as PlanType);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (selected === currentPlan) { setOpen(false); return; }
    startTransition(async () => {
      const result = await changeSchoolPlan(schoolId, selected);
      if (result.success) {
        toast.success(`Plan changed to ${selected}`);
        setOpen(false);
      } else {
        toast.error(result.error ?? "Failed to change plan");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Change Plan</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Change Plan</DialogTitle>
          <DialogDescription>
            Select a new plan for this school. The change takes effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {PLANS.map((plan) => {
            const limits = PLAN_LIMITS[plan];
            const features = PLAN_FEATURES[plan];
            const monthlyBill = calcMonthlyBill(plan, studentCount);
            const isSelected = selected === plan;
            const isCurrent = plan === currentPlan;

            return (
              <button
                key={plan}
                type="button"
                onClick={() => setSelected(plan)}
                className={`relative text-left border rounded-xl p-4 space-y-3 transition-all cursor-pointer
                  ${isSelected ? ACTIVE_COLORS[plan] : PLAN_COLORS[plan]}`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-3 text-xs bg-gray-600 text-white px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
                {isSelected && !isCurrent && (
                  <span className="absolute -top-2.5 right-3 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}

                <div>
                  <p className="font-bold text-base capitalize">{plan.toLowerCase()}</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{limits.pricePerStudent}
                    <span className="text-xs font-normal text-muted-foreground">/student/mo</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Min ₹{limits.minMonthly.toLocaleString("en-IN")}/mo</p>
                </div>

                <div className="text-xs bg-black/20 rounded p-2">
                  <span className="text-muted-foreground">Est. for {studentCount} students: </span>
                  <span className="font-semibold">₹{monthlyBill.toLocaleString("en-IN")}/mo</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div>{limits.storageGB} GB · {limits.sms === -1 ? "∞" : limits.sms} SMS</div>
                  {features.slice(0, 3).map(f => (
                    <div key={f} className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="h-3 w-3" /> {FEATURE_LABELS[f] ?? f}
                    </div>
                  ))}
                  {features.length > 3 && (
                    <div className="text-muted-foreground">+{features.length - 3} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selected !== currentPlan && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 mt-2">
            <span className="font-medium capitalize">{currentPlan.toLowerCase()}</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-medium capitalize">{selected.toLowerCase()}</span>
            <span className="ml-auto text-xs">
              Est. ₹{calcMonthlyBill(selected, studentCount).toLocaleString("en-IN")}/mo
            </span>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || selected === currentPlan}
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Changing…</>
            ) : (
              `Confirm — Switch to ${selected}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
