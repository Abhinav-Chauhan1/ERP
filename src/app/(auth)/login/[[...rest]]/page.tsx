import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex justify-center p-6">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-slate-900 hover:bg-slate-700 text-sm normal-case",
          },
        }}
      />
    </div>
  );
}
