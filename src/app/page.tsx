export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isSystemSetupRequired, isSetupRequired } from "@/lib/utils/setup-check";
import { getCurrentUserSchoolContext } from "@/lib/auth/tenant";

export const metadata: Metadata = {
  title: "SikshaMitra | The Digital Partner of Modern Schools",
  description: "A comprehensive ERP solution for educational institutions to manage students, teachers, classes, assessments, finances, and more.",
  openGraph: {
    title: "SikshaMitra | The Digital Partner of Modern Schools",
    description: "Comprehensive school management ERP — manage students, teachers, classes, assessments, and finances.",
    type: "website",
    siteName: "SikshaMitra",
  },
};

export default async function Home() {
  // Check if system setup is required (no schools exist)
  const systemSetupRequired = await isSystemSetupRequired();
  if (systemSetupRequired) {
    redirect("/setup");
  }

  const session = await auth();

  // If user is authenticated, check if their school needs setup
  if (session?.user?.id) {
    const context = await getCurrentUserSchoolContext();

    // If user has no school context and is not super admin, they need to select a school
    if (!context) {
      redirect("/select-school");
    }

    // If user is super admin, they can access the main app
    if (context.isSuperAdmin) {
      // Super admin can always access
    } else if (!context.schoolId) {
      // Regular user with no active school
      redirect("/select-school");
    } else {
      // Check if user's school needs setup
      const schoolSetupRequired = await isSetupRequired();
      if (schoolSetupRequired) {
        redirect("/setup");
      }
    }
  }

  const userId = session?.user?.id;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="SikshaMitra" width={200} height={48} className="h-24 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <Button asChild>
              <Link href={
                session.user.role === "SUPER_ADMIN" ? "/super-admin" :
                  session.user.role === "TEACHER" ? "/teacher" :
                    session.user.role === "STUDENT" ? "/student" :
                      session.user.role === "PARENT" ? "/parent" :
                        "/admin"
              }>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <h1 className="text-5xl font-bold sm:text-6xl md:text-7xl">
          <span className="text-red-500">SIKSHA</span><span className="text-gray-900">MITRA</span>
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 sm:text-3xl md:text-4xl">
          The Digital Partner of <span className="text-red-500">Modern Schools</span>
        </h2>
        <p className="max-w-2xl text-lg text-gray-600 sm:text-xl">
          A comprehensive ERP solution for educational institutions to manage students,
          teachers, classes, assessments, finances, and more.
        </p>
        <div className="flex gap-4">
          <Button size="lg" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
