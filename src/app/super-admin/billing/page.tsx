import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingDashboard } from "@/components/super-admin/billing/billing-dashboard";
import { SubscriptionManagement } from "@/components/super-admin/billing/subscription-management";
import { InvoiceManagement } from "@/components/super-admin/billing/invoice-management";

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    await requireSuperAdminAccess();
  } catch (error) {
    redirect("/");
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Billing & Subscriptions</h1>
        <p className="text-muted-foreground">
          Comprehensive billing management and subscription oversight
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <BillingDashboard showAllSchools={true} />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionManagement showAllSchools={true} />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceManagement showAllSchools={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}