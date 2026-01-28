import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { AuditLogViewer } from "@/components/super-admin/audit/audit-log-viewer";

export default async function AuditPage() {
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
          <h1 className="text-3xl font-bold">Audit & Compliance</h1>
          <p className="text-slate-600 dark:text-slate-400">
            View audit logs, compliance reports, and security events
          </p>
        </div>
      </div>

      <AuditLogViewer />
    </div>
  );
}