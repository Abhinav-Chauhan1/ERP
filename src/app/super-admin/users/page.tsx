import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { UserManagementDashboard } from "@/components/super-admin/users/user-management-dashboard";

export default async function SuperAdminUsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  // Fetch initial data for the dashboard
  const [schools, userStats] = await Promise.all([
    // Get all schools for filtering
    db.school.findMany({
      select: {
        id: true,
        name: true,
        schoolCode: true,
        status: true,
      },
      orderBy: { name: 'asc' },
    }),
    
    // Get basic user statistics
    db.user.count(),
  ]);

  return (
    <div className="container mx-auto p-6">
      <UserManagementDashboard 
        schools={schools}
      />
    </div>
  );
}