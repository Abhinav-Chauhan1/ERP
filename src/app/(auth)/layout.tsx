import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardUrl } from "@/lib/auth-utils"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already authenticated
  const session = await auth()

  // If user is already signed in, redirect to dashboard
  if (session?.user) {
    const redirectPath = getDashboardUrl(session.user.role)
    return redirect(redirectPath)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50">
      <div className="py-8">
        <div className="mx-auto text-center mb-2">
          <h1 className="text-2xl font-bold">SikshaMitra</h1>
          <p className="text-gray-500">Manage your school effectively</p>
        </div>
        {children}
      </div>
    </div>
  )
}
