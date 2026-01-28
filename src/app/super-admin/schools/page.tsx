import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { EnhancedSchoolManagement } from "@/components/super-admin/schools/enhanced-school-management";

export default async function SchoolsPage() {
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
          <h1 className="text-3xl font-bold">School Management</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Comprehensive school management with advanced filtering, bulk operations, and analytics
          </p>
        </div>
      </div>

      <EnhancedSchoolManagement />
    </div>
  );
}