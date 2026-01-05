export const dynamic = 'force-dynamic';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  const userId = session?.user?.id;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="SikshaMitra" width={200} height={48} className="h-12 w-auto" />
          <span className="text-2xl font-bold">
            <span className="text-red-500">SIKSHA</span><span className="text-gray-900">MITRA</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {userId ? (
            <Button asChild>
              <Link href="/admin">Dashboard</Link>
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
        <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
          The Digital Partner of <span className="text-red-500">Modern Schools</span>
        </h1>
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
