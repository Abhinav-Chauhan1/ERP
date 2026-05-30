import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingDashboard } from "@/components/super-admin/billing/billing-dashboard";
import { InvoiceManagement } from "@/components/super-admin/billing/invoice-management";

export default function BillingPage() {
    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Billing</h1>
                <p className="text-sm text-gray-500 mt-0.5">Revenue overview, invoices, and payment tracking</p>
            </div>

            <Tabs defaultValue="overview">
                <TabsList className="bg-gray-100 p-1 rounded-lg h-auto">
                    <TabsTrigger value="overview" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Invoices
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-5">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                            <BillingDashboard showAllSchools={true} />
                        </Suspense>
                    </div>
                </TabsContent>

                <TabsContent value="invoices" className="mt-5">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                            <InvoiceManagement />
                        </Suspense>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
