"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Users,
  Building2,
} from "lucide-react";
import { SubscriptionPlansManagement } from "./subscription-plans-management";
import { BillingDashboard } from "../billing/billing-dashboard";

interface BillingMetrics {
  metrics: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    activeSubscriptions: number;
    activeSchools: number;
  };
}

interface PlansAndBillingProps {
  initialBillingData?: BillingMetrics; // Changed from any
}

export function PlansAndBillingManagement({ initialBillingData }: PlansAndBillingProps) {
  const [billingMetrics, setBillingMetrics] = useState<BillingMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch billing metrics
  const fetchBillingMetrics = async () => {
    try {
      const response = await fetch("/api/super-admin/billing/metrics");
      if (response.ok) {
        const data = await response.json();
        setBillingMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch billing metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialBillingData) {
      setBillingMetrics(initialBillingData);
      setLoading(false);
    } else {
      fetchBillingMetrics();
    }
  }, [initialBillingData]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const metrics = billingMetrics?.metrics;

  return (
    <div className="space-y-6">
      {/* Billing Overview Cards */}
      {!loading && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    {metrics.totalRevenue
                      ? formatCurrency(metrics.totalRevenue)
                      : "₹0"}
                  </p>
                  <p className="text-green-200 text-xs mt-1">
                    All time revenue
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Monthly Revenue</p>
                  <p className="text-2xl font-bold">
                    {metrics.monthlyRecurringRevenue
                      ? formatCurrency(metrics.monthlyRecurringRevenue)
                      : "₹0"}
                  </p>
                  <p className="text-blue-200 text-xs mt-1">
                    MRR this month
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Active Subscriptions</p>
                  <p className="text-2xl font-bold">
                    {metrics.activeSubscriptions || 0}
                  </p>
                  <p className="text-purple-200 text-xs mt-1">
                    Current active plans
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Active Schools</p>
                  <p className="text-2xl font-bold">
                    {metrics.activeSchools || 0}
                  </p>
                  <p className="text-orange-200 text-xs mt-1">
                    Schools on platform
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="plans" className="w-full">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="billing">Billing & Invoices</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="space-y-4">
          <SubscriptionPlansManagement />
        </TabsContent>
        <TabsContent value="billing" className="space-y-4">
          <BillingDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}