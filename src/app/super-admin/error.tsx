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
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-5 text-center px-4">
            <div className="rounded-full bg-red-50 border border-red-100 p-4">
                <AlertCircle className="h-9 w-9 text-red-500" />
            </div>
            <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
                <p className="text-sm text-gray-500 max-w-md">
                    {error.message || "An unexpected error occurred loading this page."}
                </p>
                {error.digest && (
                    <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
                )}
            </div>
            <div className="flex gap-3">
                <Button onClick={reset} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Try Again
                </Button>
                <Button asChild size="sm">
                    <Link href="/super-admin">
                        <Home className="h-4 w-4 mr-1.5" />
                        Dashboard
                    </Link>
                </Button>
            </div>
        </div>
    );
}
