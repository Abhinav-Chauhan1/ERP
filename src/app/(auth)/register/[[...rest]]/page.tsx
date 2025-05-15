import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="flex justify-center p-6">
      <SignUp
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
