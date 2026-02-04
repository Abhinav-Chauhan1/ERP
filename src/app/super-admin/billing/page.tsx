import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingDashboard } from "@/components/super-admin/billing/billing-dashboard";
import { SubscriptionPlansManagement } from "@/components/super-admin/plans/subscription-plans-management";
import { InvoiceManagement } from "@/components/super-admin/billing/invoice-management";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Plans & Billing</h1>
        <p className="text-gray-400 mt-1">Manage subscription plans, invoices, and payment tracking</p>
      </div>

      {/* Billing Content */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]">
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="plans"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            Plans
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-6">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <BillingDashboard showAllSchools={true} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-6">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <SubscriptionPlansManagement />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-6">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <InvoiceManagement showAllSchools={true} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}