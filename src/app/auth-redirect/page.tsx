"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthRedirectPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10;

  useEffect(() => {
    const syncAndRedirect = async () => {
      try {
        // Call sync API
        const response = await fetch("/api/users/sync", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to sync user");
        }

        const user = await response.json();

        // Redirect based on role
        switch (user.role) {
          case "ADMIN":
            router.push("/admin");
            break;
          case "TEACHER":
            router.push("/teacher");
            break;
          case "STUDENT":
            router.push("/student");
            break;
          case "PARENT":
            router.push("/parent");
            break;
          default:
            router.push("/");
        }
      } catch (error) {
        console.error("Error syncing user:", error);
        
        // Retry logic
        if (attempts < maxAttempts) {
          setAttempts(prev => prev + 1);
          setTimeout(() => {
            syncAndRedirect();
          }, 1000); // Wait 1 second before retrying
        } else {
          setError("Failed to sync user. Please try logging in again.");
        }
      }
    };

    syncAndRedirect();
  }, [router, attempts]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <p className="text-gray-600">Setting up your account...</p>
        {attempts > 0 && (
          <p className="text-sm text-gray-500">Attempt {attempts + 1} of {maxAttempts}</p>
        )}
      </div>
    </div>
  );
}
