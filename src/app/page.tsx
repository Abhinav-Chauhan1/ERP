export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">School ERP</h1>
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
          School Management Made <span className="text-blue-600">Simple</span>
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
