"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, X } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  features: Record<string, any>;
  isActive: boolean;
}

interface PlanComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: SubscriptionPlan[];
  currentPlanId?: string;
  onSelectPlan?: (planId: string) => void;
}

export function PlanComparisonDialog({
  open,
  onOpenChange,
  plans,
  currentPlanId,
  onSelectPlan
}: PlanComparisonDialogProps) {
  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  const getFeatureValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? <CheckCircle className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />;
    }
    if (typeof value === 'string' && value.toLowerCase() === 'unlimited') {
      return <Badge variant="default" className="text-xs">Unlimited</Badge>;
    }
    return value;
  };

  const allFeatureKeys = Array.from(
    new Set(plans.flatMap(plan => Object.keys(plan.features)))
  );

  const getFeatureLabel = (key: string) => {
    const labels: Record<string, string> = {
      students: 'Max Students',
      teachers: 'Max Teachers',
      storage: 'Storage Space',
      whatsapp: 'WhatsApp Messages/Month',
      sms: 'SMS Messages/Month',
      support: 'Support Level',
      analytics: 'Advanced Analytics',
      api: 'API Access',
      customization: 'Custom Branding',
      backup: 'Automated Backups',
      integrations: 'Third-party Integrations'
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Subscription Plans</DialogTitle>
          <DialogDescription>
            Choose the best plan for your school's needs
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${currentPlanId === plan.id ? 'ring-2 ring-blue-500' : ''}`}>
              {currentPlanId === plan.id && (
                <Badge className="absolute -top-2 left-4 bg-blue-500">
                  Current Plan
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    {formatCurrency(plan.amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    per {plan.interval}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features List */}
                <div className="space-y-3">
                  {allFeatureKeys.map((featureKey) => (
                    <div key={featureKey} className="flex items-center justify-between">
                      <span className="text-sm">{getFeatureLabel(featureKey)}</span>
                      <div className="flex items-center">
                        {plan.features[featureKey] !== undefined ? (
                          getFeatureValue(plan.features[featureKey])
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {currentPlanId === plan.id ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => onSelectPlan?.(plan.id)}
                    >
                      {currentPlanId && plan.amount > plans.find(p => p.id === currentPlanId)?.amount! 
                        ? 'Upgrade to this Plan' 
                        : currentPlanId && plan.amount < plans.find(p => p.id === currentPlanId)?.amount!
                        ? 'Downgrade to this Plan'
                        : 'Select this Plan'
                      }
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Detailed Feature Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-3 text-left font-medium">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="border border-gray-200 p-3 text-center font-medium">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatureKeys.map((featureKey) => (
                  <tr key={featureKey}>
                    <td className="border border-gray-200 p-3 font-medium">
                      {getFeatureLabel(featureKey)}
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="border border-gray-200 p-3 text-center">
                        {plan.features[featureKey] !== undefined ? (
                          getFeatureValue(plan.features[featureKey])
                        ) : (
                          <X className="h-4 w-4 text-gray-400 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Plan changes take effect immediately with prorated billing</li>
            <li>• Downgrades will be applied at the end of the current billing period</li>
            <li>• All plans include 24/7 email support</li>
            <li>• Custom enterprise plans available on request</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}