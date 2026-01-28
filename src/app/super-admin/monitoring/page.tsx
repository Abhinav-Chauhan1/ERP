import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { MonitoringDashboard } from "@/components/super-admin/monitoring/monitoring-dashboard";

export default async function MonitoringPage() {
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time system health, performance metrics, and alerts
          </p>
        </div>
      </div>

      <MonitoringDashboard />
    </div>
  );
}