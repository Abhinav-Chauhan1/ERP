"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Super admin error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
      <div className="rounded-full bg-red-500/10 p-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        <p className="text-gray-400 max-w-md">
          {error.message || "An unexpected error occurred loading this page."}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-600">Error ID: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button asChild>
          <Link href="/super-admin">
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
