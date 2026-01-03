import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { UserRole } from "@prisma/client"
import { TwoFactorManagement } from "@/components/shared/settings/two-factor-management"

export const metadata: Metadata = {
  title: "Two-Factor Authentication | Parent Portal",
  description: "Manage two-factor authentication for your account",
}

export default async function TwoFactorPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }
  
  if (session.user.role !== UserRole.PARENT) {
    redirect("/login")
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Two-Factor Authentication</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Add an extra layer of security to your account
        </p>
      </div>

      <TwoFactorManagement />
    </div>
  )
}
