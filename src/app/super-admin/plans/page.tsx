import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers } from "lucide-react";
import { SubscriptionPlansManagement } from "@/components/super-admin/plans/subscription-plans-management";

export default async function PlansManagementPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="h-6 w-6 text-red-500" />
          Subscription Plans
        </h1>
        <p className="text-gray-400 mt-1">Manage subscription plans and pricing tiers</p>
      </div>

      {/* Plans Management */}
      <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <CardHeader>
          <CardTitle className="text-white">Plan Management</CardTitle>
          <CardDescription className="text-gray-400">
            Create, edit, and manage subscription plans for schools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <SubscriptionPlansManagement />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}