'use client';

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('session_expired') === 'true';

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      {sessionExpired && (
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Session Expired</AlertTitle>
          <AlertDescription>
            Your session has expired due to inactivity. Please sign in again to continue.
          </AlertDescription>
        </Alert>
      )}
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-slate-900 hover:bg-slate-700 text-sm normal-case",
          },
        }}
        routing="path"
        path="/login"
        signUpUrl="/register"
      />
    </div>
  );
}
