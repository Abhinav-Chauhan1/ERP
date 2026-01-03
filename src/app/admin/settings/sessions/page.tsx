import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { UserRole } from "@prisma/client"
import { SessionManagement } from "@/components/shared/settings/session-management"

export const metadata: Metadata = {
  title: "Session Management | Admin Portal",
  description: "Manage your active login sessions",
}

export default async function SessionManagementPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }
  
  if (session.user.role !== UserRole.ADMIN) {
    redirect("/login")
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Session Management</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          View and manage your active login sessions across devices
        </p>
      </div>

      <SessionManagement />
    </div>
  )
}
