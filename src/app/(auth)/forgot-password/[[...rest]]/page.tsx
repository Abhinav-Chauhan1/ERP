import { SignIn } from "@clerk/nextjs";

export default function ForgotPasswordPage() {
  return (
    <div className="flex justify-center p-6">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-slate-900 hover:bg-slate-700 text-sm normal-case",
          },
        }}
        path="/forgot-password"
        routing="path"
        redirectUrl="/"
      />
    </div>
  );
}
