import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { SubscriptionPlansManagement } from "@/components/super-admin/plans/subscription-plans-management";

export default async function PlansManagementPage() {
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
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-600">Manage subscription plans and pricing</p>
        </div>
        <SubscriptionPlansManagement />
      </div>
    </div>
  );
}