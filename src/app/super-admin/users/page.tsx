import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { UserManagementDashboard } from "@/components/super-admin/users/user-management-dashboard";

export default async function SuperAdminUsersPage() {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

    const schools = await db.school.findMany({
        select: { id: true, name: true, schoolCode: true, status: true },
        orderBy: { name: "asc" },
    });

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Users</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage users across all schools</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <UserManagementDashboard schools={schools} />
            </div>
        </div>
    );
}
